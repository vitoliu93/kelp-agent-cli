# exa-code Tools

Both tools call `POST https://api.exa.ai/search` with different default presets.

## Exa /search API — Key Parameters

### Search params
- `query` (string, required): Search query
- `type` (string): `auto` (default) | `neural` | `fast` | `instant`
- `category` (string): `company` | `research paper` | `news` | `tweet` | `personal site` | `financial report` | `people`
- `numResults` (int, max 100, default 10)
- `includeDomains` (string[]): Restrict results to these domains
- `excludeDomains` (string[]): Exclude these domains
- `startPublishedDate` / `endPublishedDate` (ISO 8601): Filter by publish date
- `startCrawlDate` / `endCrawlDate` (ISO 8601): Filter by crawl date
- `includeText` (string[]): Text that must appear in results (max 1 string, up to 5 words)
- `excludeText` (string[]): Text that must NOT appear (max 1 string, up to 5 words)
- `moderation` (boolean): Filter unsafe content

### Contents params (nested under `contents`)
- `text`: `true` or `{ maxCharacters: int }`
- `highlights`: `true` or `{ maxCharacters: int, query: string }`
- `summary`: `{ query: string }` or `{}`
- `livecrawl`: `never` | `fallback` | `preferred` | `always`
- `maxAgeHours` (int): Only content crawled within N hours
- `subpages` (int): Number of subpages to crawl
- `subpageTarget` (string): Term to find specific subpages

### Response shape
```json
{
  "requestId": "string",
  "results": [
    {
      "title": "string",
      "url": "string",
      "publishedDate": "string|null",
      "author": "string|null",
      "text": "string",
      "highlights": ["string"],
      "summary": "string"
    }
  ]
}
```
