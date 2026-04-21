"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  ArrowLeft, CheckCircle2, ClipboardCheck, AlertTriangle,
  Save, Calendar, User, TrendingUp, ListChecks, Zap,
} from "lucide-react";
import { cn, formatDate, todayStr } from "@/lib/utils";
import { useAudits, useUpdateAudit } from "@/hooks/use-audits";
import { useStaff } from "@/hooks/use-staff";
import type { Audit } from "@/types/extended";

// ─── Category-specific checklist templates ────────────────────────────────────

const CHECKLIST_TEMPLATES: Record<string, { label: string; weight: number }[]> = {
  medication: [
    { label: "MAR charts accurately completed for all young people", weight: 10 },
    { label: "Medication stored correctly — locked, temperature-controlled", weight: 10 },
    { label: "Controlled drugs log checked and balanced", weight: 10 },
    { label: "PRN protocols up to date and signed", weight: 10 },
    { label: "No medication expired or near-expiry", weight: 10 },
    { label: "Administration witnessed in line with policy", weight: 10 },
    { label: "Returns and disposal logged correctly", weight: 10 },
    { label: "Medication errors reported, reviewed, and actioned", weight: 10 },
    { label: "Competency records current for all administering staff", weight: 10 },
    { label: "GP communications filed and actioned", weight: 10 },
  ],
  health_safety: [
    { label: "Fire evacuation records up to date", weight: 10 },
    { label: "Risk assessments current and reviewed", weight: 10 },
    { label: "Equipment inspections completed", weight: 10 },
    { label: "COSHH register maintained", weight: 10 },
    { label: "First aid kits checked and stocked", weight: 10 },
    { label: "Accident/injury log reviewed", weight: 10 },
    { label: "Emergency contacts updated", weight: 10 },
    { label: "Building maintenance issues logged and actioned", weight: 10 },
    { label: "Gas and electrical safety certificates in date", weight: 10 },
    { label: "Staff trained in health and safety procedures", weight: 10 },
  ],
  care_records: [
    { label: "Care plans reviewed and updated within required timescale", weight: 10 },
    { label: "Daily logs completed consistently and meaningfully", weight: 10 },
    { label: "Risk assessments reflect current needs", weight: 10 },
    { label: "Young people's voice recorded in care plans", weight: 10 },
    { label: "Placement plans aligned with care plans", weight: 10 },
    { label: "Reviews and LAC records filed correctly", weight: 10 },
    { label: "Missing episodes recorded and notified", weight: 10 },
    { label: "Incident reports completed within timescale", weight: 10 },
    { label: "Behavioural charts/graphs maintained", weight: 10 },
    { label: "Keyworker sessions recorded", weight: 10 },
  ],
  safeguarding: [
    { label: "Safeguarding concerns logged and reported correctly", weight: 15 },
    { label: "Staff training records — safeguarding certificates in date", weight: 10 },
    { label: "Body maps completed where required", weight: 10 },
    { label: "Section 47 or CP conference notifications filed", weight: 15 },
    { label: "DBS checks current for all staff", weight: 15 },
    { label: "Safer recruitment files complete", weight: 10 },
    { label: "Children's views on safety recorded", weight: 10 },
    { label: "Allegations management procedure followed", weight: 15 },
  ],
  finance: [
    { label: "Petty cash balanced and reconciled", weight: 15 },
    { label: "Young person's pocket money log up to date", weight: 15 },
    { label: "Receipts filed for all expenditure", weight: 15 },
    { label: "No unauthorised expenditure", weight: 15 },
    { label: "Expense claims submitted and approved", weight: 15 },
    { label: "Financial risk assessment reviewed", weight: 10 },
    { label: "Budget monitoring report reviewed", weight: 15 },
  ],
  staffing: [
    { label: "Rota meets minimum staffing requirements", weight: 15 },
    { label: "Supervision records up to date for all staff", weight: 15 },
    { label: "Appraisal records current", weight: 10 },
    { label: "Training matrix reviewed — gaps actioned", weight: 15 },
    { label: "Return to work interviews completed", weight: 10 },
    { label: "Disciplinary and grievance records filed correctly", weight: 15 },
    { label: "Agency and bank staff induction completed", weight: 10 },
    { label: "Staff handover records complete", weight: 10 },
  ],
  environment: [
    { label: "Young people's bedrooms meet expected standard", weight: 15 },
    { label: "Communal areas clean, safe, and appropriately furnished", weight: 10 },
    { label: "Garden and outdoor spaces safe and maintained", weight: 10 },
    { label: "Notice boards current and information accessible", weight: 10 },
    { label: "Privacy and dignity promoted in physical environment", weight: 15 },
    { label: "Accessibility needs met for all residents", weight: 15 },
    { label: "Maintenance log reviewed and outstanding items actioned", weight: 15 },
    { label: "CCTV and security systems functional and legal", weight: 10 },
  ],
  general: [
    { label: "Ofsted registration and conditions reviewed", weight: 15 },
    { label: "Statement of purpose current and accurate", weight: 10 },
    { label: "All statutory notifications submitted on time", weight: 15 },
    { label: "Management oversight records maintained", weight: 15 },
    { label: "Complaints and compliments log reviewed", weight: 10 },
    { label: "External professional visit records filed", weight: 10 },
    { label: "Children's guide current and accessible", weight: 10 },
    { label: "Last Ofsted report recommendations progressed", weight: 15 },
  ],
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  scheduled:   { label: "Scheduled",   className: "bg-blue-100 text-blue-700" },
  in_progress: { label: "In Progress", className: "bg-amber-100 text-amber-700" },
  completed:   { label: "Completed",   className: "bg-emerald-100 text-emerald-700" },
};

