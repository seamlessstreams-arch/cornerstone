import { NextRequest, NextResponse } from "next/server";
import { isMissingSupabaseTableError, resolvePhase3ServerContext } from "@/lib/phase3/server-auth";
import { resolveReg45Context } from "@/lib/reg45/context";
import { requirePermission } from "@/lib/auth-guard";
import { PERMISSIONS } from "@/lib/permissions";
import { AUDIT_EVENTS } from "@/lib/audit/events";
import { writeAuditLog } from "@/lib/audit/logger";

/**
 * GET /api/v1/reg45/oversight?entityType=reg45_cycle&entityId=xxx&cycleId=xxx
 * Returns management oversight entries for a Reg 45 entity (cycle, finding, evidence item, report).
 *
 * POST /api/v1/reg45/oversight
 * Creates a new management oversight entry for a Reg 45 entity.
 */

export async function GET(request: NextRequest) {
  try {
    const { supabase } = await resolvePhase3ServerContext(request);
    const { searchParams } = new URL(request.url);

    const entityType = searchParams.get("entityType");
    const entityId = searchParams.get("entityId");

    if (!entityType || !entityId) {
      return NextResponse.json({ error: "entityType and entityId are required" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("management_oversight_entries")
      .select(
        `id, entity_type, entity_id, overseen_by, role, oversight_date,
         commentary, challenge_notes, approval_decision, action_required,
         deadline, sign_off_status, created_at`
      )
      .eq("entity_type", entityType)
      .eq("entity_id", entityId)
      .order("created_at", { ascending: false });

    if (isMissingSupabaseTableError(error)) {
      return NextResponse.json({ entries: [] });
    }

    if (error) {
      console.error("Failed to fetch Reg 45 oversight entries", error);
      return NextResponse.json({ error: "Failed to fetch oversight entries" }, { status: 500 });
    }

    return NextResponse.json({ entries: data ?? [] });
  } catch (error) {
    console.error("Failed to fetch Reg 45 oversight entries", error);
    return NextResponse.json({ error: "Failed to fetch oversight entries" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = requirePermission(request, PERMISSIONS.MANAGE_AUDITS);
    if (auth instanceof NextResponse) return auth;

    const { supabase, actorId } = await resolvePhase3ServerContext(request);
    const context = await resolveReg45Context(supabase, actorId);
    const body = await request.json();

    const entityType = typeof body.entityType === "string" ? body.entityType : null;
    const entityId = typeof body.entityId === "string" ? body.entityId : null;
    const cycleId = typeof body.cycleId === "string" ? body.cycleId : null;

    if (!entityType || !entityId) {
      return NextResponse.json({ error: "entityType and entityId are required" }, { status: 400 });
    }

    const { data: entry, error } = await supabase
      .from("management_oversight_entries")
      .insert({
        entity_type: entityType,
        entity_id: entityId,
        cycle_id: cycleId,
        organisation_id: context.organisationId,
        home_id: context.homeId,
        overseen_by: actorId,
        role: typeof body.role === "string" ? body.role : null,
        oversight_date: typeof body.oversightDate === "string" ? body.oversightDate : new Date().toISOString().slice(0, 10),
        commentary: typeof body.commentary === "string" ? body.commentary : null,
        challenge_notes: typeof body.challengeNotes === "string" ? body.challengeNotes : null,
        approval_decision: typeof body.approvalDecision === "string" ? body.approvalDecision : "pending",
        action_required: typeof body.actionRequired === "string" ? body.actionRequired : null,
        deadline: typeof body.deadline === "string" ? body.deadline : null,
        sign_off_status: typeof body.signOffStatus === "string" ? body.signOffStatus : "pending",
      })
      .select("*")
      .single();

    if (isMissingSupabaseTableError(error)) {
      return NextResponse.json({ entry: null, warning: "Oversight table not yet available in this environment." });
    }

    if (error || !entry) {
      console.error("Failed to create Reg 45 oversight entry", error);
      return NextResponse.json({ error: "Failed to create oversight entry" }, { status: 500 });
    }

    await writeAuditLog({
      event: AUDIT_EVENTS.RECORD_CREATE,
      actorId,
      organisationId: context.organisationId,
      homeId: context.homeId,
      entityType: "reg45_oversight_entry",
      entityId: entry.id,
      metadata: {
        entityType,
        entityId,
        approvalDecision: entry.approval_decision,
      },
    });

    return NextResponse.json({ entry });
  } catch (error) {
    console.error("Failed to create Reg 45 oversight entry", error);
    return NextResponse.json({ error: "Failed to create oversight entry" }, { status: 500 });
  }
}
