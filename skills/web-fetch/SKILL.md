---
name: web-fetch
description: Fetch and read any URL as clean markdown. Use whenever the user wants to read a webpage, article, or documentation page. Do not use curl or wget — always use this skill to fetch URLs.
---

# Web Fetch

Fetch any URL as clean markdown via Jina Reader.

## Script

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
