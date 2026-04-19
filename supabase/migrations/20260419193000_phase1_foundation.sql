create extension if not exists pgcrypto;

create type public.app_role as enum (
  'ADMINISTRATOR',
  'RESPONSIBLE_INDIVIDUAL',
  'DIRECTOR',
  'REGISTERED_MANAGER',
  'DEPUTY_MANAGER',
  'TEAM_LEADER',
  'RESIDENTIAL_SUPPORT_WORKER',
  'THERAPIST_CLINICAL_LEAD',
  'EDUCATION_TUTOR',
  'HR_RECRUITMENT_LEAD',
  'SAFER_RECRUITMENT_OFFICER',
  'TRAINING_COMPLIANCE_LEAD',
  'INDEPENDENT_VISITOR_READ_ONLY_AUDITOR'
);

create table if not exists public.organisations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.homes (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  name text not null,
  code text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  auth_user_id uuid not null unique references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_profiles (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  user_id uuid not null unique references public.users(id) on delete cascade,
  phone text,
  job_title text,
  emergency_contact jsonb,
  preferences jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_roles (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  home_id uuid references public.homes(id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role, home_id)
);

create table if not exists public.home_assignments (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  home_id uuid not null references public.homes(id) on delete cascade,
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  unique (user_id, home_id)
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid references public.organisations(id) on delete set null,
  home_id uuid references public.homes(id) on delete set null,
  actor_user_id uuid references public.users(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id text,
  payload jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz not null default now()
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  home_id uuid references public.homes(id) on delete set null,
  user_id uuid not null references public.users(id) on delete cascade,
  title text not null,
  body text not null,
  level text not null default 'info',
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.attachments (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  home_id uuid references public.homes(id) on delete set null,
  uploader_user_id uuid references public.users(id) on delete set null,
  bucket text not null,
  path text not null,
  file_name text not null,
  mime_type text,
  size_bytes bigint,
  verified boolean not null default false,
  created_at timestamptz not null default now(),
  unique (bucket, path)
);

create table if not exists public.file_verification_logs (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  home_id uuid references public.homes(id) on delete set null,
  attachment_id uuid not null references public.attachments(id) on delete cascade,
  verified_by uuid references public.users(id) on delete set null,
  verification_status text not null,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  home_id uuid references public.homes(id) on delete set null,
  template_id uuid,
  title text not null,
  status text not null default 'draft',
  generated_by uuid references public.users(id) on delete set null,
  content jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.report_templates (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  name text not null,
  description text,
  schema jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.report_exports (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  report_id uuid not null references public.reports(id) on delete cascade,
  export_format text not null,
  storage_bucket text not null,
  storage_path text not null,
  generated_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.integration_providers (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  name text not null,
  status text not null default 'active',
  configuration jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.integration_connections (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  provider_id uuid not null references public.integration_providers(id) on delete cascade,
  status text not null default 'pending',
  external_tenant_id text,
  configuration jsonb not null default '{}'::jsonb,
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.integration_sync_logs (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  connection_id uuid not null references public.integration_connections(id) on delete cascade,
  status text not null,
  started_at timestamptz,
  finished_at timestamptz,
  payload jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.integration_webhook_events (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  provider_id uuid not null references public.integration_providers(id) on delete cascade,
  event_type text not null,
  payload jsonb not null default '{}'::jsonb,
  processed_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.integration_error_logs (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  connection_id uuid references public.integration_connections(id) on delete set null,
  error_type text not null,
  error_message text not null,
  payload jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.young_people (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  home_id uuid references public.homes(id) on delete set null,
  reference_code text,
  first_name text,
  last_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.young_people_profiles (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  young_person_id uuid not null references public.young_people(id) on delete cascade,
  profile jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.professionals (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  home_id uuid references public.homes(id) on delete set null,
  professional_type text,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.contacts (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  home_id uuid references public.homes(id) on delete set null,
  contact_type text,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.plans (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  home_id uuid references public.homes(id) on delete set null,
  young_person_id uuid references public.young_people(id) on delete cascade,
  status text not null default 'draft',
  content jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.plan_reviews (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  plan_id uuid not null references public.plans(id) on delete cascade,
  reviewed_by uuid references public.users(id) on delete set null,
  review_notes text,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.form_categories (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.form_templates (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  category_id uuid references public.form_categories(id) on delete set null,
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.form_template_versions (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  template_id uuid not null references public.form_templates(id) on delete cascade,
  version integer not null,
  definition jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (template_id, version)
);

create table if not exists public.form_sections (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  template_version_id uuid not null references public.form_template_versions(id) on delete cascade,
  name text not null,
  position integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.form_fields (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  section_id uuid not null references public.form_sections(id) on delete cascade,
  field_key text not null,
  field_type text not null,
  field_config jsonb not null default '{}'::jsonb,
  position integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.form_workflow_rules (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  template_id uuid not null references public.form_templates(id) on delete cascade,
  rule jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.form_records (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  home_id uuid references public.homes(id) on delete set null,
  template_id uuid references public.form_templates(id) on delete set null,
  subject_type text,
  subject_id uuid,
  status text not null default 'draft',
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.form_record_values (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  form_record_id uuid not null references public.form_records(id) on delete cascade,
  field_id uuid references public.form_fields(id) on delete set null,
  value jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.form_status_history (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  form_record_id uuid not null references public.form_records(id) on delete cascade,
  previous_status text,
  next_status text not null,
  changed_by uuid references public.users(id) on delete set null,
  changed_at timestamptz not null default now()
);

create table if not exists public.management_oversight_entries (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  home_id uuid references public.homes(id) on delete set null,
  related_record_type text,
  related_record_id uuid,
  content text,
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.chronology_entries (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  home_id uuid references public.homes(id) on delete set null,
  young_person_id uuid references public.young_people(id) on delete set null,
  entry_type text,
  summary text,
  payload jsonb,
  occurred_at timestamptz,
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  home_id uuid references public.homes(id) on delete set null,
  title text not null,
  description text,
  status text not null default 'pending',
  priority text not null default 'medium',
  assigned_to uuid references public.users(id) on delete set null,
  created_by uuid references public.users(id) on delete set null,
  due_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.task_comments (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  task_id uuid not null references public.tasks(id) on delete cascade,
  user_id uuid references public.users(id) on delete set null,
  body text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.signatures (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  home_id uuid references public.homes(id) on delete set null,
  signed_by uuid references public.users(id) on delete set null,
  signature_type text,
  signature_data jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.linked_records (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  source_type text not null,
  source_id uuid not null,
  target_type text not null,
  target_id uuid not null,
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.recruitment_candidates (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  first_name text,
  last_name text,
  email text,
  status text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.recruitment_applications (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  candidate_id uuid not null references public.recruitment_candidates(id) on delete cascade,
  role_applied text,
  status text,
  submitted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.recruitment_documents (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  application_id uuid references public.recruitment_applications(id) on delete cascade,
  attachment_id uuid references public.attachments(id) on delete set null,
  document_type text,
  created_at timestamptz not null default now()
);

create table if not exists public.recruitment_verifications (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  application_id uuid not null references public.recruitment_applications(id) on delete cascade,
  verification_type text,
  status text,
  verified_by uuid references public.users(id) on delete set null,
  verified_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.staff_training_profiles (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  summary jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.training_courses (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  provider text,
  code text,
  title text not null,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.training_course_versions (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  course_id uuid not null references public.training_courses(id) on delete cascade,
  version integer not null,
  definition jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (course_id, version)
);

create table if not exists public.training_assignments (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  course_id uuid not null references public.training_courses(id) on delete cascade,
  due_at timestamptz,
  status text not null default 'assigned',
  created_at timestamptz not null default now()
);

create table if not exists public.training_completions (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  assignment_id uuid not null references public.training_assignments(id) on delete cascade,
  completed_at timestamptz,
  score numeric,
  created_at timestamptz not null default now()
);

create table if not exists public.training_certificates (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  completion_id uuid not null references public.training_completions(id) on delete cascade,
  attachment_id uuid references public.attachments(id) on delete set null,
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.training_matrix_rows (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  role public.app_role not null,
  requirement_summary jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.training_requirements (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  course_id uuid not null references public.training_courses(id) on delete cascade,
  requirement_type text,
  recurrence_days integer,
  created_at timestamptz not null default now()
);

create table if not exists public.training_role_requirements (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  role public.app_role not null,
  requirement_id uuid not null references public.training_requirements(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (role, requirement_id)
);

create table if not exists public.training_notifications (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  user_id uuid references public.users(id) on delete set null,
  assignment_id uuid references public.training_assignments(id) on delete cascade,
  message text,
  delivered_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.training_provider_links (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  course_id uuid references public.training_courses(id) on delete cascade,
  integration_connection_id uuid references public.integration_connections(id) on delete set null,
  external_course_id text,
  created_at timestamptz not null default now()
);

create table if not exists public.training_sync_events (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  integration_connection_id uuid references public.integration_connections(id) on delete set null,
  payload jsonb,
  status text,
  created_at timestamptz not null default now()
);

create table if not exists public.voice_transcripts (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  home_id uuid references public.homes(id) on delete set null,
  user_id uuid references public.users(id) on delete set null,
  transcript text,
  source_context text,
  created_at timestamptz not null default now()
);

create table if not exists public.ai_generation_logs (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  home_id uuid references public.homes(id) on delete set null,
  user_id uuid references public.users(id) on delete set null,
  generation_type text,
  prompt_hash text,
  metadata jsonb,
  created_at timestamptz not null default now()
);

alter table public.reports
  add constraint reports_template_fk
  foreign key (template_id)
  references public.report_templates(id)
  on delete set null;

create or replace function public.current_platform_user_id()
returns uuid
language sql
stable
as $$
  select u.id from public.users u where u.auth_user_id = auth.uid() limit 1;
$$;

create or replace function public.current_platform_organisation_id()
returns uuid
language sql
stable
as $$
  select u.organisation_id from public.users u where u.auth_user_id = auth.uid() limit 1;
$$;

create or replace function public.is_platform_admin()
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.user_roles ur
    join public.users u on u.id = ur.user_id
    where u.auth_user_id = auth.uid()
      and ur.role = 'ADMINISTRATOR'
  );
$$;

create or replace function public.is_org_member(p_org_id uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.users u
    where u.auth_user_id = auth.uid()
      and u.organisation_id = p_org_id
  );
$$;

create or replace function public.has_home_access(p_home_id uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.home_assignments ha
    join public.users u on u.id = ha.user_id
    where u.auth_user_id = auth.uid()
      and ha.home_id = p_home_id
  );
$$;

create or replace function public.log_audit_event(
  p_action text,
  p_entity_type text,
  p_entity_id text,
  p_organisation_id uuid,
  p_home_id uuid default null,
  p_payload jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_log_id uuid;
begin
  insert into public.audit_logs (
    organisation_id,
    home_id,
    actor_user_id,
    action,
    entity_type,
    entity_id,
    payload
  )
  values (
    p_organisation_id,
    p_home_id,
    public.current_platform_user_id(),
    p_action,
    p_entity_type,
    p_entity_id,
    p_payload
  )
  returning id into v_log_id;

  return v_log_id;
end;
$$;

grant execute on function public.log_audit_event(text, text, text, uuid, uuid, jsonb) to authenticated;

create or replace function public.audit_row_changes()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_organisation_id uuid;
  v_home_id uuid;
  v_entity_id text;
  v_payload jsonb;
  v_action text;
begin
  if tg_op = 'INSERT' then
    v_payload := to_jsonb(new);
    v_action := 'CREATE';
    v_entity_id := coalesce((to_jsonb(new)->>'id'), '');
  elsif tg_op = 'UPDATE' then
    v_payload := jsonb_build_object('old', to_jsonb(old), 'new', to_jsonb(new));
    v_action := 'UPDATE';
    v_entity_id := coalesce((to_jsonb(new)->>'id'), '');
  else
    v_payload := to_jsonb(old);
    v_action := 'DELETE';
    v_entity_id := coalesce((to_jsonb(old)->>'id'), '');
  end if;

  if tg_op = 'DELETE' then
    v_organisation_id := nullif((to_jsonb(old)->>'organisation_id'), '')::uuid;
    v_home_id := nullif((to_jsonb(old)->>'home_id'), '')::uuid;
  else
    v_organisation_id := nullif((to_jsonb(new)->>'organisation_id'), '')::uuid;
    v_home_id := nullif((to_jsonb(new)->>'home_id'), '')::uuid;
  end if;

  if v_organisation_id is not null then
    perform public.log_audit_event(v_action, tg_table_name, v_entity_id, v_organisation_id, v_home_id, v_payload);
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;

  return new;
end;
$$;

do $$
declare
  v_table text;
  v_table_list text[] := array[
    'users', 'user_profiles', 'user_roles', 'home_assignments',
    'attachments', 'file_verification_logs', 'reports', 'report_exports',
    'integration_connections', 'integration_sync_logs', 'integration_webhook_events', 'integration_error_logs',
    'tasks', 'task_comments', 'recruitment_candidates', 'recruitment_applications',
    'recruitment_documents', 'recruitment_verifications', 'training_assignments', 'training_completions',
    'training_certificates', 'training_sync_events', 'voice_transcripts', 'ai_generation_logs'
  ];
begin
  foreach v_table in array v_table_list loop
    execute format('drop trigger if exists trg_audit_%1$s on public.%1$s', v_table);
    execute format('create trigger trg_audit_%1$s after insert or update or delete on public.%1$s for each row execute function public.audit_row_changes()', v_table);
  end loop;
end $$;

do $$
declare
  v_table text;
  v_has_org boolean;
  v_has_home boolean;
  v_table_list text[] := array[
    'organisations', 'homes', 'users', 'user_profiles', 'user_roles', 'home_assignments',
    'audit_logs', 'notifications', 'attachments', 'file_verification_logs', 'reports',
    'report_templates', 'report_exports', 'integration_providers', 'integration_connections',
    'integration_sync_logs', 'integration_webhook_events', 'integration_error_logs',
    'young_people', 'young_people_profiles', 'professionals', 'contacts', 'plans',
    'plan_reviews', 'form_categories', 'form_templates', 'form_template_versions',
    'form_sections', 'form_fields', 'form_workflow_rules', 'form_records',
    'form_record_values', 'form_status_history', 'management_oversight_entries',
    'chronology_entries', 'tasks', 'task_comments', 'signatures', 'linked_records',
    'recruitment_candidates', 'recruitment_applications', 'recruitment_documents',
    'recruitment_verifications', 'staff_training_profiles', 'training_courses',
    'training_course_versions', 'training_assignments', 'training_completions',
    'training_certificates', 'training_matrix_rows', 'training_requirements',
    'training_role_requirements', 'training_notifications', 'training_provider_links',
    'training_sync_events', 'voice_transcripts', 'ai_generation_logs'
  ];
  v_select_policy text;
  v_write_policy text;
begin
  foreach v_table in array v_table_list loop
    execute format('alter table public.%I enable row level security', v_table);

    select exists (
      select 1 from information_schema.columns where table_schema = 'public' and table_name = v_table and column_name = 'organisation_id'
    ) into v_has_org;

    select exists (
      select 1 from information_schema.columns where table_schema = 'public' and table_name = v_table and column_name = 'home_id'
    ) into v_has_home;

    if v_has_org and v_has_home then
      v_select_policy := 'public.is_platform_admin() or public.is_org_member(organisation_id) or (home_id is not null and public.has_home_access(home_id))';
      v_write_policy := 'public.is_platform_admin() or public.is_org_member(organisation_id)';
    elsif v_has_org then
      v_select_policy := 'public.is_platform_admin() or public.is_org_member(organisation_id)';
      v_write_policy := 'public.is_platform_admin() or public.is_org_member(organisation_id)';
    elsif v_has_home then
      v_select_policy := 'public.is_platform_admin() or public.has_home_access(home_id)';
      v_write_policy := 'public.is_platform_admin() or public.has_home_access(home_id)';
    else
      v_select_policy := 'auth.uid() is not null';
      v_write_policy := 'public.is_platform_admin()';
    end if;

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

insert into storage.buckets (id, name, public)
values
  ('young-people-documents', 'young-people-documents', false),
  ('body-maps', 'body-maps', false),
  ('health-documents', 'health-documents', false),
  ('education-documents', 'education-documents', false),
  ('recruitment-evidence', 'recruitment-evidence', false),
  ('reports', 'reports', false),
  ('training-certificates', 'training-certificates', false),
  ('temp-generated-files', 'temp-generated-files', false)
on conflict (id) do nothing;

drop policy if exists p_storage_select on storage.objects;
drop policy if exists p_storage_insert on storage.objects;
drop policy if exists p_storage_update on storage.objects;
drop policy if exists p_storage_delete on storage.objects;

create policy p_storage_select
on storage.objects
for select
to authenticated
using (
  bucket_id in (
    'young-people-documents',
    'body-maps',
    'health-documents',
    'education-documents',
    'recruitment-evidence',
    'reports',
    'training-certificates',
    'temp-generated-files'
  )
);

create policy p_storage_insert
on storage.objects
for insert
to authenticated
with check (
  bucket_id in (
    'young-people-documents',
    'body-maps',
    'health-documents',
    'education-documents',
    'recruitment-evidence',
    'reports',
    'training-certificates',
    'temp-generated-files'
  )
  and owner = auth.uid()
);

create policy p_storage_update
on storage.objects
for update
to authenticated
using (owner = auth.uid() or public.is_platform_admin())
with check (bucket_id in (
  'young-people-documents',
  'body-maps',
  'health-documents',
  'education-documents',
  'recruitment-evidence',
  'reports',
  'training-certificates',
  'temp-generated-files'
));

create policy p_storage_delete
on storage.objects
for delete
to authenticated
using (owner = auth.uid() or public.is_platform_admin());
