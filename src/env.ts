import Anthropic from "@anthropic-ai/sdk";

export function getAnthropicClientOptions(): ConstructorParameters<typeof Anthropic>[0] {
  return {
    baseURL: process.env.KELP_BASE_URL,
    apiKey: process.env.KELP_API_KEY,
  };
}

export function getDefaultModel(): string {
  return process.env.KELP_DEFAULT_MODEL || "claude-sonnet-4-6";
}
