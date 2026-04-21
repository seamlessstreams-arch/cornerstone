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
      .from("reg45_consultation_entries")
      .select("*")
      .eq("organisation_id", context.organisationId)
      .order("consultation_date", { ascending: false })
      .limit(300);

    if (cycleId) query = query.eq("cycle_id", cycleId);

    const { data, error } = await query;
    if (error) {
      if (isMissingSupabaseTableError(error)) return NextResponse.json({ consultations: [] });
      throw error;
    }

    const consultations = (data ?? []).map((row) => ({
      ...row,
      summary: row.summary_text,
    }));

    return NextResponse.json({ consultations });
  } catch (error) {
    console.error("Failed to fetch Regulation 45 consultations", error);
    return NextResponse.json({ error: "Failed to fetch Regulation 45 consultations" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = requirePermission(request, PERMISSIONS.MANAGE_AUDITS);
    if (auth instanceof NextResponse) return auth;

    const { supabase, actorId } = await resolvePhase3ServerContext(request);
    const context = await resolveReg45Context(supabase, actorId);
    const body = await request.json();

    if (
      typeof body.cycleId !== "string" ||
      typeof body.consultationGroup !== "string" ||
      typeof body.summary !== "string"
    ) {
      return NextResponse.json({ error: "cycleId, consultationGroup, and summary are required" }, { status: 400 });
    }

    const { data: consultation, error } = await supabase
      .from("reg45_consultation_entries")
      .insert({
        organisation_id: context.organisationId,
        home_id: typeof body.homeId === "string" ? body.homeId : context.homeId,
        cycle_id: body.cycleId,
        consultation_group: body.consultationGroup,
        participant_name: typeof body.participantName === "string" ? body.participantName : null,
        participant_role: typeof body.participantRole === "string" ? body.participantRole : null,
        source_type: typeof body.sourceType === "string" ? body.sourceType : "meeting_note",
        summary_text: body.summary,
        sentiment: typeof body.sentiment === "string" ? body.sentiment : null,
        linked_evidence_item_id: typeof body.linkedEvidenceItemId === "string" ? body.linkedEvidenceItemId : null,
        consultation_date: typeof body.consultationDate === "string" ? body.consultationDate : new Date().toISOString().slice(0, 10),
        created_by: actorId,
      })
      .select("*")
      .single();

    if (error) throw error;

    await writeAuditLog({
      event: AUDIT_EVENTS.RECORD_CREATE,
      actorId,
      organisationId: context.organisationId,
      homeId: consultation.home_id,
      entityType: "reg45_consultation_entry",
      entityId: consultation.id,
      metadata: { consultationGroup: consultation.consultation_group },
    });

    const normalizedConsultation = {
      ...consultation,
      summary: consultation.summary_text,
    };

    return NextResponse.json({ consultation: normalizedConsultation }, { status: 201 });
  } catch (error) {
    console.error("Failed to create Regulation 45 consultation entry", error);
    return NextResponse.json({ error: "Failed to create Regulation 45 consultation entry" }, { status: 500 });
  }
}
