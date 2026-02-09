import fs from "fs";
import path from "path";
import Anthropic from "@anthropic-ai/sdk";
import { parseScore } from "../lib/score/parseScore.mjs";
import { buildFacts, formatFactsBlock } from "../lib/reporting/facts.mjs";
import { runReportPipeline } from "../lib/reporting/pipeline.mjs";

function loadEnvLocal() {
  try {
    const envPath = path.join(process.cwd(), ".env.local");
    if (!fs.existsSync(envPath)) return;
    const raw = fs.readFileSync(envPath, "utf-8");
    for (const line of raw.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const idx = trimmed.indexOf("=");
      if (idx === -1) continue;
      const key = trimmed.slice(0, idx).trim();
      let value = trimmed.slice(idx + 1).trim();
      if ((value.startsWith("\"") && value.endsWith("\"")) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  } catch {
    // ignore env loading errors
  }
}

loadEnvLocal();

const root = path.resolve(".");
const fixturesPath = path.join(root, "data", "prompt-fixtures.json");
const outDir = path.join(root, "data", "prompt-runs");

const MODEL = (process.env.ANTHROPIC_MODEL || "claude-sonnet-4-5-20250929").trim();
const API_KEY = process.env.ANTHROPIC_API_KEY || "";

if (!API_KEY) {
  console.error("Missing ANTHROPIC_API_KEY in environment.");
  process.exit(1);
}

const args = process.argv.slice(2);
const getArg = (key) => {
  const i = args.indexOf(key);
  return i >= 0 ? args[i + 1] : null;
};

const audienceFilter = getArg("--audience"); // executive | technical | client
const scenarioFilter = getArg("--scenario"); // scenario id
const doScore = args.includes("--score");

const AUDIENCES = ["executive", "technical", "client"];

function normalize(str) {
  return (str || "").trim().toLowerCase();
}

const STATUS_DONE = ["done", "closed", "resolved"];
const STATUS_IN_PROGRESS = ["in progress", "doing", "active", "in review"];
const STATUS_BLOCKED = ["blocked", "on hold", "impeded"];

function classifyStatus(status) {
  const s = normalize(status);
  if (STATUS_DONE.some((k) => s.includes(k))) return "done";
  if (STATUS_BLOCKED.some((k) => s.includes(k))) return "blocked";
  if (STATUS_IN_PROGRESS.some((k) => s.includes(k))) return "in_progress";
  return "other";
}

function summarizeList(items, max = 5) {
  return items.slice(0, max).map((i) => {
    const summary = i.summary ? ` - ${i.summary}` : "";
    return `• ${summary.replace(/^ - /, "")}`;
  });
}

function splitByType(issues) {
  const bugs = [];
  const features = [];
  const other = [];

  for (const i of issues) {
    const t = normalize(i.type);
    if (t.includes("bug")) bugs.push(i);
    else if (t.includes("story") || t.includes("feature") || t.includes("task")) {
      features.push(i);
    } else {
      other.push(i);
    }
  }

  return { bugs, features, other };
}

function formatSprintData(issues) {
  const done = issues.filter((i) => classifyStatus(i.status) === "done");
  const blocked = issues.filter((i) => classifyStatus(i.status) === "blocked");
  const inProgress = issues.filter((i) => classifyStatus(i.status) === "in_progress");

  const doneSplit = splitByType(done);

  const lines = [];

  lines.push(`Totals: ${issues.length} issues`);
  lines.push(`- Done: ${done.length}`);
  lines.push(`- In Progress: ${inProgress.length}`);
  lines.push(`- Blocked: ${blocked.length}`);

  if (done.length > 0) {
    lines.push("");
    lines.push("Completed:");
    if (doneSplit.features.length > 0) {
      lines.push(`- Features (${doneSplit.features.length}):`);
      lines.push(...summarizeList(doneSplit.features, 4));
    }
    if (doneSplit.bugs.length > 0) {
      lines.push(`- Bugs fixed (${doneSplit.bugs.length}):`);
      lines.push(...summarizeList(doneSplit.bugs, 3));
    }
    if (doneSplit.other.length > 0) {
      lines.push(`- Other (${doneSplit.other.length}):`);
      lines.push(...summarizeList(doneSplit.other, 3));
    }
  }

  if (inProgress.length > 0) {
    lines.push("");
    lines.push("In Progress:");
    lines.push(...summarizeList(inProgress, 5));
  }

  if (blocked.length > 0) {
    lines.push("");
    lines.push("Blocked:");
    lines.push(...summarizeList(blocked, 5));
  }

  return lines.join("\n");
}

function escapeCsv(value) {
  const str = String(value ?? "");
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, "\"\"")}"`;
  }
  return str;
}