function scoreColor(pct: number) {
  if (pct >= 90) return "text-emerald-600";
  if (pct >= 70) return "text-amber-600";
  return "text-red-600";
}

function progressColor(pct: number) {
  if (pct >= 90) return "bg-emerald-500";
  if (pct >= 70) return "bg-amber-500";
  return "bg-red-500";
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AuditDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const auditsQuery = useAudits();
  const audits: Audit[] = auditsQuery.data?.data ?? [];
  const audit = audits.find((a) => a.id === id);

  const staffQuery = useStaff();
  const staffList = staffQuery.data?.data ?? [];
  function staffName(uid: string | null) {
    if (!uid) return "Unassigned";
    const s = staffList.find((x) => x.id === uid);
    return s ? `${s.first_name} ${s.last_name}` : uid;
  }

  const updateAudit = useUpdateAudit();

  // ── Checklist state ──────────────────────────────────────────────────────────
  const checklist = CHECKLIST_TEMPLATES[audit?.category ?? "general"] ?? CHECKLIST_TEMPLATES.general;
  const [checked, setChecked] = useState<Record<number, boolean>>({});
  const [notes, setNotes] = useState("");
  const [managerNotes, setManagerNotes] = useState("");
  const [completedBy, setCompletedBy] = useState("");
  const [saveError, setSaveError] = useState("");

  // Compute score from checklist
  const totalWeight = checklist.reduce((s, c) => s + c.weight, 0);
  const checkedWeight = checklist.reduce((s, c, i) => s + (checked[i] ? c.weight : 0), 0);
  const livePct = totalWeight > 0 ? Math.round((checkedWeight / totalWeight) * 100) : 0;
  const completedItems = Object.values(checked).filter(Boolean).length;
  const findings = checklist.length - completedItems;

  function toggleItem(i: number) {
    setChecked((prev) => ({ ...prev, [i]: !prev[i] }));
  }

  function handleCompleteAudit() {
    if (!completedBy.trim()) { setSaveError("Please select who completed this audit."); return; }
    if (!audit) return;
    setSaveError("");
    updateAudit.mutate({
      id: audit.id,
      data: {
        status: "completed",
        score: livePct,
        max_score: 100,
        findings,
        completed_by: completedBy,
      },
    }, {
      onSuccess: () => router.push("/audits"),
    });
  }

  // ── Loading / not found ──────────────────────────────────────────────────────

  if (auditsQuery.isLoading) {
    return (
      <PageShell title="Audit" subtitle="Loading…">
        <div className="flex items-center justify-center py-24 text-slate-400 text-sm">Loading audit…</div>
      </PageShell>
    );
  }

  if (!audit) {
    return (
      <PageShell title="Audit Not Found" subtitle="This record could not be located.">
        <div className="max-w-lg mx-auto py-16 text-center">
          <AlertTriangle className="w-10 h-10 text-amber-400 mx-auto mb-4" />
          <p className="text-slate-600 text-sm mb-6">This audit record could not be found. It may have been deleted or you followed an incorrect link.</p>
          <Link href="/audits"><Button variant="outline"><ArrowLeft className="w-4 h-4 mr-2" />Back to Audits</Button></Link>
        </div>
      </PageShell>
    );
  }

  const scorePct = audit.status === "completed" ? audit.score : livePct;
  const statusConf = STATUS_CONFIG[audit.status] ?? STATUS_CONFIG.scheduled;

  // ── Completed view ───────────────────────────────────────────────────────────
  if (audit.status === "completed") {
    return (
      <PageShell
        title={audit.title}
        subtitle={`${audit.category.replace(/_/g, " ")} audit · ${formatDate(audit.date)}`}
      >
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Back */}
          <Link href="/audits">
            <Button variant="ghost" size="sm" className="text-slate-500 hover:text-slate-800 -ml-1 mb-2">
              <ArrowLeft className="w-4 h-4 mr-1" /> All Audits
            </Button>
          </Link>

          {/* Summary card */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="text-3xl font-bold tracking-tight">
                    <span className={scoreColor(scorePct)}>{scorePct}%</span>
                    <span className="text-base font-normal text-slate-400 ml-2">({audit.score}/{audit.max_score})</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-slate-500">
                    <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{formatDate(audit.date)}</span>
                    {audit.completed_by && (
                      <span className="flex items-center gap-1"><User className="w-3.5 h-3.5" />{staffName(audit.completed_by)}</span>
                    )}
                  </div>
                </div>
                <Badge className={cn("text-xs rounded-full px-3 py-1", statusConf.className)}>
                  {statusConf.label}
                </Badge>
              </div>
              <div className="mt-4">
                <Progress value={scorePct} color={progressColor(scorePct)} className="h-2 rounded-full" />
              </div>
              <div className="mt-4 grid grid-cols-3 gap-4 text-center">
                <div className="p-3 rounded-xl bg-slate-50">
                  <div className="text-xl font-bold text-slate-800">{checklist.length - audit.findings}</div>
                  <div className="text-xs text-slate-500 mt-0.5">Passed</div>
                </div>
                <div className="p-3 rounded-xl bg-amber-50">
                  <div className="text-xl font-bold text-amber-700">{audit.findings}</div>
                  <div className="text-xs text-amber-600 mt-0.5">Findings</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-50">
                  <div className="text-xl font-bold text-slate-800">{audit.actions}</div>
                  <div className="text-xs text-slate-500 mt-0.5">Actions</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Outcome banner */}
          <div className={cn(
            "rounded-xl border px-5 py-4 flex items-center gap-3",
            scorePct >= 90 ? "bg-emerald-50 border-emerald-200" :
              scorePct >= 70 ? "bg-amber-50 border-amber-200" :
                "bg-red-50 border-red-200"
          )}>
            {scorePct >= 90
              ? <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              : <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />}
            <div>
              <div className={cn("text-sm font-semibold",
                scorePct >= 90 ? "text-emerald-800" : scorePct >= 70 ? "text-amber-800" : "text-red-800"
              )}>
                {scorePct >= 90 ? "Good — standards met" : scorePct >= 70 ? "Requires improvement — actions needed" : "Inadequate — urgent action required"}
              </div>
              <div className="text-xs text-slate-500 mt-0.5">
                {audit.findings === 0
                  ? "No findings identified. All checklist items passed."
                  : `${audit.findings} finding${audit.findings !== 1 ? "s" : ""} identified. Actions should be recorded and tracked.`}
              </div>
            </div>
          </div>

          {/* Checklist items — shown as informational when completed */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <ListChecks className="w-4 h-4 text-slate-500" /> Audit Checklist
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-slate-400 mb-4">
                Checklist items are shown for reference. Results were recorded at time of completion.
              </p>
              <div className="space-y-2">
                {checklist.map((item, i) => (
                  <div key={i} className="flex items-center gap-3 py-2 px-3 rounded-lg bg-slate-50 text-sm text-slate-700">
                    <CheckCircle2 className="w-4 h-4 text-slate-300 shrink-0" />
                    {item.label}
                    <span className="ml-auto text-xs text-slate-400">{item.weight}pts</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </PageShell>
    );
  }

  // ── In-progress / scheduled view — audit completion form ────────────────────
  return (
    <PageShell
      title={audit.title}
      subtitle={`${audit.category.replace(/_/g, " ")} audit · ${audit.status === "in_progress" ? "In progress" : "Scheduled"} · ${formatDate(audit.date)}`}
    >
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Back */}
        <Link href="/audits">
          <Button variant="ghost" size="sm" className="text-slate-500 hover:text-slate-800 -ml-1 mb-2">
            <ArrowLeft className="w-4 h-4 mr-1" /> All Audits
          </Button>
        </Link>

        {/* Live score header */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-3xl font-bold tracking-tight">
                  <span className={scoreColor(livePct)}>{livePct}%</span>
                  <span className="text-base font-normal text-slate-400 ml-2">({completedItems}/{checklist.length} items)</span>
                </div>
                <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5" /> Live score — updates as you complete the checklist
                </div>
              </div>
              <Badge className={cn("text-xs rounded-full px-3 py-1", statusConf.className)}>
                {statusConf.label}
              </Badge>
            </div>
            <div className="mt-4">
              <Progress value={livePct} color={progressColor(livePct)} className="h-2 rounded-full" />
            </div>
          </CardContent>
        </Card>

        {/* Checklist */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <ClipboardCheck className="w-4 h-4 text-slate-500" /> Checklist
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {checklist.map((item, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => toggleItem(i)}
                  className={cn(
                    "w-full flex items-center gap-3 py-3 px-4 rounded-xl border text-sm transition-all cursor-pointer text-left",
                    checked[i]
                      ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                      : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                  )}
                >
                  <div className={cn(
                    "w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all",
                    checked[i] ? "border-emerald-500 bg-emerald-500" : "border-slate-300"
                  )}>
                    {checked[i] && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                  </div>
                  <span className="flex-1">{item.label}</span>
                  <span className="text-xs text-slate-400">{item.weight}pts</span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Findings & notes */}
        {findings > 0 && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-4">
            <div className="flex items-center gap-2 text-amber-800 font-semibold text-sm mb-1">
              <AlertTriangle className="w-4 h-4" />
              {findings} finding{findings !== 1 ? "s" : ""} identified
            </div>
            <p className="text-xs text-amber-700">
              Items not checked will be recorded as findings. Actions should be created in the relevant module.
            </p>
          </div>
        )}

        {/* Completion form */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Zap className="w-4 h-4 text-slate-500" /> Complete Audit
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Completed by <span className="text-red-500">*</span></label>
              <select
                value={completedBy}
                onChange={(e) => { setCompletedBy(e.target.value); setSaveError(""); }}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-400"
              >
                <option value="">Select staff member…</option>
                {staffList.map((s) => (
                  <option key={s.id} value={s.id}>{s.first_name} {s.last_name} — {s.role}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Audit notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Summary of audit, key observations, context for findings…"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 resize-none focus:outline-none focus:ring-2 focus:ring-slate-400 placeholder:text-slate-400"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Manager notes</label>
              <textarea
                value={managerNotes}
                onChange={(e) => setManagerNotes(e.target.value)}
                rows={2}
                placeholder="Manager oversight commentary, challenge, or approval rationale…"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 resize-none focus:outline-none focus:ring-2 focus:ring-slate-400 placeholder:text-slate-400"
              />
            </div>

            {saveError && (
              <p className="text-xs text-red-600 font-medium">{saveError}</p>
            )}

            <div className="flex items-center gap-3 pt-1">
              <Button
                onClick={handleCompleteAudit}
                disabled={updateAudit.isPending}
                className="flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                {updateAudit.isPending ? "Saving…" : `Complete Audit (${livePct}%)`}
              </Button>
              <Link href="/audits">
                <Button variant="outline">Cancel</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}
