import Anthropic from "@anthropic-ai/sdk";

export const toolDefinitions: Anthropic.Tool[] = [
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
