#!/bin/bash

# Configuration
EXCLUDED_PATHS=(
  "services/sticker-scraper"
  "services/charm-scraper"
  "services/steam-service"
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

echo "Starting deployment sync from $SOURCE_BRANCH to $TARGET_BRANCH..."

# Stash any uncommitted changes so we can switch branches cleanly
STASHED=false
if ! git diff-index --quiet HEAD -- || [ -n "$(git ls-files --others --exclude-standard)" ]; then
    echo "Stashing uncommitted changes..."
    git stash push -u -m "deploy-app-dev auto-stash"
    STASHED=true
fi

# Ensure stash is restored on exit (success or failure)
cleanup() {
    git checkout "$SOURCE_BRANCH" 2>/dev/null || true
    git branch -D "$TEMP_BRANCH" 2>/dev/null || true
    if [ "$STASHED" = true ]; then
        echo "Restoring stashed changes..."
        git stash pop
    fi
}
trap cleanup EXIT

# 1. Ensure we are on $SOURCE_BRANCH and up to date
echo "Switching to $SOURCE_BRANCH..."
git checkout "$SOURCE_BRANCH"
git pull origin "$SOURCE_BRANCH"

# 2. Create a temporary branch that matches $SOURCE_BRANCH exactly
echo "Creating temporary branch $TEMP_BRANCH..."
git checkout -b "$TEMP_BRANCH"

# SAFETY GUARD: Hard exit if we are still on the source branch
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [ "$CURRENT_BRANCH" == "$SOURCE_BRANCH" ]; then
    echo "SAFETY ERROR: Failed to switch branches! Current branch is still $CURRENT_BRANCH."
    echo "Aborting to prevent accidental deletion of files on $SOURCE_BRANCH."
    exit 1
fi

# 3. Remove the directories you don't want in the deployed branch
echo "Removing excluded directories..."
for path in "${EXCLUDED_PATHS[@]}"; do
  if [ -e "$path" ] || [ -d "$path" ]; then
    echo "  - Removing $path"
    git rm -rf "$path"
  else
    echo "  - Skipping $path (not found)"
  fi
done

# 4. Commit the removal
echo "Committing changes..."

ORIGINAL_MSG=$(git log "$SOURCE_BRANCH" -1 --pretty=%s)

if git diff-index --quiet HEAD --; then
    echo "No changes to commit (folders might have been already removed)."
else
    git commit -m "deploy $SOURCE_BRANCH -> $TARGET_BRANCH: $ORIGINAL_MSG"
fi

# 5. Push to the remote $TARGET_BRANCH branch
echo "Pushing to $TARGET_BRANCH branch..."
git push origin "$TEMP_BRANCH":"$TARGET_BRANCH" --force

# 6. Clean up is handled by the EXIT trap

echo "Success! Branch '$TARGET_BRANCH' is now up to date with '$SOURCE_BRANCH' (excluding directories)."
