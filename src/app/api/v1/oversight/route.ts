import { NextRequest, NextResponse } from "next/server";
import { isMissingSupabaseTableError, resolvePhase3ServerContext } from "@/lib/phase3/server-auth";

/**
 * GET /api/v1/oversight?formRecordId=xxx
 * Returns all management oversight entries for a given form record.
 *
 * POST /api/v1/oversight
 * Creates a new management oversight entry for a form record.
 */

export async function GET(request: NextRequest) {
  try {
    const { supabase } = await resolvePhase3ServerContext(request);

    const { searchParams } = new URL(request.url);
    const formRecordId = searchParams.get("formRecordId");

    if (!formRecordId) {
      return NextResponse.json({ error: "formRecordId is required" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("management_oversight")
      .select(
        `
        id,
        form_record_id,
        manager_user_id,
        manager_role,
        narrative,
        analysis,
        what_went_well,
        concerns_identified,
        risk_implications,
        areas_for_improvement,
        actions_required,
        action_timescale,
        safeguarding_escalation_needed,
        another_form_required,
        chronology_update_needed,
        supervision_follow_up_required,
        sign_off_status,
        status,
        submitted_at,
        created_at
      `
      )
      .eq("form_record_id", formRecordId)
      .order("created_at", { ascending: false });

    if (error) {
      if (isMissingSupabaseTableError(error)) {
        return NextResponse.json({ oversight: [], schemaReady: false });
      }

      console.error("Error fetching oversight:", error);
      return NextResponse.json({ error: "Failed to fetch oversight" }, { status: 500 });
    }

    return NextResponse.json({ oversight: data ?? [] });
  } catch (err) {
    console.error("Unexpected error in oversight GET:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { supabase, actorId } = await resolvePhase3ServerContext(request);

    const body = await request.json();
    const {
      formRecordId,
      narrative,
      analysis,
      whatWentWell,
      concernsIdentified,
      riskImplications,
      actionsRequired,
      actionTimescale,
      safeguardingEscalationNeeded = false,
      anotherFormRequired = false,
      chronologyUpdateNeeded = false,
      supervisionFollowUpRequired = false,
      signOffStatus = "pending",
    } = body;

    if (!formRecordId || !narrative?.trim()) {
      return NextResponse.json(
        { error: "formRecordId and narrative are required" },
        { status: 400 }
      );
    }

    // Derive org_id and home_id from the form record
    const { data: record, error: recordError } = await supabase
      .from("form_records")
      .select("organisation_id, home_id")
      .eq("id", formRecordId)
      .single();

    if (recordError || !record) {
      return NextResponse.json({ error: "Form record not found" }, { status: 404 });
    }

    const { data: oversight, error: insertError } = await supabase
      .from("management_oversight")
      .insert({
        organisation_id: record.organisation_id,
        home_id: record.home_id,
        form_record_id: formRecordId,
        manager_user_id: actorId,
        narrative,
        analysis: analysis || null,
        what_went_well: whatWentWell || null,
        concerns_identified: concernsIdentified || null,
        risk_implications: riskImplications || null,
        actions_required: actionsRequired || null,
        action_timescale: actionTimescale || null,
        safeguarding_escalation_needed: safeguardingEscalationNeeded,
        another_form_required: anotherFormRequired,
        chronology_update_needed: chronologyUpdateNeeded,
        supervision_follow_up_required: supervisionFollowUpRequired,
        sign_off_status: signOffStatus,
        status: "submitted",
        submitted_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      console.error("Error inserting oversight:", insertError);
      return NextResponse.json({ error: "Failed to save oversight" }, { status: 500 });
    }

    // Update form record status to reflect oversight submission
    await supabase
      .from("form_records")
      .update({ status: "reviewed", updated_at: new Date().toISOString() })
      .eq("id", formRecordId);

    return NextResponse.json({ oversight }, { status: 201 });
  } catch (err) {
    console.error("Unexpected error in oversight POST:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
