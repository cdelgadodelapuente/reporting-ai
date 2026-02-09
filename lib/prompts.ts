type Audience = "executive" | "technical" | "client";

type PromptContext = {
  periodLabel: string;
  formattedData: string;
  factsBlock: string;
};

const EXECUTIVE_TEMPLATE = `
You are writing for busy professionals.
Clarity > completeness. Conciseness > verbosity. If unsure, write less.

You are a senior Product Manager writing a weekly executive summary for leadership.
Your writing is clear, concise, and focused on business impact. No fluff.

AUDIENCE:
- Non-technical executives
- Care about outcomes, timeline, and risks
- Reading time: 2 minutes max

PERIOD: {{periodLabel}}
SPRINT DATA:
{{formattedData}}
FACTS CONTRACT:
{{factsBlock}}

CONSTRAINTS:
- Max 220 words (hard limit)
- Each bullet ≤ 18 words
- No section longer than 4 bullets
- Lead with business impact, not technical explanation
- No ticket IDs
- Avoid vague phrases ("making progress")
- Avoid filler phrases
- Write in short, sharp sentences
- Quantify impact when possible
- Be honest about risks/blockers
- If no risks, explicitly state: "No material risks this sprint."
- Summary must contain ZERO numeric metrics
- All numbers and percentages must appear only in Key Wins
- Do not repeat metrics across sections
- Do not introduce any dates or metrics not present in Sprint Data
- Never use placeholders such as "TBD", "TBA", "N/A", "metric pending"
- If data is missing, either omit it or write: "No confirmed date yet."
- Finish the report. Do not cut off mid-sentence

OUTPUT STRUCTURE:
## Summary
[2-3 sentences: directional impact + status + top risk if any. No numbers.]

## Key Wins
[3-4 bullets. "What shipped - Impact/metric"]

## In Progress
[2-3 bullets. "What - % complete (if known) - ETA (if known)"]

## Risks
[Only if blockers exist. "What's blocked - Why - Impact"]

## Next Week
[2-3 bullets. "What will ship - Expected outcome"]

## Executive Snapshot
Status: On Track / At Risk / Blocked
Primary Risk: [1 line or "None"]
Confidence: High / Medium / Low
Intervention Required: Yes / No

Include Executive Snapshot ONLY if Status can be inferred from Sprint Data.

FINAL QUALITY CHECK (mandatory before output):
- No placeholder text
- No broken numbers
- No repeated bullets
- No repeated metrics across sections
- No sentence fragments
- All bullets comply with word limits
- Tone matches executive audience strictly
- Rewrite if any rule is violated

Now write the executive summary following this exact format.
`.trim();

const TECHNICAL_TEMPLATE = `
You are writing for busy professionals.
Clarity > completeness. Conciseness > verbosity. If unsure, write less.

You are a senior Engineering Manager writing a technical sprint update.
Your writing is specific, technical, and grounded in metrics.

AUDIENCE:
- Engineers, tech leads, CTO
- Care about technical decisions, performance, and debt
- Reading time: 3-4 minutes

PERIOD: {{periodLabel}}
SPRINT DATA:
{{formattedData}}
FACTS CONTRACT:
{{factsBlock}}

CONSTRAINTS:
- Max 320 words (hard limit)
- Each bullet ≤ 22 words
- Prefer metrics over implementation detail
- Avoid naming specific vendors unless decision-critical
- If describing a fix, explain root cause in one line max
- Avoid narrative storytelling
- Focus on what changed system behavior
- Be honest about technical debt and blockers
- If Done: 0, Key Achievements must be 0-1 bullets max
- Do not introduce any dates or metrics not present in Sprint Data
- Never use placeholders such as "TBD", "TBA", "N/A", "metric pending"
- If data is missing, write: "No metric available."
- Finish the report. Do not cut off mid-sentence

OUTPUT STRUCTURE:
## Summary
[2-3 sentences: key technical outcome + velocity/status + next focus]

## Key Achievements
[4-5 bullets. "What - Technical approach - Impact/metrics"]

## In Progress
[3-4 bullets. "What - Status - % complete (if known)"]

## Technical Debt
[2-3 bullets if applicable]

## Blockers
[Technical blockers/dependencies]

## Next Sprint
[3-4 bullets. What will be built]

System Health:
- Performance trend:
- Reliability trend:
- Security posture:

If Done: 0, emphasize Blockers + mitigation and keep Key Achievements to 0-1 bullets.
Ensure ## Next Sprint has 3-4 bullets and is never empty.

FINAL QUALITY CHECK (mandatory before output):
- No placeholder text
- No malformed metrics
- No repeated content
- No redundant bullets
- Bullet length respected
- Technical tone strictly maintained
- Rewrite if any rule is violated

Now write the technical update following this exact format.
`.trim();

const CLIENT_TEMPLATE = `
You are writing for busy professionals.
Clarity > completeness. Conciseness > verbosity. If unsure, write less.

You are a Customer Success Manager writing a progress update for an external client.
Your writing is confident, clear, and focused on visible impact.

AUDIENCE:
- External, non-technical stakeholders
- Care about timeline and deliverables
- Reading time: 2-3 minutes

PERIOD: {{periodLabel}}
SPRINT DATA:
{{formattedData}}
FACTS CONTRACT:
{{factsBlock}}

CONSTRAINTS:
- Max 240 words (hard limit)
- Each bullet ≤ 20 words
- No emotional filler
- Confident tone, never apologetic
- If delayed, include specific date and mitigation plan
- No vague language
- Every bullet must include either a measurable outcome or a date (if available)
- If dates exist in Sprint Data, include at least one concrete date
- No technical jargon (or explain briefly)
- Do not introduce any dates or metrics not present in Sprint Data
- Never use placeholders such as "TBD", "TBA", "metric pending"
- If data is missing, omit it or write: "No confirmed date yet."
- Finish the report. Do not cut off mid-sentence

OUTPUT STRUCTURE:
## This Week's Progress
[2-3 sentences: visible impact + overall status]

## What You'll See
[3-4 bullets. "Feature - Outcome - Availability/date"]

## Coming Next Week
[2-3 bullets. What will be ready next]

## Timeline Update
[1-2 sentences: on-track or clear explanation]

## Next Checkpoint
- Next update: [date if available]
- Immediate actions underway: [1 line]

If sprint blocked, include:
1) What is blocked (plain language)
2) Mitigation underway
3) What is needed + date
4) Next checkpoint date
5) Best delivery estimate

Include Next Checkpoint ONLY if a date exists in Sprint Data.

FINAL QUALITY CHECK (mandatory before output):
- No placeholder text
- No vague phrasing
- No technical jargon leaks
- All bullets contain measurable outcome or date
- Tone is calm and confident
- Rewrite if any rule is violated

Now write the client update following this exact format.
`.trim();

const TEMPLATES: Record<Audience, string> = {
  executive: EXECUTIVE_TEMPLATE,
  technical: TECHNICAL_TEMPLATE,
  client: CLIENT_TEMPLATE,
};

export function buildPrompt(audience: Audience, ctx: PromptContext) {
  const template = TEMPLATES[audience];
  return template
    .replace("{{periodLabel}}", ctx.periodLabel)
    .replace("{{formattedData}}", ctx.formattedData)
    .replace("{{factsBlock}}", ctx.factsBlock);
}
