import Anthropic from "@anthropic-ai/sdk";
import { afterEach, describe, expect, test } from "bun:test";

import { runAgent } from "../src/agent/run-agent";
import { createAskUser } from "../src/cli/ask-user";
import { resolvePrompt } from "../src/cli/resolve-prompt";
import { getAnthropicClientOptions, getDefaultModel } from "../src/env";
import { buildSystemPrompt } from "../src/agent/system-prompt";
import type { RuntimeInfo } from "../src/agent/runtime-info";
import { BashSession } from "../src/tools/bash-session";
import { askUserToolDefinition, baseToolDefinitions, createToolDefinitions } from "../src/tools/definitions";
import { executeTool } from "../src/tools/execute-tool";

const fakeRuntime: RuntimeInfo = {
  cwd: "/home/vito/project",
  shell: "/bin/zsh",
  os: "linux",
  arch: "x64",
  date: "2026-03-12",
};

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
      this.calls.push(structuredClone(params));
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

function restoreEnv(name: string, value: string | undefined): void {
  if (value === undefined) {
    delete process.env[name];
    return;
  }

  process.env[name] = value;
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

  test("resolvePrompt combines argv and stdin when both present", async () => {
    const prompt = await resolvePrompt({
      argv: ["bun", "src/index.ts", "summarize"],
      isTTY: false,
      readStdin: async () => "M src/foo.ts",
    });

    expect(prompt).toBe("<stdin>\nM src/foo.ts\n</stdin>\n\nsummarize");
  });

  test("runAgent writes text output", async () => {
    const stdout = new FakeStdout();
    const logger = new FakeLogger();
    const client = new FakeClient([textResponse("hello from kelp")]);

    await runAgent("say hello", {
      client,
      logger,
      baseTools: baseToolDefinitions,
      executeTool: async () => "",
      loadSkills: async () => [],
      stdout,
      runtime: fakeRuntime,
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
      baseTools: baseToolDefinitions,
      executeTool: async (name) => {
        executedTools.push(name);
        return "secret";
      },
      loadSkills: async () => [],
      stdout,
      runtime: fakeRuntime,
    });

    expect(executedTools).toEqual(["tell_secret"]);
    expect(client.calls).toHaveLength(2);
    expect(client.calls[1]!.messages[2]).toEqual({
      role: "user",
      content: [{ type: "tool_result", tool_use_id: "tool-1", content: "secret" }],
    });
    expect(stdout.text()).toContain("done");
  });

  test("runAgent handles ask_user clarify round-trip", async () => {
    const stdout = new FakeStdout();
    const logger = new FakeLogger();
    const client = new FakeClient([
      toolUseResponse("ask-1", "ask_user", { kind: "clarify", question: "which file?" }),
      textResponse("done"),
    ]);
    const answers: string[] = [];

    await runAgent("fix it", {
      client,
      logger,
      baseTools: baseToolDefinitions,
      askUserTool: askUserToolDefinition,
      askUser: async (input) => {
        answers.push(input.question);
        return JSON.stringify({ kind: "clarify", answer: "src/index.ts" });
      },
      maxAskUserRounds: 3,
      executeTool: async () => "",
      loadSkills: async () => [],
      stdout,
      runtime: fakeRuntime,
    });

    expect(answers).toEqual(["which file?"]);
    expect(client.calls).toHaveLength(2);
    expect(client.calls[0]!.tools.map((tool) => ("name" in tool ? tool.name : ""))).toContain("ask_user");
    expect(client.calls[1]!.messages[2]).toEqual({
      role: "user",
      content: [
        {
          type: "tool_result",
          tool_use_id: "ask-1",
          content: JSON.stringify({ kind: "clarify", answer: "src/index.ts" }),
        },
      ],
    });
  });

  test("runAgent handles ask_user confirm round-trip", async () => {
    const stdout = new FakeStdout();
    const logger = new FakeLogger();
    const client = new FakeClient([
      toolUseResponse("ask-2", "ask_user", { kind: "confirm", question: "continue?" }),
      textResponse("confirmed"),
    ]);

    await runAgent("deploy", {
      client,
      logger,
      baseTools: baseToolDefinitions,
      askUserTool: askUserToolDefinition,
      askUser: async () => JSON.stringify({ kind: "confirm", answer: "yes" }),
      maxAskUserRounds: 3,
      executeTool: async () => "",
      loadSkills: async () => [],
      stdout,
      runtime: fakeRuntime,
    });

    expect(client.calls[1]!.messages[2]).toEqual({
      role: "user",
      content: [
        {
          type: "tool_result",
          tool_use_id: "ask-2",
          content: JSON.stringify({ kind: "confirm", answer: "yes" }),
        },
      ],
    });
    expect(stdout.text()).toContain("confirmed");
  });

  test("runAgent retries when the assistant asks a plain-text confirmation question", async () => {
    const stdout = new FakeStdout();
    const logger = new FakeLogger();
    const client = new FakeClient([
      textResponse("Shall I proceed with the rename?"),
      toolUseResponse("ask-3", "ask_user", {
        kind: "confirm",
        question: "Shall I proceed with the rename?",
      }),
      textResponse("confirmed"),
    ]);

    await runAgent("prepare rename", {
      client,
      logger,
      baseTools: baseToolDefinitions,
      askUserTool: askUserToolDefinition,
      askUser: async () => JSON.stringify({ kind: "confirm", answer: "yes" }),
      maxAskUserRounds: 3,
      executeTool: async () => "",
      loadSkills: async () => [],
      stdout,
      runtime: fakeRuntime,
    });

    expect(client.calls).toHaveLength(3);
    expect(client.calls[1]!.messages.at(-1)).toEqual({
      role: "user",
      content:
        'You ended the turn by asking the user a question in plain text: "Shall I proceed with the rename?". Re-ask that exact question with the ask_user tool now. Use kind "confirm" for yes/no approval, otherwise use kind "clarify". Do not call any other tool or add any text.',
    });
    expect(client.calls[2]!.messages.at(-1)).toEqual({
      role: "user",
      content: [
        {
          type: "tool_result",
          tool_use_id: "ask-3",
          content: JSON.stringify({ kind: "confirm", answer: "yes" }),
        },
      ],
    });
    expect(stdout.text()).toContain("confirmed");
  });

  test("runAgent stops exposing ask_user after the round cap", async () => {
    const stdout = new FakeStdout();
    const logger = new FakeLogger();
    const client = new FakeClient([
      toolUseResponse("ask-1", "ask_user", { kind: "clarify", question: "q1" }),
      toolUseResponse("ask-2", "ask_user", { kind: "clarify", question: "q2" }),
      toolUseResponse("ask-3", "ask_user", { kind: "clarify", question: "q3" }),
      textResponse("done"),
    ]);

    await runAgent("multi", {
      client,
      logger,
      baseTools: baseToolDefinitions,
      askUserTool: askUserToolDefinition,
      askUser: async ({ question }) => JSON.stringify({ kind: "clarify", answer: question }),
      maxAskUserRounds: 3,
      executeTool: async () => "",
      loadSkills: async () => [],
      stdout,
      runtime: fakeRuntime,
    });

    expect(client.calls[0]!.tools.map((tool) => ("name" in tool ? tool.name : ""))).toContain("ask_user");
    expect(client.calls[1]!.tools.map((tool) => ("name" in tool ? tool.name : ""))).toContain("ask_user");
    expect(client.calls[2]!.tools.map((tool) => ("name" in tool ? tool.name : ""))).toContain("ask_user");
    expect(client.calls[3]!.tools.map((tool) => ("name" in tool ? tool.name : ""))).not.toContain("ask_user");
  });
});

