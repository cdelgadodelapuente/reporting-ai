import test from "node:test";
import assert from "node:assert/strict";
import { parseScore } from "../lib/score/parseScore.mjs";
import { hasRequiredHeadings, preservesNumbers } from "../lib/score/validateReport.mjs";

const base = {
  clarity: 8,
  conciseness: 7,
  impact: 7,
  completeness: 8,
  tone: 8,
  total: 38,
  notes: "ok",
};

test("parseScore - pure JSON", () => {
  const raw = JSON.stringify(base);
  const out = parseScore(raw);
  assert.equal(out.total, 38);
});

test("parseScore - fenced ```json```", () => {
  const raw = "```json\n" + JSON.stringify(base) + "\n```";
  const out = parseScore(raw);
  assert.equal(out.total, 38);
});

test("parseScore - fenced ``` ```", () => {
  const raw = "```\n" + JSON.stringify(base) + "\n```";
  const out = parseScore(raw);
  assert.equal(out.total, 38);
});

test("parseScore - JSON with pre/post text", () => {
  const raw = "Here:\n" + JSON.stringify(base) + "\nThanks";
  const out = parseScore(raw);
  assert.equal(out.total, 38);
});

test("parseScore - invalid JSON", () => {
  const raw = "{ invalid json";
  const out = parseScore(raw);
  assert.equal(out.error, "Score parse failed");
  assert.ok(out.raw);
});

test("validateReport - required headings", () => {
  const report = [
    "## Summary",
    "## Key Wins",
    "## In Progress",
    "## Risks",
    "## Next Week",
    "## Executive Snapshot",
  ].join("\n");
  assert.equal(hasRequiredHeadings(report, "executive"), true);
});

test("validateReport - preserves numbers", () => {
  const draft = "Checkout +15% and latency 300ms. Launch Mar 15.";
  const edited = "Checkout +15% and latency 300ms. Launch Mar 15.";
  assert.equal(preservesNumbers(draft, edited), true);
});

test("validateReport - missing numbers", () => {
  const draft = "Checkout +15% and latency 300ms. Launch Mar 15.";
  const edited = "Checkout improved and latency reduced. Launch soon.";
  assert.equal(preservesNumbers(draft, edited), false);
});
