import { NextRequest, NextResponse } from "next/server";
import { resolvePhase3ServerContext } from "@/lib/phase3/server-auth";
import { resolveReg45Context } from "@/lib/reg45/context";
import { requirePermission } from "@/lib/auth-guard";
import { PERMISSIONS } from "@/lib/permissions";
import { AUDIT_EVENTS } from "@/lib/audit/events";
import { writeAuditLog } from "@/lib/audit/logger";

interface RouteParams {
  params: Promise<{ findingId: string }>;
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = requirePermission(request, PERMISSIONS.MANAGE_AUDITS);
    if (auth instanceof NextResponse) return auth;

    const { findingId } = await params;
    const { supabase, actorId } = await resolvePhase3ServerContext(request);
    const context = await resolveReg45Context(supabase, actorId);
    const body = await request.json();

    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (typeof body.title === "string") updates.finding_title = body.title;
    if (typeof body.summary === "string") updates.finding_narrative = body.summary;
    if (typeof body.sectionCode === "string") updates.section_code = body.sectionCode;
    if (typeof body.theme === "string") updates.theme = body.theme;
    if (typeof body.severity === "string") updates.risk_level = body.severity;
    if (typeof body.impactOnChildren === "string") updates.impact_on_children = body.impactOnChildren;
    if (typeof body.strengthOrWeakness === "string") updates.strength_or_weakness = body.strengthOrWeakness;
    if (typeof body.evidenceStrength === "string") updates.evidence_strength = body.evidenceStrength;
    if (Array.isArray(body.qualityStandardTags)) updates.quality_standard_tags = body.qualityStandardTags;

    const { data: finding, error } = await supabase
      .from("reg45_findings")
      .update(updates)
      .eq("id", findingId)
      .eq("organisation_id", context.organisationId)
      .select("*")
      .single();

    if (error || !finding) return NextResponse.json({ error: "Finding not found" }, { status: 404 });

    if (Array.isArray(body.evidenceIds)) {
      await supabase.from("reg45_evidence_links").delete().eq("finding_id", findingId);
      const evidenceIds = body.evidenceIds.filter((id: unknown) => typeof id === "string");
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
    }

    await writeAuditLog({
      event: AUDIT_EVENTS.RECORD_UPDATE,
      actorId,
      organisationId: context.organisationId,
      homeId: finding.home_id,
      entityType: "reg45_finding",
      entityId: finding.id,
      metadata: { riskLevel: finding.risk_level },
    });

    const normalizedFinding = {
      ...finding,
      title: finding.finding_title,
      summary: finding.finding_narrative,
      severity: finding.risk_level,
    };

    return NextResponse.json({ finding: normalizedFinding });
  } catch (error) {
    console.error("Failed to update Regulation 45 finding", error);
    return NextResponse.json({ error: "Failed to update Regulation 45 finding" }, { status: 500 });
  }
}
