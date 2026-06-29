import { NextRequest, NextResponse } from "next/server";
import { authenticateApiRequest } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase/server";
import { deductCredits } from "@/lib/ledger";
import type { ApiResponse, AgentWorkflow } from "@/types";
import { z } from "zod";

const CreateWorkflowSchema = z.object({
  workflow_type: z.enum([
    "invoice_reconciliation",
    "shipment_matching",
    "erp_sync",
    "customs_verification",
  ]),
  config: z.record(z.string(), z.unknown()).optional(),
  triggered_by: z.string().uuid().optional(),
});

export async function POST(request: NextRequest) {
  const auth = await authenticateApiRequest(request);
  if ("error" in auth) return auth.error;
  const { ctx } = auth;

  if (ctx.role === "viewer") {
    return NextResponse.json<ApiResponse>(
      { error: "Viewers cannot create workflows" },
      { status: 403 }
    );
  }

  const body = await request.json();
  const parsed = CreateWorkflowSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json<ApiResponse>(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }

  const supabase = await createServiceClient();
  const creditCost = 10;

  try {
    await deductCredits(
      ctx.tenantId,
      creditCost,
      "agent_workflow",
      "pending",
      `${parsed.data.workflow_type} workflow`
    );
  } catch {
    return NextResponse.json<ApiResponse>(
      { error: "Insufficient credits" },
      { status: 402 }
    );
  }

  const { data: workflow, error } = await supabase
    .from("agent_workflows")
    .insert({
      tenant_id: ctx.tenantId,
      workflow_type: parsed.data.workflow_type,
      state: parsed.data.config || {},
      credits_consumed: creditCost,
      triggered_by: parsed.data.triggered_by || null,
      status: "running",
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json<ApiResponse>(
      { error: "Failed to create workflow" },
      { status: 500 }
    );
  }

  // In production, this dispatches to a background worker
  // For now, create the initial step record
  await supabase.from("agent_steps").insert({
    workflow_id: workflow.id,
    step_index: 0,
    agent_name: "orchestrator",
    input: { workflow_type: parsed.data.workflow_type, config: parsed.data.config },
    status: "pending",
  });

  return NextResponse.json<ApiResponse<AgentWorkflow>>({
    data: workflow,
    meta: { credits_consumed: creditCost },
  });
}

export async function GET(request: NextRequest) {
  const auth = await authenticateApiRequest(request);
  if ("error" in auth) return auth.error;
  const { ctx } = auth;

  const supabase = await createServiceClient();
  const { searchParams } = new URL(request.url);
  const limit = Math.min(Number(searchParams.get("limit") || 20), 50);
  const status = searchParams.get("status");

  let query = supabase
    .from("agent_workflows")
    .select("*, agent_steps(*)")
    .eq("tenant_id", ctx.tenantId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (status) query = query.eq("status", status);

  const { data, error } = await query;

  if (error) {
    return NextResponse.json<ApiResponse>(
      { error: "Failed to fetch workflows" },
      { status: 500 }
    );
  }

  return NextResponse.json<ApiResponse>({ data });
}
