---
name: create-skill
description: Scaffolds a new Agent Skill. Use when the user asks to create a skill, add a skill, or make a new skill for X.
---

# Create Skill

## Step 1: Clarify intent

If the user hasn't specified what the skill should do, ask them one question:
> "What should this skill do, and when should it be triggered?"

Do not proceed until you have a clear purpose.

## Step 2: Derive the skill name

Rules (from specification):
- Lowercase letters, numbers, hyphens only (`a-z`, `0-9`, `-`)
- 1–64 characters
- Must not start or end with `-`
- Must not contain consecutive hyphens (`--`)

Derive a name from the user's description. Use 2–4 words joined with hyphens. Examples:
- "process PDF files" → `pdf-processing`
- "review pull requests" → `pr-review`
- "analyze code quality" → `code-quality`

## Step 3: Create the directory

```
skills/<name>/
```

Use `mkdir -p skills/<name>` via Bash.

## Step 4: Follow Authoring Best Practices

Before generating the skill content or scripts, review the official guidelines:
- Read [Skill Authoring Guide](references/creating-skill-guide.md) to understand the Agent Skills architecture and specification.
- Read [Skill Best Practices](references/best-practices.md) for tips on designing robust agentic workflows and scripts.

## Step 5: Write SKILL.md

Create `skills/<name>/SKILL.md` with this structure:

```markdown
---
name: <name>
description: <one sentence: what it does + when to use it, include trigger keywords>
---

# <Title>

<Clear step-by-step instructions for the agent to follow when this skill is activated.>
```

Frontmatter rules:
- `name`: must exactly match the directory name
- `description`: 1–1024 chars; include specific keywords that help the agent know when to activate this skill

Body rules:
- Write whatever instructions help the agent perform the task
- Keep it under 500 lines; move heavy reference material to `references/` files

## Step 6: Optional subdirectories

Only create these if the skill actually needs them:

| Directory | Purpose |
|-----------|---------|
| `scripts/` | Executable scripts the skill runs |
| `references/` | Additional docs the skill reads on demand |
| `assets/` | Templates, images, data files |

If you create subdirectory files, reference them with relative paths from `SKILL.md`:
```markdown
See [reference](references/REFERENCE.md).
Run: scripts/extract.py
```

## Step 7: Confirm

After writing the file, tell the user:
- The skill name
- The file path created
- A one-line summary of when it triggers

Do not run tests or further validation unless the user asks.
