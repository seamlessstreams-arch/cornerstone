"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Avatar } from "@/components/ui/avatar";
import { AriaPanel } from "@/components/aria/aria-panel";
import { useDashboard, useHealthCheck, useTimeSaved } from "@/hooks/use-dashboard";
import { useCompleteTask } from "@/hooks/use-tasks";
import { getStaffName, getYPName } from "@/lib/seed-data";
import { cn, formatRelative, isOverdue, isDueToday } from "@/lib/utils";
import type { Task, Incident, Shift } from "@/types";
import {
  AlertTriangle, ArrowRight, CalendarDays, CheckCircle2, Clock,
  Shield, Users, Pill, GraduationCap, ChevronRight, Circle, Ban,
  UserX, Eye, Timer, Building2, Car, TrendingUp, Heart,
  AlertCircle, Flame, Target, RefreshCw, CheckCheck, MapPin,
  Activity, Zap, TriangleAlert, XCircle,
} from "lucide-react";

// ─── Greeting ─────────────────────────────────────────────────────────────────

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function formatLiveDate(): string {
  return new Date().toLocaleDateString("en-GB", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });
}

// ─── Skeleton helpers ─────────────────────────────────────────────────────────

function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-xl bg-slate-100", className)} />;
}

function StatSkeleton() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3">
      <Skeleton className="h-3 w-20" />
      <Skeleton className="h-8 w-12" />
      <Skeleton className="h-2.5 w-28" />
    </div>
  );
}

function CardSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <Skeleton className="h-5 w-40" />
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {Array.from({ length: rows }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({
  label, value, icon: Icon, color, bgColor, subtitle, href, pulse,
}: {
  label: string;
  value: number | string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  subtitle?: string;
  href?: string;
  pulse?: boolean;
}) {
  const inner = (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider truncate">{label}</div>
        <div className={cn("mt-1 text-3xl font-bold tabular-nums", color)}>{value}</div>
        {subtitle && <div className="mt-0.5 text-xs text-slate-400 truncate">{subtitle}</div>}
      </div>
      <div className={cn("rounded-2xl p-3 shrink-0 relative", bgColor)}>
        <Icon className={cn("h-5 w-5", color)} />
        {pulse && <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500 animate-pulse" />}
      </div>
    </div>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="block rounded-2xl border border-slate-200 bg-white p-5 transition-all hover:shadow-md hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-violet-400"
      >
        {inner}
      </Link>
    );
  }
  return <div className="rounded-2xl border border-slate-200 bg-white p-5">{inner}</div>;
}

// ─── Alert Command Strip ──────────────────────────────────────────────────────

interface AlertItem {
  key: string;
  label: string;
  href: string;
  severity: "critical" | "high" | "medium";
}

function AlertCommandStrip({ alerts }: { alerts: AlertItem[] }) {
  if (alerts.length === 0) return null;

  const hasCritical = alerts.some((a) => a.severity === "critical");

  return (
    <div className={cn(
      "rounded-2xl border p-4 flex flex-wrap items-center gap-3",
      hasCritical
        ? "bg-red-50 border-red-300"
        : "bg-amber-50 border-amber-300"
    )}>
      <div className="flex items-center gap-2 shrink-0">
        {hasCritical ? (
          <XCircle className="h-5 w-5 text-red-600 shrink-0" />
        ) : (
          <TriangleAlert className="h-5 w-5 text-amber-600 shrink-0" />
        )}
        <span className={cn(
          "text-sm font-bold",
          hasCritical ? "text-red-800" : "text-amber-800"
        )}>
          {hasCritical ? "Immediate action required" : "Attention needed"}
        </span>
      </div>
      <div className="flex flex-wrap gap-2 flex-1">
        {alerts.map((alert) => (
          <Link
            key={alert.key}
            href={alert.href}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all hover:scale-105",
              alert.severity === "critical"
                ? "bg-red-600 text-white hover:bg-red-700"
                : alert.severity === "high"
                  ? "bg-orange-500 text-white hover:bg-orange-600"
                  : "bg-amber-500 text-white hover:bg-amber-600"
            )}
          >
            <AlertCircle className="h-3 w-3" />
            {alert.label}
            <ArrowRight className="h-3 w-3" />
          </Link>
        ))}
      </div>
    </div>
  );
}

// ─── Priority Task Row ─────────────────────────────────────────────────────────

