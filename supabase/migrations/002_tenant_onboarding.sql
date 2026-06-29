-- Auto-create tenant + membership when a new user signs up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  new_tenant_id uuid;
  org_name text;
  org_slug text;
begin
  org_name := coalesce(new.raw_user_meta_data->>'org_name', split_part(new.email, '@', 1));
  org_slug := lower(regexp_replace(org_name, '[^a-zA-Z0-9]+', '-', 'g'));
  -- Ensure slug uniqueness by appending random suffix
  org_slug := org_slug || '-' || substr(new.id::text, 1, 8);

  insert into public.tenants (name, slug)
  values (org_name, org_slug)
  returning id into new_tenant_id;

  insert into public.tenant_members (tenant_id, user_id, role)
  values (new_tenant_id, new.id, 'owner');

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Create storage bucket for file uploads
insert into storage.buckets (id, name, public)
values ('uploads', 'uploads', false)
on conflict (id) do nothing;

-- Storage policies: users can upload/read their own tenant's files
create policy "tenant_upload" on storage.objects
  for insert with check (
    bucket_id = 'uploads' and
    auth.uid() is not null
  );

create policy "tenant_read" on storage.objects
  for select using (
    bucket_id = 'uploads' and
    auth.uid() is not null
  );
