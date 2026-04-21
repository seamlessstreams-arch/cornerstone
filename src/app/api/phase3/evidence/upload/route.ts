import { NextRequest, NextResponse } from "next/server";
import { writeAuditLog } from "@/lib/audit/logger";
import { AUDIT_EVENTS } from "@/lib/audit/events";
import { automateEvidenceVerificationTask } from "@/lib/phase3/automations";
import { resolvePhase3ServerContext } from "@/lib/phase3/server-auth";

/**
 * POST /api/phase3/evidence/upload
 * Upload evidence file and track it
 */
export async function POST(request: NextRequest) {
  try {
    const { supabase, actorId } = await resolvePhase3ServerContext(request);

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const evidenceType = formData.get("evidenceType") as string;
    const formRecordId = formData.get("formRecordId") as string;
    const linkedCandidateId = formData.get("linkedCandidateId") as string | undefined;

    if (!file || !evidenceType || !formRecordId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const { data: formRecord, error: formRecordError } = await supabase
      .from("form_records")
      .select("organisation_id, home_id")
      .eq("id", formRecordId)
      .single();

    if (formRecordError || !formRecord?.organisation_id) {
      return NextResponse.json({ error: "Form record not found" }, { status: 404 });
    }

    // Upload file to storage
    const fileName = `${Date.now()}-${file.name}`;
    const filePath = `evidence/${formRecordId}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("uploads")
      .upload(filePath, file, { contentType: file.type });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return NextResponse.json({ error: "Failed to upload file" }, { status: 500 });
    }

    // Record in database
    const { data: evidence, error: dbError } = await supabase
      .from("evidence_uploads")
      .insert({
        organisation_id: formRecord.organisation_id,
        home_id: formRecord.home_id,
        form_record_id: formRecordId,
        evidence_type: evidenceType,
        file_name: file.name,
        file_path: filePath,
        file_size: file.size,
        mime_type: file.type,
        uploaded_by: actorId,
        linked_candidate_id: linkedCandidateId,
      })
      .select("id")
      .single();

    if (dbError) {
      console.error("Database error:", dbError);
      return NextResponse.json({ error: "Failed to save evidence record" }, { status: 500 });
    }

    // Audit log
    await writeAuditLog({
      event: AUDIT_EVENTS.FILE_UPLOAD,
      actorId,
      organisationId: formRecord.organisation_id,
      homeId: formRecord.home_id,
      entityId: formRecordId,
      entityType: "evidence",
      metadata: {
        evidenceType,
        fileName: file.name,
        fileSize: file.size,
      },
    });

    if (formRecord.home_id && evidence?.id) {
      await automateEvidenceVerificationTask(supabase, {
        organisationId: formRecord.organisation_id,
        homeId: formRecord.home_id,
        createdBy: actorId,
        evidenceId: evidence.id,
        evidenceType,
        candidateId: linkedCandidateId,
      });
    }

    return NextResponse.json({
      success: true,
      evidenceId: evidence?.id,
      filePath,
    });
  } catch (error) {
    console.error("Error uploading evidence:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
