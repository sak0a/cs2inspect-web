#!/bin/bash

# ─── Shared Styling ──────────────────────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/lib/style.sh"

# ─── Configuration ────────────────────────────────────────────────────────────

EXCLUDED_PATHS=(
  "services/sticker-scraper"
  "services/charm-scraper"
  "services/steam-service"
  "services/weapon-scraper"
  "services/docs-site"
  "public/img/stickers"
  "public/img/charms"
  "public/img/weapons"
)
TARGET_BRANCH="app-dev"
SOURCE_BRANCH="master"
TEMP_BRANCH="temp-deploy-dev-$(date +%s)"

# Exit on any error
set -e

print_header "Deploy: $SOURCE_BRANCH → $TARGET_BRANCH"

# Stash any uncommitted changes so we can switch branches cleanly
STASHED=false
if ! git diff-index --quiet HEAD -- || [ -n "$(git ls-files --others --exclude-standard)" ]; then
    print_step "Stashing uncommitted changes..."
    git stash push -u -m "deploy-app-dev auto-stash"
    STASHED=true
fi

# Ensure stash is restored on exit (success or failure)
cleanup() {
    git checkout "$SOURCE_BRANCH" 2>/dev/null || true
    git branch -D "$TEMP_BRANCH" 2>/dev/null || true
    if [ "$STASHED" = true ]; then
        print_info "Restoring stashed changes..."
        git stash pop
    fi
}
trap cleanup EXIT

# 1. Ensure we are on $SOURCE_BRANCH and up to date
print_step "Switching to $SOURCE_BRANCH and pulling latest..."
git checkout "$SOURCE_BRANCH"
git pull origin "$SOURCE_BRANCH"

# 2. Create a temporary branch that matches $SOURCE_BRANCH exactly
print_step "Creating temporary branch..."
git checkout -b "$TEMP_BRANCH"

# SAFETY GUARD: Hard exit if we are still on the source branch
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [ "$CURRENT_BRANCH" == "$SOURCE_BRANCH" ]; then
    print_error "Failed to switch branches! Current branch is still $CURRENT_BRANCH."
    print_error "Aborting to prevent accidental deletion of files on $SOURCE_BRANCH."
    exit 1
fi

# 3. Remove the directories you don't want in the deployed branch
print_step "Removing excluded directories..."
for path in "${EXCLUDED_PATHS[@]}"; do
  if [ -e "$path" ] || [ -d "$path" ]; then
    print_dim "Removing $path"
    git rm -rf "$path" > /dev/null 2>&1
  else
    print_dim "Skipping $path (not found)"
  fi
done

# 4. Commit the removal
print_step "Committing changes..."

ORIGINAL_MSG=$(git log "$SOURCE_BRANCH" -1 --pretty=%s)

if git diff-index --quiet HEAD --; then
    print_warning "No changes to commit (folders might have been already removed)"
else
    git commit -m "deploy $SOURCE_BRANCH -> $TARGET_BRANCH: $ORIGINAL_MSG" > /dev/null
fi

# 5. Push to the remote $TARGET_BRANCH branch
print_step "Force-pushing to $TARGET_BRANCH..."
git push origin "$TEMP_BRANCH":"$TARGET_BRANCH" --force

# 6. Clean up is handled by the EXIT trap

print_done "Branch '$TARGET_BRANCH' synced from '$SOURCE_BRANCH'"
print_elapsed
