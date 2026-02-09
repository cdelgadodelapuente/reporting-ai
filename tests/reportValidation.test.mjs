import test from "node:test";
import assert from "node:assert/strict";
import {
  validateReport,
  mergeSections,
  normalizeHeadings,
} from "../lib/reporting/validation.mjs";

test("normalizeHeadings splits inline headings", () => {
  const text = "Summary text. ## Key Wins - Item one";
  const norm = normalizeHeadings(text);
  assert.ok(norm.includes("\n\n## Key Wins"));
});

test("validateReport - executive missing snapshot", () => {
  const report = [
    "## Summary",
    "Text",
    "## Key Wins",
    "- Win 1",
    "## In Progress",
    "- Item",
    "## Next Week",
    "- Item",
    "- Item 2",
  ].join("\n");
  const res = validateReport(report, "executive", { status: "On Track" });
  assert.equal(res.ok, false);
  assert.ok(res.missingHeadings.includes("## Executive Snapshot"));
});

test("validateReport - executive snapshot optional without status", () => {
  const report = [
    "## Summary",
    "Text",
    "## Key Wins",
    "- Win 1",
    "## In Progress",
    "- Item",
    "## Next Week",
    "- Item",
    "- Item 2",
  ].join("\n");
  const res = validateReport(report, "executive", { status: null });
  assert.equal(res.ok, true);
});

test("validateReport - client next checkpoint optional without dates", () => {
  const report = [
    "## This Week's Progress",
    "Text",
    "## What You'll See",
    "- Item",
    "## Coming Next Week",
    "- Item",
    "## Timeline Update",
    "On track",
  ].join("\n");
  const res = validateReport(report, "client", { has_checkpoint_date: false });
  assert.equal(res.ok, true);
});

test("validateReport - technical empty Next Sprint", () => {
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
    "",
  ].join("\n");
  const res = validateReport(report, "technical");
  assert.equal(res.ok, false);
  assert.ok(res.emptyHeadings.includes("## Next Sprint"));
});

test("mergeRepairSections - inserts missing Next Sprint", () => {
  const original = [
    "## Summary",
    "Text",
    "## Key Achievements",
    "- Item",
    "## In Progress",
    "- Item",
    "## Blockers",
    "- Item",
    "## Next Sprint",
    "",
  ].join("\n");

  const repair = [
    "## Next Sprint",
    "- Mitigation step 1",
    "- Mitigation step 2",
  ].join("\n");

  const merged = mergeSections(
    original,
    repair,
    ["## Summary", "## Key Achievements", "## In Progress", "## Blockers", "## Next Sprint"]
  );
  assert.ok(merged.includes("## Next Sprint"));
  assert.ok(merged.includes("- Mitigation step 1"));
});

test("mergeRepairSections does not append extra headings", () => {
  const original = [
    "## Summary",
    "All good",
    "## Key Achievements",
    "- Shipped thing",
    "## In Progress",
    "- Item",
    "## Blockers",
    "- None",
    "## Next Sprint",
    "- Item",
  ].join("\n");

  const repair = [
    "## Summary",
    "None.",
    "## Random Extra",
    "None.",
  ].join("\n");

  const merged = mergeSections(
    original,
    repair,
    ["## Summary", "## Key Achievements", "## In Progress", "## Blockers", "## Next Sprint"]
  );

  assert.ok(!merged.includes("## Random Extra"));
  assert.ok(!merged.includes("None."));
});
