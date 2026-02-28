import Anthropic from "@anthropic-ai/sdk";

const prompt = Bun.argv[2];

if (!prompt) {
  console.error("Usage: bun run index.ts <prompt>");
  process.exit(1);
}

const client = new Anthropic({
  baseURL: process.env.OPENROUTER_ANTHROPIC_BASE_URL,
  apiKey: process.env.OPENROUTER_API_KEY,
});

const stream = await client.messages.create({
  model: process.env.AGENT_MODEL || "claude-sonnet-4-6",
  max_tokens: 16000,
  stream: true,
  thinking: { type: "enabled", budget_tokens: 10000 },
  messages: [{ role: "user", content: prompt }],
});

let sawThinking = false;

for await (const event of stream) {
  if (
    event.type === "content_block_start" &&
    event.content_block.type === "text" &&
    sawThinking
  ) {
    process.stdout.write("\n---\n");
  }
  if (event.type === "content_block_delta") {
    if (event.delta.type === "thinking_delta") {
      sawThinking = true;
      process.stdout.write(event.delta.thinking);
    } else if (event.delta.type === "text_delta") {
      process.stdout.write(event.delta.text);
    }
  }
}

process.stdout.write("\n");
