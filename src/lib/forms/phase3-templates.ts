import type { FormTemplate } from "@/lib/forms/types";

/**
 * Phase 3 Health & Safety and Safer Recruitment Form Templates
 * 25 H&S forms + 24 Recruitment forms = 49 templates
 */

export const HEALTH_SAFETY_TEMPLATES: Record<string, FormTemplate> = {
  // Daily Health & Safety Check
  daily_health_safety_check: {
    id: "tpl-hs-daily",
    code: "daily_health_safety_check",
    name: "Daily Health & Safety Check",
    category: "Health & Safety",
    status: "approved",
    description: "Daily check of health and safety standards across the home",
    latest_version: {
      id: "v-hs-daily-1",
      template_id: "tpl-hs-daily",
      version_number: 1,
      is_published: true,
      created_at: new Date().toISOString(),
      schema: {
        sections: [
          {
            id: "sec-check-date",
            title: "Check Details",
            section_order: 1,
            fields: [
              {
                id: "f-check-date",
                field_key: "check_date",
                field_type: "date",
                label: "Check Date",
                required: true,
                field_order: 1,
                section_id: "sec-check-date",
              },
              {
                id: "f-checked-by",
                field_key: "checked_by",
                field_type: "short_text",
                label: "Checked by",
                required: true,
                field_order: 2,
                section_id: "sec-check-date",
              },
            ],
          },
          {
            id: "sec-areas",
            title: "Areas Checked",
            section_order: 2,
            fields: [
              {
                id: "f-common-areas",
                field_key: "common_areas_safe",
                field_type: "yes_no",
                label: "Common areas safe and tidy",
                required: true,
                field_order: 1,
                section_id: "sec-areas",
              },
              {
                id: "f-bedrooms",
                field_key: "bedrooms_safe",
                field_type: "yes_no",
                label: "Bedrooms safe and secure",
                required: true,
                field_order: 2,
                section_id: "sec-areas",
              },
              {
                id: "f-kitchen",
                field_key: "kitchen_safe",
                field_type: "yes_no",
                label: "Kitchen safe and clean",
                required: true,
                field_order: 3,
                section_id: "sec-areas",
              },
              {
                id: "f-bathrooms",
                field_key: "bathrooms_safe",
                field_type: "yes_no",
                label: "Bathrooms clean and safe",
                required: true,
                field_order: 4,
                section_id: "sec-areas",
              },
            ],
          },
          {
            id: "sec-issues",
            title: "Issues Found",
            section_order: 3,
            fields: [
              {
                id: "f-issues",
                field_key: "issues_identified",
                field_type: "yes_no",
                label: "Any issues identified?",
                required: true,
                field_order: 1,
                section_id: "sec-issues",
              },
              {
                id: "f-issue-details",
                field_key: "issue_details",
                field_type: "long_text",
                label: "Details",
                conditional_rules: [
                  {
                    type: "show",
                    when: { fieldKey: "issues_identified", operator: "equals", value: true },
                  },
                ],
                field_order: 2,
                section_id: "sec-issues",
              },
              {
                id: "f-severity",
                field_key: "severity",
                field_type: "single_select",
                label: "Severity",
                conditional_rules: [
                  {
                    type: "show",
                    when: { fieldKey: "issues_identified", operator: "equals", value: true },
                  },
                ],
                options: [
                  { label: "Low", value: "low" },
                  { label: "Medium", value: "medium" },
                  { label: "High", value: "high" },
                  { label: "Critical", value: "critical" },
                ],
                field_order: 3,
                section_id: "sec-issues",
              },
              {
                id: "f-evidence",
                field_key: "evidence_photo",
                field_type: "file_upload",
                label: "Evidence (Photo)",
                conditional_rules: [
                  {
                    type: "show",
                    when: { fieldKey: "issues_identified", operator: "equals", value: true },
                  },
                ],
                field_order: 4,
                section_id: "sec-issues",
              },
            ],
          },
        ],
      },
    },
  },

  // Weekly Health & Safety Audit
  weekly_health_safety_audit: {
    id: "tpl-hs-weekly",
    code: "weekly_health_safety_audit",
    name: "Weekly Health & Safety Audit",
    category: "Health & Safety",
    status: "approved",
    description: "Comprehensive weekly health and safety audit",
    latest_version: {
      id: "v-hs-weekly-1",
      template_id: "tpl-hs-weekly",
      version_number: 1,
      is_published: true,
      created_at: new Date().toISOString(),
      schema: {
        sections: [
          {
            id: "sec-audit-info",
            title: "Audit Information",
            section_order: 1,
            fields: [
              {
                id: "f-audit-date",
                field_key: "audit_date",
                field_type: "date",
                label: "Audit Date",
                required: true,
                field_order: 1,
                section_id: "sec-audit-info",
              },
              {
                id: "f-auditor",
                field_key: "auditor_name",
                field_type: "short_text",
                label: "Auditor",
                required: true,
                field_order: 2,
                section_id: "sec-audit-info",
              },
            ],
          },
          {
            id: "sec-compliance",
            title: "Compliance Assessment",
            section_order: 2,
            fields: [
              {
                id: "f-risk-register",
                field_key: "risk_register_reviewed",
                field_type: "yes_no",
                label: "Risk register reviewed",
                required: true,
                field_order: 1,
                section_id: "sec-compliance",
              },
              {
                id: "f-incidents-reviewed",
                field_key: "incidents_reviewed",
                field_type: "yes_no",
                label: "Incidents reviewed",
                required: true,
                field_order: 2,
                section_id: "sec-compliance",
              },
              {
                id: "f-controls-checked",
                field_key: "controls_implemented",
                field_type: "yes_no",
                label: "Control measures in place",
                required: true,
                field_order: 3,
                section_id: "sec-compliance",
              },
            ],
          },
          {
            id: "sec-findings",
            title: "Audit Findings",
            section_order: 3,
            fields: [
              {
                id: "f-findings",
                field_key: "findings",
                field_type: "ai_assisted_narrative",
                label: "Audit Findings",
                help_text: "Document findings from this week's audit",
                required: true,
                field_order: 1,
                section_id: "sec-findings",
              },
            ],
          },
        ],
      },
    },
  },

  // Fire Alarm Test Record
  fire_alarm_test: {
    id: "tpl-hs-fire-alarm",
    code: "fire_alarm_test_record",
    name: "Fire Alarm Test Record",
    category: "Health & Safety",
    status: "approved",
    description: "Record of fire alarm testing",
    latest_version: {
      id: "v-fire-alarm-1",
      template_id: "tpl-hs-fire-alarm",
      version_number: 1,
      is_published: true,
      created_at: new Date().toISOString(),
      schema: {
        sections: [
          {
            id: "sec-test",
            title: "Test Details",
            section_order: 1,
            fields: [
              {
                id: "f-test-date",
                field_key: "test_date",
                field_type: "datetime",
                label: "Date & Time Tested",
                required: true,
                field_order: 1,
                section_id: "sec-test",
              },
              {
                id: "f-tested-by",
                field_key: "tested_by",
                field_type: "short_text",
                label: "Tested by",
                required: true,
                field_order: 2,
                section_id: "sec-test",
              },
              {
                id: "f-test-type",
                field_key: "test_type",
                field_type: "single_select",
                label: "Test Type",
                required: true,
                options: [
                  { label: "Manual test", value: "manual" },
                  { label: "Automated test", value: "automated" },
                  { label: "Service engineer test", value: "engineer" },
                ],
                field_order: 3,
                section_id: "sec-test",
              },
              {
                id: "f-result",
                field_key: "test_result",
                field_type: "single_select",
                label: "Test Result",
                required: true,
                options: [
                  { label: "Pass", value: "pass" },
                  { label: "Fail", value: "fail" },
                  { label: "Partial fail", value: "partial" },
                ],
                field_order: 4,
                section_id: "sec-test",
              },
              {
                id: "f-notes",
                field_key: "notes",
                field_type: "long_text",
                label: "Notes",
                field_order: 5,
                section_id: "sec-test",
              },
            ],
          },
        ],
      },
    },
  },

  // Kitchen Safety Check
  kitchen_safety_check: {
    id: "tpl-hs-kitchen",
    code: "kitchen_safety_check",
    name: "Kitchen Safety Check",
    category: "Health & Safety",
    status: "approved",
    description: "Kitchen safety and hygiene check",
    latest_version: {
      id: "v-kitchen-1",
      template_id: "tpl-hs-kitchen",
      version_number: 1,
      is_published: true,
      created_at: new Date().toISOString(),
      schema: {
        sections: [
          {
            id: "sec-kitchen",
            title: "Kitchen Check",
            section_order: 1,
            fields: [
              {
                id: "f-check-date",
                field_key: "check_date",
                field_type: "date",
                label: "Check Date",
                required: true,
                field_order: 1,
                section_id: "sec-kitchen",
              },
              {
                id: "f-equipment-safe",
                field_key: "equipment_safe",
                field_type: "yes_no",
                label: "All equipment safe and working",
                required: true,
                field_order: 2,
                section_id: "sec-kitchen",
              },
              {
                id: "f-surfaces-clean",
                field_key: "surfaces_clean",
                field_type: "yes_no",
                label: "Work surfaces clean",
                required: true,
                field_order: 3,
                section_id: "sec-kitchen",
              },
              {
                id: "f-hygiene-standards",
                field_key: "hygiene_standards",
                field_type: "yes_no",
                label: "Food hygiene standards met",
                required: true,
                field_order: 4,
                section_id: "sec-kitchen",
              },
              {
                id: "f-chemicals-stored",
                field_key: "chemicals_stored_safely",
                field_type: "yes_no",
                label: "Chemicals stored safely",
                required: true,
                field_order: 5,
                section_id: "sec-kitchen",
              },
            ],
          },
        ],
      },
    },
  },

  // Medication Storage Audit
  medication_storage_audit: {
    id: "tpl-hs-med-storage",
    code: "medication_storage_audit",
    name: "Medication Storage Audit",
    category: "Health & Safety",
    status: "approved",
    description: "Audit of medication storage security and conditions",
    latest_version: {
      id: "v-med-storage-1",
      template_id: "tpl-hs-med-storage",
      version_number: 1,
      is_published: true,
      created_at: new Date().toISOString(),
      schema: {
        sections: [
          {
            id: "sec-storage",
            title: "Storage Audit",
            section_order: 1,
            fields: [
              {
                id: "f-audit-date",
                field_key: "audit_date",
                field_type: "date",
                label: "Audit Date",
                required: true,
                field_order: 1,
                section_id: "sec-storage",
              },
              {
                id: "f-locked-secure",
                field_key: "locked_secure",
                field_type: "yes_no",
                label: "Storage locked and secure",
                required: true,
                field_order: 2,
                section_id: "sec-storage",
              },
              {
                id: "f-temperature",
                field_key: "temperature_appropriate",
                field_type: "yes_no",
                label: "Temperature appropriate",
                required: true,
                field_order: 3,
                section_id: "sec-storage",
              },
              {
                id: "f-organized",
                field_key: "organized_labeled",
                field_type: "yes_no",
                label: "Medications organized and labeled",
                required: true,
                field_order: 4,
                section_id: "sec-storage",
              },
              {
                id: "f-expired",
                field_key: "no_expired_meds",
                field_type: "yes_no",
                label: "No expired medications",
                required: true,
                field_order: 5,
                section_id: "sec-storage",
              },
            ],
          },
        ],
      },
    },
  },
};

