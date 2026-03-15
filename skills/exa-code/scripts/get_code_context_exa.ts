import { parseArgs } from "node:util";
import { search } from "./_client.ts";

const { values } = parseArgs({
  args: Bun.argv.slice(2),
  options: {
    query: { type: "string" },
    numResults: { type: "string" },
    maxChars: { type: "string" },
    includeDomains: { type: "string" },
    excludeDomains: { type: "string" },
    includeText: { type: "string" },
    summary: { type: "boolean" },
  },
});

if (!values.query) {
  console.error("--query is required");
  process.exit(1);
}

const result = await search({
  query: values.query,
  type: "auto",
  numResults: values.numResults ? Number(values.numResults) : 5,
  includeDomains: values.includeDomains?.split(",") ?? ["github.com", "stackoverflow.com"],
  excludeDomains: values.excludeDomains?.split(","),
  includeText: values.includeText ? [values.includeText] : undefined,
  text: { maxCharacters: values.maxChars ? Number(values.maxChars) : 20000 },
  summary: values.summary,
});
console.log(result);
