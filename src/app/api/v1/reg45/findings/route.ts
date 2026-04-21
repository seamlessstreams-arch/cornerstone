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
      .from("reg45_findings")
      .select("*")
      .eq("organisation_id", context.organisationId)
      .order("risk_level", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(300);

    if (cycleId) query = query.eq("cycle_id", cycleId);

    const { data, error } = await query;
    if (error) {
      if (isMissingSupabaseTableError(error)) return NextResponse.json({ findings: [] });
      throw error;
    }

    const findings = (data ?? []).map((row) => ({
      ...row,
      title: row.finding_title,
      summary: row.finding_narrative,
      severity: row.risk_level,
    }));

    return NextResponse.json({ findings });
  } catch (error) {
    console.error("Failed to fetch Regulation 45 findings", error);
    return NextResponse.json({ error: "Failed to fetch Regulation 45 findings" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = requirePermission(request, PERMISSIONS.MANAGE_AUDITS);
    if (auth instanceof NextResponse) return auth;

    const { supabase, actorId } = await resolvePhase3ServerContext(request);
    const context = await resolveReg45Context(supabase, actorId);
    const body = await request.json();

    if (typeof body.cycleId !== "string" || typeof body.title !== "string") {
      return NextResponse.json({ error: "cycleId and title are required" }, { status: 400 });
    }

    const { data: finding, error } = await supabase
      .from("reg45_findings")
      .insert({
        organisation_id: context.organisationId,
        home_id: typeof body.homeId === "string" ? body.homeId : context.homeId,
        cycle_id: body.cycleId,
        section_code: typeof body.sectionCode === "string" ? body.sectionCode : "general",
        finding_title: body.title,
        theme: typeof body.theme === "string" ? body.theme : "general",
        finding_narrative: typeof body.summary === "string" ? body.summary : "",
        impact_on_children: typeof body.impactOnChildren === "string" ? body.impactOnChildren : null,
        strength_or_weakness: body.strengthOrWeakness === "strength" ? "strength" : "area_for_improvement",
        risk_level: typeof body.severity === "string" ? body.severity : "medium",
        evidence_strength: typeof body.evidenceStrength === "string" ? body.evidenceStrength : "moderate",
        quality_standard_tags: Array.isArray(body.qualityStandardTags) ? body.qualityStandardTags : [],
        created_by: actorId,
      })
      .select("*")
      .single();

    if (error) throw error;

    const evidenceIds = Array.isArray(body.evidenceIds) ? body.evidenceIds.filter((id: unknown) => typeof id === "string") : [];
    if (evidenceIds.length > 0) {
      await supabase.from("reg45_evidence_links").insert(
        evidenceIds.map((evidenceId: string) => ({
          organisation_id: context.organisationId,
          cycle_id: finding.cycle_id,
          evidence_item_id: evidenceId,
          finding_id: finding.id,
          relation_type: "supports",
        }))
      );
    }

    await writeAuditLog({
      event: AUDIT_EVENTS.RECORD_CREATE,
      actorId,
      organisationId: context.organisationId,
      homeId: finding.home_id,
      entityType: "reg45_finding",
      entityId: finding.id,
      metadata: { cycleId: finding.cycle_id },
    });

    const normalizedFinding = {
      ...finding,
      title: finding.finding_title,
      summary: finding.finding_narrative,
      severity: finding.risk_level,
    };

    return NextResponse.json({ finding: normalizedFinding }, { status: 201 });
  } catch (error) {
    console.error("Failed to create Regulation 45 finding", error);
    return NextResponse.json({ error: "Failed to create Regulation 45 finding" }, { status: 500 });
  }
}
