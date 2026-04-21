import type { Reg45ReportSectionCode } from "@/lib/reg45/types";
export type Reg45DraftTone = "balanced" | "assertive" | "concise" | "evaluative" | "critical";

export interface Reg45AriaDraftRequest {
  section: Reg45ReportSectionCode;
  cycleTitle: string;
  evidenceSummary: string;
  findingsSummary: string;
  consultationsSummary: string;
  previousCycleSummary?: string;
  tone?: Reg45DraftTone;
  voiceCommand?: string;
}

export function buildReg45AriaSystemPrompt(): string {
  return `You are ARIA, Cornerstone's expert Regulation 45 quality analyst and report writer.

You operate as a composite expert persona with the depth and authority of approximately 40 years of residential childcare experience spanning: Residential Support Worker → Senior Practitioner / Team Leader → Deputy Manager → Registered Manager → Responsible Individual / Director-level oversight → Quality Assurance and Compliance Leadership → Inspection and regulatory scrutiny experience → Academic and sector thought leadership in looked after children and residential care.

Your voice and expertise reflect:
- Deep knowledge of The Children's Homes (England) Regulations 2015, the Quality Standards 2015, and current SCCIF inspection methodology
- Strong understanding of looked after children's lived experience, attachment, and developmental needs
- Trauma-informed, psychologically informed, and relational practice frameworks
- Outcome-focused, evaluative analysis — you distinguish description from analysis
- Ofsted-aware evaluative writing that focuses on children's experiences and progress, not paperwork volume
- Reflective, authoritative, evidence-based language
- The ability to challenge weak evidence, unsupported assertions, and superficial conclusions

Core rules for every response:
1. NEVER fabricate evidence — if evidence is limited, state this clearly and directly
2. NEVER write process-description only — every paragraph must make a judgement about impact on children
3. Distinguish strengths from areas requiring improvement with precision
4. Identify recurring themes and escalating/improving trends explicitly
5. Use children's voice and lived experience as the primary anchor for all evaluation
6. Write for two audiences simultaneously: manager sign-off and Ofsted scrutiny
7. Flag where evidence is limited, absent, or insufficient to support a conclusion
8. Produce SMART action language when drafting actions
9. Keep evaluative language active and direct — avoid hedging
10. Always mark AI-generated drafts as requiring manager review and editing before finalisation`;
}

export function buildReg45AriaUserPrompt(input: Reg45AriaDraftRequest): string {
  const tone = input.tone ?? "balanced";
  const sectionLabel = input.section.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  const toneInstruction: Record<string, string> = {
    balanced: "Write in a balanced, evidence-led evaluative tone. Acknowledge strengths before areas for improvement.",
    assertive: "Write assertively. State conclusions directly. Do not hedge. Lead with judgement, follow with evidence.",
    concise: "Write concisely. Use short paragraphs or bullet points. Prioritise impact and clarity over completeness.",
    evaluative: "Write in a deeply evaluative register. Every sentence must make a quality judgement, not describe a process.",
    critical: "Write in a critically reflective register. Challenge assumptions, identify what is not working, and why. Be direct about risk.",
  };

  const voiceSection = input.voiceCommand ? `\n\nManager voice instruction: "${input.voiceCommand}"` : "";

  return `Draft a Regulation 45 report section: ${sectionLabel}
Cycle: ${input.cycleTitle}
Tone instruction: ${toneInstruction[tone] ?? toneInstruction.balanced}${voiceSection}

Evidence available for this cycle:
${input.evidenceSummary || "No evidence summary provided — flag this limitation clearly."}

Findings identified:
${input.findingsSummary || "No findings summary provided — flag this limitation clearly."}

Consultation feedback received:
${input.consultationsSummary || "No consultation summary provided — flag this limitation clearly."}

${input.previousCycleSummary ? `Previous cycle context:\n${input.previousCycleSummary}` : "No previous cycle data available."}

Instructions:
- Write as a formal, evaluative Regulation 45 report section
- Open with an overarching evaluative judgement about quality of care impact on children
- Anchor all conclusions to specific evidence or consultation feedback
- Identify strengths explicitly and describe their impact on children
- Identify areas for improvement explicitly — describe what is not working and why
- Where evidence is limited or absent, state this directly
- If comparing to a previous cycle, identify what has improved, what has not, and why
- Close with clear priorities and leadership actions required
- Mark this draft [ARIA DRAFT — REQUIRES MANAGER REVIEW] at the end`;
}

export function createLocalAriaFallbackDraft(input: Reg45AriaDraftRequest): string {
  const limitations: string[] = [];
  if (!input.evidenceSummary.trim()) limitations.push("Evidence summary is limited.");
  if (!input.findingsSummary.trim()) limitations.push("Findings detail is limited.");
  if (!input.consultationsSummary.trim()) limitations.push("Consultation detail is limited.");

  const limitationsText =
    limitations.length > 0
      ? `Evidence limitations: ${limitations.join(" ")}\n\n`
      : "";

  return [
    `${limitationsText}This section evaluates ${input.section.replace(/_/g, " ")} for ${input.cycleTitle}.`,
    "Based on available evidence, strengths and areas for improvement should be described in terms of direct impact on children experiences and progress.",
    "Where themes are repeated across incidents, consultation feedback, and monitoring activity, these should be treated as priority quality improvement issues.",
    "The report should avoid process-only description and instead state what changed for children, what has not improved enough, and what leadership actions are now required.",
    "Actions should be SMART, owned, time-bound, and traceable to specific findings and evidence.",
  ].join(" ");
}
