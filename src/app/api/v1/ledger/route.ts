import { NextRequest, NextResponse } from "next/server";
import { authenticateApiRequest } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase/server";
import type { ApiResponse, LedgerEntry } from "@/types";

export async function GET(request: NextRequest) {
  const auth = await authenticateApiRequest(request);
  if ("error" in auth) return auth.error;
  const { ctx } = auth;

  const supabase = await createServiceClient();
  const { searchParams } = new URL(request.url);
  const limit = Math.min(Number(searchParams.get("limit") || 50), 200);
  const entryType = searchParams.get("type");
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  let query = supabase
    .from("ledger_entries")
    .select("*")
    .eq("tenant_id", ctx.tenantId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (entryType) query = query.eq("entry_type", entryType);
  if (from) query = query.gte("created_at", from);
  if (to) query = query.lte("created_at", to);

  const { data, error } = await query;

  if (error) {
    return NextResponse.json<ApiResponse>(
      { error: "Failed to fetch ledger" },
      { status: 500 }
    );
  }

  return NextResponse.json<ApiResponse<LedgerEntry[]>>({ data });
}

export async function POST(request: NextRequest) {
  const auth = await authenticateApiRequest(request);
  if ("error" in auth) return auth.error;
  const { ctx } = auth;

  if (ctx.role !== "owner" && ctx.role !== "admin") {
    return NextResponse.json<ApiResponse>(
      { error: "Only owners and admins can view usage summary" },
      { status: 403 }
    );
  }

  const supabase = await createServiceClient();

  const { data: tenant } = await supabase
    .from("tenants")
    .select("credits_remaining, plan")
    .eq("id", ctx.tenantId)
    .single();

  const { data: recentEntries } = await supabase
    .from("ledger_entries")
    .select("entry_type, amount_cents, credits_delta")
    .eq("tenant_id", ctx.tenantId)
    .gte("created_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
    .order("created_at", { ascending: false });

  const summary = {
    credits_remaining: tenant?.credits_remaining ?? 0,
    plan: tenant?.plan ?? "free",
    last_30_days: {
      total_entries: recentEntries?.length ?? 0,
      total_credits_used: recentEntries?.reduce(
        (sum, e) => sum + Math.abs(Math.min(e.credits_delta, 0)),
        0
      ) ?? 0,
      total_revenue_cents: recentEntries?.reduce(
        (sum, e) => sum + (e.entry_type === "fee" ? e.amount_cents : 0),
        0
      ) ?? 0,
    },
  };

  return NextResponse.json<ApiResponse>({ data: summary });
}
