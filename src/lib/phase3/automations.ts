import type { SupabaseClient } from "@supabase/supabase-js";

export interface TaskAutomationPayload {
  organisationId: string;
  homeId: string;
  createdBy: string;
  assignedTo?: string | null;
  title: string;
  description?: string;
  priority?: "low" | "medium" | "high" | "critical";
  dueAt?: string;
  metadata?: Record<string, unknown>;
}

function mapPriority(priority: TaskAutomationPayload["priority"]): "low" | "medium" | "high" {
  if (priority === "critical") {
    return "high";
  }
  return priority ?? "medium";
}

export async function createAutomationTask(
  supabase: SupabaseClient,
  payload: TaskAutomationPayload
): Promise<string | null> {
  const { data, error } = await supabase
    .from("tasks")
    .insert({
      organisation_id: payload.organisationId,
      home_id: payload.homeId,
      title: payload.title,
      description: payload.description ?? null,
      status: "open",
      priority: mapPriority(payload.priority),
      due_at: payload.dueAt ?? null,
      assigned_to: payload.assignedTo ?? null,
      created_by: payload.createdBy,
    })
    .select("id")
    .single();

  if (error) {
    console.error("Automation task create failed:", error);
    return null;
  }

  if (payload.metadata) {
    await supabase.from("linked_records").insert({
      organisation_id: payload.organisationId,
      home_id: payload.homeId,
      source_type: "task",
      source_id: data.id,
      target_type: "automation",
      target_id: payload.title,
      relation_type: "auto_generated",
      metadata: payload.metadata,
    });
  }

  return data.id;
}

export async function automateEvidenceVerificationTask(
  supabase: SupabaseClient,
  payload: {
    organisationId: string;
    homeId: string;
    createdBy: string;
    evidenceId: string;
    evidenceType: string;
    candidateId?: string;
  }
): Promise<string | null> {
  return createAutomationTask(supabase, {
    organisationId: payload.organisationId,
    homeId: payload.homeId,
    createdBy: payload.createdBy,
    title: `Verify evidence: ${payload.evidenceType}`,
    description: payload.candidateId
      ? `Review and verify evidence ${payload.evidenceId} for candidate ${payload.candidateId}.`
      : `Review and verify evidence ${payload.evidenceId}.`,
    priority: "medium",
    metadata: {
      automationType: "evidence_uploaded_assign_verification",
      evidenceId: payload.evidenceId,
      evidenceType: payload.evidenceType,
      candidateId: payload.candidateId,
    },
  });
}

export async function automateHsDefectMaintenanceTask(
  supabase: SupabaseClient,
  payload: {
    organisationId: string;
    homeId: string;
    createdBy: string;
    formRecordId: string;
    severity: "low" | "medium" | "high" | "critical";
    details: string;
  }
): Promise<string | null> {
  return createAutomationTask(supabase, {
    organisationId: payload.organisationId,
    homeId: payload.homeId,
    createdBy: payload.createdBy,
    title: "H&S defect requires maintenance",
    description: payload.details,
    priority: payload.severity,
    metadata: {
      automationType: "hs_defect_to_maintenance_task",
      formRecordId: payload.formRecordId,
      severity: payload.severity,
    },
  });
}

export async function automateOversightActionsToTasks(
  supabase: SupabaseClient,
  payload: {
    organisationId: string;
    homeId: string;
    createdBy: string;
    oversightId: string;
    actions: Array<{ title: string; description?: string; dueAt?: string; priority?: "low" | "medium" | "high" | "critical" }>;
  }
): Promise<string[]> {
  const createdTaskIds: string[] = [];

  for (const action of payload.actions) {
    const taskId = await createAutomationTask(supabase, {
      organisationId: payload.organisationId,
      homeId: payload.homeId,
      createdBy: payload.createdBy,
      title: action.title,
      description: action.description,
      dueAt: action.dueAt,
      priority: action.priority,
      metadata: {
        automationType: "oversight_action_to_task",
        oversightId: payload.oversightId,
      },
    });

    if (taskId) {
      createdTaskIds.push(taskId);
    }
  }

  return createdTaskIds;
}
