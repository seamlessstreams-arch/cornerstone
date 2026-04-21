import { NextRequest, NextResponse } from "next/server";
import { writeAuditLog } from "@/lib/audit/logger";
import { AUDIT_EVENTS } from "@/lib/audit/events";
import { resolvePhase3ServerContext } from "@/lib/phase3/server-auth";

/**
 * POST /api/phase3/evidence/verify
 * Mark evidence as viewed/verified/rejected.
 */
export async function POST(request: NextRequest) {
  try {
    const { supabase, actorId } = await resolvePhase3ServerContext(request);

    const { evidenceId, action, verificationStatus, verificationNotes, rejectionReason } = await request.json();

    if (!evidenceId || !action) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const { data: evidenceRow, error: evidenceError } = await supabase
      .from("evidence_uploads")
      .select("organisation_id, home_id")
      .eq("id", evidenceId)
      .single();

    if (evidenceError || !evidenceRow?.organisation_id) {
      return NextResponse.json({ error: "Evidence not found" }, { status: 404 });
    }

    const { data: verificationRecord, error: dbError } = await supabase
      .from("evidence_verification_history")
      .insert({
        organisation_id: evidenceRow.organisation_id,
        home_id: evidenceRow.home_id,
        evidence_id: evidenceId,
        action,
        taken_by: actorId,
        verification_status: verificationStatus,
        verification_notes: verificationNotes,
        rejection_reason: rejectionReason,
      })
      .select("id")
      .single();

    if (dbError) {
      console.error("Database error:", dbError);
      return NextResponse.json({ error: "Failed to record verification" }, { status: 500 });
    }

    await writeAuditLog({
      event: AUDIT_EVENTS.FILE_VERIFY,
      actorId,
      organisationId: evidenceRow.organisation_id,
      homeId: evidenceRow.home_id,
      entityId: evidenceId,
      entityType: "evidence_verification",
      metadata: {
        action,
        verificationStatus,
      },
    });

    return NextResponse.json({
      success: true,
      recordId: verificationRecord?.id,
    });
  } catch (error) {
    console.error("Error verifying evidence:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
