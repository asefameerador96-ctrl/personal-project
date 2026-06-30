import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createServiceClient } from "@/lib/supabase/server";
import { recordLedgerEntry } from "@/lib/ledger";
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

const WORKFLOW_STEPS: Record<string, { agent: string; label: string }[]> = {
  invoice_reconciliation: [
    { agent: "document_ingester", label: "Ingesting documents" },
    { agent: "field_extractor", label: "Extracting invoice fields" },
    { agent: "po_matcher", label: "Matching against purchase orders" },
    { agent: "discrepancy_detector", label: "Flagging discrepancies" },
    { agent: "report_generator", label: "Generating reconciliation report" },
  ],
  shipment_matching: [
    { agent: "bol_parser", label: "Parsing bills of lading" },
    { agent: "inventory_lookup", label: "Looking up inventory records" },
    { agent: "quantity_validator", label: "Validating quantities" },
    { agent: "route_optimizer", label: "Optimizing shipping routes" },
  ],
  erp_sync: [
    { agent: "schema_mapper", label: "Mapping data schemas" },
    { agent: "conflict_resolver", label: "Resolving data conflicts" },
    { agent: "batch_writer", label: "Writing synchronized records" },
  ],
  customs_verification: [
    { agent: "declaration_parser", label: "Parsing customs declarations" },
    { agent: "tariff_lookup", label: "Looking up tariff codes" },
    { agent: "compliance_checker", label: "Checking trade regulations" },
    { agent: "risk_scorer", label: "Scoring compliance risk" },
    { agent: "certificate_validator", label: "Validating certificates of origin" },
    { agent: "report_generator", label: "Generating verification report" },
  ],
};

export async function GET(request: NextRequest) {
  const ctx = await getAuthContext(request);
  if (!ctx) {
    return NextResponse.json<ApiResponse>({ error: "Unauthorized" }, { status: 401 });
  }

  const serviceClient = await createServiceClient();
  const { data, error } = await serviceClient
    .from("agent_workflows")
    .select("*, agent_steps(*)")
    .eq("tenant_id", ctx.tenantId)
    .order("created_at", { ascending: false })
    .limit(20);

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

  const body = await request.json();
  const workflowType = body.workflow_type as string;
  const steps = WORKFLOW_STEPS[workflowType];
  if (!steps) {
    return NextResponse.json<ApiResponse>({ error: "Invalid workflow type" }, { status: 400 });
  }

  const serviceClient = await createServiceClient();
  const creditCost = 10;

  const { data: tenant } = await serviceClient
    .from("tenants")
    .select("credits_remaining")
    .eq("id", ctx.tenantId)
    .single();

  if (!tenant || tenant.credits_remaining < creditCost) {
    return NextResponse.json<ApiResponse>({ error: "Insufficient credits" }, { status: 402 });
  }

  const { data: workflow, error } = await serviceClient
    .from("agent_workflows")
    .insert({
      tenant_id: ctx.tenantId,
      workflow_type: workflowType,
      state: {},
      credits_consumed: creditCost,
      triggered_by: ctx.userId,
      status: "running",
      steps_completed: 0,
      steps_total: steps.length,
    })
    .select()
    .single();

  if (error || !workflow) {
    return NextResponse.json<ApiResponse>({ error: "Failed to create workflow" }, { status: 500 });
  }

  await serviceClient
    .from("tenants")
    .update({ credits_remaining: tenant.credits_remaining - creditCost })
    .eq("id", ctx.tenantId);

  await recordLedgerEntry({
    tenantId: ctx.tenantId,
    entryType: "credit_deduction",
    amountCents: 0,
    creditsDelta: -creditCost,
    referenceType: "agent_workflow",
    referenceId: workflow.id,
    description: `${workflowType} workflow`,
  });

  simulateWorkflow(workflow.id, workflowType, steps);

  return NextResponse.json<ApiResponse>({
    data: workflow,
    meta: { credits_consumed: creditCost, credits_remaining: tenant.credits_remaining - creditCost },
  });
}

async function simulateWorkflow(
  workflowId: string,
  workflowType: string,
  steps: { agent: string; label: string }[]
) {
  const serviceClient = await createServiceClient();

  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    const startTime = Date.now();

    await serviceClient.from("agent_steps").insert({
      workflow_id: workflowId,
      step_index: i,
      agent_name: step.agent,
      input: { task: step.label, workflow_type: workflowType },
      status: "processing",
    });

    await new Promise((r) => setTimeout(r, 800 + Math.floor(Math.random() * 1200)));

    const output = generateStepOutput(workflowType, step.agent, i);
    const duration = Date.now() - startTime;

    await serviceClient
      .from("agent_steps")
      .update({
        status: "completed",
        output,
        duration_ms: duration,
      })
      .eq("workflow_id", workflowId)
      .eq("step_index", i);

    await serviceClient
      .from("agent_workflows")
      .update({ steps_completed: i + 1 })
      .eq("id", workflowId);
  }

  await serviceClient
    .from("agent_workflows")
    .update({ status: "completed", updated_at: new Date().toISOString() })
    .eq("id", workflowId);
}

function generateStepOutput(
  workflowType: string,
  agentName: string,
  stepIndex: number
): Record<string, unknown> {
  const outputs: Record<string, Record<string, unknown>> = {
    document_ingester: { documents_found: 12, pages_processed: 47, format: "mixed" },
    field_extractor: { fields_extracted: 156, confidence_avg: 0.94, missing_fields: 3 },
    po_matcher: { matched: 10, unmatched: 2, match_rate: "83.3%" },
    discrepancy_detector: { discrepancies: 4, severity: { high: 1, medium: 2, low: 1 } },
    report_generator: { report_id: `RPT-${Date.now()}`, sections: 5, recommendations: 3 },
    bol_parser: { bills_parsed: 8, containers: 23, total_weight_kg: 45200 },
    inventory_lookup: { records_found: 8, warehouses_checked: 3, in_stock: 7 },
    quantity_validator: { validated: 7, quantity_mismatch: 1, tolerance_exceeded: 0 },
    route_optimizer: { routes_analyzed: 5, optimal_route: "SEA-SIN-DXB", savings_pct: 12 },
    schema_mapper: { source_fields: 45, target_fields: 38, mapped: 36, unmapped: 2 },
    conflict_resolver: { conflicts_found: 7, auto_resolved: 5, manual_review: 2 },
    batch_writer: { records_written: 234, duration_seconds: 3.2, errors: 0 },
    declaration_parser: { declarations: 6, line_items: 89, countries: ["BD", "IN", "CN"] },
    tariff_lookup: { codes_verified: 89, updates_found: 3, rate_changes: 1 },
    compliance_checker: { rules_checked: 156, violations: 2, warnings: 5 },
    risk_scorer: { overall_score: 0.23, risk_level: "low", factors: 12 },
    certificate_validator: { certificates: 6, valid: 5, expired: 1, renewal_needed: 1 },
  };

  return outputs[agentName] || { step: stepIndex, status: "completed", agent: agentName };
}
