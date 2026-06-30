import { NextRequest, NextResponse } from "next/server";
import { getDashboardAuth } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase/server";
import { recordAudit } from "@/lib/audit";
import { PLANS } from "@/types";
import type { ApiResponse, Plan } from "@/types";
import { randomBytes } from "crypto";

export async function GET(request: NextRequest) {
  const auth = await getDashboardAuth(request);
  if (!auth) {
    return NextResponse.json<ApiResponse>({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createServiceClient();

  const [membersRes, invitesRes] = await Promise.all([
    supabase
      .from("tenant_members")
      .select("id, user_id, role, created_at")
      .eq("tenant_id", auth.tenantId)
      .order("created_at", { ascending: true }),
    supabase
      .from("invitations")
      .select("id, email, role, expires_at, created_at")
      .eq("tenant_id", auth.tenantId)
      .is("accepted_at", null)
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false }),
  ]);

  const members = membersRes.data || [];

  const userIds = members.map((m) => m.user_id);
  const { data: users } = await supabase.auth.admin.listUsers();
  const userMap = new Map(
    (users?.users || []).map((u) => [u.id, { email: u.email, created_at: u.created_at }])
  );

  const enriched = members.map((m) => ({
    ...m,
    email: userMap.get(m.user_id)?.email || "unknown",
    user_created_at: userMap.get(m.user_id)?.created_at,
  }));

  return NextResponse.json<ApiResponse>({
    data: {
      members: enriched,
      pending_invitations: invitesRes.data || [],
    },
  });
}

export async function POST(request: NextRequest) {
  const auth = await getDashboardAuth(request);
  if (!auth || !["owner", "admin"].includes(auth.role)) {
    return NextResponse.json<ApiResponse>({ error: "Only owners and admins can invite" }, { status: 403 });
  }

  const body = await request.json();
  const email = (body.email as string)?.toLowerCase().trim();
  const role = body.role as string;

  if (!email || !email.includes("@")) {
    return NextResponse.json<ApiResponse>({ error: "Valid email required" }, { status: 400 });
  }

  if (!["admin", "member", "viewer"].includes(role)) {
    return NextResponse.json<ApiResponse>({ error: "Invalid role" }, { status: 400 });
  }

  const supabase = await createServiceClient();

  const { data: tenant } = await supabase
    .from("tenants")
    .select("plan")
    .eq("id", auth.tenantId)
    .single();

  const plan = PLANS[(tenant?.plan || "free") as Plan];

  if (plan.members_limit > 0) {
    const { count } = await supabase
      .from("tenant_members")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", auth.tenantId);

    if ((count || 0) >= plan.members_limit) {
      return NextResponse.json<ApiResponse>(
        { error: `Team limit reached (${plan.members_limit} members). Upgrade your plan.` },
        { status: 403 }
      );
    }
  }

  const { data: existing } = await supabase
    .from("invitations")
    .select("id")
    .eq("tenant_id", auth.tenantId)
    .eq("email", email)
    .is("accepted_at", null)
    .gt("expires_at", new Date().toISOString())
    .single();

  if (existing) {
    return NextResponse.json<ApiResponse>({ error: "Invitation already pending" }, { status: 409 });
  }

  const token = randomBytes(32).toString("base64url");

  const { data: invitation, error } = await supabase
    .from("invitations")
    .insert({
      tenant_id: auth.tenantId,
      email,
      role,
      invited_by: auth.userId,
      token,
    })
    .select("id, email, role, expires_at, created_at")
    .single();

  if (error) {
    return NextResponse.json<ApiResponse>({ error: "Failed to create invitation" }, { status: 500 });
  }

  await recordAudit({
    tenantId: auth.tenantId,
    actorId: auth.userId,
    action: "member.invited",
    resourceType: "invitation",
    resourceId: invitation.id,
    metadata: { email, role },
  });

  return NextResponse.json<ApiResponse>({ data: invitation });
}

export async function PATCH(request: NextRequest) {
  const auth = await getDashboardAuth(request);
  if (!auth || auth.role !== "owner") {
    return NextResponse.json<ApiResponse>({ error: "Only owners can change roles" }, { status: 403 });
  }

  const body = await request.json();
  const memberId = body.member_id as string;
  const newRole = body.role as string;

  if (!memberId || !["admin", "member", "viewer"].includes(newRole)) {
    return NextResponse.json<ApiResponse>({ error: "Invalid parameters" }, { status: 400 });
  }

  const supabase = await createServiceClient();

  const { data: member } = await supabase
    .from("tenant_members")
    .select("user_id, role")
    .eq("id", memberId)
    .eq("tenant_id", auth.tenantId)
    .single();

  if (!member) {
    return NextResponse.json<ApiResponse>({ error: "Member not found" }, { status: 404 });
  }

  if (member.user_id === auth.userId) {
    return NextResponse.json<ApiResponse>({ error: "Cannot change your own role" }, { status: 400 });
  }

  if (member.role === "owner") {
    return NextResponse.json<ApiResponse>({ error: "Cannot demote the owner" }, { status: 400 });
  }

  const { error } = await supabase
    .from("tenant_members")
    .update({ role: newRole })
    .eq("id", memberId);

  if (error) {
    return NextResponse.json<ApiResponse>({ error: "Failed to update role" }, { status: 500 });
  }

  await recordAudit({
    tenantId: auth.tenantId,
    actorId: auth.userId,
    action: "member.role_changed",
    resourceType: "tenant_member",
    resourceId: memberId,
    metadata: { old_role: member.role, new_role: newRole },
  });

  return NextResponse.json<ApiResponse>({ data: { updated: true } });
}

export async function DELETE(request: NextRequest) {
  const auth = await getDashboardAuth(request);
  if (!auth || !["owner", "admin"].includes(auth.role)) {
    return NextResponse.json<ApiResponse>({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const memberId = searchParams.get("member_id");
  const invitationId = searchParams.get("invitation_id");

  const supabase = await createServiceClient();

  if (invitationId) {
    await supabase
      .from("invitations")
      .delete()
      .eq("id", invitationId)
      .eq("tenant_id", auth.tenantId);

    return NextResponse.json<ApiResponse>({ data: { deleted: true } });
  }

  if (memberId) {
    const { data: member } = await supabase
      .from("tenant_members")
      .select("user_id, role")
      .eq("id", memberId)
      .eq("tenant_id", auth.tenantId)
      .single();

    if (!member) {
      return NextResponse.json<ApiResponse>({ error: "Member not found" }, { status: 404 });
    }

    if (member.role === "owner") {
      return NextResponse.json<ApiResponse>({ error: "Cannot remove the owner" }, { status: 400 });
    }

    if (member.user_id === auth.userId) {
      return NextResponse.json<ApiResponse>({ error: "Cannot remove yourself" }, { status: 400 });
    }

    await supabase
      .from("tenant_members")
      .delete()
      .eq("id", memberId);

    await recordAudit({
      tenantId: auth.tenantId,
      actorId: auth.userId,
      action: "member.removed",
      resourceType: "tenant_member",
      resourceId: memberId,
    });

    return NextResponse.json<ApiResponse>({ data: { removed: true } });
  }

  return NextResponse.json<ApiResponse>({ error: "Missing member_id or invitation_id" }, { status: 400 });
}
