"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — SUPERVISION DETAIL PAGE
// Full record for a single supervision session: discussion points, actions
// agreed, wellbeing score, signatures, and mark-complete flow.
// ══════════════════════════════════════════════════════════════════════════════

import React, { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { PageShell } from "@/components/layout/page-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import {
  ArrowLeft, Loader2, AlertCircle, CheckCircle2, Clock, Calendar,
  Users, MessageSquare, Heart, Award, ClipboardList, Pencil,
  CheckSquare, Square, Shield, AlertTriangle, Star,
} from "lucide-react";
import { useSupervision, useUpdateSupervision } from "@/hooks/use-supervision";
import { useStaff } from "@/hooks/use-staff";
import { SUPERVISION_TYPE_LABELS } from "@/lib/constants";
import { cn, formatDate } from "@/lib/utils";
import type { SupervisionAction } from "@/types";

// ── Helpers ───────────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  completed:   { label: "Completed",   bg: "bg-emerald-100", text: "text-emerald-700", border: "border-emerald-200" },
  scheduled:   { label: "Scheduled",   bg: "bg-blue-100",    text: "text-blue-700",    border: "border-blue-200"    },
  cancelled:   { label: "Cancelled",   bg: "bg-slate-100",   text: "text-slate-500",   border: "border-slate-200"   },
  rescheduled: { label: "Rescheduled", bg: "bg-amber-100",   text: "text-amber-700",   border: "border-amber-200"   },
} as const;

function WellbeingBar({ score }: { score: number }) {
  const color = score >= 8 ? "bg-emerald-500" : score >= 5 ? "bg-amber-400" : "bg-red-500";
  const label = score >= 8 ? "Positive" : score >= 5 ? "Moderate" : "Struggling";
  const labelColor = score >= 8 ? "text-emerald-700" : score >= 5 ? "text-amber-700" : "text-red-700";
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="text-slate-600">Wellbeing Score</span>
        <span className={cn("font-bold text-lg", labelColor)}>{score}<span className="text-xs font-normal text-slate-400">/10</span></span>
      </div>
      <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden">
        <div className={cn("h-full rounded-full transition-all", color)} style={{ width: `${score * 10}%` }} />
      </div>
      <div className={cn("text-xs font-medium", labelColor)}>{label}</div>
    </div>
  );
}

// ── Action Item ───────────────────────────────────────────────────────────────

function ActionItem({
  action,
  supervisionId,
  onToggle,
  isPending,
}: {
  action: SupervisionAction;
  supervisionId: string;
  onToggle: (actionId: string, done: boolean) => void;
  isPending: boolean;
}) {
  const isDone = action.status === "completed";
  const isOverdue = !isDone && action.due_date < new Date().toISOString().slice(0, 10);

  return (
    <div className={cn(
      "flex items-start gap-3 rounded-xl border px-4 py-3 transition-all",
      isDone ? "bg-emerald-50 border-emerald-200" :
      isOverdue ? "bg-red-50 border-red-200" :
      "bg-white border-slate-200"
    )}>
      <button
        onClick={() => onToggle(action.id, !isDone)}
        disabled={isPending}
        className="mt-0.5 shrink-0 text-slate-400 hover:text-slate-700 disabled:opacity-50 transition-colors"
      >
        {isDone
          ? <CheckSquare className="h-4 w-4 text-emerald-600" />
          : <Square className="h-4 w-4" />
        }
      </button>
      <div className="flex-1 min-w-0">
        <p className={cn("text-sm", isDone ? "line-through text-slate-400" : "text-slate-800")}>{action.description}</p>
        <div className="flex items-center gap-3 mt-1 text-xs">
          <span className="text-slate-400">Owner: <span className="text-slate-600">{action.owner}</span></span>
          <span className={cn("font-medium", isOverdue && !isDone ? "text-red-600" : "text-slate-400")}>
            Due {formatDate(action.due_date)}
          </span>
          {isDone && action.completed_at && (
            <span className="text-emerald-600">Completed {formatDate(action.completed_at.slice(0, 10))}</span>
          )}
        </div>
      </div>
      {isOverdue && !isDone && (
        <AlertTriangle className="h-3.5 w-3.5 text-red-400 shrink-0 mt-0.5" />
      )}
    </div>
  );
}

