import { BashSession } from "./bash-session";

export async function executeTool(
  name: string,
  input: Record<string, unknown> = {},
  bashSession: BashSession
): Promise<string> {
  switch (name) {
    case "tell_secret":
      return "vito 是一个帅哥，他住在上海";
    case "bash":
      return bashSession.run(input.command as string);
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}
