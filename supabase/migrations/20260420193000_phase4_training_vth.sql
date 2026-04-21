-- Phase 4: Training matrix automation + Vocational Training Hub integration
-- Generated: 2026-04-20

create extension if not exists pgcrypto;

-- ============================================================================
-- Provider metadata enrichment
-- ============================================================================

alter table if exists public.integration_providers
  add column if not exists supports_webhooks boolean not null default false,
  add column if not exists supports_polling boolean not null default true,
  add column if not exists supports_import boolean not null default false;

alter table if exists public.integration_connections
  add column if not exists provider_name text,
  add column if not exists provider_code text,
  add column if not exists polling_enabled boolean not null default false,
  add column if not exists polling_interval_minutes integer not null default 30,
  add column if not exists last_successful_sync_at timestamptz,
  add column if not exists last_sync_status text,
  add column if not exists warning_window_days integer not null default 30,
  add column if not exists certificate_sync_enabled boolean not null default true,
  add column if not exists course_catalog_sync_enabled boolean not null default true;

-- ============================================================================
-- Training domain table hardening
-- ============================================================================

create table if not exists public.staff_training_profiles (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  home_id uuid references public.homes(id) on delete set null,
  staff_member_id uuid not null references public.users(id) on delete cascade,
  provider_learner_id text,
  provider_name text,
  external_status text,
  compliance_summary jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organisation_id, staff_member_id)
);

create table if not exists public.training_courses (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  provider_course_id text not null,
  provider_name text not null,
  course_title text not null,
  course_category text,
  mandatory_flag boolean not null default false,
  accreditation text,
  cpd_hours numeric,
  valid_for_days integer,
  valid_for_months integer,
  certificate_available boolean not null default false,
  direct_course_url text,
  archived_flag boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organisation_id, provider_name, provider_course_id)
);

create table if not exists public.training_course_versions (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  course_id uuid not null references public.training_courses(id) on delete cascade,
  version_code text,
  version_label text,
  is_current boolean not null default true,
  schema jsonb not null default '{}'::jsonb,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.training_assignments (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  home_id uuid references public.homes(id) on delete set null,
  staff_member_id uuid not null references public.users(id) on delete cascade,
  course_id uuid not null references public.training_courses(id) on delete cascade,
  assigned_by uuid references public.users(id) on delete set null,
  assigned_at timestamptz not null default now(),
  due_date timestamptz,
  status text not null default 'assigned',
  provider_assignment_id text,
  provider_learner_id text,
  direct_course_url text,
  last_provider_sync_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organisation_id, staff_member_id, course_id)
);

create table if not exists public.training_completions (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  home_id uuid references public.homes(id) on delete set null,
  staff_member_id uuid not null references public.users(id) on delete cascade,
  course_id uuid not null references public.training_courses(id) on delete cascade,
  completed_at timestamptz,
  completion_status text not null default 'completed',
  score numeric,
  certificate_url text,
  certificate_file_id uuid references public.attachments(id) on delete set null,
  expires_at timestamptz,
  renewal_due_at timestamptz,
  provider_completion_id text,
  synced_at timestamptz,
  source text not null default 'api',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organisation_id, provider_completion_id)
);

create table if not exists public.training_certificates (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  home_id uuid references public.homes(id) on delete set null,
  staff_member_id uuid not null references public.users(id) on delete cascade,
  course_id uuid not null references public.training_courses(id) on delete cascade,
  certificate_url text,
  certificate_file_id uuid references public.attachments(id) on delete set null,
  status text not null default 'missing',
  issued_at timestamptz,
  expires_at timestamptz,
  provider_certificate_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organisation_id, staff_member_id, course_id)
);

create table if not exists public.training_matrix_rows (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  staff_member_id uuid not null references public.users(id) on delete cascade,
  course_id uuid not null references public.training_courses(id) on delete cascade,
  home_id uuid references public.homes(id) on delete set null,
  role_id text,
  requirement_type text not null default 'mandatory',
  assigned_status text not null default 'assigned',
  completion_status text not null default 'assigned',
  completed_at timestamptz,
  expires_at timestamptz,
  due_date timestamptz,
  days_until_due integer,
  compliance_status text not null default 'incomplete',
  direct_course_url text,
  certificate_status text not null default 'missing',
  last_synced_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organisation_id, staff_member_id, course_id, home_id)
);

