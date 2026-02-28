import { describe, test, expect } from "bun:test";

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
});
