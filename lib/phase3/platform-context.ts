import { AppRole } from '@/lib/auth/roles'
import { prisma } from '@/lib/prisma'

export interface Phase3Actor {
  userId: string
  email: string | null
  role: AppRole
  homeId: string
}

export interface PlatformContext {
  organisationId: string
  homeId: string
  platformUserId: string
}

const PHASE3_AUDIT_LOGGING_ENABLED = process.env.PHASE3_AUDIT_LOGGING === 'true'

function sanitizeIdSegment(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9_-]/g, '_')
}

export async function ensurePlatformContext(actor: Phase3Actor): Promise<PlatformContext> {
  // Mock mode uses deterministic IDs to avoid context drift across requests.
  const mockOrgId = 'org_demo'
  const mockHomeId = `home_${sanitizeIdSegment(actor.homeId)}`
  const mockUserId = `user_${sanitizeIdSegment(actor.userId)}`

  return {
    organisationId: mockOrgId,
    homeId: mockHomeId,
    platformUserId: mockUserId
  }
}

export async function writeAuditLog(input: {
  organisationId: string
  homeId: string
  platformUserId: string
  action: string
  entityType: string
  entityId?: string
  payload?: Record<string, unknown>
}) {
  if (!PHASE3_AUDIT_LOGGING_ENABLED) {
    return
  }

  try {
    await prisma.auditLog.create({
      data: {
        userId: input.platformUserId,
        action: input.action,
        recordType: input.entityType,
        recordId: input.entityId ?? `${input.entityType}:${Date.now()}`
      }
    })
  } catch (err) {
    console.warn('Unable to write phase 3 audit log:', err)
  }
}
