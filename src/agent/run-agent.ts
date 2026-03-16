import Anthropic from "@anthropic-ai/sdk";

import { getDefaultModel } from "../env";
import type { Logger } from "../logger";
import { truncate } from "../logger";
import type { SkillMeta } from "../skills/load-skills";
import type { AskUserToolInput } from "../cli/ask-user";
import { buildSystemPrompt } from "./system-prompt";
import type { RuntimeInfo } from "./runtime-info";

type StreamClient = {
  messages: {
    create(
      params: Anthropic.MessageCreateParamsStreaming,
    ): PromiseLike<AsyncIterable<Anthropic.MessageStreamEvent>>;
  };
};

export type OutputWriter = Pick<typeof process.stdout, "write">;
export type ToolExecutor = (
  name: string,
  input?: Record<string, unknown>,
) => Promise<string>;
export type SkillLoader = () => Promise<SkillMeta[]>;
type ToolUseBlockWithInputBuffer = Anthropic.ToolUseBlock & {
  _inputStr?: string;
};
type AskUserHandler = (input: AskUserToolInput) => Promise<string>;

const DEFAULT_MAX_ASK_USER_ROUNDS = 3;
const DEFAULT_MAX_PLAIN_TEXT_ASK_USER_RETRIES = 2;

export interface RunAgentDeps {
  client: StreamClient;
  logger: Logger;
  baseTools: Anthropic.ToolUnion[];
  askUserTool?: Anthropic.Tool;
  askUser?: AskUserHandler;
  maxAskUserRounds?: number;
  executeTool: ToolExecutor;
  loadSkills: SkillLoader;
  stdout: OutputWriter;
  runtime: RuntimeInfo;
  maxTurns?: number;
  depth?: number;
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
      typeof block.content === "string"
        ? block.content
        : JSON.stringify(block.content);
    logger.info(`-> tool_result: ${truncate(resultText, 60)}`);
  }
}

function isToolUseBlock(
  block: Anthropic.ContentBlock,
): block is Anthropic.ToolUseBlock {
  return block.type === "tool_use";
}

function isAskUserBlock(block: Anthropic.ToolUseBlock): boolean {
  return block.name === "ask_user";
}

function getToolsForTurn(
  deps: RunAgentDeps,
  askUserRounds: number,
): Anthropic.ToolUnion[] {
  if (!deps.askUser || !deps.askUserTool) return deps.baseTools;
  if (askUserRounds >= (deps.maxAskUserRounds ?? DEFAULT_MAX_ASK_USER_ROUNDS)) {
    return deps.baseTools;
  }
  return [...deps.baseTools, deps.askUserTool];
}

function getTextBlocks(
  contentBlocks: Anthropic.ContentBlock[],
): Anthropic.TextBlock[] {
  return contentBlocks.filter(
    (block): block is Anthropic.TextBlock => block.type === "text",
  );
}

function getTrailingQuestion(
  contentBlocks: Anthropic.ContentBlock[],
): string | null {
  const text = getTextBlocks(contentBlocks)
    .map((block) => block.text)
    .join("")
    .trim();

  if (!text.endsWith("?")) return null;
  return text;
}

