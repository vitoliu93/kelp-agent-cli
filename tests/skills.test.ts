import { describe, test, expect } from "bun:test";
import { parseFrontmatter, loadSkills } from "../skills";

describe("skills", () => {
  test("parseFrontmatter extracts name and description", () => {
    const content = `---
name: hello-world
description: A demo skill that greets the user.
---

# Hello World Skill`;
    const meta = parseFrontmatter(content);
    expect(meta).toEqual({ name: "hello-world", description: "A demo skill that greets the user." });
  });

  test("loadSkills returns hello-world skill", async () => {
    const skills = await loadSkills();
    expect(skills.length).toBeGreaterThan(0);
    const hw = skills.find((s) => s.name === "hello-world");
    expect(hw).toBeDefined();
    expect(hw!.description).toContain("demo");
    expect(hw!.path).toContain("hello-world");
  });
});
