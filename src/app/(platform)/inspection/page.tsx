"use client";
import React from "react";
import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Award, Calendar, CheckCircle2, AlertTriangle, FileText,
  Star, Clock, Download, TrendingUp, Shield,
} from "lucide-react";
import { HOME } from "@/lib/seed-data";
import { useHealthCheck } from "@/hooks/use-dashboard";
import { cn, formatDate, daysFromNow } from "@/lib/utils";

const INSPECTION_HISTORY = [
  { date: "2025-10-15", type: "Full inspection", grade: "Good", inspector: "Jane Whitfield", reportUrl: "#", actions: 2, actionsComplete: 2 },
  { date: "2024-04-22", type: "Full inspection", grade: "Good", inspector: "Mark Tanner", reportUrl: "#", actions: 1, actionsComplete: 1 },
  { date: "2023-11-08", type: "Short notice", grade: "Requires improvement", inspector: "Susan Blake", reportUrl: "#", actions: 5, actionsComplete: 5 },
];

const GRADE_COLORS: Record<string, string> = {
  "Outstanding": "bg-emerald-100 text-emerald-700 border-emerald-200",
  "Good": "bg-blue-100 text-blue-700 border-blue-200",
  "Requires improvement": "bg-amber-100 text-amber-700 border-amber-200",
  "Inadequate": "bg-red-100 text-red-700 border-red-200",
};

// Static fallback shown until health-check loads
const READINESS_AREAS_FALLBACK = [
  { area: "Outcomes for young people", score: 88, status: "good" },
  { area: "How well YP are helped & protected", score: 92, status: "good" },
  { area: "Leadership & management", score: 85, status: "good" },
  { area: "Training compliance", score: 76, status: "warn" },
  { area: "Supervision compliance", score: 83, status: "warn" },
  { area: "Record keeping", score: 91, status: "good" },
  { area: "Staffing & rotas", score: 89, status: "good" },
  { area: "Policies current & signed", score: 72, status: "warn" },
];

export default function InspectionPage() {
  const hcQuery = useHealthCheck();
  const hc = hcQuery.data?.data;

  const readinessAreas = hc
    ? [
        { area: "Outcomes for young people",           score: hc.overall,        status: hc.overall >= 85 ? "good" : "warn" },
        { area: "How well YP are helped & protected",  score: hc.safeguarding,   status: hc.safeguarding >= 85 ? "good" : "warn" },
        { area: "Leadership & management",             score: hc.staffing,       status: hc.staffing >= 85 ? "good" : "warn" },
        { area: "Training compliance",                 score: hc.compliance,     status: hc.compliance >= 85 ? "good" : "warn" },
        { area: "Supervision compliance",              score: hc.staffing,       status: hc.staffing >= 85 ? "good" : "warn" },
        { area: "Record keeping",                      score: hc.operational,    status: hc.operational >= 85 ? "good" : "warn" },
        { area: "Staffing & rotas",                    score: hc.staffing,       status: hc.staffing >= 85 ? "good" : "warn" },
        { area: "Policies current & signed",           score: hc.compliance,     status: hc.compliance >= 85 ? "good" : "warn" },
      ]
    : READINESS_AREAS_FALLBACK;

  const nextInspectionEstimate = daysFromNow(180);
  const avgReadiness = Math.round(readinessAreas.reduce((a, r) => a + r.score, 0) / readinessAreas.length);
  const warnings = readinessAreas.filter((r) => r.status === "warn").length;

  return (
    <PageShell
      title="Inspection Readiness"
      subtitle="Ofsted inspection tracker, readiness scoring, and evidence preparation"
      quickCreateContext={{ module: "inspection", defaultTaskCategory: "inspection", defaultFormType: "review_meeting_notes" }}
      actions={
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled
            title="Evidence packs are compiled from the Documents section. Visit Documents to prepare your pack."
          >
            <Download className="h-3.5 w-3.5 mr-1" />Evidence Pack
          </Button>
          <Button
            size="sm"
            disabled
            title="Inspection preparation checklists are available in the Audits section."
          >
            Prepare for Inspection
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Current grade & next inspection */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5 col-span-2 lg:col-span-1">
            <div className="text-[11px] font-semibold text-blue-500 uppercase tracking-wider mb-1">Current Ofsted Grade</div>
            <div className="text-4xl font-black text-blue-700">{HOME.last_inspection_grade}</div>
            <div className="text-xs text-blue-500 mt-1">{HOME.last_inspection_date}</div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Readiness Score</div>
            <div className={cn("mt-1 text-3xl font-bold", avgReadiness >= 85 ? "text-emerald-600" : avgReadiness >= 70 ? "text-amber-600" : "text-red-600")}>
              {avgReadiness}%
            </div>
            <div className="text-xs text-slate-400 mt-0.5">{warnings} areas need attention</div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Est. Next Inspection</div>
            <div className="mt-1 text-2xl font-bold text-slate-900">{formatDate(nextInspectionEstimate)}</div>
            <div className="text-xs text-slate-400 mt-0.5">±3 months (rolling)</div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Reg 44 Visits</div>
            <div className="mt-1 text-3xl font-bold text-violet-600">3</div>
            <div className="text-xs text-slate-400 mt-0.5">This year</div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Readiness breakdown */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-blue-500" />Inspection Readiness
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {readinessAreas.map(({ area, score, status }) => (
                  <div key={area} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className={cn("text-slate-700", status === "warn" ? "text-amber-700 font-medium" : "")}>{area}</span>
                      <span className={cn("font-semibold", score >= 85 ? "text-emerald-600" : score >= 70 ? "text-amber-600" : "text-red-600")}>{score}%</span>
                    </div>
                    <Progress
                      value={score}
                      color={score >= 85 ? "bg-emerald-500" : score >= 70 ? "bg-amber-500" : "bg-red-500"}
                      className="h-1.5"
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Inspection history */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Award className="h-4 w-4 text-amber-500" />Inspection History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {INSPECTION_HISTORY.map((insp) => (
                  <div key={insp.date} className="rounded-xl border border-slate-200 p-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-slate-900">{insp.type}</span>
                      <Badge className={cn("text-[9px] rounded-full border", GRADE_COLORS[insp.grade] || "bg-slate-100")}>
                        {insp.grade}
                      </Badge>
                    </div>
                    <div className="text-xs text-slate-500">{formatDate(insp.date)} · {insp.inspector}</div>
                    <div className="text-xs text-slate-600">{insp.actionsComplete}/{insp.actions} actions completed</div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs"
                      disabled
                      title="Inspection reports are stored in the Documents section."
                    >
                      <FileText className="h-3 w-3 mr-1" />View report
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageShell>
  );
}
