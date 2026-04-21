import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  TrainingAssignmentStatus,
  TrainingComplianceStatus,
  TrainingMatrixRowModel,
} from "@/lib/training/types";

export function computeComplianceStatus(input: {
  completionStatus: TrainingAssignmentStatus;
  dueDate: string | null;
  expiresAt: string | null;
  warningWindowDays: number;
}): TrainingComplianceStatus {
  const now = new Date();
  const due = input.dueDate ? new Date(input.dueDate) : null;
  const expiry = input.expiresAt ? new Date(input.expiresAt) : null;

  if (input.completionStatus === "exempt") {
    return "compliant";
  }

  if (expiry && expiry.getTime() < now.getTime()) {
    return "expired";
  }

  if (input.completionStatus === "completed") {
    if (!expiry) return "compliant";
    const msToExpiry = expiry.getTime() - now.getTime();
    const days = Math.ceil(msToExpiry / 86400000);
    if (days <= input.warningWindowDays) return "due_soon";
    return "compliant";
  }

  if (input.completionStatus === "failed") {
    return "non_compliant";
  }

  if (due) {
    const msToDue = due.getTime() - now.getTime();
    const dueDays = Math.ceil(msToDue / 86400000);
    if (dueDays < 0) return "overdue";
    if (dueDays <= input.warningWindowDays) return "due_soon";
  }

  if (input.completionStatus === "assigned" || input.completionStatus === "in_progress") {
    return "incomplete";
  }

  return "non_compliant";
}

export function computeDaysUntilDue(dateIso: string | null): number | null {
  if (!dateIso) return null;
  const now = new Date();
  const due = new Date(dateIso);
  return Math.ceil((due.getTime() - now.getTime()) / 86400000);
}

export async function upsertTrainingMatrixRow(
  supabase: SupabaseClient,
  row: TrainingMatrixRowModel,
  context: { organisationId: string }
): Promise<void> {
  const { error } = await supabase.from("training_matrix_rows").upsert(
    {
      organisation_id: context.organisationId,
      staff_member_id: row.staff_member_id,
      course_id: row.course_id,
      home_id: row.home_id,
      role_id: row.role_id,
      requirement_type: row.requirement_type,
      assigned_status: row.assigned_status,
      completion_status: row.completion_status,
      completed_at: row.completed_at,
      expires_at: row.expires_at,
      due_date: row.due_date,
      days_until_due: row.days_until_due,
      compliance_status: row.compliance_status,
      direct_course_url: row.direct_course_url,
      certificate_status: row.certificate_status,
      last_synced_at: row.last_synced_at,
      updated_at: new Date().toISOString(),
    },
    {
      onConflict: "organisation_id,staff_member_id,course_id,home_id",
    }
  );

  if (error) {
    throw new Error(`Failed to upsert matrix row: ${error.message}`);
  }
}
