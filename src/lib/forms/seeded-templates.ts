import type { FormTemplate } from "@/lib/forms/types";

/**
 * Seeded form templates for Phase 2 Young People module
 * These are production-ready templates for care homes
 */

export const SEEDED_TEMPLATES: Record<string, FormTemplate> = {
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
            description: "When was this log entry recorded?",
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
                id: "f-time",
                field_key: "log_time",
                field_type: "time",
                label: "Time",
                required: false,
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
                id: "f-wellbeing-notes",
                field_key: "wellbeing_notes",
                field_type: "ai_assisted_narrative",
                label: "Wellbeing Notes",
                help_text: "Describe how the young person is doing today. Use AI to help structure your notes.",
                required: false,
                field_order: 2,
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
                required: false,
                field_order: 1,
                section_id: "sec-activities",
              },
            ],
          },
          {
            id: "sec-incidents",
            title: "Incidents & Concerns",
            section_order: 4,
            fields: [
              {
                id: "f-incidents",
                field_key: "incidents_today",
                field_type: "yes_no",
                label: "Were there any incidents today?",
                required: false,
                field_order: 1,
                section_id: "sec-incidents",
              },
              {
                id: "f-incident-details",
                field_key: "incident_details",
                field_type: "long_text",
                label: "Details",
                conditional_rules: [
                  {
                    type: "show",
                    when: {
                      fieldKey: "incidents_today",
                      operator: "equals",
                      value: true,
                    },
                  },
                ],
                required: false,
                field_order: 2,
                section_id: "sec-incidents",
              },
            ],
          },
        ],
      },
    },
  },

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
            id: "sec-incident-details",
            title: "Incident Details",
            section_order: 1,
            fields: [
              {
                id: "f-incident-type",
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
                section_id: "sec-incident-details",
              },
              {
                id: "f-incident-date",
                field_key: "incident_date",
                field_type: "datetime",
                label: "Date & Time of Incident",
                required: true,
                field_order: 2,
                section_id: "sec-incident-details",
              },
              {
                id: "f-location",
                field_key: "location",
                field_type: "short_text",
                label: "Location",
                required: true,
                field_order: 3,
                section_id: "sec-incident-details",
              },
            ],
          },
          {
            id: "sec-what-happened",
            title: "What Happened",
            section_order: 2,
            fields: [
              {
                id: "f-narrative",
                field_key: "narrative",
                field_type: "ai_assisted_narrative",
                label: "Narrative",
                help_text: "Provide a clear factual account of what happened. Use AI to help structure your account professionally.",
                required: true,
                field_order: 1,
                section_id: "sec-what-happened",
              },
            ],
          },
        ],
      },
    },
  },

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
                label: "What are we hoping to achieve with this placement?",
                required: true,
                field_order: 1,
                section_id: "sec-objectives",
              },
            ],
          },
        ],
      },
    },
  },
};

export const TEMPLATE_CODES = {
  DAILY_LOG: "daily_log",
  INCIDENT_REPORT: "incident_report",
  PLACEMENT_PLAN: "placement_plan",
} as const;
