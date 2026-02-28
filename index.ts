import Anthropic from "@anthropic-ai/sdk";
import { createConsola } from "consola";

const log = createConsola({ stdout: process.stderr as any });

const prompt = Bun.argv[2];

if (!prompt) {
  console.error("Usage: bun run index.ts <prompt>");
  process.exit(1);
}

const client = new Anthropic({
  baseURL: process.env.OPENROUTER_ANTHROPIC_BASE_URL,
  apiKey: process.env.OPENROUTER_API_KEY,
});

const tools: Anthropic.Tool[] = [
  {
    name: "tell_secret",
    description: "Tell a secret about vito",
    input_schema: { type: "object", properties: {} },
  },
];

import { executeTool } from "./tools";

const messages: Anthropic.MessageParam[] = [
  { role: "user", content: prompt },
];

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
          const resultText = typeof tr.content === "string" ? tr.content : JSON.stringify(tr.content);
          log.info(`-> tool_result: ${truncate(resultText, 60)}`);
        }
      }
    }
  }

  const stream = await client.messages.create({
    model: process.env.AGENT_MODEL || "claude-sonnet-4-6",
    max_tokens: 16000,
    stream: true,
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
      if (block.type === "tool_use") {
        log.info(`<- [tool_use] ${block.name}`);
      } else if (block.type === "text") {
        log.info(`<- [text]`);
        process.stdout.write("\n");
      } else if (block.type === "thinking" || (block as any).type === "redacted_thinking") {
        process.stdout.write("\n");
      }
    } else if (event.type === "content_block_delta") {
      if (event.delta.type === "thinking_delta") {
        process.stdout.write(event.delta.thinking);
        if (currentBlock?.type === "thinking") {
          (currentBlock as Anthropic.ThinkingBlock).thinking += event.delta.thinking;
        }
      } else if (event.delta.type === "text_delta") {
        process.stdout.write(event.delta.text);
        if (currentBlock?.type === "text") {
          (currentBlock as Anthropic.TextBlock).text += event.delta.text;
        }
      } else if (event.delta.type === "input_json_delta") {
        if (currentBlock?.type === "tool_use") {
          const block = currentBlock as Anthropic.ToolUseBlock & { _inputStr?: string };
          block._inputStr = (block._inputStr ?? "") + event.delta.partial_json;
        }
      } else if (event.delta.type === "signature_delta") {
        if (currentBlock?.type === "thinking") {
          (currentBlock as Anthropic.ThinkingBlock).signature = event.delta.signature;
        }
      }
    } else if (event.type === "content_block_stop") {
      if (currentBlock) {
        if (currentBlock.type === "tool_use") {
          const block = currentBlock as Anthropic.ToolUseBlock & { _inputStr?: string };
          block.input = JSON.parse(block._inputStr ?? "{}");
          delete block._inputStr;
        }
        contentBlocks.push(currentBlock);
        currentBlock = null;
      }
    } else if (event.type === "message_delta") {
      stopReason = event.delta.stop_reason;
    }
  }

  process.stdout.write("\n");

  messages.push({ role: "assistant", content: contentBlocks });

  if (stopReason === "tool_use") {
    const toolResults: Anthropic.ToolResultBlockParam[] = contentBlocks
      .filter((b): b is Anthropic.ToolUseBlock => b.type === "tool_use")
      .map((b) => {
        const result = executeTool(b.name);
        return { type: "tool_result", tool_use_id: b.id, content: result };
      });
    messages.push({ role: "user", content: toolResults });
  } else {
    break;
  }
}
