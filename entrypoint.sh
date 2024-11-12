#!/bin/bash


# Authenticate GitHub requests with PAT
echo "Authenticating with GitHub..."
if [ -f /app/.env ]; then
    export $(grep -v '^#' /app/.env | xargs)
fi

REPO_URL="https://${GITHUB_PAT}@github.com/${GITHUB_USERNAME}/${GITHUB_REPOSITORY}.git"
echo "URL: $REPO_URL"

# Clone the repository if it's not already present
if [ ! -d ".git" ]; then
  echo "Initializing the repository..."
  git remote add origin "$REPO_URL"
  echo "Cloning the repository..."
  git clone --single-branch --branch production app
else
  git remote set-url origin "$REPO_URL"
  echo "Repository already exists. Fetching the latest changes..."
  echo "Checking for updates in the production branch..."
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

if [ ! -f ".output/server/index.mjs" ]; then
  echo "Building the project..."
  bun run build
fi

# Start the Nuxt server
bun run .output/server/index.mjs