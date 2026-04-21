import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/store";
import { isMissingSupabaseTableError, resolvePhase3ServerContext } from "@/lib/phase3/server-auth";

type TrainingCourseRow = {
  course_title: string;
  course_category: string | null;
  provider_name: string;
  mandatory_flag: boolean;
  direct_course_url: string | null;
};

type MatrixRow = {
  staff_member_id: string;
  completion_status: string;
  compliance_status: string;
  completed_at: string | null;
  expires_at: string | null;
  certificate_status: string | null;
  direct_course_url: string | null;
  due_date: string | null;
  requirement_type: string | null;
  last_synced_at: string | null;
  course_id: string;
  training_courses: TrainingCourseRow[] | null;
};

function mapComplianceToLegacyStatus(status: string): "compliant" | "expiring_soon" | "expired" | "not_started" {
  if (status === "compliant") return "compliant";
  if (status === "due_soon") return "expiring_soon";
  if (status === "expired") return "expired";
  return "not_started";
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const staffId = searchParams.get("staff_id");
  const status = searchParams.get("status");
  const category = searchParams.get("category");
  const provider = searchParams.get("provider");
  const mandatoryFilter = searchParams.get("mandatory");

  try {
    const { supabase } = await resolvePhase3ServerContext(req);

    let query = supabase
      .from("training_matrix_rows")
      .select(
        "staff_member_id, completion_status, compliance_status, completed_at, expires_at, certificate_status, direct_course_url, due_date, requirement_type, last_synced_at, course_id, training_courses(course_title, course_category, provider_name, mandatory_flag, direct_course_url)"
      )
      .order("updated_at", { ascending: false });

    if (staffId) query = query.eq("staff_member_id", staffId);

    if (status) {
      const mapped =
        status === "expiring_soon"
          ? "due_soon"
          : status === "not_started"
            ? "incomplete"
            : status;
      query = query.eq("compliance_status", mapped);
    }

    if (mandatoryFilter === "mandatory") query = query.eq("requirement_type", "mandatory");
    if (mandatoryFilter === "optional") query = query.eq("requirement_type", "optional");

    const { data, error } = await query;

    if (error) {
      if (isMissingSupabaseTableError(error)) {
        return NextResponse.json({
          data: [],
          meta: {
            total: 0,
            compliant: 0,
            expiring: 0,
            expired: 0,
            not_started: 0,
            rate: 0,
          },
          schemaReady: false,
        });
      }

      throw error;
    }

    const rows = (data ?? []) as MatrixRow[];

    const filteredRows = rows.filter((row) => {
      const course = row.training_courses?.[0] ?? null;
      if (category && course?.course_category !== category) return false;
      if (provider && course?.provider_name !== provider) return false;
      return true;
    });

    const records = filteredRows.map((row) => {
      const course = row.training_courses?.[0] ?? null;

      return {
        id: `${row.staff_member_id}:${row.course_id}`,
        staff_id: row.staff_member_id,
        course_name: course?.course_title ?? "Unknown Course",
        category: course?.course_category ?? "other",
        provider: course?.provider_name ?? null,
        completed_date: row.completed_at,
        expiry_date: row.expires_at,
        certificate_url: null,
        status: mapComplianceToLegacyStatus(row.compliance_status),
        is_mandatory: course?.mandatory_flag ?? row.requirement_type === "mandatory",
        notes: null,
        home_id: "",
        direct_course_url: row.direct_course_url ?? course?.direct_course_url,
        completion_status: row.completion_status,
        compliance_status: row.compliance_status,
        due_date: row.due_date,
        certificate_status: row.certificate_status,
        last_synced_at: row.last_synced_at,
      };
    });

    const total = records.length;
    const compliant = records.filter((r) => r.status === "compliant").length;
    const expiring = records.filter((r) => r.status === "expiring_soon").length;
    const expired = records.filter((r) => r.status === "expired").length;
    const notStarted = records.filter((r) => r.status === "not_started").length;

    return NextResponse.json({
      data: records,
      meta: {
        total,
        compliant,
        expiring,
        expired,
        not_started: notStarted,
        rate: total > 0 ? Math.round((compliant / total) * 100) : 0,
      },
      schemaReady: true,
    });
  } catch (error) {
    console.error("Training matrix fetch failed, falling back to seed store:", error);

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
      data: records,
      meta: {
        total,
        compliant,
        expiring,
        expired,
        not_started: notStarted,
        rate: total > 0 ? Math.round((compliant / total) * 100) : 0,
      },
      schemaReady: false,
    });
  }
}
