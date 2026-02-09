export function parseScore(rawText) {
  const raw = String(rawText ?? "").trim();
  if (!raw) return { error: "Score parse failed", raw: rawText };

  const tryParse = (text) => {
    const parsed = JSON.parse(text);
    const required = ["clarity", "conciseness", "impact", "completeness", "tone", "total"];
    const hasKeys = required.every((k) => Object.prototype.hasOwnProperty.call(parsed, k));
    if (!hasKeys) {
      return { error: "Score parse failed", raw: rawText };
    }
    return parsed;
  };

  try {
    return tryParse(raw);
  } catch {
    // continue
  }

  // Strip markdown fences ```json ... ``` or ``` ... ```
  const fenceMatch = raw.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fenceMatch && fenceMatch[1]) {
    try {
      return tryParse(fenceMatch[1].trim());
    } catch {
      // continue
    }
  }

  // Extract first {...} block if extra text exists
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start !== -1 && end !== -1 && end > start) {
    const slice = raw.slice(start, end + 1);
    try {
      return tryParse(slice);
    } catch {
      // continue
    }
  }

  return { error: "Score parse failed", raw: rawText };
}
