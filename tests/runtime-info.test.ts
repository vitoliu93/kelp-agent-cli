import { describe, expect, test } from "bun:test";

import { collectRuntimeInfo } from "../src/agent/runtime-info";

describe("runtime-info", () => {
  test("cwd matches process.cwd()", () => {
    const info = collectRuntimeInfo();
    expect(info.cwd).toBe(process.cwd());
  });

  test("tools contains bun", () => {
    const info = collectRuntimeInfo();
    expect(info.tools).toContain("bun");
  });
});
