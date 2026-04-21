import { NextRequest, NextResponse } from "next/server";
import { resolvePhase3ServerContext } from "@/lib/phase3/server-auth";
import { resolveReg45Context } from "@/lib/reg45/context";
import { requirePermission } from "@/lib/auth-guard";
import { PERMISSIONS } from "@/lib/permissions";
import { AUDIT_EVENTS } from "@/lib/audit/events";
import { writeAuditLog } from "@/lib/audit/logger";

interface RouteParams {
  params: Promise<{ actionId: string }>;
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = requirePermission(request, PERMISSIONS.MANAGE_AUDITS);
    if (auth instanceof NextResponse) return auth;

    const { actionId } = await params;
    const { supabase, actorId } = await resolvePhase3ServerContext(request);
    const context = await resolveReg45Context(supabase, actorId);
    const body = await request.json();

    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (typeof body.title === "string") updates.title = body.title;
    if (typeof body.description === "string") updates.rationale = body.description;
    if (typeof body.status === "string") updates.status = body.status;
    if (typeof body.priority === "string") updates.priority = body.priority;
    if (typeof body.ownerUserId === "string" || body.ownerUserId === null) updates.owner_user_id = body.ownerUserId;
    if (typeof body.deadline === "string" || body.deadline === null) updates.deadline = body.deadline;
    if (typeof body.reviewDate === "string" || body.reviewDate === null) updates.review_date = body.reviewDate;

    if (body.status === "completed") {
      updates.completed_at = new Date().toISOString();
    }

    if (
      typeof body.completionNotes === "string" ||
      typeof body.ownerRole === "string" ||
      typeof body.findingId === "string" ||
      body.findingId === null
    ) {
      updates.metadata = {
        completionNotes: typeof body.completionNotes === "string" ? body.completionNotes : null,
        ownerRole: typeof body.ownerRole === "string" ? body.ownerRole : null,
        findingId: typeof body.findingId === "string" ? body.findingId : null,
      };
    }

    const { data: action, error } = await supabase
      .from("reg45_actions")
      .update(updates)
      .eq("id", actionId)
      .eq("organisation_id", context.organisationId)
      .select("*")
      .single();

    if (error || !action) return NextResponse.json({ error: "Action not found" }, { status: 404 });

    if (Array.isArray(body.evidenceIds)) {
      await supabase.from("reg45_evidence_links").delete().eq("action_id", actionId);
      const evidenceIds = body.evidenceIds.filter((id: unknown) => typeof id === "string");
      if (evidenceIds.length > 0) {
        await supabase.from("reg45_evidence_links").insert(
          evidenceIds.map((evidenceId: string) => ({
            organisation_id: context.organisationId,
            cycle_id: action.cycle_id,
            evidence_item_id: evidenceId,
            action_id: action.id,
            relation_type: "required",
          }))
        );
      }
    }

    await writeAuditLog({
      event: AUDIT_EVENTS.RECORD_UPDATE,
      actorId,
      organisationId: context.organisationId,
      homeId: action.home_id,
      entityType: "reg45_action",
      entityId: action.id,
      metadata: { status: action.status },
    });

    const normalizedAction = {
      ...action,
      description: action.rationale,
    };

    return NextResponse.json({ action: normalizedAction });
  } catch (error) {
    console.error("Failed to update Regulation 45 action", error);
    return NextResponse.json({ error: "Failed to update Regulation 45 action" }, { status: 500 });
  }
}
