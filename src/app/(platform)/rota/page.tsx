"use client";

import React, { useState, useMemo } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import {
  ChevronLeft, ChevronRight, Plus, Clock,
  Sun, UserX, CheckCircle2, Loader2,
} from "lucide-react";
import { useRota, useCreateShift } from "@/hooks/use-rota";
import { useStaff } from "@/hooks/use-staff";
import { cn, todayStr, formatDate } from "@/lib/utils";
import { SHIFT_TYPE_LABELS, SHIFT_TYPES } from "@/lib/constants";
import { useToast } from "@/components/ui/toast";

const SHIFT_COLORS: Record<string, string> = {
  day: "bg-emerald-100 text-emerald-800 border-emerald-200",
  sleep_in: "bg-indigo-100 text-indigo-800 border-indigo-200",
  waking_night: "bg-violet-100 text-violet-800 border-violet-200",
  short: "bg-sky-100 text-sky-800 border-sky-200",
  handover: "bg-amber-100 text-amber-800 border-amber-200",
  on_call: "bg-slate-100 text-slate-700 border-slate-200",
  training_day: "bg-blue-100 text-blue-800 border-blue-200",
};

function getMondayOfWeek(offset: number): string {
  const d = new Date();
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff + offset * 7);
  return d.toISOString().slice(0, 10);
}

