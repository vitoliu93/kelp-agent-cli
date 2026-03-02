import { callTool } from "./_client.ts";

const argsJson = Bun.argv[2] ?? "{}";
const result = await callTool("get_code_context_exa", JSON.parse(argsJson));
console.log(result);
