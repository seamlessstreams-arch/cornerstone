import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { FORM_TEMPLATES } from "@/lib/forms/templates";
import type { FormTemplate } from "@/lib/forms/types";
import { createServerClient } from "@/lib/supabase/server";
import {
  automateHsDefectMaintenanceTask,
  automateOversightActionsToTasks,
} from "@/lib/phase3/automations";

/**
 * GET /api/forms/templates
 * Get all available form templates, optionally filtered by category
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");
  const code = searchParams.get("code");

  try {
    // Get single template by code
    if (code) {
      const template = Object.values(FORM_TEMPLATES).find(
        (t) => t.code === code
      );
      if (!template) {
        return NextResponse.json(
          { error: "Template not found" },
          { status: 404 }
        );
      }
      return NextResponse.json(template);
    }

    // Filter by category if provided
    let templates: FormTemplate[] = Object.values(FORM_TEMPLATES);
    if (category) {
      templates = templates.filter((t) => t.category === category);
    }

    return NextResponse.json({
      templates,
      count: templates.length,
      categories: [
        ...new Set(Object.values(FORM_TEMPLATES).map((t) => t.category)),
      ],
    });
  } catch (error) {
    console.error("Error fetching templates:", error);
    return NextResponse.json(
      { error: "Failed to fetch templates" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/forms/templates
 * Submit a completed form (will be saved to database in real implementation)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      templateId,
      templateCode,
      data,
      organisationId,
      homeId,
      createdBy,
      oversightActions,
    } = body;

    // Validate template exists
    const templateKey = Object.keys(FORM_TEMPLATES).find(
      (key) => FORM_TEMPLATES[key as keyof typeof FORM_TEMPLATES].id === templateId
    );

    if (!templateKey) {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 }
      );
    }

    // In a real implementation, save to database here
    // For now, return success with mock ID
    const formId = `form-${Date.now()}`;

    if (organisationId && homeId && createdBy) {
      const supabase = await createServerClient();

      // Automation: H&S defect -> maintenance task
      if (
        typeof templateCode === "string" &&
        (templateCode.includes("health") || templateCode.includes("safety") || templateCode.includes("audit")) &&
        data?.status === "fail" &&
        data?.issue_severity
      ) {
        await automateHsDefectMaintenanceTask(supabase, {
          organisationId,
          homeId,
          createdBy,
          formRecordId: formId,
          severity: data.issue_severity,
          details: data.summary ?? "H&S defect identified from submitted form.",
        });
      }

      // Automation: oversight actions -> tasks
      if (Array.isArray(oversightActions) && oversightActions.length > 0) {
        await automateOversightActionsToTasks(supabase, {
          organisationId,
          homeId,
          createdBy,
          oversightId: formId,
          actions: oversightActions,
        });
      }
    }

    return NextResponse.json({
      success: true,
      formId,
      templateId,
      submittedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error submitting form:", error);
    return NextResponse.json(
      { error: "Failed to submit form" },
      { status: 500 }
    );
  }
}