async function consumeStream(
  stream: AsyncIterable<Anthropic.MessageStreamEvent>,
  logger: Logger,
  stdout: OutputWriter,
): Promise<{
  contentBlocks: Anthropic.ContentBlock[];
  stopReason: Anthropic.StopReason | null;
}> {
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
      } else if (
        block.type === "thinking" ||
        block.type === "redacted_thinking"
      ) {
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
      } else if (
        event.delta.type === "input_json_delta" &&
        currentBlock?.type === "tool_use"
      ) {
        const toolUseBlock = currentBlock as ToolUseBlockWithInputBuffer;
        toolUseBlock._inputStr =
          (toolUseBlock._inputStr ?? "") + event.delta.partial_json;
      } else if (
        event.delta.type === "signature_delta" &&
        currentBlock?.type === "thinking"
      ) {
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
          `<- [tool_use] ${toolUseBlock.name}: ${truncate(JSON.stringify(toolUseBlock.input), 80)}`,
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

export async function runAgent(
  prompt: string,
  deps: RunAgentDeps,
): Promise<void> {
  const skills = await deps.loadSkills();
  const messages: Anthropic.MessageParam[] = [
    { role: "user", content: prompt },
  ];
  let askUserRounds = 0;
  let plainTextAskUserRetries = 0;
  let turn = 0;

  while (true) {
    if (deps.maxTurns !== undefined && turn >= deps.maxTurns) break;
    turn++;
    const tools = getToolsForTurn(deps, askUserRounds);
    const askUserEnabled = tools.some(
      (tool) => "name" in tool && tool.name === "ask_user",
    );
    const systemPrompt = buildSystemPrompt(skills, {
      enableAskUser: askUserEnabled,
      runtime: deps.runtime,
    });

    logRequest(deps.logger, messages[messages.length - 1]!);

    const stream = await deps.client.messages.create({
      model: getDefaultModel(),
      max_tokens: 16000,
      stream: true,
      system: systemPrompt,
      thinking: { type: "enabled", budget_tokens: 10000 },
      tools,
      messages,
    });

    const { contentBlocks, stopReason } = await consumeStream(
      stream,
      deps.logger,
      deps.stdout,
    );
    messages.push({ role: "assistant", content: contentBlocks });

    const trailingQuestion = askUserEnabled
      ? getTrailingQuestion(contentBlocks)
      : null;
    if (trailingQuestion && stopReason !== "tool_use") {
      if (plainTextAskUserRetries >= DEFAULT_MAX_PLAIN_TEXT_ASK_USER_RETRIES) {
        throw new Error(
          "assistant asked the user a plain-text question instead of using ask_user",
        );
      }

      plainTextAskUserRetries += 1;
      deps.logger.info(
        "-> ask_user_retry: assistant ended the turn with a plain-text question",
      );
      messages.push({
        role: "user",
        content: `You ended the turn by asking the user a question in plain text: "${trailingQuestion}". Re-ask that exact question with the ask_user tool now. Use kind "confirm" for yes/no approval, otherwise use kind "clarify". Do not call any other tool or add any text.`,
      });
      continue;
    }

    if (stopReason !== "tool_use") break;

    const toolUseBlocks = contentBlocks.filter(isToolUseBlock);
    const askUserBlocks = toolUseBlocks.filter(isAskUserBlock);

    if (
      askUserBlocks.length > 1 ||
      (askUserBlocks.length === 1 && toolUseBlocks.length !== 1)
    ) {
      throw new Error("ask_user must be the only tool call in its response");
    }

    if (askUserBlocks.length === 1) {
      if (!deps.askUser) {
        throw new Error(
          "ask_user was requested but interactive input is not enabled",
        );
      }

      const askUserBlock = askUserBlocks[0]!;
      deps.logger.info(
        `-> ask_user (${askUserRounds + 1}/${deps.maxAskUserRounds ?? DEFAULT_MAX_ASK_USER_ROUNDS}): ${truncate(JSON.stringify(askUserBlock.input), 80)}`,
      );
      const answer = await deps.askUser(askUserBlock.input as AskUserToolInput);
      askUserRounds += 1;
      plainTextAskUserRetries = 0;
      messages.push({
        role: "user",
        content: [
          {
            type: "tool_result",
            tool_use_id: askUserBlock.id,
            content: answer,
          },
        ],
      });
      continue;
    }

    const toolResults: Anthropic.ToolResultBlockParam[] = await Promise.all(
      toolUseBlocks.map(async (block) => ({
        type: "tool_result" as const,
        tool_use_id: block.id,
        content: await deps.executeTool(
          block.name,
          block.input as Record<string, unknown>,
        ),
      })),
    );

    messages.push({ role: "user", content: toolResults });
  }
}
