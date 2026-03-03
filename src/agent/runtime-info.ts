export interface RuntimeInfo {
  cwd: string;
  shell: string;
  os: string;
  arch: string;
}

export function collectRuntimeInfo(): RuntimeInfo {
  return {
    cwd: process.cwd(),
    shell: process.env.SHELL ?? "/bin/sh",
    os: process.platform,
    arch: process.arch,
  };
}
