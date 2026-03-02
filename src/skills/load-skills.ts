import { readdirSync } from "node:fs";
import { join } from "node:path";

export interface SkillMeta {
  name: string;
  description: string;
  path: string;
}

export function parseFrontmatter(content: string): { name: string; description: string } | null {
  const parts = content.split("---");
  if (parts.length < 3) return null;

  const frontmatter = parts[1];
  const name = frontmatter.match(/^name:\s*(.+)$/m)?.[1]?.trim();
  const description = frontmatter.match(/^description:\s*(.+)$/m)?.[1]?.trim();
  if (!name || !description) return null;

  return { name, description };
}

export async function loadSkills(skillsDir: string): Promise<SkillMeta[]> {
  let entries: string[];
  try {
    entries = readdirSync(skillsDir);
  } catch {
    return [];
  }

  const skills: SkillMeta[] = [];
  for (const entry of entries) {
    const skillPath = join(skillsDir, entry, "SKILL.md");
    const file = Bun.file(skillPath);
    if (!(await file.exists())) continue;

    const meta = parseFrontmatter(await file.text());
    if (!meta) continue;

    skills.push({ ...meta, path: join(skillsDir, entry) });
  }

  return skills;
}
