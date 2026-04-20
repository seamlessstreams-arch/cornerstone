"use client";

import React, { useState, useMemo } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import {
  MessageSquare, Plus, CheckCircle2, AlertTriangle, Clock,
  Calendar, Target, Award, Smile, Meh, Frown, UserCheck,
  ClipboardList, X, Loader2,
} from "lucide-react";
import { useStaff } from "@/hooks/use-staff";
import { cn, formatDate, daysFromNow, todayStr } from "@/lib/utils";
import { useSupervisions, useCreateSupervision } from "@/hooks/use-supervision";
import type { Supervision } from "@/types";

type Tab = "supervision" | "probation" | "appraisals" | "goals";

// ── Static reference data (uses real staff IDs from seed) ────────────────────

const APPRAISALS = [
  { staffId: "staff_ryan",     date: daysFromNow(-90),  rating: "effective",   completedBy: "staff_darren", nextDue: daysFromNow(275), objectives: 4, achieved: 3 },
  { staffId: "staff_anna",     date: daysFromNow(-180), rating: "developing",  completedBy: "staff_ryan",   nextDue: daysFromNow(185), objectives: 3, achieved: 2 },
  { staffId: "staff_chervelle",date: null,              rating: null,          completedBy: null,           nextDue: daysFromNow(30),  objectives: 0, achieved: 0 },
  { staffId: "staff_edward",   date: daysFromNow(-200), rating: "exceptional", completedBy: "staff_darren", nextDue: daysFromNow(165), objectives: 5, achieved: 5 },
  { staffId: "staff_diane",    date: null,              rating: null,          completedBy: null,           nextDue: daysFromNow(150), objectives: 0, achieved: 0 },
];

const GOALS = [
  { id: "g1", staffId: "staff_ryan",      title: "Complete Level 4 Diploma Unit 5",                        targetDate: daysFromNow(60),  progress: 65,  status: "in_progress" },
  { id: "g2", staffId: "staff_ryan",      title: "Lead three house meetings independently",                 targetDate: daysFromNow(30),  progress: 100, status: "achieved" },
  { id: "g3", staffId: "staff_anna",      title: "Improve medication recording accuracy",                   targetDate: daysFromNow(45),  progress: 80,  status: "in_progress" },
  { id: "g4", staffId: "staff_edward",    title: "Mentor new bank staff member",                            targetDate: daysFromNow(14),  progress: 40,  status: "in_progress" },
  { id: "g5", staffId: "staff_chervelle", title: "Complete Child Sexual Exploitation awareness training",   targetDate: daysFromNow(-10), progress: 0,   status: "overdue" },
  { id: "g6", staffId: "staff_diane",     title: "Complete induction training portfolio",                   targetDate: daysFromNow(20),  progress: 55,  status: "in_progress" },
  { id: "g7", staffId: "staff_lackson",   title: "NVQ Level 3 Children and Young People",                   targetDate: daysFromNow(90),  progress: 30,  status: "in_progress" },
  { id: "g8", staffId: "staff_mirela",    title: "Lead a risk assessment review independently",             targetDate: daysFromNow(28),  progress: 50,  status: "in_progress" },
];

const PROBATION = [
  { staffId: "staff_diane",    startDate: daysFromNow(-90), endDate: daysFromNow(90),   status: "active", reviews: 1, nextReview: daysFromNow(30), concerns: ["Timekeeping — discussed 14 March"] },
  { staffId: "staff_mirela",   startDate: daysFromNow(-60), endDate: daysFromNow(120),  status: "active", reviews: 1, nextReview: daysFromNow(60), concerns: [] },
  { staffId: "staff_anna",     startDate: daysFromNow(-400), endDate: daysFromNow(-220), status: "passed", reviews: 2, nextReview: null, concerns: [] },
];

const RATING_COLORS: Record<string, string> = {
  exceptional: "bg-emerald-100 text-emerald-700",
  effective: "bg-blue-100 text-blue-700",
  developing: "bg-amber-100 text-amber-700",
  requires_support: "bg-red-100 text-red-700",
};

