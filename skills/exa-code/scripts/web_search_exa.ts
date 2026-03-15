import { parseArgs } from "node:util";
import { search } from "./_client.ts";

const { values } = parseArgs({
  args: Bun.argv.slice(2),
  options: {
    query: { type: "string" },
    type: { type: "string" },
    category: { type: "string" },
    numResults: { type: "string" },
    includeDomains: { type: "string" },
    excludeDomains: { type: "string" },
    startPublishedDate: { type: "string" },
    endPublishedDate: { type: "string" },
    includeText: { type: "string" },
    excludeText: { type: "string" },
    maxAgeHours: { type: "string" },
    highlightsMaxChars: { type: "string" },
    highlightsQuery: { type: "string" },
    summary: { type: "boolean" },
    summaryQuery: { type: "string" },
    livecrawl: { type: "string" },
    moderation: { type: "boolean" },
  },
});

if (!values.query) {
  console.error("--query is required");
  process.exit(1);
}

const highlights: Record<string, unknown> = {
  maxCharacters: values.highlightsMaxChars ? Number(values.highlightsMaxChars) : 10000,
};
if (values.highlightsQuery) highlights.query = values.highlightsQuery;

const result = await search({
  query: values.query,
  type: (values.type as any) ?? "auto",
  category: values.category as any,
  numResults: values.numResults ? Number(values.numResults) : 8,
  includeDomains: values.includeDomains?.split(","),
  excludeDomains: values.excludeDomains?.split(","),
  startPublishedDate: values.startPublishedDate,
  endPublishedDate: values.endPublishedDate,
  includeText: values.includeText ? [values.includeText] : undefined,
  excludeText: values.excludeText ? [values.excludeText] : undefined,
  maxAgeHours: values.maxAgeHours ? Number(values.maxAgeHours) : undefined,
  highlights,
  summary: values.summaryQuery ? { query: values.summaryQuery } : values.summary ? true : undefined,
  livecrawl: (values.livecrawl as any) ?? "fallback",
  moderation: values.moderation,
});
console.log(result);
