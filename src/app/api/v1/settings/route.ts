import { NextRequest, NextResponse } from "next/server";
import { getDashboardAuth } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase/server";
import { recordAudit } from "@/lib/audit";
import type { ApiResponse } from "@/types";

export async function GET(request: NextRequest) {
  const auth = await getDashboardAuth(request);
  if (!auth) {
    return NextResponse.json<ApiResponse>({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createServiceClient();
  const { data: tenant } = await supabase
    .from("tenants")
    .select("id, name, slug, plan, credits_remaining, billing_email, logo_url, metadata, created_at")
    .eq("id", auth.tenantId)
    .single();

  if (!tenant) {
    return NextResponse.json<ApiResponse>({ error: "Tenant not found" }, { status: 404 });
  }

  return NextResponse.json<ApiResponse>({ data: { ...tenant, role: auth.role } });
}

export async function PATCH(request: NextRequest) {
  const auth = await getDashboardAuth(request);
  if (!auth || !["owner", "admin"].includes(auth.role)) {
    return NextResponse.json<ApiResponse>({ error: "Only owners/admins can edit settings" }, { status: 403 });
  }

  const body = await request.json();
  const updates: Record<string, unknown> = {};

  if (body.name && typeof body.name === "string" && body.name.length <= 100) {
    updates.name = body.name;
  }
  if (body.billing_email && typeof body.billing_email === "string") {
    updates.billing_email = body.billing_email;
  }
  if (body.logo_url !== undefined) {
    updates.logo_url = body.logo_url || null;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json<ApiResponse>({ error: "No valid fields to update" }, { status: 400 });
  }

  updates.updated_at = new Date().toISOString();

  const supabase = await createServiceClient();
  const { data, error } = await supabase
    .from("tenants")
    .update(updates)
    .eq("id", auth.tenantId)
    .select()
    .single();

  if (error) {
    return NextResponse.json<ApiResponse>({ error: "Failed to update" }, { status: 500 });
  }

  await recordAudit({
    tenantId: auth.tenantId,
    actorId: auth.userId,
    action: "settings.updated",
    resourceType: "tenant",
    resourceId: auth.tenantId,
    metadata: updates,
  });

  return NextResponse.json<ApiResponse>({ data });
}