export default function RotaPage() {
  const [weekOffset, setWeekOffset] = useState(0);
  const [showAddShift, setShowAddShift] = useState(false);
  const [addShiftForm, setAddShiftForm] = useState({ staff_id: "", date: todayStr(), shift_type: "day", start_time: "07:00", end_time: "15:00", break_minutes: "30", notes: "" });
  const [addShiftError, setAddShiftError] = useState("");
  const [rotaPublished, setRotaPublished] = useState(false);
  const createShift = useCreateShift();
  const today = todayStr();

  const weekStart = useMemo(() => getMondayOfWeek(weekOffset), [weekOffset]);

  const weekDates = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStart + "T00:00:00");
      d.setDate(d.getDate() + i);
      return d.toISOString().slice(0, 10);
    });
  }, [weekStart]);

  const weekLabel = useMemo(() => {
    const s = new Date(weekDates[0] + "T00:00:00");
    const e = new Date(weekDates[6] + "T00:00:00");
    return `${s.toLocaleDateString("en-GB", { day: "numeric", month: "short" })} – ${e.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}`;
  }, [weekDates]);

  const rotaQuery = useRota(weekStart);
  const staffQuery = useStaff();
  const { toast } = useToast();

  const shifts = rotaQuery.data?.shifts ?? [];
  const leave = rotaQuery.data?.leave ?? [];
  const meta = rotaQuery.data?.meta;
  const activeStaff = (staffQuery.data?.data ?? []).filter((s) => s.role !== "responsible_individual");

  const todayShifts = shifts.filter((s) => s.date === today && !s.is_open_shift);
  const isLoading = rotaQuery.isPending || staffQuery.isPending;

  return (
    <>
    <PageShell
      title="Rota"
      subtitle={weekLabel}
      quickCreateContext={{ module: "rota", defaultTaskCategory: "staffing" }}
      actions={
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowAddShift(true)}>
            <Plus className="h-3.5 w-3.5" /> Add Shift
          </Button>
          <Button size="sm" disabled={rotaPublished} onClick={() => setRotaPublished(true)}>
            {rotaPublished ? "Rota Published" : "Publish Rota"}
          </Button>
        </div>
      }
    >
      <div className="space-y-6 animate-fade-in">

        {/* Today's Summary */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { label: "On Shift Today",    value: meta?.on_shift_today    ?? "—", color: "text-emerald-600" },
            { label: "Sleep-ins Tonight", value: meta?.sleep_ins_tonight ?? "—", color: "text-indigo-600" },
            { label: "Open Shifts",       value: meta?.open_shifts       ?? "—", color: meta?.open_shifts ? "text-amber-600" : "text-slate-900", ring: (meta?.open_shifts ?? 0) > 0 },
            { label: "On Leave",          value: meta?.on_leave_today    ?? "—", color: "text-blue-600" },
            { label: "Late Arrivals",     value: meta?.late_arrivals     ?? "—", color: meta?.late_arrivals ? "text-red-600" : "text-emerald-600" },
          ].map(({ label, value, color, ring }) => (
            <div key={label} className={cn("rounded-2xl border bg-white p-4 text-center", ring && "ring-1 ring-amber-200")}>
              <div className={cn("text-2xl font-bold tabular-nums", color)}>{value}</div>
              <div className="text-xs text-slate-500">{label}</div>
            </div>
          ))}
        </div>

        {/* Open Shift Alerts */}
        {(meta?.open_shift_dates?.length ?? 0) > 0 && (
          <div className="rounded-2xl bg-amber-50 border border-amber-200 p-4">
            <div className="flex items-center gap-2 mb-2">
              <UserX className="h-4 w-4 text-amber-600" />
              <span className="text-sm font-semibold text-amber-800">Open Shifts Need Covering</span>
            </div>
            <div className="space-y-1.5">
              {meta!.open_shift_dates.map((s, i) => (
                <div key={i} className="flex items-center justify-between rounded-xl bg-white px-3 py-2 border border-amber-100">
                  <div className="text-xs">
                    <span className="font-medium text-slate-900">{formatDate(s.date)}</span>
                    <span className="text-slate-500 ml-2">{s.start} – {s.end}</span>
                    <span className="text-slate-400 ml-2">({SHIFT_TYPE_LABELS[s.type as keyof typeof SHIFT_TYPE_LABELS] || s.type})</span>
                  </div>
                  <div className="flex gap-1.5">
                    <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => toast(`Shift on ${s.date} offered to bank staff. Bank workers will be notified via the staff portal.`, "info")}>Offer to Bank</Button>
                    <Button size="sm" className="text-xs h-7 bg-amber-600 hover:bg-amber-700" onClick={() => setShowAddShift(true)}>Fill Shift</Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Week Navigation */}
        <div className="flex items-center justify-between">
          <Button variant="outline" size="sm" onClick={() => setWeekOffset(weekOffset - 1)}>
            <ChevronLeft className="h-4 w-4" /> Previous
          </Button>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-slate-900">{weekLabel}</span>
            {weekOffset !== 0 && (
              <Button variant="ghost" size="sm" onClick={() => setWeekOffset(0)}>Today</Button>
            )}
          </div>
          <Button variant="outline" size="sm" onClick={() => setWeekOffset(weekOffset + 1)}>
            Next <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Rota Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
          </div>
        ) : (
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px]">
                <thead>
                  <tr className="border-b bg-slate-50">
                    <th className="py-3 px-4 text-left text-xs font-semibold text-slate-600 w-[180px] sticky left-0 bg-slate-50 z-10">Staff</th>
                    {weekDates.map((date) => {
                      const d = new Date(date + "T00:00:00");
                      const isToday = date === today;
                      return (
                        <th key={date} className={cn("py-3 px-2 text-center text-xs font-medium min-w-[120px]", isToday ? "bg-blue-50 text-blue-700" : "text-slate-600")}>
                          <div>{d.toLocaleDateString("en-GB", { weekday: "short" })}</div>
                          <div className={cn("text-lg font-bold mt-0.5", isToday && "text-blue-700")}>{d.getDate()}</div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {activeStaff.map((staff) => {
                    const staffLeave = leave.filter((l) => l.staff_id === staff.id);
                    return (
                      <tr key={staff.id} className="border-b hover:bg-slate-50/50">
                        <td className="py-2 px-4 sticky left-0 bg-white z-10">
                          <div className="flex items-center gap-2">
                            <Avatar name={staff.full_name} size="sm" />
                            <div>
                              <div className="text-xs font-medium text-slate-900">{staff.full_name}</div>
                              <div className="text-[10px] text-slate-400">{staff.contracted_hours}h</div>
                            </div>
                          </div>
                        </td>
                        {weekDates.map((date) => {
                          const shift = shifts.find((s) => s.staff_id === staff.id && s.date === date);
                          const isOnLeave = staffLeave.some((l) => l.start_date <= date && l.end_date >= date);
                          const isToday = date === today;

                          return (
                            <td key={date} className={cn("py-2 px-2 text-center", isToday && "bg-blue-50/50")}>
                              {shift ? (
                                <div className={cn("rounded-lg border px-2 py-1.5 text-[10px] font-medium cursor-pointer hover:opacity-80 transition-opacity", SHIFT_COLORS[shift.shift_type] || "bg-slate-100 text-slate-700")}>
                                  <div>{SHIFT_TYPE_LABELS[shift.shift_type] || shift.shift_type}</div>
                                  <div className="text-[9px] opacity-75">{shift.start_time}–{shift.end_time}</div>
                                  {shift.status === "in_progress" && (
                                    <div className="h-1 w-1 rounded-full bg-current mx-auto mt-0.5 animate-pulse-dot" />
                                  )}
                                </div>
                              ) : isOnLeave ? (
                                <div className="rounded-lg bg-amber-50 border border-amber-200 px-2 py-1.5 text-[10px] font-medium text-amber-700">
                                  Leave
                                </div>
                              ) : (
                                <div className="rounded-lg border border-dashed border-slate-200 px-2 py-1.5 text-[10px] text-slate-300 cursor-pointer hover:bg-slate-50 hover:border-slate-300 transition-colors">
                                  +
                                </div>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* Today's Coverage Detail */}
        {todayShifts.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sun className="h-5 w-5 text-amber-500" />Today&apos;s Coverage Detail
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {todayShifts.map((shift) => {
                  const staff = activeStaff.find((s) => s.id === shift.staff_id);
                  if (!staff) return null;
                  return (
                    <div key={shift.id} className={cn("rounded-xl border p-3", shift.status === "in_progress" ? "border-emerald-200 bg-emerald-50/50" : "")}>
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <Avatar name={staff.full_name} size="md" />
                          {shift.status === "in_progress" && (
                            <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-500 border-2 border-white" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="text-sm font-semibold text-slate-900">{staff.full_name}</div>
                          <div className="text-xs text-slate-500">{staff.job_title}</div>
                        </div>
                        <Badge className={cn("rounded-full text-[10px] border shrink-0", SHIFT_COLORS[shift.shift_type])}>
                          {SHIFT_TYPE_LABELS[shift.shift_type] || shift.shift_type}
                        </Badge>
                      </div>
                      <div className="mt-2 grid grid-cols-2 gap-2 text-[10px]">
                        <div className="text-slate-500"><Clock className="h-3 w-3 inline mr-0.5" />{shift.start_time} – {shift.end_time}</div>
                        {shift.clock_in_at && (
                          <div className="text-emerald-600"><CheckCircle2 className="h-3 w-3 inline mr-0.5" />Clocked in</div>
                        )}
                        {shift.notes && <div className="col-span-2 text-amber-600 font-medium">{shift.notes}</div>}
                      </div>
                    </div>
                  );
                })}

    {showAddShift && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4" onClick={() => setShowAddShift(false)}>
        <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-6" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-between mb-5">
            <span className="text-base font-bold text-slate-900">Add Shift</span>
            <button onClick={() => setShowAddShift(false)} className="text-slate-400 hover:text-slate-600 text-xl">&times;</button>
          </div>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1.5">Staff Member <span className="text-red-500">*</span></label>
              <select value={addShiftForm.staff_id} onChange={(e) => setAddShiftForm((f) => ({ ...f, staff_id: e.target.value }))} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-400">
                <option value="">Select staff…</option>
                {activeStaff.map((s) => <option key={s.id} value={s.id}>{s.full_name}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1.5">Date <span className="text-red-500">*</span></label>
                <input type="date" value={addShiftForm.date} onChange={(e) => setAddShiftForm((f) => ({ ...f, date: e.target.value }))} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-400" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1.5">Shift Type <span className="text-red-500">*</span></label>
                <select value={addShiftForm.shift_type} onChange={(e) => setAddShiftForm((f) => ({ ...f, shift_type: e.target.value }))} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-400">
                  {SHIFT_TYPES.map((t) => <option key={t} value={t}>{SHIFT_TYPE_LABELS[t]}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1.5">Start <span className="text-red-500">*</span></label>
                <input type="time" value={addShiftForm.start_time} onChange={(e) => setAddShiftForm((f) => ({ ...f, start_time: e.target.value }))} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-400" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1.5">End <span className="text-red-500">*</span></label>
                <input type="time" value={addShiftForm.end_time} onChange={(e) => setAddShiftForm((f) => ({ ...f, end_time: e.target.value }))} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-400" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1.5">Break (min)</label>
                <input type="number" value={addShiftForm.break_minutes} onChange={(e) => setAddShiftForm((f) => ({ ...f, break_minutes: e.target.value }))} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-400" />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1.5">Notes</label>
              <input value={addShiftForm.notes} onChange={(e) => setAddShiftForm((f) => ({ ...f, notes: e.target.value }))} placeholder="Any notes…" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-400" />
            </div>
            {addShiftError && <p className="text-xs text-red-600 font-medium">{addShiftError}</p>}
          </div>
          <div className="mt-5 flex gap-3">
            <Button className="flex-1" disabled={createShift.isPending} onClick={() => {
              if (!addShiftForm.staff_id) { setAddShiftError("Staff member is required."); return; }
              if (!addShiftForm.date) { setAddShiftError("Date is required."); return; }
              if (!addShiftForm.start_time || !addShiftForm.end_time) { setAddShiftError("Start and end times are required."); return; }
              setAddShiftError("");
              createShift.mutate(
                { staff_id: addShiftForm.staff_id, date: addShiftForm.date, shift_type: addShiftForm.shift_type, start_time: addShiftForm.start_time, end_time: addShiftForm.end_time, break_minutes: Number(addShiftForm.break_minutes) || 30, notes: addShiftForm.notes.trim() || undefined },
                { onSuccess: () => { setShowAddShift(false); setAddShiftForm({ staff_id: "", date: today, shift_type: "day", start_time: "07:00", end_time: "15:00", break_minutes: "30", notes: "" }); }, onError: () => setAddShiftError("Failed to add shift.") }
              );
            }}>
              <Plus className="h-4 w-4" />{createShift.isPending ? "Adding…" : "Add Shift"}
            </Button>
            <Button variant="outline" onClick={() => setShowAddShift(false)}>Cancel</Button>
          </div>
        </div>
      </div>
    )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </PageShell>

    {showAddShift && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4" onClick={() => setShowAddShift(false)}>
        <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-6" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-between mb-5">
            <span className="text-base font-bold text-slate-900">Add Shift</span>
            <button onClick={() => setShowAddShift(false)} className="text-slate-400 hover:text-slate-600 text-xl">&times;</button>
          </div>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1.5">Staff Member <span className="text-red-500">*</span></label>
              <select value={addShiftForm.staff_id} onChange={(e) => setAddShiftForm((f) => ({ ...f, staff_id: e.target.value }))} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-400">
                <option value="">Select staff…</option>
                {activeStaff.map((s) => <option key={s.id} value={s.id}>{s.full_name}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1.5">Date <span className="text-red-500">*</span></label>
                <input type="date" value={addShiftForm.date} onChange={(e) => setAddShiftForm((f) => ({ ...f, date: e.target.value }))} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-400" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1.5">Shift Type <span className="text-red-500">*</span></label>
                <select value={addShiftForm.shift_type} onChange={(e) => setAddShiftForm((f) => ({ ...f, shift_type: e.target.value }))} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-400">
                  {SHIFT_TYPES.map((t) => <option key={t} value={t}>{SHIFT_TYPE_LABELS[t]}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1.5">Start <span className="text-red-500">*</span></label>
                <input type="time" value={addShiftForm.start_time} onChange={(e) => setAddShiftForm((f) => ({ ...f, start_time: e.target.value }))} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-400" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1.5">End <span className="text-red-500">*</span></label>
                <input type="time" value={addShiftForm.end_time} onChange={(e) => setAddShiftForm((f) => ({ ...f, end_time: e.target.value }))} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-400" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1.5">Break (min)</label>
                <input type="number" value={addShiftForm.break_minutes} onChange={(e) => setAddShiftForm((f) => ({ ...f, break_minutes: e.target.value }))} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-400" />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1.5">Notes</label>
              <input value={addShiftForm.notes} onChange={(e) => setAddShiftForm((f) => ({ ...f, notes: e.target.value }))} placeholder="Any notes…" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-400" />
            </div>
            {addShiftError && <p className="text-xs text-red-600 font-medium">{addShiftError}</p>}
          </div>
          <div className="mt-5 flex gap-3">
            <Button className="flex-1" disabled={createShift.isPending} onClick={() => {
              if (!addShiftForm.staff_id) { setAddShiftError("Staff member is required."); return; }
              if (!addShiftForm.date) { setAddShiftError("Date is required."); return; }
              if (!addShiftForm.start_time || !addShiftForm.end_time) { setAddShiftError("Start and end times are required."); return; }
              setAddShiftError("");
              createShift.mutate(
                { staff_id: addShiftForm.staff_id, date: addShiftForm.date, shift_type: addShiftForm.shift_type, start_time: addShiftForm.start_time, end_time: addShiftForm.end_time, break_minutes: Number(addShiftForm.break_minutes) || 30, notes: addShiftForm.notes.trim() || undefined },
                { onSuccess: () => { setShowAddShift(false); setAddShiftForm({ staff_id: "", date: today, shift_type: "day", start_time: "07:00", end_time: "15:00", break_minutes: "30", notes: "" }); }, onError: () => setAddShiftError("Failed to add shift.") }
              );
            }}>
              <Plus className="h-4 w-4" />{createShift.isPending ? "Adding…" : "Add Shift"}
            </Button>
            <Button variant="outline" onClick={() => setShowAddShift(false)}>Cancel</Button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}
