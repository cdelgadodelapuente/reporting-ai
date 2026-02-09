type Issue = {
  key: string;
  summary?: string;
  status?: string;
  assignee?: string | null;
  type?: string;
  updated?: string;
};

const STATUS_DONE = ["done", "closed", "resolved"];
const STATUS_IN_PROGRESS = ["in progress", "doing", "active", "in review"];
const STATUS_BLOCKED = ["blocked", "on hold", "impeded"];

function normalize(str: string | undefined) {
  return (str || "").trim().toLowerCase();
}

function classifyStatus(status?: string) {
  const s = normalize(status);
  if (STATUS_DONE.some((k) => s.includes(k))) return "done";
  if (STATUS_BLOCKED.some((k) => s.includes(k))) return "blocked";
  if (STATUS_IN_PROGRESS.some((k) => s.includes(k))) return "in_progress";
  return "other";
}

function summarizeList(items: Issue[], max = 5) {
  return items.slice(0, max).map((i) => {
    const summary = i.summary ? ` - ${i.summary}` : "";
    return `• ${summary.replace(/^ - /, "")}`;
  });
}

function extractImpact(items: Issue[], max = 6) {
  const impact = items
    .filter((i) => /\d|%|→|->|faster|reduced|increase|decrease|improve|up|down/i.test(i.summary || ""))
    .map((i) => `• ${i.summary}`);
  return impact.slice(0, max);
}

function extractProgress(items: Issue[], max = 6) {
  const progress = items
    .filter((i) => /%|\bETA\b|\bcomplete\b|\bremaining\b/i.test(i.summary || ""))
    .map((i) => `• ${i.summary}`);
  return progress.slice(0, max);
}

function splitByType(issues: Issue[]) {
  const bugs: Issue[] = [];
  const features: Issue[] = [];
  const other: Issue[] = [];

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

export function formatSprintData(issues: Issue[]) {
  const done = issues.filter((i) => classifyStatus(i.status) === "done");
  const blocked = issues.filter((i) => classifyStatus(i.status) === "blocked");
  const inProgress = issues.filter(
    (i) => classifyStatus(i.status) === "in_progress"
  );

  const doneSplit = splitByType(done);

  const lines: string[] = [];

  lines.push(`Totals: ${issues.length} issues`);
  lines.push(`- Done: ${done.length}`);
  lines.push(`- In Progress: ${inProgress.length}`);
  lines.push(`- Blocked: ${blocked.length}`);

  const impactLines = extractImpact(done);
  if (impactLines.length > 0) {
    lines.push("");
    lines.push("Notable impact (from completed work):");
    lines.push(...impactLines);
  }

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

    const progressLines = extractProgress(inProgress);
    if (progressLines.length > 0) {
      lines.push("Progress signals:");
      lines.push(...progressLines);
    }
  }

  if (blocked.length > 0) {
    lines.push("");
    lines.push("Blocked:");
    lines.push(...summarizeList(blocked, 5));
  }

  return lines.join("\n");
}
