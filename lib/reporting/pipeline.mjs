import { validateReport, requiredHeadingsFor, normalizeHeadings, parseSections, mergeSections } from "./validation.mjs";
import { validateAndFix, needsCompression } from "./postProcess.mjs";

const GARBAGE_PHRASES = [
  "no previous content was provided",
  "i can't complete",
  "not included",
  "missing information",
];

const MIN_REPAIR_CHARS = 80;

function extractText(msg) {
  return (msg?.content || [])
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("\n")
    .trim();
}

export function isGarbageOutput(text) {
  const lower = String(text || "").toLowerCase();
  return GARBAGE_PHRASES.some((p) => lower.includes(p));
}

export function isEmptyFormattedData(formattedData) {
  return !formattedData || String(formattedData).trim().length === 0;
}

function hasRequestedHeadings(text, headings) {
  const { sections } = parseSections(text);
  return headings.every((h) => sections.has(h));
}

function shouldDiscardEditorOutput(original, edited, audience, facts) {
  if (!edited || edited.trim().length === 0) return true;
  if (isGarbageOutput(edited)) return true;
  const required = requiredHeadingsFor(audience, facts);
  const validation = validateReport(edited, audience, facts);
  if (!validation.ok) return true;
  if (!hasRequestedHeadings(edited, required)) return true;
  const origLen = String(original || "").length;
  const editedLen = String(edited || "").length;
  if (editedLen === 0 || (origLen > 0 && editedLen < Math.min(80, Math.floor(origLen * 0.3)))) return true;
  return false;
}

function shouldDiscardRepairOutput(repair, requestedHeadings) {
  if (!repair || repair.trim().length < MIN_REPAIR_CHARS) return true;
  if (isGarbageOutput(repair)) return true;
  const { sections } = parseSections(repair);
  const keys = Array.from(sections.keys());
  if (keys.length === 0) return true;
  const requested = new Set(requestedHeadings);
  const hasOnlyRequested = keys.every((h) => requested.has(h));
  if (!hasOnlyRequested) return true;
  return !requestedHeadings.every((h) => sections.has(h));
}

function buildEditorPrompt(reportText) {
  return `
You are an editor.
Compress the following update by ~20% while preserving all metrics and risks.
Remove redundancy. Sharpen language. Do not change structure or headings.
Do not add new facts.

Report:
${reportText}

Edited version:
`.trim();
}

function buildStrictPrompt(reportText, factsBlock) {
  return `
You are an editor. Strictly rewrite to comply with the requirements below.
Do NOT add new facts. Do NOT add dates or metrics not present in Sprint Data.
Preserve structure and headings. Keep risks and metrics. Be concise.

FACTS CONTRACT:
${factsBlock}

Report:
${reportText}

Compliant version:
`.trim();
}

function buildRepairPrompt(reportText, formattedData, factsBlock, missingHeadings) {
  return `
Your previous response was cut off or missing required sections.
Return ONLY the missing section(s) with the exact heading(s) listed. Do not include any other headings.
Do not repeat already-present sections. Do not add new facts.

SPRINT DATA:
${formattedData}

FACTS CONTRACT:
${factsBlock}

Missing sections: ${missingHeadings.join(", ")}

Original report:
${reportText}

Missing sections only:
`.trim();
}

