import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const promptFile = "/Users/christiandelgado/Desktop/reporting-ai/lib/prompts.ts";
const text = fs.readFileSync(promptFile, "utf-8");

test("technical template includes denylist constraint", () => {
  assert.ok(
    text.includes("Avoid naming specific vendors unless decision-critical"),
    "Denylist constraint missing"
  );
});

test("executive template includes Executive Snapshot", () => {
  assert.ok(text.includes("## Executive Snapshot"));
});

test("client template includes blocked-mode clause and date requirement", () => {
  assert.ok(text.includes("If sprint blocked"));
  assert.ok(text.includes("If dates exist in Sprint Data"));
});

test("templates include facts contract block", () => {
  assert.ok(text.includes("FACTS CONTRACT"));
});
