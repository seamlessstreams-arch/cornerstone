"use client";

import { useMemo } from "react";
import Link from "next/link";
import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Shield, Sparkles, ArrowRight, Target, Users, MessageSquare, Zap, ClipboardList } from "lucide-react";
import {
  useActionEffectiveness,
  useAutomationLogs,
  useCreateFollowUpIntervention,
  useHomeClimate,
  useManagementOversightIntelligence,
  usePatternAlerts,
  useQualityOfCareIntelligence,
  useTriggerOversightAutomation,
  useVoiceCoverage,
} from "@/hooks/use-intelligence";
import { useYoungPeople } from "@/hooks/use-young-people";
import { PatternAlertsPanel } from "@/components/insights/pattern-alerts-panel";
import { AriaInsightPanel } from "@/components/aria/aria-insight-panel";

export default function IntelligenceReportsPage() {
  const homeClimate = useHomeClimate(28);
  const patterns = usePatternAlerts();
  const quality = useQualityOfCareIntelligence();
  const oversight = useManagementOversightIntelligence();
  const actions = useActionEffectiveness();
  const voice = useVoiceCoverage();
  const children = useYoungPeople("current");
  const automationLogs = useAutomationLogs();
  const createFollowUp = useCreateFollowUpIntervention();
  const triggerOversight = useTriggerOversightAutomation();

  const isLoading = [homeClimate, patterns, quality, oversight, actions, voice, children].some((q) => q.isPending);

  const childLinks = useMemo(() => (children.data?.data ?? []).slice(0, 6), [children.data?.data]);
  const climateSignals = homeClimate.data?.data?.signals ?? [];
  const incidentPressure = climateSignals.find((s) => s.key === "incident_intensity")?.value ?? 0;
  const missingEpisodes = climateSignals.find((s) => s.key === "missing_episodes")?.value ?? 0;

  const sourceContext = JSON.stringify(
    {
      home_climate: homeClimate.data?.data,
      quality_of_care: quality.data?.data,
      pattern_alerts: patterns.data?.data,
      voice_coverage: voice.data?.data,
    },
    null,
    2
  );

  return (
    <PageShell
      title="Intelligence & Insight"
      subtitle="Pattern detection, quality synthesis, voice coverage, and action effectiveness across the home"
      quickCreateContext={{ module: "reports", defaultTaskCategory: "admin" }}
    >
      <div className="space-y-6">
        {isLoading && (
          <div className="rounded-xl border bg-white py-12 flex items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
          </div>
        )}

        {!isLoading && (
          <>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <Card>
                <CardContent className="p-4">
                  <div className="text-xs text-slate-500">Safeguarding Signals</div>
                  <div className="mt-1 text-3xl font-bold text-red-600">{incidentPressure}</div>
                  <div className="text-[11px] text-slate-400 mt-1">Last 28 days</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-xs text-slate-500">Missing Episodes</div>
                  <div className="mt-1 text-3xl font-bold text-violet-600">{missingEpisodes}</div>
                  <div className="text-[11px] text-slate-400 mt-1">Trend watch indicator</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-xs text-slate-500">Voice Coverage</div>
                  <div className="mt-1 text-3xl font-bold text-blue-600">{voice.data?.data?.entriesTotal ?? 0}</div>
                  <div className="text-[11px] text-slate-400 mt-1">Total captured voice entries</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-xs text-slate-500">Actions Reviewed</div>
                  <div className="mt-1 text-3xl font-bold text-emerald-600">{actions.data?.data?.length ?? 0}</div>
                  <div className="text-[11px] text-slate-400 mt-1">Effectiveness decisions recorded</div>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-5 xl:grid-cols-[1.25fr_1fr]">
              <div className="space-y-5">
                <PatternAlertsPanel alerts={patterns.data?.data ?? []} title="Home Pattern Alerts" />

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Shield className="h-4 w-4 text-emerald-500" />
                      Quality of Care Intelligence
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <div className="grid sm:grid-cols-3 gap-3">
                      <div className="rounded-lg border p-3">
                        <div className="text-[11px] text-slate-500">Recurring Themes</div>
                        <div className="text-xl font-bold text-slate-900">{quality.data?.data?.recurringThemes.length ?? 0}</div>
                      </div>
                      <div className="rounded-lg border p-3">
                        <div className="text-[11px] text-slate-500">Evidence Gaps</div>
                        <div className="text-xl font-bold text-slate-900">{quality.data?.data?.evidenceGaps.length ?? 0}</div>
                      </div>
                      <div className="rounded-lg border p-3">
                        <div className="text-[11px] text-slate-500">Reg45 Blocks</div>
                        <div className="text-xl font-bold text-slate-900">{quality.data?.data?.reg45Readiness.blockedCycles ?? 0}</div>
                      </div>
                    </div>
                    <div className="rounded-md bg-slate-50 border p-3 text-xs text-slate-600 whitespace-pre-wrap">
                      {(quality.data?.data?.inspectionVulnerabilities ?? []).join("\n") || "No quality narrative generated yet."}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Target className="h-4 w-4 text-amber-500" />
                      Action Effectiveness Loop
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {(actions.data?.data ?? []).slice(0, 6).map((item) => (
                      <div key={item.id} className="rounded-md border p-3 text-xs">
                        <div className="flex items-center justify-between gap-2">
                          <div className="font-semibold text-slate-900">Action {item.action_id}</div>
                          <div className="flex items-center gap-2">
                            <Badge className="rounded-full text-[10px] capitalize">{item.effectiveness}</Badge>
                            {item.decision === "continue" || item.decision === "adapt" ? (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-6 px-2 text-[10px]"
                                disabled={createFollowUp.isPending}
                                onClick={() =>
                                  createFollowUp.mutate({
                                    actionReviewId: item.id,
                                    childId: item.child_id ?? "unknown",
                                    newInterventionTitle: `Follow-up: ${item.action_id}`,
                                    newInterventionOutcome: item.what_changed ?? "Review and refine approach",
                                    owner: "manager",
                                    dueInDays: 14,
                                  })
                                }
                              >
                                <Zap className="h-3 w-3 mr-1" />Follow-up
                              </Button>
                            ) : null}
                          </div>
                        </div>
                        <div className="text-slate-600 mt-1">{item.what_changed}</div>
                        <div className="text-slate-400 mt-1">Decision: {item.decision}</div>
                      </div>
                    ))}
                    {(actions.data?.data ?? []).length === 0 && (
                      <div className="text-xs text-slate-400">No action reviews logged yet.</div>
                    )}
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-5">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Users className="h-4 w-4 text-sky-500" />
                      Child Journey Intelligence
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {childLinks.map((child) => (
                      <Link
                        key={child.id}
                        href={`/young-people/${child.id}/intelligence`}
                        className="flex items-center justify-between rounded-md border p-3 text-sm hover:bg-slate-50"
                      >
                        <div>
                          <div className="font-medium text-slate-900">{child.preferred_name ?? child.first_name} {child.last_name}</div>
                          <div className="text-xs text-slate-500">{child.local_authority}</div>
                        </div>
                        <ArrowRight className="h-4 w-4 text-slate-400" />
                      </Link>
                    ))}
                    {childLinks.length === 0 && <div className="text-xs text-slate-400">No current children found.</div>}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <MessageSquare className="h-4 w-4 text-violet-500" />
                        Oversight Intelligence
                      </CardTitle>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 px-2.5 text-xs"
                        disabled={triggerOversight.isPending}
                        onClick={() => triggerOversight.mutate({ triggerType: "all", assignTo: "manager" })}
                      >
                        <Zap className="h-3 w-3 mr-1" />
                        {triggerOversight.isPending ? "Triggering…" : "Auto-generate Tasks"}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2 text-xs text-slate-600">
                    {triggerOversight.data && (
                      <div className="rounded-md bg-emerald-50 border border-emerald-200 p-2 text-emerald-700 text-[11px]">
                        {triggerOversight.data.message}
                      </div>
                    )}
                    {(() => {
                      const d = oversight.data?.data as {
                        weakAnalysisRecords?: unknown[];
                        stalledActions?: unknown[];
                        missingOversight?: unknown[];
                        driftIndicators?: string[];
                      } | undefined;
                      if (!d) return <div className="text-slate-400">Loading…</div>;
                      return (
                        <>
                          <div className="flex items-center justify-between rounded-md border p-2.5">
                            <span>Weak analysis records</span>
                            <span className="font-semibold text-slate-800">{d.weakAnalysisRecords?.length ?? 0}</span>
                          </div>
                          <div className="flex items-center justify-between rounded-md border p-2.5">
                            <span>Stalled actions</span>
                            <span className="font-semibold text-amber-700">{d.stalledActions?.length ?? 0}</span>
                          </div>
                          <div className="flex items-center justify-between rounded-md border p-2.5">
                            <span>Missing oversight</span>
                            <span className="font-semibold text-red-700">{d.missingOversight?.length ?? 0}</span>
                          </div>
                          {(d.driftIndicators ?? []).map((ind, i) => (
                            <div key={i} className="rounded-md bg-amber-50 border border-amber-200 p-2 text-[11px] text-amber-800">{ind}</div>
                          ))}
                        </>
                      );
                    })()}
                  </CardContent>
                </Card>

                <AriaInsightPanel
                  context="Home Intelligence Dashboard"
                  sourceContent={sourceContext}
                  suggestedPrompts={[
                    "What are the top 3 risks emerging this month?",
                    "Which action should the manager review first and why?",
                    "Summarise readiness for a Reg44 visit from this data.",
                  ]}
                />

                {/* ── Automation Audit Trail ───────────────────────────── */}
                <Card>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <ClipboardList className="h-4 w-4 text-slate-500" />
                        Automation Audit Trail
                      </CardTitle>
                      <Badge className="rounded-full text-[10px] bg-slate-100 text-slate-600 border-0">
                        {automationLogs.data?.total ?? 0} entries
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-1.5 max-h-72 overflow-y-auto">
                    {automationLogs.isPending && (
                      <div className="text-xs text-slate-400 flex items-center gap-1.5">
                        <Loader2 className="h-3 w-3 animate-spin" /> Loading…
                      </div>
                    )}
                    {!automationLogs.isPending && (automationLogs.data?.data ?? []).length === 0 && (
                      <div className="text-xs text-slate-400">No automation events recorded yet.</div>
                    )}
                    {(automationLogs.data?.data ?? []).map((log) => {
                      const typeLabel: Record<string, string> = {
                        pattern_task: "Pattern → Task",
                        review_task: "Review → Follow-up",
                        voice_task: "Voice → Task",
                        oversight_task: "Oversight → Task",
                        alert_resolved: "Alert Resolved",
                        alert_reviewed: "Alert Reviewed",
                      };
                      const typeColor: Record<string, string> = {
                        pattern_task: "bg-violet-100 text-violet-700",
                        review_task: "bg-blue-100 text-blue-700",
                        voice_task: "bg-teal-100 text-teal-700",
                        oversight_task: "bg-amber-100 text-amber-700",
                        alert_resolved: "bg-emerald-100 text-emerald-700",
                        alert_reviewed: "bg-slate-100 text-slate-600",
                      };
                      const ts = new Date(log.created_at);
                      const timeStr = ts.toLocaleDateString("en-GB", { day: "2-digit", month: "short" }) +
                        " " + ts.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
                      return (
                        <div key={log.id} className="flex items-start gap-2.5 rounded-md border px-3 py-2 text-xs">
                          <Badge className={`rounded-full shrink-0 text-[9px] mt-0.5 border-0 ${typeColor[log.automation_type] ?? "bg-slate-100 text-slate-600"}`}>
                            {typeLabel[log.automation_type] ?? log.automation_type}
                          </Badge>
                          <div className="flex-1 min-w-0">
                            <div className="text-slate-800 font-medium leading-snug">{log.title}</div>
                            {log.metadata.decision_rationale && (
                              <div className="text-slate-400 mt-0.5 truncate">{log.metadata.decision_rationale}</div>
                            )}
                          </div>
                          <div className="text-slate-400 shrink-0 text-[10px] tabular-nums">{timeStr}</div>
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>

                <Button asChild variant="outline" className="w-full">
                  <Link href="/reports">Back to Reports</Link>
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </PageShell>
  );
}
