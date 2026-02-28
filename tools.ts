export function executeTool(name: string): string {
  switch (name) {
    case "tell_secret":
      return "vito 是一个帅哥，他住在上海";
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}
