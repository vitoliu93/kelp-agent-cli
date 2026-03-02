import { describe, test, expect, afterEach } from "bun:test";
import { join } from "node:path";
import { rm } from "node:fs/promises";

const ROOT = join(import.meta.dir, "..");
const SCRIPT = join(ROOT, "skills", "create-skill", "scripts", "gen-mcp-skill.ts");
const SERVER = join(import.meta.dir, "fixtures", "simple-mcp-server.ts");
const SKILL_NAME = "test-mcp-skill";
const SKILL_DIR = join(ROOT, "skills", SKILL_NAME);

describe("gen-mcp-skill", () => {
  afterEach(async () => {
    await rm(SKILL_DIR, { recursive: true, force: true });
  });

  test("generates two-layer skill structure from stdio MCP server", async () => {
    const proc = Bun.spawn(
      ["bun", SCRIPT, SKILL_NAME, "--stdio", "bun", SERVER],
      { cwd: ROOT, stderr: "pipe" }
    );
    const exitCode = await proc.exited;
    expect(exitCode).toBe(0);

    // Light SKILL.md -- placeholder description, tool names only
    const skillMd = await Bun.file(join(SKILL_DIR, "SKILL.md")).text();
    expect(skillMd).toContain(`name: ${SKILL_NAME}`);
    expect(skillMd).toContain("placeholder");
    expect(skillMd).toContain("echo");
    expect(skillMd).toContain("references/tools.md");

    // Heavy references/tools.md -- full schemas
    const toolsMd = await Bun.file(join(SKILL_DIR, "references", "tools.md")).text();
    expect(toolsMd).toContain("echo");
    expect(toolsMd).toContain("properties");

    // mcp.json transport config
    const mcpJson = JSON.parse(await Bun.file(join(SKILL_DIR, "mcp.json")).text());
    expect(mcpJson.transport).toBe("stdio");
    expect(mcpJson.command).toBe("bun");

    // scripts/_client.ts
    const clientTs = await Bun.file(join(SKILL_DIR, "scripts", "_client.ts")).text();
    expect(clientTs).toContain("callTool");

    // scripts/echo.ts
    const echoTs = await Bun.file(join(SKILL_DIR, "scripts", "echo.ts")).text();
    expect(echoTs).toContain(`callTool("echo"`);
  });

  test("generated echo script returns correct output", async () => {
    const genProc = Bun.spawn(
      ["bun", SCRIPT, SKILL_NAME, "--stdio", "bun", SERVER],
      { cwd: ROOT, stderr: "pipe" }
    );
    await genProc.exited;

    const runProc = Bun.spawn(
      ["bun", join(SKILL_DIR, "scripts", "echo.ts"), JSON.stringify({ text: "hello from test" })],
      { cwd: ROOT, stderr: "pipe" }
    );
    const output = await new Response(runProc.stdout).text();
    const exitCode = await runProc.exited;
    expect(exitCode).toBe(0);
    expect(output.trim()).toBe("hello from test");
  });
});
