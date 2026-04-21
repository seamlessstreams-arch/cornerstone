-- Phase 1 RLS foundations for multi-tenant, multi-home access

create or replace function public.user_org_id()
returns uuid
language sql
stable
as $$
  select organisation_id
  from public.user_profiles
  where user_id = auth.uid()
  limit 1;
$$;

create or replace function public.has_org_access(target_org uuid)
returns boolean
language sql
stable
as $$
  select
    public.is_platform_admin()
    or (
      target_org is not null
      and target_org = public.user_org_id()
    );
$$;

create or replace function public.has_home_access(target_home uuid)
returns boolean
language sql
stable
as $$
  select
    public.is_platform_admin()
    or exists (
      select 1
      from public.home_assignments ha
      where ha.user_id = auth.uid()
        and ha.home_id = target_home
        and (ha.ends_at is null or ha.ends_at > now())
    );
$$;

alter table public.organisations enable row level security;
alter table public.homes enable row level security;
alter table public.users enable row level security;
alter table public.user_profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.home_assignments enable row level security;
alter table public.audit_logs enable row level security;
alter table public.notifications enable row level security;
alter table public.attachments enable row level security;
alter table public.file_verification_logs enable row level security;
alter table public.reports enable row level security;
alter table public.report_templates enable row level security;
alter table public.report_exports enable row level security;
alter table public.integration_providers enable row level security;
alter table public.integration_connections enable row level security;
alter table public.integration_sync_logs enable row level security;
alter table public.integration_webhook_events enable row level security;
alter table public.integration_error_logs enable row level security;
alter table public.young_people enable row level security;
alter table public.young_people_profiles enable row level security;
alter table public.professionals enable row level security;
alter table public.contacts enable row level security;
alter table public.plans enable row level security;
alter table public.plan_reviews enable row level security;
alter table public.form_categories enable row level security;
alter table public.form_templates enable row level security;
alter table public.form_template_versions enable row level security;
alter table public.form_sections enable row level security;
alter table public.form_fields enable row level security;
alter table public.form_workflow_rules enable row level security;
alter table public.form_records enable row level security;
alter table public.form_record_values enable row level security;
alter table public.form_status_history enable row level security;
alter table public.management_oversight_entries enable row level security;
alter table public.chronology_entries enable row level security;
alter table public.tasks enable row level security;
alter table public.task_comments enable row level security;
alter table public.signatures enable row level security;
alter table public.linked_records enable row level security;
alter table public.recruitment_candidates enable row level security;
alter table public.recruitment_applications enable row level security;
alter table public.recruitment_documents enable row level security;
alter table public.recruitment_verifications enable row level security;
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
alter table public.voice_transcripts enable row level security;
alter table public.ai_generation_logs enable row level security;

-- Service role bypass policies for backend jobs and webhooks
create policy if not exists service_role_all_organisations on public.organisations
for all to service_role using (true) with check (true);

create policy if not exists service_role_all_homes on public.homes
for all to service_role using (true) with check (true);

-- Authenticated org-scoped access baseline
create policy if not exists org_member_select_homes on public.homes
for select to authenticated using (public.has_org_access(organisation_id));

create policy if not exists org_member_select_users on public.users
for select to authenticated using (public.has_org_access(organisation_id));

create policy if not exists org_member_select_user_profiles on public.user_profiles
for select to authenticated using (public.has_org_access(organisation_id));

create policy if not exists user_profile_self_update on public.user_profiles
for update to authenticated
using (user_id = auth.uid() or public.is_platform_admin())
with check (user_id = auth.uid() or public.is_platform_admin());

create policy if not exists org_member_select_user_roles on public.user_roles
for select to authenticated using (public.has_org_access(organisation_id));

create policy if not exists org_member_select_home_assignments on public.home_assignments
for select to authenticated using (public.has_org_access(organisation_id));

