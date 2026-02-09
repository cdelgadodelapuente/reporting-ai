import test from "node:test";
import assert from "node:assert/strict";
import { runReportPipeline } from "../lib/reporting/pipeline.mjs";

function makeAnthropic(responses) {
  const calls = [];
  return {
    calls,
    messages: {
      create: async ({ messages }) => {
        const prompt = messages?.[0]?.content || "";
        calls.push(prompt);
        const text = responses.shift() ?? "";
        return { content: [{ type: "text", text }] };
      },
    },
  };
}

const baseFacts = {
  audience: "executive",
  has_dates: false,
  has_metrics: false,
  allowed_vendors: [],
  counts: { blocked: 0 },
  status: "On Track",
};

function buildPrompt(audience, ctx) {
  return `PROMPT ${audience}\n${ctx.formattedData}\n${ctx.factsBlock}`;
}

test("pipeline order: generate happens before editor/repair", async () => {
  const report = [
    "## Summary",
    "Text",
    "## Key Wins",
    "- Item",
    "## In Progress",
    "- Item",
    "## Next Week",
    "- Item",
    "- Item 2",
    "## Executive Snapshot",
    "Status: On Track",
    "Primary Risk: None",
    "Confidence: High",
    "Intervention Required: No",
  ].join("\n");

  const anthropic = makeAnthropic([report, report]); // generate, editor
  const logs = [];
  const res = await runReportPipeline({
    scenarioId: "s1",
    audience: "executive",
    formattedData: "Done: 1",
    facts: baseFacts,
    factsBlock: "FACTS",
    periodLabel: "Sprint 1",
    buildPrompt,
    anthropic,
    model: "test",
    logger: (entry) => logs.push(entry.promptType),
  });

  assert.equal(res.ok, true);
  const firstGenerateIndex = logs.indexOf("generate");
  const firstEditorIndex = logs.indexOf("editor");
  assert.ok(firstGenerateIndex !== -1);
  assert.ok(firstEditorIndex === -1 || firstGenerateIndex < firstEditorIndex);
});

test("formattedData empty -> no LLM calls, deterministic error", async () => {
  const anthropic = makeAnthropic(["SHOULD_NOT_RUN"]);
  const res = await runReportPipeline({
    scenarioId: "s2",
    audience: "executive",
    formattedData: "",
    facts: baseFacts,
    factsBlock: "FACTS",
    periodLabel: "Sprint 1",
    buildPrompt,
    anthropic,
    model: "test",
  });
  assert.equal(res.ok, false);
  assert.equal(anthropic.calls.length, 0);
  assert.ok(res.errorText.includes("Insufficient sprint data"));
});

test("repair output with garbage phrase is discarded", async () => {
  const reportMissing = [
    "## Summary",
    "Text",
    "## Key Wins",
    "- Item",
    "## In Progress",
    "- Item",
    "## Executive Snapshot",
    "Status: On Track",
    "Primary Risk: None",
    "Confidence: High",
    "Intervention Required: No",
  ].join("\n");
  const garbageRepair = "No previous content was provided.";
  const anthropic = makeAnthropic([reportMissing, reportMissing, reportMissing, garbageRepair]); // generate, editor, strict rewrite, repair
  const res = await runReportPipeline({
    scenarioId: "s3",
    audience: "executive",
    formattedData: "Done: 1",
    facts: baseFacts,
    factsBlock: "FACTS",
    periodLabel: "Sprint 1",
    buildPrompt,
    anthropic,
    model: "test",
  });
  assert.equal(res.didDiscardRepair, true);
  assert.ok(res.finalReport.includes("## Summary"));
  assert.ok(!res.finalReport.includes("No previous content was provided"));
});

test("editor output empty -> original preserved", async () => {
  const report = [
    "## Summary",
    "Text",
    "## Key Wins",
    "- Item",
    "## In Progress",
    "- Item",
    "## Next Week",
    "- Item",
    "- Item 2",
    "## Executive Snapshot",
    "Status: On Track",
    "Primary Risk: None",
    "Confidence: High",
    "Intervention Required: No",
  ].join("\n");
  const anthropic = makeAnthropic([report, ""]); // generate, editor
  const res = await runReportPipeline({
    scenarioId: "s4",
    audience: "executive",
    formattedData: "Done: 1",
    facts: baseFacts,
    factsBlock: "FACTS",
    periodLabel: "Sprint 1",
    buildPrompt,
    anthropic,
    model: "test",
  });
  assert.equal(res.didDiscardEditor, true);
  assert.ok(res.finalReport.includes("## Summary"));
});
