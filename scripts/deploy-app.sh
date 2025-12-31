#!/bin/bash

# Configuration
EXCLUDED_PATHS=(
  "services/sticker-scraper"
  "services/charm-scraper"
  "services/steam-service"
  "public/img/charms"
  "public/img/weapons"
)
TARGET_BRANCH="app"
SOURCE_BRANCH="master"
TEMP_BRANCH="temp-deploy-sync-$(date +%s)"

# Exit on any error
set -e

echo "Starting deployment sync from $SOURCE_BRANCH to $TARGET_BRANCH..."

# 1. Ensure we are on $SOURCE_BRANCH and up to date
echo "Switching to $SOURCE_BRANCH..."
git checkout "$SOURCE_BRANCH"
git pull origin "$SOURCE_BRANCH"

# 2. Create a temporary 'sync' branch that matches $SOURCE_BRANCH exactly
echo "Creating temporary branch $TEMP_BRANCH..."
git checkout -b "$TEMP_BRANCH"

# SAFETY GUARD: Hard exit if we are still on the source branch
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [ "$CURRENT_BRANCH" == "$SOURCE_BRANCH" ]; then
    echo "SAFETY ERROR: Failed to switch branches! Current branch is still $CURRENT_BRANCH."
    echo "Aborting to prevent accidental deletion of files on $SOURCE_BRANCH."
    exit 1
fi

# 3. Remove the directories you don't want in production
echo "Removing excluded directories..."
for path in "${EXCLUDED_PATHS[@]}"; do
  
  # Check if path exists in the current branch's file system
  if [ -e "$path" ] || [ -d "$path" ]; then
    echo "  - Removing $path"
    git rm -rf "$path"
  else
    echo "  - Skipping $path (not found)"
  fi
done

# 4. Commit the removal
echo "Committing changes..."

# Grab the last message from master to make the deploy commit more informative
ORIGINAL_MSG=$(git log "$SOURCE_BRANCH" -1 --pretty=%s)

# Check if there are changes to commit
if git diff-index --quiet HEAD --; then
    echo "No changes to commit (folders might have been already removed)."
else
    git commit -m "deploy $SOURCE_BRANCH -> $TARGET_BRANCH: $ORIGINAL_MSG"
fi

# 5. Push to the remote $TARGET_BRANCH branch
echo "Pushing to $TARGET_BRANCH branch..."
git push origin "$TEMP_BRANCH":"$TARGET_BRANCH" --force

# 6. Clean up
echo "Cleaning up..."
git checkout "$SOURCE_BRANCH"
git branch -D "$TEMP_BRANCH"

echo "Success! Branch '$TARGET_BRANCH' is now up to date with '$SOURCE_BRANCH' (excluding directories)."