const EXECUTIVE_TEMPLATE = `
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
- No ticket IDs (e.g., PROJ-123)
- Avoid vague phrases ("making progress")
- Avoid filler phrases ("we're excited", "strong sprint", etc.)
- Write in short, sharp sentences
- Quantify impact when possible
- Be honest about risks/blockers
- If no risks, explicitly state: "No material risks this sprint."
- Do not repeat exact metrics from Summary in Key Wins unless adding new context
- Summary must not repeat numbers that appear in Key Wins
- Finish the report. Do not cut off mid-sentence.
- Do not introduce any dates or metrics not present in Sprint Data.
- If missing, use "TBD" or "Targeting next sprint".

OUTPUT STRUCTURE:
## Summary
[2-3 sentences: key achievement + status + top risk if any]
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
Now write the executive summary following this exact format.
`.trim();

const TECHNICAL_TEMPLATE = `
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
- Prefer metrics over implementation details
- Avoid naming specific libraries/tools/vendors (Stripe/Redis/Datadog/Kafka/etc.) unless decision-critical
- If describing a fix, explain root cause in one line max
- Avoid narrative storytelling
- Focus on what changed system behavior
- Include technical detail and metrics where possible
- Be honest about technical debt and blockers
- If no shipped items (Done: 0), Key Achievements must be 0-1 bullets max
- Finish the report. Do not cut off mid-sentence.
- Do not introduce any dates or metrics not present in Sprint Data.
- If missing, use "TBD" or "In progress".

OUTPUT STRUCTURE:
## Summary
[2-3 sentences: key technical achievement + velocity/status + upcoming focus]
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

If Done: 0, emphasize Blockers + Next Sprint mitigation and keep Key Achievements to 0-1 bullets.
Ensure ## Next Sprint has 3-4 bullets and is never empty.
If Done: 0, emphasize Blockers + Next Sprint mitigation and keep Key Achievements to 0-1 bullets.
Ensure ## Next Sprint has 3-4 bullets and is never empty.
Now write the technical update following this exact format.
`.trim();

const CLIENT_TEMPLATE = `
You are a Customer Success Manager writing a progress update for an external client.
Your writing is reassuring, clear, and focused on what the client will see.

AUDIENCE:
- External, non-technical stakeholders
- Care about timeline, progress, and deliverables
- Reading time: 2-3 minutes

PERIOD: {{periodLabel}}
SPRINT DATA:
{{formattedData}}
FACTS CONTRACT:
{{factsBlock}}

CONSTRAINTS:
- Max 240 words (hard limit)
- Each bullet ≤ 20 words
- Avoid emotional filler ("we're excited", "happy to share")
- Use confident tone, not apologetic tone
- If delayed, include specific date and mitigation plan
- No vague language ("temporary roadblock", "in progress")
- Every bullet must contain either a date or a measurable outcome
- If dates exist in Sprint Data, include at least one concrete date
- No technical jargon (or explain it)
- No internal ticket IDs or team details
- Emphasize visible progress and next steps
- Do not introduce any dates or metrics not present in Sprint Data.
- If missing, use "Targeting next sprint" or omit the date.

OUTPUT STRUCTURE:
## This Week's Progress
[2-3 sentences: what shipped that affects them + overall status]
## What You'll See
[3-4 bullets. "Feature - What it enables - When available"]
## Coming Next Week
[2-3 bullets. What will be ready next]
## Timeline Update
[1-2 sentences: on-track or explain delay]
## Next Checkpoint
- Next update: [date]
- Immediate actions underway: [1 line]

If nothing shipped or sprint blocked, include:
1) What is blocked (plain language)
2) Mitigation underway
3) What we need from others + date
4) Next checkpoint date (next update)
5) Best estimate delivery date/range
Avoid defensive/vague language.
Include Next Checkpoint ONLY if a date exists in Sprint Data.
Now write the client update following this exact format.
`.trim();

const TEMPLATES = {
  executive: EXECUTIVE_TEMPLATE,
  technical: TECHNICAL_TEMPLATE,
  client: CLIENT_TEMPLATE,
};

