import type { SupabaseClient } from "@supabase/supabase-js";
import { AUDIT_EVENTS } from "@/lib/audit/events";
import { writeAuditLog } from "@/lib/audit/logger";
import { trainingProviderRegistry } from "@/lib/integrations/training-provider-registry";
import { computeComplianceStatus, computeDaysUntilDue, upsertTrainingMatrixRow } from "@/lib/training/matrix";
import { queueTrainingNotification } from "@/lib/training/notifications";
import type {
  ProviderAssignmentRecord,
  ProviderCompletionRecord,
  ProviderCourseRecord,
  TrainingProviderConnection,
  TrainingSyncDelta,
} from "@/lib/training/types";

interface SyncContext {
  organisationId: string;
  homeId: string | null;
  actorId: string;
}

function normalizeStatus(value: string): string {
  const normalized = value.toLowerCase();
  if (["assigned", "in_progress", "completed", "failed", "expired", "exempt", "not_assigned"].includes(normalized)) {
    return normalized;
  }
  return "assigned";
}

async function upsertCourses(
  supabase: SupabaseClient,
  courses: ProviderCourseRecord[],
  context: SyncContext
): Promise<Map<string, string>> {
  const providerIdToCourseId = new Map<string, string>();

  for (const course of courses) {
    const { data, error } = await supabase
      .from("training_courses")
      .upsert(
        {
          organisation_id: context.organisationId,
          provider_course_id: course.provider_course_id,
          provider_name: course.provider_name,
          course_title: course.course_title,
          course_category: course.course_category,
          mandatory_flag: course.mandatory_flag,
          accreditation: course.accreditation,
          cpd_hours: course.cpd_hours,
          valid_for_days: course.valid_for_days,
          valid_for_months: course.valid_for_months,
          certificate_available: course.certificate_available,
          direct_course_url: course.direct_course_url,
          archived_flag: course.archived_flag,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "organisation_id,provider_name,provider_course_id" }
      )
      .select("id")
      .single();

    if (error || !data?.id) {
      throw new Error(`Failed upserting course ${course.provider_course_id}: ${error?.message ?? "missing id"}`);
    }

    providerIdToCourseId.set(course.provider_course_id, data.id);
  }

  return providerIdToCourseId;
}

async function upsertAssignments(
  supabase: SupabaseClient,
  assignments: ProviderAssignmentRecord[],
  courseMap: Map<string, string>,
  connection: TrainingProviderConnection,
  context: SyncContext
): Promise<void> {
  for (const assignment of assignments) {
    const courseId = courseMap.get(assignment.course_provider_id);
    if (!courseId) continue;

    const { error } = await supabase.from("training_assignments").upsert(
      {
        organisation_id: context.organisationId,
        staff_member_id: assignment.staff_member_id,
        course_id: courseId,
        assigned_by: context.actorId,
        assigned_at: assignment.assigned_at,
        due_date: assignment.due_date,
        status: normalizeStatus(assignment.status),
        provider_assignment_id: assignment.provider_assignment_id,
        provider_learner_id: assignment.provider_learner_id,
        direct_course_url: assignment.direct_course_url,
        last_provider_sync_at: assignment.last_provider_sync_at,
      },
      { onConflict: "organisation_id,staff_member_id,course_id" }
    );

    if (error) {
      throw new Error(`Failed upserting assignment for ${assignment.staff_member_id}: ${error.message}`);
    }

    await queueTrainingNotification({
      supabase,
      organisationId: context.organisationId,
      homeId: context.homeId,
      userId: assignment.staff_member_id,
      type: "course_assigned",
      title: "Training assigned",
      message: "A new training course has been assigned to you.",
      metadata: {
        provider: connection.provider_name,
        provider_assignment_id: assignment.provider_assignment_id,
        provider_course_id: assignment.course_provider_id,
      },
    });
  }
}

async function upsertCompletions(
  supabase: SupabaseClient,
  completions: ProviderCompletionRecord[],
  courseMap: Map<string, string>,
  context: SyncContext,
  warningWindowDays: number
): Promise<void> {
  for (const completion of completions) {
    const courseId = courseMap.get(completion.course_provider_id);
    if (!courseId) continue;

    const completionStatus = normalizeStatus(completion.completion_status);

    const { error: completionError } = await supabase.from("training_completions").upsert(
      {
        organisation_id: context.organisationId,
        staff_member_id: completion.staff_member_id,
        course_id: courseId,
        completed_at: completion.completed_at,
        completion_status: completionStatus,
        score: completion.score,
        certificate_url: completion.certificate_url,
        expires_at: completion.expires_at,
        renewal_due_at: completion.renewal_due_at,
        provider_completion_id: completion.provider_completion_id,
        synced_at: completion.synced_at,
        source: completion.source,
      },
      { onConflict: "organisation_id,provider_completion_id" }
    );

    if (completionError) {
      throw new Error(`Failed upserting completion ${completion.provider_completion_id}: ${completionError.message}`);
    }

    if (completion.certificate_url) {
      await supabase.from("training_certificates").upsert(
        {
          organisation_id: context.organisationId,
          staff_member_id: completion.staff_member_id,
          course_id: courseId,
          certificate_url: completion.certificate_url,
          status: "available",
          issued_at: completion.completed_at,
          expires_at: completion.expires_at,
        },
        { onConflict: "organisation_id,staff_member_id,course_id" }
      );
    }

    const complianceStatus = computeComplianceStatus({
      completionStatus: completionStatus as Parameters<typeof computeComplianceStatus>[0]["completionStatus"],
      dueDate: completion.renewal_due_at,
      expiresAt: completion.expires_at,
      warningWindowDays,
    });

    await upsertTrainingMatrixRow(
      supabase,
      {
        staff_member_id: completion.staff_member_id,
        course_id: courseId,
        home_id: context.homeId,
        role_id: null,
        requirement_type: "mandatory",
        assigned_status: completionStatus as Parameters<typeof computeComplianceStatus>[0]["completionStatus"],
        completion_status: completionStatus as Parameters<typeof computeComplianceStatus>[0]["completionStatus"],
        completed_at: completion.completed_at,
        expires_at: completion.expires_at,
        due_date: completion.renewal_due_at,
        days_until_due: computeDaysUntilDue(completion.renewal_due_at),
        compliance_status: complianceStatus,
        direct_course_url: null,
        certificate_status: completion.certificate_url ? "available" : "missing",
        last_synced_at: completion.synced_at,
      },
      { organisationId: context.organisationId }
    );

    await queueTrainingNotification({
      supabase,
      organisationId: context.organisationId,
      homeId: context.homeId,
      userId: completion.staff_member_id,
      type: "course_completed",
      title: "Training completed",
      message: "A training completion has been synced into Cornerstone.",
      metadata: {
        provider_completion_id: completion.provider_completion_id,
      },
    });
  }
}

