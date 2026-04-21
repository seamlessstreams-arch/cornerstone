import { z } from "zod";

export const FORM_FIELD_TYPES = [
  "short_text",
  "long_text",
  "rich_text",
  "date",
  "time",
  "datetime",
  "number",
  "currency",
  "yes_no",
  "checkbox",
  "radio",
  "single_select",
  "multi_select",
  "tags",
  "checklist",
  "repeating_group",
  "risk_rating",
  "action_list",
  "staff_selector",
  "young_person_selector",
  "professional_selector",
  "home_selector",
  "file_upload",
  "image_upload",
  "document_upload",
  "voice_note_upload",
  "live_voice_transcript",
  "signature",
  "ai_assisted_narrative",
  "management_oversight_narrative",
  "evidence_verification",
] as const;

export type FormFieldType = (typeof FORM_FIELD_TYPES)[number];

export const FORM_STATUSES = [
  "draft",
  "in_progress",
  "submitted",
  "returned_for_amendment",
  "reviewed",
  "approved",
  "archived",
] as const;

export type FormStatus = (typeof FORM_STATUSES)[number];

export const VERIFICATION_STATUSES = [
  "pending",
  "viewed",
  "verified",
  "rejected",
  "superseded",
  "archived",
] as const;

export type VerificationStatus = (typeof VERIFICATION_STATUSES)[number];

export interface FormFieldOption {
  label: string;
  value: string;
  description?: string;
}

export interface FormFieldValidationRule {
  type: "required" | "min" | "max" | "pattern" | "email" | "url" | "custom";
  value?: string | number;
  message?: string;
}

export interface FormFieldConditionalRule {
  type: "show" | "hide" | "require" | "disable";
  when: {
    fieldKey: string;
    operator: "equals" | "not_equals" | "contains" | "gt" | "lt" | "is_empty" | "is_not_empty";
    value?: string | number | boolean;
  };
}

export interface FormField {
  id: string;
  field_key: string;
  field_type: FormFieldType;
  label: string;
  description?: string;
  help_text?: string;
  placeholder?: string;
  required?: boolean;
  default_value?: unknown;
  options?: FormFieldOption[];
  validation_rules?: FormFieldValidationRule[];
  conditional_rules?: FormFieldConditionalRule[];
  visibility_roles?: string[];
  field_order: number;
  section_id: string;
}

export interface FormSection {
  id: string;
  title: string;
  description?: string;
  section_order: number;
  visibility_rules?: Record<string, unknown>;
  fields: FormField[];
}

export interface FormTemplateVersion {
  id: string;
  template_id: string;
  version_number: number;
  schema: {
    sections: FormSection[];
    layout_config?: Record<string, unknown>;
  };
  is_published: boolean;
  created_at: string;
}

export interface FormTemplate {
  id: string;
  code: string;
  name: string;
  category: string;
  status: FormStatus;
  description?: string;
  latest_version?: FormTemplateVersion;
}

export interface FormRecordValue {
  field_key: string;
  value: unknown;
  previous_value?: unknown;
  changed_at: string;
}

export interface FormRecord {
  id: string;
  template_id: string;
  status: FormStatus;
  subject_type?: string;
  subject_id?: string;
  young_person_id?: string;
  values: Record<string, unknown>;
  submitted_at?: string;
  submitted_by?: string;
  created_at: string;
  created_by?: string;
  updated_at: string;
}

export interface ManagementOversight {
  id: string;
  form_record_id: string;
  manager_user_id: string;
  narrative: string;
  analysis?: string;
  what_went_well?: string;
  concerns_identified?: string;
  risk_implications?: string;
  areas_for_improvement?: string;
  actions_required?: string;
  action_timescale?: string;
  responsible_user_id?: string;
  safeguarding_escalation_needed: boolean;
  another_form_required: boolean;
  chronology_update_needed: boolean;
  supervision_follow_up_required: boolean;
  status: FormStatus;
  sign_off_status: "pending" | "approved" | "rejected";
  submitted_at?: string;
}

export const formFieldSchema = z.object({
  field_key: z.string().min(1),
  field_type: z.enum(FORM_FIELD_TYPES),
  label: z.string().min(1),
  description: z.string().optional(),
  help_text: z.string().optional(),
  required: z.boolean().default(false),
  default_value: z.unknown().optional(),
  options: z
    .array(
      z.object({
        label: z.string(),
        value: z.string(),
        description: z.string().optional(),
      })
    )
    .optional(),
  validation_rules: z
    .array(
      z.object({
        type: z.enum(["required", "min", "max", "pattern", "email", "url", "custom"]),
        value: z.union([z.string(), z.number()]).optional(),
        message: z.string().optional(),
      })
    )
    .optional(),
});

export const formRecordSchema = z.object({
  template_id: z.string().uuid(),
  status: z.enum(FORM_STATUSES).default("draft"),
  young_person_id: z.string().uuid().optional(),
  values: z.record(z.string(), z.unknown()),
});

export const managementOversightSchema = z.object({
  form_record_id: z.string().uuid(),
  narrative: z.string().min(10),
  analysis: z.string().optional(),
  what_went_well: z.string().optional(),
  concerns_identified: z.string().optional(),
  actions_required: z.string().optional(),
  safeguarding_escalation_needed: z.boolean().default(false),
});
