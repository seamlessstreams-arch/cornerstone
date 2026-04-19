-- Phase 1 RLS foundations for Cornerstone
-- This file mirrors the RLS section in migration 20260419193000_phase1_foundation.sql.

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

-- For complete policy generation and placeholder table policies, run migration file:
-- supabase/migrations/20260419193000_phase1_foundation.sql
