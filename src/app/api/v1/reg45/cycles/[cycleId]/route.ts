import { NextRequest, NextResponse } from "next/server";
import { resolvePhase3ServerContext, isMissingSupabaseTableError } from "@/lib/phase3/server-auth";
import { resolveReg45Context } from "@/lib/reg45/context";
import { getCycleCompleteness } from "@/lib/reg45/repository";
import { requirePermission } from "@/lib/auth-guard";
import { PERMISSIONS } from "@/lib/permissions";
import { AUDIT_EVENTS } from "@/lib/audit/events";
import { writeAuditLog } from "@/lib/audit/logger";
import {
  getFallbackCycle,
  isReg45FallbackEnabled,
  reg45FallbackCompleteness,
  updateFallbackCycle,
} from "@/lib/reg45/dev-fallback";

interface RouteParams {
  params: Promise<{ cycleId: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { cycleId } = await params;
    const { supabase, actorId } = await resolvePhase3ServerContext(request);
    const context = await resolveReg45Context(supabase, actorId);

    const { data: cycle, error } = await supabase
      .from("reg45_review_cycles")
      .select("*")
      .eq("id", cycleId)
      .eq("organisation_id", context.organisationId)
      .single();

    if (isMissingSupabaseTableError(error)) {
      if (isReg45FallbackEnabled()) {
        const fallback = getFallbackCycle(context.organisationId, cycleId);
        if (!fallback) return NextResponse.json({ error: "Cycle not found" }, { status: 404 });
        return NextResponse.json({ cycle: fallback, completeness: reg45FallbackCompleteness() });
      }
      return NextResponse.json({ error: "Cycle not found" }, { status: 404 });
    }

    if (error || !cycle) {
      return NextResponse.json({ error: "Cycle not found" }, { status: 404 });
    }

    const completeness = await getCycleCompleteness(supabase, cycle.id);
    return NextResponse.json({ cycle, completeness });
  } catch (error) {
    console.error("Failed to fetch cycle detail", error);
    return NextResponse.json({ error: "Failed to fetch cycle detail" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = requirePermission(request, PERMISSIONS.MANAGE_AUDITS);
    if (auth instanceof NextResponse) return auth;

    const { cycleId } = await params;
    const { supabase, actorId } = await resolvePhase3ServerContext(request);
    const context = await resolveReg45Context(supabase, actorId);
    const body = await request.json();

    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (typeof body.status === "string") updates.status = body.status;
    if (typeof body.cycleTitle === "string") updates.cycle_title = body.cycleTitle;
    if (typeof body.dueDate === "string" || body.dueDate === null) updates.due_date = body.dueDate;

    const { data: cycle, error } = await supabase
      .from("reg45_review_cycles")
      .update(updates)
      .eq("id", cycleId)
      .eq("organisation_id", context.organisationId)
      .select("*")
      .single();

    if (isMissingSupabaseTableError(error)) {
      if (isReg45FallbackEnabled()) {
        const fallback = updateFallbackCycle(context.organisationId, cycleId, updates);
        if (!fallback) return NextResponse.json({ error: "Cycle not found" }, { status: 404 });
        return NextResponse.json({ cycle: fallback, completeness: reg45FallbackCompleteness() });
      }
      return NextResponse.json({ error: "Cycle not found" }, { status: 404 });
    }

    if (error || !cycle) {
      return NextResponse.json({ error: "Cycle not found" }, { status: 404 });
    }

    if (body.autoScheduleNextCycle === true && cycle.status === "finalised") {
      const { data: nextCycleResult, error: scheduleError } = await supabase.rpc("reg45_schedule_next_cycle", {
        p_cycle_id: cycleId,
        p_actor_id: actorId,
      });

      if (scheduleError) {
        console.warn("Unable to auto-schedule next Regulation 45 cycle", scheduleError.message);
      }

      await writeAuditLog({
        event: AUDIT_EVENTS.RECORD_UPDATE,
        actorId,
        organisationId: context.organisationId,
        homeId: cycle.home_id,
        entityType: "reg45_review_cycle",
        entityId: cycle.id,
        metadata: {
          autoScheduleNextCycle: true,
          nextCycleId: nextCycleResult ?? null,
        },
      });
    }

    const completeness = await getCycleCompleteness(supabase, cycle.id);

    return NextResponse.json({ cycle, completeness });
  } catch (error) {
    console.error("Failed to update cycle", error);
    return NextResponse.json({ error: "Failed to update cycle" }, { status: 500 });
  }
}
