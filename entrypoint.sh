#!/bin/bash

# Authenticate GitHub requests with PAT
REPO_URL="https://${GITHUB_PAT}@github.com/${GITHUB_USERNAME}/${GITHUB_REPO_NAME}.git"

# Clone the repository if it's not already present
if [ ! -d ".git" ]; then
  echo "Cloning the repository..."
  git clone --single-branch --branch production "$REPO_URL" /app
else
  echo "Checking for updates in the production branch..."
  cd /app
  git fetch origin production

  # Check if local production branch is up-to-date
  LOCAL_HASH=$(git rev-parse HEAD)
  REMOTE_HASH=$(git rev-parse origin/production)

  if [ "$LOCAL_HASH" != "$REMOTE_HASH" ]; then
    echo "Changes detected in the production branch. Pulling latest changes..."
    git pull origin production
    bun install
    bun run build
  else
    echo "No changes detected. Starting the server..."
  fi
fi

# Start the Nuxt server
bun run .output/server/index.mjs