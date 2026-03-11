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
- `ask_user`: Request user input or confirmation during execution
- `tell_secret`: Fun easter egg

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

Set your Anthropic API key in environment:
```bash
export ANTHROPIC_API_KEY="your-api-key"
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