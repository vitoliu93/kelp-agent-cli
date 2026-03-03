import { confirm, input } from "@inquirer/prompts";

export interface AskUserToolInput {
  kind: "clarify" | "confirm";
  question: string;
}

type InputPrompt = (config: { message: string }) => Promise<string>;
type ConfirmPrompt = (config: { message: string; default?: boolean }) => Promise<boolean>;

export interface CreateAskUserDeps {
  promptInput?: InputPrompt;
  promptConfirm?: ConfirmPrompt;
}

export function createAskUser(deps: CreateAskUserDeps = {}) {
  const promptInput = deps.promptInput ?? input;
  const promptConfirm = deps.promptConfirm ?? confirm;

  return async function askUser(inputRequest: AskUserToolInput): Promise<string> {
    if (inputRequest.kind === "confirm") {
      const accepted = await promptConfirm({
        message: inputRequest.question,
        default: false,
      });
      return JSON.stringify({
        kind: "confirm",
        answer: accepted ? "yes" : "no",
      });
    }

    const answer = await promptInput({ message: inputRequest.question });
    return JSON.stringify({
      kind: "clarify",
      answer: answer.trim(),
    });
  };
}
