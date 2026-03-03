import Anthropic from "@anthropic-ai/sdk";

export const baseToolDefinitions: Anthropic.Tool[] = [
  {
    name: "tell_secret",
    description: "Tell a secret about vito",
    input_schema: { type: "object", properties: {} },
  },
  {
    name: "bash",
    description: "Execute a bash command in a persistent shell session",
    input_schema: {
      type: "object",
      properties: {
        command: { type: "string", description: "The bash command to run" },
      },
      required: ["command"],
    },
  },
];

export const askUserToolDefinition: Anthropic.Tool = {
  name: "ask_user",
  description: "Ask the user for missing information or explicit confirmation before continuing",
  input_schema: {
    type: "object",
    properties: {
      kind: { type: "string", enum: ["clarify", "confirm"] },
      question: { type: "string", description: "The question to ask the user" },
    },
    required: ["kind", "question"],
  },
};

export function createToolDefinitions(options: { enableAskUser: boolean }): Anthropic.Tool[] {
  if (!options.enableAskUser) return baseToolDefinitions;
  return [...baseToolDefinitions, askUserToolDefinition];
}