function TaskRow({ task, onComplete }: { task: Task; onComplete?: (id: string) => void }) {
  const overdue = isOverdue(task.due_date, task.status);
  const dueToday = isDueToday(task.due_date);
  const [completing, setCompleting] = useState(false);

  const prioColors: Record<string, string> = {
    urgent: "bg-red-100 text-red-700",
    high: "bg-orange-100 text-orange-700",
    medium: "bg-blue-100 text-blue-700",
    low: "bg-slate-100 text-slate-600",
  };

  const statusIcons: Record<string, React.ElementType> = {
    not_started: Circle,
    in_progress: Clock,
    blocked: Ban,
    completed: CheckCircle2,
  };
  const StatusIcon = statusIcons[task.status] || Circle;

  const handleComplete = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!onComplete || completing) return;
    setCompleting(true);
    onComplete(task.id);
    setTimeout(() => setCompleting(false), 1500);
  };

  return (
    <div className="flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-slate-50 transition-colors group">
      <StatusIcon
        className={cn(
          "h-4 w-4 shrink-0",
          task.status === "in_progress" ? "text-blue-500" :
          task.status === "blocked" ? "text-red-500" :
          "text-slate-300"
        )}
      />
      <Link href="/tasks" className="flex-1 min-w-0">
        <div className={cn("text-sm font-medium truncate", overdue ? "text-red-700" : "text-slate-900")}>
          {task.title}
        </div>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          {task.assigned_to && (
            <span className="text-[10px] text-slate-400">{getStaffName(task.assigned_to).split(" ")[0]}</span>
          )}
          {task.due_date && (
            <span className={cn(
              "text-[10px]",
              overdue ? "text-red-600 font-semibold" :
              dueToday ? "text-orange-600 font-medium" :
              "text-slate-400"
            )}>
              {overdue ? "Overdue · " : ""}{formatRelative(task.due_date)}
            </span>
          )}
          {task.linked_child_id && (
            <span className="text-[10px] text-violet-600 flex items-center gap-0.5">
              <Heart className="h-2.5 w-2.5" />
              {getYPName(task.linked_child_id)}
            </span>
          )}
        </div>
      </Link>
      <Badge className={cn("text-[10px] rounded-full border-0 shrink-0", prioColors[task.priority])}>
        {task.priority}
      </Badge>
      {onComplete && task.status !== "completed" && (
        <button
          onClick={handleComplete}
          disabled={completing}
          title="Mark complete"
          className={cn(
            "shrink-0 h-7 w-7 rounded-lg flex items-center justify-center transition-all",
            completing
              ? "bg-emerald-100 text-emerald-600"
              : "bg-slate-100 text-slate-400 hover:bg-emerald-100 hover:text-emerald-600 opacity-0 group-hover:opacity-100"
          )}
        >
          {completing ? <CheckCheck className="h-3.5 w-3.5" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
        </button>
      )}
    </div>
  );
}

// ─── Oversight Row ────────────────────────────────────────────────────────────

const TYPE_LABELS: Record<string, string> = {
  safeguarding_concern: "Safeguarding",
  missing_from_care: "Missing",
  medication_error: "Medication Error",
  complaint: "Complaint",
  physical_intervention: "Restraint",
  self_harm: "Self-Harm",
  exploitation_concern: "Exploitation",
  assault: "Assault",
  near_miss: "Near Miss",
};

const SEV_COLORS: Record<string, string> = {
  critical: "bg-red-100 text-red-700 border-red-200",
  high: "bg-orange-100 text-orange-700 border-orange-200",
  medium: "bg-amber-100 text-amber-700 border-amber-200",
  low: "bg-slate-100 text-slate-600 border-slate-200",
};

function OversightRow({
  incident,
  onAddOversight,
}: {
  incident: Incident;
  onAddOversight: (id: string) => void;
}) {
  return (
    <div className="flex items-start gap-3 rounded-xl px-3 py-3 hover:bg-slate-50 transition-colors group">
      <AlertTriangle
        className={cn(
          "h-4 w-4 shrink-0 mt-0.5",
          incident.severity === "critical" ? "text-red-600" :
          incident.severity === "high" ? "text-orange-500" :
          "text-amber-500"
        )}
      />
      <Link href="/incidents" className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-semibold text-slate-900">{incident.reference}</span>
          <Badge className={cn("text-[10px] rounded-full border shrink-0", SEV_COLORS[incident.severity])}>
            {incident.severity}
          </Badge>
        </div>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          <span className="text-[10px] text-slate-500">{TYPE_LABELS[incident.type] || incident.type}</span>
          {incident.child_id && (
            <span className="text-[10px] text-violet-600 flex items-center gap-0.5">
              <Heart className="h-2.5 w-2.5" />
              {getYPName(incident.child_id)}
            </span>
          )}
          <span className="text-[10px] text-slate-400">{formatRelative(incident.date)}</span>
        </div>
      </Link>
      <button
        onClick={() => onAddOversight(incident.id)}
        className="shrink-0 flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[10px] font-semibold bg-violet-50 text-violet-700 border border-violet-200 hover:bg-violet-600 hover:text-white hover:border-violet-600 transition-all"
      >
        <Eye className="h-3 w-3" />
        Oversee
      </button>
    </div>
  );
}

// ─── Shift Row ─────────────────────────────────────────────────────────────────

const SHIFT_TYPE_LABELS: Record<string, string> = {
  day: "Day",
  sleep_in: "Sleep-in",
  waking_night: "Waking Night",
  early: "Early",
  late: "Late",
};

const SHIFT_TYPE_COLORS: Record<string, string> = {
  day: "bg-emerald-100 text-emerald-700",
  sleep_in: "bg-indigo-100 text-indigo-700",
  waking_night: "bg-violet-100 text-violet-700",
  early: "bg-sky-100 text-sky-700",
  late: "bg-orange-100 text-orange-700",
};

