"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — STAFF PROFILE PAGE
// Full staff profile: overview, training, supervision history, leave,
// incidents, and documents — all live data from the in-memory store.
// ══════════════════════════════════════════════════════════════════════════════

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { PageShell } from "@/components/layout/page-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import {
  ArrowLeft, Mail, Phone, Calendar, Clock, GraduationCap,
  AlertTriangle, CheckCircle2, Loader2, AlertCircle,
  Shield, Users, FileText, MessageSquare, CalendarOff,
  TrendingUp, Award, Pencil, Building2, Briefcase,
  ChevronRight, ExternalLink, XCircle, ClipboardList,
} from "lucide-react";
import { useStaff } from "@/hooks/use-staff";
import { useTraining } from "@/hooks/use-training";
import { useSupervisions } from "@/hooks/use-supervision";
import { useIncidents } from "@/hooks/use-incidents";
import { useLeave } from "@/hooks/use-leave";
import { cn, formatDate, todayStr, daysFromNow } from "@/lib/utils";
import { ROLE_LABELS } from "@/lib/constants";
import type { TrainingRecord, Supervision, Incident, LeaveRequest } from "@/types";

// ── Types ─────────────────────────────────────────────────────────────────────

type ProfileTab = "overview" | "training" | "supervision" | "incidents" | "leave";

// ── Design helpers ────────────────────────────────────────────────────────────

const TRAINING_STATUS_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  compliant:     { label: "Compliant",     bg: "bg-emerald-100", text: "text-emerald-700" },
  expiring_soon: { label: "Expiring Soon", bg: "bg-amber-100",   text: "text-amber-700"   },
  expired:       { label: "Expired",       bg: "bg-red-100",     text: "text-red-700"     },
  not_started:   { label: "Not Started",   bg: "bg-slate-100",   text: "text-slate-600"   },
};

// Map TrainingRecord.status (ComplianceStatus) to training status config key
function trainingStatusKey(status: string): string {
  if (status === "compliant") return "compliant";
  if (status === "expiring_soon") return "expiring_soon";
  if (status === "expired") return "expired";
  return "not_started";
}

const LEAVE_STATUS_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  pending:  { label: "Pending",  bg: "bg-amber-100",   text: "text-amber-700"   },
  approved: { label: "Approved", bg: "bg-emerald-100", text: "text-emerald-700" },
  rejected: { label: "Rejected", bg: "bg-red-100",     text: "text-red-700"     },
};

const LEAVE_TYPE_LABELS: Record<string, string> = {
  annual:     "Annual Leave",
  sick:       "Sick Leave",
  toil:       "TOIL",
  maternity:  "Maternity",
  paternity:  "Paternity",
  compassionate: "Compassionate",
  other:      "Other",
};

const INCIDENT_SEVERITY_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  critical: { label: "Critical", bg: "bg-red-100",    text: "text-red-700"    },
  high:     { label: "High",     bg: "bg-orange-100", text: "text-orange-700" },
  medium:   { label: "Medium",   bg: "bg-amber-100",  text: "text-amber-700"  },
  low:      { label: "Low",      bg: "bg-slate-100",  text: "text-slate-600"  },
};

// ── Stat Card ─────────────────────────────────────────────────────────────────

function StatCard({
  label, value, icon: Icon, alert = false, positive = false,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  alert?: boolean;
  positive?: boolean;
}) {
  return (
    <div className={cn(
      "rounded-2xl border bg-white p-4 flex items-center gap-3",
      alert ? "border-red-200 bg-red-50" : positive ? "border-emerald-200 bg-emerald-50" : ""
    )}>
      <div className={cn(
        "rounded-xl p-2.5 shrink-0",
        alert ? "bg-red-100" : positive ? "bg-emerald-100" : "bg-slate-100"
      )}>
        <Icon className={cn("h-5 w-5", alert ? "text-red-600" : positive ? "text-emerald-600" : "text-slate-600")} />
      </div>
      <div>
        <div className={cn("text-xl font-bold", alert ? "text-red-700" : positive ? "text-emerald-700" : "text-slate-900")}>
          {value}
        </div>
        <div className="text-xs text-slate-500">{label}</div>
      </div>
    </div>
  );
}

