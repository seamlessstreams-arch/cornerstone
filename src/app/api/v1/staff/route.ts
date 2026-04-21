import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/store";
import { todayStr } from "@/lib/utils";

function daysBetween(dateStr: string | null): number | null {
  if (!dateStr) return null;
  const today = new Date(todayStr());
  const target = new Date(dateStr);
  const diff = Math.round((target.getTime() - today.getTime()) / 86400000);
  return diff;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const roleFilter = searchParams.get("role");
  const employmentTypeFilter = searchParams.get("employment_type");
  const statusFilter = searchParams.get("status") ?? "active";

  let allStaff = db.staff.findAll();

  // Apply filters
  if (statusFilter === "active") {
    allStaff = allStaff.filter((s) => s.is_active && s.employment_status === "active");
  } else if (statusFilter === "inactive") {
    allStaff = allStaff.filter((s) => !s.is_active || s.employment_status === "left");
  }
  if (roleFilter) {
    allStaff = allStaff.filter((s) => s.role === roleFilter);
  }
  if (employmentTypeFilter) {
    allStaff = allStaff.filter((s) => s.employment_type === employmentTypeFilter);
  }

  const today = todayStr();
  const todayShifts = db.shifts.findToday();
  const onLeaveToday = db.leave.findOnLeaveToday();

  const allTasks = db.tasks.findAll();

  const data = allStaff.map((s) => {
    const todayShift = todayShifts.find((shift) => shift.staff_id === s.id) ?? null;
    const isOnShiftToday = todayShift !== null;
    const isOnLeaveToday = onLeaveToday.some((l) => l.staff_id === s.id);

    const supervisionDaysUntilDue = daysBetween(s.next_supervision_due);
    const supervisionOverdue = supervisionDaysUntilDue !== null && supervisionDaysUntilDue < 0;

    const staffTraining = db.training.findByStaff(s.id);
    const trainingExpiredCount = staffTraining.filter((t) => t.status === "expired").length;
    const trainingExpiringCount = staffTraining.filter((t) => t.status === "expiring_soon").length;

    const staffTasks = allTasks.filter((t) => t.assigned_to === s.id && t.status !== "completed" && t.status !== "cancelled");
    const overdueTasksCount = staffTasks.filter((t) => t.due_date && t.due_date < today).length;

    const notifications = db.notifications.findForUser(s.id);
    const notificationsUnread = notifications.length;

    return {
      ...s,
      is_on_shift_today: isOnShiftToday,
      today_shift_type: todayShift?.shift_type ?? null,
      today_shift_status: todayShift?.status ?? null,
      supervision_overdue: supervisionOverdue,
      supervision_days_until_due: supervisionDaysUntilDue,
      training_total_count: staffTraining.length,
      training_expired_count: trainingExpiredCount,
      training_expiring_count: trainingExpiringCount,
      active_tasks: staffTasks.length,
      overdue_tasks: overdueTasksCount,
      is_on_leave_today: isOnLeaveToday,
      notifications_unread: notificationsUnread,
    };
  });

  const allActiveStaff = db.staff.findAll().filter((s) => s.employment_status === "active" && s.is_active);
  const bankCount = allActiveStaff.filter((s) => s.employment_type === "bank").length;
  const onShiftCount = todayShifts.filter((sh) => sh.staff_id && !sh.is_open_shift).length;
  const onLeaveCount = onLeaveToday.length;

  const supervisionOverdueCount = allActiveStaff.filter((s) => {
    if (!s.next_supervision_due) return false;
    return s.next_supervision_due < today;
  }).length;

  return NextResponse.json({
    data,
    meta: {
      total: allActiveStaff.length,
      active: allActiveStaff.filter((s) => s.employment_type === "permanent").length,
      bank: bankCount,
      on_shift: onShiftCount,
      on_leave: onLeaveCount,
      supervision_overdue: supervisionOverdueCount,
    },
  });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { first_name, last_name, role, employment_type } = body;

  if (!first_name?.trim()) return NextResponse.json({ error: "first_name is required" }, { status: 400 });
  if (!last_name?.trim()) return NextResponse.json({ error: "last_name is required" }, { status: 400 });
  if (!role) return NextResponse.json({ error: "role is required" }, { status: 400 });

  const now = new Date().toISOString();
  const staff = db.staff.create({
    first_name: first_name.trim(),
    last_name: last_name.trim(),
    full_name: `${first_name.trim()} ${last_name.trim()}`,
    email: body.email?.trim() || null,
    phone: body.phone?.trim() || null,
    role,
    job_title: body.job_title?.trim() || role.replace(/_/g, " "),
    employment_type: employment_type || "permanent",
    employment_status: "probation",
    start_date: body.start_date || todayStr(),
    end_date: null,
    probation_end_date: null,
    contracted_hours: Number(body.contracted_hours) || 37.5,
    hourly_rate: body.hourly_rate ? Number(body.hourly_rate) : null,
    annual_salary: body.annual_salary ? Number(body.annual_salary) : null,
    payroll_id: null,
    dbs_number: body.dbs_number?.trim() || null,
    dbs_issue_date: body.dbs_issue_date || null,
    dbs_update_service: false,
    emergency_contact_name: null,
    emergency_contact_phone: null,
    next_supervision_due: null,
    next_appraisal_due: null,
    avatar_url: null,
    home_id: "home_oak",
    is_active: true,
    created_by: body.created_by || "staff_darren",
    updated_by: body.created_by || "staff_darren",
    created_at: now,
    updated_at: now,
  });

  return NextResponse.json({ data: staff }, { status: 201 });
}

