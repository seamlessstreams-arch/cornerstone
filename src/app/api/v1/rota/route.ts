import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/store";
import { todayStr } from "@/lib/utils";

function getMondayOfWeek(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  const day = d.getDay(); // 0=Sun, 1=Mon...
  const diff = day === 0 ? -6 : 1 - day; // shift to Monday
  d.setDate(d.getDate() + diff);
  return d.toISOString().slice(0, 10);
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const weekStartParam = searchParams.get("week_start");
  const weekStart = getMondayOfWeek(weekStartParam ?? todayStr());
  const weekEnd = addDays(weekStart, 6);
  const today = todayStr();

  const allShifts = db.shifts.findAll();
  const allLeave = db.leave.findAll();

  // Shifts in the requested week
  const weekShifts = allShifts.filter((s) => s.date >= weekStart && s.date <= weekEnd);

  // Approved leave overlapping the requested week
  const weekLeave = allLeave.filter(
    (l) => l.status === "approved" && l.start_date <= weekEnd && l.end_date >= weekStart
  );

  // Today stats (always use actual today)
  const todayShifts = allShifts.filter((s) => s.date === today && !s.is_open_shift);
  const openShifts = allShifts.filter((s) => s.is_open_shift && s.date >= today);
  const onLeaveToday = allLeave.filter(
    (l) => l.status === "approved" && l.start_date <= today && l.end_date >= today
  );
  const lateArrivals = todayShifts.filter(
    (s) => s.status === "in_progress" && s.notes?.toLowerCase().includes("late")
  );
  const sleepIns = todayShifts.filter((s) => s.shift_type === "sleep_in");

  return NextResponse.json({
    shifts: weekShifts,
    leave: weekLeave,
    meta: {
      week_start: weekStart,
      week_end: weekEnd,
      on_shift_today: todayShifts.length,
      sleep_ins_tonight: sleepIns.length,
      open_shifts: openShifts.length,
      on_leave_today: onLeaveToday.length,
      late_arrivals: lateArrivals.length,
      open_shift_dates: openShifts.map((s) => ({ date: s.date, start: s.start_time, end: s.end_time, type: s.shift_type })),
    },
  });
}
