export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface FoundationRow {
  id: string;
  organisation_id: string | null;
  home_id: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
  archived_at: string | null;
  archived_by: string | null;
}

export type Phase1TableName =
  | "organisations"
  | "homes"
  | "users"
  | "user_profiles"
  | "user_roles"
  | "home_assignments"
  | "audit_logs"
  | "notifications"
  | "attachments"
  | "file_verification_logs"
  | "reports"
  | "report_templates"
  | "report_exports"
  | "integration_providers"
  | "integration_connections"
  | "integration_sync_logs"
  | "integration_webhook_events"
  | "integration_error_logs"
  | "young_people"
  | "young_people_profiles"
  | "professionals"
  | "contacts"
  | "plans"
  | "plan_reviews"
  | "form_categories"
  | "form_templates"
  | "form_template_versions"
  | "form_sections"
  | "form_fields"
  | "form_workflow_rules"
  | "form_records"
  | "form_record_values"
  | "form_status_history"
  | "management_oversight_entries"
  | "chronology_entries"
  | "tasks"
  | "task_comments"
  | "signatures"
  | "linked_records"
  | "recruitment_candidates"
  | "recruitment_applications"
  | "recruitment_documents"
  | "recruitment_verifications"
  | "staff_training_profiles"
  | "training_courses"
  | "training_course_versions"
  | "training_assignments"
  | "training_completions"
  | "training_certificates"
  | "training_matrix_rows"
  | "training_requirements"
  | "training_role_requirements"
  | "training_notifications"
  | "training_provider_links"
  | "training_sync_events"
  | "voice_transcripts"
  | "ai_generation_logs";

export type Database = {
  public: {
    Tables: Record<Phase1TableName, { Row: FoundationRow; Insert: Partial<FoundationRow>; Update: Partial<FoundationRow> }>;
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
