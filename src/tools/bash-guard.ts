import os from "os";

const HOME = os.homedir();

type BlacklistEntry = {
  pattern: RegExp;
  name: string;
  advice: string;
};

const BLACKLIST: BlacklistEntry[] = [
  {
    pattern: /rm\s+-[rf]+\s+(\/|~\/?\s*|\$HOME)\s*($|\s)/,
    name: "recursive deletion of root/home",
    advice: "This would destroy the filesystem or home directory.",
  },
  {
    pattern: /\bmkfs\b/,
    name: "filesystem format",
    advice: "mkfs formats disks. Never run this.",
  },
  {
    pattern: /\bdd\s+if=/,
    name: "dd disk write",
    advice: "dd with if= can destroy disk contents.",
  },
  {
    pattern: /:\(\)\s*\{\s*:\s*\|\s*:&\s*\};/,
    name: "fork bomb",
    advice: "Fork bomb detected.",
  },
  {
    pattern: /chmod\s+-R\s+777/,
    name: "recursive chmod 777",
    advice: "chmod -R 777 removes all permission controls.",
  },
  {
    pattern: /chown\s+-R\b/,
    name: "recursive chown",
    advice: "chown -R can break system ownership.",
  },
  {
    pattern: />\s*\/dev\/sda/,
    name: "write to block device",
    advice: "Writing to /dev/sda destroys the disk.",
  },
  {
    pattern: /\b(shutdown|reboot|halt|poweroff)\b/,
    name: "system power command",
    advice: "System power commands are not allowed.",
  },
  {
    pattern: /(curl|wget)[^\n]*\|\s*(sh|bash)\b/,
    name: "pipe-to-shell",
    advice: "Download the script first and let the user review it.",
  },
];

const PROTECTED_PATHS = [
  "~/.ssh",
  "~/.config",
  "~/.zshrc",
  "~/.bashrc",
  "~/.profile",
  "~/.zprofile",
  "~/.local/bin",
  "~/.gnupg",
  "/etc/",
  "/usr/",
  "/System/",
];

// Write-indicating tokens; command is padded with spaces before matching
const WRITE_TOKENS = [
  " > ",
  " >> ",
  " tee ",
  " mv ",
  " cp ",
  " rm ",
  " chmod ",
  " chown ",
  " ln ",
  " mkdir ",
  " touch ",
  " install ",
  " sed -i",
];

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizeCommand(command: string): string {
  return command
    .replace(/\$HOME/g, "~")
    .replace(new RegExp(escapeRegex(HOME), "g"), "~");
}

function isBlacklistedCommand(command: string): string | null {
  for (const entry of BLACKLIST) {
    if (entry.pattern.test(command)) {
      return (
        `BLOCKED: This command matches a dangerous pattern (${entry.name}).\n` +
        `The command "${command}" was rejected.\n` +
        entry.advice
      );
    }
  }
  return null;
}

function writesToProtectedPath(command: string): string | null {
  const normalized = normalizeCommand(command);
  const padded = ` ${normalized} `;

  const hasWriteOp = WRITE_TOKENS.some((token) => padded.includes(token));
  if (!hasWriteOp) return null;

  const hitPath = PROTECTED_PATHS.find((p) => normalized.includes(p));
  if (!hitPath) return null;

  return (
    `BLOCKED: This command writes to a protected path (${hitPath}).\n` +
    `The command "${command}" was rejected because ${hitPath} is a protected system directory.\n` +
    `You may read from this path but not modify it. If the user needs this change, tell them to run it manually.`
  );
}

export function checkBashCommand(command: string): string | null {
  return isBlacklistedCommand(command) ?? writesToProtectedPath(command);
}