function ShiftRow({ shift }: { shift: Shift }) {
  const name = getStaffName(shift.staff_id);
  const isOnNow = shift.status === "in_progress";

  return (
    <div className="flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-2 hover:bg-slate-100 transition-colors">
      <Avatar name={name} size="sm" />
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-slate-900 truncate">{name}</div>
        <div className="text-[10px] text-slate-400">
          {shift.start_time} – {shift.end_time}
        </div>
      </div>
      <Badge className={cn("text-[10px] rounded-full border-0 shrink-0", SHIFT_TYPE_COLORS[shift.shift_type] || "bg-slate-100 text-slate-600")}>
        {SHIFT_TYPE_LABELS[shift.shift_type] || shift.shift_type}
      </Badge>
      {isOnNow && (
        <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shrink-0" title="On shift now" />
      )}
    </div>
  );
}

// ─── Health Check Gauge ────────────────────────────────────────────────────────

function ScoreGauge({ score, size = 80 }: { score: number; size?: number }) {
  const r = (size / 2) - 8;
  const circumference = 2 * Math.PI * r;
  const dash = (score / 100) * circumference;

  const scoreColor =
    score >= 80 ? "#10b981" :
    score >= 60 ? "#f59e0b" :
    score >= 40 ? "#f97316" :
    "#ef4444";

  return (
    <svg width={size} height={size} className="shrink-0">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e2e8f0" strokeWidth={6} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={scoreColor}
        strokeWidth={6}
        strokeLinecap="round"
        strokeDasharray={`${dash} ${circumference - dash}`}
        strokeDashoffset={circumference / 4}
        className="transition-all duration-700"
      />
      <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle" fill={scoreColor} fontSize={size * 0.22} fontWeight="700">
        {score}
      </text>
    </svg>
  );
}

const RISK_LEVEL_CONFIG = {
  low: { color: "bg-emerald-100 text-emerald-700 border-emerald-200", label: "Low Risk" },
  medium: { color: "bg-amber-100 text-amber-700 border-amber-200", label: "Medium Risk" },
  high: { color: "bg-orange-100 text-orange-700 border-orange-200", label: "High Risk" },
  critical: { color: "bg-red-100 text-red-700 border-red-200", label: "Critical" },
};

const PRIORITY_COLORS = {
  critical: "text-red-600",
  high: "text-orange-500",
  medium: "text-amber-500",
  low: "text-slate-400",
};

function SubScoreBar({ label, value, icon: Icon }: { label: string; value: number; icon: React.ElementType }) {
  const color =
    value >= 80 ? "bg-emerald-500" :
    value >= 60 ? "bg-amber-500" :
    value >= 40 ? "bg-orange-500" :
    "bg-red-500";

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Icon className="h-3 w-3 text-slate-400" />
          <span className="text-[11px] text-slate-500">{label}</span>
        </div>
        <span className="text-[11px] font-semibold text-slate-700 tabular-nums">{value}</span>
      </div>
      <Progress value={value} color={color} className="h-1.5" />
    </div>
  );
}

// ─── Time Saved Widget ─────────────────────────────────────────────────────────

