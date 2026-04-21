import { NextRequest, NextResponse } from "next/server";
import { resolvePhase3ServerContext } from "@/lib/phase3/server-auth";
import { resolveTrainingOrgContext } from "@/lib/training/context";
import { getTrainingProviderConnection } from "@/lib/training/provider-connection";
import { requirePermission } from "@/lib/auth-guard";
import { PERMISSIONS } from "@/lib/permissions";
import { trainingProviderRegistry } from "@/lib/integrations/training-provider-registry";

async function ensureProvider(supabase: Awaited<ReturnType<typeof resolvePhase3ServerContext>>["supabase"], providerCode: string) {
  const { data: existing } = await supabase
    .from("integration_providers")
    .select("id, provider_code, name")
    .eq("provider_code", providerCode)
    .maybeSingle();

  if (existing?.id) return existing;

  const { data: inserted, error } = await supabase
    .from("integration_providers")
    .insert({
      provider_code: providerCode,
      name: providerCode === "vocational_training_hub" ? "Vocational Training Hub" : providerCode,
      status: "active",
      supports_webhooks: true,
      supports_polling: true,
      supports_import: true,
    })
    .select("id, provider_code, name")
    .single();

  if (error || !inserted?.id) {
    throw new Error(`Unable to create provider: ${error?.message ?? "missing id"}`);
  }

  return inserted;
}

export async function GET(request: NextRequest) {
  try {
    const { supabase, actorId } = await resolvePhase3ServerContext(request);
    const context = await resolveTrainingOrgContext(supabase, actorId);

    const connection = await getTrainingProviderConnection(supabase, {
      organisationId: context.organisationId,
    });

    return NextResponse.json({
      providerCode: connection?.provider_code ?? "vocational_training_hub",
      enabled: connection?.status === "active",
      connection,
      capabilities: trainingProviderRegistry
        .list()
        .map((provider) => ({
          providerCode: provider.providerCode,
          supportsWebhooks: provider.supportsWebhooks,
          supportsPolling: provider.supportsPolling,
          supportsImports: provider.supportsImports,
        })),
    });
  } catch (error) {
    console.error("Failed to fetch provider config", error);
    return NextResponse.json({ error: "Failed to fetch provider configuration" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = requirePermission(request, PERMISSIONS.MANAGE_TRAINING);
    if (auth instanceof NextResponse) {
      return auth;
    }

    const { supabase, actorId } = await resolvePhase3ServerContext(request);
    const body = await request.json();

    const providerCode = typeof body.providerCode === "string" ? body.providerCode : "vocational_training_hub";
    const config = (body.config ?? {}) as Record<string, unknown>;

    const context = await resolveTrainingOrgContext(supabase, actorId);
    const provider = await ensureProvider(supabase, providerCode);

    const { data: connection, error } = await supabase
      .from("integration_connections")
      .upsert(
        {
          organisation_id: context.organisationId,
          home_id: context.homeId,
          provider_id: provider.id,
          provider_name: provider.name,
          provider_code: provider.provider_code,
          credentials_ref: (config.credentialsRef as string) || `${providerCode}-credentials`,
          config,
          status: body.enabled === false ? "disabled" : "active",
          polling_enabled: body.pollingEnabled !== false,
          polling_interval_minutes: Number(body.pollingIntervalMinutes ?? 30),
          warning_window_days: Number(body.warningWindowDays ?? 30),
          certificate_sync_enabled: body.certificateSyncEnabled !== false,
          course_catalog_sync_enabled: body.courseCatalogSyncEnabled !== false,
        },
        { onConflict: "organisation_id,provider_id" }
      )
      .select("*")
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({ ok: true, connection });
  } catch (error) {
    console.error("Failed to save provider config", error);
    return NextResponse.json({ error: "Failed to save provider configuration" }, { status: 500 });
  }
}
