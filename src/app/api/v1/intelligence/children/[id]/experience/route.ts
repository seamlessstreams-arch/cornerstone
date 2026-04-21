import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth-guard";
import { PERMISSIONS } from "@/lib/permissions";
import { getChildExperienceSnapshot } from "@/lib/intelligence/engine";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = requirePermission(request, PERMISSIONS.VIEW_YOUNG_PEOPLE);
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  return NextResponse.json({ data: getChildExperienceSnapshot(id) });
}
