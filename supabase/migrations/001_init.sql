-- ============================================================
-- NEXUS UNIFIED SCHEMA — Multi-tenant, RLS-enforced
-- Layer 1: Utilities | Layer 2: Agents | Layer 3: Ledger
-- ============================================================

-- Tenants (organizations)
create table public.tenants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  plan text not null default 'free' check (plan in ('free', 'pro', 'enterprise')),
  credits_remaining bigint not null default 1000,
  metadata jsonb default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_tenants_slug on public.tenants (slug);

-- Tenant members (links auth.users → tenants)
create table public.tenant_members (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'admin', 'member', 'viewer')),
  created_at timestamptz not null default now(),
  unique (tenant_id, user_id)
);

create index idx_tenant_members_user on public.tenant_members (user_id);
create index idx_tenant_members_tenant on public.tenant_members (tenant_id);

-- ============================================================
-- LAYER 1: Utility Jobs (high-throughput, stateless)
-- ============================================================
create table public.utility_jobs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  job_type text not null,
  status text not null default 'pending' check (status in ('pending', 'processing', 'completed', 'failed')),
  input_ref text,
  output_ref text,
  credits_consumed integer not null default 0,
  error text,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create index idx_utility_jobs_tenant on public.utility_jobs (tenant_id, created_at desc);
create index idx_utility_jobs_status on public.utility_jobs (status) where status = 'pending';

-- ============================================================
-- LAYER 2: Agent Workflows (stateful, multi-step)
-- ============================================================
create table public.agent_workflows (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  workflow_type text not null,
  status text not null default 'idle' check (status in ('idle', 'running', 'paused', 'completed', 'failed')),
  state jsonb not null default '{}',
  steps_completed integer not null default 0,
  steps_total integer,
  credits_consumed integer not null default 0,
  triggered_by uuid references public.utility_jobs(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_agent_workflows_tenant on public.agent_workflows (tenant_id, created_at desc);

create table public.agent_steps (
  id uuid primary key default gen_random_uuid(),
  workflow_id uuid not null references public.agent_workflows(id) on delete cascade,
  step_index integer not null,
  agent_name text not null,
  input jsonb not null default '{}',
  output jsonb,
  status text not null default 'pending' check (status in ('pending', 'running', 'completed', 'failed')),
  duration_ms integer,
  created_at timestamptz not null default now()
);

create index idx_agent_steps_workflow on public.agent_steps (workflow_id, step_index);

-- ============================================================
-- LAYER 3: Ledger (immutable transaction log)
-- ============================================================
create table public.ledger_entries (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  entry_type text not null check (entry_type in ('credit_purchase', 'credit_deduction', 'fee', 'payout', 'refund')),
  amount_cents bigint not null,
  currency text not null default 'USD',
  credits_delta bigint not null default 0,
  reference_type text,
  reference_id uuid,
  description text,
  idempotency_key text unique,
  signature text not null,
  created_at timestamptz not null default now()
);

create index idx_ledger_tenant on public.ledger_entries (tenant_id, created_at desc);
create index idx_ledger_idempotency on public.ledger_entries (idempotency_key) where idempotency_key is not null;

-- Usage metrics (aggregated, for billing dashboards)
create table public.usage_metrics (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  period_start date not null,
  period_end date not null,
  utility_jobs_count integer not null default 0,
  agent_runs_count integer not null default 0,
  credits_consumed bigint not null default 0,
  volume_processed_bytes bigint not null default 0,
  unique (tenant_id, period_start, period_end)
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table public.tenants enable row level security;
alter table public.tenant_members enable row level security;
alter table public.utility_jobs enable row level security;
alter table public.agent_workflows enable row level security;
alter table public.agent_steps enable row level security;
alter table public.ledger_entries enable row level security;
alter table public.usage_metrics enable row level security;

-- Helper: get tenant IDs for current user
create or replace function public.get_user_tenant_ids()
returns setof uuid
language sql
security definer
stable
as $$
  select tenant_id from public.tenant_members where user_id = auth.uid();
$$;

-- Tenants: users see only their tenants
create policy "tenant_member_access" on public.tenants
  for all using (id in (select public.get_user_tenant_ids()));

-- Tenant members: see co-members
create policy "member_access" on public.tenant_members
  for all using (tenant_id in (select public.get_user_tenant_ids()));

-- Utility jobs: tenant-scoped
create policy "utility_tenant_access" on public.utility_jobs
  for all using (tenant_id in (select public.get_user_tenant_ids()));

-- Agent workflows: tenant-scoped
create policy "agent_tenant_access" on public.agent_workflows
  for all using (tenant_id in (select public.get_user_tenant_ids()));

-- Agent steps: via workflow tenant
create policy "steps_tenant_access" on public.agent_steps
  for all using (
    workflow_id in (
      select id from public.agent_workflows
      where tenant_id in (select public.get_user_tenant_ids())
    )
  );

-- Ledger: tenant-scoped, insert-only for non-service roles
create policy "ledger_tenant_read" on public.ledger_entries
  for select using (tenant_id in (select public.get_user_tenant_ids()));

-- Usage metrics: tenant-scoped
create policy "metrics_tenant_access" on public.usage_metrics
  for select using (tenant_id in (select public.get_user_tenant_ids()));
