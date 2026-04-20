"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { PageShell } from "@/components/layout/page-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar } from "@/components/ui/avatar";
import {
  Search, CheckCircle2, Circle, Clock, Ban,
  AlertTriangle, Flame, ArrowUp, ArrowRight, ArrowDown, Shield,
  Heart, Timer, CalendarDays, RotateCcw, X,
  User, CheckSquare, ChevronRight,
} from "lucide-react";
import { getStaffName, getYPName } from "@/lib/seed-data";
import { useTasks } from "@/hooks/use-tasks";
import { useStaff } from "@/hooks/use-staff";
import { cn, formatRelative, isOverdue, isDueToday } from "@/lib/utils";
import { TASK_CATEGORY_LABELS, TASK_PRIORITIES } from "@/lib/constants";
import type { Task } from "@/types";

// ── Module-level quick create context (pre-fills the modal for this page) ─────
const TASKS_QUICK_CREATE_CONTEXT = { module: "tasks" } as const;

// ── Status and priority display config ───────────────────────────────────────

const STATUS_CONFIG: Record<string, { color: string; bgColor: string; icon: React.ElementType; label: string }> = {
  not_started: { color: "text-slate-500", bgColor: "bg-slate-100", icon: Circle, label: "Not Started" },
  in_progress:  { color: "text-blue-600",   bgColor: "bg-blue-100",   icon: Clock,       label: "In Progress" },
  blocked:      { color: "text-red-600",     bgColor: "bg-red-100",    icon: Ban,         label: "Blocked" },
  completed:    { color: "text-emerald-600", bgColor: "bg-emerald-100",icon: CheckCircle2,label: "Completed" },
  cancelled:    { color: "text-slate-400",   bgColor: "bg-slate-100",  icon: X,           label: "Cancelled" },
};

const PRIORITY_CONFIG: Record<string, { color: string; border: string; icon: React.ElementType; label: string }> = {
  urgent: { color: "bg-red-100 text-red-800",       border: "border-l-red-600",   icon: Flame,     label: "Urgent" },
  high:   { color: "bg-orange-100 text-orange-800", border: "border-l-orange-500",icon: ArrowUp,   label: "High"   },
  medium: { color: "bg-blue-100 text-blue-800",     border: "border-l-blue-400",  icon: ArrowRight,label: "Medium" },
  low:    { color: "bg-slate-100 text-slate-600",   border: "border-l-slate-300", icon: ArrowDown, label: "Low"    },
};

type ViewMode = "list" | "kanban";

// ─────────────────────────────────────────────────────────────────────────────

