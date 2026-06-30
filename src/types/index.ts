export type Plan = "free" | "pro" | "enterprise";
export type TenantRole = "owner" | "admin" | "member" | "viewer";
export type JobStatus = "pending" | "processing" | "completed" | "failed";
export type WorkflowStatus = "idle" | "running" | "paused" | "completed" | "failed";
export type LedgerEntryType = "credit_purchase" | "credit_deduction" | "fee" | "payout" | "refund";
export type WebhookEvent = "job.completed" | "workflow.completed" | "credits.low" | "member.joined" | "workflow.failed";

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  plan: Plan;
  credits_remaining: number;
  metadata: Record<string, unknown>;
  billing_email: string | null;
  stripe_customer_id: string | null;
  logo_url: string | null;
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

export interface ApiKey {
  id: string;
  tenant_id: string;
  name: string;
  key_prefix: string;
  key_hash: string;
  scopes: string[];
  rate_limit_rpm: number;
  last_used_at: string | null;
  expires_at: string | null;
  revoked_at: string | null;
  created_by: string;
  created_at: string;
}

export interface Webhook {
  id: string;
  tenant_id: string;
  url: string;
  events: WebhookEvent[];
  secret: string;
  active: boolean;
  failure_count: number;
  last_triggered_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface WebhookDelivery {
  id: string;
  webhook_id: string;
  event_type: string;
  payload: Record<string, unknown>;
  response_status: number | null;
  response_body: string | null;
  duration_ms: number | null;
  success: boolean;
  created_at: string;
}

export interface AuditLogEntry {
  id: string;
  tenant_id: string;
  actor_id: string | null;
  action: string;
  resource_type: string;
  resource_id: string | null;
  metadata: Record<string, unknown>;
  ip_address: string | null;
  created_at: string;
}

export interface Invitation {
  id: string;
  tenant_id: string;
  email: string;
  role: TenantRole;
  invited_by: string;
  token: string;
  accepted_at: string | null;
  expires_at: string;
  created_at: string;
}

export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  meta?: {
    credits_consumed?: number;
    credits_remaining?: number;
    page?: number;
    per_page?: number;
    total?: number;
  };
}

export interface PlanConfig {
  name: Plan;
  display: string;
  credits: number;
  price_monthly: number;
  api_keys_limit: number;
  members_limit: number;
  webhooks_limit: number;
  rate_limit_rpm: number;
  features: string[];
}

export const PLANS: Record<Plan, PlanConfig> = {
  free: {
    name: "free",
    display: "Free",
    credits: 1000,
    price_monthly: 0,
    api_keys_limit: 2,
    members_limit: 3,
    webhooks_limit: 1,
    rate_limit_rpm: 30,
    features: [
      "1,000 credits/month",
      "PDF & CSV parsing",
      "3 team members",
      "2 API keys",
      "Community support",
    ],
  },
  pro: {
    name: "pro",
    display: "Pro",
    credits: 25000,
    price_monthly: 4900,
    api_keys_limit: 10,
    members_limit: 20,
    webhooks_limit: 5,
    rate_limit_rpm: 120,
    features: [
      "25,000 credits/month",
      "All document formats",
      "Agent workflows",
      "20 team members",
      "10 API keys",
      "5 webhooks",
      "Priority support",
    ],
  },
  enterprise: {
    name: "enterprise",
    display: "Enterprise",
    credits: 500000,
    price_monthly: 49900,
    api_keys_limit: 100,
    members_limit: -1,
    webhooks_limit: 50,
    rate_limit_rpm: 1000,
    features: [
      "500,000 credits/month",
      "Unlimited members",
      "100 API keys",
      "50 webhooks",
      "Custom integrations",
      "SLA guarantee",
      "Dedicated support",
    ],
  },
};
