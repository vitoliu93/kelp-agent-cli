export interface ResolvePromptOptions {
  argv: string[];
  isTTY: boolean | undefined;
  readStdin: () => Promise<string>;
}

export async function resolvePrompt(options: ResolvePromptOptions): Promise<string | null> {
  const argPrompt = options.argv.slice(2).join(" ").trim();
  if (argPrompt) return argPrompt;

  if (options.isTTY) return null;

  const stdinPrompt = (await options.readStdin()).trim();
  return stdinPrompt || null;
}
