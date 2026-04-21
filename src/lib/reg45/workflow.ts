import {
  REG45_CONSULTATION_GROUPS,
  REG45_EVIDENCE_CATEGORIES,
  type Reg45ConsultationGroup,
  type Reg45CycleStatus,
  type Reg45EvidenceCategory,
  type Reg45EvidenceCompleteness,
} from "@/lib/reg45/types";

interface CompletenessInput {
  evidenceCategoryCounts: Partial<Record<Reg45EvidenceCategory, number>>;
  consultationGroupCounts: Partial<Record<Reg45ConsultationGroup, number>>;
  findingsWithoutEvidence: number;
  actionsWithoutOwnerOrDeadline: number;
  hasPreviousActionEvidence: boolean;
}

export function getNextCycleStatus(currentStatus: Reg45CycleStatus): Reg45CycleStatus {
  const order: Reg45CycleStatus[] = [
    "planned",
    "evidence_gathering",
    "in_review",
    "drafting_report",
    "awaiting_sign_off",
    "finalised",
    "submitted",
    "archived",
  ];

  const index = order.indexOf(currentStatus);
  if (index < 0 || index === order.length - 1) return currentStatus;
  return order[index + 1];
}

export function computeEvidenceCompleteness(input: CompletenessInput): Reg45EvidenceCompleteness {
  const missingCategories = REG45_EVIDENCE_CATEGORIES.filter(
    (category) => (input.evidenceCategoryCounts[category] ?? 0) <= 0
  );

  const consultationCoverage: Partial<Record<Reg45ConsultationGroup, number>> = {};
  for (const group of REG45_CONSULTATION_GROUPS) {
    consultationCoverage[group] = input.consultationGroupCounts[group] ?? 0;
  }

  const hasChildFeedback = (input.consultationGroupCounts.children ?? 0) > 0;
  const consultationMissing = REG45_CONSULTATION_GROUPS.filter((group) => (input.consultationGroupCounts[group] ?? 0) <= 0);

  const signals = [
    missingCategories.length === 0 ? 1 : 0,
    consultationMissing.length === 0 ? 1 : 0,
    hasChildFeedback ? 1 : 0,
    input.hasPreviousActionEvidence ? 1 : 0,
    input.findingsWithoutEvidence === 0 ? 1 : 0,
    input.actionsWithoutOwnerOrDeadline === 0 ? 1 : 0,
  ];

  const score = Math.round((signals.reduce((sum, value) => sum + value, 0) / signals.length) * 100);

  const alerts: string[] = [];
  if (!hasChildFeedback) alerts.push("No children consultation evidence linked to this cycle.");
  if (!input.hasPreviousActionEvidence) alerts.push("No evidence reviewing progress from previous actions is linked.");
  if (consultationMissing.length > 0) alerts.push(`Missing consultation groups: ${consultationMissing.join(", ")}.`);
  if (missingCategories.length > 0) alerts.push(`Missing evidence categories: ${missingCategories.join(", ")}.`);
  if (input.findingsWithoutEvidence > 0) {
    alerts.push(`${input.findingsWithoutEvidence} findings have no linked evidence.`);
  }
  if (input.actionsWithoutOwnerOrDeadline > 0) {
    alerts.push(`${input.actionsWithoutOwnerOrDeadline} actions have no owner or deadline.`);
  }

  const blockFinalSignOff =
    !hasChildFeedback ||
    !input.hasPreviousActionEvidence ||
    input.findingsWithoutEvidence > 0 ||
    input.actionsWithoutOwnerOrDeadline > 0;

  return {
    score,
    missingCategories,
    consultationCoverage,
    hasPreviousActionEvidence: input.hasPreviousActionEvidence,
    hasChildFeedback,
    findingsWithoutEvidence: input.findingsWithoutEvidence,
    actionsWithoutOwnerOrDeadline: input.actionsWithoutOwnerOrDeadline,
    blockFinalSignOff,
    alerts,
  };
}
