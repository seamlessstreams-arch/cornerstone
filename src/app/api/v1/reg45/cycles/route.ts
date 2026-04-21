import { NextRequest, NextResponse } from "next/server";
import { resolvePhase3ServerContext, isMissingSupabaseTableError } from "@/lib/phase3/server-auth";
import { resolveReg45Context } from "@/lib/reg45/context";
import { getCycleCompleteness } from "@/lib/reg45/repository";
import { requirePermission } from "@/lib/auth-guard";
import { PERMISSIONS } from "@/lib/permissions";
import { AUDIT_EVENTS } from "@/lib/audit/events";
import { writeAuditLog } from "@/lib/audit/logger";
import { createServiceRoleClient } from "@/lib/supabase/server";
import {
  createFallbackCycle,
  isReg45FallbackEnabled,
  listFallbackCycles,
  reg45FallbackCompleteness,
} from "@/lib/reg45/dev-fallback";

export async function GET(request: NextRequest) {
  try {
    const { supabase, actorId } = await resolvePhase3ServerContext(request);
    const context = await resolveReg45Context(supabase, actorId);

    const { data: cycles, error } = await supabase
      .from("reg45_review_cycles")
      .select("id, cycle_title, status, review_start_date, review_end_date, due_date, created_at")
      .eq("organisation_id", context.organisationId)
      .order("review_start_date", { ascending: false })
      .limit(30);

    if (error) {
      if (isMissingSupabaseTableError(error)) {
        if (!isReg45FallbackEnabled()) {
          return NextResponse.json({ cycles: [] });
        }

        const fallbackCycles = listFallbackCycles(context.organisationId).map((cycle) => ({
          ...cycle,
          evidence_count: 0,
          verified_evidence_count: 0,
          findings_count: 0,
          open_actions_count: 0,
          overdue_actions_count: 0,
          completeness: reg45FallbackCompleteness(),
        }));
        return NextResponse.json({ cycles: fallbackCycles });
      }
      throw error;
    }

    const enriched = await Promise.all(
      (cycles ?? []).map(async (cycle) => {
        const { count: evidenceCount } = await supabase
          .from("reg45_evidence_items")
          .select("id", { count: "exact", head: true })
          .eq("cycle_id", cycle.id);

        const { count: verifiedEvidenceCount } = await supabase
          .from("reg45_evidence_items")
          .select("id", { count: "exact", head: true })
          .eq("cycle_id", cycle.id)
          .eq("verification_status", "verified");

        const { count: findingsCount } = await supabase
          .from("reg45_findings")
          .select("id", { count: "exact", head: true })
          .eq("cycle_id", cycle.id);

        const { count: openActionsCount } = await supabase
          .from("reg45_actions")
          .select("id", { count: "exact", head: true })
          .eq("cycle_id", cycle.id)
          .neq("status", "completed");

        const { count: overdueActionsCount } = await supabase
          .from("reg45_actions")
          .select("id", { count: "exact", head: true })
          .eq("cycle_id", cycle.id)
          .neq("status", "completed")
          .lt("deadline", new Date().toISOString().slice(0, 10));

        const completeness = await getCycleCompleteness(supabase, cycle.id);

        return {
          ...cycle,
          evidence_count: evidenceCount ?? 0,
          verified_evidence_count: verifiedEvidenceCount ?? 0,
          findings_count: findingsCount ?? 0,
          open_actions_count: openActionsCount ?? 0,
          overdue_actions_count: overdueActionsCount ?? 0,
          completeness,
        };
      })
    );

    return NextResponse.json({ cycles: enriched });
  } catch (error) {
    console.error("Failed to fetch Regulation 45 cycles", error);
    return NextResponse.json({ error: "Failed to fetch Regulation 45 cycles" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = requirePermission(request, PERMISSIONS.MANAGE_AUDITS);
    if (auth instanceof NextResponse) return auth;

    const { supabase, actorId } = await resolvePhase3ServerContext(request);
    const context = await resolveReg45Context(supabase, actorId);
    const body = await request.json();

    const reviewStartDate = typeof body.reviewStartDate === "string" ? body.reviewStartDate : null;
    const reviewEndDate = typeof body.reviewEndDate === "string" ? body.reviewEndDate : null;

    if (!reviewStartDate || !reviewEndDate) {
      return NextResponse.json({ error: "reviewStartDate and reviewEndDate are required" }, { status: 400 });
    }

    const adminSupabase = createServiceRoleClient();

    const { data: cycle, error } = await adminSupabase
      .from("reg45_review_cycles")
      .insert({
        organisation_id: context.organisationId,
        home_id: typeof body.homeId === "string" ? body.homeId : context.homeId,
        cycle_title: typeof body.cycleTitle === "string" ? body.cycleTitle : "Regulation 45 Review Cycle",
        status: "planned",
        review_start_date: reviewStartDate,
        review_end_date: reviewEndDate,
        due_date: typeof body.dueDate === "string" ? body.dueDate : null,
        created_by: actorId,
        metadata: {
          requiredConsultationGroups: Array.isArray(body.requiredConsultationGroups)
            ? body.requiredConsultationGroups
            : ["children", "parents", "placing_authorities", "staff"],
        },
      })
      .select("*")
      .single();

    if (error) {
      if (isMissingSupabaseTableError(error)) {
        if (isReg45FallbackEnabled()) {
          const cycle = createFallbackCycle({
            organisationId: context.organisationId,
            homeId: typeof body.homeId === "string" ? body.homeId : context.homeId,
            cycleTitle: typeof body.cycleTitle === "string" ? body.cycleTitle : "Regulation 45 Review Cycle",
            reviewStartDate,
            reviewEndDate,
            dueDate: typeof body.dueDate === "string" ? body.dueDate : null,
            metadata: {
              requiredConsultationGroups: Array.isArray(body.requiredConsultationGroups)
                ? body.requiredConsultationGroups
                : ["children", "parents", "placing_authorities", "staff"],
            },
          });

          return NextResponse.json({ cycle }, { status: 201 });
        }

        return NextResponse.json(
          { error: "Reg45 tables are not installed. Run the Phase 5 migration." },
          { status: 503 }
        );
      }
      throw error;
    }

    await writeAuditLog({
      event: AUDIT_EVENTS.RECORD_CREATE,
      actorId,
      organisationId: context.organisationId,
      homeId: cycle.home_id,
      entityType: "reg45_review_cycle",
      entityId: cycle.id,
      metadata: { reviewStartDate, reviewEndDate },
    });

    return NextResponse.json({ cycle }, { status: 201 });
  } catch (error) {
    console.error("Failed to create Regulation 45 cycle", error);
    if (isMissingSupabaseTableError(error as any)) {
      return NextResponse.json(
        { error: "Reg45 tables are not installed. Run the Phase 5 migration." },
        { status: 503 }
      );
    }
    return NextResponse.json({ error: "Failed to create Regulation 45 cycle" }, { status: 500 });
  }
}
