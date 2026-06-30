import { NextRequest, NextResponse } from "next/server";
import { getDashboardAuth } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase/server";
import { generateApiKey } from "@/lib/api-keys";
import { recordAudit } from "@/lib/audit";
import { PLANS } from "@/types";
import type { ApiResponse, Plan } from "@/types";

export async function GET(request: NextRequest) {
  const auth = await getDashboardAuth(request);
  if (!auth) {
    return NextResponse.json<ApiResponse>({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createServiceClient();
  const { data, error } = await supabase
    .from("api_keys")
    .select("id, name, key_prefix, scopes, rate_limit_rpm, last_used_at, expires_at, revoked_at, created_at")
    .eq("tenant_id", auth.tenantId)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json<ApiResponse>({ error: "Failed to fetch" }, { status: 500 });
  }

  return NextResponse.json<ApiResponse>({ data });
}

export async function POST(request: NextRequest) {
  const auth = await getDashboardAuth(request);
  if (!auth || !["owner", "admin"].includes(auth.role)) {
    return NextResponse.json<ApiResponse>({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const name = body.name as string;
  if (!name || name.length > 100) {
    return NextResponse.json<ApiResponse>({ error: "Name is required (max 100 chars)" }, { status: 400 });
  }

  const supabase = await createServiceClient();

  const { data: tenant } = await supabase
    .from("tenants")
    .select("plan")
    .eq("id", auth.tenantId)
    .single();

  const plan = PLANS[(tenant?.plan || "free") as Plan];

  const { count } = await supabase
    .from("api_keys")
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", auth.tenantId)
    .is("revoked_at", null);

  if ((count || 0) >= plan.api_keys_limit) {
    return NextResponse.json<ApiResponse>(
      { error: `Plan limit reached (${plan.api_keys_limit} keys). Upgrade to create more.` },
      { status: 403 }
    );
  }

  const { raw, prefix, hash } = generateApiKey();
  const scopes = body.scopes || ["utility", "agent", "ledger"];

  const { data: key, error } = await supabase
    .from("api_keys")
    .insert({
      tenant_id: auth.tenantId,
      name,
      key_prefix: prefix,
      key_hash: hash,
      scopes,
      rate_limit_rpm: plan.rate_limit_rpm,
      created_by: auth.userId,
      expires_at: body.expires_at || null,
    })
    .select("id, name, key_prefix, scopes, rate_limit_rpm, created_at")
    .single();

  if (error) {
    return NextResponse.json<ApiResponse>({ error: "Failed to create" }, { status: 500 });
  }

  await recordAudit({
    tenantId: auth.tenantId,
    actorId: auth.userId,
    action: "api_key.created",
    resourceType: "api_key",
    resourceId: key.id,
    metadata: { name, scopes },
  });

  return NextResponse.json<ApiResponse>({
    data: { ...key, raw_key: raw },
  });
}

export async function DELETE(request: NextRequest) {
  const auth = await getDashboardAuth(request);
  if (!auth || !["owner", "admin"].includes(auth.role)) {
    return NextResponse.json<ApiResponse>({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const keyId = searchParams.get("id");
  if (!keyId) {
    return NextResponse.json<ApiResponse>({ error: "Missing key id" }, { status: 400 });
  }

  const supabase = await createServiceClient();

  const { error } = await supabase
    .from("api_keys")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", keyId)
    .eq("tenant_id", auth.tenantId);

  if (error) {
    return NextResponse.json<ApiResponse>({ error: "Failed to revoke" }, { status: 500 });
  }

  await recordAudit({
    tenantId: auth.tenantId,
    actorId: auth.userId,
    action: "api_key.revoked",
    resourceType: "api_key",
    resourceId: keyId,
  });

  return NextResponse.json<ApiResponse>({ data: { revoked: true } });
}