function WellbeingIcon({ score }: { score: number | null }) {
  if (score === null) return <span className="text-slate-400 text-xs">—</span>;
  if (score >= 7) return <Smile className="h-4 w-4 text-emerald-500" />;
  if (score >= 5) return <Meh className="h-4 w-4 text-amber-500" />;
  return <Frown className="h-4 w-4 text-red-500" />;
}

function SupervisionCard({ sup }: { sup: Supervision }) {
  const cardStaffQuery = useStaff();
  const cardAllStaff = cardStaffQuery.data?.data ?? [];
  const staff = cardAllStaff.find((s) => s.id === sup.staff_id);
  const supervisor = cardAllStaff.find((s) => s.id === sup.supervisor_id);
  const statusConfig = {
    completed: { label: "Completed", color: "bg-emerald-100 text-emerald-700" },
    scheduled: { label: "Scheduled", color: "bg-blue-100 text-blue-700" },
    cancelled: { label: "Cancelled", color: "bg-slate-100 text-slate-500" },
    rescheduled: { label: "Rescheduled", color: "bg-amber-100 text-amber-700" },
  }[sup.status];
  const typeLabel = {
    formal: "Formal Supervision",
    informal: "Informal Check-in",
    group: "Group Supervision",
    reflective_practice: "Reflective Practice",
    probation_review: "Probation Review",
  }[sup.type];
  const pendingActions = sup.actions_agreed.filter((a) => a.status === "pending");

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3 hover:shadow-md transition-all">
      <div className="flex items-start gap-3">
        <Avatar name={staff?.full_name || "?"} size="sm" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-slate-900">{staff?.full_name}</span>
            <Badge className={cn("text-[9px] rounded-full", statusConfig.color)}>{statusConfig.label}</Badge>
            {sup.type === "probation_review" && <Badge className="text-[9px] rounded-full bg-purple-100 text-purple-700">Probation</Badge>}
          </div>
          <div className="text-xs text-slate-500 mt-0.5">{typeLabel} · {formatDate(sup.scheduled_date)}</div>
          <div className="text-xs text-slate-400">With {supervisor?.first_name || "?"} · {sup.duration_minutes ? `${sup.duration_minutes} mins` : "Scheduled"}</div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {sup.wellbeing_score !== null && (
            <div className="flex items-center gap-1 text-xs text-slate-500">
              <WellbeingIcon score={sup.wellbeing_score} />
              {sup.wellbeing_score}/10
            </div>
          )}
        </div>
      </div>

      {sup.status === "completed" && sup.discussion_points && (
        <div className="rounded-xl bg-slate-50 p-3 text-xs text-slate-600 line-clamp-2">{sup.discussion_points}</div>
      )}

      {pendingActions.length > 0 && (
        <div className="space-y-1.5">
          <div className="text-[10px] font-semibold text-slate-500">Actions agreed ({pendingActions.length} pending)</div>
          {pendingActions.map((action) => (
            <div key={action.id} className="flex items-center gap-2 text-xs">
              <div className="h-1.5 w-1.5 rounded-full bg-amber-400 shrink-0" />
              <span className="text-slate-700 flex-1 truncate">{action.description}</span>
              <span className="text-slate-400 shrink-0">{formatDate(action.due_date)}</span>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center gap-2">
        {sup.status === "scheduled" ? (
          <Button size="sm" className="h-7 text-xs flex-1" disabled title="Begin the supervision and record notes in the physical file or supervision form.">Start Supervision</Button>
        ) : (
          <Button size="sm" variant="outline" className="h-7 text-xs flex-1" disabled title="Full supervision records are stored in the Documents section.">View Record</Button>
        )}
        {sup.status === "completed" && (
          <div className="flex items-center gap-1 text-[10px] text-slate-400">
            {sup.staff_signature && sup.supervisor_signature ? (
              <><CheckCircle2 className="h-3 w-3 text-emerald-500" />Signed</>
            ) : (
              <><Clock className="h-3 w-3 text-amber-500" />Unsigned</>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Schedule Supervision Modal ────────────────────────────────────────────────

function ScheduleModal({ onClose }: { onClose: () => void }) {
  const createSupervision = useCreateSupervision();
  const modalStaffQuery = useStaff();
  const modalAllStaff = (modalStaffQuery.data?.data ?? []).filter((s) => s.is_active);
  const activeStaff = modalAllStaff.filter((s) => s.role !== "responsible_individual");
  const supervisors = modalAllStaff.filter((s) => s.role === "registered_manager" || s.role === "deputy_manager" || s.role === "team_leader");

  const [form, setForm] = useState({
    staff_id: "",
    supervisor_id: "staff_darren",
    type: "formal" as Supervision["type"],
    scheduled_date: daysFromNow(7),
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  function handleSubmit() {
    if (!form.staff_id || !form.scheduled_date) { setError("Staff member and date are required."); return; }
    setError("");
    createSupervision.mutate(
      {
        ...form,
        status: "scheduled",
        home_id: "home_oak",
        created_by: "staff_darren",
        updated_by: "staff_darren",
        actions_agreed: [],
        discussion_points: "",
        staff_signature: false,
        supervisor_signature: false,
        wellbeing_score: null,
        actual_date: null,
        duration_minutes: null,
        next_date: null,
        linked_document_id: null,
      } as Partial<Supervision>,
      {
        onSuccess: () => { setSuccess(true); setTimeout(onClose, 1200); },
        onError: (e) => setError(e.message),
      }
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 space-y-5" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-base font-bold text-slate-900">Schedule Supervision</div>
            <div className="text-xs text-slate-500 mt-0.5">Book a supervision session for a team member</div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        {success ? (
          <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
            <span className="text-sm font-medium text-emerald-800">Supervision scheduled successfully.</span>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1.5">Staff Member <span className="text-red-500">*</span></label>
                <select
                  value={form.staff_id}
                  onChange={(e) => setForm((p) => ({ ...p, staff_id: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
                >
                  <option value="">Select staff member…</option>
                  {activeStaff.map((s) => (
                    <option key={s.id} value={s.id}>{s.full_name} — {s.job_title}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1.5">Supervisor</label>
                <select
                  value={form.supervisor_id}
                  onChange={(e) => setForm((p) => ({ ...p, supervisor_id: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
                >
                  {supervisors.map((s) => (
                    <option key={s.id} value={s.id}>{s.full_name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1.5">Type</label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm((p) => ({ ...p, type: e.target.value as Supervision["type"] }))}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  >
                    <option value="formal">Formal Supervision</option>
                    <option value="informal">Informal Check-in</option>
                    <option value="group">Group Supervision</option>
                    <option value="reflective_practice">Reflective Practice</option>
                    <option value="probation_review">Probation Review</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1.5">Date <span className="text-red-500">*</span></label>
                  <Input
                    type="date"
                    value={form.scheduled_date}
                    onChange={(e) => setForm((p) => ({ ...p, scheduled_date: e.target.value }))}
                    className="text-sm"
                  />
                </div>
              </div>

              {error && <p className="text-xs text-red-600">{error}</p>}
            </div>

            <div className="flex items-center gap-3 pt-1">
              <Button
                onClick={handleSubmit}
                disabled={!form.staff_id || !form.scheduled_date || createSupervision.isPending}
                className="flex-1"
              >
                {createSupervision.isPending ? (
                  <><Loader2 className="h-3.5 w-3.5 animate-spin" />Saving…</>
                ) : (
                  <><Calendar className="h-3.5 w-3.5" />Schedule</>
                )}
              </Button>
              <Button variant="outline" onClick={onClose}>Cancel</Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function SupervisionPage() {
  const [tab, setTab] = useState<Tab>("supervision");
  const [scheduleOpen, setScheduleOpen] = useState(false);

  const staffQuery = useStaff();
  const allActiveStaff = useMemo(
    () => (staffQuery.data?.data ?? []).filter((s) => s.is_active),
    [staffQuery.data?.data]
  );
  const activeNonRI = useMemo(
    () => allActiveStaff.filter((s) => s.role !== "responsible_individual"),
    [allActiveStaff]
  );

  const supervisionsQuery = useSupervisions();
  const supervisionRecords: Supervision[] = useMemo(
    () => supervisionsQuery.data?.data ?? [],
    [supervisionsQuery.data?.data]
  );

  const stats = useMemo(() => {
    const today = todayStr();
    const due = allActiveStaff.filter((s) => s.next_supervision_due && s.next_supervision_due < today);
    const upcoming = allActiveStaff.filter((s) => s.next_supervision_due && s.next_supervision_due >= today && s.next_supervision_due <= daysFromNow(14));
    const completed = supervisionRecords.filter((s) => s.status === "completed").length;
    const appraisalsDue = APPRAISALS.filter((a) => a.nextDue <= daysFromNow(30)).length;
    return { overdue: due.length, upcoming: upcoming.length, completed, appraisalsDue };
  }, [supervisionRecords, allActiveStaff]);

  const tabs = [
    { id: "supervision" as Tab, label: "Supervision", icon: MessageSquare },
    { id: "probation" as Tab, label: "Probation", icon: UserCheck },
    { id: "appraisals" as Tab, label: "Appraisals", icon: Award },
    { id: "goals" as Tab, label: "Goals", icon: Target },
  ];

  return (
    <>
    {scheduleOpen && <ScheduleModal onClose={() => setScheduleOpen(false)} />}
    <PageShell
      title="Supervision & Performance"
      subtitle="Supervision records, probation, appraisals, and individual goal tracking"
      quickCreateContext={{ module: "supervision", defaultTaskCategory: "supervision", defaultFormType: "supervision_record", preferredTab: "form" }}
      actions={
        <Button size="sm" onClick={() => setScheduleOpen(true)}>
          <Plus className="h-3.5 w-3.5" />Schedule Supervision
        </Button>
      }
    >
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: "Supervisions Overdue", value: stats.overdue, icon: AlertTriangle, color: "text-red-600", bg: "bg-red-50" },
            { label: "Due in 14 Days", value: stats.upcoming, icon: Clock, color: "text-amber-600", bg: "bg-amber-50" },
            { label: "Completed This Quarter", value: stats.completed, icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50" },
            { label: "Appraisals Due", value: stats.appraisalsDue, icon: Award, color: "text-blue-600", bg: "bg-blue-50" },
          ].map(({ label, value, icon: Icon, color, bg }) => (
            <div key={label} className="rounded-2xl border border-slate-200 bg-white p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">{label}</div>
                  <div className={cn("mt-1 text-3xl font-bold tabular-nums", color)}>{value}</div>
                </div>
                <div className={cn("rounded-2xl p-3", bg)}>
                  <Icon className={cn("h-5 w-5", color)} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-slate-100 rounded-xl p-1 w-fit">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={cn(
                "flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                tab === id ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
              )}
            >
              <Icon className="h-3.5 w-3.5" />{label}
            </button>
          ))}
        </div>

        {/* Supervision tab */}
        {tab === "supervision" && (
          <div className="space-y-5">
            {/* Overdue banner */}
            {stats.overdue > 0 && (
              <div className="rounded-2xl bg-red-50 border border-red-200 p-4 flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-red-600 shrink-0" />
                <div className="text-sm text-red-800">
                  <strong>{stats.overdue} staff member{stats.overdue > 1 ? "s" : ""}</strong> are overdue for supervision.
                  Minimum supervision frequency must be maintained under Reg 34(3) CSCS.
                </div>
              </div>
            )}

            {/* Staff supervision status */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {activeNonRI.map((staff) => {
                const lastSup = supervisionRecords.filter((s) => s.staff_id === staff.id && s.status === "completed")
                  .sort((a, b) => (b.actual_date || "").localeCompare(a.actual_date || "")).at(0);
                const nextSup = supervisionRecords.find((s) => s.staff_id === staff.id && s.status === "scheduled");
                const isOverdue = staff.next_supervision_due && staff.next_supervision_due < todayStr();
                const isDueSoon = staff.next_supervision_due && staff.next_supervision_due >= todayStr() && staff.next_supervision_due <= daysFromNow(14);

                return (
                  <div key={staff.id} className={cn(
                    "rounded-2xl border p-4 space-y-3",
                    isOverdue ? "border-red-200 bg-red-50" : isDueSoon ? "border-amber-200 bg-amber-50" : "border-slate-200 bg-white"
                  )}>
                    <div className="flex items-center gap-3">
                      <Avatar name={staff.full_name} size="sm" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-slate-900 truncate">{staff.full_name}</div>
                        <div className="text-xs text-slate-500">{staff.job_title}</div>
                      </div>
                      {isOverdue ? (
                        <Badge className="text-[9px] rounded-full bg-red-100 text-red-700">Overdue</Badge>
                      ) : isDueSoon ? (
                        <Badge className="text-[9px] rounded-full bg-amber-100 text-amber-700">Due soon</Badge>
                      ) : (
                        <Badge className="text-[9px] rounded-full bg-emerald-100 text-emerald-700">Current</Badge>
                      )}
                    </div>
                    <div className="space-y-1 text-xs text-slate-600">
                      <div className="flex justify-between">
                        <span>Last supervision</span>
                        <span className="font-medium">{lastSup ? formatDate(lastSup.actual_date || lastSup.scheduled_date) : "None recorded"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Next due</span>
                        <span className={cn("font-medium", isOverdue ? "text-red-600" : isDueSoon ? "text-amber-600" : "text-slate-900")}>
                          {staff.next_supervision_due ? formatDate(staff.next_supervision_due) : "Not set"}
                        </span>
                      </div>
                      {lastSup?.wellbeing_score && (
                        <div className="flex justify-between">
                          <span>Last wellbeing</span>
                          <span className="flex items-center gap-1 font-medium">
                            <WellbeingIcon score={lastSup.wellbeing_score} />{lastSup.wellbeing_score}/10
                          </span>
                        </div>
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant={isOverdue ? "default" : "outline"}
                      className={cn("w-full h-7 text-xs", isOverdue && "bg-red-600 hover:bg-red-700")}
                      onClick={() => setScheduleOpen(true)}
                    >
                      {nextSup ? "View Scheduled" : "Schedule Now"}
                    </Button>
                  </div>
                );
              })}
            </div>

            {/* Recent supervision records */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2"><ClipboardList className="h-4 w-4 text-blue-500" />Recent Supervision Records</CardTitle>
              </CardHeader>
              <CardContent>
                {supervisionsQuery.isPending ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
                  </div>
                ) : supervisionRecords.length === 0 ? (
                  <div className="py-8 text-center text-sm text-slate-400">No supervision records yet. Schedule one above.</div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {supervisionRecords.map((sup) => <SupervisionCard key={sup.id} sup={sup} />)}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Probation tab */}
        {tab === "probation" && (
          <div className="space-y-5">
            {PROBATION.map((prob) => {
              const staff = allActiveStaff.find((s) => s.id === prob.staffId);
              const nowTime = new Date().getTime();
              const daysLeft = prob.endDate ? Math.max(0, Math.ceil((new Date(prob.endDate).getTime() - nowTime) / 86400000)) : 0;
              const totalDays = Math.ceil((new Date(prob.endDate || "").getTime() - new Date(prob.startDate).getTime()) / 86400000);
              const elapsed = totalDays - daysLeft;
              const pct = totalDays > 0 ? Math.round((elapsed / totalDays) * 100) : 100;

              return (
                <Card key={prob.staffId}>
                  <CardContent className="pt-5">
                    <div className="flex items-start gap-4">
                      <Avatar name={staff?.full_name || "?"} size="md" />
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center gap-3 flex-wrap">
                          <span className="text-base font-semibold text-slate-900">{staff?.full_name}</span>
                          <Badge className={cn("text-[10px] rounded-full", prob.status === "active" ? "bg-blue-100 text-blue-700" : "bg-emerald-100 text-emerald-700")}>
                            {prob.status === "active" ? "On Probation" : "Passed"}
                          </Badge>
                          {prob.status === "active" && daysLeft < 30 && (
                            <Badge className="text-[10px] rounded-full bg-amber-100 text-amber-700">{daysLeft}d remaining</Badge>
                          )}
                        </div>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <div className="text-[10px] text-slate-400 mb-0.5">Started</div>
                            <div className="font-medium text-slate-900">{formatDate(prob.startDate)}</div>
                          </div>
                          <div>
                            <div className="text-[10px] text-slate-400 mb-0.5">{prob.status === "passed" ? "Completed" : "Due to end"}</div>
                            <div className="font-medium text-slate-900">{formatDate(prob.endDate || "")}</div>
                          </div>
                          <div>
                            <div className="text-[10px] text-slate-400 mb-0.5">Reviews done</div>
                            <div className="font-medium text-slate-900">{prob.reviews}</div>
                          </div>
                        </div>
                        {prob.status === "active" && (
                          <div>
                            <div className="flex justify-between text-xs mb-1.5">
                              <span className="text-slate-500">Probation progress</span>
                              <span className="font-medium text-slate-900">{pct}%</span>
                            </div>
                            <Progress value={pct} color={pct > 80 ? "bg-emerald-500" : "bg-blue-500"} />
                          </div>
                        )}
                        {prob.concerns.length > 0 && (
                          <div className="rounded-xl bg-amber-50 border border-amber-200 p-3">
                            <div className="text-xs font-semibold text-amber-800 mb-1">Concerns on record</div>
                            {prob.concerns.map((c, i) => (
                              <div key={i} className="text-xs text-amber-700 flex items-start gap-1.5">
                                <AlertTriangle className="h-3 w-3 shrink-0 mt-0.5" />{c}
                              </div>
                            ))}
                          </div>
                        )}
                        {prob.nextReview && (
                          <div className="flex items-center gap-2 text-sm text-slate-600">
                            <Calendar className="h-4 w-4 text-blue-500" />
                            Next review: <strong>{formatDate(prob.nextReview)}</strong>
                          </div>
                        )}
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" className="h-8 text-xs" disabled title="Probation history is stored in the staff member's HR file.">View history</Button>
                          {prob.status === "active" && <Button size="sm" className="h-8 text-xs" disabled title="Schedule probation reviews through your HR system.">Schedule review</Button>}
                          {prob.status === "active" && daysLeft === 0 && (
                            <Button size="sm" className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700" disabled title="Probation sign-off must be recorded in the staff HR file and confirmed with your RI.">Confirm passed</Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Appraisals tab */}
        {tab === "appraisals" && (
          <div className="space-y-4">
            {activeNonRI.map((staff) => {
              const appraisal = APPRAISALS.find((a) => a.staffId === staff.id);
              const isDueSoon = appraisal?.nextDue && appraisal.nextDue <= daysFromNow(30);
              const isOverdue = appraisal?.nextDue && appraisal.nextDue < todayStr();
              const objectivePct = appraisal && appraisal.objectives > 0 ? Math.round((appraisal.achieved / appraisal.objectives) * 100) : 0;

              return (
                <div key={staff.id} className={cn(
                  "rounded-2xl border p-4 flex items-center gap-5 hover:shadow-md transition-all",
                  isOverdue ? "border-red-200 bg-red-50" : isDueSoon ? "border-amber-200 bg-amber-50" : "border-slate-200 bg-white"
                )}>
                  <Avatar name={staff.full_name} size="md" />
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="text-sm font-semibold text-slate-900">{staff.full_name}</span>
                      <span className="text-xs text-slate-500">{staff.job_title}</span>
                      {appraisal?.rating && (
                        <Badge className={cn("text-[9px] rounded-full capitalize", RATING_COLORS[appraisal.rating])}>
                          {appraisal.rating}
                        </Badge>
                      )}
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-xs text-slate-600">
                      <div>
                        <span className="text-slate-400">Last appraisal</span>
                        <div className="font-medium text-slate-900">{appraisal?.date ? formatDate(appraisal.date) : "None"}</div>
                      </div>
                      <div>
                        <span className="text-slate-400">Next due</span>
                        <div className={cn("font-medium", isOverdue ? "text-red-600" : isDueSoon ? "text-amber-600" : "text-slate-900")}>
                          {appraisal?.nextDue ? formatDate(appraisal.nextDue) : "Not set"}
                        </div>
                      </div>
                      <div>
                        <span className="text-slate-400">Objectives</span>
                        <div className="font-medium text-slate-900">{appraisal?.achieved || 0}/{appraisal?.objectives || 0} achieved</div>
                      </div>
                    </div>
                    {appraisal && appraisal.objectives > 0 && (
                      <Progress value={objectivePct} color={objectivePct === 100 ? "bg-emerald-500" : "bg-blue-500"} className="h-1.5" />
                    )}
                  </div>
                  <div className="flex gap-2 shrink-0">
                    {isOverdue && <Button size="sm" className="h-8 text-xs bg-red-600 hover:bg-red-700" disabled title="Book the appraisal and record it in the Documents section when complete.">Start Appraisal</Button>}
                    {isDueSoon && !isOverdue && <Button size="sm" className="h-8 text-xs" disabled title="Schedule this appraisal through your HR system.">Schedule</Button>}
                    {!isDueSoon && !isOverdue && <Button size="sm" variant="outline" className="h-8 text-xs" disabled title="Appraisal records are stored in the Documents section.">View</Button>}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Goals tab */}
        {tab === "goals" && (
          <div className="space-y-4">
            {allActiveStaff.map((staff) => {
              const staffGoals = GOALS.filter((g) => g.staffId === staff.id);
              if (staffGoals.length === 0) return null;
              return (
                <Card key={staff.id}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-3">
                      <Avatar name={staff.full_name} size="sm" />
                      <CardTitle className="text-sm font-semibold">{staff.full_name}</CardTitle>
                      <span className="text-xs text-slate-400">{staffGoals.filter((g) => g.status === "achieved").length}/{staffGoals.length} achieved</span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {staffGoals.map((goal) => (
                        <div key={goal.id} className={cn(
                          "flex items-center gap-4 rounded-xl px-3 py-2.5 border",
                          goal.status === "achieved" ? "bg-emerald-50 border-emerald-200" :
                          goal.status === "overdue" ? "bg-red-50 border-red-200" :
                          "bg-slate-50 border-slate-200"
                        )}>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-slate-900 truncate">{goal.title}</div>
                            <div className="text-xs text-slate-500 mt-0.5">Due {formatDate(goal.targetDate)}</div>
                            <Progress
                              value={goal.progress}
                              color={goal.status === "achieved" ? "bg-emerald-500" : goal.status === "overdue" ? "bg-red-500" : "bg-blue-500"}
                              className="h-1.5 mt-2"
                            />
                          </div>
                          <div className="text-center shrink-0">
                            <div className={cn("text-sm font-bold", goal.status === "achieved" ? "text-emerald-600" : goal.status === "overdue" ? "text-red-600" : "text-blue-600")}>
                              {goal.progress}%
                            </div>
                          </div>
                          <Badge className={cn("text-[9px] rounded-full shrink-0",
                            goal.status === "achieved" ? "bg-emerald-100 text-emerald-700" :
                            goal.status === "overdue" ? "bg-red-100 text-red-700" :
                            "bg-blue-100 text-blue-700"
                          )}>
                            {goal.status.replace("_", " ")}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </PageShell>
    </>
  );
}
