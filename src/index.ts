import Anthropic from "@anthropic-ai/sdk";

import { resolvePrompt } from "./cli/resolve-prompt";
import { createAskUser } from "./cli/ask-user";
import { runAgent } from "./agent/run-agent";
import type { ToolExecutor } from "./agent/run-agent";
import { collectRuntimeInfo } from "./agent/runtime-info";
import { getAnthropicClientOptions } from "./env";
import { createLogger } from "./logger";
import {
  assertAppRootReadable,
  getSkillDirectories,
  resolveAppRoot,
} from "./paths";
import { loadSkills } from "./skills/load-skills";
import { askUserToolDefinition, baseToolDefinitions } from "./tools/definitions";
import { BashSession } from "./tools/bash-session";
import { executeTool } from "./tools/execute-tool";
import { checkBashCommand } from "./tools/bash-guard";

export async function main(): Promise<void> {
  let stdinBytes = 0;
  const prompt = await resolvePrompt({
    argv: Bun.argv,
    isTTY: process.stdin.isTTY,
    readStdin: async () => {
      const text = await Bun.stdin.text();
      stdinBytes = Buffer.byteLength(text);
      return text;
    },
  });
  if (!prompt) {
    console.error("Usage: bun dev <prompt>");
    console.error("   or: echo '<prompt>' | bun dev");
    process.exit(1);
  }

  if (!process.stdin.isTTY) {
    process.stderr.write(`[kelp] received ${stdinBytes} bytes from stdin\n`);
  }

  const logger = createLogger();
  const bashSession = new BashSession();
  const client = new Anthropic(getAnthropicClientOptions());
  const interactiveMode = Boolean(process.stdin.isTTY && process.stdout.isTTY);
  const askUser = interactiveMode ? createAskUser() : undefined;
  const runtime = collectRuntimeInfo();
  const appRoot = resolveAppRoot();
  assertAppRootReadable(appRoot);
  const skillDirs = getSkillDirectories({ appRoot });
  let skillsPromise: ReturnType<typeof loadSkills> | undefined;
  const loadRuntimeSkills = (): ReturnType<typeof loadSkills> => {
    skillsPromise ??= loadSkills(skillDirs);
    return skillsPromise;
  };

  try {
    const skills = await loadRuntimeSkills();
    if (skills.length === 0) {
      logger.info(
        `[skills] none found; appRoot=${appRoot}; searched=${skillDirs.join(", ")}`,
      );
    }

    const executeToolWrapper: ToolExecutor = async (name: string, input?: Record<string, unknown>) => {
      if (name === "bash") {
        const rejection = checkBashCommand(input?.command as string);
        if (rejection) return rejection;
      }
      const subagentDeps = {
        client,
        logger,
        baseTools: baseToolDefinitions,
        executeTool: executeToolWrapper,
        loadSkills: loadRuntimeSkills,
        runtime,
      };

      return executeTool(name, input, bashSession, subagentDeps);
    };

    await runAgent(prompt, {
      client,
      logger,
      baseTools: baseToolDefinitions,
      askUserTool: interactiveMode ? askUserToolDefinition : undefined,
      askUser,
      maxAskUserRounds: 3,
      executeTool: executeToolWrapper,
      loadSkills: loadRuntimeSkills,
      stdout: process.stdout,
      runtime,
    });
  } finally {
    bashSession.close();
  }
}

if (import.meta.main) {
  await main();
  process.exit(0);
}
