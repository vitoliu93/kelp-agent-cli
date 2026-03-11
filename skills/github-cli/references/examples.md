# GitHub CLI Wrapper Examples

## Clone & Fork

```bash
# Clone microsoft/vscode
./skills/github-cli/scripts/gh-wrapper.sh clone microsoft/vscode

# Clone to custom directory
./skills/github-cli/scripts/gh-wrapper.sh clone microsoft/vscode ~/my-vscode

# Fork a repo to your account
./skills/github-cli/scripts/gh-wrapper.sh fork octocat/Hello-World
```

## Repository Info

```bash
# Get repo details
./skills/github-cli/scripts/gh-wrapper.sh info kubernetes/kubernetes
```

Output includes: name, description, stars, forks, primary language, URL, created/updated dates.

## Issues

```bash
# List open issues (default)
./skills/github-cli/scripts/gh-wrapper.sh issues kubernetes/kubernetes

# List closed issues
./skills/github-cli/scripts/gh-wrapper.sh issues kubernetes/kubernetes closed 5

# View specific issue
./skills/github-cli/scripts/gh-wrapper.sh view-issue kubernetes/kubernetes 12345
```

## Pull Requests

```bash
# List open PRs
./skills/github-cli/scripts/gh-wrapper.sh prs kubernetes/kubernetes

# List all (merged + open + closed)
./skills/github-cli/scripts/gh-wrapper.sh prs kubernetes/kubernetes all 20

# Create a PR
./skills/github-cli/scripts/gh-wrapper.sh create-pr octocat/Hello-World feature/my-feature main "Add new feature" "This PR adds..."

# View specific PR
./skills/github-cli/scripts/gh-wrapper.sh view-pr octocat/Hello-World 42
```

## Releases

```bash
# List recent releases
./skills/github-cli/scripts/gh-wrapper.sh releases golang/go 10

# Create a release
./skills/github-cli/scripts/gh-wrapper.sh create-release myorg/myrepo v1.0.0 "Version 1.0.0" "Initial release notes"
```

## Search

```bash
# Search for repos related to "machine learning"
./skills/github-cli/scripts/gh-wrapper.sh search-repos "machine learning" 20

# Search for User "torvalds"
./skills/github-cli/scripts/gh-wrapper.sh search-users torvalds
```

## Authentication

```bash
# Check who you're logged in as
./skills/github-cli/scripts/gh-wrapper.sh auth-status

# Log in to GitHub (opens browser)
./skills/github-cli/scripts/gh-wrapper.sh auth-login

# Log out
./skills/github-cli/scripts/gh-wrapper.sh auth-logout
```

## Error Handling

If not authenticated:
```
Error: Not authenticated. Run: gh auth login
```

If repository not found:
```
Error: HTTP 404: Not Found (https://api.github.com/repos/invalid/repo)
```

If gh is not installed:
```
Error: gh CLI not found. Install it from https://cli.github.com
```
