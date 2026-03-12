import Anthropic from "@anthropic-ai/sdk";
import { afterEach, describe, expect, test } from "bun:test";

import { runAgent } from "../src/agent/run-agent";
import { collectRuntimeInfo } from "../src/agent/runtime-info";
import { getAnthropicClientOptions } from "../src/env";
import { baseToolDefinitions } from "../src/tools/definitions";

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

describe("subagent exit behavior", () => {
  let bashProcesses: Array<ReturnType<typeof Bun.spawn>> = [];

  afterEach(() => {
    bashProcesses.forEach((proc) => {
      try {
        proc.kill();
      } catch {}
    });
    bashProcesses = [];
  });

  test("subagent completes and exits without hanging timeout", async () => {
    const stdout = new CaptureStdout();
    const client = new Anthropic(getAnthropicClientOptions());

    const executeToolMock = async (name: string) => {
      if (name === "tell_secret") {
        return "test secret";
      }
      throw new Error(`Unknown tool: ${name}`);
    };

    const startTime = Date.now();
    await runAgent("respond with hello then stop", {
      client,
      logger: silentLogger,
      baseTools: baseToolDefinitions,
      executeTool: executeToolMock,
      loadSkills: async () => [],
      stdout,
      runtime: collectRuntimeInfo(),
      maxTurns: 1,
    });
    const elapsed = Date.now() - startTime;

    const output = stdout.text();
    expect(output).toContain("hello");
    // Should complete in reasonable time (< 30s), not wait for 120s timeout
    expect(elapsed).toBeLessThan(30000);
  });
});
