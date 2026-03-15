const EXA_API_URL = "https://api.exa.ai";

function getApiKey(): string {
  const key = process.env.EXA_API_KEY;
  if (!key) throw new Error("EXA_API_KEY environment variable is not set");
  return key;
}

export interface SearchArgs {
  query: string;
  type?: "auto" | "neural" | "fast" | "instant";
  category?: "company" | "research paper" | "news" | "tweet" | "personal site" | "financial report" | "people";
  numResults?: number;
  includeDomains?: string[];
  excludeDomains?: string[];
  startPublishedDate?: string;
  endPublishedDate?: string;
  startCrawlDate?: string;
  endCrawlDate?: string;
  includeText?: string[];
  excludeText?: string[];
  maxAgeHours?: number;
  moderation?: boolean;
  // contents options
  text?: boolean | { maxCharacters?: number };
  highlights?: boolean | { maxCharacters?: number; query?: string };
  summary?: boolean | { query?: string };
  livecrawl?: "never" | "fallback" | "preferred" | "always";
  subpages?: number;
  subpageTarget?: string;
}

export async function search(args: SearchArgs): Promise<string> {
  const body: Record<string, unknown> = { query: args.query };

  if (args.type) body.type = args.type;
  if (args.category) body.category = args.category;
  if (args.numResults) body.numResults = args.numResults;
  if (args.includeDomains?.length) body.includeDomains = args.includeDomains;
  if (args.excludeDomains?.length) body.excludeDomains = args.excludeDomains;
  if (args.startPublishedDate) body.startPublishedDate = args.startPublishedDate;
  if (args.endPublishedDate) body.endPublishedDate = args.endPublishedDate;
  if (args.startCrawlDate) body.startCrawlDate = args.startCrawlDate;
  if (args.endCrawlDate) body.endCrawlDate = args.endCrawlDate;
  if (args.includeText?.length) body.includeText = args.includeText;
  if (args.excludeText?.length) body.excludeText = args.excludeText;
  if (args.moderation) body.moderation = args.moderation;

  // build contents object
  const contents: Record<string, unknown> = {};
  if (args.text === true) {
    contents.text = true;
  } else if (args.text && typeof args.text === "object") {
    contents.text = args.text;
  }
  if (args.highlights === true) {
    contents.highlights = true;
  } else if (args.highlights && typeof args.highlights === "object") {
    contents.highlights = args.highlights;
  }
  if (args.summary === true) {
    contents.summary = {};
  } else if (args.summary && typeof args.summary === "object") {
    contents.summary = args.summary;
  }
  if (args.livecrawl) contents.livecrawl = args.livecrawl;
  if (args.maxAgeHours) contents.maxAgeHours = args.maxAgeHours;
  if (args.subpages) contents.subpages = args.subpages;
  if (args.subpageTarget) contents.subpageTarget = args.subpageTarget;

  if (Object.keys(contents).length > 0) body.contents = contents;

  const res = await fetch(`${EXA_API_URL}/search`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": getApiKey(),
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Exa API error ${res.status}: ${text}`);
  }

  const data = await res.json();
  return formatSearchResults(data.results ?? []);
}

interface ExaResult {
  title?: string;
  url?: string;
  text?: string;
  highlights?: string[];
  summary?: string;
  publishedDate?: string;
  author?: string;
}

function formatSearchResults(results: ExaResult[]): string {
  if (results.length === 0) return "No results found.";

  return results
    .map((r, i) => {
      const parts: string[] = [];
      parts.push(`## Result ${i + 1}: ${r.title ?? "Untitled"}`);
      if (r.url) parts.push(`URL: ${r.url}`);
      if (r.author) parts.push(`Author: ${r.author}`);
      if (r.publishedDate) parts.push(`Published: ${r.publishedDate}`);
      if (r.summary) parts.push(`\nSummary: ${r.summary}`);
      if (r.highlights?.length) {
        parts.push(`\n${r.highlights.join("\n\n")}`);
      }
      if (r.text) {
        parts.push(`\n${r.text}`);
      }
      return parts.join("\n");
    })
    .join("\n\n---\n\n");
}