// ── Complete Modal ────────────────────────────────────────────────────────────

function CompleteModal({
  supervisionId,
  onClose,
}: {
  supervisionId: string;
  onClose: () => void;
}) {
  const updateSupervision = useUpdateSupervision();
  const [notes, setNotes] = useState("");
  const [wellbeing, setWellbeing] = useState(7);
  const [actualDate, setActualDate] = useState(new Date().toISOString().slice(0, 10));
  const [duration, setDuration] = useState(60);
  const [error, setError] = useState("");

  function handleSave() {
    updateSupervision.mutate(
      {
        id: supervisionId,
        status: "completed",
        actual_date: actualDate,
        duration_minutes: duration,
        wellbeing_score: wellbeing,
        discussion_points: notes || undefined,
        staff_signature: true,
        supervisor_signature: true,
      },
      {
        onSuccess: () => onClose(),
        onError: (e) => setError(e.message),
      }
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl p-6 space-y-5" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900">Complete Supervision</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl leading-none">×</button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-600">Actual Date</label>
            <input
              type="date"
              value={actualDate}
              onChange={(e) => setActualDate(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-600">Duration (minutes)</label>
            <input
              type="number"
              value={duration}
              min={15}
              max={240}
              onChange={(e) => setDuration(Number(e.target.value))}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-medium text-slate-600">Wellbeing Score: <strong className="text-slate-900">{wellbeing}/10</strong></label>
          <input
            type="range"
            min={1} max={10}
            value={wellbeing}
            onChange={(e) => setWellbeing(Number(e.target.value))}
            className="w-full accent-slate-900"
          />
          <div className="flex justify-between text-[10px] text-slate-400">
            <span>Struggling (1)</span><span>Excellent (10)</span>
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-600">Additional Discussion Notes <span className="text-slate-400">(optional)</span></label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Any additional notes from the session…"
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-slate-300 placeholder:text-slate-400"
          />
        </div>

        {error && <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

        <div className="flex gap-3 pt-1">
          <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button
            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
            onClick={handleSave}
            disabled={updateSupervision.isPending}
          >
            {updateSupervision.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
            Mark Complete
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function SupervisionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [showCompleteModal, setShowCompleteModal] = useState(false);

  const { data: supervision, isLoading, isError } = useSupervision(id ?? "");
  const staffQuery = useStaff();
  const allStaff = staffQuery.data?.data ?? [];
  const updateSupervision = useUpdateSupervision();

  const staffMember = allStaff.find((s) => s.id === supervision?.staff_id);
  const supervisor  = allStaff.find((s) => s.id === supervision?.supervisor_id);

  // ── Loading state ──────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <PageShell title="Supervision Record" showQuickCreate={false}>
        <div className="flex items-center justify-center py-24 text-slate-400">
          <Loader2 className="h-8 w-8 animate-spin mr-3" />
          <span className="text-sm">Loading supervision record…</span>
        </div>
      </PageShell>
    );
  }

  if (isError || !supervision) {
    return (
      <PageShell title="Not found" showQuickCreate={false}>
        <div className="max-w-md mx-auto mt-12 text-center space-y-4">
          <AlertCircle className="h-12 w-12 text-red-400 mx-auto" />
          <p className="text-sm text-slate-600">This supervision record could not be found.</p>
          <Link href="/supervision">
            <Button variant="outline"><ArrowLeft className="h-4 w-4 mr-1" />Back to Supervision</Button>
          </Link>
        </div>
      </PageShell>
    );
  }

  const statusCfg = STATUS_CONFIG[supervision.status] ?? STATUS_CONFIG.scheduled;
  const typeLabel = SUPERVISION_TYPE_LABELS[supervision.type] ?? supervision.type;
  const actions = supervision.actions_agreed ?? [];
  const pendingActions = actions.filter((a) => a.status === "pending");
  const completedActions = actions.filter((a) => a.status === "completed");

  // ── Toggle action complete ─────────────────────────────────────────────────
  function toggleAction(actionId: string, done: boolean) {
    const updated: SupervisionAction[] = actions.map((a) =>
      a.id === actionId
        ? { ...a, status: done ? "completed" : "pending", completed_at: done ? new Date().toISOString() : null }
        : a
    );
    updateSupervision.mutate({ id: supervision!.id, actions_agreed: updated });
  }

  const isProbation = supervision.type === "probation_review";
  const isBothSigned = supervision.staff_signature && supervision.supervisor_signature;

  return (
    <>
      <PageShell
        title={typeLabel}
        subtitle={`${formatDate(supervision.scheduled_date)}${supervision.actual_date && supervision.actual_date !== supervision.scheduled_date ? ` · Held ${formatDate(supervision.actual_date)}` : ""}`}
        showQuickCreate={false}
        actions={
          <div className="flex items-center gap-2">
            <Link href="/supervision">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-3.5 w-3.5 mr-1" />Supervisions
              </Button>
            </Link>
            {staffMember && (
              <Link href={`/staff/${staffMember.id}`}>
                <Button variant="outline" size="sm">
                  <Users className="h-3.5 w-3.5 mr-1" />Staff Profile
                </Button>
              </Link>
            )}
            {supervision.status === "scheduled" && (
              <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => setShowCompleteModal(true)}>
                <CheckCircle2 className="h-3.5 w-3.5 mr-1" />Complete
              </Button>
            )}
          </div>
        }
      >
        <div className="space-y-5">
          {/* ── Header card ───────────────────────────────────────────────── */}
          <div className="rounded-3xl border bg-white p-6">
            <div className="flex flex-col sm:flex-row items-start gap-5">
              <div className="relative shrink-0">
                <Avatar name={staffMember?.full_name ?? "?"} size="xl" />
                {isProbation && (
                  <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-purple-500 border-2 border-white flex items-center justify-center">
                    <Award className="h-2.5 w-2.5 text-white" />
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">{staffMember?.full_name ?? "Unknown Staff"}</h2>
                    <p className="text-sm text-slate-500 mt-0.5">{staffMember?.job_title}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span className={cn("text-xs rounded-full px-3 py-1 font-semibold border", statusCfg.bg, statusCfg.text, statusCfg.border)}>
                      {statusCfg.label}
                    </span>
                    <span className="text-xs rounded-full px-3 py-1 font-medium bg-slate-100 text-slate-600 border border-slate-200">
                      {typeLabel}
                    </span>
                    {isProbation && (
                      <span className="text-xs rounded-full px-3 py-1 font-medium bg-purple-100 text-purple-700 border border-purple-200">
                        Probation Review
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap gap-5 mt-4 text-sm text-slate-500">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="h-4 w-4" />Scheduled: {formatDate(supervision.scheduled_date)}
                  </span>
                  {supervision.actual_date && (
                    <span className="flex items-center gap-1.5">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />Held: {formatDate(supervision.actual_date)}
                    </span>
                  )}
                  {supervision.duration_minutes && (
                    <span className="flex items-center gap-1.5">
                      <Clock className="h-4 w-4" />{supervision.duration_minutes} minutes
                    </span>
                  )}
                  {supervisor && (
                    <span className="flex items-center gap-1.5">
                      <Users className="h-4 w-4" />Supervisor: {supervisor.full_name}
                    </span>
                  )}
                </div>

                {supervision.next_date && (
                  <div className="mt-3 inline-flex items-center gap-1.5 text-xs bg-blue-50 border border-blue-200 text-blue-700 rounded-full px-3 py-1">
                    <Calendar className="h-3 w-3" />Next supervision due: {formatDate(supervision.next_date)}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── Wellbeing ──────────────────────────────────────────────────── */}
          {supervision.wellbeing_score !== null && supervision.wellbeing_score !== undefined && (
            <div className="rounded-2xl border bg-white p-5">
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Heart className="h-3.5 w-3.5" />Wellbeing
              </h3>
              <WellbeingBar score={supervision.wellbeing_score} />
            </div>
          )}

          {/* ── Discussion points ──────────────────────────────────────────── */}
          {supervision.discussion_points && (
            <div className="rounded-2xl border bg-white p-5">
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                <MessageSquare className="h-3.5 w-3.5" />Discussion Points
              </h3>
              <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">{supervision.discussion_points}</p>
            </div>
          )}

          {/* ── Actions agreed ─────────────────────────────────────────────── */}
          {actions.length > 0 && (
            <div className="rounded-2xl border bg-white p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                  <ClipboardList className="h-3.5 w-3.5" />Actions Agreed
                </h3>
                <span className="text-xs text-slate-500">
                  {completedActions.length}/{actions.length} complete
                </span>
              </div>

              {actions.length > 1 && (
                <div className="flex items-center gap-3">
                  <Progress value={(completedActions.length / actions.length) * 100} className="h-1.5 flex-1" />
                  <span className="text-xs text-slate-500 shrink-0">{Math.round((completedActions.length / actions.length) * 100)}%</span>
                </div>
              )}

              <div className="space-y-2">
                {/* Pending first */}
                {pendingActions.map((action) => (
                  <ActionItem
                    key={action.id}
                    action={action}
                    supervisionId={supervision.id}
                    onToggle={toggleAction}
                    isPending={updateSupervision.isPending}
                  />
                ))}
                {completedActions.map((action) => (
                  <ActionItem
                    key={action.id}
                    action={action}
                    supervisionId={supervision.id}
                    onToggle={toggleAction}
                    isPending={updateSupervision.isPending}
                  />
                ))}
              </div>
            </div>
          )}

          {/* ── Signatures ─────────────────────────────────────────────────── */}
          <div className="rounded-2xl border bg-white p-5">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Shield className="h-3.5 w-3.5" />Signatures
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className={cn(
                "rounded-xl border p-4 text-center",
                supervision.staff_signature ? "border-emerald-200 bg-emerald-50" : "border-slate-200 bg-slate-50"
              )}>
                <div className="mb-2">
                  {supervision.staff_signature
                    ? <CheckCircle2 className="h-6 w-6 text-emerald-600 mx-auto" />
                    : <Clock className="h-6 w-6 text-slate-400 mx-auto" />
                  }
                </div>
                <p className="text-xs font-semibold text-slate-700">{staffMember?.full_name ?? "Staff Member"}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  {supervision.staff_signature ? "Signed" : "Awaiting signature"}
                </p>
              </div>
              <div className={cn(
                "rounded-xl border p-4 text-center",
                supervision.supervisor_signature ? "border-emerald-200 bg-emerald-50" : "border-slate-200 bg-slate-50"
              )}>
                <div className="mb-2">
                  {supervision.supervisor_signature
                    ? <CheckCircle2 className="h-6 w-6 text-emerald-600 mx-auto" />
                    : <Clock className="h-6 w-6 text-slate-400 mx-auto" />
                  }
                </div>
                <p className="text-xs font-semibold text-slate-700">{supervisor?.full_name ?? "Supervisor"}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  {supervision.supervisor_signature ? "Signed" : "Awaiting signature"}
                </p>
              </div>
            </div>
            {isBothSigned && (
              <div className="mt-3 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-2.5 flex items-center gap-2 text-sm text-emerald-700">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>This supervision record is fully signed off.</span>
              </div>
            )}
          </div>

          {/* ── Complete CTA for scheduled sessions ───────────────────────── */}
          {supervision.status === "scheduled" && (
            <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-blue-800">Ready to complete this session?</p>
                <p className="text-xs text-blue-600 mt-0.5">Record the outcome, wellbeing score and confirm both signatures.</p>
              </div>
              <Button
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-white shrink-0"
                onClick={() => setShowCompleteModal(true)}
              >
                <CheckCircle2 className="h-3.5 w-3.5 mr-1" />Complete Session
              </Button>
            </div>
          )}
        </div>
      </PageShell>

      {showCompleteModal && (
        <CompleteModal supervisionId={supervision.id} onClose={() => setShowCompleteModal(false)} />
      )}
    </>
  );
}