// ── Training Tab ──────────────────────────────────────────────────────────────

function TrainingTab({ staffId }: { staffId: string }) {
  const trainingQuery = useTraining({ staff_id: staffId });
  const records: TrainingRecord[] = trainingQuery.data?.data ?? [];
  const meta = trainingQuery.data?.meta;

  if (trainingQuery.isLoading) {
    return <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-slate-400" /></div>;
  }

  const byStatus = {
    expired:       records.filter((r) => r.status === "expired"),
    expiring_soon: records.filter((r) => r.status === "expiring_soon"),
    not_started:   records.filter((r) => r.status === "not_started"),
    compliant:     records.filter((r) => r.status === "compliant"),
  };

  return (
    <div className="space-y-5">
      {/* Meta stats */}
      {meta && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-2xl border bg-white p-4 text-center">
            <div className="text-2xl font-bold text-emerald-600">{meta.compliant}</div>
            <div className="text-xs text-slate-500 mt-0.5">Compliant</div>
          </div>
          <div className="rounded-2xl border bg-white p-4 text-center">
            <div className={cn("text-2xl font-bold", meta.expiring > 0 ? "text-amber-600" : "text-slate-400")}>{meta.expiring}</div>
            <div className="text-xs text-slate-500 mt-0.5">Expiring Soon</div>
          </div>
          <div className="rounded-2xl border bg-white p-4 text-center">
            <div className={cn("text-2xl font-bold", meta.expired > 0 ? "text-red-600" : "text-slate-400")}>{meta.expired}</div>
            <div className="text-xs text-slate-500 mt-0.5">Expired</div>
          </div>
          <div className="rounded-2xl border bg-white p-4 text-center">
            <div className="text-2xl font-bold text-slate-900">{meta.rate}%</div>
            <div className="text-xs text-slate-500 mt-0.5">Compliance Rate</div>
          </div>
        </div>
      )}

      {/* Compliance bar */}
      {meta && (
        <div className="rounded-2xl border bg-white p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-slate-700">Training Compliance</span>
            <span className="text-sm font-bold text-slate-900">{meta.rate}%</span>
          </div>
          <Progress value={meta.rate} className="h-2.5" />
        </div>
      )}

      {/* Problem items first */}
      {[...byStatus.expired, ...byStatus.expiring_soon, ...byStatus.not_started].map((r) => {
        const cfg = TRAINING_STATUS_CONFIG[trainingStatusKey(r.status)];
        return (
          <div key={r.id} className="rounded-2xl border border-l-4 border-l-red-300 bg-white p-4 flex items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium text-sm text-slate-900">{r.course_name}</span>
                {r.is_mandatory && <span className="text-[10px] bg-slate-900 text-white rounded-full px-2 py-0.5">Mandatory</span>}
                <span className={cn("text-xs rounded-full px-2.5 py-0.5 font-medium", cfg.bg, cfg.text)}>{cfg.label}</span>
              </div>
              <div className="flex items-center gap-4 mt-1.5 text-xs text-slate-500">
                {r.completed_date && <span>Completed: {formatDate(r.completed_date)}</span>}
                {r.expiry_date && (
                  <span className={r.status === "expired" ? "text-red-600 font-medium" : "text-amber-600 font-medium"}>
                    Expires: {formatDate(r.expiry_date)}
                  </span>
                )}
                <span>{r.category}</span>
              </div>
            </div>
{false && (
              <Button size="sm" variant="outline" className="shrink-0" disabled>
                <ExternalLink className="h-3.5 w-3.5 mr-1" />Launch
              </Button>
            )}
          </div>
        );
      })}

      {/* Compliant items */}
      <div className="space-y-2">
        {byStatus.compliant.map((r) => {
          const cfg = TRAINING_STATUS_CONFIG[trainingStatusKey(r.status)];
          return (
            <div key={r.id} className="rounded-xl border bg-white px-4 py-3 flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                  <span className="text-sm text-slate-800 truncate">{r.course_name}</span>
                  {r.is_mandatory && <span className="text-[10px] bg-slate-200 text-slate-600 rounded-full px-2 py-0.5">Mandatory</span>}
                </div>
                <div className="ml-5 text-xs text-slate-400 mt-0.5">
                  {r.completed_date && <>Completed {formatDate(r.completed_date)}</>}
                  {r.expiry_date && <> · Expires {formatDate(r.expiry_date)}</>}
                </div>
              </div>
              <span className={cn("text-xs rounded-full px-2.5 py-0.5 font-medium shrink-0", cfg.bg, cfg.text)}>{cfg.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Supervision Tab ───────────────────────────────────────────────────────────

function SupervisionTab({ staffId }: { staffId: string }) {
  const supervisionsQuery = useSupervisions({ staff_id: staffId });
  const records: Supervision[] = supervisionsQuery.data?.data ?? [];

  if (supervisionsQuery.isLoading) {
    return <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-slate-400" /></div>;
  }

  if (records.length === 0) {
    return (
      <div className="rounded-2xl border bg-white p-12 text-center">
        <MessageSquare className="h-10 w-10 text-slate-300 mx-auto mb-3" />
        <p className="text-sm font-medium text-slate-600">No supervision records found</p>
        <p className="text-xs text-slate-400 mt-1">Records will appear here once supervision sessions are logged</p>
        <Link href="/supervision">
          <Button variant="outline" size="sm" className="mt-4">Go to Supervision</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {records.map((s) => (
        <div key={s.id} className="rounded-2xl border bg-white p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-sm text-slate-900">{formatDate(s.actual_date ?? s.scheduled_date)}</span>
                <span className="text-xs text-slate-400">·</span>
                <span className="text-xs text-slate-600 capitalize">{s.type?.replace(/_/g, " ")}</span>
                {s.wellbeing_score !== undefined && s.wellbeing_score !== null && (
                  <span className={cn(
                    "text-xs rounded-full px-2 py-0.5",
                    s.wellbeing_score >= 7 ? "bg-emerald-100 text-emerald-700" :
                    s.wellbeing_score >= 4 ? "bg-amber-100 text-amber-700" :
                    "bg-red-100 text-red-700"
                  )}>Wellbeing {s.wellbeing_score}/10</span>
                )}
              </div>
              {s.discussion_points && (
                <p className="text-xs text-slate-500 mt-2 line-clamp-2">{s.discussion_points}</p>
              )}
              {s.actions_agreed && Array.isArray(s.actions_agreed) && s.actions_agreed.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {s.actions_agreed.slice(0, 3).map((a, i) => (
                    <span key={i} className="text-[10px] bg-slate-100 text-slate-600 rounded-md px-2 py-0.5">{a.description}</span>
                  ))}
                  {s.actions_agreed.length > 3 && (
                    <span className="text-[10px] text-slate-400">+{s.actions_agreed.length - 3} more</span>
                  )}
                </div>
              )}
            </div>
            {s.staff_signature && s.supervisor_signature ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
            ) : (
              <Clock className="h-5 w-5 text-amber-500 shrink-0" />
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Incidents Tab ─────────────────────────────────────────────────────────────

function IncidentsTab({ staffId }: { staffId: string }) {
  const incidentsQuery = useIncidents();
  const incidents: Incident[] = useMemo(
    () => (incidentsQuery.data?.data ?? []).filter(
      (i) => i.reported_by === staffId || i.witnesses?.includes(staffId)
    ),
    [incidentsQuery.data, staffId]
  );

  if (incidentsQuery.isLoading) {
    return <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-slate-400" /></div>;
  }

  if (incidents.length === 0) {
    return (
      <div className="rounded-2xl border bg-white p-12 text-center">
        <Shield className="h-10 w-10 text-slate-300 mx-auto mb-3" />
        <p className="text-sm font-medium text-slate-600">No incidents found</p>
        <p className="text-xs text-slate-400 mt-1">Incidents logged by or involving this staff member appear here</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {incidents.map((inc) => {
        const cfg = INCIDENT_SEVERITY_CONFIG[inc.severity] ?? INCIDENT_SEVERITY_CONFIG.low;
        return (
          <Link href={`/incidents/${inc.id}`} key={inc.id}>
            <div className="rounded-2xl border border-l-4 bg-white p-4 hover:shadow-sm transition-shadow cursor-pointer"
              style={{ borderLeftColor: inc.severity === "critical" ? "#dc2626" : inc.severity === "high" ? "#ea580c" : inc.severity === "medium" ? "#d97706" : "#94a3b8" }}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm text-slate-900 truncate">{inc.reference}</span>
                    <span className={cn("text-xs rounded-full px-2.5 py-0.5 font-medium", cfg.bg, cfg.text)}>{cfg.label}</span>
                    {inc.reported_by === staffId && (
                      <span className="text-[10px] bg-blue-100 text-blue-700 rounded-full px-2 py-0.5">Logged by</span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-1">{formatDate(inc.date)} · {inc.type?.replace(/_/g, " ")}</p>
                  {inc.description && (
                    <p className="text-xs text-slate-400 mt-1 line-clamp-1">{inc.description}</p>
                  )}
                </div>
                <ChevronRight className="h-4 w-4 text-slate-400 shrink-0" />
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

// ── Leave Tab ─────────────────────────────────────────────────────────────────

function LeaveTab({ staffId }: { staffId: string }) {
  const leaveQuery = useLeave({ staff_id: staffId });
  const records: LeaveRequest[] = leaveQuery.data?.data ?? [];

  if (leaveQuery.isLoading) {
    return <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-slate-400" /></div>;
  }

  const totalApproved = records.filter((r) => r.status === "approved");
  const sick = totalApproved.filter((r) => r.leave_type === "sick");
  const annual = totalApproved.filter((r) => r.leave_type === "annual_leave");

  return (
    <div className="space-y-5">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-2xl border bg-white p-4 text-center">
          <div className="text-2xl font-bold text-slate-900">{annual.length}</div>
          <div className="text-xs text-slate-500 mt-0.5">Annual Leave</div>
        </div>
        <div className="rounded-2xl border bg-white p-4 text-center">
          <div className={cn("text-2xl font-bold", sick.length >= 3 ? "text-amber-600" : "text-slate-900")}>{sick.length}</div>
          <div className="text-xs text-slate-500 mt-0.5">Sick Absences</div>
        </div>
        <div className="rounded-2xl border bg-white p-4 text-center">
          <div className={cn("text-2xl font-bold", records.filter((r) => r.status === "pending").length > 0 ? "text-amber-600" : "text-slate-400")}>
            {records.filter((r) => r.status === "pending").length}
          </div>
          <div className="text-xs text-slate-500 mt-0.5">Pending</div>
        </div>
      </div>

      {/* Bradford factor note */}
      {sick.length >= 3 && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 flex items-start gap-2 text-sm text-amber-800">
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>This staff member has <strong>{sick.length}</strong> sick absences on record. Consider Bradford Factor review.</span>
        </div>
      )}

      {/* Records */}
      {records.length === 0 ? (
        <div className="rounded-2xl border bg-white p-12 text-center">
          <CalendarOff className="h-10 w-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-medium text-slate-600">No leave requests found</p>
        </div>
      ) : (
        <div className="space-y-2">
          {[...records].sort((a, b) => b.start_date.localeCompare(a.start_date)).map((r) => {
            const cfg = LEAVE_STATUS_CONFIG[r.status] ?? LEAVE_STATUS_CONFIG.pending;
            return (
              <div key={r.id} className="rounded-xl border bg-white px-4 py-3 flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm text-slate-900">
                      {LEAVE_TYPE_LABELS[r.leave_type] ?? r.leave_type}
                    </span>
                    <span className={cn("text-xs rounded-full px-2.5 py-0.5 font-medium", cfg.bg, cfg.text)}>{cfg.label}</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {formatDate(r.start_date)} → {formatDate(r.end_date)}
                  </p>
                  {r.reason && <p className="text-xs text-slate-400 mt-0.5 truncate">{r.reason}</p>}
                </div>
                {r.status === "approved" ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                ) : r.status === "declined" ? (
                  <XCircle className="h-4 w-4 text-red-400 shrink-0" />
                ) : (
                  <Clock className="h-4 w-4 text-amber-400 shrink-0" />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function StaffProfilePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [tab, setTab] = useState<ProfileTab>("overview");
  const today = todayStr();

  const staffQuery = useStaff();
  const staffList = staffQuery.data?.data ?? [];
  const staff = staffList.find((s) => s.id === id);

  if (staffQuery.isLoading) {
    return (
      <PageShell title="Staff Profile" showQuickCreate={false}>
        <div className="flex items-center justify-center py-24 text-slate-400">
          <Loader2 className="h-8 w-8 animate-spin mr-3" />
          <span className="text-sm">Loading staff profile…</span>
        </div>
      </PageShell>
    );
  }

  if (!staff) {
    return (
      <PageShell title="Staff not found" showQuickCreate={false}>
        <div className="max-w-md mx-auto mt-12 text-center space-y-4">
          <AlertCircle className="h-12 w-12 text-red-400 mx-auto" />
          <p className="text-sm text-slate-600">This staff profile could not be found.</p>
          <Link href="/staff">
            <Button variant="outline"><ArrowLeft className="h-4 w-4 mr-1" />Back to Staff</Button>
          </Link>
        </div>
      </PageShell>
    );
  }

  const roleLabel = ROLE_LABELS[staff.role as keyof typeof ROLE_LABELS] ?? staff.role;
  const isOnProbation = staff.probation_end_date && staff.probation_end_date > today;
  const hasAlerts = staff.training_expired_count > 0 || staff.supervision_overdue || staff.overdue_tasks > 0;

  const TABS: { id: ProfileTab; label: string; icon: React.ElementType }[] = [
    { id: "overview",    label: "Overview",    icon: Users      },
    { id: "training",    label: "Training",    icon: GraduationCap },
    { id: "supervision", label: "Supervision", icon: MessageSquare },
    { id: "incidents",   label: "Incidents",   icon: Shield     },
    { id: "leave",       label: "Leave",       icon: CalendarOff },
  ];

  return (
    <PageShell
      title={staff.full_name}
      subtitle={staff.job_title}
      showQuickCreate={false}
      actions={
        <div className="flex items-center gap-2">
          <Link href="/staff">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-3.5 w-3.5 mr-1" />All Staff
            </Button>
          </Link>
          <Link href="/supervision">
            <Button variant="outline" size="sm">
              <MessageSquare className="h-3.5 w-3.5 mr-1" />Supervisions
            </Button>
          </Link>
        </div>
      }
    >
      <div className="space-y-6">
        {/* ── Profile hero ──────────────────────────────────────────────────── */}
        <div className="rounded-3xl border bg-white p-6">
          <div className="flex flex-col sm:flex-row items-start gap-5">
            {/* Avatar */}
            <div className="relative shrink-0">
              <Avatar name={staff.full_name} size="xl" />
              {staff.is_on_shift_today && (
                <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center">
                  <div className="h-2 w-2 rounded-full bg-white animate-pulse" />
                </div>
              )}
              {staff.is_on_leave_today && (
                <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-amber-400 border-2 border-white" />
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">{staff.full_name}</h2>
                  <p className="text-slate-500 text-sm mt-0.5">{staff.job_title}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className="rounded-full">{roleLabel}</Badge>
                  <Badge variant="outline" className="rounded-full capitalize">{staff.employment_type?.replace(/_/g, " ")}</Badge>
                  {isOnProbation && <Badge variant="warning" className="rounded-full">On Probation</Badge>}
                  {staff.is_on_shift_today && <Badge variant="success" className="rounded-full gap-1"><div className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-pulse-dot" />On Shift</Badge>}
                  {staff.is_on_leave_today && <Badge variant="warning" className="rounded-full">On Leave</Badge>}
                </div>
              </div>

              {/* Contact row */}
              <div className="flex flex-wrap gap-4 mt-4 text-sm text-slate-500">
                {staff.email && (
                  <a href={`mailto:${staff.email}`} className="flex items-center gap-1.5 hover:text-slate-700 transition-colors">
                    <Mail className="h-4 w-4" />{staff.email}
                  </a>
                )}
                {staff.phone && (
                  <a href={`tel:${staff.phone}`} className="flex items-center gap-1.5 hover:text-slate-700 transition-colors">
                    <Phone className="h-4 w-4" />{staff.phone}
                  </a>
                )}
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" />Started {formatDate(staff.start_date)}
                </span>
                {staff.contracted_hours && (
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-4 w-4" />{staff.contracted_hours}h / week
                  </span>
                )}
              </div>

              {/* DBS */}
              {staff.dbs_number && (
                <div className="mt-3 inline-flex items-center gap-1.5 text-xs bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-full px-3 py-1">
                  <Shield className="h-3 w-3" />DBS: {staff.dbs_number}
                  {staff.dbs_issue_date && <> · Issued {formatDate(staff.dbs_issue_date)}</>}
                  {staff.dbs_update_service && " · Update Service ✓"}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Alert banner ──────────────────────────────────────────────────── */}
        {hasAlerts && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-amber-800">Attention Required</p>
              <ul className="mt-1 text-xs text-amber-700 space-y-0.5">
                {staff.training_expired_count > 0 && (
                  <li>• {staff.training_expired_count} training certificate{staff.training_expired_count !== 1 ? "s" : ""} expired</li>
                )}
                {staff.supervision_overdue && <li>• Supervision is overdue</li>}
                {staff.overdue_tasks > 0 && (
                  <li>• {staff.overdue_tasks} overdue task{staff.overdue_tasks !== 1 ? "s" : ""}</li>
                )}
              </ul>
            </div>
          </div>
        )}

        {/* ── Quick stats ───────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard
            label="Active Tasks" value={staff.active_tasks}
            icon={ClipboardList}
            alert={staff.overdue_tasks > 0}
          />
          <StatCard
            label="Training Compliance"
            value={`${staff.training_total_count - staff.training_expired_count}/${staff.training_total_count}`}
            icon={GraduationCap}
            alert={staff.training_expired_count > 0}
            positive={staff.training_expired_count === 0 && staff.training_expiring_count === 0}
          />
          <StatCard
            label="Supervision"
            value={staff.supervision_overdue ? "Overdue" : staff.supervision_days_until_due !== null ? `${staff.supervision_days_until_due}d` : "—"}
            icon={MessageSquare}
            alert={staff.supervision_overdue}
          />
          <StatCard
            label="Probation Ends"
            value={isOnProbation && staff.probation_end_date ? formatDate(staff.probation_end_date) : "Passed"}
            icon={Award}
            positive={!isOnProbation}
          />
        </div>

        {/* ── Tabs ──────────────────────────────────────────────────────────── */}
        <div>
          {/* Tab nav */}
          <div className="flex gap-1 border-b border-slate-200 mb-5 overflow-x-auto pb-0 scrollbar-hide">
            {TABS.map(({ id: tabId, label, icon: Icon }) => (
              <button
                key={tabId}
                onClick={() => setTab(tabId)}
                className={cn(
                  "flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px whitespace-nowrap transition-colors",
                  tab === tabId
                    ? "border-slate-900 text-slate-900"
                    : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
                {tabId === "training" && staff.training_expired_count > 0 && (
                  <span className="ml-1 rounded-full bg-red-500 text-white text-[9px] px-1.5 py-0.5 font-bold">
                    {staff.training_expired_count}
                  </span>
                )}
                {tabId === "supervision" && staff.supervision_overdue && (
                  <span className="ml-1 h-2 w-2 rounded-full bg-amber-500 inline-block" />
                )}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="animate-fade-in">
            {tab === "overview" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Employment details */}
                <div className="rounded-2xl border bg-white p-5 space-y-4">
                  <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                    <Briefcase className="h-4 w-4 text-slate-500" />Employment Details
                  </h3>
                  <dl className="space-y-3">
                    {[
                      { label: "Employment Type",  value: staff.employment_type?.replace(/_/g, " ") },
                      { label: "Employment Status", value: staff.employment_status?.replace(/_/g, " ") },
                      { label: "Contracted Hours",  value: `${staff.contracted_hours}h / week` },
                      { label: "Start Date",        value: formatDate(staff.start_date) },
                      staff.probation_end_date && { label: "Probation Ends", value: formatDate(staff.probation_end_date) },
                      staff.payroll_id && { label: "Payroll ID", value: staff.payroll_id },
                    ].filter(Boolean).map((item) => item && (
                      <div key={item.label} className="flex items-center justify-between text-sm">
                        <dt className="text-slate-500">{item.label}</dt>
                        <dd className="font-medium text-slate-900 capitalize">{item.value}</dd>
                      </div>
                    ))}
                  </dl>
                </div>

                {/* Emergency contact */}
                <div className="rounded-2xl border bg-white p-5 space-y-4">
                  <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                    <Phone className="h-4 w-4 text-slate-500" />Emergency Contact
                  </h3>
                  {staff.emergency_contact_name ? (
                    <dl className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <dt className="text-slate-500">Name</dt>
                        <dd className="font-medium text-slate-900">{staff.emergency_contact_name}</dd>
                      </div>
                      {staff.emergency_contact_phone && (
                        <div className="flex items-center justify-between text-sm">
                          <dt className="text-slate-500">Phone</dt>
                          <dd className="font-medium text-slate-900">
                            <a href={`tel:${staff.emergency_contact_phone}`} className="text-blue-600 hover:underline">
                              {staff.emergency_contact_phone}
                            </a>
                          </dd>
                        </div>
                      )}
                    </dl>
                  ) : (
                    <p className="text-sm text-slate-400">No emergency contact recorded</p>
                  )}

                  {/* Supervision due */}
                  <div className="pt-3 border-t">
                    <h4 className="text-xs font-semibold text-slate-500 mb-2">Upcoming</h4>
                    {staff.next_supervision_due && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-500 flex items-center gap-1.5">
                          <MessageSquare className="h-3.5 w-3.5" />Supervision Due
                        </span>
                        <span className={cn("font-medium", staff.supervision_overdue ? "text-red-600" : "text-slate-900")}>
                          {formatDate(staff.next_supervision_due)}
                        </span>
                      </div>
                    )}
                    {staff.next_appraisal_due && (
                      <div className="flex items-center justify-between text-sm mt-2">
                        <span className="text-slate-500 flex items-center gap-1.5">
                          <TrendingUp className="h-3.5 w-3.5" />Appraisal Due
                        </span>
                        <span className="font-medium text-slate-900">{formatDate(staff.next_appraisal_due)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {tab === "training"    && <TrainingTab staffId={id ?? ""} />}
            {tab === "supervision" && <SupervisionTab staffId={id ?? ""} />}
            {tab === "incidents"   && <IncidentsTab staffId={id ?? ""} />}
            {tab === "leave"       && <LeaveTab staffId={id ?? ""} />}
          </div>
        </div>
      </div>
    </PageShell>
  );
}
