import { db } from "@/lib/db/store";
import { getStaffName } from "@/lib/seed-data";
import type {
  ActionEffectivenessReview,
  ChildExperienceIndicator,
  ChildExperienceSnapshot,
  ChildVoiceEntry,
  HomeClimateSnapshot,
  InsightDirection,
  PatternSignal,
  QualityOfCareSnapshot,
} from "@/types/intelligence";

function nowIso() {
  return new Date().toISOString();
}

function asDirection(delta: number): InsightDirection {
  if (delta > 0.5) return "improving";
  if (delta < -0.5) return "worsening";
  return "stable";
}

function daysBetween(date: string, base = new Date()): number {
  const d = new Date(date);
  return Math.floor((base.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
}

function extractThemes(text: string): string[] {
  const t = text.toLowerCase();
  const map: Array<[string, string]> = [
    ["missing", "missing episodes"],
    ["contact", "family/contact"],
    ["sleep", "sleep disruption"],
    ["education", "education engagement"],
    ["medication", "medication"],
    ["dysreg", "emotional regulation"],
    ["safeguard", "safeguarding"],
    ["complaint", "complaints"],
    ["peer", "peer relationships"],
    ["trust", "relational trust"],
  ];
  return map.filter(([k]) => t.includes(k)).map(([, label]) => label);
}

function makeSignal(childId: string, title: string, prompt: string, evidenceRefs: string[], confidence: PatternSignal["confidence"]): PatternSignal {
  return {
    id: `sig_${Math.random().toString(36).slice(2, 9)}`,
    childId,
    title,
    prompt,
    evidenceRefs,
    confidence,
    periodDays: 56,
    createdAt: nowIso(),
  };
}

function buildIndicators(childId: string): ChildExperienceIndicator[] {
  const logs = db.dailyLog.findByChild(childId);
  const incidents = db.incidents.findAll().filter((i) => i.child_id === childId);
  const missing = db.missingEpisodes.findByChild(childId);
  const tasks = db.tasks.findAll().filter((t) => t.linked_child_id === childId);
  const meds = db.medicationAdministrations.findByChild(childId);

  const recentLogs = logs.filter((l) => daysBetween(l.date) <= 28);
  const olderLogs = logs.filter((l) => daysBetween(l.date) > 28 && daysBetween(l.date) <= 56);

  const recentMood = recentLogs.reduce((acc, l) => acc + (l.mood_score ?? 0), 0) / Math.max(1, recentLogs.filter((l) => l.mood_score !== null).length);
  const olderMood = olderLogs.reduce((acc, l) => acc + (l.mood_score ?? 0), 0) / Math.max(1, olderLogs.filter((l) => l.mood_score !== null).length);

  const recentIncidents = incidents.filter((i) => daysBetween(i.date) <= 28).length;
  const olderIncidents = incidents.filter((i) => daysBetween(i.date) > 28 && daysBetween(i.date) <= 56).length;

  const indicators: ChildExperienceIndicator[] = [
    {
      key: "safety",
      label: "Safety",
      value: Math.max(0, 100 - recentIncidents * 12 - missing.filter((m) => daysBetween(m.date_missing) <= 56).length * 10),
      direction: asDirection(olderIncidents - recentIncidents),
      evidenceCount: incidents.length + missing.length,
      narrative: recentIncidents > olderIncidents
        ? "Recent risk events are rising. Explore trigger windows and prevention planning."
        : "Risk events are stable or improving relative to the prior period.",
    },
    {
      key: "regulation",
      label: "Emotional Regulation",
      value: Math.round((recentMood || 0) * 12),
      direction: asDirection((recentMood || 0) - (olderMood || 0)),
      evidenceCount: logs.length,
      narrative: "Derived from mood markers, behaviour entries, and incident profile over time.",
    },
    {
      key: "engagement",
      label: "Engagement",
      value: Math.max(10, 70 + recentLogs.filter((l) => l.entry_type === "education" || l.entry_type === "activity").length * 3),
      direction: "stable",
      evidenceCount: recentLogs.length,
      narrative: "Tracks education/activity engagement and follow-through across daily records.",
    },
    {
      key: "health",
      label: "Health",
      value: Math.max(10, 75 - meds.filter((m) => m.status === "late" || m.status === "refused" || m.status === "missed").length * 8),
      direction: "stable",
      evidenceCount: meds.length,
      narrative: "Built from medication adherence, health logs, and wellbeing observations.",
    },
    {
      key: "stability",
      label: "Placement Stability",
      value: Math.max(10, 80 - tasks.filter((t) => t.status !== "completed" && t.priority === "urgent").length * 8),
      direction: "stable",
      evidenceCount: tasks.length,
      narrative: "Combines unresolved high-priority tasks, incidents, and placement-related chronology events.",
    },
  ];

  return indicators;
}

function buildPatternSignals(childId: string): PatternSignal[] {
  const incidents = db.incidents.findAll().filter((i) => i.child_id === childId);
  const missing = db.missingEpisodes.findByChild(childId);
  const logs = db.dailyLog.findByChild(childId);
  const signals: PatternSignal[] = [];

  const contactLinkedIncidents = incidents.filter((i) => /contact/i.test(i.description));
  if (contactLinkedIncidents.length >= 2) {
    signals.push(
      makeSignal(
        childId,
        "Incidents linked after contact changes",
        "There is a repeated pattern between contact changes and later incident entries over the last 8 weeks.",
        contactLinkedIncidents.map((i) => i.reference),
        "medium"
      )
    );
  }

  const eveningMissing = missing.filter((m) => Number((m.time_missing || "00:00").split(":")[0]) >= 18);
  if (eveningMissing.length >= 2) {
    signals.push(
      makeSignal(
        childId,
        "Evening missing pattern",
        "Missing episodes appear clustered in the evening; consider pre-evening regulation planning and staff consistency checks.",
        eveningMissing.map((m) => m.reference),
        "high"
      )
    );
  }

  const educationRefusal = logs.filter((l) => /refus|would not|declin/i.test(l.content) && l.entry_type === "education");
  if (educationRefusal.length >= 2) {
    signals.push(
      makeSignal(
        childId,
        "Education engagement friction",
        "Education refusal appears recurrent; compare sleep and emotional regulation logs before school sessions.",
        educationRefusal.map((l) => l.id),
        "medium"
      )
    );
  }

  return signals;
}

export function getChildExperienceSnapshot(childId: string): ChildExperienceSnapshot {
  const child = db.youngPeople.findById(childId);
  if (!child) {
    return {
      childId,
      generatedAt: nowIso(),
      indicators: [],
      narrativeSummary: "Child not found.",
      journeyHighlights: [],
      patternSignals: [],
      voiceCoverage: { entriesInPeriod: 0, gaps: ["No child data available"], themes: [] },
    };
  }

  const indicators = buildIndicators(childId);
  const chronology = db.chronology.findByChild(childId).slice(0, 12);
  const patternSignals = buildPatternSignals(childId);
  const voice = db.intelligence.childVoice.findByChild(childId);
  const recentVoice = voice.filter((v) => daysBetween(v.created_at) <= 56);

  const journeyHighlights: ChildExperienceSnapshot["journeyHighlights"] = chronology.slice(0, 8).map((entry) => ({
    id: entry.id,
    date: entry.date,
    title: entry.title,
    type:
      entry.significance === "critical"
        ? "risk_escalation"
        : entry.category === "placement"
          ? "turning_point"
          : entry.category === "education" || entry.category === "health"
            ? "progress_milestone"
            : "protective_event",
    detail: entry.description,
  }));

  const gaps: string[] = [];
  if (recentVoice.length === 0) gaps.push("No direct child voice records in last 8 weeks");
  if (!journeyHighlights.length) gaps.push("Chronology has limited significant events");

  const themes = recentVoice.flatMap((v) => extractThemes(`${v.said} ${v.outcome}`));

  return {
    childId,
    generatedAt: nowIso(),
    indicators,
    narrativeSummary:
      "This snapshot blends incidents, daily logs, missing episodes, tasks, medication records, chronology, and child voice. Patterns are prompts for reflection, not deterministic conclusions.",
    journeyHighlights,
    patternSignals,
    voiceCoverage: {
      entriesInPeriod: recentVoice.length,
      gaps,
      themes: [...new Set(themes)].slice(0, 8),
    },
  };
}

export function getHomeClimateSnapshot(periodDays = 28): HomeClimateSnapshot {
  const incidents = db.incidents.findAll().filter((i) => daysBetween(i.date) <= periodDays);
  const missing = db.missingEpisodes.findAll().filter((m) => daysBetween(m.date_missing) <= periodDays);
  const tasks = db.tasks.findAll();
  const trainingExpired = db.training.findExpired().length;
  const openMaintenance = db.maintenance.findOpen().length;
  const overdueTasks = db.tasks.findOverdue().length;
  const openIncidents = incidents.filter((i) => i.status !== "closed").length;

  const shifts = db.shifts.findAll().filter((s) => daysBetween(s.date) <= periodDays);
  const openShiftCount = shifts.filter((s) => s.is_open_shift).length;

  const hotspotSignals: PatternSignal[] = [];
  if (openShiftCount >= 2 && openIncidents >= 2) {
    hotspotSignals.push(
      makeSignal(
        "home",
        "Rota instability and incident pressure",
        "There is overlap between rota instability and elevated incident activity. Review staffing consistency and deployment.",
        ["rota", "incidents"],
        "medium"
      )
    );
  }

  return {
    generatedAt: nowIso(),
    periodDays,
    signals: [
      {
        key: "staffing_consistency",
        label: "Staffing consistency",
        value: Math.max(0, 100 - openShiftCount * 12),
        direction: openShiftCount > 1 ? "worsening" : "stable",
        commentary: "Derived from open shifts, late starts, and short-notice cover requirements.",
      },
      {
        key: "incident_intensity",
        label: "Incident pressure",
        value: incidents.length,
        direction: incidents.length > 6 ? "worsening" : "stable",
        commentary: "Tracks frequency and open status of incidents within the analysis period.",
      },
      {
        key: "missing_episodes",
        label: "Missing episodes",
        value: missing.length,
        direction: missing.length > 2 ? "worsening" : "stable",
        commentary: "Monitors missing frequency and concentration windows across the home.",
      },
      {
        key: "actions_backlog",
        label: "Unfinished actions",
        value: overdueTasks,
        direction: overdueTasks > 0 ? "worsening" : "stable",
        commentary: "Overdue actions are a drift risk and reduce visible impact tracking.",
      },
      {
        key: "workforce_readiness",
        label: "Training compliance risk",
        value: trainingExpired,
        direction: trainingExpired > 0 ? "worsening" : "improving",
        commentary: "Expired compliance learning can weaken incident response and oversight quality.",
      },
      {
        key: "environment",
        label: "Environment pressure",
        value: openMaintenance,
        direction: openMaintenance > 2 ? "worsening" : "stable",
        commentary: "Open maintenance and H&S issues can influence home climate and felt safety.",
      },
    ],
    hotspotPatterns: hotspotSignals,
    leadershipAttention: [
      ...(overdueTasks > 0 ? [`${overdueTasks} overdue actions need manager closure reviews.`] : []),
      ...(trainingExpired > 0 ? [`${trainingExpired} training records are expired and should be remediated.`] : []),
      ...(openIncidents > 0 ? [`${openIncidents} incidents remain open and require oversight completion.`] : []),
    ],
  };
}

export function getQualityOfCareSnapshot(): QualityOfCareSnapshot {
  const incidents = db.incidents.findAll();
  const forms = db.careForms.findAll();
  const audits = db.audits.findAll();
  const unresolvedActions = db.tasks.findOverdue();
  const reg45Cycles = ((db as unknown as {
    reg45?: { cycles?: { findAll?: () => Array<{ completeness?: { blockFinalSignOff?: boolean } }> } };
  }).reg45?.cycles?.findAll?.() ?? []);
  const cycleCount = reg45Cycles.length;
  const blockedCycles = reg45Cycles.filter((c) => (c.completeness?.blockFinalSignOff ?? true) === true).length;

  const source = [...incidents.map((i) => i.description), ...forms.map((f) => `${f.title} ${f.description ?? ""}`)];
  const recurringThemes = [...new Set(source.flatMap((text) => extractThemes(text)))].slice(0, 10);

  const evidenceGaps: string[] = [];
  if (!forms.some((f) => f.form_type === "key_work_session" || f.form_type === "contact_log")) {
    evidenceGaps.push("Limited children consultation form evidence in current dataset.");
  }
  if (!audits.length) {
    evidenceGaps.push("No internal audits logged, reducing source-to-finding traceability.");
  }

  return {
    generatedAt: nowIso(),
    recurringThemes,
    evidenceGaps,
    unresolvedActionRisks: unresolvedActions.slice(0, 10).map((t) => `${t.title} (due ${t.due_date})`),
    reg45Readiness: {
      cycleCount,
      blockedCycles,
    },
    inspectionVulnerabilities: [
      ...(evidenceGaps.length ? ["Evidence completeness gaps may weaken inspection narrative."] : []),
      ...(blockedCycles > 0 ? ["Reg45 sign-off blocks remain unresolved."] : []),
      ...(unresolvedActions.length > 0 ? ["Overdue actions indicate potential drift."] : []),
    ],
  };
}

export function listPatternAlerts(): PatternSignal[] {
  const children = db.youngPeople.findCurrent();
  const dynamicSignals = children.flatMap((child) => getChildExperienceSnapshot(child.id).patternSignals);
  const savedSignals = db.intelligence.patternAlerts.findAll();
  // Exclude resolved saved alerts; dynamic alerts are always shown as active
  const activeSaved = savedSignals.filter((s) => !s.status || s.status !== "resolved");
  return [...activeSaved, ...dynamicSignals].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function countActiveAlerts(): number {
  const children = db.youngPeople.findCurrent();
  const dynamicSignals = children.flatMap((child) => getChildExperienceSnapshot(child.id).patternSignals);
  const activeSaved = db.intelligence.patternAlerts.findActive();
  // High-confidence alerts only for badge count
  return [...activeSaved, ...dynamicSignals].filter((s) => s.confidence === "high").length;
}

export function listActionEffectiveness(): ActionEffectivenessReview[] {
  return db.intelligence.actionReviews.findAll();
}

export function buildManagerOversightIntelligence() {
  const incidents = db.incidents.findAll();
  const forms = db.careForms.findAll();
  const tasks = db.tasks.findAll();

  const weakAnalysisRecords = forms.filter((f) => {
    const text = `${f.description ?? ""} ${JSON.stringify(f.body ?? {})}`.trim();
    return text.length > 0 && text.length < 80;
  }).map((f) => ({ id: f.id, title: f.title, reason: "Low analytical depth in narrative field." }));

  const stalledActions = tasks.filter((t) => t.status !== "completed" && t.due_date && t.due_date < new Date().toISOString().slice(0, 10));

  const missingOversight = incidents
    .filter((i) => i.requires_oversight && !i.oversight_by)
    .map((i) => ({ id: i.id, title: i.reference, reason: "Oversight required but not yet completed." }));

  return {
    generatedAt: nowIso(),
    weakAnalysisRecords,
    stalledActions: stalledActions.map((t) => ({ id: t.id, title: t.title, owner: t.assigned_to ? getStaffName(t.assigned_to) : "Unassigned" })),
    missingOversight,
    driftIndicators: [
      ...(stalledActions.length > 0 ? ["Action closure delays are present across priority tasks."] : []),
      ...(missingOversight.length > 0 ? ["Incident oversight completion is inconsistent."] : []),
    ],
  };
}

export function buildChildrenVoiceCoverage() {
  const currentChildren = db.youngPeople.findCurrent();
  const voiceEntries = db.intelligence.childVoice.findAll();

  const perChild = currentChildren.map((child) => {
    const childVoice = voiceEntries.filter((v) => v.child_id === child.id);
    return {
      childId: child.id,
      childName: child.preferred_name ?? child.first_name,
      count: childVoice.length,
      latest: childVoice[0]?.created_at ?? null,
      hasActionLink: childVoice.some((v) => v.outcome.trim().length > 0),
      recurringThemes: [...new Set(childVoice.flatMap((v) => extractThemes(`${v.said} ${v.outcome}`)))].slice(0, 6),
    };
  });

  return {
    generatedAt: nowIso(),
    entriesTotal: voiceEntries.length,
    perChild,
    missingChildren: perChild.filter((c) => c.count === 0).map((c) => c.childName),
  };
}

export function createDefaultVoiceEntry(childId: string, payload: Omit<ChildVoiceEntry, "id" | "child_id" | "created_at">): ChildVoiceEntry {
  return db.intelligence.childVoice.create({
    child_id: childId,
    ...payload,
  });
}
