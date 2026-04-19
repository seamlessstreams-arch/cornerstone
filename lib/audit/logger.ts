import { NextRequest } from 'next/server'
import { AuditEventInput, auditEventSchema } from '@/lib/audit/events'
import { Json } from '@/lib/supabase/database.types'
import { createSupabaseServiceRoleClient } from '@/lib/supabase/server'

export async function logAuditEvent(event: AuditEventInput, request?: NextRequest) {
  const parsed = auditEventSchema.safeParse(event)

  if (!parsed.success) {
    throw new Error(`Invalid audit event: ${parsed.error.issues.map((issue) => issue.message).join(', ')}`)
  }

  const supabase = createSupabaseServiceRoleClient()

  const { error } = await supabase.from('audit_logs').insert({
    organisation_id: parsed.data.organisationId ?? null,
    home_id: parsed.data.homeId ?? null,
    action: parsed.data.action,
    entity_type: parsed.data.entityType,
    entity_id: parsed.data.entityId ?? null,
    payload: (parsed.data.payload ?? null) as Json | null,
    ip_address: request?.headers.get('x-forwarded-for') ?? null,
    user_agent: request?.headers.get('user-agent') ?? null
  })

  if (error) {
    throw new Error(`Failed to persist audit event: ${error.message}`)
  }
}
