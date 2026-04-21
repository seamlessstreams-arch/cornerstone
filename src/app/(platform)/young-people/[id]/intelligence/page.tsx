"use client";

import { useState, use } from "react";
import Link from "next/link";
import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, Plus, Users, Sparkles, MessageSquare, Target, TrendingUp, TrendingDown, Minus, Star, Clock, CheckCircle2, Pencil, X } from "lucide-react";
import { useYoungPerson } from "@/hooks/use-young-people";
import {
  useChildExperience,
  useChildInterventions,
  useChildVoice,
  useCreateChildVoice,
  useCreateIntervention,
  useCreatePracticeBankEntry,
  useCreateTrustedAdult,
  useUpdateIntervention,
  useCreateActionEffectiveness,
  usePracticeBank,
  useTrustedAdults,
} from "@/hooks/use-intelligence";
import { useStaff } from "@/hooks/use-staff";
import { useDictation } from "@/hooks/use-dictation";
import { DictationControls } from "@/components/common/dictation-controls";
import { AriaInsightPanel } from "@/components/aria/aria-insight-panel";
import { PatternAlertsPanel } from "@/components/insights/pattern-alerts-panel";
import type { InsightDirection, InterventionRecord } from "@/types/intelligence";

export default function YoungPersonIntelligencePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const yp = useYoungPerson(id);
  const experience = useChildExperience(id);
  const interventions = useChildInterventions(id);
  const trustedAdults = useTrustedAdults(id);
  const practiceBank = usePracticeBank(id);
  const voiceEntries = useChildVoice(id);
  const staffList = useStaff({ status: "active" });

  const createIntervention = useCreateIntervention(id);
  const updateIntervention = useUpdateIntervention(id);
  const createTrustedAdult = useCreateTrustedAdult(id);
  const createPractice = useCreatePracticeBankEntry(id);
  const createVoice = useCreateChildVoice(id);
  const createActionReview = useCreateActionEffectiveness();

  const [interventionTitle, setInterventionTitle] = useState("");
  const [interventionRationale, setInterventionRationale] = useState("");
  const [voiceSaid, setVoiceSaid] = useState("");
  const [voiceResponse, setVoiceResponse] = useState("");
  const [voiceOutcome, setVoiceOutcome] = useState("");
  const [dictationMode, setDictationMode] = useState<"append" | "replace">("append");

  // Intervention editing
  const [editingIntervention, setEditingIntervention] = useState<InterventionRecord | null>(null);
  const [editStatus, setEditStatus] = useState<InterventionRecord["status"]>("active");
  const [editImpact, setEditImpact] = useState("");
  const [editDecision, setEditDecision] = useState<"continue" | "adapt" | "stop" | "">("");

  // Action effectiveness review form
  const [showAerForm, setShowAerForm] = useState(false);
  const [aerActionId, setAerActionId] = useState("");
  const [aerWhatChanged, setAerWhatChanged] = useState("");
  const [aerEvidence, setAerEvidence] = useState("");
  const [aerEffectiveness, setAerEffectiveness] = useState<"worked" | "partially_worked" | "did_not_work">("worked");
  const [aerDecision, setAerDecision] = useState<"continue" | "adapt" | "stop">("continue");
  // Trusted adult form
  const [showTaForm, setShowTaForm] = useState(false);
  const [taStaffId, setTaStaffId] = useState("");
  const [taRelType, setTaRelType] = useState<"preferred" | "regulating" | "engaging" | "strain" | "avoided">("preferred");
  const [taConfidence, setTaConfidence] = useState<"high" | "medium" | "low">("medium");
  const [taNotes, setTaNotes] = useState("");

  // Practice bank form
  const [showPbForm, setShowPbForm] = useState(false);
  const [pbCategory, setPbCategory] = useState("deescalation");
  const [pbTitle, setPbTitle] = useState("");
  const [pbDetails, setPbDetails] = useState("");

  const dictation = useDictation((_next, rawChunk) => {
    setVoiceSaid((prev) => (dictationMode === "replace" ? rawChunk : `${prev} ${rawChunk}`.trim()));
  }, { mode: dictationMode });

  if (yp.isLoading || experience.isPending) {
    return (
      <PageShell title="Child Intelligence" showQuickCreate={false}>
        <div className="rounded-xl border bg-white py-16 flex items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
        </div>
      </PageShell>
    );
  }

  const child = yp.data?.data;
  if (!child) {
    return (
      <PageShell title="Child Intelligence" showQuickCreate={false}>
        <div className="rounded-xl border bg-white py-16 text-center text-sm text-slate-500">Child not found.</div>
      </PageShell>
    );
  }

  const displayName = `${child.preferred_name ?? child.first_name} ${child.last_name}`;
  const indicators = experience.data?.data?.indicators ?? [];
  const experienceIndex = indicators.length
    ? Math.round(indicators.reduce((sum, indicator) => sum + indicator.value, 0) / indicators.length)
    : 0;
  const relationalStability = indicators.find((item) => item.key === "stability")?.value ?? 0;
  const patternSignals = experience.data?.data?.patternSignals ?? [];
  const journeyHighlights = experience.data?.data?.journeyHighlights ?? [];
  const voiceCoverage = experience.data?.data?.voiceCoverage;

  function DirectionIcon({ direction }: { direction: InsightDirection }) {
    if (direction === "improving") return <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />;
    if (direction === "worsening") return <TrendingDown className="h-3.5 w-3.5 text-red-500" />;
    return <Minus className="h-3.5 w-3.5 text-slate-400" />;
  }

  const HIGHLIGHT_COLOURS: Record<string, string> = {
    turning_point: "border-l-blue-400 bg-blue-50",
    risk_escalation: "border-l-red-400 bg-red-50",
    protective_event: "border-l-emerald-400 bg-emerald-50",
    progress_milestone: "border-l-amber-400 bg-amber-50",
  };

  async function submitIntervention() {
    if (!interventionTitle.trim() || !interventionRationale.trim()) return;
    await createIntervention.mutateAsync({
      title: interventionTitle,
      why_now: interventionRationale,
      intended_outcome: "Improve felt safety and stability over next review window.",
      started_on: new Date().toISOString().slice(0, 10),
      review_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      status: "active",
    });
    setInterventionTitle("");
    setInterventionRationale("");
  }

  async function submitTrustedAdult() {
    if (!taStaffId) return;
    await createTrustedAdult.mutateAsync({
      staff_id: taStaffId,
      relationship_type: taRelType,
      confidence: taConfidence,
      notes: taNotes.trim() || null,
    });
    setTaStaffId("");
    setTaRelType("preferred");
    setTaConfidence("medium");
    setTaNotes("");
    setShowTaForm(false);
  }

  async function submitPracticeEntry() {
    if (!pbTitle.trim() || !pbDetails.trim()) return;
    await createPractice.mutateAsync({
      category: pbCategory,
      title: pbTitle.trim(),
      details: pbDetails.trim(),
    });
    setPbTitle("");
    setPbDetails("");
    setPbCategory("deescalation");
    setShowPbForm(false);
  }

  async function submitVoice() {
    if (!voiceSaid.trim() || !voiceResponse.trim() || !voiceOutcome.trim()) return;
    await createVoice.mutateAsync({ said: voiceSaid, adult_response: voiceResponse, outcome: voiceOutcome, source: "dictated" });
    setVoiceSaid("");
    setVoiceResponse("");
    setVoiceOutcome("");
  }

  function openEditIntervention(item: InterventionRecord) {
    setEditingIntervention(item);
    setEditStatus(item.status);
    setEditImpact(item.impact_summary ?? "");
    setEditDecision(item.continue_decision ?? "");
  }

  async function submitInterventionUpdate() {
    if (!editingIntervention) return;
    await updateIntervention.mutateAsync({
      interventionId: editingIntervention.id,
      status: editStatus,
      impact_summary: editImpact.trim() || null,
      continue_decision: editDecision || null,
    });
    setEditingIntervention(null);
  }

  async function submitActionReview() {
    if (!aerActionId.trim() || !aerWhatChanged.trim() || !aerEvidence.trim()) return;
    await createActionReview.mutateAsync({
      action_id: aerActionId.trim(),
      child_id: id,
      what_changed: aerWhatChanged.trim(),
      evidence_after: aerEvidence.trim(),
      effectiveness: aerEffectiveness,
      decision: aerDecision,
    });
    setAerActionId("");
    setAerWhatChanged("");
    setAerEvidence("");
    setAerEffectiveness("worked");
    setAerDecision("continue");
    setShowAerForm(false);
  }

  return (
    <PageShell
      title={`${displayName} - Intelligence`}
      subtitle="Experience synthesis, pattern reasoning, and intervention quality loop"
      showQuickCreate={false}
      actions={
        <Button asChild variant="outline" size="sm">
          <Link href={`/young-people/${id}`}>
            <ArrowLeft className="h-3.5 w-3.5 mr-1" />Profile
          </Link>
        </Button>
      }
    >
      <div className="space-y-5">

        {/* ── Experience indicator summary bar ─────────────────────────── */}
        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-5">
          {indicators.length > 0 ? indicators.map((ind) => (
            <Card key={ind.key}>
              <CardContent className="p-3">
                <div className="flex items-center justify-between mb-1">
                  <div className="text-[11px] text-slate-500">{ind.label}</div>
                  <DirectionIcon direction={ind.direction} />
                </div>
                <div className="text-2xl font-bold text-slate-900">{ind.value}</div>
                <div className="mt-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${ind.direction === "improving" ? "bg-emerald-400" : ind.direction === "worsening" ? "bg-red-400" : "bg-slate-400"}`}
                    style={{ width: `${Math.min(100, ind.value)}%` }}
                  />
                </div>
                <div className="text-[10px] text-slate-400 mt-1">{ind.evidenceCount} data point{ind.evidenceCount !== 1 ? "s" : ""}</div>
              </CardContent>
            </Card>
          )) : (
            <>
              <Card><CardContent className="p-4"><div className="text-xs text-slate-500">Experience Index</div><div className="text-3xl font-bold text-blue-600 mt-1">{experienceIndex}</div></CardContent></Card>
              <Card><CardContent className="p-4"><div className="text-xs text-slate-500">Relational Stability</div><div className="text-3xl font-bold text-emerald-600 mt-1">{relationalStability}%</div></CardContent></Card>
              <Card><CardContent className="p-4"><div className="text-xs text-slate-500">Signals</div><div className="text-3xl font-bold text-amber-600 mt-1">{patternSignals.length}</div></CardContent></Card>
            </>
          )}
        </div>

        {/* ── Pattern signals (child-specific) ──────────────────────────── */}
        {patternSignals.length > 0 && (
          <PatternAlertsPanel alerts={patternSignals} title={`Pattern Signals — ${displayName}`} />
        )}

        {/* ── Journey highlights ─────────────────────────────────────────── */}
        {journeyHighlights.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Star className="h-4 w-4 text-blue-500" />
                Journey Highlights
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {journeyHighlights.map((h) => (
                <div
                  key={h.id}
                  className={`rounded-md border-l-2 px-3 py-2 text-xs ${HIGHLIGHT_COLOURS[h.type] ?? "border-l-slate-300 bg-slate-50"}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-semibold text-slate-800">{h.title}</div>
                    <div className="flex items-center gap-1 text-slate-500 shrink-0">
                      <Clock className="h-3 w-3" />
                      {new Date(h.date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                    </div>
                  </div>
                  {h.detail && <div className="text-slate-600 mt-1">{h.detail}</div>}
                  <Badge className="mt-1.5 text-[10px] rounded-full capitalize">{h.type.replace(/_/g, " ")}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        <div className="grid gap-5 xl:grid-cols-[1.2fr_1fr]">
          <div className="space-y-5">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2"><Target className="h-4 w-4 text-amber-500" />Interventions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid gap-2 sm:grid-cols-[1fr_2fr_auto]">
                  <input
                    className="h-9 rounded-md border px-3 text-sm"
                    placeholder="Intervention title"
                    value={interventionTitle}
                    onChange={(e) => setInterventionTitle(e.target.value)}
                  />
                  <input
                    className="h-9 rounded-md border px-3 text-sm"
                    placeholder="Rationale"
                    value={interventionRationale}
                    onChange={(e) => setInterventionRationale(e.target.value)}
                  />
                  <Button size="sm" onClick={submitIntervention} disabled={createIntervention.isPending}>
                    <Plus className="h-4 w-4 mr-1" />Add
                  </Button>
                </div>
                {(interventions.data?.data ?? []).map((item) => (
                  <div key={item.id} className="rounded-md border p-3 text-xs">
                    {editingIntervention?.id === item.id ? (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="font-semibold text-slate-900">{item.title}</div>
                          <Button size="sm" variant="ghost" className="h-6 px-2" onClick={() => setEditingIntervention(null)}>
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <select
                            className="h-8 rounded-md border bg-white px-2 text-xs"
                            value={editStatus}
                            onChange={(e) => setEditStatus(e.target.value as InterventionRecord["status"])}
                          >
                            <option value="active">Active</option>
                            <option value="review_due">Review due</option>
                            <option value="completed">Completed</option>
                            <option value="stopped">Stopped</option>
                          </select>
                          <select
                            className="h-8 rounded-md border bg-white px-2 text-xs"
                            value={editDecision}
                            onChange={(e) => setEditDecision(e.target.value as "continue" | "adapt" | "stop" | "")}
                          >
                            <option value="">No decision yet</option>
                            <option value="continue">Continue</option>
                            <option value="adapt">Adapt</option>
                            <option value="stop">Stop</option>
                          </select>
                        </div>
                        <textarea
                          className="w-full rounded-md border p-2 text-xs h-16"
                          placeholder="Impact summary…"
                          value={editImpact}
                          onChange={(e) => setEditImpact(e.target.value)}
                        />
                        <Button size="sm" onClick={submitInterventionUpdate} disabled={updateIntervention.isPending}>
                          <CheckCircle2 className="h-3.5 w-3.5 mr-1" />Save
                        </Button>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center justify-between">
                          <div className="font-semibold text-slate-900">{item.title}</div>
                          <div className="flex items-center gap-1.5">
                            <Badge className="text-[10px] rounded-full capitalize">{item.status.replace(/_/g, " ")}</Badge>
                            <Button size="sm" variant="ghost" className="h-6 px-1.5" onClick={() => openEditIntervention(item)}>
                              <Pencil className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        <div className="text-slate-600 mt-1">{item.why_now}</div>
                        <div className="text-slate-400 mt-1">Outcome: {item.intended_outcome}</div>
                        {item.impact_summary && (
                          <div className="text-slate-500 mt-1 bg-emerald-50 border border-emerald-100 rounded px-2 py-1">
                            Impact: {item.impact_summary}
                          </div>
                        )}
                        {item.continue_decision && (
                          <div className="text-slate-400 mt-1">Decision: <span className="capitalize font-medium text-slate-700">{item.continue_decision}</span></div>
                        )}
                      </>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2"><Users className="h-4 w-4 text-sky-500" />Trusted Adult Map</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {!showTaForm ? (
                  <Button size="sm" variant="outline" onClick={() => setShowTaForm(true)}>
                    <Plus className="h-4 w-4 mr-1" />Add Trusted Adult
                  </Button>
                ) : (
                  <div className="rounded-lg border bg-slate-50 p-3 space-y-2">
                    <div className="text-xs font-semibold text-slate-700">New Trusted Adult</div>
                    <select
                      className="h-9 w-full rounded-md border bg-white px-3 text-sm"
                      value={taStaffId}
                      onChange={(e) => setTaStaffId(e.target.value)}
                    >
                      <option value="">Select staff member…</option>
                      {(staffList.data?.data ?? []).map((s) => (
                        <option key={s.id} value={s.id}>{s.full_name} — {s.job_title}</option>
                      ))}
                    </select>
                    <div className="grid grid-cols-2 gap-2">
                      <select
                        className="h-9 rounded-md border bg-white px-3 text-sm"
                        value={taRelType}
                        onChange={(e) => setTaRelType(e.target.value as typeof taRelType)}
                      >
                        <option value="preferred">Preferred</option>
                        <option value="regulating">Regulating</option>
                        <option value="engaging">Engaging</option>
                        <option value="strain">In strain</option>
                        <option value="avoided">Avoided</option>
                      </select>
                      <select
                        className="h-9 rounded-md border bg-white px-3 text-sm"
                        value={taConfidence}
                        onChange={(e) => setTaConfidence(e.target.value as typeof taConfidence)}
                      >
                        <option value="high">High confidence</option>
                        <option value="medium">Medium confidence</option>
                        <option value="low">Low confidence</option>
                      </select>
                    </div>
                    <input
                      className="h-9 w-full rounded-md border px-3 text-sm"
                      placeholder="Notes (optional)"
                      value={taNotes}
                      onChange={(e) => setTaNotes(e.target.value)}
                    />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={submitTrustedAdult} disabled={!taStaffId || createTrustedAdult.isPending}>Save</Button>
                      <Button size="sm" variant="ghost" onClick={() => setShowTaForm(false)}>Cancel</Button>
                    </div>
                  </div>
                )}
                {(trustedAdults.data?.data ?? []).map((item) => (
                  <div key={item.id} className="rounded-md border p-2.5 text-xs flex items-center justify-between gap-3">
                    <div>
                      <div className="font-semibold text-slate-900">{(item.staff as { full_name?: string } | null)?.full_name ?? item.staff_id}</div>
                      <div className="text-slate-500">{item.notes}</div>
                    </div>
                    <Badge className="rounded-full text-[10px] capitalize">{item.relationship_type}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">What Works Practice Bank</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {!showPbForm ? (
                  <Button size="sm" variant="outline" onClick={() => setShowPbForm(true)}>
                    <Plus className="h-4 w-4 mr-1" />Capture What Works
                  </Button>
                ) : (
                  <div className="rounded-lg border bg-slate-50 p-3 space-y-2">
                    <div className="text-xs font-semibold text-slate-700">New Practice Entry</div>
                    <select
                      className="h-9 w-full rounded-md border bg-white px-3 text-sm"
                      value={pbCategory}
                      onChange={(e) => setPbCategory(e.target.value)}
                    >
                      <option value="deescalation">De-escalation</option>
                      <option value="what_helps">What helps</option>
                      <option value="communication">Communication</option>
                      <option value="routine">Routine</option>
                      <option value="relationships">Relationships</option>
                      <option value="triggers">Triggers to avoid</option>
                      <option value="activities">Activities</option>
                      <option value="other">Other</option>
                    </select>
                    <input
                      className="h-9 w-full rounded-md border px-3 text-sm"
                      placeholder="Title (e.g. Walk-and-talk when dysregulated)"
                      value={pbTitle}
                      onChange={(e) => setPbTitle(e.target.value)}
                    />
                    <textarea
                      className="w-full rounded-md border p-2 text-sm h-20"
                      placeholder="Details — what happened, how it helped, context…"
                      value={pbDetails}
                      onChange={(e) => setPbDetails(e.target.value)}
                    />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={submitPracticeEntry} disabled={!pbTitle.trim() || !pbDetails.trim() || createPractice.isPending}>Save</Button>
                      <Button size="sm" variant="ghost" onClick={() => setShowPbForm(false)}>Cancel</Button>
                    </div>
                  </div>
                )}
                {(practiceBank.data?.data ?? []).map((entry) => (
                  <div key={entry.id} className="rounded-md border p-3 text-xs">
                    <div className="font-semibold text-slate-900">{entry.title}</div>
                    <div className="text-slate-500 mt-1">{entry.details}</div>
                    <div className="text-slate-400 mt-1">Category: {entry.category.replace(/_/g, " ")}</div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Action Effectiveness Review */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />Action Effectiveness
                  </CardTitle>
                  {!showAerForm && (
                    <Button size="sm" variant="outline" className="h-7 px-2.5 text-xs" onClick={() => setShowAerForm(true)}>
                      <Plus className="h-3.5 w-3.5 mr-1" />Log Review
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {showAerForm && (
                  <div className="rounded-lg border bg-slate-50 p-3 space-y-2">
                    <div className="text-xs font-semibold text-slate-700">Log Effectiveness Review</div>
                    <input
                      className="h-9 w-full rounded-md border bg-white px-3 text-sm"
                      placeholder="Action or intervention reference (e.g. intv_001)"
                      value={aerActionId}
                      onChange={(e) => setAerActionId(e.target.value)}
                    />
                    <textarea
                      className="w-full rounded-md border p-2 text-sm h-16"
                      placeholder="What changed as a result of this action?"
                      value={aerWhatChanged}
                      onChange={(e) => setAerWhatChanged(e.target.value)}
                    />
                    <textarea
                      className="w-full rounded-md border p-2 text-sm h-16"
                      placeholder="Evidence observed after the action…"
                      value={aerEvidence}
                      onChange={(e) => setAerEvidence(e.target.value)}
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <select
                        className="h-9 rounded-md border bg-white px-3 text-sm"
                        value={aerEffectiveness}
                        onChange={(e) => setAerEffectiveness(e.target.value as typeof aerEffectiveness)}
                      >
                        <option value="worked">Worked</option>
                        <option value="partially_worked">Partially worked</option>
                        <option value="did_not_work">Did not work</option>
                      </select>
                      <select
                        className="h-9 rounded-md border bg-white px-3 text-sm"
                        value={aerDecision}
                        onChange={(e) => setAerDecision(e.target.value as typeof aerDecision)}
                      >
                        <option value="continue">Continue</option>
                        <option value="adapt">Adapt</option>
                        <option value="stop">Stop</option>
                      </select>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={submitActionReview} disabled={createActionReview.isPending || !aerActionId.trim() || !aerWhatChanged.trim()}>
                        Save Review
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setShowAerForm(false)}>Cancel</Button>
                    </div>
                  </div>
                )}
                <div className="text-[11px] text-slate-400">
                  Reviews logged here feed the home-level effectiveness loop on the Intelligence dashboard.
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right column: Voice, ARIA, narrative */}
          <div className="space-y-5">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2"><MessageSquare className="h-4 w-4 text-violet-500" />Children's Voice</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <DictationControls
                  isListening={dictation.isListening}
                  onStart={dictation.start}
                  onStop={dictation.stop}
                  mode={dictationMode}
                  onModeChange={setDictationMode}
                />
                <textarea
                  className="h-20 w-full rounded-md border p-2 text-sm"
                  value={voiceSaid}
                  onChange={(e) => setVoiceSaid(e.target.value)}
                  placeholder="What did the child say?"
                />
                <input
                  className="h-9 w-full rounded-md border px-3 text-sm"
                  value={voiceResponse}
                  onChange={(e) => setVoiceResponse(e.target.value)}
                  placeholder="Adult response"
                />
                <input
                  className="h-9 w-full rounded-md border px-3 text-sm"
                  value={voiceOutcome}
                  onChange={(e) => setVoiceOutcome(e.target.value)}
                  placeholder="Outcome for the child"
                />
                <Button size="sm" onClick={submitVoice} disabled={createVoice.isPending}>Save Voice Entry</Button>
                {(voiceEntries.data?.data ?? []).slice(0, 6).map((entry) => (
                  <div key={entry.id} className="rounded-md border p-2.5 text-xs">
                    <div className="font-semibold text-slate-900">"{entry.said}"</div>
                    <div className="text-slate-500 mt-1">Response: {entry.adult_response}</div>
                    <div className="text-slate-400 mt-1">Outcome: {entry.outcome}</div>
                  </div>
                ))}
                {voiceCoverage && (voiceCoverage.themes.length > 0 || voiceCoverage.gaps.length > 0) && (
                  <div className="rounded-md bg-slate-50 border p-3 space-y-2">
                    <div className="text-[11px] font-semibold text-slate-700">Voice Coverage Analysis</div>
                    {voiceCoverage.themes.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {voiceCoverage.themes.map((t) => (
                          <Badge key={t} className="rounded-full text-[10px] bg-violet-100 text-violet-700">{t}</Badge>
                        ))}
                      </div>
                    )}
                    {voiceCoverage.gaps.length > 0 && (
                      <div className="space-y-1">
                        {voiceCoverage.gaps.map((gap) => (
                          <div key={gap} className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1">{gap}</div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            <AriaInsightPanel
              context={`${displayName} child intelligence`}
              sourceContent={JSON.stringify(experience.data?.data ?? {}, null, 2)}
              suggestedPrompts={[
                "What might this child be communicating through recent patterns?",
                "Which current intervention should be refined and how?",
                "What should the manager ask in next supervision?",
              ]}
            />

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2"><Sparkles className="h-4 w-4 text-amber-500" />Intelligence Narrative</CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-slate-600 whitespace-pre-wrap">
                {experience.data?.data?.narrativeSummary || "No narrative available yet."}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
