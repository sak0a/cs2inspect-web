#!/bin/bash

echo "INFO | Importing Environment Variables from .env"
if [ -f /app/.env ]; then
    export $(grep -v '^#' /app/.env | xargs)
fi
REPO_DIR="/app/repository"
REPO_URL="https://${GITHUB_PAT}@github.com/${GITHUB_USERNAME}/${GITHUB_REPOSITORY}.git"

# Clone the repository if it's not already present
if [ ! -d "repository/.git" ]; then
  git clone --single-branch --branch production $REPO_URL repository
  echo "INFO | Installing Project Dependencies..."
  cd $REPO_DIR && bun install
else
  cd $REPO_DIR
  echo "INFO | Repository already exists, setting the remote origin"
  git remote set-url origin "$REPO_URL"
  echo "INFO | Checking for updates in the production branch..."
  git fetch origin production
  # Check if local production branch is up-to-date
  LOCAL_HASH=$(git rev-parse HEAD)
  REMOTE_HASH=$(git rev-parse origin/production)
  echo "INFO | LOCAL : ${LOCAL_HASH}"
  echo "INFO | REMOTE: ${REMOTE_HASH}"

  if [ "$LOCAL_HASH" != "$REMOTE_HASH" ]; then
    echo "INFO | Changes detected in the production branch. Pulling latest changes..."
    git pull origin production
    echo "INFO | Installing Project Dependencies..."
    bun install
  else
    echo "INFO | No changes detected. Starting the server..."
    bun run .output/server/index.mjs
    exit 0
  fi
fi

cd $REPO_DIR
if [ ! -f ".output/server/index.mjs" ] ; then
  echo "INFO | Building the project..."
  bun run build
fi

echo "INFO | Starting the server..."
bun run .output/server/index.mjs