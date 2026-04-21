import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth-guard";
import { PERMISSIONS } from "@/lib/permissions";
import { db } from "@/lib/db/store";
import type { Incident } from "@/types";

// ── GET /api/v1/intelligence/incidents/similar ────────────────────────────────
// Finds incidents similar to the given one — same type, same child, or
// same severity — within the last 90 days.
// Query params: incident_id (required) | child_id | type | severity | days (default 90)

export interface SimilarIncidentResult {
  incident: Incident;
  matchReasons: string[];
  daysSince: number;
  patternNote: string;
}

const SEVERITY_ORDER: Record<string, number> = { low: 0, medium: 1, high: 2, critical: 3 };

function daysBetween(a: string, b: string) {
  return Math.abs(Math.round((new Date(a).getTime() - new Date(b).getTime()) / 86_400_000));
}

export async function GET(request: NextRequest) {
  const auth = requirePermission(request, PERMISSIONS.VIEW_DASHBOARD);
  if (auth instanceof NextResponse) return auth;

  const { searchParams } = new URL(request.url);
  const incidentId = searchParams.get("incident_id");
  const childIdParam = searchParams.get("child_id");
  const typeParam = searchParams.get("type");
  const severityParam = searchParams.get("severity");
  const days = parseInt(searchParams.get("days") ?? "90", 10);

  const cutoff = new Date(Date.now() - days * 86_400_000).toISOString().slice(0, 10);

  const all = db.incidents.findAll();

  // Find the reference incident if an id was provided
  const ref = incidentId ? all.find((i) => i.id === incidentId) : null;

  // Effective filter criteria
  const childId = childIdParam ?? ref?.child_id;
  const type = typeParam ?? ref?.type;
  const severity = severityParam ?? ref?.severity;

  const results: SimilarIncidentResult[] = [];

  for (const inc of all) {
    if (inc.id === incidentId) continue; // exclude self
    if (inc.date < cutoff) continue;

    const reasons: string[] = [];

    if (childId && inc.child_id === childId) reasons.push("Same young person");
    if (type && inc.type === type) reasons.push("Same incident type");
    if (severity && inc.severity === severity) reasons.push("Same severity");

    // High-risk combo: same child + same type within 30 days
    const highRisk = childId && inc.child_id === childId &&
      type && inc.type === type &&
      daysBetween(ref?.date ?? inc.date, inc.date) <= 30;

    if (reasons.length === 0) continue;

    const daysSince = daysBetween(new Date().toISOString().slice(0, 10), inc.date);

    let patternNote = "";
    if (highRisk) {
      patternNote = "⚠ Repeated incident — same type and child within 30 days. Pattern review recommended.";
    } else if (reasons.includes("Same young person") && reasons.includes("Same incident type")) {
      patternNote = "Recurring pattern for this young person. Consider whether current interventions are sufficient.";
    } else if (SEVERITY_ORDER[inc.severity] >= SEVERITY_ORDER.high) {
      patternNote = "High or critical severity — review whether oversight actions have been fully implemented.";
    }

    results.push({
      incident: inc,
      matchReasons: reasons,
      daysSince,
      patternNote,
    });
  }

  // Sort: most recent first, then by number of match reasons
  results.sort((a, b) => {
    const dateDiff = b.incident.date.localeCompare(a.incident.date);
    if (dateDiff !== 0) return dateDiff;
    return b.matchReasons.length - a.matchReasons.length;
  });

  return NextResponse.json({
    data: results.slice(0, 10),
    total: results.length,
    meta: {
      incidentId,
      childId: childId ?? null,
      type: type ?? null,
      severity: severity ?? null,
      periodDays: days,
    },
  });
}
