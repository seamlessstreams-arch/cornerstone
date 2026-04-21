import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth-guard";
import { PERMISSIONS } from "@/lib/permissions";
import { getQualityOfCareSnapshot } from "@/lib/intelligence/engine";

export async function GET(request: NextRequest) {
  const auth = requirePermission(request, PERMISSIONS.VIEW_REPORTS);
  if (auth instanceof NextResponse) return auth;

  return NextResponse.json({ data: getQualityOfCareSnapshot() });
}
