import { readFileSync, writeFileSync, existsSync } from "node:fs";

type TextEditorInput =
  | { command: "view"; path: string; view_range?: [number, number] }
  | { command: "str_replace"; path: string; old_str: string; new_str: string }
  | { command: "create"; path: string; file_text: string }
  | { command: "insert"; path: string; insert_line: number; new_str: string }
  | { command: "undo_edit"; path: string };

export function executeTextEditor(input: Record<string, unknown>): string {
  const op = input as unknown as TextEditorInput;

  switch (op.command) {
    case "view": {
      if (!existsSync(op.path)) return `Error: file not found: ${op.path}`;
      const lines = readFileSync(op.path, "utf8").split("\n");
      if (op.view_range) {
        const [start, end] = op.view_range;
        const slice = lines.slice(start - 1, end);
        return slice.map((l, i) => `${start + i}\t${l}`).join("\n");
      }
      return lines.map((l, i) => `${i + 1}\t${l}`).join("\n");
    }

    case "str_replace": {
      if (!existsSync(op.path)) return `Error: file not found: ${op.path}`;
      const content = readFileSync(op.path, "utf8");
      const count = content.split(op.old_str).length - 1;
      if (count === 0) return `Error: old_str not found in ${op.path}`;
      if (count > 1) return `Error: old_str matches ${count} locations in ${op.path} — make it more unique`;
      writeFileSync(op.path, content.replace(op.old_str, op.new_str), "utf8");
      return `Replaced in ${op.path}`;
    }

    case "create": {
      writeFileSync(op.path, op.file_text, "utf8");
      return `Created ${op.path}`;
    }

    case "insert": {
      if (!existsSync(op.path)) return `Error: file not found: ${op.path}`;
      const lines = readFileSync(op.path, "utf8").split("\n");
      lines.splice(op.insert_line, 0, op.new_str);
      writeFileSync(op.path, lines.join("\n"), "utf8");
      return `Inserted after line ${op.insert_line} in ${op.path}`;
    }

    case "undo_edit":
      return "undo_edit is not supported";

    default:
      return `Error: unknown command: ${(op as { command: string }).command}`;
  }
}
