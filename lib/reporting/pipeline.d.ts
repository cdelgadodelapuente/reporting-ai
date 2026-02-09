export type RunReportPipelineInput = {
  scenarioId?: string | null;
  audience: "executive" | "technical" | "client";
  formattedData: string;
  facts: Record<string, any>;
  factsBlock: string;
  periodLabel: string;
  buildPrompt: (audience: "executive" | "technical" | "client", ctx: { periodLabel: string; formattedData: string; factsBlock: string }) => string;
  anthropic: any;
  model: string;
  logger?: (entry: any) => void;
};

export type RunReportPipelineOutput = {
  ok: boolean;
  errorText?: string;
  finalReport: string;
  draftReport?: string;
  logs: any[];
  didDiscardEditor: boolean;
  didDiscardRepair: boolean;
  didRepair: boolean;
};

export function runReportPipeline(input: RunReportPipelineInput): Promise<RunReportPipelineOutput>;
