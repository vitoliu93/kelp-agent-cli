import Anthropic from "@anthropic-ai/sdk";

import { resolvePrompt } from "./cli/resolve-prompt";
import { createAskUser } from "./cli/ask-user";
import { runAgent } from "./agent/run-agent";
import { collectRuntimeInfo } from "./agent/runtime-info";
import { getAnthropicClientOptions } from "./env";
import { createLogger } from "./logger";
import {
  assertProjectRootReadable,
  getSkillDirectories,
  resolveProjectRoot,
} from "./paths";
import { loadSkills } from "./skills/load-skills";
import { askUserToolDefinition, baseToolDefinitions } from "./tools/definitions";
import { BashSession } from "./tools/bash-session";
import { executeTool } from "./tools/execute-tool";
import { checkBashCommand } from "./tools/bash-guard";

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
  const interactiveMode = Boolean(process.stdin.isTTY && process.stdout.isTTY);
  const askUser = interactiveMode ? createAskUser() : undefined;
  const runtime = collectRuntimeInfo();
  const projectRoot = resolveProjectRoot();
  assertProjectRootReadable(projectRoot);
  const skillDirs = getSkillDirectories();

  try {
    await runAgent(prompt, {
      client,
      logger,
      baseTools: baseToolDefinitions,
      askUserTool: interactiveMode ? askUserToolDefinition : undefined,
      askUser,
      maxAskUserRounds: 3,
      executeTool: async (name, input) => {
        if (name === "bash") {
          const rejection = checkBashCommand(input.command as string);
          if (rejection) return rejection;
        }
        return executeTool(name, input, bashSession);
      },
      loadSkills: () => loadSkills(skillDirs),
      stdout: process.stdout,
      runtime,
    });
  } finally {
    bashSession.close();
  }
}

if (import.meta.main) {
  await main();
}
