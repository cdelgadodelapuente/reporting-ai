const REQUIRED = {
  executive: [
    "## Summary",
    "## Key Wins",
    "## In Progress",
    "## Next Week",
    "## Executive Snapshot",
  ],
  technical: [
    "## Summary",
    "## Key Achievements",
    "## In Progress",
    "## Blockers",
    "## Next Sprint",
  ],
  client: [
    "## This Week's Progress",
    "## What You'll See",
    "## Coming Next Week",
    "## Timeline Update",
    "## Next Checkpoint",
  ],
};

const OPTIONAL = {
  executive: ["## Risks"],
  technical: ["## Technical Debt"],
  client: [],
};

export function normalizeHeadings(text) {
  let out = String(text || "");
  out = out.replace(/([^\n])(\s*##\s+)/g, "$1\n\n## ");
  out = out.replace(/([^\n])\n(##\s+)/g, "$1\n\n## ");
  out = out.replace(/\n{3,}/g, "\n\n");
  return out.trim();
}

export function parseSections(text) {
  const normalized = normalizeHeadings(text);
  const lines = normalized.split(/\r?\n/);
  const map = new Map();
  let currentHeading = null;
  let buffer = [];

  for (const line of lines) {
    const headingMatch = line.match(/^##\s+(.*)/);
    if (headingMatch) {
      if (currentHeading) {
        map.set(currentHeading, buffer.join("\n").trim());
      }
      currentHeading = `## ${headingMatch[1].trim()}`;
      buffer = [];
      continue;
    }
    if (currentHeading) buffer.push(line);
  }
  if (currentHeading) {
    map.set(currentHeading, buffer.join("\n").trim());
  }
  return { normalized, sections: map };
}

export function requiredHeadingsFor(audience, facts) {
  if (audience === "executive") {
    return facts?.status ? REQUIRED.executive : REQUIRED.executive.filter((h) => h !== "## Executive Snapshot");
  }
  if (audience === "client") {
    return facts?.has_checkpoint_date ? REQUIRED.client : REQUIRED.client.filter((h) => h !== "## Next Checkpoint");
  }
  return REQUIRED[audience] || [];
}

export function optionalHeadingsFor(audience) {
  return OPTIONAL[audience] || [];
}

export function countBullets(content) {
  const lines = String(content || "").split(/\r?\n/);
  return lines.filter((l) => /^\s*[-•]\s+/.test(l)).length;
}

export function validateReport(text, audience, facts) {
  const { sections } = parseSections(text);
  const required = requiredHeadingsFor(audience, facts);
  const optional = optionalHeadingsFor(audience);

  const missingHeadings = required.filter((h) => !sections.has(h));
  const emptyHeadings = [];

  const minBullets = {
    "## Next Sprint": 2,
    "## Next Week": 2,
  };

  for (const h of required) {
    const content = sections.get(h);
    if (!content || content.trim().length === 0) {
      emptyHeadings.push(h);
      continue;
    }
    const min = minBullets[h];
    if (min) {
      const bullets = countBullets(content);
      if (bullets < min) emptyHeadings.push(h);
    }
  }

  for (const h of optional) {
    if (sections.has(h) && sections.get(h).trim().length === 0) {
      emptyHeadings.push(h);
    }
  }

  const headingsToRepair = Array.from(new Set([...missingHeadings, ...emptyHeadings]));
  return { ok: headingsToRepair.length === 0, missingHeadings, emptyHeadings, headingsToRepair };
}

export function mergeSections(originalText, repairText, requiredHeadings) {
  const { sections: original } = parseSections(originalText);
  const { sections: repair } = parseSections(repairText);
  const out = [];

  for (const heading of requiredHeadings) {
    const body = original.get(heading);
    const repairBody = repair.get(heading);
    const finalBody = body && body.trim().length > 0 ? body : repairBody;
    if (!finalBody) continue;
    out.push(heading);
    out.push(finalBody.trim());
  }

  return out.join("\n\n").trim();
}
