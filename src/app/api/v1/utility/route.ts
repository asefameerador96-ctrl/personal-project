import { NextRequest, NextResponse } from "next/server";
import { authenticateApiRequest } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase/server";
import { deductCredits } from "@/lib/ledger";
import { enqueueJob } from "@/lib/redis";
import type { ApiResponse, UtilityJob } from "@/types";
import { z } from "zod";

const CreateJobSchema = z.object({
  job_type: z.enum(["pdf_to_json", "csv_normalize", "invoice_parse", "bol_extract"]),
  input_ref: z.string().min(1),
});

export async function POST(request: NextRequest) {
  const auth = await authenticateApiRequest(request);
  if ("error" in auth) return auth.error;
  const { ctx } = auth;

  const body = await request.json();
  const parsed = CreateJobSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json<ApiResponse>(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }

  const supabase = await createServiceClient();
  const creditCost = 1;

  try {
    await deductCredits(
      ctx.tenantId,
      creditCost,
      "utility_job",
      "pending",
      `${parsed.data.job_type} job`
    );
  } catch {
    return NextResponse.json<ApiResponse>(
      { error: "Insufficient credits" },
      { status: 402 }
    );
  }

  const { data: job, error } = await supabase
    .from("utility_jobs")
    .insert({
      tenant_id: ctx.tenantId,
      job_type: parsed.data.job_type,
      input_ref: parsed.data.input_ref,
      credits_consumed: creditCost,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json<ApiResponse>(
      { error: "Failed to create job" },
      { status: 500 }
    );
  }

  await enqueueJob("utility", { jobId: job.id, tenantId: ctx.tenantId });

  const { data: tenant } = await supabase
    .from("tenants")
    .select("credits_remaining")
    .eq("id", ctx.tenantId)
    .single();

  return NextResponse.json<ApiResponse<UtilityJob>>({
    data: job,
    meta: {
      credits_consumed: creditCost,
      credits_remaining: tenant?.credits_remaining ?? 0,
    },
  });
}

export async function GET(request: NextRequest) {
  const auth = await authenticateApiRequest(request);
  if ("error" in auth) return auth.error;
  const { ctx } = auth;

  const supabase = await createServiceClient();
  const { searchParams } = new URL(request.url);
  const limit = Math.min(Number(searchParams.get("limit") || 50), 100);
  const status = searchParams.get("status");

  let query = supabase
    .from("utility_jobs")
    .select("*")
    .eq("tenant_id", ctx.tenantId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (status) query = query.eq("status", status);

  const { data, error } = await query;

  if (error) {
    return NextResponse.json<ApiResponse>(
      { error: "Failed to fetch jobs" },
      { status: 500 }
    );
  }

  return NextResponse.json<ApiResponse<UtilityJob[]>>({ data });
}
