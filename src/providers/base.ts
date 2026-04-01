import { DEFAULT_MODELS } from "../config.js";
import type { AgentTurn } from "../types.js";

export type ProviderName = "openai" | "anthropic";
export type ProviderPhase = "clarification" | "synthesis";

export interface ProviderInput {
  instruction: string;
  systemPrompt: string;
  userPrompt: string;
  phase: ProviderPhase;
  modelOverride?: string;
}

export interface AgentProvider {
  readonly name: ProviderName;
  runTurn(input: ProviderInput): Promise<AgentTurn>;
}

export function resolveDefaultModel(provider: ProviderName, phase: ProviderPhase): string {
  if (provider === "openai") {
    return phase === "clarification" ? DEFAULT_MODELS.openai.clarification : DEFAULT_MODELS.openai.synthesis;
  }
  return phase === "clarification" ? DEFAULT_MODELS.anthropic.clarification : DEFAULT_MODELS.anthropic.synthesis;
}
