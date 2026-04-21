import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth-guard";
import { PERMISSIONS } from "@/lib/permissions";
import { getHomeClimateSnapshot } from "@/lib/intelligence/engine";

export async function GET(request: NextRequest) {
  const auth = requirePermission(request, PERMISSIONS.VIEW_DASHBOARD);
  if (auth instanceof NextResponse) return auth;

  const periodDays = Number(new URL(request.url).searchParams.get("periodDays") ?? "28");
  return NextResponse.json({ data: getHomeClimateSnapshot(Number.isFinite(periodDays) ? periodDays : 28) });
}
