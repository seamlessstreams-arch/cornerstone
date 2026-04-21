import type { SupabaseClient } from "@supabase/supabase-js";

export interface TrainingOrgContext {
  organisationId: string;
  homeId: string | null;
}

export async function resolveTrainingOrgContext(
  supabase: SupabaseClient,
  actorId: string
): Promise<TrainingOrgContext> {
  const { data: userRow } = await supabase
    .from("users")
    .select("organisation_id")
    .eq("id", actorId)
    .maybeSingle();

  let organisationId = userRow?.organisation_id ?? null;

  if (!organisationId) {
    const { data: firstOrg, error: orgError } = await supabase
      .from("organisations")
      .select("id")
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (orgError || !firstOrg?.id) {
      // Demo / local mode: no Supabase data. Return a sentinel so reads return []
      return { organisationId: "00000000-0000-0000-0000-000000000000", homeId: null };
    }

    organisationId = firstOrg.id;
  }

  const { data: firstHome } = await supabase
    .from("homes")
    .select("id")
    .eq("organisation_id", organisationId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  return {
    organisationId,
    homeId: firstHome?.id ?? null,
  };
}
