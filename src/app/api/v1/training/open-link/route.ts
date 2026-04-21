import { NextRequest, NextResponse } from "next/server";
import { resolvePhase3ServerContext } from "@/lib/phase3/server-auth";
import { resolveTrainingOrgContext } from "@/lib/training/context";
import { getTrainingProviderConnection } from "@/lib/training/provider-connection";
import { trainingProviderRegistry } from "@/lib/integrations/training-provider-registry";
import { AUDIT_EVENTS } from "@/lib/audit/events";
import { writeAuditLog } from "@/lib/audit/logger";

export async function POST(request: NextRequest) {
  try {
    const { supabase, actorId } = await resolvePhase3ServerContext(request);
    const body = await request.json();

    const providerCourseId = typeof body.providerCourseId === "string" ? body.providerCourseId : null;
    const providerName = typeof body.providerName === "string" ? body.providerName : "vocational_training_hub";
    const providerLearnerId = typeof body.providerLearnerId === "string" ? body.providerLearnerId : null;
    const fallbackCourseUrl = typeof body.fallbackCourseUrl === "string" ? body.fallbackCourseUrl : null;
    const courseId = typeof body.courseId === "string" ? body.courseId : null;

    if (!providerCourseId) {
      return NextResponse.json({ error: "providerCourseId is required" }, { status: 400 });
    }

    const context = await resolveTrainingOrgContext(supabase, actorId);
    const connection = await getTrainingProviderConnection(supabase, {
      organisationId: context.organisationId,
      providerCode: providerName,
    });

    if (!connection) {
      return NextResponse.json({ error: "No provider connection configured" }, { status: 404 });
    }

    const provider = trainingProviderRegistry.get(connection.provider_code);
    if (!provider) {
      return NextResponse.json({ error: "No adapter registered for provider" }, { status: 404 });
    }

    const targetUrl = provider.resolveLearnerCourseUrl({
      connection,
      providerLearnerId,
      providerCourseId,
      fallbackCourseUrl,
    });

    if (!targetUrl) {
      return NextResponse.json({ error: "Unable to resolve course URL" }, { status: 404 });
    }

    await supabase.from("training_provider_links").upsert(
      {
        organisation_id: context.organisationId,
        home_id: context.homeId,
        staff_member_id: actorId,
        course_id: courseId,
        provider_name: connection.provider_name,
        link_url: targetUrl,
        click_count: 1,
        last_clicked_at: new Date().toISOString(),
        last_clicked_by: actorId,
      },
      { onConflict: "organisation_id,staff_member_id,course_id,provider_name", ignoreDuplicates: false }
    );

    const { error: incrementError } = await supabase.rpc("increment_training_link_click", {
      p_organisation_id: context.organisationId,
      p_staff_member_id: actorId,
      p_course_id: courseId,
      p_provider_name: connection.provider_name,
    });

    if (incrementError) {
      // Non-blocking if helper function is not installed.
      console.warn("Failed to increment training link click counter", incrementError);
    }

    await writeAuditLog({
      event: AUDIT_EVENTS.PROVIDER_SYNC,
      actorId,
      organisationId: context.organisationId,
      homeId: context.homeId,
      entityType: "training_provider_link",
      entityId: `${actorId}:${providerCourseId}`,
      metadata: {
        providerCourseId,
        providerName: connection.provider_name,
        url: targetUrl,
      },
    });

    return NextResponse.json({ ok: true, url: targetUrl });
  } catch (error) {
    console.error("Failed to resolve/open provider training link", error);
    return NextResponse.json({ error: "Failed to open provider training link" }, { status: 500 });
  }
}
