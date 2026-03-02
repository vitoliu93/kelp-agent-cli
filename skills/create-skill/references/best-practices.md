# Agent Skills Best Practices

## Developing and evaluating skills

- **Start with evaluation:** Identify specific gaps in your agents' capabilities by running them on representative tasks and observing where they struggle or require additional context. Then build skills incrementally to address these shortcomings.
- **Structure for scale:** When the `SKILL.md` file becomes unwieldy, split its content into separate files and reference them. Keep paths separate to reduce token usage. Code can serve as executable tools or documentation.
- **Think from Claude's perspective:** Monitor how Claude uses your skill in real scenarios. Pay special attention to the `name` and `description` of your skill, as Claude will use these when deciding whether to trigger the skill.
- **Iterate with Claude:** Ask Claude to capture successful approaches and common mistakes into reusable context and code within a skill.

## Designing scripts for agentic use

When an agent runs your script, it reads stdout and stderr to decide what to do next.

### Avoid interactive prompts
This is a hard requirement. Agents operate in non-interactive shells. A script that blocks on interactive input will hang indefinitely. Accept all input via command-line flags, environment variables, or stdin.

### Document usage with `--help`
`--help` output is the primary way an agent learns your script's interface. Include a brief description, available flags, and usage examples.

### Write helpful error messages
Say what went wrong, what was expected, and what to try next. An opaque "Error: invalid input" wastes a turn.

### Use structured output
Prefer structured formats (JSON, CSV, TSV) over free-form text. Separate data from diagnostics: send structured data to stdout and progress messages, warnings, and other diagnostics to stderr. This lets the agent capture clean, parseable output while still having access to diagnostic information.

### Further considerations
- **Idempotency:** Agents may retry commands. "Create if not exists" is safer than "create and fail on duplicate."
- **Input constraints:** Reject ambiguous input with a clear error rather than guessing.
- **Dry-run support:** For destructive or stateful operations, a `--dry-run` flag lets the agent preview what will happen.
- **Meaningful exit codes:** Use distinct exit codes for different failure types and document them in your `--help` output.
- **Predictable output size:** If your script might produce large output, default to a summary or a reasonable limit, and support flags like `--offset` or `--output`.

## Security considerations
- Audit thoroughly: Review all files bundled in the skill for unusual patterns or external network calls.
- Treat external sources with caution, as fetched content may contain malicious instructions.
- Be careful with tool misuse or potential data exposure if the skill has access to sensitive data.