export function requiredHeadingsFor(audience) {
  switch (audience) {
    case "executive":
      return [
        "## Summary",
        "## Key Wins",
        "## In Progress",
        "## Risks",
        "## Next Week",
        "## Executive Snapshot",
      ];
    case "technical":
      return [
        "## Summary",
        "## Key Achievements",
        "## In Progress",
        "## Technical Debt",
        "## Blockers",
        "## Next Sprint",
      ];
    case "client":
      return [
        "## This Week's Progress",
        "## What You'll See",
        "## Coming Next Week",
        "## Timeline Update",
        "## Next Checkpoint",
      ];
    default:
      return [];
  }
}

export function hasRequiredHeadings(report, audience) {
  const req = requiredHeadingsFor(audience);
  return req.every((h) => report.includes(h));
}

export function extractNumberTokens(text) {
  const matches = String(text ?? "").match(/(\d+%|\d{1,4})/g);
  return matches ? matches : [];
}

export function preservesNumbers(draft, edited) {
  const draftNums = extractNumberTokens(draft);
  const editedNums = new Set(extractNumberTokens(edited));
  return draftNums.every((n) => editedNums.has(n));
}
