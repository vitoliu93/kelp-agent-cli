/**
 * Real agent integration tests for bash-guard.
 *
 * Each test instructs the agent to attempt a specific bash command and respond
 * with a magic word depending on whether it was blocked or succeeded. The test
 * then asserts on the magic word in stdout.
 *
 * Requires a live API key. Timeout: 60 s per test.
 */
import Anthropic from "@anthropic-ai/sdk";
import { afterEach, describe, expect, test } from "bun:test";

import { runAgent } from "../src/agent/run-agent";
import { getAnthropicClientOptions } from "../src/env";
import { checkBashCommand } from "../src/tools/bash-guard";
import { BashSession } from "../src/tools/bash-session";
import { baseToolDefinitions } from "../src/tools/definitions";
import { executeTool } from "../src/tools/execute-tool";

class CaptureStdout {
  private chunks: string[] = [];

  write(chunk: string): boolean {
    this.chunks.push(chunk);
    return true;
  }

  text(): string {
    return this.chunks.join("");
  }
}

const silentLogger = { info: () => {} };

function makeExecuteTool(bashSession: BashSession) {
  return async (name: string, input: Record<string, unknown> = {}) => {
    if (name === "bash") {
      const rejection = checkBashCommand(input.command as string);
      if (rejection) return rejection;
    }
    return executeTool(name, input, bashSession);
  };
}

function runWithGuard(prompt: string, bashSession: BashSession): Promise<string> {
  const stdout = new CaptureStdout();
  const client = new Anthropic(getAnthropicClientOptions());

  return runAgent(prompt, {
    client,
    logger: silentLogger,
    baseTools: baseToolDefinitions,
    executeTool: makeExecuteTool(bashSession),
    loadSkills: async () => [],
    stdout,
  }).then(() => stdout.text());
}

describe("bash-guard agent integration", () => {
  let bashSession: BashSession;

  afterEach(() => {
    bashSession?.close();
  });

  test(
    "write to ~/.zshrc is blocked; agent says ZSHRC_GUARD_OK",
    async () => {
      bashSession = new BashSession();

      const output = await runWithGuard(
        "Call the bash tool with this exact command: echo 'alias foo=bar' >> ~/.zshrc\n" +
          "If the tool returns a message starting with 'BLOCKED', respond with exactly: ZSHRC_GUARD_OK\n" +
          "If the command ran without a BLOCKED message, respond with exactly: ZSHRC_GUARD_FAIL",
        bashSession
      );

      expect(output).toContain("ZSHRC_GUARD_OK");
    },
    60000
  );

  test(
    "read from ~/.ssh is allowed; agent says SSH_READ_OK",
    async () => {
      bashSession = new BashSession();

      const output = await runWithGuard(
        "Call the bash tool with this exact command: ls ~/.ssh\n" +
          "If the command ran without a BLOCKED message (even if the directory is empty), respond with exactly: SSH_READ_OK\n" +
          "If the tool returns a message starting with 'BLOCKED', respond with exactly: SSH_READ_FAIL",
        bashSession
      );

      expect(output).toContain("SSH_READ_OK");
    },
    60000
  );

  test(
    "write to /etc/ is blocked; agent says ETC_GUARD_OK",
    async () => {
      bashSession = new BashSession();

      const output = await runWithGuard(
        "Call the bash tool with this exact command: touch /etc/kelp-test.conf\n" +
          "If the tool returns a message starting with 'BLOCKED', respond with exactly: ETC_GUARD_OK\n" +
          "If the command ran without a BLOCKED message, respond with exactly: ETC_GUARD_FAIL",
        bashSession
      );

      expect(output).toContain("ETC_GUARD_OK");
    },
    60000
  );
});
