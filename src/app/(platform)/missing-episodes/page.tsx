"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — MISSING FROM CARE EPISODES
// Statutory log: Reg 34 / Children's Homes Regulations 2015.
// Tracks every episode a young person goes missing, police/LA notifications,
// and mandatory return-to-care interviews.
// ══════════════════════════════════════════════════════════════════════════════

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import {
  MapPin, UserX, AlertTriangle, CheckCircle2, Clock,
  Plus, X, ChevronRight, Shield, Phone, Building2,
  ClipboardCheck, Eye, BarChart3, Activity, TrendingUp,
  MessageSquare, Calendar, Timer, Loader2, Search,
  ArrowUpRight, Flag, Users,
} from "lucide-react";
import {
  useMissingEpisodes,
  useLogMissingEpisode,
  useUpdateMissingEpisode,
  type PatternAnalysisItem,
} from "@/hooks/use-missing-episodes";
import { useYoungPeople } from "@/hooks/use-young-people";
import { useStaff } from "@/hooks/use-staff";
import { getYPName, getStaffName } from "@/lib/seed-data";
import { cn, formatDate, todayStr } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";
import type { MissingEpisode } from "@/types/extended";

// ── Types ─────────────────────────────────────────────────────────────────────

type Tab = "active" | "all" | "patterns";

const RISK_COLORS: Record<string, string> = {
  low:      "bg-emerald-100 text-emerald-800 border-emerald-200",
  medium:   "bg-amber-100  text-amber-800  border-amber-200",
  high:     "bg-orange-100 text-orange-800 border-orange-200",
  critical: "bg-red-100    text-red-800    border-red-200",
};

const RISK_DOT: Record<string, string> = {
  low:      "bg-emerald-500",
  medium:   "bg-amber-500",
  high:     "bg-orange-500",
  critical: "bg-red-500",
};

const STATUS_COLORS: Record<string, string> = {
  active:   "bg-red-100    text-red-800    border-red-200",
  returned: "bg-amber-100  text-amber-800  border-amber-200",
  closed:   "bg-slate-100  text-slate-700  border-slate-200",
};

const RISK_LABELS: Record<string, string> = {
  low: "Low", medium: "Medium", high: "High", critical: "Critical",
};

// ── Stat Card ─────────────────────────────────────────────────────────────────

