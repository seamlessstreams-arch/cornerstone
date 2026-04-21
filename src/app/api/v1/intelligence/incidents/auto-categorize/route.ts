import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth-guard";
import { PERMISSIONS } from "@/lib/permissions";
import { INCIDENT_TYPES, INCIDENT_TYPE_LABELS } from "@/lib/constants";

// ── POST /api/v1/intelligence/incidents/auto-categorize ───────────────────────
// Suggests an incident type and severity based on description text.
// Uses keyword matching — no external AI dependency.

export interface CategorizationResult {
  suggestedType: string;
  suggestedTypeLabel: string;
  suggestedSeverity: "low" | "medium" | "high" | "critical";
  confidence: "low" | "medium" | "high";
  reasoning: string;
  alternativeTypes: Array<{ type: string; label: string; score: number }>;
}

type IncidentType = (typeof INCIDENT_TYPES)[number];

const TYPE_KEYWORDS: Record<IncidentType, string[]> = {
  safeguarding_concern:   ["safeguard", "abuse", "neglect", "harm", "protect", "concern", "disclosure"],
  exploitation_concern:   ["exploit", "cse", "county lines", "grooming", "sexual exploitation", "drug"],
  contextual_safeguarding:["gang", "knife", "weapon", "community", "peer group", "street"],
  self_harm:              ["self harm", "self-harm", "cut", "wound", "hurting", "hurt themselves", "suicid", "overdose"],
  missing_from_care:      ["missing", "absent", "whereabouts", "not returned", "left without", "mfc"],
  allegation:             ["allegation", "alleged", "accused", "staff misconduct", "complaint against staff", "physical abuse by"],
  physical_intervention:  ["physical", "restrained", "holding", "intervention", "de-escalat", "pmi", "team teach"],
  police_involvement:     ["police", "arrested", "custody", "officer", "999", "crime"],
  hospital_attendance:    ["hospital", "a&e", "ambulance", "paramedic", "emergency", "injured", "broken"],
  medication_error:       ["medication", "medicine", "dosage", "prescribed", "administered", "missed dose", "wrong medication"],
  behaviour_incident:     ["behaviour", "behavior", "aggression", "aggressive", "violent", "assault", "destroy"],
  damage_to_property:     ["damage", "broke", "smashed", "vandal", "property", "window", "furniture"],
  bullying:               ["bully", "bullying", "intimidat", "threaten", "taunting", "harass"],
  online_safety:          ["online", "internet", "social media", "snap", "tiktok", "instagram", "message", "contact online"],
  complaint:              ["complaint", "complain", "dissatisfied", "formal complaint", "unhappy with"],
  other:                  [],
};

const SEVERITY_KEYWORDS: Record<"critical" | "high" | "medium", string[]> = {
  critical: ["critical", "life-threaten", "emergency", "suicid", "serious assault", "weapon", "overdose", "hospital", "rape", "serious injury"],
  high:     ["allegation", "police", "self harm", "self-harm", "missing", "exploit", "gang", "aggression", "injury"],
  medium:   ["behaviour", "damage", "bullying", "physical", "intervention", "medication error"],
};

function scoredMatches(text: string, keywords: string[]): number {
  const lower = text.toLowerCase();
  return keywords.reduce((acc, kw) => acc + (lower.includes(kw) ? 1 : 0), 0);
}

export async function POST(request: NextRequest) {
  const auth = requirePermission(request, PERMISSIONS.VIEW_DASHBOARD);
  if (auth instanceof NextResponse) return auth;

  const body = await request.json() as { description?: string; immediate_action?: string };
  const text = `${body.description ?? ""} ${body.immediate_action ?? ""}`.trim();

  if (!text) {
    return NextResponse.json({ error: "description is required" }, { status: 400 });
  }

  // Score each incident type
  const typeScores = (Object.keys(TYPE_KEYWORDS) as IncidentType[])
    .map((t) => ({ type: t, score: scoredMatches(text, TYPE_KEYWORDS[t]) }))
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score);

  const top = typeScores[0] ?? { type: "other" as IncidentType, score: 0 };
  const suggestedType = top.type;
  const suggestedTypeLabel = INCIDENT_TYPE_LABELS[suggestedType] ?? suggestedType;

  // Confidence
  const confidence: CategorizationResult["confidence"] =
    top.score >= 3 ? "high" : top.score >= 2 ? "medium" : "low";

  // Severity
  let suggestedSeverity: CategorizationResult["suggestedSeverity"] = "low";
  for (const sev of ["critical", "high", "medium"] as const) {
    if (scoredMatches(text, SEVERITY_KEYWORDS[sev]) > 0) {
      suggestedSeverity = sev;
      break;
    }
  }

  // Reasoning
  const matchedWords = TYPE_KEYWORDS[suggestedType].filter((kw) => text.toLowerCase().includes(kw));
  const reasoning = top.score > 0
    ? `Matched keyword(s): "${matchedWords.slice(0, 3).join('", "')}". Consider reviewing the description to confirm categorisation.`
    : "No strong keyword matches found. Categorised as 'Other' — please select manually.";

  const alternativeTypes = typeScores.slice(1, 3).map((r) => ({
    type: r.type,
    label: INCIDENT_TYPE_LABELS[r.type] ?? r.type,
    score: r.score,
  }));

  return NextResponse.json({
    data: { suggestedType, suggestedTypeLabel, suggestedSeverity, confidence, reasoning, alternativeTypes },
  });
}
