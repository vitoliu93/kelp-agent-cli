import Anthropic from "@anthropic-ai/sdk";

const prompt = Bun.argv[2];

if (!prompt) {
  console.error("Usage: bun run index.ts <prompt>");
  process.exit(1);
}

const client = new Anthropic({
  baseURL: "https://openrouter.ai/api",
  apiKey: process.env.OPENROUTER_API_KEY,
});

const stream = await client.messages.create({
  model: "claude-sonnet-4-5",
  max_tokens: 4096,
  stream: true,
  messages: [{ role: "user", content: prompt }],
});

for await (const event of stream) {
  if (
    event.type === "content_block_delta" &&
    event.delta.type === "text_delta"
  ) {
    process.stdout.write(event.delta.text);
  }
}

process.stdout.write("\n");
