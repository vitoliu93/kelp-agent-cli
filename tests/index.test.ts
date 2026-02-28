import { describe, test, expect } from "bun:test";
import { executeTool } from "../tools";

describe("index", () => {
  test("runs and produces output", async () => {
    const proc = Bun.spawn(["bun", "run", "index.ts", "say hello"], {
      stdout: "pipe",
      stderr: "pipe",
    });

    const stdout = await new Response(proc.stdout).text();
    const code = await proc.exited;

    expect(code).toBe(0);
    expect(stdout.trim().length).toBeGreaterThan(0);
  });

  test("tell_secret tool returns vito's secret", () => {
    expect(executeTool("tell_secret")).toBe("vito 是一个帅哥，他住在上海");
  });
});
