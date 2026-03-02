import { Client } from "@modelcontextprotocol/sdk/client/index.js";
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
      .join("\n");
  } finally {
    await client.close();
  }
}
