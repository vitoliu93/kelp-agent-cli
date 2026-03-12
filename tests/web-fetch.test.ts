import { describe, test, expect } from "bun:test";
import { $ } from "bun";

describe("url-read", () => {
  test("fetches example.com", async () => {
    const result = await $`bun skills/web-fetch/scripts/read.ts ${JSON.stringify({ url: "https://example.com" })}`.text();
    expect(result).toContain("Example Domain");
  });
});

describe("web-search", () => {
  test("returns URLs", async () => {
    const result = await $`bun skills/web-search/scripts/search.ts ${JSON.stringify({ query: "typescript bun runtime", maxResults: 3 })}`.text();
    expect(result).toMatch(/https?:\/\//);
  });
});