describe("env", () => {
  const originalEnv = {
    KELP_BASE_URL: process.env.KELP_BASE_URL,
    KELP_API_KEY: process.env.KELP_API_KEY,
    KELP_DEFAULT_MODEL: process.env.KELP_DEFAULT_MODEL,
    OPENROUTER_ANTHROPIC_BASE_URL: process.env.OPENROUTER_ANTHROPIC_BASE_URL,
    OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY,
  };

  afterEach(() => {
    restoreEnv("KELP_BASE_URL", originalEnv.KELP_BASE_URL);
    restoreEnv("KELP_API_KEY", originalEnv.KELP_API_KEY);
    restoreEnv("KELP_DEFAULT_MODEL", originalEnv.KELP_DEFAULT_MODEL);
    restoreEnv(
      "OPENROUTER_ANTHROPIC_BASE_URL",
      originalEnv.OPENROUTER_ANTHROPIC_BASE_URL
    );
    restoreEnv("OPENROUTER_API_KEY", originalEnv.OPENROUTER_API_KEY);
  });

  test("anthropic client options use bearer auth for openrouter", () => {
    process.env.KELP_BASE_URL = "https://openrouter.ai/api/v1";
    process.env.KELP_API_KEY = "openrouter-secret";

    expect(getAnthropicClientOptions()).toEqual({
      baseURL: "https://openrouter.ai/api",
      authToken: "openrouter-secret",
      apiKey: null,
    });
  });

  test("anthropic client options keep api key auth for non-openrouter", () => {
    process.env.KELP_BASE_URL = "https://example.com";
    process.env.KELP_API_KEY = "secret";

    expect(getAnthropicClientOptions()).toEqual({
      baseURL: "https://example.com",
      apiKey: "secret",
    });
  });

  test("default model reads kelp-prefixed env var", () => {
    process.env.KELP_DEFAULT_MODEL = "anthropic/test-model";

    expect(getDefaultModel()).toBe("anthropic/test-model");
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

describe("interactive tools", () => {
  test("createToolDefinitions includes ask_user only when enabled", () => {
    expect(createToolDefinitions({ enableAskUser: false }).map((tool) => tool.name)).toEqual([
      "tell_secret",
      "bash",
      "delegate_task",
    ]);
    expect(createToolDefinitions({ enableAskUser: true }).map((tool) => tool.name)).toEqual([
      "tell_secret",
      "bash",
      "delegate_task",
      "ask_user",
    ]);
  });

  test("createAskUser trims clarify answers", async () => {
    const askUser = createAskUser({
      promptInput: async (message) => {
        expect(message).toBe("Which file?");
        return " src/index.ts ";
      },
    });

    expect(await askUser({ kind: "clarify", question: "Which file?" })).toBe(
      JSON.stringify({ kind: "clarify", answer: "src/index.ts" })
    );
  });

  test("createAskUser normalizes confirm answers", async () => {
    const askUser = createAskUser({
      promptConfirm: async (message) => {
        expect(message).toBe("Continue?");
        return true;
      },
    });

    expect(await askUser({ kind: "confirm", question: "Continue?" })).toBe(
      JSON.stringify({ kind: "confirm", answer: "yes" })
    );
  });
});

describe("stdin pipe feedback", () => {
  test(
    "writes received byte count to stderr when stdin is piped",
    async () => {
      const input = "hello from pipe";
      const proc = Bun.spawn(["bun", "src/index.ts", "repeat it back"], {
        stdin: new TextEncoder().encode(input),
        stdout: "pipe",
        stderr: "pipe",
      });
      await proc.exited;
      const stderr = await new Response(proc.stderr).text();
      expect(stderr).toContain(`[kelp] received ${Buffer.byteLength(input)} bytes from stdin`);
    },
    60000
  );
});

describe("system prompt", () => {
  test("buildSystemPrompt switches ask_user guidance by mode", () => {
    const nonInteractive = buildSystemPrompt([], { enableAskUser: false, runtime: fakeRuntime });
    const interactive = buildSystemPrompt([], { enableAskUser: true, runtime: fakeRuntime });

    expect(nonInteractive).toContain("If a task is ambiguous, state your assumption in one line and proceed.");
    expect(nonInteractive).not.toContain("use the ask_user tool");
    expect(interactive).toContain("use the ask_user tool");
    expect(interactive).toContain("never ask the user a question in plain text");
    expect(interactive).toContain("Never mix ask_user with other tool calls in the same response.");
  });

  test("buildSystemPrompt includes XML environment section", () => {
    const prompt = buildSystemPrompt([], { enableAskUser: false, runtime: fakeRuntime });

    expect(prompt).toContain("<environment>");
    expect(prompt).toContain("</environment>");
    expect(prompt).toContain(fakeRuntime.date);
    expect(prompt).toContain(fakeRuntime.cwd);
    expect(prompt).toContain(fakeRuntime.shell);
    expect(prompt).toContain(fakeRuntime.os);
  });

  test("buildSystemPrompt pushes realtime questions toward installed skills", () => {
    const prompt = buildSystemPrompt(
      [
        {
          name: "web-search",
          description: "Search the web for current information.",
          path: "/tmp/app/skills/web-search",
        },
      ],
      { enableAskUser: false, runtime: fakeRuntime },
    );

    expect(prompt).toContain("<warning>");
    expect(prompt).toContain("Skills are NOT tools");
    expect(prompt).toContain("<activation>");
    expect(prompt).toContain("cat /tmp/app/skills/web-search/SKILL.md");
    expect(prompt).toContain("<catalog>");
    expect(prompt).toContain("web-search");
  });
});