create policy if not exists org_member_select_audit_logs on public.audit_logs
for select to authenticated using (
  public.has_org_access(organisation_id)
  and (
    home_id is null or public.has_home_access(home_id)
  )
);

create policy if not exists org_member_insert_audit_logs on public.audit_logs
for insert to authenticated with check (public.has_org_access(organisation_id));

-- Generic pattern for org/home tables
create policy if not exists org_member_select_reports on public.reports
for select to authenticated using (
  public.has_org_access(organisation_id)
  and (home_id is null or public.has_home_access(home_id))
);

create policy if not exists org_member_write_reports on public.reports
for all to authenticated
using (
  public.has_org_access(organisation_id)
  and (home_id is null or public.has_home_access(home_id))
)
with check (
  public.has_org_access(organisation_id)
  and (home_id is null or public.has_home_access(home_id))
);

create policy if not exists org_member_select_tasks on public.tasks
for select to authenticated using (
  public.has_org_access(organisation_id)
  and public.has_home_access(home_id)
);

create policy if not exists org_member_write_tasks on public.tasks
for all to authenticated
using (
  public.has_org_access(organisation_id)
  and public.has_home_access(home_id)
)
with check (
  public.has_org_access(organisation_id)
  and public.has_home_access(home_id)
);

create policy if not exists org_member_select_notifications on public.notifications
for select to authenticated using (
  user_id = auth.uid() or public.has_org_access(organisation_id)
);

create policy if not exists user_update_own_notifications on public.notifications
for update to authenticated
using (user_id = auth.uid() or public.is_platform_admin())
with check (user_id = auth.uid() or public.is_platform_admin());

create policy if not exists org_member_select_form_records on public.form_records
for select to authenticated using (
  public.has_org_access(organisation_id)
  and public.has_home_access(home_id)
);

create policy if not exists org_member_write_form_records on public.form_records
for all to authenticated
using (
  public.has_org_access(organisation_id)
  and public.has_home_access(home_id)
)
with check (
  public.has_org_access(organisation_id)
  and public.has_home_access(home_id)
);

create policy if not exists org_member_select_recruitment_candidates on public.recruitment_candidates
for select to authenticated using (
  public.has_org_access(organisation_id)
  and (home_id is null or public.has_home_access(home_id))
);

create policy if not exists org_member_write_recruitment_candidates on public.recruitment_candidates
for all to authenticated
using (
  public.has_org_access(organisation_id)
  and (home_id is null or public.has_home_access(home_id))
)
with check (
  public.has_org_access(organisation_id)
  and (home_id is null or public.has_home_access(home_id))
);

create policy if not exists org_member_select_training_assignments on public.training_assignments
for select to authenticated using (
  user_id = auth.uid()
  or (
    public.has_org_access(organisation_id)
    and (home_id is null or public.has_home_access(home_id))
  )
);

create policy if not exists org_member_write_training_assignments on public.training_assignments
for all to authenticated
using (
  public.has_org_access(organisation_id)
  and (home_id is null or public.has_home_access(home_id))
)
with check (
  public.has_org_access(organisation_id)
  and (home_id is null or public.has_home_access(home_id))
);

create policy if not exists org_member_select_attachments on public.attachments
for select to authenticated using (
  public.has_org_access(organisation_id)
  and (home_id is null or public.has_home_access(home_id))
);

create policy if not exists org_member_write_attachments on public.attachments
for all to authenticated
using (
  public.has_org_access(organisation_id)
  and (home_id is null or public.has_home_access(home_id))
)
with check (
  public.has_org_access(organisation_id)
  and (home_id is null or public.has_home_access(home_id))
);

-- Organisations are visible to matching tenant members only
create policy if not exists org_member_select_organisations on public.organisations
for select to authenticated using (id = public.user_org_id() or public.is_platform_admin());

create policy if not exists admin_write_organisations on public.organisations
for all to authenticated
using (public.is_platform_admin())
with check (public.is_platform_admin());
