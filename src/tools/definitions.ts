import Anthropic from "@anthropic-ai/sdk";

export const textEditorToolDefinition: Anthropic.ToolTextEditor20250429 = {
  type: "text_editor_20250429",
  name: "str_replace_based_edit_tool",
};

export const baseToolDefinitions: Anthropic.ToolUnion[] = [
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
  {
    name: "delegate_task",
    description: "Delegate a task to a subagent with independent context. Use this for focused subtasks that don't need the main conversation history.",
    input_schema: {
      type: "object",
      properties: {
        task: { type: "string", description: "The task description for the subagent to execute" },
      },
      required: ["task"],
    },
  },
  textEditorToolDefinition,
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

export function createToolDefinitions(options: { enableAskUser: boolean }): Anthropic.ToolUnion[] {
  if (!options.enableAskUser) return baseToolDefinitions;
  return [...baseToolDefinitions, askUserToolDefinition];
}
