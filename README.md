# Kelp Agent

Personal TUI agent built from scratch with Bun + Claude Messages API. A learning project inspired by openclaw and claude agent sdk.

## Features

### Core
- **One-shot chat**: Directly ask questions from the command line
- **Persistent bash session**: Execute shell commands in a long-running context
- **Tool execution pipeline**: Native support for Claude tool use
- **Subagent delegation**: Delegate focused subtasks to independent agent instances
- **Interactive mode**: Ask user for clarification or confirmation when needed
- **Skill system**: Extensible skill loading from configured directories

### Tools Built-in
- `bash`: Execute commands in a persistent shell session
- `delegate_task`: Delegate subtasks to subagents with independent context
- `str_replace_based_edit_tool`: View, create, and edit files
- `ask_user`: Request user input or confirmation during execution

### Skills Built-in

| Skill | Description |
|-------|-------------|
| `image-magick` | Process images using ImageMagick - resize, format conversion, crop, compression |
| `web-fetch` | Fetch and read any URL as clean markdown |
| `hello-world` | Demo skill that greets the user |
| `create-skill` | Scaffold new Agent Skills, including MCP-based skills |
| `yt-dlp-subtitle` | Download subtitles from video URLs with multi-language support |
| `web-search` | Search the web for general topics - news, recipes, travel, product research |
| `github-cli` | Wrapper for GitHub CLI - clone repos, view issues, create PRs, manage releases |
| `exa-code` | Search for code examples, documentation, and programming solutions |

### Tech Stack
- Powered by **Bun** - fast runtime, easy bundling, TypeScript support out of the box
- Uses **Anthropic Claude Messages API** for AI interactions
- MCP (Model Context Protocol) ready for extended tool integrations

## Installation

```bash
bun install -g @vito_liu93/kelp-agent
```

## Usage

### Basic chat
```bash
kelp "what's the weather today in Shanghai?"
```

### Pipe input
```bash
cat README.md | kelp "summarize this file"
```

### Interactive mode (TTY)
```bash
kelp "create a new react project"
```
Agent will ask for confirmation before executing potentially dangerous commands.

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `KELP_BASE_URL` | Custom API endpoint | - |
| `KELP_API_KEY` | Custom API key | - |
| `KELP_DEFAULT_MODEL` | Default model to use | `anthropic/claude-haiku-4.5` |

#### OpenRouter Support

Kelp can use OpenRouter as an alternative API provider:

```bash
export OPENROUTER_API_KEY="your-openrouter-key"
export KELP_DEFAULT_MODEL="anthropic/claude-sonnet-4-20250514"
```

#### .env file

You can create a `.env` file in your project directory:

```

## Build from source

```bash
bun install
bun run build:bin
# Binary will be at dist/kelp
```

## Development

```bash
bun dev "your prompt here"
```

## License

MIT
