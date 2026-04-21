"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — CARE FORMS LIST PAGE
// ══════════════════════════════════════════════════════════════════════════════

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { PageShell } from "@/components/layout/page-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar } from "@/components/ui/avatar";
import {
  Search, FileText, RotateCcw, Clock, CheckCircle2, XCircle,
  AlertTriangle, Archive, ChevronRight, Heart, CalendarDays,
  Pencil, Loader2, AlertCircle, BookOpen,
} from "lucide-react";
import { useForms } from "@/hooks/use-forms";
import { usePermissions } from "@/hooks/use-permissions";
import { PERMISSIONS } from "@/lib/permissions";
import { CARE_FORM_TYPE_LABELS, CARE_FORM_TYPES } from "@/lib/constants";
import { cn, todayStr, formatRelative } from "@/lib/utils";
import { getStaffName, getYPName } from "@/lib/seed-data";
import type { CareForm } from "@/types";

// ── Context for QuickCreate ───────────────────────────────────────────────────
const FORMS_QUICK_CREATE_CONTEXT = { module: "forms", preferredTab: "form" } as const;

// ── Status display config ─────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string; icon: React.ElementType }> = {
  draft:          { label: "Draft",          color: "text-slate-500",   bgColor: "bg-slate-100",   icon: Pencil       },
  submitted:      { label: "Submitted",      color: "text-blue-600",    bgColor: "bg-blue-100",    icon: Clock        },
  pending_review: { label: "Pending Review", color: "text-amber-600",   bgColor: "bg-amber-100",   icon: AlertTriangle },
  approved:       { label: "Approved",       color: "text-emerald-600", bgColor: "bg-emerald-100", icon: CheckCircle2 },
  rejected:       { label: "Rejected",       color: "text-red-600",     bgColor: "bg-red-100",     icon: XCircle      },
  archived:       { label: "Archived",       color: "text-slate-400",   bgColor: "bg-slate-100",   icon: Archive      },
};

const PRIORITY_CONFIG: Record<string, { label: string; color: string; border: string }> = {
  urgent: { label: "Urgent", color: "bg-red-100 text-red-800",       border: "border-l-red-600"   },
  high:   { label: "High",   color: "bg-orange-100 text-orange-800", border: "border-l-orange-500" },
  medium: { label: "Medium", color: "bg-blue-100 text-blue-800",     border: "border-l-blue-400"  },
  low:    { label: "Low",    color: "bg-slate-100 text-slate-600",   border: "border-l-slate-300"  },
};

// ── Stat card ─────────────────────────────────────────────────────────────────

