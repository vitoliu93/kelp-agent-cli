import Anthropic from "@anthropic-ai/sdk";

export function getAnthropicClientOptions(): ConstructorParameters<
  typeof Anthropic
>[0] {
  return {
    baseURL:
      process.env.KELP_BASE_URL || process.env.OPENROUTER_ANTHROPIC_BASE_URL,
    apiKey: process.env.KELP_API_KEY || process.env.OPENROUTER_API_KEY,
  };
}

export function getDefaultModel(): string {
  return process.env.KELP_DEFAULT_MODEL || "anthropic/claude-haiku-4.5";
}
