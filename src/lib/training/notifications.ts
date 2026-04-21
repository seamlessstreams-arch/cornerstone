import type { SupabaseClient } from "@supabase/supabase-js";

interface QueueTrainingNotificationInput {
  supabase: SupabaseClient;
  organisationId: string;
  homeId: string | null;
  userId: string;
  type:
    | "course_assigned"
    | "course_due_soon"
    | "course_overdue"
    | "course_completed"
    | "certificate_available"
    | "course_expired"
    | "sync_failed"
    | "provider_connection_issue";
  title: string;
  message: string;
  metadata?: Record<string, unknown>;
}

export async function queueTrainingNotification(input: QueueTrainingNotificationInput): Promise<void> {
  const now = new Date().toISOString();

  const { error: trainingNotificationError } = await input.supabase.from("training_notifications").insert({
    organisation_id: input.organisationId,
    home_id: input.homeId,
    user_id: input.userId,
    notification_type: input.type,
    title: input.title,
    message: input.message,
    metadata: input.metadata ?? {},
    sent_via_in_app: true,
    sent_at: now,
  });

  if (trainingNotificationError) {
    throw new Error(`Failed to queue training notification: ${trainingNotificationError.message}`);
  }

  const { error: appNotificationError } = await input.supabase.from("notifications").insert({
    organisation_id: input.organisationId,
    home_id: input.homeId,
    user_id: input.userId,
    category: "training",
    title: input.title,
    message: input.message,
    metadata: input.metadata ?? {},
  });

  if (appNotificationError) {
    throw new Error(`Failed to queue in-app notification: ${appNotificationError.message}`);
  }
}