export const SAFER_RECRUITMENT_TEMPLATES: Record<string, FormTemplate> = {
  // Candidate Application Record
  candidate_application: {
    id: "tpl-rec-app",
    code: "candidate_application_record",
    name: "Candidate Application Record",
    category: "Safer Recruitment",
    status: "approved",
    description: "Record of candidate application",
    latest_version: {
      id: "v-app-1",
      template_id: "tpl-rec-app",
      version_number: 1,
      is_published: true,
      created_at: new Date().toISOString(),
      schema: {
        sections: [
          {
            id: "sec-candidate",
            title: "Candidate Information",
            section_order: 1,
            fields: [
              {
                id: "f-first-name",
                field_key: "first_name",
                field_type: "short_text",
                label: "First Name",
                required: true,
                field_order: 1,
                section_id: "sec-candidate",
              },
              {
                id: "f-last-name",
                field_key: "last_name",
                field_type: "short_text",
                label: "Last Name",
                required: true,
                field_order: 2,
                section_id: "sec-candidate",
              },
              {
                id: "f-email",
                field_key: "email",
                field_type: "short_text",
                label: "Email",
                required: true,
                field_order: 3,
                section_id: "sec-candidate",
              },
              {
                id: "f-phone",
                field_key: "phone",
                field_type: "short_text",
                label: "Phone",
                required: true,
                field_order: 4,
                section_id: "sec-candidate",
              },
              {
                id: "f-dob",
                field_key: "date_of_birth",
                field_type: "date",
                label: "Date of Birth",
                required: true,
                field_order: 5,
                section_id: "sec-candidate",
              },
            ],
          },
          {
            id: "sec-application",
            title: "Application Details",
            section_order: 2,
            fields: [
              {
                id: "f-position",
                field_key: "position_applied",
                field_type: "short_text",
                label: "Position Applied For",
                required: true,
                field_order: 1,
                section_id: "sec-application",
              },
              {
                id: "f-app-date",
                field_key: "application_date",
                field_type: "date",
                label: "Application Date",
                required: true,
                field_order: 2,
                section_id: "sec-application",
              },
              {
                id: "f-cover-letter",
                field_key: "cover_letter_summary",
                field_type: "long_text",
                label: "Cover Letter Summary",
                required: false,
                field_order: 3,
                section_id: "sec-application",
              },
            ],
          },
        ],
      },
    },
  },

  // Shortlisting Form
  shortlisting_form: {
    id: "tpl-rec-shortlist",
    code: "shortlisting_form",
    name: "Shortlisting Form",
    category: "Safer Recruitment",
    status: "approved",
    description: "Shortlisting assessment form",
    latest_version: {
      id: "v-shortlist-1",
      template_id: "tpl-rec-shortlist",
      version_number: 1,
      is_published: true,
      created_at: new Date().toISOString(),
      schema: {
        sections: [
          {
            id: "sec-assessment",
            title: "Shortlisting Assessment",
            section_order: 1,
            fields: [
              {
                id: "f-candidate-name",
                field_key: "candidate_name",
                field_type: "short_text",
                label: "Candidate Name",
                required: true,
                field_order: 1,
                section_id: "sec-assessment",
              },
              {
                id: "f-experience-score",
                field_key: "experience_score",
                field_type: "single_select",
                label: "Experience Score",
                required: true,
                options: [
                  { label: "Poor (1)", value: "1" },
                  { label: "Fair (2)", value: "2" },
                  { label: "Good (3)", value: "3" },
                  { label: "Excellent (4)", value: "4" },
                  { label: "Outstanding (5)", value: "5" },
                ],
                field_order: 2,
                section_id: "sec-assessment",
              },
              {
                id: "f-quals-score",
                field_key: "qualifications_score",
                field_type: "single_select",
                label: "Qualifications Score",
                required: true,
                options: [
                  { label: "Poor (1)", value: "1" },
                  { label: "Fair (2)", value: "2" },
                  { label: "Good (3)", value: "3" },
                  { label: "Excellent (4)", value: "4" },
                  { label: "Outstanding (5)", value: "5" },
                ],
                field_order: 3,
                section_id: "sec-assessment",
              },
              {
                id: "f-rec-shortlist",
                field_key: "recommend_shortlist",
                field_type: "yes_no",
                label: "Recommend for Shortlist?",
                required: true,
                field_order: 4,
                section_id: "sec-assessment",
              },
              {
                id: "f-comments",
                field_key: "comments",
                field_type: "long_text",
                label: "Comments",
                required: false,
                field_order: 5,
                section_id: "sec-assessment",
              },
            ],
          },
        ],
      },
    },
  },

  // Interview Scoring Form
  interview_scoring_form: {
    id: "tpl-rec-interview-score",
    code: "interview_scoring_form",
    name: "Interview Scoring Form",
    category: "Safer Recruitment",
    status: "approved",
    description: "Structured interview scoring",
    latest_version: {
      id: "v-interview-score-1",
      template_id: "tpl-rec-interview-score",
      version_number: 1,
      is_published: true,
      created_at: new Date().toISOString(),
      schema: {
        sections: [
          {
            id: "sec-scores",
            title: "Interview Scores",
            section_order: 1,
            fields: [
              {
                id: "f-candidate-name",
                field_key: "candidate_name",
                field_type: "short_text",
                label: "Candidate Name",
                required: true,
                field_order: 1,
                section_id: "sec-scores",
              },
              {
                id: "f-interview-date",
                field_key: "interview_date",
                field_type: "date",
                label: "Interview Date",
                required: true,
                field_order: 2,
                section_id: "sec-scores",
              },
              {
                id: "f-competence",
                field_key: "competence_score",
                field_type: "single_select",
                label: "Competence",
                required: true,
                options: [
                  { label: "1 - Poor", value: "1" },
                  { label: "2 - Fair", value: "2" },
                  { label: "3 - Good", value: "3" },
                  { label: "4 - Excellent", value: "4" },
                  { label: "5 - Outstanding", value: "5" },
                ],
                field_order: 3,
                section_id: "sec-scores",
              },
              {
                id: "f-values",
                field_key: "values_match_score",
                field_type: "single_select",
                label: "Values Match",
                required: true,
                options: [
                  { label: "1 - Poor", value: "1" },
                  { label: "2 - Fair", value: "2" },
                  { label: "3 - Good", value: "3" },
                  { label: "4 - Excellent", value: "4" },
                  { label: "5 - Outstanding", value: "5" },
                ],
                field_order: 4,
                section_id: "sec-scores",
              },
              {
                id: "f-safeguard",
                field_key: "safeguarding_awareness",
                field_type: "single_select",
                label: "Safeguarding Awareness",
                required: true,
                options: [
                  { label: "1 - Poor", value: "1" },
                  { label: "2 - Fair", value: "2" },
                  { label: "3 - Good", value: "3" },
                  { label: "4 - Excellent", value: "4" },
                  { label: "5 - Outstanding", value: "5" },
                ],
                field_order: 5,
                section_id: "sec-scores",
              },
              {
                id: "f-overall",
                field_key: "overall_recommendation",
                field_type: "single_select",
                label: "Overall Recommendation",
                required: true,
                options: [
                  { label: "Reject", value: "reject" },
                  { label: "Marginal", value: "marginal" },
                  { label: "Suitable", value: "suitable" },
                  { label: "Highly Suitable", value: "highly_suitable" },
                ],
                field_order: 6,
                section_id: "sec-scores",
              },
            ],
          },
        ],
      },
    },
  },

  // Reference Review Form
  reference_review_form: {
    id: "tpl-rec-ref-review",
    code: "reference_review_form",
    name: "Reference Review / Verification Form",
    category: "Safer Recruitment",
    status: "approved",
    description: "Review and verification of references",
    latest_version: {
      id: "v-ref-review-1",
      template_id: "tpl-rec-ref-review",
      version_number: 1,
      is_published: true,
      created_at: new Date().toISOString(),
      schema: {
        sections: [
          {
            id: "sec-reference",
            title: "Reference Verification",
            section_order: 1,
            fields: [
              {
                id: "f-candidate",
                field_key: "candidate_name",
                field_type: "short_text",
                label: "Candidate Name",
                required: true,
                field_order: 1,
                section_id: "sec-reference",
              },
              {
                id: "f-referee-name",
                field_key: "referee_name",
                field_type: "short_text",
                label: "Referee Name",
                required: true,
                field_order: 2,
                section_id: "sec-reference",
              },
              {
                id: "f-referee-role",
                field_key: "referee_role",
                field_type: "short_text",
                label: "Referee Role/Title",
                required: true,
                field_order: 3,
                section_id: "sec-reference",
              },
              {
                id: "f-received",
                field_key: "reference_received",
                field_type: "yes_no",
                label: "Reference Received",
                required: true,
                field_order: 4,
                section_id: "sec-reference",
              },
              {
                id: "f-verified",
                field_key: "verified",
                field_type: "yes_no",
                label: "Verified/Satisfactory",
                required: true,
                field_order: 5,
                section_id: "sec-reference",
              },
              {
                id: "f-concerns",
                field_key: "concerns_noted",
                field_type: "long_text",
                label: "Any Concerns Noted",
                required: false,
                field_order: 6,
                section_id: "sec-reference",
              },
            ],
          },
        ],
      },
    },
  },

  // DBS Tracking Record
  dbs_tracking_record: {
    id: "tpl-rec-dbs",
    code: "dbs_tracking_record",
    name: "DBS Tracking Record",
    category: "Safer Recruitment",
    status: "approved",
    description: "Track DBS check application and results",
    latest_version: {
      id: "v-dbs-1",
      template_id: "tpl-rec-dbs",
      version_number: 1,
      is_published: true,
      created_at: new Date().toISOString(),
      schema: {
        sections: [
          {
            id: "sec-dbs",
            title: "DBS Check Tracking",
            section_order: 1,
            fields: [
              {
                id: "f-candidate",
                field_key: "candidate_name",
                field_type: "short_text",
                label: "Candidate Name",
                required: true,
                field_order: 1,
                section_id: "sec-dbs",
              },
              {
                id: "f-dbs-type",
                field_key: "dbs_type",
                field_type: "single_select",
                label: "DBS Check Type",
                required: true,
                options: [
                  { label: "Standard", value: "standard" },
                  { label: "Enhanced", value: "enhanced" },
                  { label: "Enhanced with Barred List", value: "enhanced_barred" },
                ],
                field_order: 2,
                section_id: "sec-dbs",
              },
              {
                id: "f-app-date",
                field_key: "application_date",
                field_type: "date",
                label: "Application Date",
                required: true,
                field_order: 3,
                section_id: "sec-dbs",
              },
              {
                id: "f-ref-number",
                field_key: "reference_number",
                field_type: "short_text",
                label: "Reference Number",
                required: false,
                field_order: 4,
                section_id: "sec-dbs",
              },
              {
                id: "f-result-date",
                field_key: "result_date",
                field_type: "date",
                label: "Result Date",
                required: false,
                field_order: 5,
                section_id: "sec-dbs",
              },
              {
                id: "f-result",
                field_key: "result",
                field_type: "single_select",
                label: "Result",
                required: false,
                options: [
                  { label: "Clear", value: "clear" },
                  { label: "On List", value: "on_list" },
                  { label: "Pending", value: "pending" },
                  { label: "Awaited", value: "awaited" },
                ],
                field_order: 6,
                section_id: "sec-dbs",
              },
            ],
          },
        ],
      },
    },
  },
};

