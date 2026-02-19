#!/bin/bash

# ─── Shared Styling ──────────────────────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/lib/style.sh"

# ─── Configuration ────────────────────────────────────────────────────────────

SOURCE_BRANCH="master"

# Get service path from name
get_service_path() {
    case "$1" in
        charm-scraper)    echo "services/charm-scraper" ;;
        sticker-scraper)  echo "services/sticker-scraper" ;;
        steam-service)    echo "services/steam-service" ;;
        docs-site)        echo "services/docs-site" ;;
        weapon-scraper)   echo "services/weapon-scraper" ;;
        *)                echo "" ;;
    esac
}

# ─── Usage ────────────────────────────────────────────────────────────────────

usage() {
    echo "Usage: $0 <service-name>"
    echo ""
    echo "Available services:"
    echo "  - charm-scraper"
    echo "  - sticker-scraper"
    echo "  - steam-service"
    echo "  - docs-site"
    echo "  - weapon-scraper"
    echo ""
    echo "This creates/updates the <service-name>-only branch with only that service's files."
    exit 1
}

# ─── Validate Arguments ───────────────────────────────────────────────────────

if [ -z "$1" ]; then
    usage
fi

SERVICE_NAME="$1"
SERVICE_PATH=$(get_service_path "$SERVICE_NAME")

if [ -z "$SERVICE_PATH" ]; then
    print_error "Unknown service: $SERVICE_NAME"
    echo ""
    usage
fi

TARGET_BRANCH="${SERVICE_NAME}-only"

# Exit on any error
set -e

print_header "Deploy Service: $SERVICE_NAME → $TARGET_BRANCH"

# ─── Safety Checks ────────────────────────────────────────────────────────────

print_step "Running safety checks..."

# Check current branch
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [ "$CURRENT_BRANCH" != "$SOURCE_BRANCH" ]; then
    print_error "Must be on $SOURCE_BRANCH branch (currently on $CURRENT_BRANCH)"
    print_info "Run: git checkout $SOURCE_BRANCH"
    exit 1
fi

# Check for uncommitted changes
if ! git diff-index --quiet HEAD --; then
    print_error "You have uncommitted changes!"
    print_info "Please commit or stash your changes before deploying."
    echo ""
    git status --short
    exit 1
fi

# Check for untracked files in the service directory
UNTRACKED=$(git ls-files --others --exclude-standard "$SERVICE_PATH")
if [ -n "$UNTRACKED" ]; then
    print_warning "Untracked files found in $SERVICE_PATH:"
    echo "$UNTRACKED" | while read -r file; do
        print_dim "$file"
    done
    echo ""
    print_error "Please add these files to .gitignore or commit them first."
    exit 1
fi

# Check if service path exists
if [ ! -d "$SERVICE_PATH" ]; then
    print_error "Service path not found: $SERVICE_PATH"
    exit 1
fi

print_success "All safety checks passed"

# ─── Pull Latest ──────────────────────────────────────────────────────────────

print_step "Pulling latest changes from $SOURCE_BRANCH..."
git pull origin "$SOURCE_BRANCH" --ff-only || {
    print_error "Failed to pull latest changes. You may have diverged from origin."
    print_info "Try: git fetch origin && git rebase origin/$SOURCE_BRANCH"
    exit 1
}

# ─── Create Filtered Branch ───────────────────────────────────────────────────

print_step "Creating filtered branch for $SERVICE_NAME..."

# Delete local target branch if it exists (we'll recreate it)
if git show-ref --verify --quiet "refs/heads/$TARGET_BRANCH"; then
    print_dim "Removing existing local $TARGET_BRANCH branch..."
    git branch -D "$TARGET_BRANCH" > /dev/null 2>&1
fi

# Use subtree split to create a branch with only the service directory
# This creates a clean history with only commits that touched this service
git subtree split -P "$SERVICE_PATH" -b "$TARGET_BRANCH"

print_success "Created $TARGET_BRANCH branch"

# ─── Push to Remote ───────────────────────────────────────────────────────────

print_step "Pushing to origin/$TARGET_BRANCH..."
git push origin "$TARGET_BRANCH" --force

print_success "Pushed to origin/$TARGET_BRANCH"

# ─── Summary ──────────────────────────────────────────────────────────────────

print_done "Service '$SERVICE_NAME' deployed to '$TARGET_BRANCH' branch"

print_info "The $TARGET_BRANCH branch contains only files from $SERVICE_PATH"
print_info "To clone just this service:"
print_dim "git clone -b $TARGET_BRANCH <repo-url> $SERVICE_NAME"

print_elapsed
