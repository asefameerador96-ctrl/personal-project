import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createServiceClient } from "@/lib/supabase/server";
import type { ApiResponse } from "@/types";

async function getAuthContext(request: NextRequest) {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll() {},
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const serviceClient = await createServiceClient();
  const { data: membership } = await serviceClient
    .from("tenant_members")
    .select("tenant_id, role")
    .eq("user_id", user.id)
    .single();

  if (!membership) return null;

  return { userId: user.id, tenantId: membership.tenant_id, role: membership.role };
}

export async function GET(request: NextRequest) {
  const ctx = await getAuthContext(request);
  if (!ctx) {
    return NextResponse.json<ApiResponse>({ error: "Unauthorized" }, { status: 401 });
  }

  const serviceClient = await createServiceClient();
  const { data, error } = await serviceClient
    .from("ledger_entries")
    .select("id, entry_type, amount_cents, credits_delta, reference_type, description, created_at")
    .eq("tenant_id", ctx.tenantId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    return NextResponse.json<ApiResponse>({ error: "Failed to fetch" }, { status: 500 });
  }

  return NextResponse.json<ApiResponse>({ data });
}

export async function POST(request: NextRequest) {
  const ctx = await getAuthContext(request);
  if (!ctx) {
    return NextResponse.json<ApiResponse>({ error: "Unauthorized" }, { status: 401 });
  }

  const serviceClient = await createServiceClient();

  const { data: tenant } = await serviceClient
    .from("tenants")
    .select("credits_remaining, plan")
    .eq("id", ctx.tenantId)
    .single();

  if (!tenant) {
    return NextResponse.json<ApiResponse>({ error: "Tenant not found" }, { status: 404 });
  }

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { data: recentEntries } = await serviceClient
    .from("ledger_entries")
    .select("credits_delta, amount_cents")
    .eq("tenant_id", ctx.tenantId)
    .gte("created_at", thirtyDaysAgo.toISOString());

  const summary = {
    credits_remaining: tenant.credits_remaining,
    plan: tenant.plan,
    last_30_days: {
      total_entries: recentEntries?.length || 0,
      total_credits_used: recentEntries
        ? recentEntries.reduce(
            (sum, e) => sum + Math.abs(Math.min(0, e.credits_delta)),
            0
          )
        : 0,
      total_revenue_cents: recentEntries
        ? recentEntries.reduce((sum, e) => sum + e.amount_cents, 0)
        : 0,
    },
  };

  return NextResponse.json<ApiResponse>({ data: summary });
}
