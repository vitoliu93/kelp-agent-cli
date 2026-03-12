export interface RuntimeInfo {
  cwd: string;
  shell: string;
  os: string;
  arch: string;
  date: string;
}

function formatCurrentDate(now: Date): string {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function collectRuntimeInfo(now: Date = new Date()): RuntimeInfo {
  return {
    cwd: process.cwd(),
    shell: process.env.SHELL ?? "/bin/sh",
    os: process.platform,
    arch: process.arch,
    date: formatCurrentDate(now),
  };
}
