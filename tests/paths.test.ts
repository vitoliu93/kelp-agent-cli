import { describe, expect, test } from "bun:test";

import {
  assertProjectRootReadable,
  getSkillDirectories,
  resolveProjectRoot,
} from "../src/paths";

describe("paths", () => {
  test("project root defaults to cwd", () => {
    const root = resolveProjectRoot("/tmp/kelp-cwd", {});
    expect(root).toBe("/tmp/kelp-cwd");
  });

  test("project root can be overridden by env", () => {
    const root = resolveProjectRoot("/tmp/kelp-cwd", {
      KELP_PROJECT_DIR: "/tmp/kelp-project",
    });
    expect(root).toBe("/tmp/kelp-project");
  });

  test("skill directories include runtime and project locations", () => {
    const skillDirs = getSkillDirectories({
      cwd: "/tmp/runtime",
      env: { KELP_PROJECT_DIR: "/tmp/project" },
    });

    expect(skillDirs).toEqual([
      "/tmp/runtime/.claude/skills",
      "/tmp/project/skills",
    ]);
  });

  test("explicit project directory must exist", () => {
    expect(() =>
      assertProjectRootReadable("/tmp/kelp-missing-project", {
        KELP_PROJECT_DIR: "/tmp/kelp-missing-project",
      }),
    ).toThrow();
  });
});
