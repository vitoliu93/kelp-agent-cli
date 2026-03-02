import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { join } from "node:path";
import { mkdir } from "node:fs/promises";

const args = Bun.argv.slice(2);

if (args.length < 3) {
  console.error("Usage:");
  console.error("  bun gen-mcp-skill.ts <name> --stdio <command> [args...]");
  console.error("  bun gen-mcp-skill.ts <name> --http <url>");
  process.exit(1);
}

const skillName = args[0];
const flagIdx = args.findIndex((a) => a === "--stdio" || a === "--http");

if (flagIdx === -1) {
  console.error("Error: must specify --stdio or --http");
  process.exit(1);
}

const transportFlag = args[flagIdx];
const transportArgs = args.slice(flagIdx + 1);

let transport: StdioClientTransport | StreamableHTTPClientTransport;
let mcpConfig: Record<string, unknown>;

if (transportFlag === "--stdio") {
  const [command, ...cmdArgs] = transportArgs;
  transport = new StdioClientTransport({ command, args: cmdArgs });
  mcpConfig = { transport: "stdio", command, args: cmdArgs };
} else {
  const url = transportArgs[0];
  transport = new StreamableHTTPClientTransport(new URL(url));
  mcpConfig = { transport: "http", url };
}

const client = new Client({ name: "gen-mcp-skill", version: "1.0.0" });
await client.connect(transport);

const { tools } = await client.listTools();
await client.close();

const skillDir = join(import.meta.dir, "skills", skillName);
const scriptsDir = join(skillDir, "scripts");
await mkdir(scriptsDir, { recursive: true });

await Bun.write(join(skillDir, "mcp.json"), JSON.stringify(mcpConfig, null, 2) + "\n");

const toolLines = tools
  .map((t) => {
    const desc = t.description ?? "(no description)";
    const schema = JSON.stringify(t.inputSchema, null, 2)
      .split("\n")
      .map((l) => "    " + l)
      .join("\n");
    return `- **${t.name}**: ${desc}\n  Run: \`bun skills/${skillName}/scripts/${t.name}.ts '<json args>'\`\n  Input schema:\n${schema}`;
  })
  .join("\n\n");

const toolNames = tools.map((t) => t.name).join(", ");
const skillMd = `---
name: ${skillName}
description: MCP skill providing ${tools.length} tool(s): ${toolNames}
---

# ${skillName}

Tools available via MCP (${mcpConfig.transport} transport).

## Tools

${toolLines}
`;

await Bun.write(join(skillDir, "SKILL.md"), skillMd);

const clientTs = `import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { join } from "node:path";

export async function callTool(toolName: string, toolArgs: Record<string, unknown>): Promise<string> {
  const config = JSON.parse(await Bun.file(join(import.meta.dir, "..", "mcp.json")).text());

  let transport: StdioClientTransport | StreamableHTTPClientTransport;
  if (config.transport === "stdio") {
    transport = new StdioClientTransport({ command: config.command, args: config.args ?? [] });
  } else {
    transport = new StreamableHTTPClientTransport(new URL(config.url));
  }

  const client = new Client({ name: "mcp-skill-client", version: "1.0.0" });
  try {
    await client.connect(transport);
    const result = await client.callTool({ name: toolName, arguments: toolArgs });
    const content = result.content as Array<{ type: string; text?: string }>;
    return content
      .filter((c) => c.type === "text")
      .map((c) => c.text ?? "")
      .join("\\n");
  } finally {
    await client.close();
  }
}
`;

await Bun.write(join(scriptsDir, "_client.ts"), clientTs);

for (const tool of tools) {
  const toolTs = `import { callTool } from "./_client.ts";

const argsJson = Bun.argv[2] ?? "{}";
const result = await callTool("${tool.name}", JSON.parse(argsJson));
console.log(result);
`;
  await Bun.write(join(scriptsDir, `${tool.name}.ts`), toolTs);
}

console.log(`Generated skill '${skillName}' with ${tools.length} tool(s): ${toolNames}`);
process.exit(0);
