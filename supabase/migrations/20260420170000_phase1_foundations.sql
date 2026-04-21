-- Phase 1 Foundations: auth, multi-home structure, placeholders, and audit baseline

create extension if not exists pgcrypto;

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.current_user_role()
returns text
language sql
stable
as $$
  select coalesce(
    nullif(auth.jwt() ->> 'cornerstone_role', ''),
    nullif(auth.jwt() ->> 'role', ''),
    'residential_support_worker'
  );
$$;

create or replace function public.is_platform_admin()
returns boolean
language sql
stable
as $$
  select public.current_user_role() in (
    'administrator',
    'responsible_individual',
    'director',
    'registered_manager'
  );
$$;

create table if not exists public.organisations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  legal_name text,
  provider_code text,
  status text not null default 'active',
  timezone text not null default 'Europe/London',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.homes (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  name text not null,
  code text,
  home_type text,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  organisation_id uuid references public.organisations(id) on delete set null,
  email text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.users(id) on delete cascade,
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  home_id uuid references public.homes(id) on delete set null,
  first_name text,
  last_name text,
  display_name text,
  phone text,
  job_title text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  home_id uuid references public.homes(id) on delete set null,
  role text not null,
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.home_assignments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  home_id uuid not null references public.homes(id) on delete cascade,
  assignment_type text not null default 'primary',
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid references public.organisations(id) on delete set null,
  home_id uuid references public.homes(id) on delete set null,
  actor_user_id uuid references public.users(id) on delete set null,
  event_type text not null,
  entity_type text,
  entity_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid references public.organisations(id) on delete set null,
  home_id uuid references public.homes(id) on delete set null,
  user_id uuid references public.users(id) on delete cascade,
  category text,
  title text not null,
  message text,
  read_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.attachments (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid references public.organisations(id) on delete set null,
  home_id uuid references public.homes(id) on delete set null,
  owner_user_id uuid references public.users(id) on delete set null,
  bucket text not null,
  path text not null,
  file_name text not null,
  content_type text,
  size_bytes bigint,
  checksum text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.file_verification_logs (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid references public.organisations(id) on delete set null,
  home_id uuid references public.homes(id) on delete set null,
  attachment_id uuid references public.attachments(id) on delete cascade,
  verified_by uuid references public.users(id) on delete set null,
  verification_type text,
  outcome text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid references public.organisations(id) on delete set null,
  home_id uuid references public.homes(id) on delete set null,
  owner_user_id uuid references public.users(id) on delete set null,
  report_type text not null,
  title text not null,
  status text not null default 'draft',
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.report_templates (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid references public.organisations(id) on delete set null,
  home_id uuid references public.homes(id) on delete set null,
  code text not null,
  name text not null,
  schema jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.report_exports (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid references public.organisations(id) on delete set null,
  home_id uuid references public.homes(id) on delete set null,
  report_id uuid references public.reports(id) on delete cascade,
  exported_by uuid references public.users(id) on delete set null,
  export_format text not null,
  attachment_id uuid references public.attachments(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.integration_providers (
  id uuid primary key default gen_random_uuid(),
  provider_code text not null unique,
  name text not null,
  status text not null default 'active',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.integration_connections (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  home_id uuid references public.homes(id) on delete set null,
  provider_id uuid not null references public.integration_providers(id) on delete cascade,
  credentials_ref text not null,
  config jsonb not null default '{}'::jsonb,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.integration_sync_logs (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid references public.organisations(id) on delete set null,
  home_id uuid references public.homes(id) on delete set null,
  connection_id uuid references public.integration_connections(id) on delete set null,
  status text not null,
  records_processed integer not null default 0,
  details jsonb not null default '{}'::jsonb,
  started_at timestamptz not null default now(),
  completed_at timestamptz
);

create table if not exists public.integration_webhook_events (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid references public.organisations(id) on delete set null,
  home_id uuid references public.homes(id) on delete set null,
  provider_id uuid references public.integration_providers(id) on delete set null,
  event_key text,
  payload jsonb not null default '{}'::jsonb,
  received_at timestamptz not null default now(),
  processed_at timestamptz
);

create table if not exists public.integration_error_logs (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid references public.organisations(id) on delete set null,
  home_id uuid references public.homes(id) on delete set null,
  connection_id uuid references public.integration_connections(id) on delete set null,
  severity text not null default 'error',
  error_message text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.young_people (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  home_id uuid not null references public.homes(id) on delete cascade,
  first_name text,
  last_name text,
  date_of_birth date,
  placement_status text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.young_people_profiles (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  home_id uuid not null references public.homes(id) on delete cascade,
  young_person_id uuid not null references public.young_people(id) on delete cascade,
  profile jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.professionals (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  home_id uuid references public.homes(id) on delete set null,
  name text not null,
  profession text,
  contact jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.contacts (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  home_id uuid references public.homes(id) on delete set null,
  linked_entity_type text,
  linked_entity_id text,
  name text not null,
  relationship text,
  contact jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.plans (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  home_id uuid not null references public.homes(id) on delete cascade,
  young_person_id uuid references public.young_people(id) on delete cascade,
  plan_type text not null,
  title text not null,
  content jsonb not null default '{}'::jsonb,
  status text not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.plan_reviews (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  home_id uuid not null references public.homes(id) on delete cascade,
  plan_id uuid not null references public.plans(id) on delete cascade,
  reviewed_by uuid references public.users(id) on delete set null,
  outcome text,
  notes text,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.form_categories (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid references public.organisations(id) on delete set null,
  home_id uuid references public.homes(id) on delete set null,
  code text not null,
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.form_templates (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid references public.organisations(id) on delete set null,
  home_id uuid references public.homes(id) on delete set null,
  category_id uuid references public.form_categories(id) on delete set null,
  code text not null,
  name text not null,
  status text not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.form_template_versions (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid references public.organisations(id) on delete set null,
  home_id uuid references public.homes(id) on delete set null,
  template_id uuid not null references public.form_templates(id) on delete cascade,
  version_number integer not null,
  schema jsonb not null default '{}'::jsonb,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(template_id, version_number)
);

create table if not exists public.form_sections (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid references public.organisations(id) on delete set null,
  home_id uuid references public.homes(id) on delete set null,
  template_version_id uuid not null references public.form_template_versions(id) on delete cascade,
  title text not null,
  section_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.form_fields (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid references public.organisations(id) on delete set null,
  home_id uuid references public.homes(id) on delete set null,
  section_id uuid not null references public.form_sections(id) on delete cascade,
  field_key text not null,
  field_type text not null,
  label text not null,
  field_order integer not null default 0,
  rules jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.form_workflow_rules (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid references public.organisations(id) on delete set null,
  home_id uuid references public.homes(id) on delete set null,
  template_id uuid references public.form_templates(id) on delete cascade,
  trigger_event text not null,
  rule_config jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.form_records (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  home_id uuid not null references public.homes(id) on delete cascade,
  template_id uuid references public.form_templates(id) on delete set null,
  status text not null default 'draft',
  subject_type text,
  subject_id text,
  submitted_by uuid references public.users(id) on delete set null,
  submitted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.form_record_values (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  home_id uuid not null references public.homes(id) on delete cascade,
  record_id uuid not null references public.form_records(id) on delete cascade,
  field_id uuid references public.form_fields(id) on delete set null,
  value jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.form_status_history (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  home_id uuid not null references public.homes(id) on delete cascade,
  record_id uuid not null references public.form_records(id) on delete cascade,
  previous_status text,
  next_status text,
  changed_by uuid references public.users(id) on delete set null,
  reason text,
  created_at timestamptz not null default now()
);

create table if not exists public.management_oversight_entries (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  home_id uuid not null references public.homes(id) on delete cascade,
  entry_type text,
  title text not null,
  details jsonb not null default '{}'::jsonb,
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.chronology_entries (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  home_id uuid not null references public.homes(id) on delete cascade,
  young_person_id uuid references public.young_people(id) on delete cascade,
  event_type text,
  event_date date,
  details jsonb not null default '{}'::jsonb,
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  home_id uuid not null references public.homes(id) on delete cascade,
  title text not null,
  description text,
  status text not null default 'open',
  priority text not null default 'medium',
  due_at timestamptz,
  assigned_to uuid references public.users(id) on delete set null,
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.task_comments (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  home_id uuid not null references public.homes(id) on delete cascade,
  task_id uuid not null references public.tasks(id) on delete cascade,
  author_user_id uuid references public.users(id) on delete set null,
  body text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.signatures (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  home_id uuid references public.homes(id) on delete set null,
  signer_user_id uuid references public.users(id) on delete set null,
  signer_name text,
  signature_type text,
  payload jsonb not null default '{}'::jsonb,
  signed_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.linked_records (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  home_id uuid references public.homes(id) on delete set null,
  source_type text not null,
  source_id text not null,
  target_type text not null,
  target_id text not null,
  relation_type text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.recruitment_candidates (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  home_id uuid references public.homes(id) on delete set null,
  first_name text,
  last_name text,
  email text,
  status text not null default 'new',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.recruitment_applications (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  home_id uuid references public.homes(id) on delete set null,
  candidate_id uuid not null references public.recruitment_candidates(id) on delete cascade,
  role_applied text,
  stage text not null default 'submitted',
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.recruitment_documents (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  home_id uuid references public.homes(id) on delete set null,
  candidate_id uuid not null references public.recruitment_candidates(id) on delete cascade,
  attachment_id uuid references public.attachments(id) on delete set null,
  document_type text,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.recruitment_verifications (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  home_id uuid references public.homes(id) on delete set null,
  candidate_id uuid not null references public.recruitment_candidates(id) on delete cascade,
  verification_type text,
  outcome text,
  metadata jsonb not null default '{}'::jsonb,
  verified_by uuid references public.users(id) on delete set null,
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.staff_training_profiles (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  home_id uuid references public.homes(id) on delete set null,
  user_id uuid not null references public.users(id) on delete cascade,
  profile jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.training_courses (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  home_id uuid references public.homes(id) on delete set null,
  code text,
  name text not null,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.training_course_versions (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  home_id uuid references public.homes(id) on delete set null,
  course_id uuid not null references public.training_courses(id) on delete cascade,
  version_number integer not null,
  content jsonb not null default '{}'::jsonb,
  effective_from timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(course_id, version_number)
);

create table if not exists public.training_assignments (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  home_id uuid references public.homes(id) on delete set null,
  user_id uuid not null references public.users(id) on delete cascade,
  course_id uuid not null references public.training_courses(id) on delete cascade,
  assigned_by uuid references public.users(id) on delete set null,
  due_at timestamptz,
  status text not null default 'assigned',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.training_completions (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  home_id uuid references public.homes(id) on delete set null,
  assignment_id uuid references public.training_assignments(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  completed_at timestamptz,
  score numeric,
  outcome text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.training_certificates (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  home_id uuid references public.homes(id) on delete set null,
  completion_id uuid references public.training_completions(id) on delete cascade,
  attachment_id uuid references public.attachments(id) on delete set null,
  certificate_number text,
  issued_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.training_matrix_rows (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  home_id uuid references public.homes(id) on delete set null,
  role text not null,
  requirement_count integer not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.training_requirements (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  home_id uuid references public.homes(id) on delete set null,
  code text,
  name text not null,
  frequency_days integer,
  mandatory boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.training_role_requirements (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  home_id uuid references public.homes(id) on delete set null,
  role text not null,
  requirement_id uuid not null references public.training_requirements(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.training_notifications (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  home_id uuid references public.homes(id) on delete set null,
  user_id uuid not null references public.users(id) on delete cascade,
  training_assignment_id uuid references public.training_assignments(id) on delete set null,
  notification_type text,
  sent_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.training_provider_links (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  home_id uuid references public.homes(id) on delete set null,
  provider_id uuid references public.integration_providers(id) on delete set null,
  course_id uuid references public.training_courses(id) on delete set null,
  external_course_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.training_sync_events (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  home_id uuid references public.homes(id) on delete set null,
  provider_link_id uuid references public.training_provider_links(id) on delete set null,
  status text,
  details jsonb not null default '{}'::jsonb,
  started_at timestamptz not null default now(),
  finished_at timestamptz
);

create table if not exists public.voice_transcripts (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  home_id uuid references public.homes(id) on delete set null,
  related_entity_type text,
  related_entity_id text,
  transcript text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ai_generation_logs (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  home_id uuid references public.homes(id) on delete set null,
  actor_user_id uuid references public.users(id) on delete set null,
  model text,
  prompt_hash text,
  output_ref text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

do $$
declare
  t text;
begin
  foreach t in array array[
    'homes','users','user_profiles','user_roles','home_assignments','notifications','attachments',
    'file_verification_logs','reports','report_templates','report_exports','integration_connections',
    'integration_sync_logs','integration_webhook_events','integration_error_logs','young_people',
    'young_people_profiles','professionals','contacts','plans','plan_reviews','form_categories',
    'form_templates','form_template_versions','form_sections','form_fields','form_workflow_rules',
    'form_records','form_record_values','form_status_history','management_oversight_entries',
    'chronology_entries','tasks','task_comments','signatures','linked_records','recruitment_candidates',
    'recruitment_applications','recruitment_documents','recruitment_verifications','staff_training_profiles',
    'training_courses','training_course_versions','training_assignments','training_completions',
    'training_certificates','training_matrix_rows','training_requirements','training_role_requirements',
    'training_notifications','training_provider_links','training_sync_events','voice_transcripts'
  ] loop
    execute format('drop trigger if exists trg_touch_updated_at_%I on public.%I;', t, t);
    execute format('create trigger trg_touch_updated_at_%I before update on public.%I for each row execute procedure public.touch_updated_at();', t, t);
  end loop;
end $$;

create index if not exists idx_user_profiles_user_id on public.user_profiles(user_id);
create index if not exists idx_user_profiles_org_home on public.user_profiles(organisation_id, home_id);
create index if not exists idx_home_assignments_user_home on public.home_assignments(user_id, home_id);
create index if not exists idx_audit_logs_org_home_created on public.audit_logs(organisation_id, home_id, created_at desc);
create index if not exists idx_reports_org_home_status on public.reports(organisation_id, home_id, status);
-- patch tasks table created in 001 to add organisation_id if it is missing
alter table public.tasks add column if not exists organisation_id uuid references public.organisations(id) on delete set null;
create index if not exists idx_tasks_org_home_status on public.tasks(organisation_id, home_id, status);
create index if not exists idx_form_records_org_home_status on public.form_records(organisation_id, home_id, status);
create index if not exists idx_training_assignments_user_due on public.training_assignments(user_id, due_at);
create index if not exists idx_integration_sync_logs_connection_started on public.integration_sync_logs(connection_id, started_at desc);
