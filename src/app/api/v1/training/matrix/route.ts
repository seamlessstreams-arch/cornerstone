import { NextRequest, NextResponse } from "next/server";
import { resolvePhase3ServerContext, isMissingSupabaseTableError } from "@/lib/phase3/server-auth";

export async function GET(request: NextRequest) {
  try {
    const { supabase, actorId } = await resolvePhase3ServerContext(request);
    const { searchParams } = new URL(request.url);

    const homeId = searchParams.get("home") || null;
    const staffId = searchParams.get("staff") || null;
    const roleId = searchParams.get("role") || null;
    const courseId = searchParams.get("course") || null;
    const provider = searchParams.get("provider") || null;
    const compliance = searchParams.get("compliance") || null;
    const requirementType = searchParams.get("requirement_type") || null;
    const view = searchParams.get("view") || "organisation";

    let query = supabase
      .from("training_matrix_rows")
      .select(
        `
        id,
        staff_member_id,
        course_id,
        home_id,
        role_id,
        requirement_type,
        assigned_status,
        completion_status,
        completed_at,
        expires_at,
        due_date,
        days_until_due,
        compliance_status,
        direct_course_url,
        certificate_status,
        last_synced_at,
        training_courses(id, course_title, provider_name, mandatory_flag, course_category),
        users!training_matrix_rows_staff_member_id_fkey(id, email)
      `
      )
      .order("updated_at", { ascending: false });

    if (view === "my") query = query.eq("staff_member_id", actorId);
    if (homeId) query = query.eq("home_id", homeId);
    if (staffId) query = query.eq("staff_member_id", staffId);
    if (roleId) query = query.eq("role_id", roleId);
    if (courseId) query = query.eq("course_id", courseId);
    if (compliance) query = query.eq("compliance_status", compliance);
    if (requirementType) query = query.eq("requirement_type", requirementType);

    const { data, error } = await query;
    if (error) {
      if (isMissingSupabaseTableError(error)) {
        return NextResponse.json({ rows: [], summary: { total: 0, compliant: 0, dueSoon: 0, overdue: 0, expired: 0, incomplete: 0, nonCompliant: 0 } });
      }
      throw error;
    }

    const rows = (data ?? []).filter((row) => {
      const course = Array.isArray(row.training_courses) ? row.training_courses[0] : row.training_courses;
      if (!provider) return true;
      return course?.provider_name === provider;
    });

    const summary = {
      total: rows.length,
      compliant: rows.filter((row) => row.compliance_status === "compliant").length,
      dueSoon: rows.filter((row) => row.compliance_status === "due_soon").length,
      overdue: rows.filter((row) => row.compliance_status === "overdue").length,
      expired: rows.filter((row) => row.compliance_status === "expired").length,
      incomplete: rows.filter((row) => row.compliance_status === "incomplete").length,
      nonCompliant: rows.filter((row) => row.compliance_status === "non_compliant").length,
    };

    return NextResponse.json({ rows, summary });
  } catch (error) {
    console.error("Failed to fetch training matrix", error);
    return NextResponse.json({ error: "Failed to fetch training matrix" }, { status: 500 });
  }
}
