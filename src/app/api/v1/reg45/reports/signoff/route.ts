import { NextRequest, NextResponse } from "next/server";
import { resolvePhase3ServerContext } from "@/lib/phase3/server-auth";
import { resolveReg45Context } from "@/lib/reg45/context";
import { getCycleCompleteness } from "@/lib/reg45/repository";
import { requirePermission } from "@/lib/auth-guard";
import { PERMISSIONS } from "@/lib/permissions";
import { AUDIT_EVENTS } from "@/lib/audit/events";
import { writeAuditLog } from "@/lib/audit/logger";

export async function POST(request: NextRequest) {
  try {
    const auth = requirePermission(request, PERMISSIONS.MANAGE_AUDITS);
    if (auth instanceof NextResponse) return auth;

    const { supabase, actorId } = await resolvePhase3ServerContext(request);
    const context = await resolveReg45Context(supabase, actorId);
    const body = await request.json();

    if (typeof body.cycleId !== "string") {
      return NextResponse.json({ error: "cycleId is required" }, { status: 400 });
    }

    const completeness = await getCycleCompleteness(supabase, body.cycleId);

    if (completeness.blockFinalSignOff) {
      return NextResponse.json(
        {
          error: "Cycle completeness checks failed",
          completeness,
        },
        { status: 409 }
      );
    }

    const { data: cycle, error } = await supabase
      .from("reg45_review_cycles")
      .update({
        status: "finalised",
        finalised_at: new Date().toISOString(),
        due_date: typeof body.submissionDueDate === "string" ? body.submissionDueDate : undefined,
        metadata: {
          signedOffBy: actorId,
          signedOffAt: new Date().toISOString(),
        },
        updated_at: new Date().toISOString(),
      })
      .eq("id", body.cycleId)
      .eq("organisation_id", context.organisationId)
      .select("*")
      .single();

    if (error || !cycle) {
      return NextResponse.json({ error: "Cycle not found" }, { status: 404 });
    }

    await writeAuditLog({
      event: AUDIT_EVENTS.RECORD_UPDATE,
      actorId,
      organisationId: context.organisationId,
      homeId: cycle.home_id,
      entityType: "reg45_review_cycle",
      entityId: cycle.id,
      metadata: {
        signOff: true,
        completenessScore: completeness.score,
      },
    });

    await supabase
      .from("reg45_report_versions")
      .update({
        status: "finalised",
        locked_at: new Date().toISOString(),
        locked_by: actorId,
        updated_at: new Date().toISOString(),
      })
      .eq("cycle_id", body.cycleId)
      .eq("organisation_id", context.organisationId)
      .eq("status", "draft");

    return NextResponse.json({ cycle, completeness });
  } catch (error) {
    console.error("Failed to sign off Regulation 45 cycle", error);
    return NextResponse.json({ error: "Failed to sign off Regulation 45 cycle" }, { status: 500 });
  }
}
