export const REG45_CYCLE_STATUSES = [
  "planned",
  "evidence_gathering",
  "in_review",
  "drafting_report",
  "awaiting_sign_off",
  "finalised",
  "submitted",
  "archived",
] as const;

export type Reg45CycleStatus = (typeof REG45_CYCLE_STATUSES)[number];

export const REG45_EVIDENCE_CATEGORIES = [
  "childrens_voice",
  "parent_family_advocate",
  "placing_authority_professional",
  "staff",
  "child_outcomes_lived_experience",
  "safeguarding_risk",
  "quality_assurance_monitoring",
  "operational_workforce",
  "environment_house_experience",
  "notifications_compliance",
] as const;

export type Reg45EvidenceCategory = (typeof REG45_EVIDENCE_CATEGORIES)[number];

export const REG45_CONSULTATION_GROUPS = [
  "children",
  "parents",
  "placing_authorities",
  "staff",
  "professionals",
  "advocates",
] as const;

export type Reg45ConsultationGroup = (typeof REG45_CONSULTATION_GROUPS)[number];

export const REG45_REPORT_SECTIONS = [
  "review_period_context",
  "methodology",
  "children_experiences_progress",
  "safeguarding_risk_management",
  "quality_of_care_evaluation",
  "feedback_consultation",
  "progress_since_previous_review",
  "overall_judgement",
  "action_plan",
  "sign_off_submission",
] as const;

export type Reg45ReportSectionCode = (typeof REG45_REPORT_SECTIONS)[number];

export interface Reg45EvidenceCompleteness {
  score: number;
  missingCategories: Reg45EvidenceCategory[];
  consultationCoverage: Partial<Record<Reg45ConsultationGroup, number>>;
  hasPreviousActionEvidence: boolean;
  hasChildFeedback: boolean;
  findingsWithoutEvidence: number;
  actionsWithoutOwnerOrDeadline: number;
  blockFinalSignOff: boolean;
  alerts: string[];
}

export interface Reg45CycleSummary {
  id: string;
  cycle_title: string;
  status: Reg45CycleStatus;
  review_start_date: string;
  review_end_date: string;
  due_date: string | null;
  evidence_count: number;
  verified_evidence_count: number;
  findings_count: number;
  open_actions_count: number;
  overdue_actions_count: number;
}
