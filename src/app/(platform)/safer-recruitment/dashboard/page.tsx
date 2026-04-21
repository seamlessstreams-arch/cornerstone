"use client";

import Link from "next/link";
import { Loader2, AlertTriangle, Users, ClipboardCheck, FileCheck, ShieldAlert } from "lucide-react";
import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useRecruitment } from "@/hooks/use-recruitment";

const STAGE_LABELS: Record<string, string> = {
  enquiry: "Enquiry",
  application_received: "Application",
  sift: "Sift",
  interview_scheduled: "Interview Scheduled",
  interview_completed: "Interviewed",
  references_requested: "Refs Requested",
  references_received: "Refs Received",
  dbs_submitted: "DBS Submitted",
  dbs_received: "DBS Received",
  conditional_offer: "Conditional Offer",
  pre_start_checks: "Pre-Start",
  final_clearance: "Final Clearance",
  onboarding: "Onboarding",
  appointed: "Appointed",
  unsuccessful: "Unsuccessful",
  withdrawn: "Withdrawn",
};

const STAGE_COLORS: Record<string, string> = {
  appointed: "bg-emerald-100 text-emerald-800",
  final_clearance: "bg-emerald-100 text-emerald-700",
  conditional_offer: "bg-blue-100 text-blue-800",
  pre_start_checks: "bg-blue-100 text-blue-700",
  interview_completed: "bg-violet-100 text-violet-800",
  interview_scheduled: "bg-violet-100 text-violet-700",
  references_received: "bg-amber-100 text-amber-800",
  references_requested: "bg-amber-100 text-amber-700",
  dbs_submitted: "bg-amber-100 text-amber-700",
  dbs_received: "bg-amber-100 text-amber-800",
  sift: "bg-slate-100 text-slate-700",
  application_received: "bg-slate-100 text-slate-600",
  unsuccessful: "bg-red-100 text-red-700",
  withdrawn: "bg-red-100 text-red-600",
};

const RISK_COLORS: Record<string, string> = {
  low: "bg-emerald-100 text-emerald-700",
  medium: "bg-amber-100 text-amber-700",
  high: "bg-red-100 text-red-700",
  critical: "bg-red-200 text-red-900",
};

