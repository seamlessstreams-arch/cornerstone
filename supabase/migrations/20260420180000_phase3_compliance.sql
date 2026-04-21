-- Phase 3: Health & Safety, Safer Recruitment, Evidence Verification, and Reports
-- Generated: 2026-04-20

-- ════════════════════════════════════════════════════════════════════════════════
-- EVIDENCE & VERIFICATION TRACKING
-- ════════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS evidence_uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id UUID NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
  home_id UUID REFERENCES public.homes(id) ON DELETE SET NULL,
  form_record_id UUID NOT NULL REFERENCES public.form_records(id) ON DELETE CASCADE,
  evidence_type VARCHAR(50) NOT NULL, -- CV, ID, DBS, Reference, Qualification, etc.
  file_name VARCHAR(255) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  file_size BIGINT,
  mime_type VARCHAR(100),
  uploaded_by UUID NOT NULL REFERENCES public.users(id),
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  linked_candidate_id UUID REFERENCES public.recruitment_candidates(id) ON DELETE SET NULL,
  linked_young_person_id UUID REFERENCES public.young_people(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS evidence_verification_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id UUID NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
  home_id UUID REFERENCES public.homes(id) ON DELETE SET NULL,
  evidence_id UUID NOT NULL REFERENCES evidence_uploads(id) ON DELETE CASCADE,
  action VARCHAR(50) NOT NULL, -- viewed, verified, rejected, superseded
  taken_by UUID NOT NULL REFERENCES public.users(id),
  taken_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  verification_status VARCHAR(50), -- pending, viewed, verified, rejected, superseded, archived
  verification_notes TEXT,
  rejection_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ════════════════════════════════════════════════════════════════════════════════
-- RECRUITMENT
-- ════════════════════════════════════════════════════════════════════════════════

-- Uses existing public.recruitment_candidates from Phase 1 foundations.

-- ════════════════════════════════════════════════════════════════════════════════
-- REPORTS & EXPORT
-- ════════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS report_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(100) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(50) NOT NULL, -- Young Person, Health Safety, Recruitment, Compliance
  description TEXT,
  template_config JSONB, -- sections, filters, options
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS generated_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id UUID NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
  home_id UUID REFERENCES public.homes(id) ON DELETE SET NULL,
  report_definition_id UUID NOT NULL REFERENCES report_definitions(id),
  title VARCHAR(255) NOT NULL,
  subtitle VARCHAR(255),
  report_type VARCHAR(100),
  date_range_start DATE,
  date_range_end DATE,
  generated_by UUID NOT NULL REFERENCES public.users(id),
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  content_html TEXT, -- HTML preview
  content_json JSONB, -- structured data
  included_sections TEXT[], -- array of included report sections
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ════════════════════════════════════════════════════════════════════════════════
-- H&S SPECIFIC TRACKING
-- ════════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS health_safety_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id UUID NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
  home_id UUID NOT NULL REFERENCES public.homes(id) ON DELETE CASCADE,
  form_record_id UUID NOT NULL REFERENCES public.form_records(id) ON DELETE CASCADE,
  check_type VARCHAR(100) NOT NULL, -- daily, weekly_audit, monthly_manager_audit, room_check, etc.
  check_date DATE NOT NULL,
  due_date DATE,
  completed_at TIMESTAMP WITH TIME ZONE,
  status VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, completed, overdue, skipped
  completed_by UUID REFERENCES public.users(id),
  defects_identified BOOLEAN DEFAULT FALSE,
  defect_severity VARCHAR(50), -- low, medium, high, critical
  maintenance_task_id UUID REFERENCES public.tasks(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ════════════════════════════════════════════════════════════════════════════════
-- INDEXES FOR PERFORMANCE
-- ════════════════════════════════════════════════════════════════════════════════

CREATE INDEX idx_evidence_form_record ON evidence_uploads(form_record_id);
CREATE INDEX idx_evidence_candidate ON evidence_uploads(linked_candidate_id);
CREATE INDEX idx_evidence_type ON evidence_uploads(evidence_type);
CREATE INDEX idx_verification_evidence ON evidence_verification_history(evidence_id);
CREATE INDEX idx_verification_taken_at ON evidence_verification_history(taken_at);
CREATE INDEX idx_generated_reports_org_home ON generated_reports(organisation_id, home_id);
CREATE INDEX idx_reports_definition ON generated_reports(report_definition_id);
CREATE INDEX idx_reports_generated_at ON generated_reports(generated_at);
CREATE INDEX idx_health_safety_home ON health_safety_checks(home_id);
CREATE INDEX idx_health_safety_status ON health_safety_checks(status);
CREATE INDEX idx_health_safety_due_date ON health_safety_checks(due_date);

-- ════════════════════════════════════════════════════════════════════════════════
-- AUDIT LOGGING
-- ════════════════════════════════════════════════════════════════════════════════

-- Audit logging is handled through public.audit_logs via application services.
