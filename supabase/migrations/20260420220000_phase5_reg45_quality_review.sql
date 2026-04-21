-- Phase 5: Regulation 45 Quality of Care Review module
-- Generated: 2026-04-20

create extension if not exists pgcrypto;

create table if not exists public.reg45_review_cycles (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  home_id uuid not null references public.homes(id) on delete cascade,
  cycle_title text not null,
  status text not null default 'planned',
  review_start_date date not null,
  review_end_date date not null,
  due_date date,
  finalised_at timestamptz,
  submitted_at timestamptz,
  archived_at timestamptz,
  archived_by uuid references public.users(id) on delete set null,
  created_by uuid references public.users(id) on delete set null,
  next_cycle_id uuid references public.reg45_review_cycles(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (review_end_date >= review_start_date),
  check (status in ('planned','evidence_gathering','in_review','drafting_report','awaiting_sign_off','finalised','submitted','archived'))
);

create table if not exists public.reg45_evidence_items (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  home_id uuid not null references public.homes(id) on delete cascade,
  cycle_id uuid not null references public.reg45_review_cycles(id) on delete cascade,
  title text not null,
  description text,
  category text not null,
  subcategory text,
  source_type text not null,
  evidence_date date,
  review_period_tag text,
  confidentiality_level text not null default 'standard',
  attachment_id uuid references public.attachments(id) on delete set null,
  linked_child_ids uuid[] not null default '{}'::uuid[],
  linked_staff_member_id uuid references public.users(id) on delete set null,
  linked_form_record_id uuid references public.form_records(id) on delete set null,
  linked_report_id uuid references public.generated_reports(id) on delete set null,
  verification_status text not null default 'uploaded',
  verification_notes text,
  rejection_reason text,
  viewed_by uuid references public.users(id) on delete set null,
  viewed_at timestamptz,
  verified_by uuid references public.users(id) on delete set null,
  verified_at timestamptz,
  rejected_by uuid references public.users(id) on delete set null,
  rejected_at timestamptz,
  uploaded_by uuid references public.users(id) on delete set null,
  uploaded_at timestamptz not null default now(),
  version_number integer not null default 1,
  archived_flag boolean not null default false,
  tags text[] not null default '{}'::text[],
  is_used_in_report boolean not null default false,
  is_consultation_evidence boolean not null default false,
  is_trend_evidence boolean not null default false,
  is_previous_action_evidence boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (confidentiality_level in ('standard','sensitive','restricted')),
  check (verification_status in ('uploaded','pending_review','viewed','verified','rejected','superseded','archived'))
);

create table if not exists public.reg45_findings (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  home_id uuid not null references public.homes(id) on delete cascade,
  cycle_id uuid not null references public.reg45_review_cycles(id) on delete cascade,
  section_code text not null,
  theme text not null,
  finding_title text not null,
  finding_narrative text not null,
  impact_on_children text,
  strength_or_weakness text not null default 'area_for_improvement',
  risk_level text not null default 'medium',
  evidence_strength text not null default 'moderate',
  quality_standard_tags text[] not null default '{}'::text[],
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (strength_or_weakness in ('strength','area_for_improvement')),
  check (risk_level in ('low','medium','high','critical')),
  check (evidence_strength in ('limited','moderate','strong'))
);

create table if not exists public.reg45_actions (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  home_id uuid not null references public.homes(id) on delete cascade,
  cycle_id uuid not null references public.reg45_review_cycles(id) on delete cascade,
  title text not null,
  rationale text,
  owner_user_id uuid references public.users(id) on delete set null,
  status text not null default 'open',
  priority text not null default 'medium',
  deadline date,
  review_date date,
  completed_at timestamptz,
  carried_forward_from_action_id uuid references public.reg45_actions(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (status in ('open','in_progress','blocked','completed','cancelled')),
  check (priority in ('low','medium','high','critical'))
);

create table if not exists public.reg45_consultation_entries (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  home_id uuid not null references public.homes(id) on delete cascade,
  cycle_id uuid not null references public.reg45_review_cycles(id) on delete cascade,
  consultation_group text not null,
  participant_name text,
  participant_role text,
  source_type text not null,
  consultation_date date,
  summary_text text not null,
  sentiment text,
  linked_evidence_item_id uuid references public.reg45_evidence_items(id) on delete set null,
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (consultation_group in ('children','parents','placing_authorities','staff','professionals','advocates')),
  check (sentiment in ('positive','mixed','negative','neutral') or sentiment is null)
);

create table if not exists public.reg45_report_versions (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  home_id uuid not null references public.homes(id) on delete cascade,
  cycle_id uuid not null references public.reg45_review_cycles(id) on delete cascade,
  version_number integer not null,
  status text not null default 'draft',
  report_title text not null,
  executive_summary text,
  methodology text,
  evaluative_summary text,
  report_payload jsonb not null default '{}'::jsonb,
  locked_at timestamptz,
  locked_by uuid references public.users(id) on delete set null,
  submitted_at timestamptz,
  submitted_by uuid references public.users(id) on delete set null,
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (cycle_id, version_number),
  check (status in ('draft','awaiting_sign_off','finalised','submitted','archived'))
);

create table if not exists public.reg45_report_sections (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  home_id uuid not null references public.homes(id) on delete cascade,
  report_version_id uuid not null references public.reg45_report_versions(id) on delete cascade,
  section_code text not null,
  section_title text not null,
  section_order integer not null default 0,
  enabled boolean not null default true,
  content text,
  aria_generated boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (report_version_id, section_code)
);

create table if not exists public.reg45_export_logs (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  home_id uuid not null references public.homes(id) on delete cascade,
  cycle_id uuid not null references public.reg45_review_cycles(id) on delete cascade,
  report_version_id uuid references public.reg45_report_versions(id) on delete set null,
  export_type text not null,
  included_items jsonb not null default '{}'::jsonb,
  generated_by uuid references public.users(id) on delete set null,
  generated_at timestamptz not null default now(),
  attachment_id uuid references public.attachments(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  check (export_type in ('final_report_pdf','evidence_index_pdf','evidence_register_csv','action_tracker_csv','consultation_appendix','inspection_ready_pack'))
);

create table if not exists public.reg45_theme_links (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  cycle_id uuid not null references public.reg45_review_cycles(id) on delete cascade,
  theme_code text not null,
  source_table text not null,
  source_id text not null,
  trend_direction text,
  created_at timestamptz not null default now(),
  check (trend_direction in ('improving','stable','worsening') or trend_direction is null)
);

create table if not exists public.reg45_evidence_links (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  cycle_id uuid not null references public.reg45_review_cycles(id) on delete cascade,
  evidence_item_id uuid not null references public.reg45_evidence_items(id) on delete cascade,
  finding_id uuid references public.reg45_findings(id) on delete cascade,
  action_id uuid references public.reg45_actions(id) on delete cascade,
  report_section_id uuid references public.reg45_report_sections(id) on delete cascade,
  relation_type text not null default 'supports',
  created_at timestamptz not null default now(),
  check (relation_type in ('supports','contradicts','context','required')),
  check (finding_id is not null or action_id is not null or report_section_id is not null)
);

create index if not exists idx_reg45_cycles_home_status on public.reg45_review_cycles(home_id, status, review_start_date desc);
create index if not exists idx_reg45_evidence_cycle_category on public.reg45_evidence_items(cycle_id, category, verification_status);
create index if not exists idx_reg45_findings_cycle_theme on public.reg45_findings(cycle_id, theme);
create index if not exists idx_reg45_actions_cycle_status on public.reg45_actions(cycle_id, status, deadline);
create index if not exists idx_reg45_consultation_cycle_group on public.reg45_consultation_entries(cycle_id, consultation_group);
create index if not exists idx_reg45_reports_cycle_version on public.reg45_report_versions(cycle_id, version_number desc);
create index if not exists idx_reg45_exports_cycle_date on public.reg45_export_logs(cycle_id, generated_at desc);
create index if not exists idx_reg45_links_cycle_evidence on public.reg45_evidence_links(cycle_id, evidence_item_id);

create or replace function public.reg45_schedule_next_cycle(p_cycle_id uuid, p_actor_id uuid)
returns uuid
language plpgsql
security definer
as $$
declare
  source_cycle public.reg45_review_cycles%rowtype;
  new_cycle_id uuid;
begin
  select * into source_cycle
  from public.reg45_review_cycles
  where id = p_cycle_id;

  if source_cycle.id is null then
    raise exception 'Cycle not found';
  end if;

  insert into public.reg45_review_cycles (
    organisation_id,
    home_id,
    cycle_title,
    status,
    review_start_date,
    review_end_date,
    due_date,
    created_by,
    metadata
  )
  values (
    source_cycle.organisation_id,
    source_cycle.home_id,
    coalesce(source_cycle.cycle_title, 'Regulation 45 Review') || ' (Next)',
    'planned',
    source_cycle.review_end_date + interval '1 day',
    source_cycle.review_end_date + interval '6 months',
    source_cycle.review_end_date + interval '6 months' + interval '14 days',
    p_actor_id,
    jsonb_build_object('auto_scheduled_from_cycle_id', source_cycle.id)
  )
  returning id into new_cycle_id;

  update public.reg45_review_cycles
  set next_cycle_id = new_cycle_id,
      updated_at = now()
  where id = p_cycle_id;

  return new_cycle_id;
end;
$$;

alter table public.reg45_review_cycles enable row level security;
alter table public.reg45_evidence_items enable row level security;
alter table public.reg45_findings enable row level security;
alter table public.reg45_actions enable row level security;
alter table public.reg45_consultation_entries enable row level security;
alter table public.reg45_report_versions enable row level security;
alter table public.reg45_report_sections enable row level security;
alter table public.reg45_export_logs enable row level security;
alter table public.reg45_theme_links enable row level security;
alter table public.reg45_evidence_links enable row level security;

create policy reg45_cycles_org_read on public.reg45_review_cycles
  for select using (organisation_id = public.current_organisation_id() and public.user_has_home_access(home_id));
create policy reg45_cycles_manager_write on public.reg45_review_cycles
  for all using (organisation_id = public.current_organisation_id() and public.is_platform_admin())
  with check (organisation_id = public.current_organisation_id() and public.is_platform_admin());

create policy reg45_evidence_org_read on public.reg45_evidence_items
  for select using (
    organisation_id = public.current_organisation_id()
    and public.user_has_home_access(home_id)
    and (confidentiality_level <> 'restricted' or public.is_platform_admin())
  );
create policy reg45_evidence_upload_write on public.reg45_evidence_items
  for insert with check (
    organisation_id = public.current_organisation_id() and public.user_has_home_access(home_id)
  );
create policy reg45_evidence_manager_update on public.reg45_evidence_items
  for update using (
    organisation_id = public.current_organisation_id() and public.user_has_home_access(home_id)
  ) with check (
    organisation_id = public.current_organisation_id() and public.user_has_home_access(home_id)
  );

create policy reg45_findings_org_read on public.reg45_findings
  for select using (organisation_id = public.current_organisation_id() and public.user_has_home_access(home_id));
create policy reg45_findings_manager_write on public.reg45_findings
  for all using (organisation_id = public.current_organisation_id() and public.is_platform_admin())
  with check (organisation_id = public.current_organisation_id() and public.is_platform_admin());

create policy reg45_actions_org_read on public.reg45_actions
  for select using (organisation_id = public.current_organisation_id() and public.user_has_home_access(home_id));
create policy reg45_actions_manager_write on public.reg45_actions
  for all using (organisation_id = public.current_organisation_id() and public.is_platform_admin())
  with check (organisation_id = public.current_organisation_id() and public.is_platform_admin());

create policy reg45_consultation_org_read on public.reg45_consultation_entries
  for select using (organisation_id = public.current_organisation_id() and public.user_has_home_access(home_id));
create policy reg45_consultation_write on public.reg45_consultation_entries
  for all using (organisation_id = public.current_organisation_id() and public.user_has_home_access(home_id))
  with check (organisation_id = public.current_organisation_id() and public.user_has_home_access(home_id));

create policy reg45_reports_org_read on public.reg45_report_versions
  for select using (organisation_id = public.current_organisation_id() and public.user_has_home_access(home_id));
create policy reg45_reports_manager_write on public.reg45_report_versions
  for all using (organisation_id = public.current_organisation_id() and public.is_platform_admin())
  with check (organisation_id = public.current_organisation_id() and public.is_platform_admin());

create policy reg45_report_sections_org_read on public.reg45_report_sections
  for select using (organisation_id = public.current_organisation_id() and public.user_has_home_access(home_id));
create policy reg45_report_sections_manager_write on public.reg45_report_sections
  for all using (organisation_id = public.current_organisation_id() and public.is_platform_admin())
  with check (organisation_id = public.current_organisation_id() and public.is_platform_admin());

create policy reg45_export_logs_org_read on public.reg45_export_logs
  for select using (organisation_id = public.current_organisation_id() and public.user_has_home_access(home_id));
create policy reg45_export_logs_manager_write on public.reg45_export_logs
  for all using (organisation_id = public.current_organisation_id() and public.is_platform_admin())
  with check (organisation_id = public.current_organisation_id() and public.is_platform_admin());

create policy reg45_theme_links_org_read on public.reg45_theme_links
  for select using (organisation_id = public.current_organisation_id());
create policy reg45_theme_links_manager_write on public.reg45_theme_links
  for all using (organisation_id = public.current_organisation_id() and public.is_platform_admin())
  with check (organisation_id = public.current_organisation_id() and public.is_platform_admin());

create policy reg45_evidence_links_org_read on public.reg45_evidence_links
  for select using (organisation_id = public.current_organisation_id());
create policy reg45_evidence_links_write on public.reg45_evidence_links
  for all using (organisation_id = public.current_organisation_id() and public.is_platform_admin())
  with check (organisation_id = public.current_organisation_id() and public.is_platform_admin());

insert into storage.buckets (id, name, public)
select 'reg45-evidence', 'reg45-evidence', false
where not exists (select 1 from storage.buckets where id = 'reg45-evidence');