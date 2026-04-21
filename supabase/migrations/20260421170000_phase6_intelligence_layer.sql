-- Phase 6: Intelligence and Insight Layer
-- Generated: 2026-04-21

create extension if not exists pgcrypto;

create table if not exists public.intelligence_interventions (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  home_id uuid not null references public.homes(id) on delete cascade,
  child_id uuid references public.young_people(id) on delete set null,
  title text not null,
  why_now text not null,
  intended_outcome text not null,
  started_on date not null,
  review_date date not null,
  agreed_by uuid references public.users(id) on delete set null,
  owner_id uuid references public.users(id) on delete set null,
  status text not null default 'active',
  impact_summary text,
  continue_decision text,
  linked_record_ids text[] not null default '{}'::text[],
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (status in ('active','review_due','completed','stopped')),
  check (continue_decision in ('continue','adapt','stop') or continue_decision is null)
);

create table if not exists public.intelligence_trusted_adults (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  home_id uuid not null references public.homes(id) on delete cascade,
  child_id uuid references public.young_people(id) on delete set null,
  staff_id uuid references public.users(id) on delete set null,
  relationship_type text not null,
  confidence text not null default 'medium',
  notes text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (relationship_type in ('preferred','regulating','engaging','strain','avoided')),
  check (confidence in ('low','medium','high'))
);

create table if not exists public.intelligence_practice_bank (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  home_id uuid not null references public.homes(id) on delete cascade,
  child_id uuid references public.young_people(id) on delete set null,
  category text not null,
  title text not null,
  details text not null,
  evidence_refs text[] not null default '{}'::text[],
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (category in ('what_helps','language_that_helps','avoid','deescalation','repair','education_engagement','contact_preparation','sensory_support'))
);

create table if not exists public.intelligence_child_voice_entries (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  home_id uuid not null references public.homes(id) on delete cascade,
  child_id uuid references public.young_people(id) on delete set null,
  said text not null,
  adult_response text not null,
  outcome text not null,
  source text not null default 'manual',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.intelligence_action_reviews (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  home_id uuid not null references public.homes(id) on delete cascade,
  action_id text not null,
  child_id uuid references public.young_people(id) on delete set null,
  what_changed text not null,
  evidence_after text not null,
  effectiveness text not null,
  decision text not null,
  reviewed_by uuid references public.users(id) on delete set null,
  reviewed_at timestamptz not null default now(),
  check (effectiveness in ('worked','partially_worked','did_not_work')),
  check (decision in ('continue','adapt','stop'))
);

create table if not exists public.intelligence_pattern_alerts (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  home_id uuid not null references public.homes(id) on delete cascade,
  child_id uuid references public.young_people(id) on delete set null,
  title text not null,
  prompt text not null,
  confidence text not null default 'medium',
  evidence_refs text[] not null default '{}'::text[],
  period_days integer not null default 28,
  created_at timestamptz not null default now(),
  check (confidence in ('low','medium','high'))
);

create index if not exists idx_intelligence_interventions_child_status
  on public.intelligence_interventions(child_id, status, review_date);
create index if not exists idx_intelligence_trusted_adults_child
  on public.intelligence_trusted_adults(child_id, confidence);
create index if not exists idx_intelligence_practice_bank_child
  on public.intelligence_practice_bank(child_id, category, created_at desc);
create index if not exists idx_intelligence_voice_child
  on public.intelligence_child_voice_entries(child_id, created_at desc);
create index if not exists idx_intelligence_action_reviews_child
  on public.intelligence_action_reviews(child_id, reviewed_at desc);
create index if not exists idx_intelligence_pattern_alerts_child
  on public.intelligence_pattern_alerts(child_id, confidence, created_at desc);

alter table public.intelligence_interventions enable row level security;
alter table public.intelligence_trusted_adults enable row level security;
alter table public.intelligence_practice_bank enable row level security;
alter table public.intelligence_child_voice_entries enable row level security;
alter table public.intelligence_action_reviews enable row level security;
alter table public.intelligence_pattern_alerts enable row level security;

create policy intelligence_interventions_org_read on public.intelligence_interventions
  for select using (organisation_id = public.current_organisation_id() and public.user_has_home_access(home_id));
create policy intelligence_interventions_write on public.intelligence_interventions
  for all using (organisation_id = public.current_organisation_id() and public.user_has_home_access(home_id))
  with check (organisation_id = public.current_organisation_id() and public.user_has_home_access(home_id));

create policy intelligence_trusted_adults_org_read on public.intelligence_trusted_adults
  for select using (organisation_id = public.current_organisation_id() and public.user_has_home_access(home_id));
create policy intelligence_trusted_adults_write on public.intelligence_trusted_adults
  for all using (organisation_id = public.current_organisation_id() and public.user_has_home_access(home_id))
  with check (organisation_id = public.current_organisation_id() and public.user_has_home_access(home_id));

create policy intelligence_practice_bank_org_read on public.intelligence_practice_bank
  for select using (organisation_id = public.current_organisation_id() and public.user_has_home_access(home_id));
create policy intelligence_practice_bank_write on public.intelligence_practice_bank
  for all using (organisation_id = public.current_organisation_id() and public.user_has_home_access(home_id))
  with check (organisation_id = public.current_organisation_id() and public.user_has_home_access(home_id));

create policy intelligence_voice_org_read on public.intelligence_child_voice_entries
  for select using (organisation_id = public.current_organisation_id() and public.user_has_home_access(home_id));
create policy intelligence_voice_write on public.intelligence_child_voice_entries
  for all using (organisation_id = public.current_organisation_id() and public.user_has_home_access(home_id))
  with check (organisation_id = public.current_organisation_id() and public.user_has_home_access(home_id));

create policy intelligence_action_reviews_org_read on public.intelligence_action_reviews
  for select using (organisation_id = public.current_organisation_id() and public.user_has_home_access(home_id));
create policy intelligence_action_reviews_write on public.intelligence_action_reviews
  for all using (organisation_id = public.current_organisation_id() and public.user_has_home_access(home_id))
  with check (organisation_id = public.current_organisation_id() and public.user_has_home_access(home_id));

create policy intelligence_pattern_alerts_org_read on public.intelligence_pattern_alerts
  for select using (organisation_id = public.current_organisation_id() and public.user_has_home_access(home_id));
create policy intelligence_pattern_alerts_write on public.intelligence_pattern_alerts
  for all using (organisation_id = public.current_organisation_id() and public.user_has_home_access(home_id))
  with check (organisation_id = public.current_organisation_id() and public.user_has_home_access(home_id));
