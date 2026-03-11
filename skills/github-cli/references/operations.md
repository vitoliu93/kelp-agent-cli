# GitHub CLI Wrapper Operations

## Repository Operations

### gh-clone
```bash
gh repo clone <owner/repo> [--dest <path>]
```
Clones a repository. Maps to `gh repo clone`.

### gh-fork
```bash
gh repo fork <owner/repo> --clone
```
Forks a repository and optionally clones it locally.

### gh-info
```bash
gh repo view <owner/repo> --json nameWithOwner,description,stargazerCount,forkCount,primaryLanguage,url,createdAt,updatedAt
```
Displays repository metadata in structured format.

## Issues

### gh-issues
```bash
gh issue list --repo <owner/repo> --state <open|closed|all> --limit <n>
```
Lists issues filtered by state.

### gh-view-issue
```bash
gh issue view <issue-number> --repo <owner/repo> --json number,title,body,state,author,createdAt,comments
```
Shows details of a specific issue.

## Pull Requests

### gh-prs
```bash
gh pr list --repo <owner/repo> --state <open|closed|all|merged> --limit <n>
```
Lists pull requests filtered by state.

### gh-create-pr
```bash
gh pr create --repo <owner/repo> --head <head> --base <base> --title <title> --body <body>
```
Creates a pull request from head branch to base branch.

### gh-view-pr
```bash
gh pr view <pr-number> --repo <owner/repo> --json number,title,body,state,author,createdAt,commits,reviews
```
Shows details of a specific pull request.

## Releases

### gh-releases
```bash
gh release list --repo <owner/repo> --limit <n>
```
Lists releases with tag names, titles, and publication dates.

### gh-create-release
```bash
gh release create <tag> --repo <owner/repo> --title <title> --notes <notes>
```
Creates a release for an existing Git tag.

## Search

### gh-search-repos
```bash
gh search repos <query> --limit <n> --json nameWithOwner,description,stargazerCount,url
```
Searches repositories and returns top results with star counts.

### gh-search-users
```bash
gh search users <query> --limit <n> --json login,name,bio,followers,url
```
Searches users and returns profiles with follower counts.

## Authentication

### gh-auth-status
```bash
gh auth status
```
Shows logged-in user and authentication scope.

### gh-auth-login
```bash
gh auth login
```
Opens browser-based authentication flow.

### gh-auth-logout
```bash
gh auth logout
```
Removes stored GitHub credentials.

## Error Handling

If `gh` is not installed or not authenticated:
- `gh not found`: Return error asking user to install GitHub CLI
- `Not authenticated`: Suggest running `gh auth login`
- Invalid repo format: Validate `owner/repo` format before executing
