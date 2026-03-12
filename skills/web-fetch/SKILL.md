---
name: web-fetch
description: Fetch and read any URL as clean markdown, or search the web for general non-coding topics (news, current events, recipes, travel, product research). Use for reading any URL — including docs pages, articles, or websites. For search, prefer exa-code for coding docs, API references, GitHub issues, or library examples; use this skill's search for everything else.
---

# Web Fetch

Two scripts for general web browsing: search via Tavily and read any URL via Jina Reader.

## Scripts

### search.ts

Search the web using Tavily Search API.

```
bun skills/web-fetch/scripts/search.ts '<json>'
```

Parameters:
- `query` (required) — search query
- `maxResults` (optional, default 5) — number of results
- `topic` (optional) — `"general"` or `"news"`

Example:
```
bun skills/web-fetch/scripts/search.ts '{"query":"best ramen in Tokyo","maxResults":5}'
bun skills/web-fetch/scripts/search.ts '{"query":"latest AI news","topic":"news"}'
```

Requires env: `TAVILY_API_KEY`

### read.ts

Fetch and read any URL as clean markdown via Jina Reader.

```
bun skills/web-fetch/scripts/read.ts '<json>'
```

Parameters:
- `url` (required) — the URL to fetch

Example:
```
bun skills/web-fetch/scripts/read.ts '{"url":"https://example.com"}'
```

Requires env: `JINA_API_KEY` (optional — works without it but may be rate-limited)

Output is truncated at 30k characters to protect context window.
