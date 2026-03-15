---
name: exa-code
description: Search the web and find code examples, documentation, and programming solutions across GitHub, Stack Overflow, and official docs. Use when the user asks to search for information, find code examples, debug issues, or look up API documentation.
---

# Exa Code Search

Two search tools backed by the Exa API. Both hit `POST /search` with different default presets.

## Tools

### web_search_exa

General web search. Returns highlights by default.

```
bun skills/exa-code/scripts/web_search_exa.ts --query "your query" [options]
```

| Flag | Default | Description |
|------|---------|-------------|
| `--query` | (required) | Search query |
| `--type` | `auto` | `auto`, `neural`, `fast`, `instant` |
| `--category` | - | `company`, `research paper`, `news`, `tweet`, `personal site`, `financial report`, `people` |
| `--numResults` | `8` | Number of results (max 100) |
| `--includeDomains` | - | Comma-separated domains to restrict to |
| `--excludeDomains` | - | Comma-separated domains to exclude |
| `--startPublishedDate` | - | ISO 8601 date, e.g. `2025-01-01T00:00:00.000Z` |
| `--endPublishedDate` | - | ISO 8601 date |
| `--includeText` | - | String that must appear in results (up to 5 words) |
| `--excludeText` | - | String that must NOT appear in results |
| `--maxAgeHours` | - | Only return content crawled within this many hours |
| `--highlightsMaxChars` | `10000` | Max characters for highlights |
| `--highlightsQuery` | - | Custom query to direct highlight selection |
| `--summary` | - | Boolean flag, include LLM summary per result |
| `--summaryQuery` | - | Custom query for the summary |
| `--livecrawl` | `fallback` | `never`, `fallback`, `preferred`, `always` |
| `--moderation` | - | Boolean flag, filter unsafe content |

### get_code_context_exa

Code-focused search. Defaults to GitHub + StackOverflow, returns full text.

```
bun skills/exa-code/scripts/get_code_context_exa.ts --query "your query" [options]
```

| Flag | Default | Description |
|------|---------|-------------|
| `--query` | (required) | Search query |
| `--numResults` | `5` | Number of results |
| `--maxChars` | `20000` | Max characters for text content |
| `--includeDomains` | `github.com,stackoverflow.com` | Comma-separated domains |
| `--excludeDomains` | - | Comma-separated domains to exclude |
| `--includeText` | - | String that must appear in results |
| `--summary` | - | Boolean flag, include LLM summary per result |

## When to Use

- "Search for..." / "Look up..." / "Find..."
- "How do I use [library/API]?"
- "Find code examples for..."
- "What's the latest on..."
- "Help me with this error..."