create table if not exists public.training_requirements (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  home_id uuid references public.homes(id) on delete set null,
  course_id uuid not null references public.training_courses(id) on delete cascade,
  requirement_type text not null default 'mandatory',
  warning_window_days integer not null default 30,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.training_role_requirements (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  role_code text not null,
  requirement_id uuid not null references public.training_requirements(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (organisation_id, role_code, requirement_id)
);

create table if not exists public.training_notifications (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  home_id uuid references public.homes(id) on delete set null,
  user_id uuid not null references public.users(id) on delete cascade,
  notification_type text not null,
  title text not null,
  message text,
  metadata jsonb not null default '{}'::jsonb,
  sent_via_in_app boolean not null default true,
  sent_via_email boolean not null default false,
  sent_at timestamptz,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.training_provider_links (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  home_id uuid references public.homes(id) on delete set null,
  staff_member_id uuid references public.users(id) on delete set null,
  course_id uuid references public.training_courses(id) on delete set null,
  provider_name text not null,
  link_url text not null,
  click_count integer not null default 0,
  last_clicked_at timestamptz,
  last_clicked_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organisation_id, staff_member_id, course_id, provider_name)
);

create table if not exists public.training_sync_events (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  home_id uuid references public.homes(id) on delete set null,
  connection_id uuid references public.integration_connections(id) on delete set null,
  provider_event_type text,
  provider_event_id text,
  payload jsonb not null default '{}'::jsonb,
  records_processed integer not null default 0,
  status text not null default 'processed',
  error_message text,
  processed_at timestamptz,
  created_at timestamptz not null default now()
);

-- ============================================================================
-- Patch training tables (created by earlier migration without VTH columns)
-- ============================================================================
alter table public.training_courses
  add column if not exists provider_course_id text,
  add column if not exists provider_name text,
  add column if not exists course_title text,
  add column if not exists course_category text,
  add column if not exists mandatory_flag boolean not null default false,
  add column if not exists accreditation text,
  add column if not exists cpd_hours numeric,
  add column if not exists valid_for_days integer,
  add column if not exists valid_for_months integer,
  add column if not exists certificate_available boolean not null default false,
  add column if not exists direct_course_url text,
  add column if not exists archived_flag boolean not null default false;

alter table public.training_assignments
  add column if not exists staff_member_id uuid references public.users(id) on delete cascade,
  add column if not exists due_date timestamptz,
  add column if not exists provider_assignment_id text,
  add column if not exists provider_learner_id text,
  add column if not exists direct_course_url text,
  add column if not exists last_provider_sync_at timestamptz;

alter table public.training_completions
  add column if not exists staff_member_id uuid references public.users(id) on delete cascade,
  add column if not exists completion_status text not null default 'completed',
  add column if not exists certificate_url text,
  add column if not exists expires_at timestamptz,
  add column if not exists renewal_due_at timestamptz,
  add column if not exists provider_completion_id text,
  add column if not exists synced_at timestamptz,
  add column if not exists source text not null default 'api';

alter table public.training_matrix_rows
  add column if not exists staff_member_id uuid references public.users(id) on delete cascade,
  add column if not exists course_id uuid references public.training_courses(id) on delete cascade,
  add column if not exists role_id text,
  add column if not exists requirement_type text not null default 'mandatory',
  add column if not exists assigned_status text not null default 'assigned',
  add column if not exists completion_status text not null default 'assigned',
  add column if not exists completed_at timestamptz,
  add column if not exists expires_at timestamptz,
  add column if not exists due_date timestamptz,
  add column if not exists days_until_due integer,
  add column if not exists compliance_status text not null default 'incomplete',
  add column if not exists direct_course_url text,
  add column if not exists certificate_status text not null default 'missing',
  add column if not exists last_synced_at timestamptz;

alter table public.training_sync_events
  add column if not exists connection_id uuid references public.integration_connections(id) on delete set null,
  add column if not exists provider_event_type text,
  add column if not exists provider_event_id text,
  add column if not exists records_processed integer not null default 0,
  add column if not exists error_message text,
  add column if not exists processed_at timestamptz,
  add column if not exists created_at timestamptz not null default now();

alter table public.training_provider_links
  add column if not exists staff_member_id uuid references public.users(id) on delete set null,
  add column if not exists provider_name text,
  add column if not exists link_url text,
  add column if not exists click_count integer not null default 0,
  add column if not exists last_clicked_at timestamptz,
  add column if not exists last_clicked_by uuid references public.users(id) on delete set null;

alter table public.training_certificates
  add column if not exists staff_member_id uuid references public.users(id) on delete cascade,
  add column if not exists course_id uuid references public.training_courses(id) on delete cascade,
  add column if not exists certificate_url text,
  add column if not exists certificate_file_id uuid references public.attachments(id) on delete set null,
  add column if not exists status text not null default 'missing',
  add column if not exists provider_certificate_id text;

-- ============================================================================
-- Indexes
-- ============================================================================

create index if not exists idx_training_courses_provider on public.training_courses(provider_name, provider_course_id);
create index if not exists idx_training_assignments_staff_due on public.training_assignments(staff_member_id, due_date);
create index if not exists idx_training_completions_staff on public.training_completions(staff_member_id, completed_at);
create index if not exists idx_training_matrix_status on public.training_matrix_rows(compliance_status, completion_status);
create index if not exists idx_training_matrix_home on public.training_matrix_rows(home_id, compliance_status);
create index if not exists idx_training_notifications_user on public.training_notifications(user_id, created_at desc);
create index if not exists idx_training_sync_events_connection on public.training_sync_events(connection_id, created_at desc);
create index if not exists idx_integration_sync_logs_connection on public.integration_sync_logs(connection_id, started_at desc);
create index if not exists idx_integration_error_logs_connection on public.integration_error_logs(connection_id, created_at desc);

-- ============================================================================
-- Utility functions for RLS context
-- ============================================================================

create or replace function public.current_organisation_id()
returns uuid
language sql
stable
as $$
  select u.organisation_id
  from public.users u
  where u.id = auth.uid()
  limit 1;
$$;

create or replace function public.user_has_home_access(target_home uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.home_assignments ha
    where ha.user_id = auth.uid()
      and ha.home_id = target_home
      and (ha.ends_at is null or ha.ends_at > now())
  )
  or public.is_platform_admin();
$$;

create or replace function public.increment_training_link_click(
  p_organisation_id uuid,
  p_staff_member_id uuid,
  p_course_id uuid,
  p_provider_name text
)
returns void
language sql
security definer
as $$
  update public.training_provider_links
  set
    click_count = click_count + 1,
    last_clicked_at = now(),
    updated_at = now()
  where organisation_id = p_organisation_id
    and staff_member_id = p_staff_member_id
    and (
      (course_id is null and p_course_id is null)
      or course_id = p_course_id
    )
    and provider_name = p_provider_name;
$$;

-- ============================================================================
-- RLS Policies
-- ============================================================================

alter table public.staff_training_profiles enable row level security;
alter table public.training_courses enable row level security;
alter table public.training_course_versions enable row level security;
alter table public.training_assignments enable row level security;
alter table public.training_completions enable row level security;
alter table public.training_certificates enable row level security;
alter table public.training_matrix_rows enable row level security;
alter table public.training_requirements enable row level security;
alter table public.training_role_requirements enable row level security;
alter table public.training_notifications enable row level security;
alter table public.training_provider_links enable row level security;
alter table public.training_sync_events enable row level security;

-- Shared read access by org and home scope
create policy training_profiles_org_read on public.staff_training_profiles
  for select using (
    organisation_id = public.current_organisation_id()
    and (home_id is null or public.user_has_home_access(home_id))
  );

create policy training_courses_org_read on public.training_courses
  for select using (organisation_id = public.current_organisation_id());

create policy training_course_versions_org_read on public.training_course_versions
  for select using (organisation_id = public.current_organisation_id());

create policy training_assignments_self_or_manager_read on public.training_assignments
  for select using (
    organisation_id = public.current_organisation_id()
    and (
      staff_member_id = auth.uid()
      or home_id is null
      or public.user_has_home_access(home_id)
      or public.is_platform_admin()
    )
  );

create policy training_completions_self_or_manager_read on public.training_completions
  for select using (
    organisation_id = public.current_organisation_id()
    and (
      staff_member_id = auth.uid()
      or home_id is null
      or public.user_has_home_access(home_id)
      or public.is_platform_admin()
    )
  );

create policy training_certificates_self_or_manager_read on public.training_certificates
  for select using (
    organisation_id = public.current_organisation_id()
    and (
      staff_member_id = auth.uid()
      or home_id is null
      or public.user_has_home_access(home_id)
      or public.is_platform_admin()
    )
  );

create policy training_matrix_self_or_manager_read on public.training_matrix_rows
  for select using (
    organisation_id = public.current_organisation_id()
    and (
      staff_member_id = auth.uid()
      or home_id is null
      or public.user_has_home_access(home_id)
      or public.is_platform_admin()
    )
  );

create policy training_requirements_org_read on public.training_requirements
  for select using (organisation_id = public.current_organisation_id());

create policy training_role_requirements_org_read on public.training_role_requirements
  for select using (organisation_id = public.current_organisation_id());

create policy training_notifications_user_read on public.training_notifications
  for select using (
    organisation_id = public.current_organisation_id()
    and (user_id = auth.uid() or public.is_platform_admin())
  );

create policy training_provider_links_org_read on public.training_provider_links
  for select using (organisation_id = public.current_organisation_id());

create policy training_sync_events_admin_read on public.training_sync_events
  for select using (
    organisation_id = public.current_organisation_id()
    and public.is_platform_admin()
  );

-- Write restrictions
create policy training_manage_assignments on public.training_assignments
  for all using (organisation_id = public.current_organisation_id() and public.is_platform_admin())
  with check (organisation_id = public.current_organisation_id() and public.is_platform_admin());

create policy training_manage_completions on public.training_completions
  for all using (organisation_id = public.current_organisation_id() and public.is_platform_admin())
  with check (organisation_id = public.current_organisation_id() and public.is_platform_admin());

create policy training_manage_certificates on public.training_certificates
  for all using (organisation_id = public.current_organisation_id() and public.is_platform_admin())
  with check (organisation_id = public.current_organisation_id() and public.is_platform_admin());

create policy training_manage_matrix on public.training_matrix_rows
  for all using (organisation_id = public.current_organisation_id() and public.is_platform_admin())
  with check (organisation_id = public.current_organisation_id() and public.is_platform_admin());

create policy training_manage_notifications on public.training_notifications
  for all using (organisation_id = public.current_organisation_id() and public.is_platform_admin())
  with check (organisation_id = public.current_organisation_id() and public.is_platform_admin());

create policy training_manage_provider_links on public.training_provider_links
  for all using (organisation_id = public.current_organisation_id() and public.is_platform_admin())
  with check (organisation_id = public.current_organisation_id() and public.is_platform_admin());

create policy training_manage_sync_events on public.training_sync_events
  for all using (organisation_id = public.current_organisation_id() and public.is_platform_admin())
  with check (organisation_id = public.current_organisation_id() and public.is_platform_admin());

-- Integration tables should only be managed by platform admins within same organisation
alter table public.integration_connections enable row level security;
alter table public.integration_sync_logs enable row level security;
alter table public.integration_webhook_events enable row level security;
alter table public.integration_error_logs enable row level security;

create policy integration_connections_admin_manage on public.integration_connections
  for all using (organisation_id = public.current_organisation_id() and public.is_platform_admin())
  with check (organisation_id = public.current_organisation_id() and public.is_platform_admin());

create policy integration_sync_logs_admin_read on public.integration_sync_logs
  for select using (organisation_id = public.current_organisation_id() and public.is_platform_admin());

create policy integration_sync_logs_admin_write on public.integration_sync_logs
  for all using (organisation_id = public.current_organisation_id() and public.is_platform_admin())
  with check (organisation_id = public.current_organisation_id() and public.is_platform_admin());

create policy integration_webhook_events_admin_manage on public.integration_webhook_events
  for all using (organisation_id = public.current_organisation_id() and public.is_platform_admin())
  with check (organisation_id = public.current_organisation_id() and public.is_platform_admin());

create policy integration_error_logs_admin_manage on public.integration_error_logs
  for all using (organisation_id = public.current_organisation_id() and public.is_platform_admin())
  with check (organisation_id = public.current_organisation_id() and public.is_platform_admin());

-- ============================================================================
-- Provider seed + training report templates
-- ============================================================================

insert into public.integration_providers (
  provider_code,
  name,
  status,
  supports_webhooks,
  supports_polling,
  supports_import,
  metadata
)
values (
  'vocational_training_hub',
  'Vocational Training Hub',
  'active',
  true,
  true,
  true,
  jsonb_build_object('phase', '4', 'integration_type', 'training_lms')
)
on conflict (provider_code)
do update set
  name = excluded.name,
  status = excluded.status,
  supports_webhooks = excluded.supports_webhooks,
  supports_polling = excluded.supports_polling,
  supports_import = excluded.supports_import,
  metadata = excluded.metadata,
  updated_at = now();

insert into public.report_templates (organisation_id, home_id, code, name, schema, is_active)
select
  o.id,
  null,
  t.code,
  t.name,
  t.schema,
  true
from public.organisations o
cross join (
  values
    ('staff_training_record', 'Staff Training Record', '{"category":"training","filters":["provider","home","staff","course","dateRange"],"includes":["certificateLinks","complianceSummary","ariaManagerSummary"]}'::jsonb),
    ('staff_training_matrix_export', 'Staff Training Matrix Export', '{"category":"training","filters":["provider","home","staff","course","dateRange"],"includes":["certificateLinks","complianceSummary","ariaManagerSummary"]}'::jsonb),
    ('home_training_compliance_report', 'Home Training Compliance Report', '{"category":"training","filters":["provider","home","staff","course","dateRange"],"includes":["certificateLinks","complianceSummary","ariaManagerSummary"]}'::jsonb),
    ('mandatory_training_overdue_report', 'Mandatory Training Overdue Report', '{"category":"training","filters":["provider","home","staff","course","dateRange"],"includes":["certificateLinks","complianceSummary","ariaManagerSummary"]}'::jsonb),
    ('due_soon_expiring_training_report', 'Due Soon / Expiring Training Report', '{"category":"training","filters":["provider","home","staff","course","dateRange"],"includes":["certificateLinks","complianceSummary","ariaManagerSummary"]}'::jsonb),
    ('course_completion_report', 'Course Completion Report', '{"category":"training","filters":["provider","home","staff","course","dateRange"],"includes":["certificateLinks","complianceSummary","ariaManagerSummary"]}'::jsonb),
    ('certificate_audit_report', 'Certificate Audit Report', '{"category":"training","filters":["provider","home","staff","course","dateRange"],"includes":["certificateLinks","complianceSummary","ariaManagerSummary"]}'::jsonb),
    ('provider_sync_audit_report', 'Provider Sync Audit Report', '{"category":"training","filters":["provider","home","staff","course","dateRange"],"includes":["certificateLinks","complianceSummary","ariaManagerSummary"]}'::jsonb)
) as t(code, name, schema)
where not exists (
  select 1
  from public.report_templates existing
  where existing.organisation_id = o.id
    and existing.code = t.code
);

-- Optional storage bucket for mirrored certificates
insert into storage.buckets (id, name, public)
select 'training-certificates', 'training-certificates', false
where not exists (
  select 1 from storage.buckets where id = 'training-certificates'
);
