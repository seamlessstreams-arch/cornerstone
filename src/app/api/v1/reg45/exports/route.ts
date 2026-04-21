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
      .from("reg45_export_logs")
      .select("*")
      .eq("organisation_id", context.organisationId)
      .order("created_at", { ascending: false })
      .limit(100);

    if (cycleId) query = query.eq("cycle_id", cycleId);

    const { data, error } = await query;
    if (error) {
      if (isMissingSupabaseTableError(error)) return NextResponse.json({ exports: [] });
      throw error;
    }

    return NextResponse.json({ exports: data ?? [] });
  } catch (error) {
    console.error("Failed to fetch Regulation 45 exports", error);
    return NextResponse.json({ error: "Failed to fetch Regulation 45 exports" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = requirePermission(request, PERMISSIONS.EXPORT_REPORTS);
    if (auth instanceof NextResponse) return auth;

    const { supabase, actorId } = await resolvePhase3ServerContext(request);
    const context = await resolveReg45Context(supabase, actorId);
    const body = await request.json();

    if (typeof body.cycleId !== "string" || typeof body.exportType !== "string") {
      return NextResponse.json({ error: "cycleId and exportType are required" }, { status: 400 });
    }

    const exportName = `reg45-${body.cycleId}-${body.exportType}-${Date.now()}.json`;

    const payload = {
      cycleId: body.cycleId,
      exportType: body.exportType,
      generatedAt: new Date().toISOString(),
      notes: typeof body.notes === "string" ? body.notes : null,
      includeSections: Array.isArray(body.includeSections) ? body.includeSections : [],
    };

    const { data: cycle, error: cycleError } = await supabase
      .from("reg45_review_cycles")
      .select("home_id")
      .eq("id", body.cycleId)
      .eq("organisation_id", context.organisationId)
      .single();

    if (cycleError || !cycle) {
      return NextResponse.json({ error: "Cycle not found" }, { status: 404 });
    }

    const { data: uploadResult, error: uploadError } = await supabase.storage
      .from("reg45-evidence")
      .upload(`exports/${exportName}`, new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" }), {
        upsert: false,
        contentType: "application/json",
      });

    if (uploadError) throw uploadError;

    const { data: exportRow, error } = await supabase
      .from("reg45_export_logs")
      .insert({
        organisation_id: context.organisationId,
        home_id: cycle.home_id,
        cycle_id: body.cycleId,
        report_version_id: typeof body.reportVersionId === "string" ? body.reportVersionId : null,
        export_type: body.exportType,
        included_items: {
          includeSections: Array.isArray(body.includeSections) ? body.includeSections : [],
          notes: typeof body.notes === "string" ? body.notes : null,
        },
        generated_by: actorId,
        generated_at: new Date().toISOString(),
        attachment_id: null,
        metadata: {
          fileName: exportName,
          filePath: uploadResult.path,
          notes: typeof body.notes === "string" ? body.notes : null,
          includeSections: Array.isArray(body.includeSections) ? body.includeSections : [],
        },
      })
      .select("*")
      .single();

    if (error) throw error;

    await writeAuditLog({
      event: AUDIT_EVENTS.REPORT_GENERATE,
      actorId,
      organisationId: context.organisationId,
      homeId: cycle.home_id,
      entityType: "reg45_export_log",
      entityId: exportRow.id,
      metadata: {
        exportType: body.exportType,
        cycleId: body.cycleId,
      },
    });

    return NextResponse.json({ export: exportRow, filePath: uploadResult.path }, { status: 201 });
  } catch (error) {
    console.error("Failed to create Regulation 45 export", error);
    return NextResponse.json({ error: "Failed to create Regulation 45 export" }, { status: 500 });
  }
}
