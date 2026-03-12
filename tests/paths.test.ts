import { mkdtempSync, mkdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, test } from "bun:test";

import {
  assertAppRootReadable,
  getSkillDirectories,
  resolveAppRoot,
} from "../src/paths";

const tempDirs: string[] = [];

function makeTempDir(): string {
  const dir = mkdtempSync(join(tmpdir(), "kelp-paths-"));
  tempDirs.push(dir);
  return dir;
}

describe("paths", () => {
  afterEach(() => {
    for (const dir of tempDirs.splice(0)) {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  test("app root can be overridden by env", () => {
    const root = resolveAppRoot({
      env: { KELP_PROJECT_DIR: "/tmp/kelp-app" },
      moduleDir: "/tmp/source/src",
    });

    expect(root).toBe("/tmp/kelp-app");
  });

  test("app root defaults to source directory parent when not compiled", () => {
    const root = resolveAppRoot({
      env: {},
      main: "/tmp/source/src/index.ts",
      moduleDir: "/tmp/source/src",
    });

    expect(root).toBe("/tmp/source");
  });

  test("compiled app root resolves to package root next to dist binary", () => {
    const appRoot = makeTempDir();
    mkdirSync(join(appRoot, "skills"), { recursive: true });
    mkdirSync(join(appRoot, "dist"), { recursive: true });

    const root = resolveAppRoot({
      env: {},
      execPath: join(appRoot, "dist", "kelp"),
      main: "/$bunfs/root/kelp",
      moduleDir: "/ignored",
    });

    expect(root).toBe(appRoot);
  });

  test("skill directories include workspace and app locations", () => {
    const skillDirs = getSkillDirectories({
      cwd: "/tmp/runtime",
      appRoot: "/tmp/app",
    });

    expect(skillDirs).toEqual([
      "/tmp/runtime/.claude/skills",
      "/tmp/app/skills",
    ]);
  });

  test("app root must exist", () => {
    expect(() => assertAppRootReadable("/tmp/kelp-missing-app-root")).toThrow();
  });
});
