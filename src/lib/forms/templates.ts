import type { FormTemplate } from "@/lib/forms/types";
import { PHASE3_TEMPLATES_COMPLETE } from "@/lib/forms/phase3-templates";
import { PHASE4_TEMPLATES } from "@/lib/forms/phase4-templates";
import { PHASE5_TEMPLATES } from "@/lib/forms/phase5-templates";

/**
 * Comprehensive form template library for Cornerstone Young People module
 * 70+ templates covering all aspects of child care record-keeping
 */

const CORE_FORM_TEMPLATES: Record<string, FormTemplate> = {
  // ═══════════════════════════════════════════════════════════════════════════
  // DAILY OPERATIONS
  // ═══════════════════════════════════════════════════════════════════════════

  daily_log: {
    id: "tpl-daily-log",
    code: "daily_log",
    name: "Daily Log",
    category: "Daily Recording",
    status: "approved",
    description: "Daily recording of young person activity, wellbeing, and events",
    latest_version: {
      id: "v-daily-log-1",
      template_id: "tpl-daily-log",
      version_number: 1,
      is_published: true,
      created_at: new Date().toISOString(),
      schema: {
        sections: [
          {
            id: "sec-date",
            title: "Date & Time",
            section_order: 1,
            fields: [
              {
                id: "f-date",
                field_key: "log_date",
                field_type: "date",
                label: "Date",
                required: true,
                field_order: 1,
                section_id: "sec-date",
              },
              {
                id: "f-staff",
                field_key: "staff_member",
                field_type: "short_text",
                label: "Recorded by",
                required: true,
                field_order: 2,
                section_id: "sec-date",
              },
            ],
          },
          {
            id: "sec-wellbeing",
            title: "Wellbeing & Mood",
            section_order: 2,
            fields: [
              {
                id: "f-mood",
                field_key: "mood",
                field_type: "single_select",
                label: "Overall Mood",
                required: true,
                options: [
                  { label: "Very Happy", value: "very_happy" },
                  { label: "Happy", value: "happy" },
                  { label: "Neutral", value: "neutral" },
                  { label: "Upset", value: "upset" },
                  { label: "Very Upset", value: "very_upset" },
                ],
                field_order: 1,
                section_id: "sec-wellbeing",
              },
              {
                id: "f-health",
                field_key: "health_status",
                field_type: "single_select",
                label: "Health",
                required: false,
                options: [
                  { label: "Good", value: "good" },
                  { label: "Unwell", value: "unwell" },
                  { label: "Injured", value: "injured" },
                  { label: "Medical appointment", value: "appointment" },
                ],
                field_order: 2,
                section_id: "sec-wellbeing",
              },
              {
                id: "f-wellbeing-notes",
                field_key: "wellbeing_notes",
                field_type: "ai_assisted_narrative",
                label: "Wellbeing Notes",
                help_text: "Describe how the young person is doing today.",
                field_order: 3,
                section_id: "sec-wellbeing",
              },
            ],
          },
          {
            id: "sec-activities",
            title: "Activities & Engagement",
            section_order: 3,
            fields: [
              {
                id: "f-activities",
                field_key: "activities",
                field_type: "long_text",
                label: "What did they do today?",
                placeholder: "e.g., School, sports, hobbies, time with friends...",
                field_order: 1,
                section_id: "sec-activities",
              },
              {
                id: "f-engagement",
                field_key: "engagement_level",
                field_type: "single_select",
                label: "Engagement Level",
                options: [
                  { label: "Fully engaged", value: "high" },
                  { label: "Somewhat engaged", value: "medium" },
                  { label: "Withdrawn", value: "low" },
                ],
                field_order: 2,
                section_id: "sec-activities",
              },
            ],
          },
        ],
      },
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // INCIDENTS & SAFEGUARDING
  // ═══════════════════════════════════════════════════════════════════════════

  incident_report: {
    id: "tpl-incident-report",
    code: "incident_report",
    name: "Incident Report",
    category: "Incident / Safeguarding",
    status: "approved",
    description: "Report of a significant incident or concern",
    latest_version: {
      id: "v-incident-report-1",
      template_id: "tpl-incident-report",
      version_number: 1,
      is_published: true,
      created_at: new Date().toISOString(),
      schema: {
        sections: [
          {
            id: "sec-incident-type",
            title: "Incident Type",
            section_order: 1,
            fields: [
              {
                id: "f-type",
                field_key: "incident_type",
                field_type: "single_select",
                label: "Type of Incident",
                required: true,
                options: [
                  { label: "Behaviour / Aggression", value: "aggression" },
                  { label: "Self Harm", value: "self_harm" },
                  { label: "Absconding", value: "absconding" },
                  { label: "Substance Use", value: "substance_use" },
                  { label: "Safeguarding Concern", value: "safeguarding" },
                  { label: "Accident / Injury", value: "accident" },
                  { label: "Other", value: "other" },
                ],
                field_order: 1,
                section_id: "sec-incident-type",
              },
            ],
          },
          {
            id: "sec-when",
            title: "When",
            section_order: 2,
            fields: [
              {
                id: "f-date",
                field_key: "incident_date",
                field_type: "datetime",
                label: "Date & Time",
                required: true,
                field_order: 1,
                section_id: "sec-when",
              },
              {
                id: "f-location",
                field_key: "location",
                field_type: "short_text",
                label: "Location",
                required: true,
                field_order: 2,
                section_id: "sec-when",
              },
            ],
          },
          {
            id: "sec-narrative",
            title: "What Happened",
            section_order: 3,
            fields: [
              {
                id: "f-narrative",
                field_key: "narrative",
                field_type: "ai_assisted_narrative",
                label: "Factual Account",
                help_text: "Provide a clear objective account of what happened.",
                required: true,
                field_order: 1,
                section_id: "sec-narrative",
              },
            ],
          },
        ],
      },
    },
  },

  safeguarding_concern: {
    id: "tpl-safeguarding",
    code: "safeguarding_concern",
    name: "Safeguarding Concern",
    category: "Incident / Safeguarding",
    status: "approved",
    description: "Report of a potential safeguarding concern",
    latest_version: {
      id: "v-safeguarding-1",
      template_id: "tpl-safeguarding",
      version_number: 1,
      is_published: true,
      created_at: new Date().toISOString(),
      schema: {
        sections: [
          {
            id: "sec-concern",
            title: "Concern Details",
            section_order: 1,
            fields: [
              {
                id: "f-concern-type",
                field_key: "concern_type",
                field_type: "multi_select",
                label: "Type of Concern",
                options: [
                  { label: "Physical Abuse", value: "physical_abuse" },
                  { label: "Emotional Abuse", value: "emotional_abuse" },
                  { label: "Sexual Abuse", value: "sexual_abuse" },
                  { label: "Neglect", value: "neglect" },
                  { label: "Exploitation", value: "exploitation" },
                  { label: "CSE", value: "cse" },
                  { label: "Radicalisation", value: "radicalisation" },
                ],
                required: true,
                field_order: 1,
                section_id: "sec-concern",
              },
              {
                id: "f-description",
                field_key: "description",
                field_type: "ai_assisted_narrative",
                label: "Description",
                help_text: "What has caused your concern?",
                required: true,
                field_order: 2,
                section_id: "sec-concern",
              },
            ],
          },
        ],
      },
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // CARE PLANNING
  // ═══════════════════════════════════════════════════════════════════════════

  placement_plan: {
    id: "tpl-placement-plan",
    code: "placement_plan",
    name: "Placement Plan",
    category: "Care Planning",
    status: "approved",
    description: "Plan for the child's placement",
    latest_version: {
      id: "v-placement-plan-1",
      template_id: "tpl-placement-plan",
      version_number: 1,
      is_published: true,
      created_at: new Date().toISOString(),
      schema: {
        sections: [
          {
            id: "sec-objectives",
            title: "Placement Objectives",
            section_order: 1,
            fields: [
              {
                id: "f-objectives",
                field_key: "objectives",
                field_type: "long_text",
                label: "What are we hoping to achieve?",
                required: true,
                field_order: 1,
                section_id: "sec-objectives",
              },
              {
                id: "f-duration",
                field_key: "expected_duration",
                field_type: "short_text",
                label: "Expected Duration",
                field_order: 2,
                section_id: "sec-objectives",
              },
            ],
          },
        ],
      },
    },
  },

  behaviour_support_plan: {
    id: "tpl-behaviour-support",
    code: "behaviour_support_plan",
    name: "Behaviour Support Plan",
    category: "Care Planning",
    status: "approved",
    description: "Plan to support positive behaviour",
    latest_version: {
      id: "v-behaviour-support-1",
      template_id: "tpl-behaviour-support",
      version_number: 1,
      is_published: true,
      created_at: new Date().toISOString(),
      schema: {
        sections: [
          {
            id: "sec-triggers",
            title: "Identified Triggers",
            section_order: 1,
            fields: [
              {
                id: "f-triggers",
                field_key: "triggers",
                field_type: "long_text",
                label: "What triggers challenging behaviour?",
                required: true,
                field_order: 1,
                section_id: "sec-triggers",
              },
            ],
          },
          {
            id: "sec-strategies",
            title: "Support Strategies",
            section_order: 2,
            fields: [
              {
                id: "f-strategies",
                field_key: "strategies",
                field_type: "long_text",
                label: "How should we support?",
                required: true,
                field_order: 1,
                section_id: "sec-strategies",
              },
            ],
          },
        ],
      },
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // HEALTH & MEDICATION
  // ═══════════════════════════════════════════════════════════════════════════

  health_appointment: {
    id: "tpl-health-appt",
    code: "health_appointment",
    name: "Health Appointment",
    category: "Health",
    status: "approved",
    description: "Record of health appointment or check",
    latest_version: {
      id: "v-health-appt-1",
      template_id: "tpl-health-appt",
      version_number: 1,
      is_published: true,
      created_at: new Date().toISOString(),
      schema: {
        sections: [
          {
            id: "sec-appointment",
            title: "Appointment Details",
            section_order: 1,
            fields: [
              {
                id: "f-type",
                field_key: "appointment_type",
                field_type: "single_select",
                label: "Type",
                options: [
                  { label: "GP", value: "gp" },
                  { label: "Dentist", value: "dentist" },
                  { label: "Optician", value: "optician" },
                  { label: "Specialist", value: "specialist" },
                  { label: "Mental Health", value: "mental_health" },
                ],
                required: true,
                field_order: 1,
                section_id: "sec-appointment",
              },
              {
                id: "f-date",
                field_key: "appointment_date",
                field_type: "datetime",
                label: "Date & Time",
                required: true,
                field_order: 2,
                section_id: "sec-appointment",
              },
              {
                id: "f-outcome",
                field_key: "outcome",
                field_type: "long_text",
                label: "Outcome",
                required: true,
                field_order: 3,
                section_id: "sec-appointment",
              },
            ],
          },
        ],
      },
    },
  },

  medication_administration: {
    id: "tpl-medication-admin",
    code: "medication_administration",
    name: "Medication Administration",
    category: "Health",
    status: "approved",
    description: "Record of medication given",
    latest_version: {
      id: "v-medication-1",
      template_id: "tpl-medication-admin",
      version_number: 1,
      is_published: true,
      created_at: new Date().toISOString(),
      schema: {
        sections: [
          {
            id: "sec-med",
            title: "Medication",
            section_order: 1,
            fields: [
              {
                id: "f-med-name",
                field_key: "medication_name",
                field_type: "short_text",
                label: "Medication Name",
                required: true,
                field_order: 1,
                section_id: "sec-med",
              },
              {
                id: "f-dose",
                field_key: "dose",
                field_type: "short_text",
                label: "Dose",
                required: true,
                field_order: 2,
                section_id: "sec-med",
              },
              {
                id: "f-time",
                field_key: "time_given",
                field_type: "time",
                label: "Time Given",
                required: true,
                field_order: 3,
                section_id: "sec-med",
              },
              {
                id: "f-staff",
                field_key: "administered_by",
                field_type: "short_text",
                label: "Administered by",
                required: true,
                field_order: 4,
                section_id: "sec-med",
              },
            ],
          },
        ],
      },
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // EDUCATION & TRAINING
  // ═══════════════════════════════════════════════════════════════════════════

  education_attendance: {
    id: "tpl-education-attend",
    code: "education_attendance",
    name: "Education Attendance",
    category: "Education",
    status: "approved",
    description: "Record of school attendance",
    latest_version: {
      id: "v-education-1",
      template_id: "tpl-education-attend",
      version_number: 1,
      is_published: true,
      created_at: new Date().toISOString(),
      schema: {
        sections: [
          {
            id: "sec-attendance",
            title: "Attendance",
            section_order: 1,
            fields: [
              {
                id: "f-date",
                field_key: "attendance_date",
                field_type: "date",
                label: "Date",
                required: true,
                field_order: 1,
                section_id: "sec-attendance",
              },
              {
                id: "f-attended",
                field_key: "attended",
                field_type: "yes_no",
                label: "Attended School?",
                required: true,
                field_order: 2,
                section_id: "sec-attendance",
              },
              {
                id: "f-reason",
                field_key: "reason_if_absent",
                field_type: "short_text",
                label: "If absent, why?",
                conditional_rules: [
                  {
                    type: "show",
                    when: {
                      fieldKey: "attended",
                      operator: "equals",
                      value: false,
                    },
                  },
                ],
                field_order: 3,
                section_id: "sec-attendance",
              },
              {
                id: "f-notes",
                field_key: "notes",
                field_type: "long_text",
                label: "Notes",
                field_order: 4,
                section_id: "sec-attendance",
              },
            ],
          },
        ],
      },
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // MISSING & ABSENCE
  // ═══════════════════════════════════════════════════════════════════════════

  missing_episode: {
    id: "tpl-missing-episode",
    code: "missing_episode",
    name: "Missing Episode",
    category: "Incident / Safeguarding",
    status: "approved",
    description: "Report of young person missing from home",
    latest_version: {
      id: "v-missing-1",
      template_id: "tpl-missing-episode",
      version_number: 1,
      is_published: true,
      created_at: new Date().toISOString(),
      schema: {
        sections: [
          {
            id: "sec-episode",
            title: "Missing Episode",
            section_order: 1,
            fields: [
              {
                id: "f-time-left",
                field_key: "time_left",
                field_type: "datetime",
                label: "Time Left",
                required: true,
                field_order: 1,
                section_id: "sec-episode",
              },
              {
                id: "f-time-returned",
                field_key: "time_returned",
                field_type: "datetime",
                label: "Time Returned",
                field_order: 2,
                section_id: "sec-episode",
              },
              {
                id: "f-location",
                field_key: "last_known_location",
                field_type: "short_text",
                label: "Last Known Location",
                field_order: 3,
                section_id: "sec-episode",
              },
            ],
          },
        ],
      },
    },
  },

  absence_notification: {
    id: "tpl-absence-notif",
    code: "absence_notification",
    name: "Absence Notification",
    category: "Absence",
    status: "approved",
    description: "Notify of young person absence",
    latest_version: {
      id: "v-absence-1",
      template_id: "tpl-absence-notif",
      version_number: 1,
      is_published: true,
      created_at: new Date().toISOString(),
      schema: {
        sections: [
          {
            id: "sec-absence",
            title: "Absence Details",
            section_order: 1,
            fields: [
              {
                id: "f-from",
                field_key: "absence_from",
                field_type: "date",
                label: "From Date",
                required: true,
                field_order: 1,
                section_id: "sec-absence",
              },
              {
                id: "f-to",
                field_key: "absence_to",
                field_type: "date",
                label: "To Date",
                field_order: 2,
                section_id: "sec-absence",
              },
              {
                id: "f-reason",
                field_key: "reason",
                field_type: "single_select",
                label: "Reason",
                options: [
                  { label: "Holiday", value: "holiday" },
                  { label: "Family contact", value: "family" },
                  { label: "Medical", value: "medical" },
                  { label: "Court", value: "court" },
                  { label: "Other", value: "other" },
                ],
                required: true,
                field_order: 3,
                section_id: "sec-absence",
              },
            ],
          },
        ],
      },
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // CONTACTS & COMMUNICATION
  // ═══════════════════════════════════════════════════════════════════════════

  contact_log: {
    id: "tpl-contact-log",
    code: "contact_log",
    name: "Contact Log",
    category: "Communication",
    status: "approved",
    description: "Record of contact with family or professionals",
    latest_version: {
      id: "v-contact-1",
      template_id: "tpl-contact-log",
      version_number: 1,
      is_published: true,
      created_at: new Date().toISOString(),
      schema: {
        sections: [
          {
            id: "sec-contact",
            title: "Contact Details",
            section_order: 1,
            fields: [
              {
                id: "f-contact-type",
                field_key: "contact_type",
                field_type: "single_select",
                label: "Type of Contact",
                options: [
                  { label: "Phone Call", value: "phone" },
                  { label: "Email", value: "email" },
                  { label: "Face to Face", value: "f2f" },
                  { label: "Video Call", value: "video" },
                ],
                required: true,
                field_order: 1,
                section_id: "sec-contact",
              },
              {
                id: "f-with-whom",
                field_key: "contact_with",
                field_type: "short_text",
                label: "Contact with",
                required: true,
                field_order: 2,
                section_id: "sec-contact",
              },
              {
                id: "f-summary",
                field_key: "summary",
                field_type: "ai_assisted_narrative",
                label: "Summary",
                required: true,
                field_order: 3,
                section_id: "sec-contact",
              },
            ],
          },
        ],
      },
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // REVIEWS & ASSESSMENTS
  // ═══════════════════════════════════════════════════════════════════════════

  young_person_review: {
    id: "tpl-yp-review",
    code: "young_person_review",
    name: "Young Person Review",
    category: "Review",
    status: "approved",
    description: "Periodic review of young person progress",
    latest_version: {
      id: "v-review-1",
      template_id: "tpl-yp-review",
      version_number: 1,
      is_published: true,
      created_at: new Date().toISOString(),
      schema: {
        sections: [
          {
            id: "sec-progress",
            title: "Progress",
            section_order: 1,
            fields: [
              {
                id: "f-wellbeing",
                field_key: "wellbeing_summary",
                field_type: "long_text",
                label: "Wellbeing Summary",
                required: true,
                field_order: 1,
                section_id: "sec-progress",
              },
              {
                id: "f-achievements",
                field_key: "achievements",
                field_type: "long_text",
                label: "Achievements",
                required: true,
                field_order: 2,
                section_id: "sec-progress",
              },
              {
                id: "f-concerns",
                field_key: "ongoing_concerns",
                field_type: "long_text",
                label: "Ongoing Concerns",
                field_order: 3,
                section_id: "sec-progress",
              },
            ],
          },
        ],
      },
    },
  },

  risk_assessment: {
    id: "tpl-risk-assess",
    code: "risk_assessment",
    name: "Risk Assessment",
    category: "Assessment",
    status: "approved",
    description: "Assessment of risks to young person",
    latest_version: {
      id: "v-risk-1",
      template_id: "tpl-risk-assess",
      version_number: 1,
      is_published: true,
      created_at: new Date().toISOString(),
      schema: {
        sections: [
          {
            id: "sec-risks",
            title: "Identified Risks",
            section_order: 1,
            fields: [
              {
                id: "f-risk-type",
                field_key: "risk_types",
                field_type: "multi_select",
                label: "Types of Risk",
                options: [
                  { label: "Exploitation", value: "exploitation" },
                  { label: "Self Harm", value: "self_harm" },
                  { label: "Substance Use", value: "substance" },
                  { label: "Violence", value: "violence" },
                  { label: "Absconding", value: "absconding" },
                ],
                required: true,
                field_order: 1,
                section_id: "sec-risks",
              },
              {
                id: "f-mitigation",
                field_key: "mitigation_strategies",
                field_type: "long_text",
                label: "Mitigation Strategies",
                required: true,
                field_order: 2,
                section_id: "sec-risks",
              },
            ],
          },
        ],
      },
    },
  },
};

export const FORM_TEMPLATES: Record<string, FormTemplate> = {
  ...CORE_FORM_TEMPLATES,
  ...PHASE3_TEMPLATES_COMPLETE,
  ...PHASE4_TEMPLATES,
  ...PHASE5_TEMPLATES,
};

export const TEMPLATE_LIBRARY = Object.values(FORM_TEMPLATES);

export const TEMPLATES_BY_CATEGORY = TEMPLATE_LIBRARY.reduce(
  (acc, template) => {
    if (!acc[template.category]) {
      acc[template.category] = [];
    }
    acc[template.category].push(template);
    return acc;
  },
  {} as Record<string, FormTemplate[]>
);
