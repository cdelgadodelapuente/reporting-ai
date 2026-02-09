const MONTHS =
  "(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*";

const DATE_REGEX = new RegExp(`\\b${MONTHS}\\s+\\d{1,2}\\b`, "gi");
const ISO_DATE_REGEX = /\b\d{4}-\d{2}-\d{2}\b/g;

const METRIC_REGEX = /\b\d+%|\b\d+(\.\d+)?\s*(ms|s|sec|secs|seconds|users|pts|points|x)\b/gi;

const VENDORS = [
  "Stripe",
  "Redis",
  "Datadog",
  "Kafka",
  "Kubernetes",
  "SendGrid",
  "Postgres",
  "Snowflake",
  "Segment",
  "Sentry",
  "BullMQ",
  "SonarQube",
];

export function buildFacts(issues = [], audience = "executive") {
  const summaries = issues.map((i) => String(i.summary || "")).join("\n");
  const allowedDates = new Set();
  const allowedMetrics = new Set();

  for (const match of summaries.matchAll(DATE_REGEX)) {
    allowedDates.add(match[0]);
  }
  for (const match of summaries.matchAll(ISO_DATE_REGEX)) {
    allowedDates.add(match[0]);
  }

  const allowedVendors = new Set();
  for (const v of VENDORS) {
    const re = new RegExp(`\\b${v}\\b`, "i");
    if (re.test(summaries)) allowedVendors.add(v);
  }

  for (const match of summaries.matchAll(METRIC_REGEX)) {
    allowedMetrics.add(match[0]);
  }
  const hasMetrics = allowedMetrics.size > 0;
  const hasDates = allowedDates.size > 0;

  const doneCount = issues.filter((i) =>
    String(i.status || "").toLowerCase().includes("done")
  ).length;
  const blockedCount = issues.filter((i) =>
    String(i.status || "").toLowerCase().includes("blocked")
  ).length;
  const inProgressCount = issues.filter((i) =>
    String(i.status || "").toLowerCase().includes("in progress")
  ).length;

  let status = null;
  if (blockedCount > 0 && doneCount === 0) status = "Blocked";
  else if (blockedCount > 0) status = "At Risk";
  else if (doneCount > 0) status = "On Track";
  else if (inProgressCount > 0) status = "At Risk";

  return {
    audience,
    has_dates: hasDates,
    allowed_dates: Array.from(allowedDates),
    has_metrics: hasMetrics,
    allowed_metrics: Array.from(allowedMetrics),
    allowed_vendors: Array.from(allowedVendors),
    counts: { done: doneCount, blocked: blockedCount, in_progress: inProgressCount },
    status,
    has_checkpoint_date: hasDates,
  };
}

export function formatFactsBlock(facts) {
  const dates = facts.allowed_dates?.length ? facts.allowed_dates.join(", ") : "none";
  const metrics = facts.allowed_metrics?.length ? facts.allowed_metrics.join(", ") : "none";
  const vendors = facts.allowed_vendors?.length ? facts.allowed_vendors.join(", ") : "none";
  return [
    `has_dates: ${facts.has_dates}`,
    `allowed_dates: ${dates}`,
    `has_metrics: ${facts.has_metrics}`,
    `allowed_metrics: ${metrics}`,
    `allowed_vendors: ${vendors}`,
  ].join("\n");
}
