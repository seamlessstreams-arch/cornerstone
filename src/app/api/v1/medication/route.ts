import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/store";
import { todayStr } from "@/lib/utils";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const childId = searchParams.get("child_id");

  const meds = childId ? db.medications.findByChild(childId) : db.medications.findActive();
  const admins = childId ? db.medicationAdministrations.findByChild(childId) : db.medicationAdministrations.findAll();

  const todayAdmins = admins.filter((a) => a.scheduled_time.startsWith(todayStr()));
  const exceptions = db.medicationAdministrations.findExceptions();
  const scheduled = db.medicationAdministrations.findScheduled();

  // Build MAR summary per medication
  const mar = meds.map((med) => {
    const medAdmins = admins.filter((a) => a.medication_id === med.id)
      .sort((a, b) => a.scheduled_time.localeCompare(b.scheduled_time));
    return { medication: med, administrations: medAdmins };
  });

  return NextResponse.json({
    data: {
      medications: meds,
      mar,
      today_schedule: todayAdmins,
      exceptions,
      scheduled,
      stock_alerts: meds.filter((m) => m.stock_count !== null && m.stock_count < 10),
    },
    meta: {
      total_active: meds.length,
      exceptions_this_week: exceptions.length,
      scheduled_today: scheduled.filter((a) => a.scheduled_time.startsWith(todayStr())).length,
    },
  });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { child_id, name, type, dosage, frequency, route, prescriber, start_date } = body;

  if (!child_id) return NextResponse.json({ error: "child_id is required" }, { status: 400 });
  if (!name?.trim()) return NextResponse.json({ error: "Medication name is required" }, { status: 400 });
  if (!type) return NextResponse.json({ error: "Type is required" }, { status: 400 });
  if (!dosage?.trim()) return NextResponse.json({ error: "Dosage is required" }, { status: 400 });
  if (!frequency?.trim()) return NextResponse.json({ error: "Frequency is required" }, { status: 400 });
  if (!route?.trim()) return NextResponse.json({ error: "Route is required" }, { status: 400 });
  if (!prescriber?.trim()) return NextResponse.json({ error: "Prescriber is required" }, { status: 400 });
  if (!start_date) return NextResponse.json({ error: "Start date is required" }, { status: 400 });

  const med = db.medications.create({
    child_id,
    name: name.trim(),
    type,
    dosage: dosage.trim(),
    frequency: frequency.trim(),
    route: route.trim(),
    prescriber: prescriber.trim(),
    pharmacy: body.pharmacy?.trim() || null,
    start_date,
    special_instructions: body.special_instructions?.trim() || null,
    stock_count: body.stock_count ? Number(body.stock_count) : null,
  });

  return NextResponse.json({ data: med }, { status: 201 });
}
