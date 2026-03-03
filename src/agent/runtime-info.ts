const KNOWN_TOOLS = ["bun", "git", "node", "python3", "uv", "cargo", "go"] as const;

export interface RuntimeInfo {
  cwd: string;
  shell: string;
  os: string;
  arch: string;
  tools: string[];
}

export function collectRuntimeInfo(): RuntimeInfo {
  return {
    cwd: process.cwd(),
    shell: process.env.SHELL ?? "/bin/sh",
    os: process.platform,
    arch: process.arch,
    tools: KNOWN_TOOLS.filter((tool) => Bun.which(tool) !== null),
  };
}
