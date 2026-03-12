import { describe, expect, test } from "bun:test";

import { collectRuntimeInfo } from "../src/agent/runtime-info";

describe("runtime-info", () => {
  test("cwd matches process.cwd()", () => {
    const info = collectRuntimeInfo();
    expect(info.cwd).toBe(process.cwd());
  });

  test("date is formatted as local YYYY-MM-DD", () => {
    const info = collectRuntimeInfo(new Date("2026-03-12T01:02:03"));
    expect(info.date).toBe("2026-03-12");
  });
});
