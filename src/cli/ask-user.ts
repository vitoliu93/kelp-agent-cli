import * as readline from "readline";

export interface AskUserToolInput {
  kind: "clarify" | "confirm";
  question: string;
}

type InputPrompt = (message: string) => Promise<string>;
type ConfirmPrompt = (message: string) => Promise<boolean>;

export interface CreateAskUserDeps {
  promptInput?: InputPrompt;
  promptConfirm?: ConfirmPrompt;
}

function defaultInput(message: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(message + " ", (answer) => { rl.close(); resolve(answer); });
  });
}

function defaultConfirm(message: string): Promise<boolean> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(`${message} (y/N) `, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === "y");
    });
  });
}

export function createAskUser(deps: CreateAskUserDeps = {}) {
  const promptInput = deps.promptInput ?? defaultInput;
  const promptConfirm = deps.promptConfirm ?? defaultConfirm;

  return async function askUser(inputRequest: AskUserToolInput): Promise<string> {
    if (inputRequest.kind === "confirm") {
      const accepted = await promptConfirm(inputRequest.question);
      return JSON.stringify({
        kind: "confirm",
        answer: accepted ? "yes" : "no",
      });
    }

    const answer = await promptInput(inputRequest.question);
    return JSON.stringify({
      kind: "clarify",
      answer: answer.trim(),
    });
  };
}