function StatCard({
  label, value, sub, urgent, icon: Icon,
}: {
  label: string; value: number | string; sub?: string; urgent?: boolean; icon: React.ElementType;
}) {
  return (
    <Card className={cn("border", urgent && Number(value) > 0 ? "border-red-300 bg-red-50" : "")}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">{label}</p>
            <p className={cn("text-2xl font-bold mt-1", urgent && Number(value) > 0 ? "text-red-700" : "text-slate-900")}>
              {value}
            </p>
            {sub && <p className="text-xs text-slate-500 mt-0.5">{sub}</p>}
          </div>
          <div className={cn("p-2 rounded-lg", urgent && Number(value) > 0 ? "bg-red-100" : "bg-slate-100")}>
            <Icon className={cn("h-4 w-4", urgent && Number(value) > 0 ? "text-red-600" : "text-slate-500")} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Episode Row ───────────────────────────────────────────────────────────────

function EpisodeRow({
  episode,
  onMarkReturned,
  onCompleteInterview,
}: {
  episode: MissingEpisode;
  onMarkReturned: (ep: MissingEpisode) => void;
  onCompleteInterview: (ep: MissingEpisode) => void;
}) {
  const ypName = getYPName(episode.child_id);

  // Duration display
  const durationLabel = episode.duration_hours != null
    ? episode.duration_hours < 1
      ? `${Math.round(episode.duration_hours * 60)}m`
      : `${episode.duration_hours}h`
    : episode.status === "active" ? "Ongoing" : "—";

  const interviewPending =
    episode.status === "closed" && !episode.return_interview_completed;
  const returnedPending = episode.status === "returned" && !episode.return_interview_completed;

  return (
    <div className="flex items-start gap-3 p-4 hover:bg-slate-50 transition-colors rounded-lg border border-transparent hover:border-slate-200">
      {/* Risk dot */}
      <div className="mt-1.5 flex-shrink-0">
        <div className={cn("h-2.5 w-2.5 rounded-full", RISK_DOT[episode.risk_level])} />
      </div>

      {/* Main info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-sm text-slate-900">{episode.reference}</span>
          <Badge variant="outline" className={cn("text-xs", RISK_COLORS[episode.risk_level])}>
            {RISK_LABELS[episode.risk_level]}
          </Badge>
          <Badge variant="outline" className={cn("text-xs", STATUS_COLORS[episode.status])}>
            {episode.status === "active" ? "🔴 Active" : episode.status === "returned" ? "Interview Pending" : "Closed"}
          </Badge>
          {episode.contextual_safeguarding_risk && (
            <Badge variant="outline" className="text-xs bg-purple-100 text-purple-800 border-purple-200">
              CS Risk
            </Badge>
          )}
          {interviewPending && (
            <Badge variant="outline" className="text-xs bg-amber-100 text-amber-800 border-amber-200">
              Interview Outstanding
            </Badge>
          )}
        </div>

        <div className="mt-1 flex items-center gap-3 text-xs text-slate-600 flex-wrap">
          <span className="font-medium text-slate-800">{ypName}</span>
          <span>·</span>
          <span>{formatDate(episode.date_missing)}</span>
          {episode.time_missing && <><span>·</span><span>{episode.time_missing}</span></>}
          <span>·</span>
          <span className="flex items-center gap-1"><Timer className="h-3 w-3" />{durationLabel}</span>
        </div>

        <p className="mt-1 text-xs text-slate-500 truncate max-w-xl">
          Last seen: {episode.location_last_seen}
        </p>

        {/* Notification status */}
        <div className="mt-2 flex items-center gap-3 text-xs">
          <span className={cn(
            "flex items-center gap-1",
            episode.reported_to_police ? "text-emerald-700" : "text-slate-400"
          )}>
            <Phone className="h-3 w-3" />
            {episode.reported_to_police ? `Police: ${episode.police_reference ?? "Notified"}` : "Police: Not reported"}
          </span>
          <span className={cn(
            "flex items-center gap-1",
            episode.reported_to_la ? "text-emerald-700" : "text-slate-400"
          )}>
            <Building2 className="h-3 w-3" />
            {episode.reported_to_la ? "LA: Notified" : "LA: Not notified"}
          </span>
          {episode.return_interview_completed && (
            <span className="flex items-center gap-1 text-emerald-700">
              <ClipboardCheck className="h-3 w-3" />
              Interview complete
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {episode.status === "active" && (
          <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => onMarkReturned(episode)}>
            Mark Returned
          </Button>
        )}
        {returnedPending && (
          <Button size="sm" variant="outline" className="text-xs h-7 border-amber-300 text-amber-700 hover:bg-amber-50" onClick={() => onCompleteInterview(episode)}>
            Complete Interview
          </Button>
        )}
        {interviewPending && (
          <Button size="sm" variant="outline" className="text-xs h-7 border-amber-300 text-amber-700 hover:bg-amber-50" onClick={() => onCompleteInterview(episode)}>
            Complete Interview
          </Button>
        )}
        <Link href={`/young-people/${episode.child_id}`}>
          <Button size="sm" variant="ghost" className="text-xs h-7">
            <Eye className="h-3 w-3 mr-1" />Profile
          </Button>
        </Link>
      </div>
    </div>
  );
}

// ── Pattern Card ──────────────────────────────────────────────────────────────

function PatternCard({ item }: { item: PatternAnalysisItem }) {
  return (
    <Card className={cn("border", item.contextual_risk ? "border-purple-200 bg-purple-50/30" : "")}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 text-xs rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-semibold flex-shrink-0">
              {item.child_name.charAt(0)}
            </div>
            <div>
              <p className="font-semibold text-sm text-slate-900">{item.child_name}</p>
              <p className="text-xs text-slate-500">{item.total_episodes} episodes recorded</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={cn("text-xs", RISK_COLORS[item.highest_risk])}>
              {RISK_LABELS[item.highest_risk]} risk
            </Badge>
            {item.contextual_risk && (
              <Badge variant="outline" className="text-xs bg-purple-100 text-purple-800 border-purple-200">
                CS Risk
              </Badge>
            )}
          </div>
        </div>

        <div className="mt-3 grid grid-cols-3 gap-2 text-center">
          <div className="bg-white rounded-lg border p-2">
            <p className="text-lg font-bold text-slate-900">{item.total_episodes}</p>
            <p className="text-xs text-slate-500">Total</p>
          </div>
          <div className="bg-white rounded-lg border p-2">
            <p className="text-lg font-bold text-slate-900">
              {item.avg_duration_hours > 0 ? `${item.avg_duration_hours}h` : "—"}
            </p>
            <p className="text-xs text-slate-500">Avg duration</p>
          </div>
          <div className={cn("rounded-lg border p-2", item.return_interview_outstanding ? "bg-amber-50 border-amber-200" : "bg-white")}>
            <p className="text-lg font-bold text-slate-900">
              {item.return_interview_outstanding ? "⚠" : "✓"}
            </p>
            <p className="text-xs text-slate-500">Interview</p>
          </div>
        </div>

        {item.last_episode_date && (
          <p className="mt-2 text-xs text-slate-500">
            Last episode: {formatDate(item.last_episode_date)}
          </p>
        )}

        <div className="mt-2">
          <Link href={`/young-people/${item.child_id}`}>
            <Button size="sm" variant="ghost" className="text-xs h-7 w-full justify-start text-slate-600">
              <ArrowUpRight className="h-3 w-3 mr-1" />View young person profile
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Log Episode Modal ─────────────────────────────────────────────────────────

const EMPTY_LOG = {
  child_id: "", date_missing: todayStr(), time_missing: "",
  risk_level: "medium" as const, location_last_seen: "",
};

function LogEpisodeModal({
  onClose, youngPeople,
}: {
  onClose: () => void;
  youngPeople: { id: string; name: string }[];
}) {
  const [form, setForm] = useState(EMPTY_LOG);
  const logEpisode = useLogMissingEpisode();
  const { toast } = useToast();

  const set = (field: string, value: string) => setForm((p) => ({ ...p, [field]: value }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.child_id) { toast("Select a young person", "error"); return; }
    if (!form.location_last_seen.trim()) { toast("Enter last known location", "error"); return; }
    try {
      await logEpisode.mutateAsync({
        child_id: form.child_id,
        date_missing: form.date_missing,
        time_missing: form.time_missing || undefined,
        risk_level: form.risk_level,
        location_last_seen: form.location_last_seen.trim(),
      });
      toast("Missing episode logged", "success");
      onClose();
    } catch {
      toast("Failed to log episode", "error");
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <UserX className="h-4 w-4 text-red-600" />Log Missing Episode
            </CardTitle>
            <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="text-xs font-medium text-slate-700 block mb-1">Young Person *</label>
              <select
                className="w-full rounded-md border border-slate-300 text-sm p-2 bg-white"
                value={form.child_id}
                onChange={(e) => set("child_id", e.target.value)}
              >
                <option value="">Select young person…</option>
                {youngPeople.map((yp) => (
                  <option key={yp.id} value={yp.id}>{yp.name}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1">Date Missing *</label>
                <Input
                  type="date"
                  className="text-sm h-9"
                  value={form.date_missing}
                  onChange={(e) => set("date_missing", e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1">Time Missing</label>
                <Input
                  type="time"
                  className="text-sm h-9"
                  value={form.time_missing}
                  onChange={(e) => set("time_missing", e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-700 block mb-1">Risk Level *</label>
              <div className="flex gap-2 flex-wrap">
                {(["low", "medium", "high", "critical"] as const).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => set("risk_level", r)}
                    className={cn(
                      "px-3 py-1 rounded-full text-xs border font-medium transition-colors",
                      form.risk_level === r
                        ? RISK_COLORS[r] + " font-semibold"
                        : "bg-white text-slate-600 border-slate-300 hover:bg-slate-50"
                    )}
                  >
                    {RISK_LABELS[r]}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-700 block mb-1">Last Known Location *</label>
              <Input
                placeholder="e.g. Left on foot towards town centre"
                className="text-sm h-9"
                value={form.location_last_seen}
                onChange={(e) => set("location_last_seen", e.target.value)}
              />
            </div>

            <div className="flex gap-2 pt-2">
              <Button type="button" variant="outline" size="sm" className="flex-1" onClick={onClose}>
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                disabled={logEpisode.isPending}
              >
                {logEpisode.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Log Episode"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Mark Returned Modal ───────────────────────────────────────────────────────

const EMPTY_RETURN = {
  date_returned: todayStr(), time_returned: "",
  return_location: "",
  reported_to_police: false, police_reference: "",
  reported_to_la: false, la_notified_at: "",
};

function MarkReturnedModal({
  episode, onClose,
}: {
  episode: MissingEpisode;
  onClose: () => void;
}) {
  const [form, setForm] = useState({
    ...EMPTY_RETURN,
    reported_to_police: episode.reported_to_police,
    police_reference: episode.police_reference ?? "",
    reported_to_la: episode.reported_to_la,
  });
  const updateEpisode = useUpdateMissingEpisode();
  const { toast } = useToast();

  const set = (field: string, value: string | boolean) =>
    setForm((p) => ({ ...p, [field]: value }));

  // Calculate duration
  function computeDuration() {
    try {
      const missDate = new Date(`${episode.date_missing}T${episode.time_missing || "00:00"}`);
      const retDate = new Date(`${form.date_returned}T${form.time_returned || "00:00"}`);
      const diffMs = retDate.getTime() - missDate.getTime();
      if (diffMs <= 0) return null;
      return Math.round((diffMs / (1000 * 60 * 60)) * 10) / 10;
    } catch { return null; }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.return_location.trim()) { toast("Enter return location", "error"); return; }
    const duration_hours = computeDuration();
    try {
      await updateEpisode.mutateAsync({
        id: episode.id,
        action: "mark_returned",
        date_returned: form.date_returned,
        time_returned: form.time_returned || null,
        return_location: form.return_location.trim(),
        duration_hours,
        reported_to_police: form.reported_to_police,
        police_reference: form.police_reference || null,
        reported_to_la: form.reported_to_la,
        la_notified_at: form.reported_to_la ? new Date().toISOString() : null,
      });
      toast("Episode updated — return logged", "success");
      onClose();
    } catch {
      toast("Failed to update episode", "error");
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />Mark Returned
            </CardTitle>
            <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {episode.reference} · {getYPName(episode.child_id)}
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1">Date Returned *</label>
                <Input type="date" className="text-sm h-9" value={form.date_returned} onChange={(e) => set("date_returned", e.target.value)} />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1">Time Returned</label>
                <Input type="time" className="text-sm h-9" value={form.time_returned} onChange={(e) => set("time_returned", e.target.value)} />
              </div>
            </div>

            {computeDuration() !== null && (
              <div className="bg-slate-50 rounded-lg p-2 text-xs text-slate-600 flex items-center gap-1">
                <Timer className="h-3.5 w-3.5" />
                Duration: <strong>{computeDuration()}h</strong>
              </div>
            )}

            <div>
              <label className="text-xs font-medium text-slate-700 block mb-1">Return Location *</label>
              <Input
                placeholder="e.g. Returned home voluntarily from town centre"
                className="text-sm h-9"
                value={form.return_location}
                onChange={(e) => set("return_location", e.target.value)}
              />
            </div>

            {/* Notifications */}
            <div className="space-y-2 border rounded-lg p-3">
              <p className="text-xs font-semibold text-slate-700 uppercase tracking-wide">Notifications</p>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.reported_to_police}
                  onChange={(e) => set("reported_to_police", e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm text-slate-700">Reported to Police</span>
              </label>
              {form.reported_to_police && (
                <Input
                  placeholder="Police reference number"
                  className="text-sm h-8 ml-5"
                  value={form.police_reference}
                  onChange={(e) => set("police_reference", e.target.value)}
                />
              )}

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.reported_to_la}
                  onChange={(e) => set("reported_to_la", e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm text-slate-700">Reported to Local Authority</span>
              </label>
            </div>

            <div className="flex gap-2 pt-2">
              <Button type="button" variant="outline" size="sm" className="flex-1" onClick={onClose}>Cancel</Button>
              <Button type="submit" size="sm" className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white" disabled={updateEpisode.isPending}>
                {updateEpisode.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirm Return"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Return Interview Modal ────────────────────────────────────────────────────

const EMPTY_INTERVIEW = {
  return_interview_by: "",
  return_interview_date: todayStr(),
  return_interview_notes: "",
  contextual_safeguarding_risk: false,
  pattern_notes: "",
};

function ReturnInterviewModal({
  episode, onClose, staff,
}: {
  episode: MissingEpisode;
  onClose: () => void;
  staff: { id: string; name: string }[];
}) {
  const [form, setForm] = useState({
    ...EMPTY_INTERVIEW,
    contextual_safeguarding_risk: episode.contextual_safeguarding_risk,
    pattern_notes: episode.pattern_notes ?? "",
  });
  const updateEpisode = useUpdateMissingEpisode();
  const { toast } = useToast();

  const set = (field: string, value: string | boolean) =>
    setForm((p) => ({ ...p, [field]: value }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.return_interview_by) { toast("Select the interviewing staff member", "error"); return; }
    if (!form.return_interview_notes.trim()) { toast("Enter interview notes", "error"); return; }
    try {
      await updateEpisode.mutateAsync({
        id: episode.id,
        action: "complete_interview",
        return_interview_by: form.return_interview_by,
        return_interview_date: form.return_interview_date,
        return_interview_notes: form.return_interview_notes.trim(),
        contextual_safeguarding_risk: form.contextual_safeguarding_risk,
        pattern_notes: form.pattern_notes.trim() || null,
      });
      toast("Return interview recorded — episode closed", "success");
      onClose();
    } catch {
      toast("Failed to record interview", "error");
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <ClipboardCheck className="h-4 w-4 text-blue-600" />Return to Care Interview
            </CardTitle>
            <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {episode.reference} · {getYPName(episode.child_id)}
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1">Conducted By *</label>
                <select
                  className="w-full rounded-md border border-slate-300 text-sm p-2 bg-white"
                  value={form.return_interview_by}
                  onChange={(e) => set("return_interview_by", e.target.value)}
                >
                  <option value="">Select staff…</option>
                  {staff.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1">Interview Date *</label>
                <Input type="date" className="text-sm h-9" value={form.return_interview_date} onChange={(e) => set("return_interview_date", e.target.value)} />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-700 block mb-1">Interview Notes *</label>
              <textarea
                className="w-full rounded-md border border-slate-300 text-sm p-2 min-h-[100px] resize-y"
                placeholder="Record what was discussed, any disclosures, concerns, agreements made with the young person…"
                value={form.return_interview_notes}
                onChange={(e) => set("return_interview_notes", e.target.value)}
              />
            </div>

            <label className="flex items-start gap-2 cursor-pointer p-2 rounded-lg border border-purple-200 bg-purple-50/50">
              <input
                type="checkbox"
                checked={form.contextual_safeguarding_risk}
                onChange={(e) => set("contextual_safeguarding_risk", e.target.checked)}
                className="rounded mt-0.5"
              />
              <div>
                <span className="text-sm font-medium text-purple-900">Contextual Safeguarding Risk Identified</span>
                <p className="text-xs text-purple-700 mt-0.5">Tick if this episode indicates exploitation, grooming, criminal exploitation, or unknown peer group risk.</p>
              </div>
            </label>

            <div>
              <label className="text-xs font-medium text-slate-700 block mb-1">Pattern / Trend Notes</label>
              <Input
                placeholder="e.g. Third episode this year — same location, late evening pattern"
                className="text-sm h-9"
                value={form.pattern_notes}
                onChange={(e) => set("pattern_notes", e.target.value)}
              />
            </div>

            <div className="flex gap-2 pt-2">
              <Button type="button" variant="outline" size="sm" className="flex-1" onClick={onClose}>Cancel</Button>
              <Button type="submit" size="sm" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white" disabled={updateEpisode.isPending}>
                {updateEpisode.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Record Interview & Close"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────

export default function MissingEpisodesPage() {
  const [tab, setTab] = useState<Tab>("active");
  const [search, setSearch] = useState("");
  const [logOpen, setLogOpen] = useState(false);
  const [returnEp, setReturnEp] = useState<MissingEpisode | null>(null);
  const [interviewEp, setInterviewEp] = useState<MissingEpisode | null>(null);

  const episodesQuery = useMissingEpisodes();
  const ypQuery = useYoungPeople();
  const staffQuery = useStaff();

  const allEpisodes = episodesQuery.data?.data ?? [];
  const meta = episodesQuery.data?.meta;
  const patterns = episodesQuery.data?.pattern_analysis ?? [];

  // Young people list for log modal
  const youngPeople = useMemo(() =>
    (ypQuery.data?.data ?? []).map((yp) => ({
      id: yp.id,
      name: `${yp.preferred_name ?? yp.first_name} ${yp.last_name}`,
    })), [ypQuery.data]);

  // Staff list for interview modal
  const staffList = useMemo(() =>
    (staffQuery.data?.data ?? [])
      .filter((s) => s.is_active)
      .map((s) => ({ id: s.id, name: `${s.first_name} ${s.last_name}` })),
    [staffQuery.data]);

  // Filtered episodes for each tab
  const activeEpisodes = useMemo(() =>
    allEpisodes.filter((e) => e.status === "active"),
    [allEpisodes]);

  const filteredAll = useMemo(() => {
    if (!search.trim()) return allEpisodes;
    const q = search.toLowerCase();
    return allEpisodes.filter((e) =>
      getYPName(e.child_id).toLowerCase().includes(q) ||
      e.reference.toLowerCase().includes(q) ||
      e.location_last_seen.toLowerCase().includes(q)
    );
  }, [allEpisodes, search]);

  if (episodesQuery.isLoading) {
    return (
      <PageShell title="Missing Episodes" subtitle="Missing from care log">
        <div className="flex items-center justify-center h-48 text-slate-400">
          <Loader2 className="h-6 w-6 animate-spin mr-2" /> Loading…
        </div>
      </PageShell>
    );
  }

  const unresolvedInterviews = allEpisodes.filter(
    (e) => (e.status === "returned" || e.status === "closed") && !e.return_interview_completed
  );

  return (
    <PageShell
      title="Missing from Care"
      subtitle="Log and track episodes where young people are absent without consent (Reg 34)"
    >
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard label="Active" value={meta?.active ?? 0} icon={UserX} urgent />
        <StatCard label="This Month" value={meta?.this_month ?? 0} icon={Calendar} />
        <StatCard label="This Year" value={meta?.this_year ?? 0} icon={BarChart3} />
        <StatCard label="CS Risk" value={meta?.contextual_risk ?? 0} icon={Shield} urgent />
        <StatCard label="Total Episodes" value={meta?.total ?? 0} icon={Activity} />
        <StatCard label="Interviews O/S" value={meta?.unresolved ?? 0} icon={ClipboardCheck} urgent />
      </div>

      {/* Outstanding interview banner */}
      {unresolvedInterviews.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-3">
          <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1 text-sm">
            <span className="font-semibold text-amber-800">
              {unresolvedInterviews.length} return interview{unresolvedInterviews.length > 1 ? "s" : ""} outstanding
            </span>
            <span className="text-amber-700"> — return-to-care interviews are mandatory and must be completed within 72 hours.</span>
          </div>
        </div>
      )}

      {/* Header actions */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex gap-1 border rounded-lg p-1 bg-slate-50">
          {([
            { id: "active",   label: "Active",          badge: activeEpisodes.length },
            { id: "all",      label: "All Episodes" },
            { id: "patterns", label: "Pattern Analysis" },
          ] as const).map(({ id, label, ...rest }) => {
            const badge = 'badge' in rest ? rest.badge : undefined;
            return (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={cn(
                  "px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5",
                  tab === id
                    ? "bg-white shadow-sm text-slate-900"
                    : "text-slate-600 hover:text-slate-900"
                )}
              >
                {label}
                {badge !== undefined && badge > 0 && (
                  <span className="bg-red-500 text-white text-xs rounded-full h-4 min-w-4 flex items-center justify-center px-1">
                    {badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
        <Button
          size="sm"
          className="bg-red-600 hover:bg-red-700 text-white"
          onClick={() => setLogOpen(true)}
        >
          <Plus className="h-4 w-4 mr-1" />Log Episode
        </Button>
      </div>

      {/* ── Active Tab ── */}
      {tab === "active" && (
        <Card>
          <CardContent className="p-0">
            {activeEpisodes.length === 0 ? (
              <div className="p-12 text-center">
                <CheckCircle2 className="h-10 w-10 text-emerald-400 mx-auto mb-3" />
                <p className="font-medium text-slate-700">No active missing episodes</p>
                <p className="text-sm text-slate-500 mt-1">All young people are currently accounted for.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {activeEpisodes.map((ep) => (
                  <EpisodeRow
                    key={ep.id}
                    episode={ep}
                    onMarkReturned={setReturnEp}
                    onCompleteInterview={setInterviewEp}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── All Episodes Tab ── */}
      {tab === "all" && (
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search by name, reference, or location…"
              className="pl-9 text-sm h-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Card>
            <CardContent className="p-0">
              {filteredAll.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-sm">No episodes found.</div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {filteredAll.map((ep) => (
                    <EpisodeRow
                      key={ep.id}
                      episode={ep}
                      onMarkReturned={setReturnEp}
                      onCompleteInterview={setInterviewEp}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── Pattern Analysis Tab ── */}
      {tab === "patterns" && (
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800 flex items-start gap-2">
            <TrendingUp className="h-4 w-4 flex-shrink-0 mt-0.5" />
            <span>
              Pattern analysis helps identify trends and recurring risk factors across missing episodes.
              Escalate to your Responsible Individual if patterns indicate contextual safeguarding concerns.
            </span>
          </div>

          {patterns.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-sm">
              No pattern data available.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {patterns.map((p) => (
                <PatternCard key={p.child_id} item={p} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      {logOpen && (
        <LogEpisodeModal
          onClose={() => setLogOpen(false)}
          youngPeople={youngPeople}
        />
      )}
      {returnEp && (
        <MarkReturnedModal
          episode={returnEp}
          onClose={() => setReturnEp(null)}
        />
      )}
      {interviewEp && (
        <ReturnInterviewModal
          episode={interviewEp}
          onClose={() => setInterviewEp(null)}
          staff={staffList}
        />
      )}
    </PageShell>
  );
}
