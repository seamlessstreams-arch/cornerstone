import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/store";
import { requirePermission } from "@/lib/auth-guard";
import { PERMISSIONS } from "@/lib/permissions";
import type { TrustedAdultLink } from "@/types/intelligence";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = requirePermission(request, PERMISSIONS.VIEW_YOUNG_PEOPLE);
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const data = db.intelligence.trustedAdults.findByChild(id).map((item) => ({
    ...item,
    staff: db.staff.findById(item.staff_id) ?? null,
  }));
  return NextResponse.json({ data });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = requirePermission(request, PERMISSIONS.EDIT_YOUNG_PEOPLE);
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const body = await request.json();

  const VALID_REL_TYPES = ["preferred", "regulating", "engaging", "strain", "avoided"] as const;
  if (!body.staff_id || !body.relationship_type) {
    return NextResponse.json({ error: "staff_id and relationship_type are required" }, { status: 400 });
  }
  if (!VALID_REL_TYPES.includes(body.relationship_type as (typeof VALID_REL_TYPES)[number])) {
    return NextResponse.json(
      { error: `relationship_type must be one of: ${VALID_REL_TYPES.join(", ")}` },
      { status: 400 }
    );
  }

  const created = db.intelligence.trustedAdults.create({
    child_id: id,
    staff_id: String(body.staff_id),
    relationship_type: body.relationship_type as TrustedAdultLink["relationship_type"],
    confidence: body.confidence ?? "medium",
    notes: typeof body.notes === "string" && body.notes.trim() ? body.notes.trim() : "",
  });

  return NextResponse.json({ data: created }, { status: 201 });
}
