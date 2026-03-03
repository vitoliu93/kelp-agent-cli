import type { SkillMeta } from "../skills/load-skills";
import type { RuntimeInfo } from "./runtime-info";

function xml(tag: string, content: string): string {
  return `<${tag}>\n${content}\n</${tag}>`;
}

const IDENTITY = `You are kelp, a command-line assistant running on the user's local machine.

You have bash access. Prefer using it over guessing -- if a question can be answered by running a command, run it.`;

const RULES = `- Answer directly. No preamble, no filler, no pleasantries.
- One bash call per intent. Pipe and chain within a single call when possible.
- Never run destructive commands (rm -rf, mkfs, dd, >overwrite) without the user stating the exact target first.
- Never install packages or start persistent services unless explicitly asked.
- Output plain text. Use markdown only for code blocks.
- When done, stop. No recap, no sign-off.`;

function getModeRules(enableAskUser: boolean): string {
  if (!enableAskUser) {
    return "- If a task is ambiguous, state your assumption in one line and proceed.";
  }

  return `- Prefer completing the task in one pass when you already have enough information.
- If required information is missing, the task is materially ambiguous, or you need explicit approval to continue, use the ask_user tool.
- When ask_user is available, never ask the user a question in plain text. Every user-directed question must go through ask_user.
- If the user says to wait for confirmation before continuing, collect that confirmation with ask_user before taking the gated action.
- Ask one question at a time.
- Never mix ask_user with other tool calls in the same response.
- If the task is still reasonable to continue, state your assumption in one line and proceed.
- After receiving the user's answer, continue the task.`;
}

function formatEnvironment(runtime: RuntimeInfo): string {
  const lines = [
    `cwd: ${runtime.cwd}`,
    `shell: ${runtime.shell}`,
    `platform: ${runtime.os} (${runtime.arch})`,
    `tools: ${runtime.tools.join(", ") || "none"}`,
  ];
  return lines.join("\n");
}

export function buildSystemPrompt(
  skills: SkillMeta[],
  options: { enableAskUser: boolean; runtime: RuntimeInfo }
): string {
  const sections: string[] = [
    xml("identity", IDENTITY),
    xml("rules", RULES),
    xml("mode_rules", getModeRules(options.enableAskUser)),
    xml("environment", formatEnvironment(options.runtime)),
  ];

  if (skills.length > 0) {
    const skillLines = skills
      .map((skill) => `- ${skill.name} (${skill.path}): ${skill.description}`)
      .join("\n");
    const skillsContent = `IMPORTANT: Before acting on any user request, check the skills below. If the request matches a skill's description, you MUST read that skill's SKILL.md first and follow its instructions. Do not improvise when a skill exists for the task.\n\n${skillLines}`;
    sections.push(xml("skills", skillsContent));
  }

  return sections.join("\n\n");
}
