import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const ROLE_LABELS: Record<string, string> = {
  registered_manager: "Registered Manager",
  responsible_individual: "Responsible Individual",
  deputy_manager: "Deputy Manager",
  team_leader: "Team Leader",
  residential_care_worker: "Residential Care Worker",
  bank_staff: "Bank Staff",
};

const STYLE_INSTRUCTIONS: Record<string, string> = {
  professional_formal: "Write in a formal, professional tone appropriate for Ofsted-facing records, statutory reporting, and professional correspondence. Use precise language, avoid jargon, and maintain objectivity.",
  warm_professional: "Write in a warm but professional tone. Balance care, empathy, and relationship with professionalism. Appropriate for internal records and family-facing communication.",
  child_friendly: "Write directly to the young person in age-appropriate, accessible language. Be warm, honest, clear, and respectful. Avoid jargon. Use 'you' language.",
  reflective_practice: "Write using a reflective practice lens. Include what happened, how the young person and staff responded, what was learned, and what will be done differently. Use the Gibbs reflective cycle implicitly.",
  safeguarding_focused: "Write with a safeguarding-first lens. Be factual, precise, non-judgemental, and thorough. Record all relevant concerns, actions taken, and notifications made. Leave nothing implied.",
  concise_manager: "Write a concise manager summary — key points only, no padding. Bullets or short paragraphs. Suitable for RM oversight, dashboard summaries, and RI briefings.",
  parent_carer: "Write in clear, accessible language for parents and carers. Be warm, informative, and transparent. Avoid care jargon. Acknowledge their perspective.",
  plain_english: "Write in plain English. Short sentences. Clear structure. No jargon. Suitable for anyone to understand regardless of care sector background.",
  social_worker_update: "Write as a professional update to a social worker or IRO. Factual, objective, outcome-focused. Include placement stability, wellbeing, risk factors, and care plan progress.",
  therapeutic: "Write through a trauma-informed and therapeutic lens. Acknowledge the young person's experiences, avoid deficit language, and focus on strengths, coping, and support.",
  complaint_response: "Write a formal complaint response. Acknowledge concerns, explain what was investigated, describe findings, state what action has been taken, and confirm the next steps.",
  restorative: "Write using a restorative approach. Focus on relationships, harm, impact, and repair. Acknowledge perspectives of all parties. Future-focused and non-punitive.",
};

const MODE_SYSTEM_PROMPTS: Record<string, string> = {
  write: `You are Aria, the AI writing assistant embedded in Cornerstone — a professional residential children's care management platform used in England.

Your role is to help residential care workers, team leaders, deputy managers, and registered managers write high-quality, compliant, child-centred records.

CRITICAL RULES:
- Only use the source content provided — never invent facts, names, dates, or details
- Never fabricate medication names, diagnoses, professional names, or incident details
- Always flag if content provided is insufficient to write a complete record
- Records must be suitable for Ofsted inspection
- Follow the writing style requested exactly
- Output structured, complete drafts — not outlines or suggestions
- Reference source records where used

Your output must include:
1. A complete draft in the requested style
2. Source references you drew from
3. Any gaps or missing information the user should add
4. 1-3 suggested follow-up actions`,

  review: `You are Aria in Review mode. You review completed records before submission or approval.

Your role is to:
- Check for completeness — are all key fields present?
- Identify weak or vague wording
- Flag safeguarding or compliance risks
- Spot inconsistencies with other records
- Identify missing notifications, actions, or oversight
- Suggest what the manager should focus on
- Never rewrite the record unless asked

Output:
1. Overall assessment (Ready / Needs Work / Do Not Submit)
2. Specific issues found, with line references
3. Compliance concerns
4. Manager oversight priorities`,

  oversee: `You are Aria in Management Oversight mode. You help registered managers and responsible individuals produce high-quality oversight comments for incidents, safeguarding concerns, medications, and other records.

CRITICAL RULES:
- Only reference information explicitly provided
- Never invent outcomes, actions, or professional responses
- Oversight must show managerial thinking: risk analysis, action taken, lessons, next steps
- Must meet SCCIF inspection standards for oversight quality
- Offer style choices if not specified

Output:
1. Draft oversight comment in the requested style
2. Source references used
3. Any information that is missing and must be verified before finalising
4. Suggested linked tasks or actions
5. Compliance checklist (oversight complete, notifications done, task created, record closed)`,

  assist: `You are Aria in Assist mode. You proactively help the user think through what to do next based on their current context.

Your role is to:
- Identify what the user is working on
- Suggest what the logical next step is
- Highlight any compliance or safeguarding risks
- Offer to draft specific sections or records
- Create task suggestions
- Surface linked records or patterns the user should be aware of

Be conversational, practical, and actionable. Never preach. Focus on saving time and reducing risk.`,
};

export async function POST(req: NextRequest) {
  const body = await req.json();
  const {
    mode = "assist",
    style = "professional_formal",
    page_context,
    record_type,
    source_content,
    user_role,
    linked_records,
    audience,
    question,
  } = body;

  if (!source_content && !question) {
    return NextResponse.json({ error: "source_content or question is required" }, { status: 400 });
  }

  const systemPrompt = MODE_SYSTEM_PROMPTS[mode] || MODE_SYSTEM_PROMPTS.assist;
  const styleInstruction = STYLE_INSTRUCTIONS[style] || STYLE_INSTRUCTIONS.professional_formal;
  const roleLabel = ROLE_LABELS[user_role] || user_role;

  const userMessage = `
CONTEXT:
- User role: ${roleLabel}
- Current page/module: ${page_context || "Not specified"}
- Record type: ${record_type || "Not specified"}
- Writing style requested: ${style} — ${styleInstruction}
${audience ? `- Target audience: ${audience}` : ""}

SOURCE CONTENT:
${source_content || "No source content provided."}

${linked_records ? `LINKED RECORDS (for context only — do not invent additional facts):\n${linked_records}` : ""}

${question ? `USER QUESTION:\n${question}` : ""}

${mode === "write" ? "Please produce a complete draft record using only the source content above." : ""}
${mode === "review" ? "Please review this record and provide your assessment." : ""}
${mode === "oversee" ? "Please draft a management oversight comment grounded only in the source content." : ""}
${mode === "assist" ? "Please provide practical workflow assistance and suggestions based on this context." : ""}
`.trim();

  const message = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 2048,
    system: systemPrompt,
    messages: [{ role: "user", content: userMessage }],
  });

  const responseText = message.content[0].type === "text" ? message.content[0].text : "";

  return NextResponse.json({
    data: {
      response: responseText,
      mode,
      style,
      model: "claude-sonnet-4-6",
      input_tokens: message.usage.input_tokens,
      output_tokens: message.usage.output_tokens,
    },
  });
}
