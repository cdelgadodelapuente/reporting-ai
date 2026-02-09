import test from "node:test";
import assert from "node:assert/strict";
import { validateAndFix, needsCompression } from "../lib/reporting/postProcess.mjs";

test("postProcess removes dates when no dates in facts", () => {
  const report = "## Summary\nShipping May 21.\n## Key Wins\n- Launched feature";
  const facts = { audience: "executive", has_dates: false, has_metrics: false, allowed_vendors: [], counts: { blocked: 0 } };
  const out = validateAndFix(report, facts);
  assert.ok(!out.text.includes("May 21"));
});

test("postProcess strips vendor names for exec/client", () => {
  const report = "## Summary\nIntegrated Stripe for payments.\n## Key Wins\n- Stripe live";
  const facts = { audience: "client", has_dates: true, has_metrics: false, allowed_vendors: [], counts: { blocked: 0 } };
  const out = validateAndFix(report, facts);
  assert.ok(!out.text.toLowerCase().includes("stripe"));
});

test("postProcess keeps snapshot only when status inferred", () => {
  const report = "## Summary\nText\n## Executive Snapshot\nStatus: On Track\nPrimary Risk: None\nConfidence: High\nIntervention Required: No";
  const facts = { audience: "executive", has_dates: true, has_metrics: false, allowed_vendors: [], counts: { blocked: 0 }, status: null };
  const out = validateAndFix(report, facts);
  assert.ok(!out.text.includes("## Executive Snapshot"));
});

test("postProcess flags over limit", () => {
  const longText = Array(500).fill("word").join(" ");
  const report = `## Summary\n${longText}\n## Key Wins\n- Item\n## In Progress\n- Item\n## Next Week\n- Item\n## Executive Snapshot\nStatus: On Track\nPrimary Risk: None\nConfidence: Medium\nIntervention Required: No`;
  const facts = { audience: "executive", has_dates: true, has_metrics: false, allowed_vendors: [], counts: { blocked: 0 }, status: "On Track" };
  const out = validateAndFix(report, facts);
  assert.ok(needsCompression(out.warnings));
});

test("postProcess removes Next Checkpoint when no dates", () => {
  const report = [
    "## This Week's Progress",
    "Text",
    "## What You'll See",
    "- Item",
    "## Coming Next Week",
    "- Item",
    "## Timeline Update",
    "On track",
    "## Next Checkpoint",
    "Next update: May 21",
  ].join("\n");
  const facts = { audience: "client", has_dates: false, has_metrics: false, allowed_vendors: [], counts: { blocked: 0 } };
  const out = validateAndFix(report, facts);
  assert.ok(!out.text.includes("## Next Checkpoint"));
});

test("no duplicate Summary heading after normalize", () => {
  const report = "## Summary\nText\n## Summary\nMore";
  const facts = { audience: "executive", has_dates: true, has_metrics: false, allowed_vendors: [], counts: { blocked: 0 }, status: "On Track" };
  const out = validateAndFix(report, facts);
  const count = (out.text.match(/## Summary/g) || []).length;
  assert.equal(count, 1);
});

test("postProcess does not drop headingless reports", () => {
  const report = "Plain text with no headings at all.";
  const facts = { audience: "technical", has_dates: true, has_metrics: false, allowed_vendors: [], counts: { blocked: 0 } };
  const out = validateAndFix(report, facts);
  assert.ok(out.text.length > 0);
});

test("executive snapshot appears once for executive", () => {
  const report = [
    "## Summary",
    "Text",
    "## Key Wins",
    "- Win",
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
    "## Executive Snapshot",
    "Status: On Track",
    "Primary Risk: None",
    "Confidence: High",
    "Intervention Required: No",
  ].join("\n");
  const facts = { audience: "executive", has_dates: true, has_metrics: false, allowed_vendors: [], counts: { blocked: 0 }, status: "On Track" };
  const out = validateAndFix(report, facts);
  const count = (out.text.match(/## Executive Snapshot/g) || []).length;
  assert.equal(count, 1);
});

test("technical/client outputs contain zero Executive Snapshot", () => {
  const report = [
    "## Summary",
    "Text",
    "## Key Achievements",
    "- Item",
    "## In Progress",
    "- Item",
    "## Blockers",
    "- Item",
    "## Next Sprint",
    "- Item",
    "## Executive Snapshot",
    "Status: On Track",
    "Primary Risk: None",
    "Confidence: High",
    "Intervention Required: No",
  ].join("\n");
  const techFacts = { audience: "technical", has_dates: true, has_metrics: false, allowed_vendors: [], counts: { blocked: 0 } };
  const clientFacts = { audience: "client", has_dates: true, has_metrics: false, allowed_vendors: [], counts: { blocked: 0 } };
  const techOut = validateAndFix(report, techFacts);
  const clientOut = validateAndFix(report, clientFacts);
  assert.equal((techOut.text.match(/## Executive Snapshot/g) || []).length, 0);
  assert.equal((clientOut.text.match(/## Executive Snapshot/g) || []).length, 0);
});
