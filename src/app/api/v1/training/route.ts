import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/store";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const staffId = searchParams.get("staff_id");
  const status = searchParams.get("status");
  const category = searchParams.get("category");

  let records = db.training.findAll();

  if (staffId) records = records.filter((r) => r.staff_id === staffId);
  if (status) records = records.filter((r) => r.status === status);
  if (category) records = records.filter((r) => r.category === category);

  const total = records.length;
  const compliant = records.filter((r) => r.status === "compliant").length;
  const expiring = records.filter((r) => r.status === "expiring_soon").length;
  const expired = records.filter((r) => r.status === "expired").length;
  const notStarted = records.filter((r) => r.status === "not_started").length;

  return NextResponse.json({
    data: records.sort((a, b) => {
      const statusOrder = { expired: 0, expiring_soon: 1, not_started: 2, compliant: 3 };
      return (statusOrder[a.status as keyof typeof statusOrder] ?? 4) -
             (statusOrder[b.status as keyof typeof statusOrder] ?? 4);
    }),
    meta: {
      total,
      compliant,
      expiring,
      expired,
      not_started: notStarted,
      rate: total > 0 ? Math.round((compliant / total) * 100) : 0,
    },
  });
}
