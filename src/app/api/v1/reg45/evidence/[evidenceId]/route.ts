import { NextRequest, NextResponse } from "next/server";
import { resolvePhase3ServerContext } from "@/lib/phase3/server-auth";
import { resolveReg45Context } from "@/lib/reg45/context";
import { requirePermission } from "@/lib/auth-guard";
import { PERMISSIONS } from "@/lib/permissions";
import { AUDIT_EVENTS } from "@/lib/audit/events";
import { writeAuditLog } from "@/lib/audit/logger";

interface RouteParams {
  params: Promise<{ evidenceId: string }>;
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = requirePermission(request, PERMISSIONS.EDIT_FORMS);
    if (auth instanceof NextResponse) return auth;

    const { evidenceId } = await params;
    const { supabase, actorId } = await resolvePhase3ServerContext(request);
    const context = await resolveReg45Context(supabase, actorId);
    const body = await request.json();

    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (typeof body.verificationStatus === "string") {
      updates.verification_status = body.verificationStatus;
      if (body.verificationStatus === "viewed") {
        updates.viewed_by = actorId;
        updates.viewed_at = new Date().toISOString();
      }
      if (body.verificationStatus === "verified") {
        updates.verified_by = actorId;
        updates.verified_at = new Date().toISOString();
      }
      if (body.verificationStatus === "rejected") {
        updates.rejected_by = actorId;
        updates.rejected_at = new Date().toISOString();
      }
    }

    if (typeof body.verificationNotes === "string") updates.verification_notes = body.verificationNotes;
    if (typeof body.rejectionReason === "string") updates.rejection_reason = body.rejectionReason;
    if (Array.isArray(body.tags)) updates.tags = body.tags;
    if (typeof body.archivedFlag === "boolean") updates.archived_flag = body.archivedFlag;
    if (typeof body.isUsedInReport === "boolean") updates.is_used_in_report = body.isUsedInReport;

    const { data: evidence, error } = await supabase
      .from("reg45_evidence_items")
      .update(updates)
      .eq("id", evidenceId)
      .eq("organisation_id", context.organisationId)
      .select("*")
      .single();

    if (error || !evidence) {
      return NextResponse.json({ error: "Evidence item not found" }, { status: 404 });
    }

    await writeAuditLog({
      event: AUDIT_EVENTS.FILE_VERIFY,
      actorId,
      organisationId: context.organisationId,
      homeId: evidence.home_id,
      entityType: "reg45_evidence_item",
      entityId: evidence.id,
      metadata: {
        verificationStatus: evidence.verification_status,
      },
    });

    return NextResponse.json({ evidence });
  } catch (error) {
    console.error("Failed to update evidence item", error);
    return NextResponse.json({ error: "Failed to update evidence item" }, { status: 500 });
  }
}
