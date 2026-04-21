export type TrainingSyncSource = "api" | "webhook" | "import";

export type TrainingAssignmentStatus =
  | "not_assigned"
  | "assigned"
  | "in_progress"
  | "completed"
  | "failed"
  | "expired"
  | "exempt";

export type TrainingComplianceStatus =
  | "compliant"
  | "due_soon"
  | "overdue"
  | "expired"
  | "incomplete"
  | "non_compliant";

export interface ProviderCourseRecord {
  provider_course_id: string;
  provider_name: string;
  course_title: string;
  course_category: string | null;
  mandatory_flag: boolean;
  accreditation: string | null;
  cpd_hours: number | null;
  valid_for_days: number | null;
  valid_for_months: number | null;
  certificate_available: boolean;
  direct_course_url: string | null;
  archived_flag: boolean;
}

export interface ProviderAssignmentRecord {
  staff_member_id: string;
  course_provider_id: string;
  provider_assignment_id: string | null;
  provider_learner_id: string | null;
  assigned_at: string | null;
  due_date: string | null;
  status: TrainingAssignmentStatus;
  direct_course_url: string | null;
  last_provider_sync_at: string;
}

export interface ProviderCompletionRecord {
  staff_member_id: string;
  course_provider_id: string;
  completed_at: string | null;
  completion_status: TrainingAssignmentStatus;
  score: number | null;
  certificate_url: string | null;
  expires_at: string | null;
  renewal_due_at: string | null;
  provider_completion_id: string;
  synced_at: string;
  source: TrainingSyncSource;
}

export interface TrainingSyncDelta {
  courses: ProviderCourseRecord[];
  assignments: ProviderAssignmentRecord[];
  completions: ProviderCompletionRecord[];
  rawEvents?: Array<Record<string, unknown>>;
}

export interface TrainingProviderConnection {
  id: string;
  organisation_id: string;
  home_id: string | null;
  provider_id: string;
  provider_code: string;
  provider_name: string;
  status: string;
  config: Record<string, unknown>;
  credentials_ref: string;
}

export interface TrainingProviderWebhookResult {
  accepted: boolean;
  eventType: string;
  externalEventId: string | null;
  delta: TrainingSyncDelta;
}

export interface TrainingProviderAdapter {
  providerCode: string;
  supportsWebhooks: boolean;
  supportsPolling: boolean;
  supportsImports: boolean;
  testConnection(connection: TrainingProviderConnection): Promise<{ ok: boolean; message: string }>;
  syncAll(connection: TrainingProviderConnection, sinceIso?: string | null): Promise<TrainingSyncDelta>;
  handleWebhook(input: {
    connection: TrainingProviderConnection;
    headers: Headers;
    rawBody: string;
    payload: Record<string, unknown>;
  }): Promise<TrainingProviderWebhookResult>;
  importRecords(input: {
    connection: TrainingProviderConnection;
    fileName: string;
    contentType: string;
    buffer: Buffer;
  }): Promise<TrainingSyncDelta>;
  resolveLearnerCourseUrl(input: {
    connection: TrainingProviderConnection;
    providerLearnerId: string | null;
    providerCourseId: string;
    fallbackCourseUrl: string | null;
  }): string | null;
}

export interface TrainingMatrixRowModel {
  staff_member_id: string;
  course_id: string;
  home_id: string | null;
  role_id: string | null;
  requirement_type: "mandatory" | "optional";
  assigned_status: TrainingAssignmentStatus;
  completion_status: TrainingAssignmentStatus;
  completed_at: string | null;
  expires_at: string | null;
  due_date: string | null;
  days_until_due: number | null;
  compliance_status: TrainingComplianceStatus;
  direct_course_url: string | null;
  certificate_status: "available" | "missing" | "not_required";
  last_synced_at: string;
}