export async function runTrainingSync(params: {
  supabase: SupabaseClient;
  connection: TrainingProviderConnection;
  organisationId: string;
  homeId: string | null;
  actorId: string;
  mode: "poll" | "manual" | "import" | "webhook";
  sinceIso?: string | null;
  importFile?: { fileName: string; contentType: string; buffer: Buffer };
  explicitDelta?: TrainingSyncDelta;
}): Promise<{ processed: number; warnings: string[] }> {
  const startedAt = new Date().toISOString();
  const warnings: string[] = [];

  const { data: syncLog, error: syncLogError } = await params.supabase
    .from("integration_sync_logs")
    .insert({
      organisation_id: params.organisationId,
      home_id: params.homeId,
      connection_id: params.connection.id,
      status: "running",
      started_at: startedAt,
      details: { mode: params.mode, sinceIso: params.sinceIso ?? null },
    })
    .select("id")
    .single();

  if (syncLogError || !syncLog?.id) {
    throw new Error(`Unable to create sync log: ${syncLogError?.message ?? "missing log id"}`);
  }

  const provider = trainingProviderRegistry.get(params.connection.provider_code);
  if (!provider) {
    throw new Error(`No training provider adapter registered for ${params.connection.provider_code}`);
  }

  try {
    let delta: TrainingSyncDelta;
    if (params.explicitDelta) {
      delta = params.explicitDelta;
    } else if (params.mode === "import") {
      if (!params.importFile) throw new Error("Import mode requires import file");
      delta = await provider.importRecords({
        connection: params.connection,
        fileName: params.importFile.fileName,
        contentType: params.importFile.contentType,
        buffer: params.importFile.buffer,
      });
    } else {
      delta = await provider.syncAll(params.connection, params.sinceIso ?? null);
    }

    const courseMap = await upsertCourses(params.supabase, delta.courses, {
      organisationId: params.organisationId,
      homeId: params.homeId,
      actorId: params.actorId,
    });

    await upsertAssignments(params.supabase, delta.assignments, courseMap, params.connection, {
      organisationId: params.organisationId,
      homeId: params.homeId,
      actorId: params.actorId,
    });

    const warningWindowDays = Number(params.connection.config.warningWindowDays ?? 30);

    await upsertCompletions(params.supabase, delta.completions, courseMap, {
      organisationId: params.organisationId,
      homeId: params.homeId,
      actorId: params.actorId,
    }, warningWindowDays);

    const processed = delta.courses.length + delta.assignments.length + delta.completions.length;

    await params.supabase.from("training_sync_events").insert({
      organisation_id: params.organisationId,
      home_id: params.homeId,
      connection_id: params.connection.id,
      provider_event_type: params.mode,
      records_processed: processed,
      payload: { mode: params.mode, warnings, rawEvents: delta.rawEvents ?? [] },
      processed_at: new Date().toISOString(),
      status: "processed",
    });

    await params.supabase
      .from("integration_sync_logs")
      .update({
        status: "success",
        records_processed: processed,
        completed_at: new Date().toISOString(),
        details: {
          mode: params.mode,
          warnings,
          courses: delta.courses.length,
          assignments: delta.assignments.length,
          completions: delta.completions.length,
        },
      })
      .eq("id", syncLog.id);

    await writeAuditLog({
      event: AUDIT_EVENTS.PROVIDER_SYNC,
      actorId: params.actorId,
      organisationId: params.organisationId,
      homeId: params.homeId,
      entityType: "training_sync",
      entityId: syncLog.id,
      metadata: {
        mode: params.mode,
        processed,
      },
    });

    return { processed, warnings };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown training sync error";

    await params.supabase.from("integration_error_logs").insert({
      organisation_id: params.organisationId,
      home_id: params.homeId,
      connection_id: params.connection.id,
      severity: "error",
      error_message: message,
      payload: { mode: params.mode },
    });

    await params.supabase
      .from("integration_sync_logs")
      .update({
        status: "failed",
        completed_at: new Date().toISOString(),
        details: { mode: params.mode, error: message },
      })
      .eq("id", syncLog.id);

    throw error;
  }
}
