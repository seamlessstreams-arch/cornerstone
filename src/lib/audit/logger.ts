import { createServiceRoleClient } from "@/lib/supabase/server";
import type { AuditEvent } from "@/lib/audit/events";

interface AuditPayload {
  event: AuditEvent;
  actorId: string | null;
  organisationId?: string | null;
  homeId?: string | null;
  entityType?: string | null;
  entityId?: string | null;
  metadata?: Record<string, unknown>;
}

export async function writeAuditLog(payload: AuditPayload): Promise<void> {
  const supabase = createServiceRoleClient();

  const { error } = await supabase.from("audit_logs").insert({
    event_type: payload.event,
    actor_user_id: payload.actorId,
    organisation_id: payload.organisationId ?? null,
    home_id: payload.homeId ?? null,
    entity_type: payload.entityType ?? null,
    entity_id: payload.entityId ?? null,
    metadata: payload.metadata ?? {},
  });

  if (error) {
    console.error("Audit log write failed", error.message, payload);
  }
}
