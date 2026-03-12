---
name: web-search
description: Search the web for general, non-coding topics — news, current events, recipes, travel, product research. For coding docs, API references, GitHub issues, or library examples, prefer exa-code instead.
---

# Web Search

Search the web using Tavily Search API.

## Script

```
bun skills/web-search/scripts/search.ts '<json>'
```

Parameters:
- `query` (required) — search query
- `maxResults` (optional, default 5) — number of results
- `topic` (optional) — `"general"` or `"news"`

Example:
```
bun skills/web-search/scripts/search.ts '{"query":"best ramen in Tokyo","maxResults":5}'
bun skills/web-search/scripts/search.ts '{"query":"latest AI news","topic":"news"}'
```

Requires env: `TAVILY_API_KEY`