function buildPrompt(audience, ctx) {
  const template = TEMPLATES[audience];
  return template
    .replace("{{periodLabel}}", ctx.periodLabel)
    .replace("{{formattedData}}", ctx.formattedData)
    .replace("{{factsBlock}}", ctx.factsBlock);
}

async function scoreReport(anthropic, reportText) {
  const prompt = `
Rate this status update on a 1-10 scale for each criterion.
Return ONLY valid JSON. Do not wrap in markdown. Do not include backticks.
Do not explain. Output must start with { and end with }.
If you output anything other than pure JSON, the result will be discarded.

Criteria:
1. Clarity
2. Conciseness
3. Impact focus
4. Completeness
5. Tone

Output JSON:
{
  "clarity": 8,
  "conciseness": 7,
  "impact": 8,
  "completeness": 7,
  "tone": 8,
  "total": 38,
  "notes": "Short feedback"
}

Report:
${reportText}
`.trim();

  const msg = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 300,
    messages: [{ role: "user", content: prompt }],
  });

  const text = msg.content
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("\n")
    .trim();

  return parseScore(text);
}

async function main() {
  const raw = fs.readFileSync(fixturesPath, "utf-8");
  const fixtures = JSON.parse(raw);
  const scenarios = fixtures.scenarios || [];

  const filteredScenarios = scenarioFilter
    ? scenarios.filter((s) => s.id === scenarioFilter)
    : scenarios;

  const audiences = audienceFilter
    ? AUDIENCES.filter((a) => a === audienceFilter)
    : AUDIENCES;

  const anthropic = new Anthropic({ apiKey: API_KEY });

  const results = [];

  for (const scenario of filteredScenarios) {
    for (const audience of audiences) {
      const formattedData = formatSprintData(scenario.issues || []);
      const facts = buildFacts(scenario.issues || [], audience);
      const factsBlock = formatFactsBlock(facts);

      const pipeline = await runReportPipeline({
        scenarioId: scenario.id,
        audience,
        formattedData,
        facts,
        factsBlock,
        periodLabel: scenario.periodLabel,
        buildPrompt,
        anthropic,
        model: MODEL,
        logger: (entry) => {
          if (entry?.promptType) {
            console.log("[pipeline]", entry);
          }
        },
      });

      if (!pipeline.ok) {
        console.warn(`[skip] ${scenario.id} / ${audience}: ${pipeline.errorText}`);
        continue;
      }

      const draftReport = pipeline.draftReport;
      const finalReport = pipeline.finalReport;

      console.log(
        `[len] ${scenario.id}/${audience} draft=${draftReport.length} edited=${finalReport.length}`
      );

      const row = {
        scenario_id: scenario.id,
        project: scenario.project,
        period: scenario.periodLabel,
        audience,
        created_at: new Date().toISOString(),
        report: finalReport,
      };

      if (doScore) {
        row.score = await scoreReport(anthropic, finalReport);
      }

      results.push(row);
      console.log(`[ok] ${scenario.id} / ${audience}`);
    }
  }

  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const outPath = path.join(
    outDir,
    `prompt-run-${timestamp}.json`
  );
  fs.writeFileSync(outPath, JSON.stringify({ model: MODEL, results }, null, 2));
  console.log(`\nSaved: ${outPath}`);

  const csvHeaders = [
    "scenario_id",
    "project",
    "period",
    "audience",
    "created_at",
    "score_total",
    "score_clarity",
    "score_conciseness",
    "score_impact",
    "score_completeness",
    "score_tone",
    "score_notes",
    "report"
  ];
  const csvRows = [csvHeaders.join(",")];
  for (const r of results) {
    const score = r.score || {};
    csvRows.push(
      [
        r.scenario_id,
        r.project,
        r.period,
        r.audience,
        r.created_at,
        score.total ?? "",
        score.clarity ?? "",
        score.conciseness ?? "",
        score.impact ?? "",
        score.completeness ?? "",
        score.tone ?? "",
        score.notes ?? score.error ?? "",
        r.report
      ]
        .map(escapeCsv)
        .join(",")
    );
  }

  const csvPath = path.join(outDir, `prompt-run-${timestamp}.csv`);
  fs.writeFileSync(csvPath, csvRows.join("\n"));
  console.log(`Saved: ${csvPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
