"use client";
import React, { useState } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  ClipboardCheck, Plus, CheckCircle2, AlertTriangle,
  Calendar, Download, X,
} from "lucide-react";
import { cn, formatDate, daysFromNow, todayStr } from "@/lib/utils";
import { useAudits, useCreateAudit, useUpdateAudit } from "@/hooks/use-audits";
import type { Audit } from "@/types/extended";

const AUDIT_CATEGORIES = [
  { value: "medication", label: "Medication" },
  { value: "health_safety", label: "Health & Safety" },
  { value: "care_records", label: "Care Records" },
  { value: "finance", label: "Finance" },
  { value: "safeguarding", label: "Safeguarding" },
  { value: "staffing", label: "Staffing" },
  { value: "environment", label: "Environment" },
  { value: "general", label: "General" },
];

const EMPTY_AUDIT_FORM = {
  title: "", category: "general", date: "",
};

export default function AuditsPage() {
  const auditsQuery = useAudits();
  const audits: Audit[] = auditsQuery.data?.data ?? [];
  const createAudit = useCreateAudit();
  const updateAudit = useUpdateAudit();

  const [filter, setFilter] = useState<"all" | "completed" | "scheduled" | "in_progress">("all");
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState(EMPTY_AUDIT_FORM);
  const [formError, setFormError] = useState("");

  const filtered = audits.filter((a) => filter === "all" ? true : a.status === filter);

  function handleStart(id: string) {
    updateAudit.mutate({ id, data: { status: "in_progress", date: todayStr() } });
  }

  function handleCreateAudit() {
    if (!form.title.trim()) { setFormError("Title is required."); return; }
    setFormError("");
    createAudit.mutate(
      {
        title: form.title.trim(),
        category: form.category,
        date: form.date || daysFromNow(7),
        completed_by: null,
        score: 0,
        max_score: 100,
        status: "scheduled",
        findings: 0,
        actions: 0,
      },
      {
        onSuccess: () => {
          setShowNew(false);
          setForm(EMPTY_AUDIT_FORM);
        },
      }
    );
  }

  const completedAudits = audits.filter((a) => a.status === "completed");
  const avgScore = completedAudits.length
    ? Math.round(completedAudits.reduce((a, au) => a + au.score, 0) / completedAudits.length)
    : 0;

  return (
    <>
      <PageShell
        title="Audits & Quality Assurance"
        subtitle="Internal audits, quality checks, and action tracking"
        quickCreateContext={{ module: "audits", defaultTaskCategory: "compliance", defaultFormType: "health_safety_check" }}
        actions={
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled
              title="Audit export requires the reporting integration to be configured."
            >
              <Download className="h-3.5 w-3.5 mr-1" />Export
            </Button>
            <Button size="sm" onClick={() => setShowNew(true)}>
              <Plus className="h-3.5 w-3.5 mr-1" />New Audit
            </Button>
          </div>
        }
      >
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label: "Audits Completed", value: completedAudits.length, icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50" },
              { label: "Scheduled", value: audits.filter((a) => a.status === "scheduled").length, icon: Calendar, color: "text-blue-600", bg: "bg-blue-50" },
              { label: "Open Actions", value: audits.reduce((a, au) => a + au.actions, 0), icon: AlertTriangle, color: "text-amber-600", bg: "bg-amber-50" },
              { label: "Avg Score", value: `${avgScore}%`, icon: ClipboardCheck, color: "text-violet-600", bg: "bg-violet-50" },
            ].map(({ label, value, icon: Icon, color, bg }) => (
              <div key={label} className="rounded-2xl border border-slate-200 bg-white p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">{label}</div>
                    <div className={cn("mt-1 text-3xl font-bold", color)}>{value}</div>
                  </div>
                  <div className={cn("rounded-2xl p-3", bg)}><Icon className={cn("h-5 w-5", color)} /></div>
                </div>
              </div>
            ))}
          </div>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <CardTitle className="flex-1">Audit Schedule</CardTitle>
                <div className="flex gap-1">
                  {(["all", "completed", "in_progress", "scheduled"] as const).map((f) => (
                    <button
                      key={f}
                      onClick={() => setFilter(f)}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-xs font-medium capitalize",
                        filter === f ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      )}
                    >
                      {f.replace(/_/g, " ")}
                    </button>
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {auditsQuery.isLoading ? (
                <div className="py-8 text-center text-sm text-slate-400">Loading audits…</div>
              ) : (
                <div className="space-y-3">
                  {filtered.map((audit) => (
                    <div key={audit.id} className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 hover:shadow-sm transition-all">
                      <div className={cn(
                        "h-10 w-10 rounded-xl flex items-center justify-center shrink-0",
                        audit.status === "completed" ? "bg-emerald-100"
                          : audit.status === "in_progress" ? "bg-amber-100"
                          : "bg-blue-100"
                      )}>
                        <ClipboardCheck className={cn(
                          "h-5 w-5",
                          audit.status === "completed" ? "text-emerald-600"
                            : audit.status === "in_progress" ? "text-amber-600"
                            : "text-blue-600"
                        )} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-slate-900">{audit.title}</div>
                        <div className="text-xs text-slate-500">
                          {formatDate(audit.date)}{" "}
                          {audit.status === "completed" ? "· Completed" : audit.status === "in_progress" ? "· In progress" : "· Scheduled"}
                        </div>
                        {audit.status === "completed" && (
                          <div className="mt-2">
                            <Progress
                              value={audit.score}
                              color={audit.score >= 90 ? "bg-emerald-500" : audit.score >= 70 ? "bg-amber-500" : "bg-red-500"}
                              className="h-1.5"
                            />
                            <div className="text-[10px] text-slate-400 mt-1">
                              {audit.score}/{audit.max_score} — {audit.findings} finding{audit.findings !== 1 ? "s" : ""}
                            </div>
                          </div>
                        )}
                      </div>
                      <Badge className={cn(
                        "text-[10px] rounded-full shrink-0",
                        audit.status === "completed" ? "bg-emerald-100 text-emerald-700"
                          : audit.status === "in_progress" ? "bg-amber-100 text-amber-700"
                          : "bg-blue-100 text-blue-700"
                      )}>
                        {audit.status.replace(/_/g, " ")}
                      </Badge>
                      {audit.status === "completed" && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 text-xs shrink-0"
                          disabled
                          title="Audit detail view is coming soon."
                        >
                          View
                        </Button>
                      )}
                      {audit.status === "scheduled" && (
                        <Button
                          size="sm"
                          className="h-8 text-xs shrink-0"
                          onClick={() => handleStart(audit.id)}
                          disabled={updateAudit.isPending}
                        >
                          Start
                        </Button>
                      )}
                      {audit.status === "in_progress" && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 text-xs shrink-0"
                          disabled
                          title="Complete the audit form on paper and record the result."
                        >
                          In progress
                        </Button>
                      )}
                    </div>
                  ))}
                  {filtered.length === 0 && (
                    <div className="py-8 text-center text-sm text-slate-400">No audits in this view.</div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </PageShell>

      {/* New Audit Modal */}
      {showNew && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
          onClick={() => setShowNew(false)}
        >
          <div
            className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-bold text-slate-900">Schedule New Audit</span>
              <button onClick={() => setShowNew(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1.5">
                  Audit title <span className="text-red-500">*</span>
                </label>
                <Input
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="e.g. Monthly medication audit"
                  className="text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1.5">Category</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-400"
                >
                  {AUDIT_CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1.5">Scheduled date</label>
                <Input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                  className="text-sm"
                />
              </div>
              {formError && <p className="text-xs text-red-600 font-medium">{formError}</p>}
            </div>
            <div className="mt-4 flex gap-3">
              <Button
                className="flex-1"
                onClick={handleCreateAudit}
                disabled={createAudit.isPending}
              >
                <Plus className="h-4 w-4 mr-1" />Schedule Audit
              </Button>
              <Button variant="outline" onClick={() => setShowNew(false)}>Cancel</Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
