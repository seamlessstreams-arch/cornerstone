import { NextRequest, NextResponse } from "next/server";
import { resolvePhase3ServerContext } from "@/lib/phase3/server-auth";
import { resolveTrainingOrgContext } from "@/lib/training/context";
import { getTrainingProviderConnection } from "@/lib/training/provider-connection";
import { runTrainingSync } from "@/lib/training/sync";
import { requirePermission } from "@/lib/auth-guard";
import { PERMISSIONS } from "@/lib/permissions";

export async function GET(request: NextRequest) {
  try {
    const { supabase, actorId } = await resolvePhase3ServerContext(request);
    const context = await resolveTrainingOrgContext(supabase, actorId);

    const connection = await getTrainingProviderConnection(supabase, {
      organisationId: context.organisationId,
    });

    if (!connection) {
      return NextResponse.json({ connected: false, provider: null });
    }

    const { data: logs } = await supabase
      .from("integration_sync_logs")
      .select("id, status, records_processed, details, started_at, completed_at")
      .eq("connection_id", connection.id)
      .order("started_at", { ascending: false })
      .limit(20);

    const { data: errors } = await supabase
      .from("integration_error_logs")
      .select("id, severity, error_message, payload, created_at")
      .eq("connection_id", connection.id)
      .order("created_at", { ascending: false })
      .limit(20);

    return NextResponse.json({
      connected: true,
      provider: connection,
      logs: logs ?? [],
      errors: errors ?? [],
    });
  } catch (error) {
    console.error("Failed to fetch training sync status", error);
    return NextResponse.json({ error: "Failed to fetch training sync status" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = requirePermission(request, PERMISSIONS.MANAGE_TRAINING);
    if (auth instanceof NextResponse) {
      return auth;
    }

    const { supabase, actorId } = await resolvePhase3ServerContext(request);
    const body = await request.json().catch(() => ({}));
    const mode = body.mode === "poll" ? "poll" : "manual";
    const sinceIso = typeof body.sinceIso === "string" ? body.sinceIso : null;

    const context = await resolveTrainingOrgContext(supabase, actorId);
    const connection = await getTrainingProviderConnection(supabase, {
      organisationId: context.organisationId,
      providerCode: typeof body.providerCode === "string" ? body.providerCode : undefined,
    });

    if (!connection) {
      return NextResponse.json({ error: "No active training provider connection found" }, { status: 404 });
    }

    const result = await runTrainingSync({
      supabase,
      connection,
      organisationId: context.organisationId,
      homeId: context.homeId,
      actorId,
      mode,
      sinceIso,
    });

    await supabase
      .from("integration_connections")
      .update({
        last_successful_sync_at: new Date().toISOString(),
        last_sync_status: "success",
      })
      .eq("id", connection.id);

    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    console.error("Training sync run failed", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Training sync failed" },
      { status: 500 }
    );
  }
}
