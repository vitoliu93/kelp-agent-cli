import { accessSync, constants, statSync } from "node:fs";
import { basename, dirname, join, normalize } from "node:path";

const BUN_FS_PREFIX = "/$bunfs/";

export interface AppRootOptions {
  cwd?: string;
  env?: NodeJS.ProcessEnv;
  execPath?: string;
  main?: string;
  moduleDir?: string;
}

function isDirectory(path: string): boolean {
  try {
    return statSync(path).isDirectory();
  } catch {
    return false;
  }
}

function resolveCompiledAppRoot(execPath: string): string {
  const execDir = dirname(execPath);
  const parentDir = dirname(execDir);

  for (const candidate of [execDir, parentDir]) {
    if (isDirectory(join(candidate, "skills"))) return candidate;
  }

  return basename(execDir) === "dist" ? parentDir : execDir;
}

export function resolveAppRoot(options?: AppRootOptions): string {
  const env = options?.env ?? process.env;
  if (env.KELP_PROJECT_DIR) return env.KELP_PROJECT_DIR;

  const main = options?.main ?? Bun.main;
  if (main.startsWith(BUN_FS_PREFIX)) {
    return resolveCompiledAppRoot(options?.execPath ?? process.execPath);
  }

  return normalize(join(options?.moduleDir ?? import.meta.dir, ".."));
}

export function assertAppRootReadable(appRoot: string): void {
  const stats = statSync(appRoot);
  if (!stats.isDirectory()) {
    throw new Error(`App root is not a directory: ${appRoot}`);
  }

  accessSync(appRoot, constants.R_OK);
}

export function getSkillDirectories(options?: {
  cwd?: string;
  appRoot?: string;
  env?: NodeJS.ProcessEnv;
  execPath?: string;
  main?: string;
  moduleDir?: string;
}): string[] {
  const cwd = options?.cwd ?? process.cwd();
  const appRoot = options?.appRoot ?? resolveAppRoot(options);

  return [join(cwd, ".claude", "skills"), join(appRoot, "skills")];
}

export const resolveProjectRoot = resolveAppRoot;
export const assertProjectRootReadable = assertAppRootReadable;
