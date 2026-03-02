import Anthropic from "@anthropic-ai/sdk";
import { createConsola } from "consola";

import { executeTool, bashSession } from "./tools";
import { loadSkills } from "./skills";

const log = createConsola({ stdout: process.stderr as any });

const prompt = Bun.argv[2];

if (!prompt) {
  console.error("Usage: bun run index.ts <prompt>");
  process.exit(1);
}

const SYSTEM_PROMPT = `You are kelp, a command-line assistant running on the user's local machine.

You have bash access. Prefer using it over guessing -- if a question can be answered by running a command, run it.

Rules:
- Answer directly. No preamble, no filler, no pleasantries.
- One bash call per intent. Pipe and chain within a single call when possible.
- Never run destructive commands (rm -rf, mkfs, dd, >overwrite) without the user stating the exact target first.
- Never install packages or start persistent services unless explicitly asked.
- If a task is ambiguous, state your assumption in one line and proceed.
- Output plain text. Use markdown only for code blocks.
- When done, stop. No recap, no sign-off.`;

const client = new Anthropic({
  baseURL: process.env.ANTHROPIC_BASE_URL,
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const tools: Anthropic.Tool[] = [
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

const skills = await loadSkills();
let systemPrompt = SYSTEM_PROMPT;
if (skills.length > 0) {
  const skillLines = skills.map((s) => `- ${s.name} (${s.path}): ${s.description}`).join("\n");
  systemPrompt += `\n\n## Available Skills\nIMPORTANT: Before acting on any user request, check the skills below. If the request matches a skill's description, you MUST read that skill's SKILL.md first and follow its instructions. Do not improvise when a skill exists for the task.\n\n${skillLines}`;
}

const messages: Anthropic.MessageParam[] = [{ role: "user", content: prompt }];

function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen) + "...";
}

while (true) {
  const lastMessage = messages[messages.length - 1]!;

  // Log REQUEST (single line)
  if (lastMessage.role === "user") {
    const content = lastMessage.content;
    if (typeof content === "string") {
      log.info(`-> user: ${truncate(content, 80)}`);
    } else {
      const toolResults = content as Anthropic.ToolResultBlockParam[];
      for (const tr of toolResults) {
        if (tr.type === "tool_result") {
          const resultText =
            typeof tr.content === "string"
              ? tr.content
              : JSON.stringify(tr.content);
          log.info(`-> tool_result: ${truncate(resultText, 60)}`);
        }
      }
    }
  }

  const stream = await client.messages.create({
    model: process.env.ANTHROPIC_DEFAULT_MODEL || "claude-sonnet-4-6",
    max_tokens: 16000,
    stream: true,
    system: systemPrompt,
    thinking: { type: "enabled", budget_tokens: 10000 },
    tools,
    messages,
  });

  const contentBlocks: Anthropic.ContentBlock[] = [];
  let currentBlock: Anthropic.ContentBlock | null = null;
  let stopReason: string | null = null;

  for await (const event of stream) {
    if (event.type === "content_block_start") {
      currentBlock = event.content_block as unknown as Anthropic.ContentBlock;
      const block = event.content_block;

      // 关键：任何“阶段性日志”输出前，先把 stdout 光标换到新行
      if (block.type === "tool_use") {
        process.stdout.write("\n");
      } else if (block.type === "text") {
        process.stdout.write("\n");
        log.info(`<- [text]`);
      } else if (
        block.type === "thinking" ||
        (block as any).type === "redacted_thinking"
      ) {
        process.stdout.write("\n");
      }
    } else if (event.type === "content_block_delta") {
      if (event.delta.type === "thinking_delta") {
        // 你如果希望思考过程也出现在 stdout，就保持 stdout
        // 若希望 stdout 只输出最终答案，建议改成 process.stderr.write(...)
        process.stdout.write(event.delta.thinking);

        if (currentBlock?.type === "thinking") {
          (currentBlock as Anthropic.ThinkingBlock).thinking +=
            event.delta.thinking;
        }
      } else if (event.delta.type === "text_delta") {
        process.stdout.write(event.delta.text);

        if (currentBlock?.type === "text") {
          (currentBlock as Anthropic.TextBlock).text += event.delta.text;
        }
      } else if (event.delta.type === "input_json_delta") {
        if (currentBlock?.type === "tool_use") {
          const block = currentBlock as Anthropic.ToolUseBlock & {
            _inputStr?: string;
          };
          block._inputStr = (block._inputStr ?? "") + event.delta.partial_json;
        }
      } else if (event.delta.type === "signature_delta") {
        if (currentBlock?.type === "thinking") {
          (currentBlock as Anthropic.ThinkingBlock).signature =
            event.delta.signature;
        }
      }
    } else if (event.type === "content_block_stop") {
      if (currentBlock) {
        if (currentBlock.type === "tool_use") {
          const block = currentBlock as Anthropic.ToolUseBlock & {
            _inputStr?: string;
          };
          block.input = JSON.parse(block._inputStr ?? "{}");
          delete block._inputStr;
          log.info(`<- [tool_use] ${block.name}: ${truncate(JSON.stringify(block.input), 80)}`);
        }
        contentBlocks.push(currentBlock);
        currentBlock = null;
      }
    } else if (event.type === "message_delta") {
      stopReason = event.delta.stop_reason;
    }
  }

  // 确保结束后换行，避免下一条 stderr 日志黏在 stdout 行尾
  process.stdout.write("\n");

  messages.push({ role: "assistant", content: contentBlocks });

  if (stopReason === "tool_use") {
    const toolResults: Anthropic.ToolResultBlockParam[] = await Promise.all(
      contentBlocks
        .filter((b): b is Anthropic.ToolUseBlock => b.type === "tool_use")
        .map(async (b) => {
          const result = await executeTool(b.name, b.input as Record<string, unknown>);
          return { type: "tool_result" as const, tool_use_id: b.id, content: result };
        })
    );

    messages.push({ role: "user", content: toolResults });
  } else {
    break;
  }
}

bashSession.close();
process.exit(0);