export default function TasksPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [filterPerson, setFilterPerson] = useState<string | null>(null);
  const [filterPriority, setFilterPriority] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [showCompleted, setShowCompleted] = useState(false);

  const tasksQuery = useTasks();
  const staffQuery = useStaff();
  const allTasks: Task[] = useMemo(() => tasksQuery.data?.data ?? [], [tasksQuery.data?.data]);

  const filtered = useMemo(() => {
    let list = allTasks;
    if (!showCompleted) list = list.filter((t) => t.status !== "completed" && t.status !== "cancelled");
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((t) => t.title.toLowerCase().includes(q) || t.description?.toLowerCase().includes(q));
    }
    if (filterPerson)   list = list.filter((t) => t.assigned_to === filterPerson);
    if (filterPriority) list = list.filter((t) => t.priority === filterPriority);
    if (filterCategory) list = list.filter((t) => t.category === filterCategory);
    return list.sort((a, b) => {
      const pw: Record<string, number> = { urgent: 0, high: 1, medium: 2, low: 3 };
      const aO = isOverdue(a.due_date, a.status) ? -10 : 0;
      const bO = isOverdue(b.due_date, b.status) ? -10 : 0;
      return (aO + (pw[a.priority] ?? 2)) - (bO + (pw[b.priority] ?? 2));
    });
  }, [allTasks, search, filterPerson, filterPriority, filterCategory, showCompleted]);

  const kanban = useMemo(() => ({
    not_started: filtered.filter((t) => t.status === "not_started"),
    in_progress:  filtered.filter((t) => t.status === "in_progress"),
    blocked:      filtered.filter((t) => t.status === "blocked"),
    completed:    filtered.filter((t) => t.status === "completed").slice(0, 10),
  }), [filtered]);

  const clearFilters = () => {
    setSearch(""); setFilterPerson(null); setFilterPriority(null); setFilterCategory(null);
  };
  const hasFilters = search || filterPerson || filterPriority || filterCategory;
  const activeStaff = useMemo(
    () => (staffQuery.data?.data ?? []).filter((s) => s.is_active && s.role !== "responsible_individual"),
    [staffQuery.data?.data]
  );

  return (
    <PageShell
      title="Tasks"
      subtitle={`${filtered.length} task${filtered.length !== 1 ? "s" : ""} ${hasFilters ? "(filtered)" : ""}`}
      quickCreateContext={TASKS_QUICK_CREATE_CONTEXT}
    >
      <div className="space-y-4 animate-fade-in">
        {/* ── Toolbar ──────────────────────────────────────────────────────── */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search tasks…" className="pl-9" />
          </div>

          {/* Priority filter */}
          <div className="flex gap-1">
            {TASK_PRIORITIES.map((p) => {
              const cfg = PRIORITY_CONFIG[p];
              const PIcon = cfg.icon;
              return (
                <Button
                  key={p}
                  variant={filterPriority === p ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilterPriority(filterPriority === p ? null : p)}
                  className="gap-1 capitalize"
                >
                  <PIcon className="h-3 w-3" />{p}
                </Button>
              );
            })}
          </div>

          {/* Person filter */}
          <select
            value={filterPerson || ""}
            onChange={(e) => setFilterPerson(e.target.value || null)}
            className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs text-slate-700 outline-none"
          >
            <option value="">All staff</option>
            {activeStaff.map((s) => <option key={s.id} value={s.id}>{s.full_name}</option>)}
          </select>

          {/* View toggle */}
          <div className="flex gap-1 ml-auto">
            <Button variant={viewMode === "list"   ? "default" : "outline"} size="sm" onClick={() => setViewMode("list")}>List</Button>
            <Button variant={viewMode === "kanban" ? "default" : "outline"} size="sm" onClick={() => setViewMode("kanban")}>Board</Button>
          </div>

          <Button
            variant="outline" size="sm"
            onClick={() => setShowCompleted(!showCompleted)}
            className={cn(showCompleted && "bg-slate-100")}
          >
            <CheckCircle2 className="h-3.5 w-3.5" />{showCompleted ? "Hide" : "Show"} completed
          </Button>

          {hasFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              <RotateCcw className="h-3.5 w-3.5" />Clear
            </Button>
          )}
        </div>

        {/* ── List View ────────────────────────────────────────────────────── */}
        {viewMode === "list" && (
          <div className="space-y-2">
            {filtered.map((task) => {
              const overdue   = isOverdue(task.due_date, task.status);
              const dueToday  = isDueToday(task.due_date);
              const prio      = PRIORITY_CONFIG[task.priority];
              const stat      = STATUS_CONFIG[task.status];
              const StatusIcon = stat.icon;
              const PrioIcon   = prio.icon;
              const isComplete = task.status === "completed";

              return (
                <div
                  key={task.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => router.push(`/tasks/${task.id}`)}
                  onKeyDown={(e) => e.key === "Enter" && router.push(`/tasks/${task.id}`)}
                  className={cn(
                    "rounded-2xl border bg-white border-l-4 p-4 transition-all hover:shadow-md hover:-translate-y-0.5 cursor-pointer group",
                    prio.border,
                    overdue && "ring-1 ring-red-200",
                    isComplete && "opacity-60",
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className={cn("mt-0.5 rounded-full p-1.5 shrink-0", stat.bgColor)}>
                      <StatusIcon className={cn("h-4 w-4", stat.color)} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className={cn("text-sm font-semibold leading-snug", isComplete ? "line-through text-slate-400" : "text-slate-900")}>
                            {task.title}
                          </h4>
                          {task.description && (
                            <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{task.description}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {task.requires_sign_off && !task.signed_off_by && (
                            <Badge variant="warning" className="text-[9px] rounded-full gap-0.5">
                              <Shield className="h-3 w-3" />Sign-off
                            </Badge>
                          )}
                          {task.escalated && (
                            <Badge variant="destructive" className="text-[9px] rounded-full">Escalated</Badge>
                          )}
                        </div>
                      </div>

                      {/* Meta row */}
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <Badge className={cn("text-[10px] rounded-full border-0", prio.color)}>
                          <PrioIcon className="h-3 w-3 mr-0.5" />{prio.label}
                        </Badge>
                        <Badge variant="outline" className="text-[10px] rounded-full capitalize">
                          {TASK_CATEGORY_LABELS[task.category as keyof typeof TASK_CATEGORY_LABELS] || task.category}
                        </Badge>
                        {task.due_date && (
                          <span className={cn("text-[11px] font-medium flex items-center gap-1", overdue ? "text-red-600" : dueToday ? "text-orange-600" : "text-slate-500")}>
                            <CalendarDays className="h-3 w-3" />{formatRelative(task.due_date)}
                          </span>
                        )}
                        {task.estimated_minutes && (
                          <span className="text-[11px] text-slate-400 flex items-center gap-1">
                            <Timer className="h-3 w-3" />{task.estimated_minutes}m
                          </span>
                        )}
                        {task.recurring && <Badge variant="info" className="text-[9px] rounded-full">Recurring</Badge>}
                        {task.linked_child_id && (
                          <Badge variant="purple" className="text-[9px] rounded-full gap-0.5">
                            <Heart className="h-3 w-3" />{getYPName(task.linked_child_id)}
                          </Badge>
                        )}
                        {task.linked_incident_id && (
                          <Badge variant="destructive" className="text-[9px] rounded-full gap-0.5">
                            <AlertTriangle className="h-3 w-3" />{task.linked_incident_id.replace("inc_", "INC-")}
                          </Badge>
                        )}
                      </div>

                      {/* Assignee + open indicator */}
                      <div className="mt-2 flex items-center justify-between">
                        {task.assigned_to ? (
                          <div className="flex items-center gap-2">
                            <Avatar name={getStaffName(task.assigned_to)} size="xs" />
                            <span className="text-xs text-slate-600">{getStaffName(task.assigned_to)}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 flex items-center gap-1">
                            <User className="h-3 w-3" />Unassigned
                          </span>
                        )}
                        <ChevronRight className="h-4 w-4 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      {isComplete && task.evidence_note && (
                        <p className="mt-1 text-[10px] text-emerald-600 italic truncate">{task.evidence_note}</p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {filtered.length === 0 && (
              <div className="rounded-2xl border-2 border-dashed border-slate-200 p-12 text-center">
                <CheckSquare className="h-8 w-8 text-slate-300 mx-auto mb-3" />
                <div className="text-sm font-medium text-slate-500">No tasks match your filters</div>
                <div className="text-xs text-slate-400 mt-1">Try adjusting your search or filters</div>
              </div>
            )}
          </div>
        )}

        {/* ── Kanban View ──────────────────────────────────────────────────── */}
        {viewMode === "kanban" && (
          <div className="flex gap-4 overflow-x-auto pb-4">
            {(["not_started", "in_progress", "blocked", "completed"] as const).map((status) => {
              const cfg = STATUS_CONFIG[status];
              const colTasks = kanban[status] || [];
              return (
                <div key={status} className="flex-shrink-0 w-[300px]">
                  <div className="flex items-center gap-2 mb-3 px-1">
                    <div className={cn(
                      "h-2 w-2 rounded-full",
                      status === "not_started" ? "bg-slate-400" :
                      status === "in_progress"  ? "bg-blue-500"  :
                      status === "blocked"       ? "bg-red-500"   : "bg-emerald-500"
                    )} />
                    <span className="text-sm font-semibold text-slate-700">{cfg.label}</span>
                    <Badge variant="outline" className="rounded-full text-xs ml-auto">{colTasks.length}</Badge>
                  </div>
                  <div className="space-y-2">
                    {colTasks.map((task) => {
                      const overdue = isOverdue(task.due_date, task.status);
                      const prio    = PRIORITY_CONFIG[task.priority];
                      return (
                        <div
                          key={task.id}
                          role="button"
                          tabIndex={0}
                          onClick={() => router.push(`/tasks/${task.id}`)}
                          onKeyDown={(e) => e.key === "Enter" && router.push(`/tasks/${task.id}`)}
                          className={cn(
                            "rounded-xl border bg-white p-3 border-l-4 hover:shadow-md cursor-pointer transition-all",
                            prio.border,
                            overdue && "ring-1 ring-red-200",
                          )}
                        >
                          <div className="text-xs font-semibold text-slate-900 leading-snug">{task.title}</div>
                          <div className="mt-2 flex flex-wrap items-center gap-1.5">
                            <Badge className={cn("text-[9px] rounded-full border-0", prio.color)}>{prio.label}</Badge>
                            {task.due_date && (
                              <span className={cn("text-[10px]", overdue ? "text-red-600 font-semibold" : "text-slate-400")}>
                                {formatRelative(task.due_date)}
                              </span>
                            )}
                          </div>
                          {task.assigned_to && (
                            <div className="mt-2 flex items-center gap-1.5">
                              <Avatar name={getStaffName(task.assigned_to)} size="xs" />
                              <span className="text-[10px] text-slate-500">{getStaffName(task.assigned_to).split(" ")[0]}</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                    {colTasks.length === 0 && (
                      <div className="rounded-xl border-2 border-dashed border-slate-200 p-6 text-center text-xs text-slate-400">
                        No tasks
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </PageShell>
  );
}
