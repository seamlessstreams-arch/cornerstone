import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { getTrainingProviderConnection } from "@/lib/training/provider-connection";
import { trainingProviderRegistry } from "@/lib/integrations/training-provider-registry";
import { runTrainingSync } from "@/lib/training/sync";

export async function POST(request: NextRequest) {
  const supabase = createServiceRoleClient();

  try {
    const rawBody = await request.text();
    const payload = JSON.parse(rawBody) as Record<string, unknown>;

    const providerCode = "vocational_training_hub";

    const organisationIdFromPayload =
      typeof payload.organisation_id === "string" ? payload.organisation_id : null;

    if (!organisationIdFromPayload) {
      return NextResponse.json({ error: "Missing organisation_id in webhook payload" }, { status: 400 });
    }

    const connection = await getTrainingProviderConnection(supabase, {
      organisationId: organisationIdFromPayload,
      providerCode,
    });

    if (!connection) {
      return NextResponse.json({ error: "No active connection for webhook organisation" }, { status: 404 });
    }

    const provider = trainingProviderRegistry.get(providerCode);
    if (!provider) {
      return NextResponse.json({ error: "No provider adapter registered" }, { status: 500 });
    }

    const webhookResult = await provider.handleWebhook({
      connection,
      headers: request.headers,
      rawBody,
      payload,
    });

    const { data: eventLog, error: eventError } = await supabase
      .from("integration_webhook_events")
      .insert({
        organisation_id: connection.organisation_id,
        home_id: connection.home_id,
        provider_id: connection.provider_id,
        event_key: webhookResult.externalEventId ?? webhookResult.eventType,
        payload,
        received_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (eventError) {
      throw eventError;
    }

    if (!webhookResult.accepted) {
      await supabase.from("integration_error_logs").insert({
        organisation_id: connection.organisation_id,
        home_id: connection.home_id,
        connection_id: connection.id,
        severity: "warning",
        error_message: `Rejected webhook event: ${webhookResult.eventType}`,
        payload,
      });

      return NextResponse.json({ accepted: false, reason: webhookResult.eventType }, { status: 202 });
    }

    const syncResult = await runTrainingSync({
      supabase,
      connection,
      organisationId: connection.organisation_id,
      homeId: connection.home_id,
      actorId: "00000000-0000-0000-0000-000000000000",
      mode: "webhook",
      explicitDelta: webhookResult.delta,
    });

    await supabase
      .from("integration_webhook_events")
      .update({ processed_at: new Date().toISOString() })
      .eq("id", eventLog.id);

    return NextResponse.json({
      accepted: true,
      eventType: webhookResult.eventType,
      processed: syncResult.processed,
      warnings: syncResult.warnings,
    });
  } catch (error) {
    console.error("VTH webhook processing failed", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Webhook processing failed" },
      { status: 500 }
    );
  }
}
