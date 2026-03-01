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
  const fm = parts[1];
  const name = fm.match(/^name:\s*(.+)$/m)?.[1]?.trim();
  const description = fm.match(/^description:\s*(.+)$/m)?.[1]?.trim();
  if (!name || !description) return null;
  return { name, description };
}

export async function loadSkills(): Promise<SkillMeta[]> {
  const skillsDir = join(import.meta.dir, "skills");
  let dirs: string[];
  try {
    dirs = readdirSync(skillsDir);
  } catch {
    return [];
  }

  const skills: SkillMeta[] = [];
  for (const dir of dirs) {
    const skillPath = join(skillsDir, dir, "SKILL.md");
    const file = Bun.file(skillPath);
    if (!(await file.exists())) continue;
    const content = await file.text();
    const meta = parseFrontmatter(content);
    if (!meta) continue;
    skills.push({ ...meta, path: join(skillsDir, dir) });
  }
  return skills;
}
