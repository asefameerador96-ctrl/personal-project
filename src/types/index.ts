export type Plan = "free" | "pro" | "enterprise";
export type TenantRole = "owner" | "admin" | "member" | "viewer";
export type JobStatus = "pending" | "processing" | "completed" | "failed";
export type WorkflowStatus = "idle" | "running" | "paused" | "completed" | "failed";
export type LedgerEntryType = "credit_purchase" | "credit_deduction" | "fee" | "payout" | "refund";

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  plan: Plan;
  credits_remaining: number;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface TenantMember {
  id: string;
  tenant_id: string;
  user_id: string;
  role: TenantRole;
  created_at: string;
}

export interface UtilityJob {
  id: string;
  tenant_id: string;
  job_type: string;
  status: JobStatus;
  input_ref: string | null;
  output_ref: string | null;
  credits_consumed: number;
  error: string | null;
  created_at: string;
  completed_at: string | null;
}

export interface AgentWorkflow {
  id: string;
  tenant_id: string;
  workflow_type: string;
  status: WorkflowStatus;
  state: Record<string, unknown>;
  steps_completed: number;
  steps_total: number | null;
  credits_consumed: number;
  triggered_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface AgentStep {
  id: string;
  workflow_id: string;
  step_index: number;
  agent_name: string;
  input: Record<string, unknown>;
  output: Record<string, unknown> | null;
  status: JobStatus;
  duration_ms: number | null;
  created_at: string;
}

export interface LedgerEntry {
  id: string;
  tenant_id: string;
  entry_type: LedgerEntryType;
  amount_cents: number;
  currency: string;
  credits_delta: number;
  reference_type: string | null;
  reference_id: string | null;
  description: string | null;
  idempotency_key: string | null;
  signature: string;
  created_at: string;
}

export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  meta?: {
    credits_consumed?: number;
    credits_remaining?: number;
  };
}
