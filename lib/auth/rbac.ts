import { AppRole } from '@/lib/auth/roles'

export interface NavItem {
  href: string
  label: string
  minRole: AppRole
}

export const ROLE_ORDER: AppRole[] = [
  'INDEPENDENT_VISITOR_READ_ONLY_AUDITOR',
  'RESIDENTIAL_SUPPORT_WORKER',
  'EDUCATION_TUTOR',
  'THERAPIST_CLINICAL_LEAD',
  'TEAM_LEADER',
  'TRAINING_COMPLIANCE_LEAD',
  'SAFER_RECRUITMENT_OFFICER',
  'HR_RECRUITMENT_LEAD',
  'DEPUTY_MANAGER',
  'REGISTERED_MANAGER',
  'DIRECTOR',
  'RESPONSIBLE_INDIVIDUAL',
  'ADMINISTRATOR'
]

const ROLE_INDEX = new Map(ROLE_ORDER.map((role, index) => [role, index]))

export function hasMinimumRole(role: AppRole, minRole: AppRole) {
  return (ROLE_INDEX.get(role) ?? 0) >= (ROLE_INDEX.get(minRole) ?? 0)
}

export const APP_NAV_ITEMS: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', minRole: 'INDEPENDENT_VISITOR_READ_ONLY_AUDITOR' },
  { href: '/registered-manager', label: 'Registered Manager', minRole: 'REGISTERED_MANAGER' },
  { href: '/young-people', label: 'Young People', minRole: 'RESIDENTIAL_SUPPORT_WORKER' },
  { href: '/health-safety', label: 'Health & Safety', minRole: 'RESIDENTIAL_SUPPORT_WORKER' },
  { href: '/safer-recruitment', label: 'Safer Recruitment', minRole: 'RESIDENTIAL_SUPPORT_WORKER' },
  { href: '/training', label: 'Training', minRole: 'TRAINING_COMPLIANCE_LEAD' },
  { href: '/reports', label: 'Reports', minRole: 'RESIDENTIAL_SUPPORT_WORKER' },
  { href: '/settings', label: 'Settings', minRole: 'REGISTERED_MANAGER' }
]

export function resolveVisibleNavItems(role: AppRole) {
  return APP_NAV_ITEMS.filter((item) => hasMinimumRole(role, item.minRole))
}

export function isRouteAllowed(pathname: string, role: AppRole) {
  const matched = APP_NAV_ITEMS.find((item) => pathname === item.href || pathname.startsWith(`${item.href}/`))

  if (!matched) {
    return true
  }

  return hasMinimumRole(role, matched.minRole)
}
