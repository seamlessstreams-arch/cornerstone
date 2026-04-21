-- Phase 2: Enhanced form templates and young people structures

-- Form template enhancements for versioning and detailed config
alter table public.form_templates add column if not exists 
  default_status text default 'draft';

alter table public.form_template_versions add column if not exists 
  layout_config jsonb default '{}'::jsonb;

-- Form sections: now more structured
alter table public.form_sections add column if not exists 
  description text;

alter table public.form_sections add column if not exists 
  visibility_rules jsonb default '{}'::jsonb;

-- Form fields: add comprehensive field config
alter table public.form_fields add column if not exists 
  description text;

alter table public.form_fields add column if not exists 
  help_text text;

alter table public.form_fields add column if not exists 
  placeholder text;

alter table public.form_fields add column if not exists 
  default_value jsonb;

alter table public.form_fields add column if not exists 
  required boolean default false;

alter table public.form_fields add column if not exists 
  visibility_roles text[];

alter table public.form_fields add column if not exists 
  conditional_rules jsonb default '{}'::jsonb;

alter table public.form_fields add column if not exists 
  options jsonb;

alter table public.form_fields add column if not exists 
  validation_rules jsonb default '{}'::jsonb;

-- Form record values: track change history
alter table public.form_record_values add column if not exists 
  previous_value jsonb;

alter table public.form_record_values add column if not exists 
  changed_by uuid references public.users(id) on delete set null;

alter table public.form_record_values add column if not exists 
  changed_at timestamptz default now();

-- Management oversight: full structure
create table if not exists public.management_oversight (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  home_id uuid not null references public.homes(id) on delete cascade,
  form_record_id uuid not null references public.form_records(id) on delete cascade,
  manager_user_id uuid not null references public.users(id) on delete cascade,
  manager_role text,
  narrative text,
  analysis text,
  what_went_well text,
  concerns_identified text,
  risk_implications text,
  areas_for_improvement text,
  actions_required text,
  action_timescale text,
  responsible_user_id uuid references public.users(id) on delete set null,
  safeguarding_escalation_needed boolean default false,
  another_form_required boolean default false,
  chronology_update_needed boolean default false,
  plans_to_review text,
  supervision_follow_up_required boolean default false,
  sign_off_status text default 'pending',
  status text not null default 'draft',
  submitted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Management oversight actions
create table if not exists public.management_oversight_actions (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  home_id uuid not null references public.homes(id) on delete cascade,
  oversight_id uuid not null references public.management_oversight(id) on delete cascade,
  action_type text not null,
  payload jsonb not null default '{}'::jsonb,
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now()
);

-- Form submission approvals workflow
create table if not exists public.form_submission_approvals (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  home_id uuid not null references public.homes(id) on delete cascade,
  form_record_id uuid not null references public.form_records(id) on delete cascade,
  requested_by uuid references public.users(id) on delete set null,
  requested_at timestamptz,
  approver_user_id uuid references public.users(id) on delete set null,
  approved_at timestamptz,
  decision text,
  feedback text,
  created_at timestamptz not null default now()
);

-- Document verification enhanced
alter table public.file_verification_logs add column if not exists 
  verification_details jsonb default '{}'::jsonb;

alter table public.attachments add column if not exists 
  verification_status text default 'pending';

alter table public.attachments add column if not exists 
  verification_count integer default 0;

-- Young person identity and placement
alter table public.young_people add column if not exists 
  preferred_name text;

alter table public.young_people add column if not exists 
  legal_status text;

alter table public.young_people add column if not exists 
  ethnicity text;

alter table public.young_people add column if not exists 
  religion_faith text;

alter table public.young_people add column if not exists 
  placement_start_date date;

alter table public.young_people add column if not exists 
  key_worker_user_id uuid references public.users(id) on delete set null;

alter table public.young_people add column if not exists 
  social_worker_name text;

alter table public.young_people add column if not exists 
  social_worker_contact text;

-- Young person relationships
create table if not exists public.young_person_relationships (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  home_id uuid not null references public.homes(id) on delete cascade,
  young_person_id uuid not null references public.young_people(id) on delete cascade,
  relationship_type text not null,
  contact_name text,
  contact_phone text,
  contact_email text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Voice transcripts enhanced
alter table public.voice_transcripts add column if not exists 
  field_id uuid references public.form_fields(id) on delete set null;

alter table public.voice_transcripts add column if not exists 
  form_record_id uuid references public.form_records(id) on delete set null;

alter table public.voice_transcripts add column if not exists 
  duration_seconds integer;

alter table public.voice_transcripts add column if not exists 
  audio_url text;

alter table public.voice_transcripts add column if not exists 
  confidence_score numeric;

-- ARIA assistance logs
create table if not exists public.aria_assistance_logs (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  home_id uuid not null references public.homes(id) on delete cascade,
  user_id uuid references public.users(id) on delete set null,
  form_record_id uuid references public.form_records(id) on delete set null,
  field_id uuid references public.form_fields(id) on delete set null,
  prompt_type text,
  original_text text,
  generated_text text,
  accepted boolean,
  feedback text,
  created_at timestamptz not null default now()
);

-- Chronology linking to forms
alter table public.chronology_entries add column if not exists 
  form_record_id uuid references public.form_records(id) on delete set null;

alter table public.chronology_entries add column if not exists 
  form_type text;

-- Tasks linked to forms
alter table public.tasks add column if not exists 
  form_record_id uuid references public.form_records(id) on delete set null;

alter table public.tasks add column if not exists 
  young_person_id uuid references public.young_people(id) on delete set null;

-- Triggers for updated_at
do $$
declare
  t text;
begin
  foreach t in array array[
    'management_oversight','management_oversight_actions','form_submission_approvals',
    'young_person_relationships','aria_assistance_logs'
  ] loop
    execute format('drop trigger if exists trg_touch_updated_at_%I on public.%I;', t, t);
    execute format('create trigger trg_touch_updated_at_%I before update on public.%I for each row execute procedure public.touch_updated_at();', t, t);
  end loop;
end $$;

-- Patch existing tables with missing columns for indexes below
alter table public.form_records
  add column if not exists young_person_id uuid references public.young_people(id) on delete set null;

alter table public.tasks
  add column if not exists young_person_id uuid references public.young_people(id) on delete set null;

alter table public.chronology_entries
  add column if not exists form_record_id uuid references public.form_records(id) on delete set null;

-- Indexes for performance
create index if not exists idx_management_oversight_org_home_record on 
  public.management_oversight(organisation_id, home_id, form_record_id);

create index if not exists idx_form_records_young_person on 
  public.form_records(young_person_id) where young_person_id is not null;

create index if not exists idx_young_person_relationships_young_person on 
  public.young_person_relationships(young_person_id);

create index if not exists idx_aria_logs_user_form on 
  public.aria_assistance_logs(user_id, form_record_id);

create index if not exists idx_tasks_young_person on 
  public.tasks(young_person_id) where young_person_id is not null;

create index if not exists idx_chronology_form_record on 
  public.chronology_entries(form_record_id) where form_record_id is not null;
