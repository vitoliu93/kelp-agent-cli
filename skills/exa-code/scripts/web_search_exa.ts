import { callTool } from "./_client.ts";

const argsJson = Bun.argv[2] ?? "{}";
const result = await callTool("web_search_exa", JSON.parse(argsJson));
console.log(result);