export async function runReportPipeline({
  scenarioId,
  audience,
  formattedData,
  facts,
  factsBlock,
  periodLabel,
  buildPrompt,
  anthropic,
  model,
  logger = (_entry) => {},
}) {
  const logs = [];
  const log = (entry) => {
    logs.push(entry);
    logger(entry);
  };

  if (isEmptyFormattedData(formattedData)) {
    log({
      scenario_id: scenarioId ?? null,
      audience,
      formattedDataLength: 0,
      promptType: "skip",
      outputLength: 0,
      note: "empty formattedData",
    });
    return {
      ok: false,
      errorText: "Insufficient sprint data to generate a report.",
      logs,
      didRepair: false,
      didDiscardEditor: false,
      didDiscardRepair: false,
      finalReport: "",
    };
  }

  const prompt = buildPrompt(audience, { periodLabel, formattedData, factsBlock });
  log({
    scenario_id: scenarioId ?? null,
    audience,
    formattedDataLength: String(formattedData || "").length,
    promptType: "generate",
  });

  const msg = await anthropic.messages.create({
    model,
    max_tokens: 900,
    messages: [{ role: "user", content: prompt }],
  });

  const reportText = extractText(msg);
  const draftReport = reportText;
  log({
    scenario_id: scenarioId ?? null,
    audience,
    promptType: "generate",
    outputLength: reportText.length,
  });

  let finalReport = reportText;
  let didDiscardEditor = false;
  let didDiscardRepair = false;
  let didRepair = false;

  if (reportText && reportText.trim().length > 0) {
    log({ scenario_id: scenarioId ?? null, audience, promptType: "editor" });
    const editorPrompt = buildEditorPrompt(reportText);
    const editMsg = await anthropic.messages.create({
      model,
      max_tokens: 900,
      messages: [{ role: "user", content: editorPrompt }],
    });
    const edited = extractText(editMsg);
    log({
      scenario_id: scenarioId ?? null,
      audience,
      promptType: "editor",
      outputLength: edited.length,
    });

    if (shouldDiscardEditorOutput(reportText, edited, audience, facts)) {
      didDiscardEditor = true;
      finalReport = reportText;
    } else {
      finalReport = edited;
    }
  }

  const post = validateAndFix(finalReport, facts);
  finalReport = post.text;

  const validation = validateReport(finalReport, audience, facts);
  const needsRewrite = !validation.ok || needsCompression(post.warnings);
  if (!validation.ok) {
    log({
      scenario_id: scenarioId ?? null,
      audience,
      promptType: "validate",
      missingHeadings: validation.headingsToRepair,
    });
  }

  if (needsRewrite && finalReport && finalReport.trim().length > 0) {
    log({ scenario_id: scenarioId ?? null, audience, promptType: "editor" });
    const strictPrompt = buildStrictPrompt(finalReport, factsBlock);
    const strictMsg = await anthropic.messages.create({
      model,
      max_tokens: 900,
      messages: [{ role: "user", content: strictPrompt }],
    });
    const strictText = extractText(strictMsg);
    log({
      scenario_id: scenarioId ?? null,
      audience,
      promptType: "editor",
      outputLength: strictText.length,
    });
    if (strictText) {
      finalReport = validateAndFix(strictText, facts).text;
    }
  }

  const postValidation = validateReport(finalReport, audience, facts);
  if (finalReport && finalReport.trim().length > 0 && !postValidation.ok && postValidation.headingsToRepair.length > 0) {
    log({
      scenario_id: scenarioId ?? null,
      audience,
      promptType: "repair",
      missingHeadings: postValidation.headingsToRepair,
    });
    const repairPrompt = buildRepairPrompt(
      finalReport,
      formattedData,
      factsBlock,
      postValidation.headingsToRepair
    );
    const repairMsg = await anthropic.messages.create({
      model,
      max_tokens: 700,
      messages: [{ role: "user", content: repairPrompt }],
    });
    const repairText = normalizeHeadings(extractText(repairMsg));
    log({
      scenario_id: scenarioId ?? null,
      audience,
      promptType: "repair",
      outputLength: repairText.length,
      missingHeadings: postValidation.headingsToRepair,
    });

    if (shouldDiscardRepairOutput(repairText, postValidation.headingsToRepair)) {
      didDiscardRepair = true;
    } else {
      const required = requiredHeadingsFor(audience, facts);
      finalReport = mergeSections(finalReport, repairText, required);
      didRepair = true;
    }
  }

  return {
    ok: true,
    draftReport,
    finalReport,
    logs,
    didDiscardEditor,
    didDiscardRepair,
    didRepair,
  };
}
