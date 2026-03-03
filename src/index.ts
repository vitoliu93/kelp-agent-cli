import Anthropic from "@anthropic-ai/sdk";

import { resolvePrompt } from "./cli/resolve-prompt";
import { runAgent } from "./agent/run-agent";
import { getAnthropicClientOptions } from "./env";
import { createLogger } from "./logger";
import { skillsDir } from "./paths";
import { loadSkills } from "./skills/load-skills";
import { toolDefinitions } from "./tools/definitions";
import { BashSession } from "./tools/bash-session";
import { executeTool } from "./tools/execute-tool";

export async function main(): Promise<void> {
  const prompt = await resolvePrompt({
    argv: Bun.argv,
    isTTY: process.stdin.isTTY,
    readStdin: () => Bun.stdin.text(),
  });
  if (!prompt) {
    console.error("Usage: bun dev <prompt>");
    console.error("   or: echo '<prompt>' | bun dev");
    process.exit(1);
  }

  const logger = createLogger();
  const bashSession = new BashSession();
  const client = new Anthropic(getAnthropicClientOptions());

  try {
    await runAgent(prompt, {
      client,
      logger,
      tools: toolDefinitions,
      executeTool: (name, input) => executeTool(name, input, bashSession),
      loadSkills: () => loadSkills(skillsDir),
      stdout: process.stdout,
    });
  } finally {
    bashSession.close();
  }
}

if (import.meta.main) {
  await main();
}
