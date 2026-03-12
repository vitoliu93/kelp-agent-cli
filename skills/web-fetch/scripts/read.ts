const argsJson = Bun.argv[2] ?? "{}";
const { url } = JSON.parse(argsJson);

const headers: Record<string, string> = { Accept: "text/markdown" };
if (process.env.JINA_API_KEY) {
  headers["Authorization"] = `Bearer ${process.env.JINA_API_KEY}`;
}

const res = await fetch(`https://r.jina.ai/${url}`, { headers });

if (!res.ok) {
  console.error(`Jina error: ${res.status} ${await res.text()}`);
  process.exit(1);
}

console.log(await res.text());
