-- Phase 3: Health & Safety, Safer Recruitment evidence lifecycle, reports engine, and automations.

create table if not exists public.automation_rules (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  home_id uuid references public.homes(id) on delete set null,
  name text not null,
  trigger_event text not null,
  action_type text not null,
  rule_config jsonb not null default '{}'::jsonb,
  enabled boolean not null default true,
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.automation_events (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  home_id uuid references public.homes(id) on delete set null,
  event_type text not null,
  source_table text,
  source_id uuid,
  payload jsonb not null default '{}'::jsonb,
  processed boolean not null default false,
  processed_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.form_records
  add column if not exists due_at timestamptz,
  add column if not exists severity text,
  add column if not exists metadata jsonb not null default '{}'::jsonb;

alter table public.tasks
  add column if not exists automation_source text,
  add column if not exists automation_payload jsonb not null default '{}'::jsonb;

alter table public.recruitment_documents
  add column if not exists verification_status text not null default 'pending',
  add column if not exists verification_checklist jsonb not null default '[]'::jsonb,
  add column if not exists verification_notes text,
  add column if not exists verified_at timestamptz,
  add column if not exists verified_by uuid references public.users(id) on delete set null,
  add column if not exists verifier_method text;

alter table public.recruitment_verifications
  add column if not exists outcome text,
  add column if not exists decision_reason text,
  add column if not exists reviewed_by uuid references public.users(id) on delete set null,
  add column if not exists reviewed_at timestamptz,
  add column if not exists evidence_snapshot jsonb not null default '{}'::jsonb;

alter table public.report_templates
  add column if not exists category text,
  add column if not exists output_formats jsonb not null default '["pdf","print"]'::jsonb;

alter table public.reports
  add column if not exists date_range_start timestamptz,
  add column if not exists date_range_end timestamptz,
  add column if not exists filters jsonb not null default '{}'::jsonb,
  add column if not exists ai_summary text;

alter table public.report_exports
  add column if not exists metadata jsonb not null default '{}'::jsonb;

do $$
declare
  v_table text;
  v_table_list text[] := array['automation_rules', 'automation_events'];
  v_select_policy text;
  v_write_policy text;
begin
  foreach v_table in array v_table_list loop
    execute format('alter table public.%I enable row level security', v_table);

    v_select_policy := 'public.is_platform_admin() or public.is_org_member(organisation_id) or (home_id is not null and public.has_home_access(home_id))';
    v_write_policy := 'public.is_platform_admin() or public.is_org_member(organisation_id)';

    execute format('drop policy if exists p_%I_select on public.%I', v_table, v_table);
    execute format('drop policy if exists p_%I_insert on public.%I', v_table, v_table);
    execute format('drop policy if exists p_%I_update on public.%I', v_table, v_table);
    execute format('drop policy if exists p_%I_delete on public.%I', v_table, v_table);

    execute format('create policy p_%I_select on public.%I for select using (%s)', v_table, v_table, v_select_policy);
    execute format('create policy p_%I_insert on public.%I for insert with check (%s)', v_table, v_table, v_write_policy);
    execute format('create policy p_%I_update on public.%I for update using (%s) with check (%s)', v_table, v_table, v_write_policy, v_write_policy);
    execute format('create policy p_%I_delete on public.%I for delete using (%s)', v_table, v_table, v_write_policy);
  end loop;
end $$;

create index if not exists idx_form_records_due_at on public.form_records (organisation_id, home_id, due_at);
create index if not exists idx_recruitment_documents_verification_status on public.recruitment_documents (organisation_id, verification_status);
create index if not exists idx_tasks_automation_source on public.tasks (organisation_id, automation_source);
create index if not exists idx_automation_events_event_type on public.automation_events (organisation_id, event_type, created_at desc);
