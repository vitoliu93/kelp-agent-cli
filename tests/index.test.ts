import Anthropic from "@anthropic-ai/sdk";
import { afterEach, describe, expect, test } from "bun:test";

import { runAgent } from "../src/agent/run-agent";
import { resolvePrompt } from "../src/cli/resolve-prompt";
import { BashSession } from "../src/tools/bash-session";
import { executeTool } from "../src/tools/execute-tool";
import { toolDefinitions } from "../src/tools/definitions";

class FakeLogger {
  logs: string[] = [];

  info(message: string): void {
    this.logs.push(message);
  }
}

class FakeStdout {
  chunks: string[] = [];

  write(chunk: string): boolean {
    this.chunks.push(chunk);
    return true;
  }

  text(): string {
    return this.chunks.join("");
  }
}

class FakeClient {
  constructor(
    private readonly streams: AsyncIterable<Anthropic.MessageStreamEvent>[],
    public readonly calls: Anthropic.MessageCreateParamsStreaming[] = []
  ) {}

  messages = {
    create: async (params: Anthropic.MessageCreateParamsStreaming) => {
      this.calls.push(params);
      const stream = this.streams.shift();
      if (!stream) {
        throw new Error("No fake stream available");
      }
      return stream;
    },
  };
}

function makeStream(events: Anthropic.MessageStreamEvent[]): AsyncIterable<Anthropic.MessageStreamEvent> {
  return {
    async *[Symbol.asyncIterator]() {
      for (const event of events) {
        yield event;
      }
    },
  };
}

function textResponse(text: string): AsyncIterable<Anthropic.MessageStreamEvent> {
  return makeStream([
    {
      type: "content_block_start",
      index: 0,
      content_block: { type: "text", text: "" },
    },
    {
      type: "content_block_delta",
      index: 0,
      delta: { type: "text_delta", text },
    },
    { type: "content_block_stop", index: 0 },
    { type: "message_delta", delta: { stop_reason: "end_turn", stop_sequence: null }, usage: { output_tokens: 1 } },
  ]);
}

function toolUseResponse(
  id: string,
  name: string,
  input: Record<string, unknown>
): AsyncIterable<Anthropic.MessageStreamEvent> {
  return makeStream([
    {
      type: "content_block_start",
      index: 0,
      content_block: { type: "tool_use", id, name, input: {} },
    },
    {
      type: "content_block_delta",
      index: 0,
      delta: { type: "input_json_delta", partial_json: JSON.stringify(input) },
    },
    { type: "content_block_stop", index: 0 },
    { type: "message_delta", delta: { stop_reason: "tool_use", stop_sequence: null }, usage: { output_tokens: 1 } },
  ]);
}

describe("agent", () => {
  test("resolvePrompt prefers argv text", async () => {
    const prompt = await resolvePrompt({
      argv: ["bun", "src/index.ts", "hi", "i", "am", "vito"],
      isTTY: true,
      readStdin: async () => "ignored",
    });

    expect(prompt).toBe("hi i am vito");
  });

  test("resolvePrompt reads stdin when argv is empty", async () => {
    const prompt = await resolvePrompt({
      argv: ["bun", "src/index.ts"],
      isTTY: false,
      readStdin: async () => " hi, i am vito \n",
    });

    expect(prompt).toBe("hi, i am vito");
  });

  test("runAgent writes text output", async () => {
    const stdout = new FakeStdout();
    const logger = new FakeLogger();
    const client = new FakeClient([textResponse("hello from kelp")]);

    await runAgent("say hello", {
      client,
      logger,
      tools: toolDefinitions,
      executeTool: async () => "",
      loadSkills: async () => [],
      stdout,
    });

    expect(stdout.text()).toContain("hello from kelp");
    expect(logger.logs).toContain("<- [text]");
    expect(client.calls).toHaveLength(1);
  });

  test("runAgent handles tool round-trip", async () => {
    const stdout = new FakeStdout();
    const logger = new FakeLogger();
    const client = new FakeClient([
      toolUseResponse("tool-1", "tell_secret", {}),
      textResponse("done"),
    ]);
    const executedTools: string[] = [];

    await runAgent("tell me a secret", {
      client,
      logger,
      tools: toolDefinitions,
      executeTool: async (name) => {
        executedTools.push(name);
        return "secret";
      },
      loadSkills: async () => [],
      stdout,
    });

    expect(executedTools).toEqual(["tell_secret"]);
    expect(client.calls).toHaveLength(2);
    expect(client.calls[1]!.messages[2]).toEqual({
      role: "user",
      content: [{ type: "tool_result", tool_use_id: "tool-1", content: "secret" }],
    });
    expect(stdout.text()).toContain("done");
  });
});

describe("tools", () => {
  const bashSession = new BashSession();

  afterEach(() => {
    bashSession.close();
  });

  test("tell_secret tool returns vito's secret", async () => {
    expect(await executeTool("tell_secret", {}, bashSession)).toBe("vito 是一个帅哥，他住在上海");
  });

  test("bash tool: echo hello", async () => {
    const output = await executeTool("bash", { command: "echo hello" }, bashSession);
    expect(output.trim()).toBe("hello");
  });

  test("bash tool: session persistence", async () => {
    await bashSession.run("cd /tmp");
    const output = await bashSession.run("pwd");
    expect(output.trim()).toBe("/tmp");
  });
});