function StatCard({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
  return (
    <div className={cn("rounded-2xl border bg-white p-4 text-center", highlight && value > 0 && "border-red-200 bg-red-50")}>
      <div className={cn("text-2xl font-bold", highlight && value > 0 ? "text-red-600" : "text-slate-900")}>{value}</div>
      <div className="text-xs text-slate-500 mt-0.5">{label}</div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

export default function FormsPage() {
  const router = useRouter();
  const { can } = usePermissions();
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string | null>(null);
  const [filterPriority, setFilterPriority] = useState<string | null>(null);
  const today = todayStr();

  const formsQuery = useForms();
  const forms: CareForm[] = useMemo(() => formsQuery.data?.data ?? [], [formsQuery.data?.data]);
  const meta = formsQuery.data?.meta;

  const filtered = useMemo(() => {
    let list = forms;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((f) =>
        f.title.toLowerCase().includes(q) ||
        f.description?.toLowerCase().includes(q) ||
        f.tags.some((t) => t.toLowerCase().includes(q))
      );
    }
    if (filterStatus)   list = list.filter((f) => f.status === filterStatus);
    if (filterType)     list = list.filter((f) => f.form_type === filterType);
    if (filterPriority) list = list.filter((f) => f.priority === filterPriority);
    return list;
  }, [forms, search, filterStatus, filterType, filterPriority]);

  const clearFilters = () => { setSearch(""); setFilterStatus(null); setFilterType(null); setFilterPriority(null); };
  const hasFilters = search || filterStatus || filterType || filterPriority;

  const canApprove = can(PERMISSIONS.APPROVE_FORMS);

  if (formsQuery.isError) {
    return (
      <PageShell title="Care Forms" quickCreateContext={FORMS_QUICK_CREATE_CONTEXT}>
        <div className="flex flex-col items-center gap-3 py-24 text-center">
          <AlertCircle className="h-10 w-10 text-red-400" />
          <p className="text-sm font-medium text-slate-600">Failed to load forms</p>
          <Button size="sm" variant="outline" onClick={() => formsQuery.refetch()}>Retry</Button>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Care Forms"
      subtitle={`${filtered.length} form${filtered.length !== 1 ? "s" : ""} ${hasFilters ? "(filtered)" : ""}`}
      quickCreateContext={FORMS_QUICK_CREATE_CONTEXT}
      actions={
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push("/forms/templates")}
          className="gap-2"
        >
          <BookOpen className="h-4 w-4" />
          Template Library
        </Button>
      }
    >
      <div className="space-y-5 animate-fade-in">

        {/* ── Summary stats ──────────────────────────────────────────────── */}
        {meta && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <StatCard label="Total" value={meta.total} />
            <StatCard label="Draft" value={meta.draft} />
            <StatCard label="Awaiting Review" value={meta.pending_review} highlight />
            <StatCard label="Approved" value={meta.approved} />
            <StatCard label="Overdue" value={meta.overdue} highlight />
            <StatCard label="Urgent" value={meta.urgent} highlight />
          </div>
        )}

        {/* ── Toolbar ─────────────────────────────────────────────────────── */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search forms…" className="pl-9" />
          </div>

          {/* Status filter */}
          <div className="flex gap-1 flex-wrap">
            {(["draft", "submitted", "pending_review", "approved", "rejected"] as const).map((s) => {
              const cfg = STATUS_CONFIG[s];
              return (
                <Button
                  key={s} size="sm"
                  variant={filterStatus === s ? "default" : "outline"}
                  onClick={() => setFilterStatus(filterStatus === s ? null : s)}
                  className="gap-1"
                >
                  {cfg.label}
                </Button>
              );
            })}
          </div>

          {/* Type filter */}
          <select
            value={filterType || ""}
            onChange={(e) => setFilterType(e.target.value || null)}
            className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs text-slate-700 outline-none"
          >
            <option value="">All types</option>
            {CARE_FORM_TYPES.map((t) => (
              <option key={t} value={t}>{CARE_FORM_TYPE_LABELS[t]}</option>
            ))}
          </select>

          {/* Priority filter */}
          <select
            value={filterPriority || ""}
            onChange={(e) => setFilterPriority(e.target.value || null)}
            className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs text-slate-700 outline-none"
          >
            <option value="">All priorities</option>
            {(["urgent", "high", "medium", "low"] as const).map((p) => (
              <option key={p} value={p} className="capitalize">{p.charAt(0).toUpperCase() + p.slice(1)}</option>
            ))}
          </select>

          {hasFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              <RotateCcw className="h-3.5 w-3.5" />Clear
            </Button>
          )}
        </div>

        {/* ── Loading skeleton ─────────────────────────────────────────────── */}
        {formsQuery.isLoading && (
          <div className="flex items-center justify-center py-16 gap-2 text-slate-400">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="text-sm">Loading forms…</span>
          </div>
        )}

        {/* ── Forms list ───────────────────────────────────────────────────── */}
        {!formsQuery.isLoading && (
          <div className="space-y-2">
            {filtered.map((form) => {
              const stat    = STATUS_CONFIG[form.status] ?? STATUS_CONFIG.draft;
              const prio    = PRIORITY_CONFIG[form.priority];
              const StatusIcon = stat.icon;
              const isOverdue = form.due_date && form.due_date < today && form.status !== "approved" && form.status !== "archived";
              const childName = form.linked_child_id ? getYPName(form.linked_child_id) : null;
              const submitterName = form.submitted_by ? getStaffName(form.submitted_by) : null;

              return (
                <div
                  key={form.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => router.push(`/forms/${form.id}`)}
                  onKeyDown={(e) => e.key === "Enter" && router.push(`/forms/${form.id}`)}
                  className={cn(
                    "rounded-2xl border bg-white border-l-4 p-4 transition-all hover:shadow-md hover:-translate-y-0.5 cursor-pointer group",
                    prio.border,
                    isOverdue && "ring-1 ring-red-200",
                  )}
                >
                  <div className="flex items-start gap-3">
                    {/* Status icon */}
                    <div className={cn("mt-0.5 rounded-full p-1.5 shrink-0", stat.bgColor)}>
                      <StatusIcon className={cn("h-4 w-4", stat.color)} />
                    </div>

                    <div className="flex-1 min-w-0">
                      {/* Title row */}
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="text-sm font-semibold text-slate-900 leading-snug">{form.title}</h4>
                          {form.description && (
                            <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{form.description}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {form.priority === "urgent" && (
                            <Badge variant="destructive" className="text-[9px] rounded-full gap-0.5">
                              <AlertTriangle className="h-3 w-3" />Urgent
                            </Badge>
                          )}
                          <ChevronRight className="h-4 w-4 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </div>

                      {/* Meta row */}
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        {/* Type */}
                        <Badge variant="outline" className="text-[10px] rounded-full">
                          <FileText className="h-3 w-3 mr-0.5" />
                          {CARE_FORM_TYPE_LABELS[form.form_type as keyof typeof CARE_FORM_TYPE_LABELS] ?? form.form_type}
                        </Badge>

                        {/* Status */}
                        <Badge className={cn("text-[10px] rounded-full border-0", stat.bgColor, stat.color)}>
                          {stat.label}
                        </Badge>

                        {/* Priority */}
                        <Badge className={cn("text-[10px] rounded-full border-0", prio.color)}>{prio.label}</Badge>

                        {/* Due date */}
                        {form.due_date && (
                          <span className={cn("text-[11px] font-medium flex items-center gap-1", isOverdue ? "text-red-600" : "text-slate-500")}>
                            <CalendarDays className="h-3 w-3" />{formatRelative(form.due_date)}
                          </span>
                        )}

                        {/* Linked child */}
                        {childName && (
                          <Badge variant="purple" className="text-[9px] rounded-full gap-0.5">
                            <Heart className="h-3 w-3" />{childName}
                          </Badge>
                        )}

                        {/* Tags */}
                        {form.tags.slice(0, 3).map((tag) => (
                          <span key={tag} className="text-[10px] text-slate-400 bg-slate-50 rounded-full px-2 py-0.5 border border-slate-200">
                            #{tag}
                          </span>
                        ))}
                      </div>

                      {/* Footer: submitted by + approve action */}
                      <div className="mt-2 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {submitterName ? (
                            <>
                              <Avatar name={submitterName} size="xs" />
                              <span className="text-xs text-slate-500">Submitted by {submitterName}</span>
                              {form.submitted_at && (
                                <span className="text-[11px] text-slate-400">{formatRelative(form.submitted_at.slice(0, 10))}</span>
                              )}
                            </>
                          ) : (
                            <span className="text-xs text-slate-400 italic">Not yet submitted</span>
                          )}
                        </div>
                        {/* Quick approve for managers */}
                        {canApprove && (form.status === "submitted" || form.status === "pending_review") && (
                          <Badge variant="warning" className="text-[10px] rounded-full cursor-pointer hover:bg-amber-200 transition-colors">
                            Needs review
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {!formsQuery.isLoading && filtered.length === 0 && (
              <div className="rounded-2xl border-2 border-dashed border-slate-200 p-12 text-center">
                <FileText className="h-8 w-8 text-slate-300 mx-auto mb-3" />
                <div className="text-sm font-medium text-slate-500">No forms match your filters</div>
                <div className="text-xs text-slate-400 mt-1">Try adjusting your search or filters, or create a new form</div>
              </div>
            )}
          </div>
        )}
      </div>
    </PageShell>
  );
}
