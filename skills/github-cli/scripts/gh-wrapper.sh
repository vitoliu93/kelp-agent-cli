#!/bin/bash

set -euo pipefail

# GitHub CLI Wrapper Script
# Provides high-level functions for common gh operations

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if gh is installed
check_gh() {
  if ! command -v gh &> /dev/null; then
    echo -e "${RED}Error: gh CLI not found. Install it from https://cli.github.com${NC}"
    exit 1
  fi
}

# Repository Operations

gh_clone() {
  local repo=$1
  local dest=${2:-.}
  check_gh
  echo -e "${BLUE}Cloning $repo to $dest...${NC}"
  gh repo clone "$repo" "$dest"
  echo -e "${GREEN}Done!${NC}"
}

gh_fork() {
  local repo=$1
  check_gh
  echo -e "${BLUE}Forking $repo...${NC}"
  gh repo fork "$repo" --clone
  echo -e "${GREEN}Done!${NC}"
}

gh_info() {
  local repo=$1
  check_gh
  echo -e "${BLUE}Fetching info for $repo...${NC}"
  gh repo view "$repo" --json nameWithOwner,description,stargazerCount,forkCount,primaryLanguage,url,createdAt,updatedAt
}

# Issues

gh_issues() {
  local repo=$1
  local state=${2:-open}
  local limit=${3:-10}
  check_gh
  echo -e "${BLUE}Issues in $repo (state: $state, limit: $limit)${NC}"
  gh issue list --repo "$repo" --state "$state" --limit "$limit"
}

gh_view_issue() {
  local repo=$1
  local issue=$2
  check_gh
  echo -e "${BLUE}Viewing issue #$issue in $repo...${NC}"
  gh issue view "$issue" --repo "$repo"
}

# Pull Requests

gh_prs() {
  local repo=$1
  local state=${2:-open}
  local limit=${3:-10}
  check_gh
  echo -e "${BLUE}Pull requests in $repo (state: $state, limit: $limit)${NC}"
  gh pr list --repo "$repo" --state "$state" --limit "$limit"
}

gh_create_pr() {
  local repo=$1
  local head=$2
  local base=$3
  local title=${4:-""}
  local body=${5:-""}
  check_gh
  echo -e "${BLUE}Creating PR in $repo: $head -> $base${NC}"
  gh pr create --repo "$repo" --head "$head" --base "$base" ${title:+--title "$title"} ${body:+--body "$body"}
}

gh_view_pr() {
  local repo=$1
  local pr=$2
  check_gh
  echo -e "${BLUE}Viewing PR #$pr in $repo...${NC}"
  gh pr view "$pr" --repo "$repo"
}

# Releases

gh_releases() {
  local repo=$1
  local limit=${2:-5}
  check_gh
  echo -e "${BLUE}Releases in $repo (limit: $limit)${NC}"
  gh release list --repo "$repo" --limit "$limit"
}

gh_create_release() {
  local repo=$1
  local tag=$2
  local title=${3:-""}
  local notes=${4:-""}
  check_gh
  echo -e "${BLUE}Creating release in $repo: $tag${NC}"
  gh release create "$tag" --repo "$repo" ${title:+--title "$title"} ${notes:+--notes "$notes"}
}

# Search

gh_search_repos() {
  local query=$1
  local limit=${2:-10}
  check_gh
  echo -e "${BLUE}Searching repos: $query (limit: $limit)${NC}"
  gh search repos "$query" --limit "$limit"
}

gh_search_users() {
  local query=$1
  local limit=${2:-10}
  check_gh
  echo -e "${BLUE}Searching users: $query (limit: $limit)${NC}"
  gh search users "$query" --limit "$limit"
}

# Authentication

gh_auth_status() {
  check_gh
  echo -e "${BLUE}GitHub auth status:${NC}"
  gh auth status
}

gh_auth_login() {
  check_gh
  echo -e "${BLUE}Opening GitHub authentication...${NC}"
  gh auth login
}

gh_auth_logout() {
  check_gh
  echo -e "${BLUE}Logging out from GitHub...${NC}"
  gh auth logout
}

# Main dispatcher
main() {
  local cmd=$1
  shift || true

  case "$cmd" in
    clone) gh_clone "$@" ;;
    fork) gh_fork "$@" ;;
    info) gh_info "$@" ;;
    issues) gh_issues "$@" ;;
    view-issue) gh_view_issue "$@" ;;
    prs) gh_prs "$@" ;;
    create-pr) gh_create_pr "$@" ;;
    view-pr) gh_view_pr "$@" ;;
    releases) gh_releases "$@" ;;
    create-release) gh_create_release "$@" ;;
    search-repos) gh_search_repos "$@" ;;
    search-users) gh_search_users "$@" ;;
    auth-status) gh_auth_status "$@" ;;
    auth-login) gh_auth_login "$@" ;;
    auth-logout) gh_auth_logout "$@" ;;
    *)
      echo -e "${RED}Unknown command: $cmd${NC}"
      echo "Available commands:"
      echo "  Repository: clone, fork, info"
      echo "  Issues: issues, view-issue"
      echo "  Pull Requests: prs, create-pr, view-pr"
      echo "  Releases: releases, create-release"
      echo "  Search: search-repos, search-users"
      echo "  Auth: auth-status, auth-login, auth-logout"
      exit 1
      ;;
  esac
}

main "$@"
