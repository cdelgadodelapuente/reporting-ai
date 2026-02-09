import { validateReport, mergeSections, normalizeHeadings, requiredHeadingsFor } from "./validation.mjs";

const VENDOR_MAP = {
  Stripe: "payment provider",
  Redis: "cache layer",
  Datadog: "monitoring tool",
  Kafka: "event pipeline",
  Kubernetes: "infrastructure platform",
  SendGrid: "email provider",
  Postgres: "database",
  Snowflake: "data warehouse",
  Segment: "analytics pipeline",
  Sentry: "error monitoring",
  BullMQ: "job queue",
  SonarQube: "code quality tool",
};

const DATE_REGEX = /\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2}\b/gi;
const ISO_DATE_REGEX = /\b\d{4}-\d{2}-\d{2}\b/g;
const TICKET_REGEX = /\b[A-Z][A-Z0-9]+-\d+\b/g;
const METRIC_REGEX = /\b\d+%|\b\d+(\.\d+)?\s*(ms|s|sec|secs|seconds|users|pts|points|x)\b/gi;

const WORD_LIMITS = {
  executive: 280,
  technical: 400,
  client: 300,
};

function wordCount(text) {
  return String(text || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

function stripTickets(text) {
  return text.replace(TICKET_REGEX, "").replace(/[ \t]{2,}/g, " ").trim();
}

function stripDatesIfNotAllowed(text, facts) {
  let out = text;
  const allowed = new Set(facts.allowed_dates || []);
  out = out.replace(DATE_REGEX, (match) => {
    if (!facts.has_dates) return "TBD";
    return allowed.has(match) ? match : "TBD";
  });
  out = out.replace(ISO_DATE_REGEX, (match) => {
    if (!facts.has_dates) return "TBD";
    return allowed.has(match) ? match : "TBD";
  });
  return out;
}

function stripMetricsIfNotAllowed(text, facts) {
  const allowed = new Set(facts.allowed_metrics || []);
  return text.replace(METRIC_REGEX, (match) => {
    if (!facts.has_metrics) return "metric pending";
    return allowed.has(match) ? match : "metric pending";
  });
}

function sanitizeVendors(text, facts) {
  let out = text;
  for (const [vendor, replacement] of Object.entries(VENDOR_MAP)) {
    if (facts.allowed_vendors?.includes(vendor)) continue;
    const re = new RegExp(`\\b${vendor}\\b`, "gi");
    out = out.replace(re, replacement);
  }
  return out;
}

function ensureSnapshot(report, facts) {
  if (facts.audience !== "executive") {
    return report.replace(/## Executive Snapshot(?:\n(?!## ).*)*/g, "").trim();
  }
  if (!facts.status) {
    return report.replace(/## Executive Snapshot(?:\n(?!## ).*)*/g, "").trim();
  }
  return report;
}

function removeNextCheckpointIfNoDates(report, facts) {
  if (facts.audience !== "client") return report;
  if (facts.has_checkpoint_date) return report;
  if (!report.includes("## Next Checkpoint")) return report;
  const sections = report.split(/\n## /);
  const filtered = sections.filter((s) => !s.startsWith("Next Checkpoint"));
  return filtered.length ? (filtered[0].startsWith("##") ? filtered.join("\n## ") : filtered.join("\n## ")).trim() : report;
}

export function validateAndFix(reportText, facts) {
  let text = normalizeHeadings(String(reportText || "").trim());
  const warnings = [];

  text = stripTickets(text);
  text = stripDatesIfNotAllowed(text, facts);
  text = stripMetricsIfNotAllowed(text, facts);
  text = sanitizeVendors(text, facts);
  text = ensureSnapshot(text, facts);
  text = removeNextCheckpointIfNoDates(text, facts);
  const sanitizedBase = text;
  const required = requiredHeadingsFor(facts.audience, facts);
  const merged = mergeSections(text, "", required);
  if (merged && merged.length > 0) {
    text = merged;
  } else {
    text = sanitizedBase;
  }

  const validation = validateReport(text, facts.audience, facts);
  if (!validation.ok) {
    warnings.push("missing_sections");
  }

  const wc = wordCount(text);
  if (wc > (WORD_LIMITS[facts.audience] || 400)) {
    warnings.push("over_limit");
  }

  return {
    text,
    warnings,
  };
}

export function needsCompression(warnings = []) {
  return warnings.includes("over_limit");
}
