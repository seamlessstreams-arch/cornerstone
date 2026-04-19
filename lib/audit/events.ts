import { z } from 'zod'

export const auditActionSchema = z.enum([
  'CREATE',
  'UPDATE',
  'ARCHIVE',
  'DELETE',
  'UPLOAD',
  'VIEW_FILE',
  'VERIFY_FILE',
  'GENERATE_REPORT',
  'PROVIDER_SYNC_EVENT',
  'ADMIN_CONFIG_CHANGE'
])

export type AuditAction = z.infer<typeof auditActionSchema>

export const auditEventSchema = z.object({
  action: auditActionSchema,
  entityType: z.string().min(1),
  entityId: z.string().uuid().optional(),
  organisationId: z.string().uuid().optional(),
  homeId: z.string().uuid().optional(),
  payload: z.record(z.string(), z.unknown()).optional()
})

export type AuditEventInput = z.infer<typeof auditEventSchema>