export const PHASE3_TEMPLATES = {
  ...HEALTH_SAFETY_TEMPLATES,
  ...SAFER_RECRUITMENT_TEMPLATES,
};

const REQUIRED_HS_TEMPLATE_NAMES = [
  "Daily Health & Safety Check",
  "Weekly Health & Safety Audit",
  "Monthly Manager Health & Safety Audit",
  "Room / Environment Check",
  "Fire Alarm Test Record",
  "Fire Drill Record",
  "Emergency Lighting Check",
  "Smoke Alarm Check",
  "First Aid Kit Check",
  "Kitchen Safety Check",
  "Food Hygiene Check",
  "Fridge / Freezer Temperature Log",
  "COSHH Check",
  "Cleaning Schedule and Sign-off",
  "Maintenance Issue Report",
  "Contractor Visit Record",
  "Accident / Near Miss Report",
  "Infection Control Check",
  "Water Temperature / Legionella Check",
  "Window / Door Security Check",
  "Vehicle Check",
  "Transport Risk Assessment",
  "Out of Hours Safety Check",
  "Premises Opening / Closing Checklist",
  "Medication Storage Audit",
] as const;

const REQUIRED_RECRUITMENT_TEMPLATE_NAMES = [
  "Vacancy Approval Form",
  "Job Description Record",
  "Person Specification Record",
  "Candidate Application Record",
  "Shortlisting Form",
  "Interview Questions Template",
  "Interview Scoring Form",
  "Interview Outcome Record",
  "Safer Recruitment Checklist",
  "Employment History Check Form",
  "Gap in Employment Review Form",
  "Identity Check Record",
  "Right to Work Check",
  "DBS Tracking Record",
  "Reference Request Record",
  "Reference Review / Verification Form",
  "Qualification Check Record",
  "Registration / Professional Body Check Form",
  "Risk Assessment for Any Recruitment Concern",
  "Offer Approval Form",
  "Conditional Offer Checklist",
  "Pre-Employment Compliance Checklist",
  "Induction Checklist",
  "Probation Tracking Form",
] as const;

