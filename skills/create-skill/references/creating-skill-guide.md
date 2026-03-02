# Agent Skills Authoring Guide

Agent Skills are a lightweight, open format for extending AI agent capabilities with specialized knowledge and workflows. Skills use **progressive disclosure** to manage context efficiently.

## Directory structure

A skill is a directory containing at minimum a `SKILL.md` file:

```
skill-name/
├── SKILL.md          # Required: instructions + metadata
├── scripts/          # Optional: executable code
├── references/       # Optional: documentation
└── assets/           # Optional: templates, resources
```

## SKILL.md format

The `SKILL.md` file must contain YAML frontmatter followed by Markdown content.

### Frontmatter (required)

```yaml
---
name: skill-name
description: A description of what this skill does and when to use it.
---
```

- `name`: Max 64 characters. Lowercase letters, numbers, and hyphens only. Must not start or end with a hyphen.
- `description`: Max 1024 characters. Non-empty. Describes what the skill does and when to use it. Should include specific keywords that help agents identify relevant tasks.
- `license`, `compatibility`, `metadata`, `allowed-tools`: Optional fields.

### Body content

The Markdown body after the frontmatter contains the skill instructions. There are no format restrictions. Write whatever helps agents perform the task effectively.

Recommended sections:
- Step-by-step instructions
- Examples of inputs and outputs
- Common edge cases

## Optional directories

### scripts/
Contains executable code that agents can run. Scripts should be self-contained or clearly document dependencies.

### references/
Contains additional documentation that agents can read when needed (e.g., `REFERENCE.md`, `FORMS.md`).
Keep individual reference files focused. Agents load these on demand, so smaller files mean less use of context.

### assets/
Contains static resources (e.g., templates, images, data files).

## File references

When referencing other files in your skill, use relative paths from the skill root:

```markdown
See [the reference guide](references/REFERENCE.md) for details.

Run the extraction script:
scripts/extract.py
```

## Script Execution

When an existing package already does what you need, you can reference it directly in your `SKILL.md` instructions (e.g., `uvx`, `npx`, `deno run`).
When you need reusable logic, bundle a script in `scripts/` that declares its own dependencies inline (e.g., PEP 723 for Python `uv run scripts/extract.py`, or Deno `deno run scripts/extract.ts`).