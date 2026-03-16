import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { writeFileSync, unlinkSync, existsSync } from "node:fs";
import { executeTextEditor } from "../src/tools/text-editor";

const TMP = "/tmp/kelp-text-editor-test.txt";

beforeEach(() => {
  writeFileSync(TMP, "line one\nline two\nline three\n", "utf8");
});

afterEach(() => {
  if (existsSync(TMP)) unlinkSync(TMP);
});

describe("text-editor", () => {
  test("view returns numbered lines", () => {
    const result = executeTextEditor({ command: "view", path: TMP });
    expect(result).toContain("1\tline one");
    expect(result).toContain("3\tline three");
  });

  test("view with range returns slice", () => {
    const result = executeTextEditor({ command: "view", path: TMP, view_range: [2, 2] });
    expect(result).toContain("2\tline two");
    expect(result).not.toContain("line one");
  });

  test("str_replace replaces unique match", () => {
    const result = executeTextEditor({ command: "str_replace", path: TMP, old_str: "line two", new_str: "LINE TWO" });
    expect(result).toContain("Replaced");
    const after = executeTextEditor({ command: "view", path: TMP });
    expect(after).toContain("LINE TWO");
    expect(after).not.toContain("line two");
  });

  test("str_replace fails when old_str not found", () => {
    const result = executeTextEditor({ command: "str_replace", path: TMP, old_str: "no match", new_str: "x" });
    expect(result).toContain("not found");
  });

  test("str_replace fails when old_str matches multiple times", () => {
    writeFileSync(TMP, "dup\ndup\n", "utf8");
    const result = executeTextEditor({ command: "str_replace", path: TMP, old_str: "dup", new_str: "x" });
    expect(result).toContain("matches");
  });

  test("create writes new file", () => {
    const path = "/tmp/kelp-new-file.txt";
    try {
      const result = executeTextEditor({ command: "create", path, file_text: "hello world" });
      expect(result).toContain("Created");
      const view = executeTextEditor({ command: "view", path });
      expect(view).toContain("hello world");
    } finally {
      if (existsSync(path)) unlinkSync(path);
    }
  });

  test("insert adds line at correct position", () => {
    const result = executeTextEditor({ command: "insert", path: TMP, insert_line: 1, new_str: "inserted" });
    expect(result).toContain("Inserted");
    const after = executeTextEditor({ command: "view", path: TMP });
    expect(after).toContain("inserted");
  });
});
