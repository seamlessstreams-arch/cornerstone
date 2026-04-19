export const ALLOWED_APP_ROLES = [
  'ADMINISTRATOR',
  'RESPONSIBLE_INDIVIDUAL',
  'DIRECTOR',
  'REGISTERED_MANAGER',
  'DEPUTY_MANAGER',
  'TEAM_LEADER',
  'RESIDENTIAL_SUPPORT_WORKER',
  'THERAPIST_CLINICAL_LEAD',
  'EDUCATION_TUTOR',
  'HR_RECRUITMENT_LEAD',
  'SAFER_RECRUITMENT_OFFICER',
  'TRAINING_COMPLIANCE_LEAD',
  'INDEPENDENT_VISITOR_READ_ONLY_AUDITOR'
] as const

export type AppRole = (typeof ALLOWED_APP_ROLES)[number]

const LEGACY_ROLE_MAP: Record<string, AppRole> = {
  ADMIN: 'ADMINISTRATOR',
  MANAGER: 'REGISTERED_MANAGER',
  STAFF: 'RESIDENTIAL_SUPPORT_WORKER'
}

type UnknownRecord = Record<string, unknown>

function asRecord(value: unknown): UnknownRecord {
  return value && typeof value === 'object' ? (value as UnknownRecord) : {}
}

function readString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

function implicitFallbackRole(): AppRole {
  return process.env.NODE_ENV === 'production' ? 'RESIDENTIAL_SUPPORT_WORKER' : 'REGISTERED_MANAGER'
}

export function normalizeAppRole(value: unknown, fallback: AppRole = implicitFallbackRole()): AppRole {
  const normalizedFallback = (LEGACY_ROLE_MAP[fallback] ?? fallback) as AppRole
  const candidate = readString(value)?.toUpperCase()

  if (!candidate) return normalizedFallback

  const normalized = LEGACY_ROLE_MAP[candidate] ?? candidate

  if ((ALLOWED_APP_ROLES as readonly string[]).includes(normalized)) {
    return normalized as AppRole
  }

  return normalizedFallback
}

export function resolveHomeIdFromMetadata(
  appMetadata: unknown,
  userMetadata: unknown,
  fallback = 'acacia-home'
): string {
  const appMeta = asRecord(appMetadata)
  const userMeta = asRecord(userMetadata)

  return (
    readString(userMeta.home_id) ??
    readString(userMeta.homeId) ??
    readString(appMeta.home_id) ??
    readString(appMeta.homeId) ??
    fallback
  )
}
