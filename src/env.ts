import Anthropic from "@anthropic-ai/sdk";

const OPENROUTER_BASE_URL = "https://openrouter.ai/api";

function getConfiguredBaseURL(): string | undefined {
  return process.env.KELP_BASE_URL || process.env.OPENROUTER_ANTHROPIC_BASE_URL;
}

function getConfiguredApiKey(): string | undefined {
  return process.env.KELP_API_KEY || process.env.OPENROUTER_API_KEY;
}

function isOpenRouterMode(baseURL: string | undefined): boolean {
  return baseURL?.includes("openrouter.ai") ?? false;
}

export function getAnthropicClientOptions(): ConstructorParameters<
  typeof Anthropic
>[0] {
  const baseURL = getConfiguredBaseURL();
  const apiKey = getConfiguredApiKey();

  if (isOpenRouterMode(baseURL)) {
    return {
      baseURL: OPENROUTER_BASE_URL,
      authToken: apiKey,
      apiKey: null,
    };
  }

  return {
    baseURL,
    apiKey,
  };
}

export function getDefaultModel(): string {
  return process.env.KELP_DEFAULT_MODEL || "anthropic/claude-haiku-4.5";
}
