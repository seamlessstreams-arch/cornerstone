import { NextRequest, NextResponse } from "next/server";
import { resolvePhase3ServerContext } from "@/lib/phase3/server-auth";
import { resolveReg45Context } from "@/lib/reg45/context";
import { buildReg45AriaSystemPrompt, buildReg45AriaUserPrompt, createLocalAriaFallbackDraft } from "@/lib/reg45/aria";
import type { Reg45AriaDraftRequest } from "@/lib/reg45/aria";
import { requirePermission } from "@/lib/auth-guard";
import { PERMISSIONS } from "@/lib/permissions";
import { AUDIT_EVENTS } from "@/lib/audit/events";
import { writeAuditLog } from "@/lib/audit/logger";
import Anthropic from "@anthropic-ai/sdk";

const anthropicClient = process.env.ANTHROPIC_API_KEY
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : null;

export async function POST(request: NextRequest) {
  try {
    const auth = requirePermission(request, PERMISSIONS.MANAGE_AUDITS);
    if (auth instanceof NextResponse) return auth;

    const { actorId } = await resolvePhase3ServerContext(request);
    const body = (await request.json()) as Partial<Reg45AriaDraftRequest>;

    if (
      typeof body.section !== "string" ||
      typeof body.cycleTitle !== "string" ||
      typeof body.evidenceSummary !== "string" ||
      typeof body.findingsSummary !== "string" ||
      typeof body.consultationsSummary !== "string"
    ) {
      return NextResponse.json({ error: "Missing draft request fields" }, { status: 400 });
    }

    const promptPayload: Reg45AriaDraftRequest = {
      section: body.section,
      cycleTitle: body.cycleTitle,
      evidenceSummary: body.evidenceSummary,
      findingsSummary: body.findingsSummary,
      consultationsSummary: body.consultationsSummary,
      previousCycleSummary: typeof body.previousCycleSummary === "string" ? body.previousCycleSummary : undefined,
      tone: body.tone,
      voiceCommand: typeof body.voiceCommand === "string" ? body.voiceCommand : undefined,
    };

    const systemPrompt = buildReg45AriaSystemPrompt();
    const userPrompt = buildReg45AriaUserPrompt(promptPayload);

    let draft: string;
    let model: string;
    let inputTokens: number | undefined;
    let outputTokens: number | undefined;
    let warning: string | undefined;

    if (anthropicClient) {
      const message = await anthropicClient.messages.create({
        model: "claude-sonnet-4-5",
        max_tokens: 2048,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
      });
      const block = message.content[0];
      draft = block.type === "text" ? block.text : "";
      model = message.model;
      inputTokens = message.usage.input_tokens;
      outputTokens = message.usage.output_tokens;
    } else {
      draft = createLocalAriaFallbackDraft(promptPayload);
      model = "aria-local-fallback";
      warning = "External ARIA model integration is not configured in this environment; using local drafting fallback.";
    }

    const { supabase } = await resolvePhase3ServerContext(request);
    const context = await resolveReg45Context(supabase, actorId);

    await writeAuditLog({
      event: AUDIT_EVENTS.REPORT_GENERATE,
      actorId,
      organisationId: context.organisationId,
      homeId: context.homeId,
      entityType: "reg45_aria_draft",
      entityId: null,
      metadata: {
        section: promptPayload.section,
        promptLength: userPrompt.length,
        model,
        inputTokens,
        outputTokens,
      },
    });

    return NextResponse.json({
      draft,
      model,
      inputTokens,
      outputTokens,
      generatedAt: new Date().toISOString(),
      ...(warning ? { warning } : {}),
    });
  } catch (error) {
    console.error("Failed to generate ARIA draft", error);
    return NextResponse.json({ error: "Failed to generate ARIA draft" }, { status: 500 });
  }
}