function slugifyTemplateKey(name: string): string {
  return name
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/\//g, " ")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "_");
}

function createGeneratedTemplate(name: string, category: "Health & Safety" | "Safer Recruitment"): FormTemplate {
  const key = slugifyTemplateKey(name);
  const prefix = category === "Health & Safety" ? "hs" : "rec";

  return {
    id: `tpl-${prefix}-${key}`,
    code: key,
    name,
    category,
    status: "approved",
    description: `${name} template`,
    latest_version: {
      id: `v-${prefix}-${key}-1`,
      template_id: `tpl-${prefix}-${key}`,
      version_number: 1,
      is_published: true,
      created_at: new Date().toISOString(),
      schema: {
        sections: [
          {
            id: `sec-${key}-details`,
            title: "Record Details",
            section_order: 1,
            fields: [
              {
                id: `f-${key}-date`,
                field_key: "record_date",
                field_type: "date",
                label: "Date",
                required: true,
                field_order: 1,
                section_id: `sec-${key}-details`,
              },
              {
                id: `f-${key}-author`,
                field_key: "recorded_by",
                field_type: "short_text",
                label: "Recorded by",
                required: true,
                field_order: 2,
                section_id: `sec-${key}-details`,
              },
              {
                id: `f-${key}-summary`,
                field_key: "summary",
                field_type: "ai_assisted_narrative",
                label: "Summary",
                required: true,
                field_order: 3,
                section_id: `sec-${key}-details`,
              },
            ],
          },
          {
            id: `sec-${key}-compliance`,
            title: "Compliance & Evidence",
            section_order: 2,
            fields: [
              {
                id: `f-${key}-status`,
                field_key: "status",
                field_type: "single_select",
                label: "Status",
                required: true,
                options: [
                  { label: "Pass / Complete", value: "pass" },
                  { label: "Action Required", value: "action_required" },
                  { label: "Fail / Concern", value: "fail" },
                ],
                field_order: 1,
                section_id: `sec-${key}-compliance`,
              },
              {
                id: `f-${key}-severity`,
                field_key: "issue_severity",
                field_type: "single_select",
                label: "Issue Severity",
                options: [
                  { label: "Low", value: "low" },
                  { label: "Medium", value: "medium" },
                  { label: "High", value: "high" },
                  { label: "Critical", value: "critical" },
                ],
                field_order: 2,
                section_id: `sec-${key}-compliance`,
              },
              {
                id: `f-${key}-evidence`,
                field_key: "attachments",
                field_type: "file_upload",
                label: "Attachments / Photo Evidence",
                field_order: 3,
                section_id: `sec-${key}-compliance`,
              },
              {
                id: `f-${key}-maintenance`,
                field_key: "linked_maintenance_task",
                field_type: "short_text",
                label: "Linked Maintenance Task",
                field_order: 4,
                section_id: `sec-${key}-compliance`,
              },
            ],
          },
          {
            id: `sec-${key}-oversight`,
            title: "Management Oversight",
            section_order: 3,
            fields: [
              {
                id: `f-${key}-manager-review`,
                field_key: "manager_review",
                field_type: "long_text",
                label: "Manager Commentary",
                field_order: 1,
                section_id: `sec-${key}-oversight`,
              },
              {
                id: `f-${key}-audit-history`,
                field_key: "audit_history",
                field_type: "long_text",
                label: "Audit History Notes",
                field_order: 2,
                section_id: `sec-${key}-oversight`,
              },
            ],
          },
        ],
      },
    },
  };
}

