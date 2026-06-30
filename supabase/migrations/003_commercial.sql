-- ============================================================
-- COMMERCIAL FEATURES — API Keys, Webhooks, Audit Log, Invites
-- ============================================================

-- API Keys (programmatic access for tenants)
create table public.api_keys (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  name text not null,
  key_prefix text not null,
  key_hash text not null,
  scopes text[] not null default '{"utility","agent","ledger"}',
  rate_limit_rpm integer not null default 60,
  last_used_at timestamptz,
  expires_at timestamptz,
  revoked_at timestamptz,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);

create index idx_api_keys_tenant on public.api_keys (tenant_id);
create index idx_api_keys_prefix on public.api_keys (key_prefix) where revoked_at is null;

-- Webhooks (event notifications)
create table public.webhooks (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  url text not null,
  events text[] not null default '{"job.completed","workflow.completed","credits.low"}',
  secret text not null,
  active boolean not null default true,
  failure_count integer not null default 0,
  last_triggered_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_webhooks_tenant on public.webhooks (tenant_id) where active = true;

-- Webhook delivery log
create table public.webhook_deliveries (
  id uuid primary key default gen_random_uuid(),
  webhook_id uuid not null references public.webhooks(id) on delete cascade,
  event_type text not null,
  payload jsonb not null,
  response_status integer,
  response_body text,
  duration_ms integer,
  success boolean not null default false,
  created_at timestamptz not null default now()
);

create index idx_webhook_deliveries_webhook on public.webhook_deliveries (webhook_id, created_at desc);

-- Audit log (who did what)
create table public.audit_log (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  actor_id uuid references auth.users(id),
  action text not null,
  resource_type text not null,
  resource_id uuid,
  metadata jsonb default '{}',
  ip_address text,
  created_at timestamptz not null default now()
);

create index idx_audit_log_tenant on public.audit_log (tenant_id, created_at desc);
create index idx_audit_log_actor on public.audit_log (actor_id, created_at desc);

-- Team invitations
create table public.invitations (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  email text not null,
  role text not null default 'member' check (role in ('admin', 'member', 'viewer')),
  invited_by uuid not null references auth.users(id),
  token text unique not null,
  accepted_at timestamptz,
  expires_at timestamptz not null default (now() + interval '7 days'),
  created_at timestamptz not null default now()
);

create index idx_invitations_token on public.invitations (token) where accepted_at is null;
create index idx_invitations_email on public.invitations (email) where accepted_at is null;

-- Extend tenants with commercial fields
alter table public.tenants add column if not exists billing_email text;
alter table public.tenants add column if not exists stripe_customer_id text;
alter table public.tenants add column if not exists logo_url text;
alter table public.tenants add column if not exists webhook_signing_secret text;

-- RLS for new tables
alter table public.api_keys enable row level security;
alter table public.webhooks enable row level security;
alter table public.webhook_deliveries enable row level security;
alter table public.audit_log enable row level security;
alter table public.invitations enable row level security;

create policy "api_keys_tenant_access" on public.api_keys
  for all using (tenant_id in (select public.get_user_tenant_ids()));

create policy "webhooks_tenant_access" on public.webhooks
  for all using (tenant_id in (select public.get_user_tenant_ids()));

create policy "webhook_deliveries_access" on public.webhook_deliveries
  for all using (
    webhook_id in (
      select id from public.webhooks
      where tenant_id in (select public.get_user_tenant_ids())
    )
  );

create policy "audit_log_tenant_access" on public.audit_log
  for select using (tenant_id in (select public.get_user_tenant_ids()));

create policy "invitations_tenant_access" on public.invitations
  for all using (tenant_id in (select public.get_user_tenant_ids()));
