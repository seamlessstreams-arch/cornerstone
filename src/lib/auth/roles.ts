import type { User } from "@supabase/supabase-js";

export const CORNERSTONE_ROLES = [
  "administrator",
  "responsible_individual",
  "director",
  "registered_manager",
  "deputy_manager",
  "team_leader",
  "residential_support_worker",
  "therapist_clinical_lead",
  "education_tutor",
  "hr_recruitment_lead",
  "safer_recruitment_officer",
  "training_compliance_lead",
  "independent_visitor_read_only_auditor",
] as const;

export type CornerstoneRole = (typeof CORNERSTONE_ROLES)[number];

export const DEFAULT_ROLE: CornerstoneRole = "residential_support_worker";

export function isCornerstoneRole(value: string | null | undefined): value is CornerstoneRole {
  return !!value && (CORNERSTONE_ROLES as readonly string[]).includes(value);
}

export function resolveCornerstoneRole(user: User | null | undefined): CornerstoneRole {
  const appMeta = user?.app_metadata as Record<string, unknown> | undefined;
  const userMeta = user?.user_metadata as Record<string, unknown> | undefined;

  const candidate =
    (typeof appMeta?.cornerstone_role === "string" && appMeta.cornerstone_role) ||
    (typeof appMeta?.role === "string" && appMeta.role) ||
    (typeof userMeta?.cornerstone_role === "string" && userMeta.cornerstone_role) ||
    (typeof userMeta?.role === "string" && userMeta.role) ||
    null;

  return isCornerstoneRole(candidate) ? candidate : DEFAULT_ROLE;
}