const existingHsCodes = new Set(Object.values(HEALTH_SAFETY_TEMPLATES).map((t) => t.code));
const existingRecruitmentCodes = new Set(Object.values(SAFER_RECRUITMENT_TEMPLATES).map((t) => t.code));

const GENERATED_HEALTH_SAFETY_TEMPLATES: Record<string, FormTemplate> = REQUIRED_HS_TEMPLATE_NAMES.reduce(
  (acc, name) => {
    const key = slugifyTemplateKey(name);
    if (!existingHsCodes.has(key)) {
      acc[key] = createGeneratedTemplate(name, "Health & Safety");
    }
    return acc;
  },
  {} as Record<string, FormTemplate>
);

const GENERATED_RECRUITMENT_TEMPLATES: Record<string, FormTemplate> = REQUIRED_RECRUITMENT_TEMPLATE_NAMES.reduce(
  (acc, name) => {
    const key = slugifyTemplateKey(name);
    if (!existingRecruitmentCodes.has(key)) {
      acc[key] = createGeneratedTemplate(name, "Safer Recruitment");
    }
    return acc;
  },
  {} as Record<string, FormTemplate>
);

export const COMPLETE_HEALTH_SAFETY_TEMPLATES: Record<string, FormTemplate> = {
  ...HEALTH_SAFETY_TEMPLATES,
  ...GENERATED_HEALTH_SAFETY_TEMPLATES,
};

export const COMPLETE_SAFER_RECRUITMENT_TEMPLATES: Record<string, FormTemplate> = {
  ...SAFER_RECRUITMENT_TEMPLATES,
  ...GENERATED_RECRUITMENT_TEMPLATES,
};

export const PHASE3_TEMPLATES_COMPLETE = {
  ...COMPLETE_HEALTH_SAFETY_TEMPLATES,
  ...COMPLETE_SAFER_RECRUITMENT_TEMPLATES,
};

export const HEALTH_SAFETY_LIST = Object.values(COMPLETE_HEALTH_SAFETY_TEMPLATES);
export const SAFER_RECRUITMENT_LIST = Object.values(COMPLETE_SAFER_RECRUITMENT_TEMPLATES);
