export interface ResolvePromptOptions {
  argv: string[];
  isTTY: boolean | undefined;
  readStdin: () => Promise<string>;
}

export async function resolvePrompt(options: ResolvePromptOptions): Promise<string | null> {
  const argPrompt = options.argv.slice(2).join(" ").trim();

  if (options.isTTY) return argPrompt || null;

  const stdinContent = (await options.readStdin()).trim();

  if (argPrompt && stdinContent) {
    return `<stdin>\n${stdinContent}\n</stdin>\n\n${argPrompt}`;
  }

  return argPrompt || stdinContent || null;
}
