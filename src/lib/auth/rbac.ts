import type { CornerstoneRole } from "@/lib/auth/roles";

export const RBAC_ACTIONS = [
  "view",
  "create",
  "edit",
  "approve",
  "upload",
  "verify",
  "export",
  "report_access",
  "admin_config",
] as const;

export type RbacAction = (typeof RBAC_ACTIONS)[number];

export type RbacCapability = Record<RbacAction, boolean>;

const fullAccess: RbacCapability = {
  view: true,
  create: true,
  edit: true,
  approve: true,
  upload: true,
  verify: true,
  export: true,
  report_access: true,
  admin_config: true,
};

const readOnly: RbacCapability = {
  view: true,
  create: false,
  edit: false,
  approve: false,
  upload: false,
  verify: false,
  export: false,
  report_access: true,
  admin_config: false,
};

const contributor: RbacCapability = {
  view: true,
  create: true,
  edit: true,
  approve: false,
  upload: true,
  verify: false,
  export: false,
  report_access: true,
  admin_config: false,
};

const reviewer: RbacCapability = {
  view: true,
  create: true,
  edit: true,
  approve: true,
  upload: true,
  verify: true,
  export: true,
  report_access: true,
  admin_config: false,
};

export const ROLE_CAPABILITIES: Record<CornerstoneRole, RbacCapability> = {
  administrator: fullAccess,
  responsible_individual: fullAccess,
  director: fullAccess,
  registered_manager: fullAccess,
  deputy_manager: reviewer,
  team_leader: reviewer,
  residential_support_worker: contributor,
  therapist_clinical_lead: contributor,
  education_tutor: contributor,
  hr_recruitment_lead: reviewer,
  safer_recruitment_officer: reviewer,
  training_compliance_lead: reviewer,
  independent_visitor_read_only_auditor: readOnly,
};

export function can(role: CornerstoneRole, action: RbacAction): boolean {
  return ROLE_CAPABILITIES[role][action];
}