function TimeSavedWidget({ formatted }: { formatted: Record<string, string> }) {
  const stats = [
    { label: "You today", value: formatted.user_today || "—", icon: Timer, color: "text-violet-600 bg-violet-50" },
    { label: "You this week", value: formatted.user_week || "—", icon: TrendingUp, color: "text-blue-600 bg-blue-50" },
    { label: "Home this week", value: formatted.home_week || "—", icon: Activity, color: "text-emerald-600 bg-emerald-50" },
    { label: "Home this month", value: formatted.home_month || "—", icon: Zap, color: "text-amber-600 bg-amber-50" },
  ];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Timer className="h-5 w-5 text-violet-500" />
          Time Saved by Aria
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          {stats.map((s) => (
            <div key={s.label} className={cn("rounded-xl p-3 flex items-center gap-2.5", s.color.split(" ")[1])}>
              <s.icon className={cn("h-4 w-4 shrink-0", s.color.split(" ")[0])} />
              <div>
                <div className={cn("text-base font-bold tabular-nums", s.color.split(" ")[0])}>{s.value}</div>
                <div className="text-[10px] text-slate-500">{s.label}</div>
              </div>
            </div>
          ))}
        </div>
        <p className="mt-3 text-[11px] text-slate-400 text-center">
          Time reclaimed from admin — back into care
        </p>
      </CardContent>
    </Card>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ══════════════════════════════════════════════════════════════════════════════

export default function DashboardPage() {
  const dashboard = useDashboard();
  const healthCheck = useHealthCheck();
  const timeSaved = useTimeSaved();
  const completeTask = useCompleteTask();

  const [oversightTarget, setOversightTarget] = useState<string | null>(null);

  const d = dashboard.data?.data;
  const hc = healthCheck.data?.data;
  const ts = timeSaved.data?.formatted;

  const isLoading = dashboard.isLoading;
  const isError = dashboard.isError;

  // Build alert strip items
  const alertItems = useMemo<AlertItem[]>(() => {
    if (!d) return [];
    const items: AlertItem[] = [];
    if (d.incidents.critical > 0) {
      items.push({
        key: "critical_incident",
        label: `${d.incidents.critical} critical incident${d.incidents.critical > 1 ? "s" : ""} open`,
        href: "/incidents",
        severity: "critical",
      });
    }
    if (d.safeguarding.missing_active > 0) {
      items.push({
        key: "missing",
        label: `${d.safeguarding.missing_active} missing from care`,
        href: "/incidents",
        severity: "critical",
      });
    }
    if (d.medication.missed_today > 0) {
      items.push({
        key: "medication",
        label: `${d.medication.missed_today} medication missed today`,
        href: "/medication",
        severity: "high",
      });
    }
    if (d.environment.building_checks_overdue > 0) {
      items.push({
        key: "building",
        label: `${d.environment.building_checks_overdue} building check${d.environment.building_checks_overdue > 1 ? "s" : ""} overdue`,
        href: "/buildings",
        severity: "high",
      });
    }
    if (d.environment.vehicle_defects > 0) {
      items.push({
        key: "vehicle",
        label: `${d.environment.vehicle_defects} vehicle defect${d.environment.vehicle_defects > 1 ? "s" : ""}`,
        href: "/vehicles",
        severity: "medium",
      });
    }
    return items;
  }, [d]);

  // Handle complete task
  const handleCompleteTask = (id: string) => {
    completeTask.mutate({ id, by: "staff_darren" });
  };

  // Handle add oversight — opens Aria in oversee mode for the incident
  const handleAddOversight = (id: string) => {
    setOversightTarget(id);
    // Scroll to Aria panel
    document.getElementById("aria-panel")?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  // ── Error state ──────────────────────────────────────────────────────────────
  if (isError) {
    return (
      <PageShell title="Dashboard" subtitle="Control room" showQuickCreate={false}>
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
          <div className="rounded-2xl bg-red-50 border border-red-200 p-8 text-center max-w-md">
            <XCircle className="h-10 w-10 text-red-500 mx-auto mb-3" />
            <div className="text-base font-semibold text-red-800 mb-1">Dashboard failed to load</div>
            <p className="text-sm text-red-600 mb-4">Unable to reach the API. Check your connection and try again.</p>
            <Button variant="outline" size="sm" onClick={() => dashboard.refetch()} className="gap-1.5">
              <RefreshCw className="h-3.5 w-3.5" /> Retry
            </Button>
          </div>
        </div>
      </PageShell>
    );
  }

  // ── Greeting header ──────────────────────────────────────────────────────────
  const pageActions = (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="sm" onClick={() => dashboard.refetch()} disabled={dashboard.isFetching}>
        <RefreshCw className={cn("h-3.5 w-3.5", dashboard.isFetching && "animate-spin")} />
        {dashboard.isFetching ? "Refreshing…" : "Refresh"}
      </Button>
      <Button size="sm" asChild>
        <Link href="/tasks"><Target className="h-3.5 w-3.5" /> My Tasks</Link>
      </Button>
    </div>
  );

  return (
    <PageShell
      title={`${getGreeting()}, Darren`}
      subtitle={`${formatLiveDate()} · Oak House · ${d ? d.young_people.current.length : 3} young people`}
      quickCreateContext={{ module: "dashboard" }}
      actions={pageActions}
    >
      <div className="space-y-6">

        {/* ── Alert Command Strip ────────────────────────────────────────────── */}
        {!isLoading && <AlertCommandStrip alerts={alertItems} />}

        {/* ── 6-Stat Top Row ────────────────────────────────────────────────── */}
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 xl:grid-cols-6">
          {isLoading ? (
            Array.from({ length: 6 }).map((_, i) => <StatSkeleton key={i} />)
          ) : (
            <>
              <StatCard
                label="Overdue Tasks"
                value={d?.tasks.overdue ?? 0}
                icon={AlertTriangle}
                color="text-red-600"
                bgColor="bg-red-50"
                subtitle={d?.tasks.overdue === 0 ? "All clear" : "Needs attention"}
                href="/tasks"
                pulse={(d?.tasks.overdue ?? 0) > 0}
              />
              <StatCard
                label="Due Today"
                value={d?.tasks.due_today ?? 0}
                icon={CalendarDays}
                color="text-orange-600"
                bgColor="bg-orange-50"
                subtitle={`${d?.tasks.my_tasks ?? 0} assigned to you`}
                href="/tasks"
              />
              <StatCard
                label="Open Incidents"
                value={d?.incidents.open ?? 0}
                icon={Shield}
                color="text-rose-600"
                bgColor="bg-rose-50"
                subtitle={`${d?.incidents.awaiting_oversight ?? 0} need oversight`}
                href="/incidents"
                pulse={(d?.incidents.critical ?? 0) > 0}
              />
              <StatCard
                label="Missing from Care"
                value={d?.safeguarding.missing_active ?? 0}
                icon={MapPin}
                color="text-purple-600"
                bgColor="bg-purple-50"
                subtitle={`${d?.young_people.missing_episodes_total ?? 0} episodes total`}
                href="/incidents"
                pulse={(d?.safeguarding.missing_active ?? 0) > 0}
              />
              <StatCard
                label="Training Gaps"
                value={(d?.compliance.training_expired ?? 0) + (d?.compliance.training_expiring ?? 0)}
                icon={GraduationCap}
                color="text-amber-600"
                bgColor="bg-amber-50"
                subtitle={`${d?.compliance.training_expired ?? 0} expired`}
                href="/training"
              />
              <StatCard
                label="On Shift"
                value={d?.staffing.on_shift ?? 0}
                icon={Users}
                color="text-emerald-600"
                bgColor="bg-emerald-50"
                subtitle={
                  (d?.staffing.open_shifts ?? 0) > 0
                    ? `${d?.staffing.open_shifts} open shift${d!.staffing.open_shifts > 1 ? "s" : ""}`
                    : "Full coverage"
                }
                href="/rota"
              />
            </>
          )}
        </div>

        {/* ── Main 3-column grid ─────────────────────────────────────────────── */}
        <div className="grid gap-6 lg:grid-cols-4">

          {/* ── Column 1 (half width): Priority Command ──────────────────────── */}
          <div className="lg:col-span-2 space-y-6">

            {/* Priority queue */}
            {isLoading ? <CardSkeleton rows={6} /> : (
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Flame className="h-5 w-5 text-orange-500" />
                      Priority Command
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      {(d?.tasks.awaiting_sign_off ?? 0) > 0 && (
                        <Badge variant="warning" className="text-[10px] rounded-full gap-1">
                          <CheckCheck className="h-3 w-3" />
                          {d!.tasks.awaiting_sign_off} sign-off{d!.tasks.awaiting_sign_off > 1 ? "s" : ""}
                        </Badge>
                      )}
                      <Link
                        href="/tasks"
                        className="text-xs text-blue-600 hover:underline flex items-center gap-0.5"
                      >
                        All tasks <ArrowRight className="h-3 w-3" />
                      </Link>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  {d?.tasks.priority_queue && d.tasks.priority_queue.length > 0 ? (
                    <div className="divide-y divide-slate-100">
                      {d.tasks.priority_queue.map((task) => (
                        <TaskRow
                          key={task.id}
                          task={task}
                          onComplete={handleCompleteTask}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="py-10 text-center">
                      <CheckCircle2 className="h-10 w-10 text-emerald-400 mx-auto mb-3" />
                      <div className="text-sm font-semibold text-emerald-700">Priority queue clear</div>
                      <div className="text-xs text-slate-400 mt-1">No overdue or urgent tasks</div>
                    </div>
                  )}
                  {/* Completed today footer */}
                  {(d?.tasks.completed_today ?? 0) > 0 && (
                    <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-2 px-3">
                      <CheckCheck className="h-3.5 w-3.5 text-emerald-500" />
                      <span className="text-[11px] text-slate-500">
                        {d!.tasks.completed_today} task{d!.tasks.completed_today > 1 ? "s" : ""} completed today
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Health Check Widget */}
            {healthCheck.isLoading ? <CardSkeleton rows={4} /> : hc ? (
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Activity className="h-5 w-5 text-emerald-500" />
                      Home Health Check
                    </CardTitle>
                    <Link
                      href="/dashboard"
                      className="text-xs text-blue-600 hover:underline flex items-center gap-0.5"
                    >
                      Full report <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-start gap-5">
                    {/* Gauge */}
                    <div className="flex flex-col items-center gap-2 shrink-0">
                      <ScoreGauge score={hc.overall} size={88} />
                      <Badge
                        className={cn(
                          "text-[10px] rounded-full border",
                          RISK_LEVEL_CONFIG[hc.risk_level]?.color || "bg-slate-100 text-slate-600"
                        )}
                      >
                        {RISK_LEVEL_CONFIG[hc.risk_level]?.label || hc.risk_level}
                      </Badge>
                    </div>

                    {/* Sub-scores */}
                    <div className="flex-1 space-y-2.5 min-w-0">
                      <SubScoreBar label="Safeguarding" value={hc.safeguarding} icon={Shield} />
                      <SubScoreBar label="Medication" value={hc.medication} icon={Pill} />
                      <SubScoreBar label="Operational" value={hc.operational} icon={Target} />
                      <SubScoreBar label="Staffing" value={hc.staffing} icon={Users} />
                      <SubScoreBar label="Compliance" value={hc.compliance} icon={GraduationCap} />
                      <SubScoreBar label="Environment" value={hc.environment} icon={Building2} />
                    </div>
                  </div>

                  {/* Action plan top 3 */}
                  {hc.action_plan && hc.action_plan.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-slate-100 space-y-2">
                      <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                        Priority actions
                      </div>
                      {hc.action_plan.slice(0, 3).map((item, i) => (
                        <div key={i} className="flex items-start gap-2.5 rounded-xl bg-slate-50 px-3 py-2">
                          <span className={cn("h-4 w-4 shrink-0 mt-0.5 text-xs font-bold",
                            PRIORITY_COLORS[item.priority as keyof typeof PRIORITY_COLORS] || "text-slate-400"
                          )}>
                            {i + 1}
                          </span>
                          <div className="min-w-0">
                            <div className="text-xs font-medium text-slate-800 truncate">{item.issue}</div>
                            <div className="text-[10px] text-slate-400 mt-0.5">
                              {item.area} · {item.owner} · Due {formatRelative(item.due)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : null}
          </div>

          {/* ── Column 2 (quarter width): Safeguarding & Incidents ───────────── */}
          <div className="space-y-6">

            {/* Oversight queue */}
            {isLoading ? <CardSkeleton rows={3} /> : (
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Eye className="h-5 w-5 text-amber-500" />
                      Oversight Queue
                    </CardTitle>
                    <Link href="/incidents" className="text-xs text-blue-600 hover:underline flex items-center gap-0.5">
                      All <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                  {(d?.incidents.awaiting_oversight ?? 0) > 0 && (
                    <Badge variant="warning" className="text-[10px] rounded-full w-fit gap-1">
                      <Eye className="h-3 w-3" />
                      {d!.incidents.awaiting_oversight} awaiting your oversight
                    </Badge>
                  )}
                </CardHeader>
                <CardContent className="pt-0">
                  {d?.incidents.oversight_queue && d.incidents.oversight_queue.length > 0 ? (
                    <div className="divide-y divide-slate-100">
                      {d.incidents.oversight_queue.map((inc) => (
                        <OversightRow
                          key={inc.id}
                          incident={inc}
                          onAddOversight={handleAddOversight}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="py-6 text-center">
                      <Shield className="h-8 w-8 text-emerald-400 mx-auto mb-2" />
                      <div className="text-xs font-medium text-emerald-700">All incidents overseen</div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Missing from care & safeguarding */}
            {isLoading ? <CardSkeleton rows={3} /> : (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <MapPin className="h-5 w-5 text-purple-500" />
                    Safeguarding
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0 space-y-3">
                  {/* Missing from care */}
                  <div className={cn(
                    "rounded-xl p-3 space-y-1.5",
                    (d?.safeguarding.missing_active ?? 0) > 0
                      ? "bg-purple-50 border border-purple-200"
                      : "bg-slate-50"
                  )}>
                    <div className="flex items-center justify-between">
                      <span className={cn(
                        "text-xs font-semibold",
                        (d?.safeguarding.missing_active ?? 0) > 0 ? "text-purple-800" : "text-slate-700"
                      )}>
                        Missing from care
                      </span>
                      <span className={cn(
                        "text-lg font-bold tabular-nums",
                        (d?.safeguarding.missing_active ?? 0) > 0 ? "text-purple-700" : "text-slate-400"
                      )}>
                        {d?.safeguarding.missing_active ?? 0}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-500">
                      {d?.young_people.missing_episodes_total ?? 0} episodes total this placement
                    </div>
                    {(d?.safeguarding.missing_episodes?.length ?? 0) > 0 && (
                      <div className="pt-1 space-y-1">
                        {d!.safeguarding.missing_episodes.slice(0, 2).map((ep) => (
                          <Link
                            key={ep.id}
                            href="/incidents"
                            className="flex items-center gap-2 text-[10px] text-purple-700 hover:text-purple-900 transition-colors"
                          >
                            <span className="h-1.5 w-1.5 rounded-full bg-purple-400 shrink-0" />
                            {getYPName(ep.child_id)} · since {formatRelative(ep.date_missing)}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* High-risk YP flags */}
                  {(d?.safeguarding.high_risk_yp?.length ?? 0) > 0 && (
                    <div className="space-y-2">
                      <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                        High-risk flags
                      </div>
                      {d!.safeguarding.high_risk_yp.map((yp) => (
                        <Link
                          key={yp.id}
                          href="/young-people"
                          className="flex items-start gap-2.5 rounded-xl bg-red-50 border border-red-100 px-3 py-2 hover:bg-red-100 transition-colors"
                        >
                          <Avatar name={yp.preferred_name || yp.first_name} size="xs" className="mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-semibold text-red-800 truncate">
                              {yp.preferred_name || yp.first_name}
                            </div>
                            <div className="flex flex-wrap gap-1 mt-0.5">
                              {yp.risk_flags.slice(0, 3).map((flag) => (
                                <span
                                  key={flag}
                                  className="text-[9px] bg-red-100 text-red-700 rounded-full px-1.5 py-0.5"
                                >
                                  {flag}
                                </span>
                              ))}
                              {yp.risk_flags.length > 3 && (
                                <span className="text-[9px] text-red-500">+{yp.risk_flags.length - 3}</span>
                              )}
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}

                  {/* Contextual risk indicator */}
                  {(d?.safeguarding.contextual_risk ?? 0) > 0 && (
                    <div className="flex items-center gap-2 rounded-xl bg-amber-50 border border-amber-200 px-3 py-2">
                      <AlertTriangle className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                      <span className="text-xs text-amber-800 font-medium">
                        {d!.safeguarding.contextual_risk} contextual risk concern{d!.safeguarding.contextual_risk > 1 ? "s" : ""}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Time saved */}
            {timeSaved.isLoading ? <CardSkeleton rows={2} /> :
              ts ? <TimeSavedWidget formatted={ts} /> : null
            }
          </div>

          {/* ── Column 3 (quarter width): Operations ─────────────────────────── */}
          <div className="space-y-6">

            {/* Today's shift coverage */}
            {isLoading ? <CardSkeleton rows={4} /> : (
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Users className="h-5 w-5 text-emerald-500" />
                      On Shift Today
                    </CardTitle>
                    <Link href="/rota" className="text-xs text-blue-600 hover:underline">Rota →</Link>
                  </div>
                </CardHeader>
                <CardContent className="pt-0 space-y-2">
                  {d?.staffing.today_shifts && d.staffing.today_shifts.length > 0 ? (
                    d.staffing.today_shifts.map((shift) => (
                      <ShiftRow key={shift.id} shift={shift} />
                    ))
                  ) : (
                    <div className="py-4 text-center text-xs text-slate-400">No shifts recorded today</div>
                  )}

                  {/* Open shift alert */}
                  {(d?.staffing.open_shifts ?? 0) > 0 && (
                    <Link
                      href="/rota"
                      className="mt-1 flex items-center gap-2 rounded-xl bg-amber-50 border border-amber-200 px-3 py-2.5 hover:bg-amber-100 transition-colors"
                    >
                      <UserX className="h-4 w-4 text-amber-600 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-semibold text-amber-800">
                          {d!.staffing.open_shifts} open shift{d!.staffing.open_shifts > 1 ? "s" : ""} to fill
                        </div>
                        <div className="text-[10px] text-amber-600">Click to assign staff</div>
                      </div>
                      <ChevronRight className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                    </Link>
                  )}

                  {/* Supervision overdue */}
                  {(d?.staffing.supervision_overdue ?? 0) > 0 && (
                    <div className="flex items-center gap-2 rounded-xl bg-blue-50 border border-blue-200 px-3 py-2 mt-1">
                      <Clock className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                      <span className="text-xs text-blue-800">
                        {d!.staffing.supervision_overdue} supervision{d!.staffing.supervision_overdue > 1 ? "s" : ""} overdue
                      </span>
                    </div>
                  )}

                  {d?.staffing.on_leave !== undefined && d.staffing.on_leave > 0 && (
                    <div className="text-[10px] text-slate-400 pt-1 px-1">
                      {d.staffing.on_leave} staff on leave today
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Medication summary */}
            {isLoading ? <CardSkeleton rows={3} /> : (
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Pill className="h-5 w-5 text-teal-500" />
                      Medication
                    </CardTitle>
                    <Link href="/medication" className="text-xs text-blue-600 hover:underline">View →</Link>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <div className="rounded-xl bg-slate-50 p-2.5 text-center">
                      <div className="text-xl font-bold text-slate-900 tabular-nums">
                        {d?.medication.scheduled_today ?? 0}
                      </div>
                      <div className="text-[10px] text-slate-500">Scheduled today</div>
                    </div>
                    <div className={cn("rounded-xl p-2.5 text-center", (d?.medication.missed_today ?? 0) > 0 ? "bg-red-50" : "bg-slate-50")}>
                      <div className={cn("text-xl font-bold tabular-nums", (d?.medication.missed_today ?? 0) > 0 ? "text-red-600" : "text-slate-900")}>
                        {d?.medication.missed_today ?? 0}
                      </div>
                      <div className={cn("text-[10px]", (d?.medication.missed_today ?? 0) > 0 ? "text-red-500" : "text-slate-500")}>
                        Missed today
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {(d?.medication.exceptions_this_week ?? 0) > 0 && (
                      <div className="flex items-center gap-2 rounded-xl bg-orange-50 border border-orange-200 px-3 py-2">
                        <AlertTriangle className="h-3.5 w-3.5 text-orange-500 shrink-0" />
                        <span className="text-xs text-orange-800">
                          {d!.medication.exceptions_this_week} exception{d!.medication.exceptions_this_week > 1 ? "s" : ""} this week
                        </span>
                      </div>
                    )}
                    {(d?.medication.stock_alerts ?? 0) > 0 && (
                      <div className="flex items-center gap-2 rounded-xl bg-amber-50 border border-amber-200 px-3 py-2">
                        <Pill className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                        <span className="text-xs text-amber-800">
                          {d!.medication.stock_alerts} low stock alert{d!.medication.stock_alerts > 1 ? "s" : ""}
                        </span>
                      </div>
                    )}
                    {(d?.medication.oversight_needed ?? 0) > 0 && (
                      <div className="flex items-center gap-2 rounded-xl bg-red-50 border border-red-200 px-3 py-2">
                        <Eye className="h-3.5 w-3.5 text-red-500 shrink-0" />
                        <span className="text-xs text-red-800">
                          {d!.medication.oversight_needed} oversight needed
                        </span>
                      </div>
                    )}
                    {(d?.medication.exceptions_this_week ?? 0) === 0 &&
                     (d?.medication.missed_today ?? 0) === 0 &&
                     (d?.medication.stock_alerts ?? 0) === 0 && (
                      <div className="flex items-center gap-2 text-xs text-emerald-600">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        No medication concerns
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Building & Vehicle alerts */}
            {isLoading ? <CardSkeleton rows={2} /> : (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Building2 className="h-5 w-5 text-slate-500" />
                    Environment
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0 space-y-2">
                  {/* Building checks */}
                  <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-3.5 w-3.5 text-slate-400" />
                      <span className="text-xs text-slate-700">Building checks</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {(d?.environment.building_checks_overdue ?? 0) > 0 && (
                        <Badge variant="destructive" className="text-[10px] rounded-full">
                          {d!.environment.building_checks_overdue} overdue
                        </Badge>
                      )}
                      {(d?.environment.building_checks_due ?? 0) > 0 && (
                        <Badge variant="warning" className="text-[10px] rounded-full">
                          {d!.environment.building_checks_due} due
                        </Badge>
                      )}
                      {(d?.environment.building_checks_due ?? 0) === 0 && (d?.environment.building_checks_overdue ?? 0) === 0 && (
                        <span className="text-[10px] text-emerald-600 font-medium">All clear</span>
                      )}
                    </div>
                  </div>

                  {/* Vehicles */}
                  <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <Car className="h-3.5 w-3.5 text-slate-400" />
                      <span className="text-xs text-slate-700">Vehicles</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {(d?.environment.vehicle_defects ?? 0) > 0 && (
                        <Badge variant="destructive" className="text-[10px] rounded-full">
                          {d!.environment.vehicle_defects} defect{d!.environment.vehicle_defects > 1 ? "s" : ""}
                        </Badge>
                      )}
                      {(d?.environment.vehicles_restricted ?? 0) > 0 && (
                        <Badge variant="warning" className="text-[10px] rounded-full">
                          {d!.environment.vehicles_restricted} restricted
                        </Badge>
                      )}
                      {(d?.environment.vehicle_defects ?? 0) === 0 && (d?.environment.vehicles_restricted ?? 0) === 0 && (
                        <span className="text-[10px] text-emerald-600 font-medium">All clear</span>
                      )}
                    </div>
                  </div>

                  <Link
                    href="/buildings"
                    className="flex items-center gap-1.5 text-xs text-blue-600 hover:underline pt-1"
                  >
                    View environment checks <ArrowRight className="h-3 w-3" />
                  </Link>
                </CardContent>
              </Card>
            )}

            {/* Compliance snapshot */}
            {isLoading ? <CardSkeleton rows={2} /> : (
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <GraduationCap className="h-5 w-5 text-amber-500" />
                      Compliance
                    </CardTitle>
                    <Link href="/training" className="text-xs text-blue-600 hover:underline">Training →</Link>
                  </div>
                </CardHeader>
                <CardContent className="pt-0 space-y-3">
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="rounded-xl bg-red-50 p-2">
                      <div className="text-lg font-bold text-red-600 tabular-nums">
                        {d?.compliance.training_expired ?? 0}
                      </div>
                      <div className="text-[10px] text-red-500">Expired</div>
                    </div>
                    <div className="rounded-xl bg-amber-50 p-2">
                      <div className="text-lg font-bold text-amber-600 tabular-nums">
                        {d?.compliance.training_expiring ?? 0}
                      </div>
                      <div className="text-[10px] text-amber-500">Expiring</div>
                    </div>
                    <div className="rounded-xl bg-blue-50 p-2">
                      <div className="text-lg font-bold text-blue-600 tabular-nums">
                        {d?.compliance.cert_warnings ?? 0}
                      </div>
                      <div className="text-[10px] text-blue-500">Cert warns</div>
                    </div>
                  </div>

                  {(d?.compliance.cert_warnings_list?.length ?? 0) > 0 && (
                    <div className="space-y-1">
                      {d!.compliance.cert_warnings_list.slice(0, 3).map((w, i) => (
                        <div key={i} className="flex items-center gap-2 text-[10px] text-slate-600">
                          <span className="h-1.5 w-1.5 rounded-full bg-amber-400 shrink-0" />
                          <span className="truncate">{w}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* ── Bottom Row: Aria Suggest Panel ────────────────────────────────── */}
        <div id="aria-panel">
          <AriaPanel
            mode={oversightTarget ? "oversee" : "assist"}
            pageContext={`Dashboard — Oak House control room. ${d ? `${d.tasks.overdue} overdue tasks, ${d.incidents.open} open incidents, ${d.safeguarding.missing_active} missing from care, ${d.medication.missed_today} medication missed today.` : "Loading dashboard data."}`}
            recordType={oversightTarget ? "incident_oversight" : undefined}
            sourceContent={oversightTarget ? `Adding oversight for incident ID: ${oversightTarget}` : undefined}
            userRole="registered_manager"
            defaultStyle="concise_manager"
            className="max-w-2xl mx-auto"
          />
        </div>

      </div>
    </PageShell>
  );
}
