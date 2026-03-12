const argsJson = Bun.argv[2] ?? "{}";
const { query, maxResults = 5, topic = "general" } = JSON.parse(argsJson);

const res = await fetch("https://api.tavily.com/search", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    api_key: process.env.TAVILY_API_KEY,
    query,
    max_results: maxResults,
    topic,
    include_raw_content: false,
    include_images: false,
  }),
});

if (!res.ok) {
  console.error(`Tavily error: ${res.status} ${await res.text()}`);
  process.exit(1);
}

const data = await res.json();
const results = data.results as Array<{ title: string; url: string; content: string }>;

const output = results
  .map((r, i) => `[${i + 1}] ${r.title}\n    ${r.url}\n    ${r.content}`)
  .join("\n\n");

console.log(output);
