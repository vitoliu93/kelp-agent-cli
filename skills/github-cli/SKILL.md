---
name: github-cli
description: Wrapper for GitHub CLI (gh) basic operations — clone repos, view issues, create pull requests, manage releases, search repositories, and authenticate with GitHub.
---

# GitHub CLI Wrapper

A command-line skill that wraps the most essential GitHub CLI (`gh`) operations for common developer workflows.

## Trigger Keywords

Use this skill when the user asks to:
- Clone, fork, or download a repository
- View, list, or search issues or pull requests
- Create, update, or merge pull requests
- View, create, or manage releases
- Search repositories or users
- Check authentication status or log in to GitHub
- View repository details or stars

## Prerequisites

- `gh` CLI installed and available in `$PATH`
- GitHub authentication configured (run `gh auth login` if needed)

## Operations

### 1. Repository Operations
```
gh-clone <owner/repo> [--dest <path>]
  Clone a repository to the current directory or specified path.

gh-fork <owner/repo>
  Fork a repository to your GitHub account.

gh-info <owner/repo>
  Display repository details (description, stars, forks, language, etc.).
```

### 2. Issues & Pull Requests
```
gh-issues <owner/repo> [--state <open|closed|all>] [--limit <n>]
  List issues (open by default, limit 10).

gh-prs <owner/repo> [--state <open|closed|all>] [--limit <n>]
  List pull requests (open by default, limit 10).

gh-create-pr <owner/repo> <head> <base> [--title <title>] [--body <body>]
  Create a pull request. Head and base are branch names.

gh-view-issue <owner/repo> <issue-number>
  Display details of a specific issue.

gh-view-pr <owner/repo> <pr-number>
  Display details of a specific pull request.
```

### 3. Releases
```
gh-releases <owner/repo> [--limit <n>]
  List releases (limit 5).

gh-create-release <owner/repo> <tag> [--title <title>] [--notes <notes>]
  Create a release for a Git tag.
```

### 4. Search
```
gh-search-repos <query> [--limit <n>]
  Search repositories by name, description, or keywords (limit 10).

gh-search-users <query> [--limit <n>]
  Search users by name or username (limit 10).
```

### 5. Authentication & Status
```
gh-auth-status
  Show current authentication status and account info.

gh-auth-login
  Authenticate with GitHub (opens browser flow).

gh-auth-logout
  Log out from GitHub.
```

## Implementation

When called, the agent should:
1. Validate the operation name and arguments
2. Run the corresponding `gh` command with appropriate flags
3. Parse and format the output for readability
4. Return results or errors clearly

See [references/operations.md](references/operations.md) for detailed command mappings.
