export type InsightDirection = "improving" | "stable" | "worsening";

export interface ChildExperienceIndicator {
  key: string;
  label: string;
  value: number;
  direction: InsightDirection;
  evidenceCount: number;
  narrative: string;
}

export interface PatternSignal {
  id: string;
  childId: string;
  title: string;
  prompt: string;
  confidence: "low" | "medium" | "high";
  evidenceRefs: string[];
  periodDays: number;
  createdAt: string;
  status?: "active" | "reviewed" | "resolved";
  reviewedAt?: string;
  reviewedBy?: string;
}

export interface InterventionRecord {
  id: string;
  child_id: string;
  title: string;
  why_now: string;
  intended_outcome: string;
  started_on: string;
  review_date: string;
  agreed_by: string;
  owner_id: string;
  status: "active" | "review_due" | "completed" | "stopped";
  impact_summary: string | null;
  continue_decision: "continue" | "adapt" | "stop" | null;
  linked_record_ids: string[];
  created_at: string;
  updated_at: string;
}

export interface TrustedAdultLink {
  id: string;
  child_id: string;
  staff_id: string;
  relationship_type: "preferred" | "regulating" | "engaging" | "strain" | "avoided";
  confidence: "low" | "medium" | "high";
  notes: string;
  updated_at: string;
}

export interface PracticeBankEntry {
  id: string;
  child_id: string;
  category:
    | "what_helps"
    | "language_that_helps"
    | "avoid"
    | "deescalation"
    | "repair"
    | "education_engagement"
    | "contact_preparation"
    | "sensory_support";
  title: string;
  details: string;
  evidence_refs: string[];
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface ChildVoiceEntry {
  id: string;
  child_id: string;
  said: string;
  adult_response: string;
  outcome: string;
  source: string;
  created_at: string;
}

export interface ActionEffectivenessReview {
  id: string;
  action_id: string;
  child_id: string | null;
  what_changed: string;
  evidence_after: string;
  effectiveness: "worked" | "partially_worked" | "did_not_work";
  decision: "continue" | "adapt" | "stop";
  reviewed_by: string;
  reviewed_at: string;
}

export interface ChildExperienceSnapshot {
  childId: string;
  generatedAt: string;
  indicators: ChildExperienceIndicator[];
  narrativeSummary: string;
  journeyHighlights: Array<{
    id: string;
    date: string;
    title: string;
    type: "turning_point" | "risk_escalation" | "protective_event" | "progress_milestone";
    detail: string;
  }>;
  patternSignals: PatternSignal[];
  voiceCoverage: {
    entriesInPeriod: number;
    gaps: string[];
    themes: string[];
  };
}

export interface HomeClimateSnapshot {
  generatedAt: string;
  periodDays: number;
  signals: Array<{
    key: string;
    label: string;
    value: number;
    direction: InsightDirection;
    commentary: string;
  }>;
  hotspotPatterns: PatternSignal[];
  leadershipAttention: string[];
}

export interface QualityOfCareSnapshot {
  generatedAt: string;
  recurringThemes: string[];
  evidenceGaps: string[];
  unresolvedActionRisks: string[];
  reg45Readiness: {
    cycleCount: number;
    blockedCycles: number;
  };
  inspectionVulnerabilities: string[];
}

export type AutomationLogType =
  | "pattern_task"
  | "review_task"
  | "voice_task"
  | "oversight_task"
  | "alert_resolved"
  | "alert_reviewed";

export type AutomationLogSourceType =
  | "pattern_alert"
  | "action_review"
  | "voice_entry"
  | "oversight"
  | "intervention";

export interface AutomationLog {
  id: string;
  automation_type: AutomationLogType;
  source_id: string;
  source_type: AutomationLogSourceType;
  /** Task or intervention ID that was created; null for status-change events */
  generated_entity_id: string | null;
  generated_entity_type: "task" | "intervention" | null;
  title: string;
  initiated_by: string;
  metadata: {
    confidence?: "low" | "medium" | "high";
    child_id?: string;
    decision_rationale?: string;
    manual_review_needed?: boolean;
  };
  created_at: string;
}
