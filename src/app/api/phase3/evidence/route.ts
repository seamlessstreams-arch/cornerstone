import { NextRequest, NextResponse } from "next/server";
import { isMissingSupabaseTableError, resolvePhase3ServerContext } from "@/lib/phase3/server-auth";

interface EvidenceVerificationRow {
  id: string;
  action: "viewed" | "verified" | "rejected" | "superseded";
  verification_status: string | null;
  verification_notes: string | null;
  rejection_reason: string | null;
  taken_at: string;
  taken_by: string;
}

interface EvidenceUploadRow {
  id: string;
  form_record_id: string;
  evidence_type: string;
  file_name: string;
  file_path: string;
  file_size: number | null;
  mime_type: string | null;
  uploaded_at: string;
  linked_candidate_id: string | null;
  uploaded_by: string;
  evidence_verification_history: EvidenceVerificationRow[] | null;
}

/**
 * GET /api/phase3/evidence
 * List evidence uploads with optional filters.
 */
export async function GET(request: NextRequest) {
  try {
    const { supabase } = await resolvePhase3ServerContext(request);

    const { searchParams } = new URL(request.url);
    const formRecordId = searchParams.get("formRecordId");
    const candidateId = searchParams.get("candidateId");
    const status = searchParams.get("status");

    let query = supabase.from("evidence_uploads").select(`
      id,
      form_record_id,
      evidence_type,
      file_name,
      file_path,
      file_size,
      mime_type,
      uploaded_at,
      linked_candidate_id,
      uploaded_by,
      evidence_verification_history (
        id,
        action,
        verification_status,
        verification_notes,
        rejection_reason,
        taken_at,
        taken_by
      )
    `);

    if (formRecordId) {
      query = query.eq("form_record_id", formRecordId);
    }

    if (candidateId) {
      query = query.eq("linked_candidate_id", candidateId);
    }

    const { data, error } = await query.order("uploaded_at", { ascending: false }).limit(200);

    if (error) {
      if (isMissingSupabaseTableError(error)) {
        return NextResponse.json({ evidence: [], count: 0, schemaReady: false });
      }

      console.error("Error fetching evidence:", error);
      return NextResponse.json({ error: "Failed to fetch evidence" }, { status: 500 });
    }

    const mapped = ((data ?? []) as EvidenceUploadRow[]).map((row) => {
      const history = (row.evidence_verification_history ?? []).sort(
        (a, b) => new Date(a.taken_at).getTime() - new Date(b.taken_at).getTime()
      );
      const latest = history[history.length - 1];

      return {
        id: row.id,
        formRecordId: row.form_record_id,
        evidenceType: row.evidence_type,
        fileName: row.file_name,
        filePath: row.file_path,
        fileSize: row.file_size,
        mimeType: row.mime_type,
        uploadedAt: row.uploaded_at,
        uploadedBy: {
          id: row.uploaded_by,
          email: "",
          name: "",
        },
        linkedCandidateId: row.linked_candidate_id,
        currentStatus: latest?.verification_status ?? "pending",
        verificationHistory: history.map((h) => ({
          id: h.id,
          action: h.action,
          takenBy: {
            id: h.taken_by,
            email: "",
            name: "",
          },
          takenAt: h.taken_at,
          verificationStatus: h.verification_status,
          verificationNotes: h.verification_notes,
          rejectionReason: h.rejection_reason,
        })),
      };
    });

    const filtered = status ? mapped.filter((r) => r.currentStatus === status) : mapped;

    return NextResponse.json({ evidence: filtered, count: filtered.length });
  } catch (error) {
    console.error("Error in evidence GET:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
