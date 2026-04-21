import { NextRequest, NextResponse } from "next/server";
import { resolvePhase3ServerContext, isMissingSupabaseTableError } from "@/lib/phase3/server-auth";
import { resolveReg45Context } from "@/lib/reg45/context";
import { requirePermission } from "@/lib/auth-guard";
import { PERMISSIONS } from "@/lib/permissions";
import { AUDIT_EVENTS } from "@/lib/audit/events";
import { writeAuditLog } from "@/lib/audit/logger";

export async function GET(request: NextRequest) {
  try {
    const { supabase, actorId } = await resolvePhase3ServerContext(request);
    const context = await resolveReg45Context(supabase, actorId);
    const { searchParams } = new URL(request.url);
    const cycleId = searchParams.get("cycleId");

    let query = supabase
      .from("reg45_actions")
      .select("*")
      .eq("organisation_id", context.organisationId)
      .order("deadline", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: false })
      .limit(400);

    if (cycleId) query = query.eq("cycle_id", cycleId);

    const { data, error } = await query;
    if (error) {
      if (isMissingSupabaseTableError(error)) return NextResponse.json({ actions: [] });
      throw error;
    }

    const actions = (data ?? []).map((row) => ({
      ...row,
      description: row.rationale,
    }));

    return NextResponse.json({ actions });
  } catch (error) {
    console.error("Failed to fetch Regulation 45 actions", error);
    return NextResponse.json({ error: "Failed to fetch Regulation 45 actions" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = requirePermission(request, PERMISSIONS.MANAGE_AUDITS);
    if (auth instanceof NextResponse) return auth;

    const { supabase, actorId } = await resolvePhase3ServerContext(request);
    const context = await resolveReg45Context(supabase, actorId);
    const body = await request.json();

    if (typeof body.cycleId !== "string" || typeof body.title !== "string") {
      return NextResponse.json({ error: "cycleId and title are required" }, { status: 400 });
    }

    const { data: action, error } = await supabase
      .from("reg45_actions")
      .insert({
        organisation_id: context.organisationId,
        home_id: typeof body.homeId === "string" ? body.homeId : context.homeId,
        cycle_id: body.cycleId,
        title: body.title,
        rationale: typeof body.description === "string" ? body.description : null,
        priority: typeof body.priority === "string" ? body.priority : "medium",
        status: typeof body.status === "string" ? body.status : "open",
        owner_user_id: typeof body.ownerUserId === "string" ? body.ownerUserId : null,
        deadline: typeof body.deadline === "string" ? body.deadline : null,
        review_date: typeof body.reviewDate === "string" ? body.reviewDate : null,
        metadata: {
          findingId: typeof body.findingId === "string" ? body.findingId : null,
          completionNotes: typeof body.completionNotes === "string" ? body.completionNotes : null,
          ownerRole: typeof body.ownerRole === "string" ? body.ownerRole : null,
        },
        created_by: actorId,
      })
      .select("*")
      .single();

    if (error) throw error;

    const evidenceIds = Array.isArray(body.evidenceIds) ? body.evidenceIds.filter((id: unknown) => typeof id === "string") : [];
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

    await writeAuditLog({
      event: AUDIT_EVENTS.RECORD_CREATE,
      actorId,
      organisationId: context.organisationId,
      homeId: action.home_id,
      entityType: "reg45_action",
      entityId: action.id,
      metadata: { cycleId: action.cycle_id },
    });

    const normalizedAction = {
      ...action,
      description: action.rationale,
    };

    return NextResponse.json({ action: normalizedAction }, { status: 201 });
  } catch (error) {
    console.error("Failed to create Regulation 45 action", error);
    return NextResponse.json({ error: "Failed to create Regulation 45 action" }, { status: 500 });
  }
}
