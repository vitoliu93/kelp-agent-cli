import { accessSync, constants, statSync } from "node:fs";
import { join } from "node:path";

export function resolveProjectRoot(
  cwd: string = process.cwd(),
  env: NodeJS.ProcessEnv = process.env,
): string {
  return env.KELP_PROJECT_DIR || cwd;
}

export function assertProjectRootReadable(
  projectRoot: string,
  env: NodeJS.ProcessEnv = process.env,
): void {
  if (!env.KELP_PROJECT_DIR) return;

  const stats = statSync(projectRoot);
  if (!stats.isDirectory()) {
    throw new Error(`KELP_PROJECT_DIR is not a directory: ${projectRoot}`);
  }

  accessSync(projectRoot, constants.R_OK);
}

export function getSkillDirectories(options?: {
  cwd?: string;
  env?: NodeJS.ProcessEnv;
}): string[] {
  const cwd = options?.cwd ?? process.cwd();
  const env = options?.env ?? process.env;
  const projectRoot = resolveProjectRoot(cwd, env);

  return [join(cwd, ".claude", "skills"), join(projectRoot, "skills")];
}