export default function SaferRecruitmentDashboard() {
  const { data, isPending } = useRecruitment();
  const candidates = data?.candidates ?? [];
  const vacancies = data?.vacancies ?? [];
  const alerts = data?.alerts ?? [];
  const stats = data?.stats;

  const activeCandidates = candidates.filter(
    (c) => c.stage !== "unsuccessful" && c.stage !== "withdrawn" && c.stage !== "appointed"
  );
  const dbsPending = candidates.filter((c) =>
    c.checks?.some(
      (ch) =>
        ch.check_type === "enhanced_dbs" &&
        (ch.status === "requested" || ch.status === "in_progress" || ch.status === "not_started")
    )
  ).length;

  return (
    <PageShell
      title="Safer Recruitment Dashboard"
      subtitle="Manage the recruitment pipeline and verify evidence compliance"
      quickCreateContext={{ module: "recruitment", defaultTaskCategory: "admin" }}
    >
      {isPending && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
        </div>
      )}
      {!isPending && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-5">
                <div className="text-xs text-slate-500 flex items-center gap-1.5">
                  <FileCheck className="h-3.5 w-3.5" />Active Vacancies
                </div>
                <div className="text-3xl font-bold text-blue-600 mt-1">
                  {vacancies.filter((v) => v.status === "active").length}
                </div>
                <div className="text-[11px] text-slate-400 mt-1">Open positions</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5">
                <div className="text-xs text-slate-500 flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5" />Candidates
                </div>
                <div className="text-3xl font-bold text-emerald-600 mt-1">{activeCandidates.length}</div>
                <div className="text-[11px] text-slate-400 mt-1">In pipeline</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5">
                <div className="text-xs text-slate-500 flex items-center gap-1.5">
                  <ShieldAlert className="h-3.5 w-3.5" />Compliance Alerts
                </div>
                <div className="text-3xl font-bold text-amber-600 mt-1">{alerts.length}</div>
                <div className="text-[11px] text-slate-400 mt-1">Requiring attention</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5">
                <div className="text-xs text-slate-500 flex items-center gap-1.5">
                  <ClipboardCheck className="h-3.5 w-3.5" />DBS Pending
                </div>
                <div className="text-3xl font-bold text-violet-600 mt-1">{dbsPending}</div>
                <div className="text-[11px] text-slate-400 mt-1">Awaiting results</div>
              </CardContent>
            </Card>
          </div>

          {alerts.length > 0 && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 space-y-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-amber-800">
                <AlertTriangle className="h-4 w-4" />Compliance Alerts
              </div>
              {alerts.map((alert, i) => (
                <div
                  key={i}
                  className="flex items-start justify-between gap-3 rounded-lg bg-white border border-amber-100 px-3 py-2 text-xs"
                >
                  <div>
                    <span className="font-medium text-slate-800">{alert.candidate_name}</span>
                    <span className="ml-2 text-slate-600">{alert.issue}</span>
                  </div>
                  <Badge
                    className={`rounded-full text-[10px] ${alert.severity === "critical" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}
                  >
                    {alert.severity}
                  </Badge>
                </div>
              ))}
            </div>
          )}

          <Card>
            <div className="flex items-center justify-between px-5 pt-5 pb-3">
              <div className="text-sm font-semibold text-slate-800">Candidates in Pipeline</div>
              <Link href="/recruitment/candidates">
                <Button size="sm" variant="outline">All Candidates</Button>
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-y">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600">Name</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600">Role Applied</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600">Stage</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600">Compliance</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600">Risk</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600">Days</th>
                    <th className="px-4 py-2" />
                  </tr>
                </thead>
                <tbody>
                  {activeCandidates.slice(0, 10).map((c) => (
                    <tr key={c.id} className="border-b hover:bg-slate-50">
                      <td className="px-4 py-2.5 font-medium text-slate-900">
                        {c.first_name} {c.last_name}
                      </td>
                      <td className="px-4 py-2.5 text-slate-600 text-xs">{c.role_applied}</td>
                      <td className="px-4 py-2.5">
                        <span
                          className={`px-2 py-0.5 text-[11px] rounded-full font-medium ${STAGE_COLORS[c.stage] ?? "bg-slate-100 text-slate-600"}`}
                        >
                          {STAGE_LABELS[c.stage] ?? c.stage}
                        </span>
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 rounded-full bg-slate-200">
                            <div
                              className={`h-1.5 rounded-full ${c.compliance_score >= 80 ? "bg-emerald-500" : c.compliance_score >= 50 ? "bg-amber-500" : "bg-red-500"}`}
                              style={{ width: `${c.compliance_score}%` }}
                            />
                          </div>
                          <span className="text-[11px] text-slate-500">{c.compliance_score}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-2.5">
                        <span
                          className={`px-2 py-0.5 text-[11px] rounded-full capitalize font-medium ${RISK_COLORS[c.risk_level] ?? "bg-slate-100 text-slate-600"}`}
                        >
                          {c.risk_level}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-[11px] text-slate-500">{c.days_total}d</td>
                      <td className="px-4 py-2.5">
                        <Link href={`/recruitment/candidates/${c.id}`}>
                          <Button size="sm" variant="ghost" className="h-7 text-xs">View</Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                  {activeCandidates.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-sm text-slate-400">
                        No active candidates in the pipeline.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            {stats && (
              <Card>
                <CardContent className="p-5 space-y-3">
                  <div className="text-sm font-semibold text-slate-800">Pipeline Summary</div>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="rounded-lg border p-3">
                      <div className="text-slate-500">Total Active</div>
                      <div className="text-xl font-bold text-slate-900">{stats.total_active}</div>
                    </div>
                    <div className="rounded-lg border p-3">
                      <div className="text-slate-500">Blocked</div>
                      <div className="text-xl font-bold text-red-700">{stats.blocked}</div>
                    </div>
                    <div className="rounded-lg border p-3">
                      <div className="text-slate-500">Exceptional Starts</div>
                      <div className="text-xl font-bold text-amber-700">{stats.exceptional_starts}</div>
                    </div>
                    <div className="rounded-lg border p-3">
                      <div className="text-slate-500">Avg Days to Appoint</div>
                      <div className="text-xl font-bold text-blue-700">{stats.avg_days_to_appoint}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
            <Card>
              <CardContent className="p-5 space-y-3">
                <div className="text-sm font-semibold text-slate-800">Compliance Reports</div>
                <div className="space-y-2">
                  {[
                    { href: "/safer-recruitment/evidence-register", label: "Evidence Register", sub: "All uploads & verifications" },
                    { href: "/recruitment/safer-recruitment/checks", label: "Checks & SCR", sub: "DBS, RTW, identity" },
                    { href: "/recruitment/safer-recruitment/references", label: "References", sub: "Reference tracking" },
                    { href: "/recruitment/safer-recruitment/dbs", label: "DBS Tracker", sub: "Enhanced DBS status" },
                    { href: "/recruitment/safer-recruitment/audit", label: "Audit Log", sub: "Full recruitment audit trail" },
                  ].map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="flex items-center justify-between rounded-lg border p-3 text-sm hover:bg-slate-50"
                    >
                      <span className="font-medium text-slate-800">{link.label}</span>
                      <span className="text-xs text-slate-500">{link.sub} →</span>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </PageShell>
  );
}
