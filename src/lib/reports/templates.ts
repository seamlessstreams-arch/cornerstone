/**
 * Report Templates for Phase 3
 * Defines available report types with their configurations
 */

export type ReportCategory = "YoungPerson" | "HealthSafety" | "Recruitment" | "Compliance";
export type ReportSection =
  | "summary"
  | "entries"
  | "attachments"
  | "oversight"
  | "chronology"
  | "actions"
  | "sign_off";

export interface ReportTemplateConfig {
  id: string;
  code: string;
  name: string;
  category: ReportCategory;
  description: string;
  icon?: string;
  defaultSections: ReportSection[];
  availableSections: ReportSection[];
  filterOptions: string[]; // e.g., ["dateRange", "child", "status", "riskType"]
  supportsAISummary: boolean;
  supportsPDFExport: boolean;
  supportsPrintLayout: boolean;
}

export const REPORT_TEMPLATES: Record<string, ReportTemplateConfig> = {
  // Young Person Reports
  young_person_summary: {
    id: "rpt-yp-summary",
    code: "young_person_summary_report",
    name: "Young Person Summary Report",
    category: "YoungPerson",
    description: "Comprehensive summary of a young person including key information, recent activities, and concerns",
    icon: "👤",
    defaultSections: ["summary", "entries", "actions"],
    availableSections: ["summary", "entries", "attachments", "oversight", "chronology", "actions"],
    filterOptions: ["dateRange", "child", "status"],
    supportsAISummary: true,
    supportsPDFExport: true,
    supportsPrintLayout: true,
  },

  daily_placement_summary: {
    id: "rpt-daily-placement",
    code: "daily_weekly_placement_summary",
    name: "Daily / Weekly Placement Summary",
    category: "YoungPerson",
    description: "Daily or weekly overview of placement activities, mood, behavior, and key events",
    icon: "📋",
    defaultSections: ["summary", "entries"],
    availableSections: ["summary", "entries", "attachments", "oversight", "chronology", "actions"],
    filterOptions: ["dateRange", "child"],
    supportsAISummary: true,
    supportsPDFExport: true,
    supportsPrintLayout: true,
  },

  incident_pack: {
    id: "rpt-incident-pack",
    code: "incident_report_pack",
    name: "Incident Report Pack",
    category: "YoungPerson",
    description: "Complete incident documentation including initial report, follow-up actions, and oversight",
    icon: "⚠️",
    defaultSections: ["summary", "entries", "attachments", "oversight", "actions"],
    availableSections: ["summary", "entries", "attachments", "oversight", "chronology", "actions", "sign_off"],
    filterOptions: ["dateRange", "child", "status"],
    supportsAISummary: true,
    supportsPDFExport: true,
    supportsPrintLayout: true,
  },

  missing_from_care_summary: {
    id: "rpt-missing",
    code: "missing_from_care_summary",
    name: "Missing From Care Summary",
    category: "YoungPerson",
    description: "Documentation of missing episodes including timeline, actions taken, and outcome",
    icon: "🔍",
    defaultSections: ["summary", "entries", "chronology", "actions"],
    availableSections: ["summary", "entries", "attachments", "oversight", "chronology", "actions", "sign_off"],
    filterOptions: ["dateRange", "child", "status"],
    supportsAISummary: true,
    supportsPDFExport: true,
    supportsPrintLayout: true,
  },

  safeguarding_overview: {
    id: "rpt-safeguarding",
    code: "safeguarding_overview_report",
    name: "Safeguarding Overview Report",
    category: "YoungPerson",
    description: "Safeguarding concerns, actions, and follow-up for a young person over a date range",
    icon: "🛡️",
    defaultSections: ["summary", "entries", "actions"],
    availableSections: ["summary", "entries", "attachments", "oversight", "chronology", "actions"],
    filterOptions: ["dateRange", "child", "riskType"],
    supportsAISummary: true,
    supportsPDFExport: true,
    supportsPrintLayout: true,
  },

  health_appointments_summary: {
    id: "rpt-health-appts",
    code: "health_appointments_events_summary",
    name: "Health Appointments / Events Summary",
    category: "YoungPerson",
    description: "Summary of health appointments, outcomes, and any follow-up actions",
    icon: "🏥",
    defaultSections: ["summary", "entries"],
    availableSections: ["summary", "entries", "attachments", "actions"],
    filterOptions: ["dateRange", "child"],
    supportsAISummary: false,
    supportsPDFExport: true,
    supportsPrintLayout: true,
  },

  medication_concerns_summary: {
    id: "rpt-medication",
    code: "medication_concerns_summary",
    name: "Medication Concerns Summary",
    category: "YoungPerson",
    description: "Medication administration issues, concerns, and management",
    icon: "💊",
    defaultSections: ["summary", "entries", "actions"],
    availableSections: ["summary", "entries", "attachments", "oversight", "actions"],
    filterOptions: ["dateRange", "child"],
    supportsAISummary: false,
    supportsPDFExport: true,
    supportsPrintLayout: true,
  },

  education_engagement_summary: {
    id: "rpt-education",
    code: "education_engagement_pep_summary",
    name: "Education Engagement / PEP Summary",
    category: "YoungPerson",
    description: "Education engagement, attendance, and Personal Education Plan progress",
    icon: "📚",
    defaultSections: ["summary", "entries"],
    availableSections: ["summary", "entries", "attachments", "actions"],
    filterOptions: ["dateRange", "child"],
    supportsAISummary: true,
    supportsPDFExport: true,
    supportsPrintLayout: true,
  },

  contact_family_time_summary: {
    id: "rpt-contact",
    code: "contact_family_time_summary",
    name: "Contact / Family Time Summary",
    category: "YoungPerson",
    description: "Summary of family contact and visits",
    icon: "👨‍👩‍👧",
    defaultSections: ["summary", "entries"],
    availableSections: ["summary", "entries", "attachments"],
    filterOptions: ["dateRange", "child"],
    supportsAISummary: false,
    supportsPDFExport: true,
    supportsPrintLayout: true,
  },

  chronology_report: {
    id: "rpt-chronology",
    code: "chronology_report",
    name: "Chronology Report",
    category: "YoungPerson",
    description: "Timeline of significant events and entries",
    icon: "⏱️",
    defaultSections: ["chronology"],
    availableSections: ["chronology", "entries"],
    filterOptions: ["dateRange", "child"],
    supportsAISummary: false,
    supportsPDFExport: true,
    supportsPrintLayout: true,
  },

  keywork_summary: {
    id: "rpt-keywork",
    code: "key_work_summary",
    name: "Key Work Summary",
    category: "YoungPerson",
    description: "Key work activities and progress with a young person",
    icon: "🤝",
    defaultSections: ["summary", "entries"],
    availableSections: ["summary", "entries", "attachments", "actions"],
    filterOptions: ["dateRange", "child"],
    supportsAISummary: true,
    supportsPDFExport: true,
    supportsPrintLayout: true,
  },

  // Health & Safety Reports
  hs_daily_audit: {
    id: "rpt-hs-daily",
    code: "h_and_s_daily_audit_report",
    name: "H&S Daily Audit Report",
    category: "HealthSafety",
    description: "Daily health and safety audit results and issues",
    icon: "✅",
    defaultSections: ["summary", "entries"],
    availableSections: ["summary", "entries", "attachments", "actions"],
    filterOptions: ["dateRange", "home"],
    supportsAISummary: false,
    supportsPDFExport: true,
    supportsPrintLayout: true,
  },

  hs_weekly_audit: {
    id: "rpt-hs-weekly",
    code: "h_and_s_weekly_audit_report",
    name: "H&S Weekly Audit Report",
    category: "HealthSafety",
    description: "Weekly comprehensive health and safety audit",
    icon: "📊",
    defaultSections: ["summary", "entries"],
    availableSections: ["summary", "entries", "attachments", "actions"],
    filterOptions: ["dateRange", "home"],
    supportsAISummary: true,
    supportsPDFExport: true,
    supportsPrintLayout: true,
  },

  hs_monthly_audit: {
    id: "rpt-hs-monthly",
    code: "h_and_s_monthly_audit_report",
    name: "H&S Monthly Audit Report",
    category: "HealthSafety",
    description: "Monthly health and safety audit with management sign-off",
    icon: "📅",
    defaultSections: ["summary", "entries", "sign_off"],
    availableSections: ["summary", "entries", "attachments", "oversight", "actions", "sign_off"],
    filterOptions: ["dateRange", "home"],
    supportsAISummary: true,
    supportsPDFExport: true,
    supportsPrintLayout: true,
  },

  maintenance_issues: {
    id: "rpt-maintenance",
    code: "maintenance_issues_report",
    name: "Maintenance Issues Report",
    category: "HealthSafety",
    description: "Outstanding maintenance issues and repairs",
    icon: "🔧",
    defaultSections: ["summary", "entries"],
    availableSections: ["summary", "entries", "attachments", "actions"],
    filterOptions: ["dateRange", "home", "status"],
    supportsAISummary: false,
    supportsPDFExport: true,
    supportsPrintLayout: true,
  },

  // Recruitment Reports
  recruitment_evidence_compliance: {
    id: "rpt-rec-compliance",
    code: "recruitment_evidence_compliance_report",
    name: "Recruitment Evidence Compliance Report",
    category: "Recruitment",
    description: "Verification status of all recruitment evidence for a candidate",
    icon: "📋",
    defaultSections: ["summary", "entries", "attachments"],
    availableSections: ["summary", "entries", "attachments", "oversight"],
    filterOptions: ["status", "candidateId", "evidenceType"],
    supportsAISummary: false,
    supportsPDFExport: true,
    supportsPrintLayout: true,
  },

  recruitment_candidate_pack: {
    id: "rpt-rec-pack",
    code: "recruitment_candidate_pack",
    name: "Recruitment Candidate Pack",
    category: "Recruitment",
    description: "Complete candidate file with all documented information and evidence",
    icon: "👤",
    defaultSections: ["summary", "entries", "attachments", "actions"],
    availableSections: ["summary", "entries", "attachments", "oversight", "actions"],
    filterOptions: ["candidateId"],
    supportsAISummary: false,
    supportsPDFExport: true,
    supportsPrintLayout: true,
  },

  recruitment_verification_audit: {
    id: "rpt-rec-audit",
    code: "recruitment_verification_audit_report",
    name: "Recruitment Verification Audit Report",
    category: "Recruitment",
    description: "Audit trail of all evidence verification activities",
    icon: "🔍",
    defaultSections: ["summary", "entries"],
    availableSections: ["summary", "entries", "oversight", "actions"],
    filterOptions: ["dateRange", "verifiedBy", "status"],
    supportsAISummary: false,
    supportsPDFExport: true,
    supportsPrintLayout: true,
  },

  // Compliance Reports
  management_oversight_report: {
    id: "rpt-oversight",
    code: "management_oversight_report",
    name: "Management Oversight Report",
    category: "Compliance",
    description: "Summary of management oversight decisions and actions",
    icon: "👨‍💼",
    defaultSections: ["summary", "entries", "actions"],
    availableSections: ["summary", "entries", "oversight", "actions"],
    filterOptions: ["dateRange", "child", "home", "status"],
    supportsAISummary: true,
    supportsPDFExport: true,
    supportsPrintLayout: true,
  },

  outstanding_actions_report: {
    id: "rpt-actions",
    code: "outstanding_actions_report",
    name: "Outstanding Actions Report",
    category: "Compliance",
    description: "Report of all outstanding actions and follow-ups",
    icon: "✔️",
    defaultSections: ["summary", "entries"],
    availableSections: ["summary", "entries", "actions"],
    filterOptions: ["dateRange", "status", "home"],
    supportsAISummary: false,
    supportsPDFExport: true,
    supportsPrintLayout: true,
  },

  quality_assurance: {
    id: "rpt-qa",
    code: "manager_quality_assurance_report",
    name: "Manager Quality Assurance Report",
    category: "Compliance",
    description: "Quality assurance audit of records, processes, and compliance",
    icon: "⭐",
    defaultSections: ["summary", "entries", "sign_off"],
    availableSections: ["summary", "entries", "attachments", "oversight", "actions", "sign_off"],
    filterOptions: ["dateRange", "home"],
    supportsAISummary: true,
    supportsPDFExport: true,
    supportsPrintLayout: true,
  },

  home_compliance_snapshot: {
    id: "rpt-home-compliance",
    code: "home_compliance_snapshot",
    name: "Home Compliance Snapshot",
    category: "Compliance",
    description: "Point-in-time compliance status of a home across all areas",
    icon: "🏠",
    defaultSections: ["summary", "entries"],
    availableSections: ["summary", "entries", "actions"],
    filterOptions: ["home"],
    supportsAISummary: true,
    supportsPDFExport: true,
    supportsPrintLayout: true,
  },

  staff_training_record: {
    id: "rpt-training-staff-record",
    code: "staff_training_record",
    name: "Staff Training Record",
    category: "Compliance",
    description: "Per-staff training record including certificates, completion dates, and compliance summary",
    icon: "🎓",
    defaultSections: ["summary", "entries", "attachments"],
    availableSections: ["summary", "entries", "attachments", "actions", "sign_off"],
    filterOptions: ["provider", "home", "staff", "course", "dateRange"],
    supportsAISummary: true,
    supportsPDFExport: true,
    supportsPrintLayout: true,
  },

  staff_training_matrix_export: {
    id: "rpt-training-matrix-export",
    code: "staff_training_matrix_export",
    name: "Staff Training Matrix Export",
    category: "Compliance",
    description: "Matrix export of Assigned, In Progress, Completed, and compliance states across staff and homes",
    icon: "📊",
    defaultSections: ["summary", "entries"],
    availableSections: ["summary", "entries", "actions", "sign_off"],
    filterOptions: ["provider", "home", "staff", "course", "dateRange"],
    supportsAISummary: true,
    supportsPDFExport: true,
    supportsPrintLayout: true,
  },

  home_training_compliance_report: {
    id: "rpt-training-home-compliance",
    code: "home_training_compliance_report",
    name: "Home Training Compliance Report",
    category: "Compliance",
    description: "Home-level compliance report covering mandatory completion rates and training gaps",
    icon: "🏠",
    defaultSections: ["summary", "entries", "actions"],
    availableSections: ["summary", "entries", "actions", "sign_off"],
    filterOptions: ["provider", "home", "staff", "course", "dateRange"],
    supportsAISummary: true,
    supportsPDFExport: true,
    supportsPrintLayout: true,
  },

  mandatory_training_overdue_report: {
    id: "rpt-training-mandatory-overdue",
    code: "mandatory_training_overdue_report",
    name: "Mandatory Training Overdue Report",
    category: "Compliance",
    description: "Mandatory training that is overdue, expired, or incomplete",
    icon: "⚠️",
    defaultSections: ["summary", "entries", "actions"],
    availableSections: ["summary", "entries", "actions", "sign_off"],
    filterOptions: ["provider", "home", "staff", "course", "dateRange"],
    supportsAISummary: true,
    supportsPDFExport: true,
    supportsPrintLayout: true,
  },

  due_soon_expiring_training_report: {
    id: "rpt-training-due-soon-expiring",
    code: "due_soon_expiring_training_report",
    name: "Due Soon / Expiring Training Report",
    category: "Compliance",
    description: "Upcoming expiry and due-soon records for proactive scheduling",
    icon: "⏳",
    defaultSections: ["summary", "entries"],
    availableSections: ["summary", "entries", "actions", "sign_off"],
    filterOptions: ["provider", "home", "staff", "course", "dateRange"],
    supportsAISummary: true,
    supportsPDFExport: true,
    supportsPrintLayout: true,
  },

  course_completion_report: {
    id: "rpt-training-course-completion",
    code: "course_completion_report",
    name: "Course Completion Report",
    category: "Compliance",
    description: "Completion rates and outcomes by course/provider/home over time",
    icon: "✅",
    defaultSections: ["summary", "entries"],
    availableSections: ["summary", "entries", "actions", "sign_off"],
    filterOptions: ["provider", "home", "staff", "course", "dateRange"],
    supportsAISummary: true,
    supportsPDFExport: true,
    supportsPrintLayout: true,
  },

  certificate_audit_report: {
    id: "rpt-training-certificate-audit",
    code: "certificate_audit_report",
    name: "Certificate Audit Report",
    category: "Compliance",
    description: "Audit of certificate availability, expiry, and evidence-link completeness",
    icon: "📎",
    defaultSections: ["summary", "entries", "attachments"],
    availableSections: ["summary", "entries", "attachments", "actions", "sign_off"],
    filterOptions: ["provider", "home", "staff", "course", "dateRange"],
    supportsAISummary: true,
    supportsPDFExport: true,
    supportsPrintLayout: true,
  },

  provider_sync_audit_report: {
    id: "rpt-training-provider-sync-audit",
    code: "provider_sync_audit_report",
    name: "Provider Sync Audit Report",
    category: "Compliance",
    description: "Sync health, failures, webhook processing, and remediation outcomes by provider",
    icon: "🔁",
    defaultSections: ["summary", "entries", "actions"],
    availableSections: ["summary", "entries", "actions", "sign_off"],
    filterOptions: ["provider", "home", "staff", "course", "dateRange"],
    supportsAISummary: true,
    supportsPDFExport: true,
    supportsPrintLayout: true,
  },
};

export const REPORT_TEMPLATES_BY_CATEGORY: Record<ReportCategory, ReportTemplateConfig[]> = {
  YoungPerson: Object.values(REPORT_TEMPLATES).filter((t) => t.category === "YoungPerson"),
  HealthSafety: Object.values(REPORT_TEMPLATES).filter((t) => t.category === "HealthSafety"),
  Recruitment: Object.values(REPORT_TEMPLATES).filter((t) => t.category === "Recruitment"),
  Compliance: Object.values(REPORT_TEMPLATES).filter((t) => t.category === "Compliance"),
};
