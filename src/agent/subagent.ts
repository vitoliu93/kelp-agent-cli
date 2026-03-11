import type { RunAgentDeps } from "./run-agent";
import { runAgent } from "./run-agent";

const MAX_SUBAGENT_TURNS = 20;
const SUBAGENT_TIMEOUT_MS = 120_000;
const MAX_DEPTH = 3;

class StringWriter {
  private buffer = "";
  write(chunk: string): boolean {
    this.buffer += chunk;
    return true;
  }
  getOutput(): string {
    return this.buffer.trim();
  }
}

export async function runSubagent(task: string, deps: RunAgentDeps): Promise<string> {
  const currentDepth = deps.depth ?? 0;
  if (currentDepth >= MAX_DEPTH) {
    throw new Error(`Subagent depth limit (${MAX_DEPTH}) exceeded`);
  }

  const output = new StringWriter();

  const agentPromise = runAgent(task, {
    ...deps,
    stdout: output,
    askUser: undefined,
    askUserTool: undefined,
    maxTurns: MAX_SUBAGENT_TURNS,
    depth: currentDepth + 1,
  });

  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error(`Subagent timed out after ${SUBAGENT_TIMEOUT_MS}ms`)), SUBAGENT_TIMEOUT_MS)
  );

  await Promise.race([agentPromise, timeoutPromise]);

  return output.getOutput() || "Subagent completed task successfully";
}
