import type { FormTemplate } from "@/lib/forms/types";

/**
 * Phase 5 — Extended Operational & Clinical Form Templates
 * Covers: Staff Appraisal, Health Action Plan, Pathway Plan, Keyworker Session,
 * Family Contact Record, Sensory Profile, Trauma-Informed Assessment,
 * SMART Goals, Staff Wellness Check, and Young Person Risk Assessment.
 */

/** Convert a string array to FormFieldOption objects */
function opts(items: string[]) {
  return items.map((s) => ({ label: s, value: s.toLowerCase().replace(/[^a-z0-9]+/gi, "_").replace(/_+$/, "") }));
}

export const PHASE5_TEMPLATES: Record<string, FormTemplate> = {

  // ── 1. Staff Annual Appraisal ───────────────────────────────────────────────
  staff_appraisal: {
    id: "tpl-staff-appraisal",
    code: "staff_appraisal",
    name: "Staff Annual Appraisal",
    category: "Staff & HR",
    status: "approved",
    description: "Structured annual appraisal covering performance, development, and wellbeing",
    latest_version: {
      id: "v-staff-appraisal-1",
      template_id: "tpl-staff-appraisal",
      version_number: 1,
      is_published: true,
      created_at: new Date().toISOString(),
      schema: {
        sections: [
          {
            id: "sec-appr-details",
            title: "Appraisal Details",
            section_order: 1,
            fields: [
              { id: "f-appr-staff", field_key: "staff_member", field_type: "staff_selector", label: "Staff Member", required: true, field_order: 1, section_id: "sec-appr-details" },
              { id: "f-appr-manager", field_key: "appraising_manager", field_type: "staff_selector", label: "Appraising Manager", required: true, field_order: 2, section_id: "sec-appr-details" },
              { id: "f-appr-date", field_key: "appraisal_date", field_type: "date", label: "Appraisal Date", required: true, field_order: 3, section_id: "sec-appr-details" },
              { id: "f-appr-period", field_key: "review_period", field_type: "short_text", label: "Review Period (e.g. April 2025 – April 2026)", required: true, field_order: 4, section_id: "sec-appr-details" },
            ],
          },
          {
            id: "sec-appr-performance",
            title: "Performance Review",
            section_order: 2,
            fields: [
              { id: "f-appr-prev-objectives", field_key: "previous_objectives_review", field_type: "ai_assisted_narrative", label: "Review of Previous Objectives", placeholder: "How did the staff member perform against last year's objectives?", required: true, field_order: 1, section_id: "sec-appr-performance" },
              { id: "f-appr-strengths", field_key: "key_strengths", field_type: "ai_assisted_narrative", label: "Key Strengths", placeholder: "Areas where the staff member has demonstrated excellence", required: true, field_order: 2, section_id: "sec-appr-performance" },
              { id: "f-appr-development", field_key: "development_areas", field_type: "ai_assisted_narrative", label: "Development Areas", placeholder: "Areas for growth and improvement", required: true, field_order: 3, section_id: "sec-appr-performance" },
              { id: "f-appr-rating", field_key: "overall_performance_rating", field_type: "single_select", label: "Overall Performance Rating", required: true, field_order: 4, section_id: "sec-appr-performance", options: opts(["Exceptional", "Meets Expectations", "Needs Improvement", "Unsatisfactory"]) },
            ],
          },
          {
            id: "sec-appr-training",
            title: "Training & Development",
            section_order: 3,
            fields: [
              { id: "f-appr-training-completed", field_key: "training_completed", field_type: "long_text", label: "Training Completed This Year", required: false, field_order: 1, section_id: "sec-appr-training" },
              { id: "f-appr-training-needs", field_key: "training_needs_identified", field_type: "long_text", label: "Training Needs Identified", required: true, field_order: 2, section_id: "sec-appr-training" },
              { id: "f-appr-qualifications", field_key: "qualification_aspirations", field_type: "long_text", label: "Qualification Aspirations", required: false, field_order: 3, section_id: "sec-appr-training" },
            ],
          },
          {
            id: "sec-appr-objectives",
            title: "New Objectives",
            section_order: 4,
            fields: [
              { id: "f-appr-new-obj", field_key: "new_objectives", field_type: "action_list", label: "Agreed Objectives for Coming Year", required: true, field_order: 1, section_id: "sec-appr-objectives" },
              { id: "f-appr-career", field_key: "career_aspirations", field_type: "long_text", label: "Career Aspirations (next 1–3 years)", required: false, field_order: 2, section_id: "sec-appr-objectives" },
            ],
          },
          {
            id: "sec-appr-wellbeing",
            title: "Wellbeing",
            section_order: 5,
            fields: [
              { id: "f-appr-wellbeing-rating", field_key: "wellbeing_rating", field_type: "risk_rating", label: "Current Wellbeing (1–10)", required: true, field_order: 1, section_id: "sec-appr-wellbeing" },
              { id: "f-appr-wellbeing-notes", field_key: "wellbeing_notes", field_type: "long_text", label: "Wellbeing Discussion Notes", required: false, field_order: 2, section_id: "sec-appr-wellbeing" },
              { id: "f-appr-support-needed", field_key: "support_needed", field_type: "long_text", label: "Support Needed from Management", required: false, field_order: 3, section_id: "sec-appr-wellbeing" },
            ],
          },
          {
            id: "sec-appr-sign",
            title: "Sign Off",
            section_order: 6,
            fields: [
              { id: "f-appr-staff-sig", field_key: "staff_signature", field_type: "signature", label: "Staff Member Signature", required: true, field_order: 1, section_id: "sec-appr-sign" },
              { id: "f-appr-mgr-sig", field_key: "manager_signature", field_type: "management_oversight_narrative", label: "Manager Comments & Signature", required: true, field_order: 2, section_id: "sec-appr-sign" },
            ],
          },
        ],
      },
    },
  },

  // ── 2. Health Action Plan ───────────────────────────────────────────────────
  health_action_plan: {
    id: "tpl-health-action-plan",
    code: "health_action_plan",
    name: "Health Action Plan",
    category: "Young People",
    status: "approved",
    description: "Comprehensive health action plan for a looked-after child covering physical and mental health needs",
    latest_version: {
      id: "v-health-action-plan-1",
      template_id: "tpl-health-action-plan",
      version_number: 1,
      is_published: true,
      created_at: new Date().toISOString(),
      schema: {
        sections: [
          {
            id: "sec-hap-yp",
            title: "Young Person Details",
            section_order: 1,
            fields: [
              { id: "f-hap-yp", field_key: "young_person", field_type: "young_person_selector", label: "Young Person", required: true, field_order: 1, section_id: "sec-hap-yp" },
              { id: "f-hap-dob", field_key: "date_of_birth", field_type: "date", label: "Date of Birth", required: true, field_order: 2, section_id: "sec-hap-yp" },
              { id: "f-hap-date", field_key: "plan_date", field_type: "date", label: "Date of Plan", required: true, field_order: 3, section_id: "sec-hap-yp" },
              { id: "f-hap-review-date", field_key: "review_date", field_type: "date", label: "Review Date", required: true, field_order: 4, section_id: "sec-hap-yp" },
            ],
          },
          {
            id: "sec-hap-physical",
            title: "Physical Health",
            section_order: 2,
            fields: [
              { id: "f-hap-gp", field_key: "gp_details", field_type: "short_text", label: "GP Name & Practice", required: true, field_order: 1, section_id: "sec-hap-physical" },
              { id: "f-hap-dentist", field_key: "dentist_details", field_type: "short_text", label: "Dentist Details", required: false, field_order: 2, section_id: "sec-hap-physical" },
              { id: "f-hap-optician", field_key: "optician_details", field_type: "short_text", label: "Optician Details", required: false, field_order: 3, section_id: "sec-hap-physical" },
              { id: "f-hap-allergies", field_key: "allergies_conditions", field_type: "long_text", label: "Known Allergies and Medical Conditions", required: true, field_order: 4, section_id: "sec-hap-physical" },
              { id: "f-hap-meds", field_key: "current_medications", field_type: "long_text", label: "Current Medications", required: true, field_order: 5, section_id: "sec-hap-physical" },
              { id: "f-hap-immunisations", field_key: "immunisations_up_to_date", field_type: "yes_no", label: "Immunisations Up to Date?", required: true, field_order: 6, section_id: "sec-hap-physical" },
            ],
          },
          {
            id: "sec-hap-mental",
            title: "Emotional & Mental Health",
            section_order: 3,
            fields: [
              { id: "f-hap-camhs", field_key: "camhs_involvement", field_type: "yes_no", label: "CAMHS Involvement?", required: true, field_order: 1, section_id: "sec-hap-mental" },
              { id: "f-hap-camhs-details", field_key: "camhs_details", field_type: "long_text", label: "CAMHS Details (if applicable)", required: false, field_order: 2, section_id: "sec-hap-mental" },
              { id: "f-hap-emotional-needs", field_key: "emotional_needs_summary", field_type: "ai_assisted_narrative", label: "Emotional & Mental Health Needs Summary", placeholder: "Describe known mental health needs, current support, and observed emotional patterns", required: true, field_order: 3, section_id: "sec-hap-mental" },
            ],
          },
          {
            id: "sec-hap-actions",
            title: "Actions & Goals",
            section_order: 4,
            fields: [
              { id: "f-hap-health-goals", field_key: "health_goals", field_type: "action_list", label: "Health Goals and Actions", required: true, field_order: 1, section_id: "sec-hap-actions" },
              { id: "f-hap-barriers", field_key: "barriers_to_health", field_type: "long_text", label: "Known Barriers to Engaging with Health", required: false, field_order: 2, section_id: "sec-hap-actions" },
            ],
          },
          {
            id: "sec-hap-sign",
            title: "Sign Off",
            section_order: 5,
            fields: [
              { id: "f-hap-completed-by", field_key: "completed_by", field_type: "staff_selector", label: "Completed By", required: true, field_order: 1, section_id: "sec-hap-sign" },
              { id: "f-hap-sig", field_key: "signature", field_type: "signature", label: "Signature", required: true, field_order: 2, section_id: "sec-hap-sign" },
            ],
          },
        ],
      },
    },
  },

  // ── 3. Keyworker Session Record ─────────────────────────────────────────────
  keyworker_session: {
    id: "tpl-keyworker-session",
    code: "keyworker_session",
    name: "Keyworker Session Record",
    category: "Young People",
    status: "approved",
    description: "Record of a planned keyworker session with a young person",
    latest_version: {
      id: "v-keyworker-session-1",
      template_id: "tpl-keyworker-session",
      version_number: 1,
      is_published: true,
      created_at: new Date().toISOString(),
      schema: {
        sections: [
          {
            id: "sec-kw-details",
            title: "Session Details",
            section_order: 1,
            fields: [
              { id: "f-kw-yp", field_key: "young_person", field_type: "young_person_selector", label: "Young Person", required: true, field_order: 1, section_id: "sec-kw-details" },
              { id: "f-kw-worker", field_key: "keyworker", field_type: "staff_selector", label: "Keyworker", required: true, field_order: 2, section_id: "sec-kw-details" },
              { id: "f-kw-date", field_key: "session_date", field_type: "date", label: "Date of Session", required: true, field_order: 3, section_id: "sec-kw-details" },
              { id: "f-kw-duration", field_key: "duration_minutes", field_type: "number", label: "Duration (minutes)", required: true, field_order: 4, section_id: "sec-kw-details" },
              { id: "f-kw-type", field_key: "session_type", field_type: "single_select", label: "Session Type", required: true, field_order: 5, section_id: "sec-kw-details", options: opts(["Planned 1:1", "Informal check-in", "Crisis support", "Goals review", "Life story work", "Activity based"]) },
              { id: "f-kw-mood", field_key: "mood_at_start", field_type: "risk_rating", label: "Young Person's Mood at Start (1–10)", required: true, field_order: 6, section_id: "sec-kw-details" },
            ],
          },
          {
            id: "sec-kw-content",
            title: "Session Content",
            section_order: 2,
            fields: [
              { id: "f-kw-agenda", field_key: "agenda_topics", field_type: "long_text", label: "Agenda / Topics Discussed", required: true, field_order: 1, section_id: "sec-kw-content" },
              { id: "f-kw-voice", field_key: "young_persons_voice", field_type: "live_voice_transcript", label: "Young Person's Voice (verbatim where possible)", required: true, field_order: 2, section_id: "sec-kw-content" },
              { id: "f-kw-narrative", field_key: "session_narrative", field_type: "ai_assisted_narrative", label: "Session Narrative", placeholder: "What happened during the session, how did the young person engage, any disclosures or concerns?", required: true, field_order: 3, section_id: "sec-kw-content" },
            ],
          },
          {
            id: "sec-kw-outcomes",
            title: "Outcomes & Follow-up",
            section_order: 3,
            fields: [
              { id: "f-kw-outcomes", field_key: "outcomes_achieved", field_type: "long_text", label: "Outcomes Achieved / Progress Made", required: true, field_order: 1, section_id: "sec-kw-outcomes" },
              { id: "f-kw-actions", field_key: "agreed_actions", field_type: "action_list", label: "Agreed Actions and Follow-up", required: false, field_order: 2, section_id: "sec-kw-outcomes" },
              { id: "f-kw-concerns", field_key: "safeguarding_concerns", field_type: "yes_no", label: "Any Safeguarding Concerns Arising?", required: true, field_order: 3, section_id: "sec-kw-outcomes" },
              { id: "f-kw-next", field_key: "next_session_date", field_type: "date", label: "Next Session Date", required: false, field_order: 4, section_id: "sec-kw-outcomes" },
            ],
          },
          {
            id: "sec-kw-sign",
            title: "Sign Off",
            section_order: 4,
            fields: [
              { id: "f-kw-sig", field_key: "keyworker_signature", field_type: "signature", label: "Keyworker Signature", required: true, field_order: 1, section_id: "sec-kw-sign" },
            ],
          },
        ],
      },
    },
  },

  // ── 4. Family Contact Record ────────────────────────────────────────────────
  family_contact_record: {
    id: "tpl-family-contact-record",
    code: "family_contact_record",
    name: "Family Contact Record",
    category: "Young People",
    status: "approved",
    description: "Record of planned or supervised contact between a young person and their family",
    latest_version: {
      id: "v-family-contact-record-1",
      template_id: "tpl-family-contact-record",
      version_number: 1,
      is_published: true,
      created_at: new Date().toISOString(),
      schema: {
        sections: [
          {
            id: "sec-fc-details",
            title: "Contact Details",
            section_order: 1,
            fields: [
              { id: "f-fc-yp", field_key: "young_person", field_type: "young_person_selector", label: "Young Person", required: true, field_order: 1, section_id: "sec-fc-details" },
              { id: "f-fc-date", field_key: "contact_date", field_type: "date", label: "Date of Contact", required: true, field_order: 2, section_id: "sec-fc-details" },
              { id: "f-fc-start", field_key: "start_time", field_type: "time", label: "Start Time", required: true, field_order: 3, section_id: "sec-fc-details" },
              { id: "f-fc-end", field_key: "end_time", field_type: "time", label: "End Time", required: true, field_order: 4, section_id: "sec-fc-details" },
              { id: "f-fc-type", field_key: "contact_type", field_type: "single_select", label: "Contact Type", required: true, field_order: 5, section_id: "sec-fc-details", options: opts(["In person — supervised", "In person — unsupervised", "Video call", "Phone call", "Letter/card exchange", "Indirect"]) },
              { id: "f-fc-location", field_key: "location", field_type: "short_text", label: "Location", required: true, field_order: 6, section_id: "sec-fc-details" },
              { id: "f-fc-attendees", field_key: "family_members_present", field_type: "long_text", label: "Family Members / Others Present", required: true, field_order: 7, section_id: "sec-fc-details" },
              { id: "f-fc-supervisor", field_key: "supervising_staff", field_type: "staff_selector", label: "Supervising Staff Member", required: true, field_order: 8, section_id: "sec-fc-details" },
            ],
          },
          {
            id: "sec-fc-observations",
            title: "Contact Observations",
            section_order: 2,
            fields: [
              { id: "f-fc-yp-mood", field_key: "yp_mood_before", field_type: "risk_rating", label: "Young Person's Mood Before Contact (1–10)", required: true, field_order: 1, section_id: "sec-fc-observations" },
              { id: "f-fc-yp-mood-after", field_key: "yp_mood_after", field_type: "risk_rating", label: "Young Person's Mood After Contact (1–10)", required: true, field_order: 2, section_id: "sec-fc-observations" },
              { id: "f-fc-narrative", field_key: "contact_narrative", field_type: "ai_assisted_narrative", label: "Contact Narrative", placeholder: "What happened during contact? How did the young person present? How did family members interact?", required: true, field_order: 3, section_id: "sec-fc-observations" },
              { id: "f-fc-yp-voice", field_key: "young_persons_voice", field_type: "live_voice_transcript", label: "Young Person's Voice During Contact", required: false, field_order: 4, section_id: "sec-fc-observations" },
              { id: "f-fc-concerns", field_key: "safeguarding_concerns", field_type: "yes_no", label: "Any Safeguarding Concerns Arising?", required: true, field_order: 5, section_id: "sec-fc-observations" },
              { id: "f-fc-concern-detail", field_key: "concern_details", field_type: "long_text", label: "Concern Details (if applicable)", required: false, field_order: 6, section_id: "sec-fc-observations" },
            ],
          },
          {
            id: "sec-fc-recommendation",
            title: "Recommendation",
            section_order: 3,
            fields: [
              { id: "f-fc-future-rec", field_key: "future_contact_recommendation", field_type: "single_select", label: "Recommendation for Future Contact", required: true, field_order: 1, section_id: "sec-fc-recommendation", options: opts(["Continue as planned", "Increase frequency", "Reduce frequency", "Change format", "Suspend pending review", "Refer to SW for review"]) },
              { id: "f-fc-rec-notes", field_key: "recommendation_notes", field_type: "long_text", label: "Recommendation Notes", required: false, field_order: 2, section_id: "sec-fc-recommendation" },
            ],
          },
          {
            id: "sec-fc-sign",
            title: "Sign Off",
            section_order: 4,
            fields: [
              { id: "f-fc-sig", field_key: "supervisor_signature", field_type: "signature", label: "Supervisor Signature", required: true, field_order: 1, section_id: "sec-fc-sign" },
              { id: "f-fc-mgr", field_key: "manager_oversight", field_type: "management_oversight_narrative", label: "Manager Oversight", required: false, field_order: 2, section_id: "sec-fc-sign" },
            ],
          },
        ],
      },
    },
  },

  // ── 5. Sensory Profile ──────────────────────────────────────────────────────
  sensory_profile: {
    id: "tpl-sensory-profile",
    code: "sensory_profile",
    name: "Sensory Profile",
    category: "Young People",
    status: "approved",
    description: "Sensory needs assessment for a young person to inform trauma-informed care planning",
    latest_version: {
      id: "v-sensory-profile-1",
      template_id: "tpl-sensory-profile",
      version_number: 1,
      is_published: true,
      created_at: new Date().toISOString(),
      schema: {
        sections: [
          {
            id: "sec-sp-details",
            title: "Young Person & Date",
            section_order: 1,
            fields: [
              { id: "f-sp-yp", field_key: "young_person", field_type: "young_person_selector", label: "Young Person", required: true, field_order: 1, section_id: "sec-sp-details" },
              { id: "f-sp-date", field_key: "completed_date", field_type: "date", label: "Date Completed", required: true, field_order: 2, section_id: "sec-sp-details" },
              { id: "f-sp-completed-by", field_key: "completed_by", field_type: "staff_selector", label: "Completed By", required: true, field_order: 3, section_id: "sec-sp-details" },
              { id: "f-sp-yp-involvement", field_key: "yp_involvement", field_type: "yes_no", label: "Was the Young Person Involved?", required: true, field_order: 4, section_id: "sec-sp-details" },
            ],
          },
          {
            id: "sec-sp-sensory",
            title: "Sensory Sensitivities",
            section_order: 2,
            fields: [
              { id: "f-sp-visual", field_key: "visual_sensitivities", field_type: "long_text", label: "Visual Sensitivities (light, colour, screens)", required: false, field_order: 1, section_id: "sec-sp-sensory" },
              { id: "f-sp-auditory", field_key: "auditory_sensitivities", field_type: "long_text", label: "Auditory Sensitivities (noise, voices, music)", required: false, field_order: 2, section_id: "sec-sp-sensory" },
              { id: "f-sp-tactile", field_key: "tactile_sensitivities", field_type: "long_text", label: "Tactile Sensitivities (touch, textures, clothing)", required: false, field_order: 3, section_id: "sec-sp-sensory" },
              { id: "f-sp-taste-smell", field_key: "taste_smell_sensitivities", field_type: "long_text", label: "Taste & Smell Sensitivities", required: false, field_order: 4, section_id: "sec-sp-sensory" },
              { id: "f-sp-proprioceptive", field_key: "proprioceptive_vestibular", field_type: "long_text", label: "Movement & Body Awareness Needs", required: false, field_order: 5, section_id: "sec-sp-sensory" },
            ],
          },
          {
            id: "sec-sp-calming",
            title: "Calming & Regulating Strategies",
            section_order: 3,
            fields: [
              { id: "f-sp-calming", field_key: "calming_strategies", field_type: "ai_assisted_narrative", label: "Known Calming Strategies", placeholder: "What helps this young person regulate? Include environment, activities, and interactions", required: true, field_order: 1, section_id: "sec-sp-calming" },
              { id: "f-sp-triggers", field_key: "sensory_triggers", field_type: "long_text", label: "Known Sensory Triggers", required: true, field_order: 2, section_id: "sec-sp-calming" },
              { id: "f-sp-environment", field_key: "preferred_environment", field_type: "long_text", label: "Preferred Environment Adjustments", required: false, field_order: 3, section_id: "sec-sp-calming" },
            ],
          },
          {
            id: "sec-sp-actions",
            title: "Care Planning Actions",
            section_order: 4,
            fields: [
              { id: "f-sp-actions", field_key: "care_planning_actions", field_type: "action_list", label: "Actions for Care Team", required: true, field_order: 1, section_id: "sec-sp-actions" },
            ],
          },
        ],
      },
    },
  },

  // ── 6. Trauma-Informed Assessment ──────────────────────────────────────────
  trauma_informed_assessment: {
    id: "tpl-trauma-assessment",
    code: "trauma_informed_assessment",
    name: "Trauma-Informed Assessment",
    category: "Young People",
    status: "approved",
    description: "Assessment of a young person's trauma history and presentation to inform therapeutic care planning",
    latest_version: {
      id: "v-trauma-assessment-1",
      template_id: "tpl-trauma-assessment",
      version_number: 1,
      is_published: true,
      created_at: new Date().toISOString(),
      schema: {
        sections: [
          {
            id: "sec-ta-yp",
            title: "Young Person & Context",
            section_order: 1,
            fields: [
              { id: "f-ta-yp", field_key: "young_person", field_type: "young_person_selector", label: "Young Person", required: true, field_order: 1, section_id: "sec-ta-yp" },
              { id: "f-ta-date", field_key: "assessment_date", field_type: "date", label: "Assessment Date", required: true, field_order: 2, section_id: "sec-ta-yp" },
              { id: "f-ta-assessor", field_key: "assessor", field_type: "staff_selector", label: "Lead Assessor", required: true, field_order: 3, section_id: "sec-ta-yp" },
              { id: "f-ta-purpose", field_key: "assessment_purpose", field_type: "single_select", label: "Purpose of Assessment", required: true, field_order: 4, section_id: "sec-ta-yp", options: opts(["Initial placement", "Review following incident", "Transition planning", "Care plan review", "Therapeutic referral"]) },
            ],
          },
          {
            id: "sec-ta-history",
            title: "Trauma History",
            section_order: 2,
            fields: [
              { id: "f-ta-adverse", field_key: "adverse_childhood_experiences", field_type: "checklist", label: "Known Adverse Childhood Experiences (ACEs)", required: true, field_order: 1, section_id: "sec-ta-history", options: opts(["Abuse (physical)", "Abuse (emotional)", "Abuse (sexual)", "Neglect", "Domestic abuse witnessed", "Parental substance use", "Parental mental illness", "Bereavement", "Family member imprisoned", "Community violence"]) },
              { id: "f-ta-history-narrative", field_key: "trauma_history_narrative", field_type: "ai_assisted_narrative", label: "Trauma History Narrative", placeholder: "Summarise known trauma history — use only information that is already documented. Avoid speculation.", required: true, field_order: 2, section_id: "sec-ta-history" },
            ],
          },
          {
            id: "sec-ta-presentation",
            title: "Current Presentation",
            section_order: 3,
            fields: [
              { id: "f-ta-presentation", field_key: "current_presentation", field_type: "ai_assisted_narrative", label: "Current Trauma-Informed Presentation", placeholder: "How does trauma manifest in the young person's current behaviour and emotional regulation?", required: true, field_order: 1, section_id: "sec-ta-presentation" },
              { id: "f-ta-triggers", field_key: "identified_triggers", field_type: "long_text", label: "Identified Trauma Triggers", required: true, field_order: 2, section_id: "sec-ta-presentation" },
              { id: "f-ta-strengths", field_key: "protective_factors_strengths", field_type: "long_text", label: "Protective Factors & Strengths", required: true, field_order: 3, section_id: "sec-ta-presentation" },
            ],
          },
          {
            id: "sec-ta-recommendations",
            title: "Recommendations",
            section_order: 4,
            fields: [
              { id: "f-ta-therapeutic-recs", field_key: "therapeutic_recommendations", field_type: "ai_assisted_narrative", label: "Therapeutic Recommendations", placeholder: "What therapeutic approaches and interventions are recommended based on this assessment?", required: true, field_order: 1, section_id: "sec-ta-recommendations" },
              { id: "f-ta-referrals", field_key: "referrals_required", field_type: "checklist", label: "Referrals Required", required: false, field_order: 2, section_id: "sec-ta-recommendations", options: opts(["CAMHS", "Therapeutic social work", "Occupational therapy", "Educational psychology", "Art therapy", "Drama therapy", "Trauma-focused CBT", "EMDR", "Family therapy"]) },
              { id: "f-ta-actions", field_key: "care_actions", field_type: "action_list", label: "Actions for Care Team", required: true, field_order: 3, section_id: "sec-ta-recommendations" },
            ],
          },
          {
            id: "sec-ta-sign",
            title: "Sign Off",
            section_order: 5,
            fields: [
              { id: "f-ta-sig", field_key: "assessor_signature", field_type: "signature", label: "Assessor Signature", required: true, field_order: 1, section_id: "sec-ta-sign" },
              { id: "f-ta-oversight", field_key: "manager_oversight", field_type: "management_oversight_narrative", label: "Registered Manager Oversight", required: true, field_order: 2, section_id: "sec-ta-sign" },
            ],
          },
        ],
      },
    },
  },

  // ── 7. SMART Goals Record ───────────────────────────────────────────────────
  smart_goals: {
    id: "tpl-smart-goals",
    code: "smart_goals",
    name: "SMART Goals Record",
    category: "Young People",
    status: "approved",
    description: "Set and track SMART goals with a young person, aligned to their care plan",
    latest_version: {
      id: "v-smart-goals-1",
      template_id: "tpl-smart-goals",
      version_number: 1,
      is_published: true,
      created_at: new Date().toISOString(),
      schema: {
        sections: [
          {
            id: "sec-sg-details",
            title: "Details",
            section_order: 1,
            fields: [
              { id: "f-sg-yp", field_key: "young_person", field_type: "young_person_selector", label: "Young Person", required: true, field_order: 1, section_id: "sec-sg-details" },
              { id: "f-sg-worker", field_key: "keyworker", field_type: "staff_selector", label: "Keyworker", required: true, field_order: 2, section_id: "sec-sg-details" },
              { id: "f-sg-date", field_key: "date_set", field_type: "date", label: "Date Goals Set", required: true, field_order: 3, section_id: "sec-sg-details" },
              { id: "f-sg-review-date", field_key: "review_date", field_type: "date", label: "Review Date", required: true, field_order: 4, section_id: "sec-sg-details" },
              { id: "f-sg-domain", field_key: "goal_domain", field_type: "single_select", label: "Goal Domain", required: true, field_order: 5, section_id: "sec-sg-details", options: opts(["Education", "Health & Wellbeing", "Life Skills", "Social & Emotional", "Employment & Training", "Relationships", "Identity & Independence", "Hobbies & Interests"]) },
            ],
          },
          {
            id: "sec-sg-goals",
            title: "SMART Goal",
            section_order: 2,
            fields: [
              { id: "f-sg-specific", field_key: "specific", field_type: "long_text", label: "Specific — What exactly will be achieved?", required: true, field_order: 1, section_id: "sec-sg-goals" },
              { id: "f-sg-measurable", field_key: "measurable", field_type: "long_text", label: "Measurable — How will we know it's been achieved?", required: true, field_order: 2, section_id: "sec-sg-goals" },
              { id: "f-sg-achievable", field_key: "achievable", field_type: "long_text", label: "Achievable — What support is needed?", required: true, field_order: 3, section_id: "sec-sg-goals" },
              { id: "f-sg-relevant", field_key: "relevant", field_type: "long_text", label: "Relevant — Why does this matter to the young person?", required: true, field_order: 4, section_id: "sec-sg-goals" },
              { id: "f-sg-timebound", field_key: "time_bound", field_type: "date", label: "Time-Bound — Target achievement date", required: true, field_order: 5, section_id: "sec-sg-goals" },
              { id: "f-sg-yp-voice", field_key: "young_persons_voice", field_type: "live_voice_transcript", label: "Young Person's Voice About This Goal", required: true, field_order: 6, section_id: "sec-sg-goals" },
            ],
          },
          {
            id: "sec-sg-review",
            title: "Review",
            section_order: 3,
            fields: [
              { id: "f-sg-progress", field_key: "progress_rating", field_type: "risk_rating", label: "Progress Rating (1–10)", required: false, field_order: 1, section_id: "sec-sg-review" },
              { id: "f-sg-review-notes", field_key: "review_notes", field_type: "ai_assisted_narrative", label: "Review Notes", placeholder: "What progress has been made? What helped or hindered progress?", required: false, field_order: 2, section_id: "sec-sg-review" },
              { id: "f-sg-outcome", field_key: "goal_outcome", field_type: "single_select", label: "Goal Outcome", required: false, field_order: 3, section_id: "sec-sg-review", options: opts(["Achieved", "Partially achieved", "Not yet achieved", "Revised", "No longer relevant"]) },
            ],
          },
        ],
      },
    },
  },

  // ── 8. Staff Wellness Check ─────────────────────────────────────────────────
  staff_wellness_check: {
    id: "tpl-staff-wellness-check",
    code: "staff_wellness_check",
    name: "Staff Wellness Check",
    category: "Staff & HR",
    status: "approved",
    description: "Structured wellbeing check-in for residential care staff, for use between formal supervision sessions",
    latest_version: {
      id: "v-staff-wellness-check-1",
      template_id: "tpl-staff-wellness-check",
      version_number: 1,
      is_published: true,
      created_at: new Date().toISOString(),
      schema: {
        sections: [
          {
            id: "sec-wc-details",
            title: "Check Details",
            section_order: 1,
            fields: [
              { id: "f-wc-staff", field_key: "staff_member", field_type: "staff_selector", label: "Staff Member", required: true, field_order: 1, section_id: "sec-wc-details" },
              { id: "f-wc-manager", field_key: "manager", field_type: "staff_selector", label: "Manager Conducting Check", required: true, field_order: 2, section_id: "sec-wc-details" },
              { id: "f-wc-date", field_key: "check_date", field_type: "date", label: "Date", required: true, field_order: 3, section_id: "sec-wc-details" },
              { id: "f-wc-trigger", field_key: "trigger", field_type: "single_select", label: "What Prompted This Check?", required: true, field_order: 4, section_id: "sec-wc-details", options: opts(["Routine scheduled check", "Following difficult incident", "Staff requested support", "Manager concern", "Return from absence", "Post-shift debrief"]) },
            ],
          },
          {
            id: "sec-wc-wellbeing",
            title: "Wellbeing Assessment",
            section_order: 2,
            fields: [
              { id: "f-wc-overall", field_key: "overall_wellbeing_rating", field_type: "risk_rating", label: "Overall Wellbeing (1–10)", required: true, field_order: 1, section_id: "sec-wc-wellbeing" },
              { id: "f-wc-stress", field_key: "stress_level_rating", field_type: "risk_rating", label: "Work-Related Stress Level (1–10)", required: true, field_order: 2, section_id: "sec-wc-wellbeing" },
              { id: "f-wc-concerns", field_key: "staff_concerns", field_type: "ai_assisted_narrative", label: "Staff Member's Concerns or Reflections", placeholder: "What is the staff member sharing about their wellbeing, workload, or any concerns?", required: true, field_order: 3, section_id: "sec-wc-wellbeing" },
              { id: "f-wc-vicarious-trauma", field_key: "signs_of_vicarious_trauma", field_type: "checklist", label: "Signs of Vicarious Trauma Observed", required: true, field_order: 4, section_id: "sec-wc-wellbeing", options: opts(["Sleep difficulties", "Increased cynicism", "Emotional detachment", "Intrusive thoughts", "Reduced empathy", "Physical symptoms", "None identified"]) },
              { id: "f-wc-support", field_key: "support_required", field_type: "long_text", label: "Support Required / Agreed", required: true, field_order: 5, section_id: "sec-wc-wellbeing" },
              { id: "f-wc-referral", field_key: "referral_to_eap", field_type: "yes_no", label: "Referral to EAP / Occupational Health Recommended?", required: true, field_order: 6, section_id: "sec-wc-wellbeing" },
            ],
          },
          {
            id: "sec-wc-follow",
            title: "Follow-up",
            section_order: 3,
            fields: [
              { id: "f-wc-actions", field_key: "agreed_actions", field_type: "action_list", label: "Agreed Actions", required: false, field_order: 1, section_id: "sec-wc-follow" },
              { id: "f-wc-next-check", field_key: "next_check_date", field_type: "date", label: "Next Wellness Check Date", required: false, field_order: 2, section_id: "sec-wc-follow" },
              { id: "f-wc-sig", field_key: "manager_signature", field_type: "signature", label: "Manager Signature", required: true, field_order: 3, section_id: "sec-wc-follow" },
            ],
          },
        ],
      },
    },
  },

  // ── 9. Young Person Risk Assessment ────────────────────────────────────────
  yp_risk_assessment: {
    id: "tpl-yp-risk-assessment",
    code: "yp_risk_assessment",
    name: "Young Person Risk Assessment",
    category: "Young People",
    status: "approved",
    description: "Dynamic risk assessment for an individual young person covering identified risks and protective factors",
    latest_version: {
      id: "v-yp-risk-assessment-1",
      template_id: "tpl-yp-risk-assessment",
      version_number: 1,
      is_published: true,
      created_at: new Date().toISOString(),
      schema: {
        sections: [
          {
            id: "sec-ra-details",
            title: "Details",
            section_order: 1,
            fields: [
              { id: "f-ra-yp", field_key: "young_person", field_type: "young_person_selector", label: "Young Person", required: true, field_order: 1, section_id: "sec-ra-details" },
              { id: "f-ra-date", field_key: "assessment_date", field_type: "date", label: "Date of Assessment", required: true, field_order: 2, section_id: "sec-ra-details" },
              { id: "f-ra-completed-by", field_key: "completed_by", field_type: "staff_selector", label: "Completed By", required: true, field_order: 3, section_id: "sec-ra-details" },
              { id: "f-ra-trigger", field_key: "trigger_for_review", field_type: "single_select", label: "Trigger for This Assessment", required: true, field_order: 4, section_id: "sec-ra-details", options: opts(["Initial placement", "Incident requiring reassessment", "LAC review", "Scheduled review", "Change in circumstances", "Escalation request"]) },
            ],
          },
          {
            id: "sec-ra-risks",
            title: "Identified Risks",
            section_order: 2,
            fields: [
              { id: "f-ra-risk-areas", field_key: "risk_areas", field_type: "checklist", label: "Risk Areas Identified", required: true, field_order: 1, section_id: "sec-ra-risks", options: opts(["Self-harm", "Suicide risk", "Missing from care", "Exploitation (CSE/CE)", "Substance misuse", "Violent behaviour", "Online risk", "Gangs / peer risk", "Runaway risk", "Fire setting", "Property damage", "Aggression to others"]) },
              { id: "f-ra-overall-risk", field_key: "overall_risk_level", field_type: "single_select", label: "Overall Risk Level", required: true, field_order: 2, section_id: "sec-ra-risks", options: opts(["Low", "Medium", "High", "Critical"]) },
              { id: "f-ra-risk-narrative", field_key: "risk_narrative", field_type: "ai_assisted_narrative", label: "Risk Narrative", placeholder: "Describe each identified risk area, its current level, triggers, and evidence base", required: true, field_order: 3, section_id: "sec-ra-risks" },
            ],
          },
          {
            id: "sec-ra-protective",
            title: "Protective Factors",
            section_order: 3,
            fields: [
              { id: "f-ra-protective", field_key: "protective_factors", field_type: "ai_assisted_narrative", label: "Protective Factors", placeholder: "What factors reduce risk? Include relationships, activities, placement stability, engagement with services", required: true, field_order: 1, section_id: "sec-ra-protective" },
            ],
          },
          {
            id: "sec-ra-management",
            title: "Risk Management Plan",
            section_order: 4,
            fields: [
              { id: "f-ra-management", field_key: "risk_management_plan", field_type: "ai_assisted_narrative", label: "Risk Management Plan", placeholder: "What specific actions will be taken to manage identified risks? Include monitoring, communication, and escalation triggers", required: true, field_order: 1, section_id: "sec-ra-management" },
              { id: "f-ra-actions", field_key: "risk_actions", field_type: "action_list", label: "Risk Management Actions", required: true, field_order: 2, section_id: "sec-ra-management" },
              { id: "f-ra-escalation", field_key: "escalation_triggers", field_type: "long_text", label: "Escalation Triggers (when to seek immediate support)", required: true, field_order: 3, section_id: "sec-ra-management" },
            ],
          },
          {
            id: "sec-ra-sign",
            title: "Sign Off",
            section_order: 5,
            fields: [
              { id: "f-ra-sig", field_key: "assessor_signature", field_type: "signature", label: "Assessor Signature", required: true, field_order: 1, section_id: "sec-ra-sign" },
              { id: "f-ra-oversight", field_key: "rm_oversight", field_type: "management_oversight_narrative", label: "Registered Manager Oversight", required: true, field_order: 2, section_id: "sec-ra-sign" },
            ],
          },
        ],
      },
    },
  },

  // ── 10. Pathway Plan ───────────────────────────────────────────────────────
  pathway_plan: {
    id: "tpl-pathway-plan",
    code: "pathway_plan",
    name: "Pathway Plan",
    category: "Young People",
    status: "approved",
    description: "Statutory pathway plan for young people approaching or in transition from care (15+)",
    latest_version: {
      id: "v-pathway-plan-1",
      template_id: "tpl-pathway-plan",
      version_number: 1,
      is_published: true,
      created_at: new Date().toISOString(),
      schema: {
        sections: [
          {
            id: "sec-pp-details",
            title: "Young Person & Plan Details",
            section_order: 1,
            fields: [
              { id: "f-pp-yp", field_key: "young_person", field_type: "young_person_selector", label: "Young Person", required: true, field_order: 1, section_id: "sec-pp-details" },
              { id: "f-pp-date", field_key: "plan_date", field_type: "date", label: "Date of Plan", required: true, field_order: 2, section_id: "sec-pp-details" },
              { id: "f-pp-review-date", field_key: "review_date", field_type: "date", label: "Next Review Date", required: true, field_order: 3, section_id: "sec-pp-details" },
              { id: "f-pp-pa", field_key: "personal_advisor", field_type: "staff_selector", label: "Personal Advisor", required: true, field_order: 4, section_id: "sec-pp-details" },
            ],
          },
          {
            id: "sec-pp-accommodation",
            title: "Accommodation",
            section_order: 2,
            fields: [
              { id: "f-pp-current-acc", field_key: "current_accommodation", field_type: "short_text", label: "Current Accommodation", required: true, field_order: 1, section_id: "sec-pp-accommodation" },
              { id: "f-pp-future-acc", field_key: "future_accommodation_plan", field_type: "ai_assisted_narrative", label: "Future Accommodation Plan", placeholder: "What are the plans for accommodation after leaving care? What are the young person's aspirations and what support is needed?", required: true, field_order: 2, section_id: "sec-pp-accommodation" },
            ],
          },
          {
            id: "sec-pp-education",
            title: "Education, Training & Employment",
            section_order: 3,
            fields: [
              { id: "f-pp-ete-current", field_key: "current_ete", field_type: "short_text", label: "Current Education/Training/Employment", required: true, field_order: 1, section_id: "sec-pp-education" },
              { id: "f-pp-ete-goals", field_key: "ete_goals", field_type: "ai_assisted_narrative", label: "ETE Goals and Plan", placeholder: "What are the young person's education, training, or employment goals? What support is in place?", required: true, field_order: 2, section_id: "sec-pp-education" },
            ],
          },
          {
            id: "sec-pp-life-skills",
            title: "Life Skills",
            section_order: 4,
            fields: [
              { id: "f-pp-life-skills", field_key: "life_skills_assessment", field_type: "checklist", label: "Life Skills Assessment", required: true, field_order: 1, section_id: "sec-pp-life-skills", options: opts(["Budgeting and finances", "Cooking and nutrition", "Cleaning and household tasks", "Using public transport", "Registering with GP/dentist", "Understanding tenancy agreements", "Job applications and interviews", "Accessing benefits", "Emotional wellbeing management", "Safe relationships"]) },
              { id: "f-pp-life-skills-support", field_key: "life_skills_support_plan", field_type: "long_text", label: "Life Skills Support Plan", required: true, field_order: 2, section_id: "sec-pp-life-skills" },
            ],
          },
          {
            id: "sec-pp-relationships",
            title: "Family & Relationships",
            section_order: 5,
            fields: [
              { id: "f-pp-family", field_key: "family_relationships", field_type: "ai_assisted_narrative", label: "Family Relationships and Contact", placeholder: "Describe current family relationships, contact arrangements, and how these will be maintained through transition", required: false, field_order: 1, section_id: "sec-pp-relationships" },
              { id: "f-pp-support-network", field_key: "informal_support_network", field_type: "long_text", label: "Informal Support Network", required: false, field_order: 2, section_id: "sec-pp-relationships" },
            ],
          },
          {
            id: "sec-pp-yp-voice",
            title: "Young Person's Views",
            section_order: 6,
            fields: [
              { id: "f-pp-yp-voice", field_key: "young_persons_voice", field_type: "live_voice_transcript", label: "Young Person's Views and Aspirations", required: true, field_order: 1, section_id: "sec-pp-yp-voice" },
              { id: "f-pp-yp-agree", field_key: "yp_agrees_with_plan", field_type: "yes_no", label: "Young Person Agrees with This Plan?", required: true, field_order: 2, section_id: "sec-pp-yp-voice" },
              { id: "f-pp-yp-disagree-notes", field_key: "disagreement_notes", field_type: "long_text", label: "If Not — Reason for Disagreement", required: false, field_order: 3, section_id: "sec-pp-yp-voice" },
            ],
          },
          {
            id: "sec-pp-sign",
            title: "Sign Off",
            section_order: 7,
            fields: [
              { id: "f-pp-pa-sig", field_key: "pa_signature", field_type: "signature", label: "Personal Advisor Signature", required: true, field_order: 1, section_id: "sec-pp-sign" },
              { id: "f-pp-oversight", field_key: "manager_oversight", field_type: "management_oversight_narrative", label: "Manager Oversight & Approval", required: true, field_order: 2, section_id: "sec-pp-sign" },
            ],
          },
        ],
      },
    },
  },
};

export const PHASE5_TEMPLATE_LIST = Object.values(PHASE5_TEMPLATES);
