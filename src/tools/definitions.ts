import Anthropic from "@anthropic-ai/sdk";

export const textEditorToolDefinition: Anthropic.Tool = {
  name: "str_replace_based_edit_tool",
  description:
    "View, create, and edit files. Commands: view (read file or range), str_replace (replace unique string), create (write new file), insert (insert after line).",
  input_schema: {
    type: "object",
    properties: {
      command: { type: "string", enum: ["view", "str_replace", "create", "insert"] },
      path: { type: "string" },
      view_range: {
        type: "array",
        items: { type: "number" },
        description: "Optional [start, end] lines for view",
      },
      old_str: { type: "string", description: "Text to replace (str_replace)" },
      new_str: { type: "string", description: "Replacement or new text (str_replace, insert)" },
      file_text: { type: "string", description: "Full file content (create)" },
      insert_line: { type: "number", description: "Line number after which to insert (insert)" },
    },
    required: ["command", "path"],
  },
};

export const baseToolDefinitions: Anthropic.ToolUnion[] = [
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
    description:
      "Delegate a task to a subagent with independent context. Use this for focused subtasks that don't need the main conversation history.",
    input_schema: {
      type: "object",
      properties: {
        task: {
          type: "string",
          description: "The task description for the subagent to execute",
        },
      },
      required: ["task"],
    },
  },
  textEditorToolDefinition,
];

export const askUserToolDefinition: Anthropic.Tool = {
  name: "ask_user",
  description:
    "Ask the user for missing information or explicit confirmation before continuing",
  input_schema: {
    type: "object",
    properties: {
      kind: { type: "string", enum: ["clarify", "confirm"] },
      question: { type: "string", description: "The question to ask the user" },
    },
    required: ["kind", "question"],
  },
};

export function createToolDefinitions(options: {
  enableAskUser: boolean;
}): Anthropic.ToolUnion[] {
  if (!options.enableAskUser) return baseToolDefinitions;
  return [...baseToolDefinitions, askUserToolDefinition];
}
