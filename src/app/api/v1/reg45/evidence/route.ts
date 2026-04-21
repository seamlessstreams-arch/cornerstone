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
    const verificationStatus = searchParams.get("verificationStatus");
    const category = searchParams.get("category");

    let query = supabase
      .from("reg45_evidence_items")
      .select("*")
      .eq("organisation_id", context.organisationId)
      .order("uploaded_at", { ascending: false })
      .limit(300);

    if (cycleId) query = query.eq("cycle_id", cycleId);
    if (verificationStatus) query = query.eq("verification_status", verificationStatus);
    if (category) query = query.eq("category", category);

    const { data, error } = await query;
    if (error) {
      if (isMissingSupabaseTableError(error)) return NextResponse.json({ evidence: [] });
      throw error;
    }

    return NextResponse.json({ evidence: data ?? [] });
  } catch (error) {
    console.error("Failed to fetch Regulation 45 evidence", error);
    return NextResponse.json({ error: "Failed to fetch Regulation 45 evidence" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = requirePermission(request, PERMISSIONS.CREATE_FORMS);
    if (auth instanceof NextResponse) return auth;

    const { supabase, actorId } = await resolvePhase3ServerContext(request);
    const context = await resolveReg45Context(supabase, actorId);

    const body = await request.json();

    if (typeof body.cycleId !== "string") {
      return NextResponse.json({ error: "cycleId is required" }, { status: 400 });
    }

    if (typeof body.title !== "string" || typeof body.category !== "string" || typeof body.sourceType !== "string") {
      return NextResponse.json({ error: "title, category, and sourceType are required" }, { status: 400 });
    }

    const { data: evidence, error } = await supabase
      .from("reg45_evidence_items")
      .insert({
        organisation_id: context.organisationId,
        home_id: typeof body.homeId === "string" ? body.homeId : context.homeId,
        cycle_id: body.cycleId,
        title: body.title,
        description: typeof body.description === "string" ? body.description : null,
        category: body.category,
        subcategory: typeof body.subcategory === "string" ? body.subcategory : null,
        source_type: body.sourceType,
        evidence_date: typeof body.evidenceDate === "string" ? body.evidenceDate : null,
        review_period_tag: typeof body.reviewPeriodTag === "string" ? body.reviewPeriodTag : null,
        confidentiality_level: typeof body.confidentialityLevel === "string" ? body.confidentialityLevel : "standard",
        attachment_id: typeof body.attachmentId === "string" ? body.attachmentId : null,
        linked_child_ids: Array.isArray(body.linkedChildIds) ? body.linkedChildIds : [],
        linked_staff_member_id: typeof body.linkedStaffMemberId === "string" ? body.linkedStaffMemberId : null,
        linked_form_record_id: typeof body.linkedFormRecordId === "string" ? body.linkedFormRecordId : null,
        uploaded_by: actorId,
        uploaded_at: new Date().toISOString(),
        verification_status: "pending_review",
        tags: Array.isArray(body.tags) ? body.tags : [],
        is_consultation_evidence: body.isConsultationEvidence === true,
        is_trend_evidence: body.isTrendEvidence === true,
        is_previous_action_evidence: body.isPreviousActionEvidence === true,
        metadata: {
          markedSensitive: body.markedSensitive === true,
          markedUsedInReport: body.markedUsedInReport === true,
        },
      })
      .select("*")
      .single();

    if (error) throw error;

    await writeAuditLog({
      event: AUDIT_EVENTS.FILE_UPLOAD,
      actorId,
      organisationId: context.organisationId,
      homeId: evidence.home_id,
      entityType: "reg45_evidence_item",
      entityId: evidence.id,
      metadata: {
        cycleId: evidence.cycle_id,
        category: evidence.category,
      },
    });

    return NextResponse.json({ evidence }, { status: 201 });
  } catch (error) {
    console.error("Failed to create Regulation 45 evidence", error);
    return NextResponse.json({ error: "Failed to create Regulation 45 evidence" }, { status: 500 });
  }
}
