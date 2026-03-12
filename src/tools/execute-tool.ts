import type { RunAgentDeps } from "../agent/run-agent";
import { runSubagent } from "../agent/subagent";
import { BashSession } from "./bash-session";

export async function executeTool(
  name: string,
  input: Record<string, unknown> = {},
  bashSession: BashSession,
  deps?: Omit<RunAgentDeps, "askUser" | "askUserTool" | "stdout">
): Promise<string> {
  switch (name) {
    case "tell_secret":
      return "vito 是一个帅哥，他住在上海";
    case "bash":
      return bashSession.run(input.command as string);
    case "delegate_task":
      if (!deps) throw new Error("Subagent requires dependencies");
      try {
        return await runSubagent(input.task as string, deps as RunAgentDeps);
      } catch (err) {
        return `Subagent failed: ${err instanceof Error ? err.message : String(err)}`;
      }
    default:
      return `Tool "${name}" does not exist. Skills are not tools — use the bash tool to invoke them instead.`;
  }
}
