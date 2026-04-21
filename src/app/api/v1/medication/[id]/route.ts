import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/store";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const medication = db.medications.findAll().find((m) => m.id === id);
  if (!medication) {
    return NextResponse.json({ error: "Medication not found" }, { status: 404 });
  }

  const administrations = db.medicationAdministrations
    .findByMed(id)
    .sort((a, b) => b.scheduled_time.localeCompare(a.scheduled_time));

  const given    = administrations.filter((a) => a.status === "given").length;
  const refused  = administrations.filter((a) => a.status === "refused").length;
  const missed   = administrations.filter((a) => a.status === "missed").length;
  const late     = administrations.filter((a) => a.status === "late").length;
  const total    = administrations.length;
  const adherence = total > 0 ? Math.round((given / total) * 100) : null;

  // PRN-specific: group by date
  const prn = medication.type === "prn"
    ? administrations.filter((a) => a.status === "given")
    : [];

  return NextResponse.json({
    data: { medication, administrations, prn },
    meta: { given, refused, missed, late, total, adherence },
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();

  const idx = db.medications.findAll().findIndex((m) => m.id === id);
  if (idx === -1) {
    return NextResponse.json({ error: "Medication not found" }, { status: 404 });
  }

  // Allow updating stock_count and stock_last_checked
  const allowed = ["stock_count", "stock_last_checked", "is_active", "special_instructions", "side_effects"];
  const update: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in body) update[key] = body[key];
  }

  const medications = db.medications.findAll();
  const updated = { ...medications[idx], ...update } as typeof medications[0];
  (medications as unknown as Record<number, typeof medications[0]>)[idx] = updated;
  return NextResponse.json({ data: updated });
}
