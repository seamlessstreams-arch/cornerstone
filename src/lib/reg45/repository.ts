import type { SupabaseClient } from "@supabase/supabase-js";
import { computeEvidenceCompleteness } from "@/lib/reg45/workflow";
import type { Reg45EvidenceCompleteness } from "@/lib/reg45/types";

export async function getCycleCompleteness(
  supabase: SupabaseClient,
  cycleId: string
): Promise<Reg45EvidenceCompleteness> {
  const { data: evidenceItems } = await supabase
    .from("reg45_evidence_items")
    .select("id, category, is_previous_action_evidence")
    .eq("cycle_id", cycleId);

  const { data: consultations } = await supabase
    .from("reg45_consultation_entries")
    .select("id, consultation_group")
    .eq("cycle_id", cycleId);

  const { data: findings } = await supabase
    .from("reg45_findings")
    .select("id")
    .eq("cycle_id", cycleId);

  const { data: findingLinks } = await supabase
    .from("reg45_evidence_links")
    .select("id, finding_id, action_id")
    .eq("cycle_id", cycleId);

  const { data: actions } = await supabase
    .from("reg45_actions")
    .select("id, owner_user_id, deadline")
    .eq("cycle_id", cycleId);

  const categoryCounts: Record<string, number> = {};
  let hasPreviousActionEvidence = false;

  for (const item of evidenceItems ?? []) {
    const category = String(item.category);
    categoryCounts[category] = (categoryCounts[category] ?? 0) + 1;
    if (item.is_previous_action_evidence) hasPreviousActionEvidence = true;
  }

  const consultationCounts: Record<string, number> = {};
  for (const row of consultations ?? []) {
    const group = String(row.consultation_group);
    consultationCounts[group] = (consultationCounts[group] ?? 0) + 1;
  }

  const findingLinkedIds = new Set(
    (findingLinks ?? []).filter((row) => row.finding_id).map((row) => String(row.finding_id))
  );

  const actionLinkedIds = new Set(
    (findingLinks ?? []).filter((row) => row.action_id).map((row) => String(row.action_id))
  );

  const findingsWithoutEvidence = (findings ?? []).filter((row) => !findingLinkedIds.has(String(row.id))).length;
  const actionsWithoutOwnerOrDeadline = (actions ?? []).filter(
    (row) => !row.owner_user_id || !row.deadline || !actionLinkedIds.has(String(row.id))
  ).length;

  return computeEvidenceCompleteness({
    evidenceCategoryCounts: categoryCounts,
    consultationGroupCounts: consultationCounts,
    findingsWithoutEvidence,
    actionsWithoutOwnerOrDeadline,
    hasPreviousActionEvidence,
  });
}
