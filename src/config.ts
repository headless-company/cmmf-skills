export const DEFAULT_MODELS = {
  openai: {
    clarification: "gpt-5-mini",
    synthesis: "gpt-5.2",
  },
  anthropic: {
    clarification: "claude-sonnet-4-20250514",
    synthesis: "claude-sonnet-4-20250514",
    deepReasoning: "claude-opus-4-1-20250805",
  },
} as const;

export const DEFAULT_MANIFEST = {
  specVersion: 1 as const,
  namespace: "example.content-model",
  modelsPath: "./models",
  defaults: {
    required: false,
    localisation: false,
  },
};

export const MAX_AGENT_TURNS = 6;
