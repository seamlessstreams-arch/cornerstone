import { NextRequest, NextResponse } from "next/server";
import { resolvePhase3ServerContext, isMissingSupabaseTableError } from "@/lib/phase3/server-auth";
import { resolveReg45Context } from "@/lib/reg45/context";
import { getCycleCompleteness } from "@/lib/reg45/repository";
import { requirePermission } from "@/lib/auth-guard";
import { PERMISSIONS } from "@/lib/permissions";
import { AUDIT_EVENTS } from "@/lib/audit/events";
import { writeAuditLog } from "@/lib/audit/logger";

async function ensureReportVersion(
  supabase: Awaited<ReturnType<typeof resolvePhase3ServerContext>>["supabase"],
  organisationId: string,
  cycleId: string,
  actorId: string
) {
  const { data: existing, error: existingError } = await supabase
    .from("reg45_report_versions")
    .select("*")
    .eq("cycle_id", cycleId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  // If the Phase 5 tables don't exist yet, bail early — caller will handle empty.
  if (isMissingSupabaseTableError(existingError)) throw existingError;
  if (existing) return existing;

  const { data: cycle, error: cycleError } = await supabase
    .from("reg45_review_cycles")
    .select("home_id, cycle_title")
    .eq("id", cycleId)
    .eq("organisation_id", organisationId)
    .single();

  if (cycleError || !cycle) throw cycleError ?? new Error("Unable to resolve cycle");

  const { data: created, error } = await supabase
    .from("reg45_report_versions")
    .insert({
      organisation_id: organisationId,
      home_id: cycle.home_id,
      cycle_id: cycleId,
      version_number: 1,
      status: "draft",
      report_title: `${cycle.cycle_title} - Regulation 45 Report`,
      created_by: actorId,
    })
    .select("*")
    .single();

  if (error || !created) throw error ?? new Error("Unable to create report version");
  return created;
}

export async function GET(request: NextRequest) {
  try {
    const { supabase, actorId } = await resolvePhase3ServerContext(request);
    const context = await resolveReg45Context(supabase, actorId);
    const { searchParams } = new URL(request.url);
    const cycleId = searchParams.get("cycleId");

    if (!cycleId) {
      return NextResponse.json({ error: "cycleId is required" }, { status: 400 });
    }

    let version;
    try {
      version = await ensureReportVersion(supabase, context.organisationId, cycleId, actorId);
    } catch (e) {
      if (isMissingSupabaseTableError(e as { code?: string })) {
        return NextResponse.json({ reportVersion: null, sections: [], completeness: null });
      }
      throw e;
    }

    const { data: sections, error } = await supabase
      .from("reg45_report_sections")
      .select("*")
      .eq("report_version_id", version.id)
      .order("section_order", { ascending: true });

    if (error) {
      if (isMissingSupabaseTableError(error)) return NextResponse.json({ reportVersion: version, sections: [], completeness: null });
      throw error;
    }

    const completeness = await getCycleCompleteness(supabase, cycleId);

    const normalizedSections = (sections ?? []).map((section) => ({
      ...section,
      contentMarkdown: section.content ?? "",
    }));

    return NextResponse.json({ reportVersion: version, sections: normalizedSections, completeness });
  } catch (error) {
    console.error("Failed to fetch Regulation 45 report", error);
    return NextResponse.json({ error: "Failed to fetch Regulation 45 report" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = requirePermission(request, PERMISSIONS.MANAGE_AUDITS);
    if (auth instanceof NextResponse) return auth;

    const { supabase, actorId } = await resolvePhase3ServerContext(request);
    const context = await resolveReg45Context(supabase, actorId);
    const body = await request.json();

    if (typeof body.cycleId !== "string" || typeof body.sectionCode !== "string") {
      return NextResponse.json({ error: "cycleId and sectionCode are required" }, { status: 400 });
    }

    const version = await ensureReportVersion(supabase, context.organisationId, body.cycleId, actorId);

    const { data: existing } = await supabase
      .from("reg45_report_sections")
      .select("id")
      .eq("report_version_id", version.id)
      .eq("section_code", body.sectionCode)
      .maybeSingle();

    if (existing?.id) {
      const { data: section, error } = await supabase
        .from("reg45_report_sections")
        .update({
          content: typeof body.contentMarkdown === "string" ? body.contentMarkdown : "",
          aria_generated: body.ariaGenerated === true,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id)
        .select("*")
        .single();

      if (error) throw error;

      return NextResponse.json({
        reportVersion: version,
        section: {
          ...section,
          contentMarkdown: section.content ?? "",
        },
      });
    }

    const { data: section, error } = await supabase
      .from("reg45_report_sections")
      .insert({
        organisation_id: context.organisationId,
        home_id: version.home_id,
        report_version_id: version.id,
        section_code: body.sectionCode,
        section_title: typeof body.sectionTitle === "string" ? body.sectionTitle : body.sectionCode,
        section_order: typeof body.sectionOrder === "number" ? body.sectionOrder : 999,
        content: typeof body.contentMarkdown === "string" ? body.contentMarkdown : "",
        aria_generated: body.ariaGenerated === true,
      })
      .select("*")
      .single();

    if (error) throw error;

    await writeAuditLog({
      event: AUDIT_EVENTS.RECORD_UPDATE,
      actorId,
      organisationId: context.organisationId,
      homeId: version.home_id,
      entityType: "reg45_report_section",
      entityId: section.id,
      metadata: {
        cycleId: body.cycleId,
        sectionCode: body.sectionCode,
      },
    });

    return NextResponse.json(
      {
        reportVersion: version,
        section: {
          ...section,
          contentMarkdown: section.content ?? "",
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Failed to save Regulation 45 report section", error);
    return NextResponse.json({ error: "Failed to save Regulation 45 report section" }, { status: 500 });
  }
}
