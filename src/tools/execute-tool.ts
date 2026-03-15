import type { RunAgentDeps } from "../agent/run-agent";
import type { SkillMeta } from "../skills/load-skills";
import { runSubagent } from "../agent/subagent";
import { BashSession } from "./bash-session";

export async function executeTool(
  name: string,
  input: Record<string, unknown> = {},
  bashSession: BashSession,
  deps?: Omit<RunAgentDeps, "askUser" | "askUserTool" | "stdout">,
  skills?: SkillMeta[],
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
    default: {
      const matchedSkill = skills?.find((s) => s.name === name);
      if (matchedSkill) {
        return `"${name}" is a SKILL, not a tool. You cannot call it as tool_use. Instead:\n1. Read the skill: bash tool with command "cat ${matchedSkill.path}/SKILL.md"\n2. Run the script described in SKILL.md using the bash tool.`;
      }
      return `Tool "${name}" does not exist.`;
    }
  }
}
