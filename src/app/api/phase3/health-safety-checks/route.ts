import { NextRequest, NextResponse } from "next/server";
import { isMissingSupabaseTableError, resolvePhase3ServerContext } from "@/lib/phase3/server-auth";

/**
 * GET /api/phase3/health-safety-checks
 * Returns the H&S check schedule with status for the current home.
 * Query params:
 *   - homeId (optional) — filter to a specific home
 *   - status  (optional) — pending | completed | overdue | all
 *   - from    (optional) — ISO date string for start of window
 *   - to      (optional) — ISO date string for end of window
 */
export async function GET(request: NextRequest) {
  try {
    const { supabase } = await resolvePhase3ServerContext(request);

    const { searchParams } = new URL(request.url);
    const homeId = searchParams.get("homeId");
    const status = searchParams.get("status");
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    let query = supabase
      .from("health_safety_checks")
      .select(
        `
        id,
        check_type,
        check_date,
        due_date,
        completed_at,
        status,
        defects_identified,
        defect_severity,
        maintenance_task_id,
        created_at,
        form_record_id
      `
      )
      .order("due_date", { ascending: true });

    if (homeId) query = query.eq("home_id", homeId);
    if (status && status !== "all") query = query.eq("status", status);
    if (from) query = query.gte("due_date", from);
    if (to) query = query.lte("due_date", to);

    const { data: checks, error } = await query;

    if (error) {
      if (isMissingSupabaseTableError(error)) {
        return NextResponse.json({
          checks: [],
          stats: {
            dueToday: 0,
            overdue: 0,
            completedThisWeek: 0,
            openDefects: 0,
          },
          schemaReady: false,
        });
      }

      console.error("Error fetching H&S checks:", error);
      return NextResponse.json({ error: "Failed to fetch checks" }, { status: 500 });
    }

    // Build summary stats
    const today = new Date().toISOString().split("T")[0];
    const stats = {
      dueToday: checks?.filter((c) => c.due_date === today && c.status === "pending").length ?? 0,
      overdue: checks?.filter((c) => c.status === "overdue").length ?? 0,
      completedThisWeek: (() => {
        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - weekStart.getDay());
        return (
          checks?.filter(
            (c) => c.status === "completed" && c.completed_at && new Date(c.completed_at) >= weekStart
          ).length ?? 0
        );
      })(),
      openDefects: checks?.filter((c) => c.defects_identified && !c.maintenance_task_id).length ?? 0,
    };

    return NextResponse.json({ checks: checks ?? [], stats });
  } catch (err) {
    console.error("Unexpected error in H&S checks GET:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * POST /api/phase3/health-safety-checks
 * Mark a scheduled check as completed or create a new ad-hoc check.
 */
export async function POST(request: NextRequest) {
  try {
    const { supabase, actorId } = await resolvePhase3ServerContext(request);

    const body = await request.json();
    const { checkId, formRecordId, checkType, checkDate, defectsIdentified, defectSeverity } = body;

    if (checkId) {
      // Mark existing check complete
      const { data, error } = await supabase
        .from("health_safety_checks")
        .update({
          status: "completed",
          completed_at: new Date().toISOString(),
          completed_by: actorId,
          defects_identified: defectsIdentified ?? false,
          defect_severity: defectSeverity ?? null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", checkId)
        .select()
        .single();

      if (error) {
        return NextResponse.json({ error: "Failed to update check" }, { status: 500 });
      }

      return NextResponse.json({ check: data });
    }

    // Lookup org/home from form_record
    const { data: record, error: recordError } = await supabase
      .from("form_records")
      .select("organisation_id, home_id")
      .eq("id", formRecordId)
      .single();

    if (recordError || !record) {
      return NextResponse.json({ error: "Form record not found" }, { status: 400 });
    }

    const { data: newCheck, error: insertError } = await supabase
      .from("health_safety_checks")
      .insert({
        organisation_id: record.organisation_id,
        home_id: record.home_id,
        form_record_id: formRecordId,
        check_type: checkType,
        check_date: checkDate ?? new Date().toISOString().split("T")[0],
        due_date: checkDate ?? new Date().toISOString().split("T")[0],
        status: "completed",
        completed_at: new Date().toISOString(),
        completed_by: actorId,
        defects_identified: defectsIdentified ?? false,
        defect_severity: defectSeverity ?? null,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Error inserting H&S check:", insertError);
      return NextResponse.json({ error: "Failed to create check" }, { status: 500 });
    }

    return NextResponse.json({ check: newCheck }, { status: 201 });
  } catch (err) {
    console.error("Unexpected error in H&S checks POST:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
