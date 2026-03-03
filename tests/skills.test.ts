import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, test } from "bun:test";

import { loadSkills, parseFrontmatter } from "../src/skills/load-skills";

const tempDirs: string[] = [];

function makeTempDir(): string {
  const dir = mkdtempSync(join(tmpdir(), "kelp-skills-"));
  tempDirs.push(dir);
  return dir;
}

function writeSkill(baseDir: string, name: string, description: string): string {
  const skillDir = join(baseDir, name);
  mkdirSync(skillDir, { recursive: true });
  writeFileSync(
    join(skillDir, "SKILL.md"),
    `---
name: ${name}
description: ${description}
---

# ${name}
`,
  );
  return skillDir;
}

describe("skills", () => {
  afterEach(() => {
    for (const dir of tempDirs.splice(0)) {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  test("parseFrontmatter extracts name and description", () => {
    const content = `---
name: hello-world
description: A demo skill that greets the user.
---

# Hello World Skill`;
    const meta = parseFrontmatter(content);
    expect(meta).toEqual({ name: "hello-world", description: "A demo skill that greets the user." });
  });

  test("loadSkills merges runtime and project directories", async () => {
    const runtimeSkillsDir = join(makeTempDir(), ".claude", "skills");
    const projectSkillsDir = join(makeTempDir(), "skills");

    const runtimeSkillDir = writeSkill(
      runtimeSkillsDir,
      "runtime-only",
      "A runtime skill.",
    );
    writeSkill(runtimeSkillsDir, "shared-skill", "A runtime version.");
    const projectSkillDir = writeSkill(
      projectSkillsDir,
      "shared-skill",
      "A project version.",
    );
    writeSkill(projectSkillsDir, "project-only", "A project skill.");

    const skills = await loadSkills([runtimeSkillsDir, projectSkillsDir]);

    expect(skills.map((skill) => skill.name).sort()).toEqual([
      "project-only",
      "runtime-only",
      "shared-skill",
    ]);
    expect(skills.find((skill) => skill.name === "runtime-only")!.path).toBe(
      runtimeSkillDir,
    );
    expect(skills.find((skill) => skill.name === "shared-skill")).toEqual({
      name: "shared-skill",
      description: "A project version.",
      path: projectSkillDir,
    });
  });

  test("loadSkills ignores missing directories", async () => {
    const projectSkillsDir = join(makeTempDir(), "skills");
    writeSkill(projectSkillsDir, "project-only", "A project skill.");

    const skills = await loadSkills([
      join(makeTempDir(), ".claude", "skills"),
      projectSkillsDir,
    ]);

    expect(skills).toEqual([
      {
        name: "project-only",
        description: "A project skill.",
        path: join(projectSkillsDir, "project-only"),
      },
    ]);
  });
});
