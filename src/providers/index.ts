import { AnthropicProvider } from "./anthropic.js";
import type { AgentProvider, ProviderName } from "./base.js";
import { OpenAIProvider } from "./openai.js";

export function createProvider(name: ProviderName, env: NodeJS.ProcessEnv): AgentProvider {
  if (name === "openai") {
    const apiKey = env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY is required for the OpenAI provider.");
    }
    return new OpenAIProvider(apiKey);
  }

  const apiKey = env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY is required for the Anthropic provider.");
  }
  return new AnthropicProvider(apiKey);
}

export function resolveProviderName(env: NodeJS.ProcessEnv, explicit?: string): ProviderName {
  if (explicit === "openai" || explicit === "anthropic") {
    return explicit;
  }
  const envProvider = env.CMMF_AGENT_PROVIDER;
  if (envProvider === "openai" || envProvider === "anthropic") {
    return envProvider;
  }
  const hasOpenAI = Boolean(env.OPENAI_API_KEY);
  const hasAnthropic = Boolean(env.ANTHROPIC_API_KEY);
  if (hasOpenAI && !hasAnthropic) {
    return "openai";
  }
  if (hasAnthropic && !hasOpenAI) {
    return "anthropic";
  }
  throw new Error("Unable to resolve provider automatically. Pass --provider openai|anthropic or set exactly one API key.");
}
