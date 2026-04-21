import { NextRequest, NextResponse } from "next/server";
import { writeAuditLog } from "@/lib/audit/logger";
import { AUDIT_EVENTS } from "@/lib/audit/events";
import { REPORT_TEMPLATES } from "@/lib/reports/templates";
import { createReportDataStructure, generateReportHTML, validateReportOptions } from "@/lib/reports/engine";
import type { ReportBuilderOptions } from "@/lib/reports/engine";
import { resolvePhase3ServerContext } from "@/lib/phase3/server-auth";

interface FormRecordRow {
  id: string;
  created_at: string;
  template_id?: string | null;
  status?: string | null;
  subject_type?: string | null;
  subject_id?: string | null;
  created_by: string;
  organisation_id: string;
  home_id: string;
}

/**
 * POST /api/phase3/reports/generate
 * Generate a report based on template and options
 */
export async function POST(request: NextRequest) {
  try {
    const { supabase, actorId } = await resolvePhase3ServerContext(request);

    const { templateCode, options } = await request.json();

    if (!templateCode) {
      return NextResponse.json({ error: "Missing template code" }, { status: 400 });
    }

    const template = Object.values(REPORT_TEMPLATES).find((t) => t.code === templateCode);
    if (!template) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    // Validate options
    const validationErrors = validateReportOptions(template, options as ReportBuilderOptions);
    if (validationErrors.length > 0) {
      return NextResponse.json({ error: "Validation failed", details: validationErrors }, { status: 400 });
    }

    // Get user info
    const { data: userProfile } = await supabase.from("profiles").select("full_name").eq("id", actorId).single();

    // Create report data structure
    const reportData = createReportDataStructure({
      template,
      options: options as ReportBuilderOptions,
      userId: actorId,
      userName: userProfile?.full_name || "Unknown",
      userEmail: "",
    });

    // Fetch entries based on filters
    const optionsData = options as ReportBuilderOptions;
    let recordsQuery = supabase
      .from("form_records")
      .select("id, created_at, template_id, status, subject_type, subject_id, created_by, organisation_id, home_id")
      .gte("created_at", optionsData.dateRangeStart || "2000-01-01")
      .lte("created_at", optionsData.dateRangeEnd || "2099-12-31")
      .order("created_at", { ascending: false })
      .limit(100);

    if (optionsData.childId) {
      recordsQuery = recordsQuery.eq("subject_id", optionsData.childId);
    }

    const { data: entries } = await recordsQuery;

    if (entries && entries.length > 0) {
      reportData.entries = (entries as FormRecordRow[]).map((e) => ({
        id: e.id,
        timestamp: e.created_at,
        title: e.template_id || "Form Record",
        content: `Status: ${e.status || "unknown"}`,
        category: e.subject_type || "Form Record",
        author: {
          id: e.created_by,
          name: "Staff Member",
          email: "staff@home.local",
        },
      }));

      const firstRecord = entries[0] as FormRecordRow;
      reportData.home = firstRecord.home_id
        ? {
            id: firstRecord.home_id,
            name: "Home",
          }
        : undefined;
    }

    // Generate HTML
    const contentHtml = generateReportHTML(reportData);

    // Save report to database
    const activeOrgId = (entries?.[0] as FormRecordRow | undefined)?.organisation_id;
    if (!activeOrgId) {
      return NextResponse.json({ error: "No records found for selected filters" }, { status: 400 });
    }

    const activeHomeId = (entries?.[0] as FormRecordRow | undefined)?.home_id;

    const { data: savedReport, error: dbError } = await supabase
      .from("generated_reports")
      .insert({
        organisation_id: activeOrgId,
        home_id: activeHomeId,
        report_definition_id: template.id,
        title: reportData.title,
        subtitle: reportData.subtitle,
        report_type: templateCode,
        date_range_start: optionsData.dateRangeStart,
        date_range_end: optionsData.dateRangeEnd,
        generated_by: actorId,
        content_html: contentHtml,
        content_json: reportData,
        included_sections: optionsData.includedSections,
      })
      .select("id")
      .single();

    if (dbError) {
      console.error("Database error:", dbError);
      return NextResponse.json({ error: "Failed to save report" }, { status: 500 });
    }

    // Audit log
    await writeAuditLog({
      event: AUDIT_EVENTS.REPORT_GENERATE,
      actorId,
      organisationId: activeOrgId,
      homeId: activeHomeId,
      entityId: savedReport?.id,
      entityType: "report",
      metadata: {
        reportType: templateCode,
        childId: optionsData.childId,
      },
    });

    return NextResponse.json({
      success: true,
      reportId: savedReport?.id,
      html: contentHtml,
    });
  } catch (error) {
    console.error("Error generating report:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * GET /api/phase3/reports
 * List available report templates
 */
export async function GET(request: NextRequest) {
  try {
    await resolvePhase3ServerContext(request);

    const templates = Object.values(REPORT_TEMPLATES).map((t) => ({
      id: t.id,
      code: t.code,
      name: t.name,
      category: t.category,
      description: t.description,
      icon: t.icon,
    }));

    return NextResponse.json({
      templates,
      count: templates.length,
    });
  } catch (error) {
    console.error("Error fetching templates:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
