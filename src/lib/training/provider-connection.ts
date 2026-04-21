import type { SupabaseClient } from "@supabase/supabase-js";
import type { TrainingProviderConnection } from "@/lib/training/types";

export async function getTrainingProviderConnection(
  supabase: SupabaseClient,
  input: { organisationId: string; providerCode?: string }
): Promise<TrainingProviderConnection | null> {
  const providerCode = input.providerCode ?? "vocational_training_hub";

  const { data: provider, error: providerError } = await supabase
    .from("integration_providers")
    .select("id, provider_code, name")
    .eq("provider_code", providerCode)
    .maybeSingle();

  if (providerError || !provider?.id) {
    return null;
  }

  const { data: connection, error: connectionError } = await supabase
    .from("integration_connections")
    .select("id, organisation_id, home_id, provider_id, provider_name, provider_code, status, config, credentials_ref")
    .eq("organisation_id", input.organisationId)
    .eq("provider_id", provider.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (connectionError || !connection) {
    return null;
  }

  return {
    id: connection.id,
    organisation_id: connection.organisation_id,
    home_id: connection.home_id,
    provider_id: connection.provider_id,
    provider_code: connection.provider_code || provider.provider_code,
    provider_name: connection.provider_name || provider.name,
    status: connection.status,
    config: (connection.config ?? {}) as Record<string, unknown>,
    credentials_ref: connection.credentials_ref,
  };
}
