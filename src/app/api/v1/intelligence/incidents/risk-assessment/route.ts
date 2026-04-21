import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth-guard";
import { PERMISSIONS } from "@/lib/permissions";
import { db } from "@/lib/db/store";

// ── POST /api/v1/intelligence/incidents/risk-assessment ───────────────────────
// Calculates a 0–100 risk score for an incident based on:
//  - Severity
//  - Incident type category
//  - Frequency for this child in the last 90 days
//  - Active pattern alerts for this child
//  - Whether child has active missing episodes
//  - Whether oversight has not yet been recorded

export interface RiskAssessmentResult {
  score: number;                  // 0-100
  level: "low" | "medium" | "high" | "critical";
  factors: Array<{ label: string; weight: number; description: string }>;
  protectiveFactors: string[];
  recommendedActions: string[];
}

const SEVERITY_BASE: Record<string, number> = {
  low: 5, medium: 15, high: 30, critical: 50,
};

const TYPE_WEIGHT: Record<string, number> = {
  safeguarding_concern: 20,
  exploitation_concern: 20,
  contextual_safeguarding: 18,
  self_harm: 18,
  allegation: 16,
  missing_from_care: 15,
  police_involvement: 12,
  physical_intervention: 10,
  hospital_attendance: 10,
  medication_error: 8,
  behaviour_incident: 6,
  damage_to_property: 5,
  bullying: 5,
  online_safety: 5,
  complaint: 3,
  other: 3,
};

function scoreToLevel(score: number): RiskAssessmentResult["level"] {
  if (score >= 75) return "critical";
  if (score >= 50) return "high";
  if (score >= 25) return "medium";
  return "low";
}

export async function POST(request: NextRequest) {
  const auth = requirePermission(request, PERMISSIONS.VIEW_DASHBOARD);
  if (auth instanceof NextResponse) return auth;

  const body = await request.json() as {
    incident_id?: string;
    child_id?: string;
    type?: string;
    severity?: string;
    requires_oversight?: boolean;
    oversight_by?: string | null;
  };

  // Resolve the incident from store if id provided
  const stored = body.incident_id ? db.incidents.findById(body.incident_id) : null;

  const childId      = body.child_id ?? stored?.child_id;
  const type         = body.type ?? stored?.type ?? "other";
  const severity     = body.severity ?? stored?.severity ?? "low";
  const hasOversight = body.oversight_by !== undefined ? !!body.oversight_by : !!stored?.oversight_by;

  const factors: RiskAssessmentResult["factors"] = [];
  let score = 0;

  // 1. Severity
  const sevWeight = SEVERITY_BASE[severity] ?? 5;
  score += sevWeight;
  factors.push({ label: "Incident Severity", weight: sevWeight, description: `${severity} severity` });

  // 2. Incident type
  const typeWeight = TYPE_WEIGHT[type] ?? 3;
  score += typeWeight;
  factors.push({ label: "Incident Type Risk", weight: typeWeight, description: `${type.replace(/_/g, " ")} category` });

  // 3. Frequency for this child (last 90 days)
  if (childId) {
    const cutoff = new Date(Date.now() - 90 * 86_400_000).toISOString().slice(0, 10);
    const childIncidents = db.incidents.findAll().filter(
      (i) => i.child_id === childId && i.date >= cutoff && i.id !== body.incident_id
    );
    const freqWeight = Math.min(childIncidents.length * 4, 20);
    if (freqWeight > 0) {
      score += freqWeight;
      factors.push({
        label: "Incident Frequency",
        weight: freqWeight,
        description: `${childIncidents.length} other incident(s) for this child in last 90 days`,
      });
    }

    // 4. Active pattern alerts for this child
    const activeAlerts = db.intelligence.patternAlerts.findActive().filter(
      (a) => a.childId === childId && a.confidence !== "low"
    );
    if (activeAlerts.length > 0) {
      const alertWeight = Math.min(activeAlerts.length * 5, 15);
      score += alertWeight;
      factors.push({
        label: "Active Pattern Alerts",
        weight: alertWeight,
        description: `${activeAlerts.length} active intelligence alert(s) for this child`,
      });
    }

    // 5. Active missing episodes
    const activeMissing = db.missingEpisodes.findActive().filter((m) => m.child_id === childId);
    if (activeMissing.length > 0) {
      score += 10;
      factors.push({
        label: "Active Missing Episode",
        weight: 10,
        description: `Child currently has an active missing episode`,
      });
    }
  }

  // 6. Missing oversight
  if (!hasOversight) {
    score += 5;
    factors.push({ label: "Oversight Outstanding", weight: 5, description: "Manager oversight not yet recorded" });
  }

  score = Math.min(Math.round(score), 100);
  const level = scoreToLevel(score);

  // Protective factors
  const protectiveFactors: string[] = [];
  if (hasOversight) protectiveFactors.push("Manager oversight completed");
  if (severity === "low" || severity === "medium") protectiveFactors.push("Lower severity incident");

  // Recommended actions
  const recommendedActions: string[] = [];
  if (score >= 50) recommendedActions.push("Escalate to registered manager for review today");
  if (score >= 40) recommendedActions.push("Consider pattern alert — check intelligence dashboard");
  if (!hasOversight) recommendedActions.push("Record manager oversight before incident is closed");
  if (type === "safeguarding_concern" || type === "exploitation_concern")
    recommendedActions.push("Notify designated safeguarding lead immediately");
  if (type === "missing_from_care") recommendedActions.push("Complete return-interview within 72 hours");
  if (type === "self_harm") recommendedActions.push("Update risk assessment and care plan");
  if (score >= 25 && recommendedActions.length === 0)
    recommendedActions.push("Log linked task for follow-up review");

  return NextResponse.json({ data: { score, level, factors, protectiveFactors, recommendedActions } });
}
