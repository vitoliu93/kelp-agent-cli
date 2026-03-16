import { describe, test, expect, afterEach } from "bun:test";
import { BashSession } from "../src/tools/bash-session";

describe("BashSession", () => {
  const session = new BashSession();

  afterEach(() => session.restart());

  test("heredoc writes file correctly", async () => {
    const tmpFile = `/tmp/kelp-test-heredoc-${Date.now()}.txt`;
    const result = await session.run(
      `cat > ${tmpFile} << 'EOF'\nhello heredoc\nEOF\ncat ${tmpFile}`
    );
    expect(result).toContain("hello heredoc");
  });

  test("timeout triggers on hanging command", async () => {
    const fast = new BashSession(500);
    const result = await fast.run("sleep 999");
    fast.close();
    expect(result).toBe("[timeout] Command exceeded 120 seconds");
  }, 5_000);
});
