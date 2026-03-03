import Anthropic from "@anthropic-ai/sdk";

import { getDefaultModel } from "../env";
import type { Logger } from "../logger";
import { truncate } from "../logger";
import type { SkillMeta } from "../skills/load-skills";
import { buildSystemPrompt } from "./system-prompt";

type StreamClient = {
  messages: {
    create(
      params: Anthropic.MessageCreateParamsStreaming
    ): PromiseLike<AsyncIterable<Anthropic.MessageStreamEvent>>;
  };
};

type OutputWriter = Pick<typeof process.stdout, "write">;
type ToolExecutor = (name: string, input?: Record<string, unknown>) => Promise<string>;
type SkillLoader = () => Promise<SkillMeta[]>;
type ToolUseBlockWithInputBuffer = Anthropic.ToolUseBlock & { _inputStr?: string };

export interface RunAgentDeps {
  client: StreamClient;
  logger: Logger;
  tools: Anthropic.Tool[];
  executeTool: ToolExecutor;
  loadSkills: SkillLoader;
  stdout: OutputWriter;
}

function logRequest(logger: Logger, message: Anthropic.MessageParam): void {
  if (message.role !== "user") return;

  if (typeof message.content === "string") {
    logger.info(`-> user: ${truncate(message.content, 80)}`);
    return;
  }

  for (const block of message.content) {
    if (block.type !== "tool_result") continue;

    const resultText =
      typeof block.content === "string" ? block.content : JSON.stringify(block.content);
    logger.info(`-> tool_result: ${truncate(resultText, 60)}`);
  }
}

function isToolUseBlock(block: Anthropic.ContentBlock): block is Anthropic.ToolUseBlock {
  return block.type === "tool_use";
}

async function consumeStream(
  stream: AsyncIterable<Anthropic.MessageStreamEvent>,
  logger: Logger,
  stdout: OutputWriter
): Promise<{ contentBlocks: Anthropic.ContentBlock[]; stopReason: Anthropic.StopReason | null }> {
  const contentBlocks: Anthropic.ContentBlock[] = [];
  let currentBlock: Anthropic.ContentBlock | null = null;
  let stopReason: Anthropic.StopReason | null = null;

  for await (const event of stream) {
    if (event.type === "content_block_start") {
      currentBlock = event.content_block as Anthropic.ContentBlock;
      const block = event.content_block;

      if (block.type === "tool_use") {
        stdout.write("\n");
      } else if (block.type === "text") {
        stdout.write("\n");
        logger.info("<- [text]");
      } else if (block.type === "thinking" || block.type === "redacted_thinking") {
        stdout.write("\n");
      }
      continue;
    }

    if (event.type === "content_block_delta") {
      if (event.delta.type === "thinking_delta") {
        stdout.write(event.delta.thinking);
        if (currentBlock?.type === "thinking") {
          currentBlock.thinking += event.delta.thinking;
        }
      } else if (event.delta.type === "text_delta") {
        stdout.write(event.delta.text);
        if (currentBlock?.type === "text") {
          currentBlock.text += event.delta.text;
        }
      } else if (event.delta.type === "input_json_delta" && currentBlock?.type === "tool_use") {
        const toolUseBlock = currentBlock as ToolUseBlockWithInputBuffer;
        toolUseBlock._inputStr = (toolUseBlock._inputStr ?? "") + event.delta.partial_json;
      } else if (event.delta.type === "signature_delta" && currentBlock?.type === "thinking") {
        currentBlock.signature = event.delta.signature;
      }
      continue;
    }

    if (event.type === "content_block_stop") {
      if (!currentBlock) continue;

      if (currentBlock.type === "tool_use") {
        const toolUseBlock = currentBlock as ToolUseBlockWithInputBuffer;
        toolUseBlock.input = JSON.parse(toolUseBlock._inputStr ?? "{}");
        delete toolUseBlock._inputStr;
        logger.info(
          `<- [tool_use] ${toolUseBlock.name}: ${truncate(JSON.stringify(toolUseBlock.input), 80)}`
        );
      }

      contentBlocks.push(currentBlock);
      currentBlock = null;
      continue;
    }

    if (event.type === "message_delta") {
      stopReason = event.delta.stop_reason;
    }
  }

  stdout.write("\n");
  return { contentBlocks, stopReason };
}

export async function runAgent(prompt: string, deps: RunAgentDeps): Promise<void> {
  const skills = await deps.loadSkills();
  const systemPrompt = buildSystemPrompt(skills);
  const messages: Anthropic.MessageParam[] = [{ role: "user", content: prompt }];

  while (true) {
    logRequest(deps.logger, messages[messages.length - 1]!);

    const stream = await deps.client.messages.create({
      model: getDefaultModel(),
      max_tokens: 16000,
      stream: true,
      system: systemPrompt,
      thinking: { type: "enabled", budget_tokens: 10000 },
      tools: deps.tools,
      messages,
    });

    const { contentBlocks, stopReason } = await consumeStream(stream, deps.logger, deps.stdout);
    messages.push({ role: "assistant", content: contentBlocks });

    if (stopReason !== "tool_use") break;

    const toolResults: Anthropic.ToolResultBlockParam[] = await Promise.all(
      contentBlocks.filter(isToolUseBlock).map(async (block) => ({
        type: "tool_result" as const,
        tool_use_id: block.id,
        content: await deps.executeTool(block.name, block.input as Record<string, unknown>),
      }))
    );

    messages.push({ role: "user", content: toolResults });
  }
}
