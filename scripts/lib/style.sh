#!/bin/bash

# ─── Shared Styling Utilities for CS2Inspect Bash Scripts ─────────────────────
#
# Source this file at the top of any bash script:
#   SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
#   source "$SCRIPT_DIR/lib/style.sh"
#
# Provides: colors, print helpers, header/done boxes, and a timer.
# Design language matches scripts/project-cli.ts (@clack/prompts + chalk).

# ─── Colors ───────────────────────────────────────────────────────────────────

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
DIM='\033[2m'
BOLD='\033[1m'
NC='\033[0m'

# ─── Print Helpers ────────────────────────────────────────────────────────────

print_step() {
    echo -e "${CYAN}-->  ${1}${NC}"
}

print_success() {
    echo -e "${GREEN}✓  ${1}${NC}"
}

print_error() {
    echo -e "${RED}✗  ${1}${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠  ${1}${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ  ${1}${NC}"
}

print_dim() {
    echo -e "${DIM}   ${1}${NC}"
}

# ─── Header Box ───────────────────────────────────────────────────────────────
# Draws a bordered header matching @clack/prompts intro style.
#
# Usage: print_header "Deploy: master -> app"

print_header() {
    local title="$1"
    local title_len=${#title}
    local width=$((title_len + 4))
    # Minimum width
    if [ "$width" -lt 40 ]; then
        width=40
    fi
    local padding=$((width - title_len - 2))

    echo ""
    # Top border
    printf "${CYAN}┌"
    printf '─%.0s' $(seq 1 "$width")
    printf "┐${NC}\n"
    # Title line
    printf "${CYAN}│${NC} ${BOLD}%s${NC}" "$title"
    printf '%*s' "$padding" ""
    printf "${CYAN}│${NC}\n"
    # Bottom border
    printf "${CYAN}└"
    printf '─%.0s' $(seq 1 "$width")
    printf "┘${NC}\n"
    echo ""
}

# ─── Done Box ─────────────────────────────────────────────────────────────────
# Draws a green completion line matching @clack/prompts outro style.
#
# Usage: print_done "Deployment complete!"

print_done() {
    local msg="${1:-Done!}"
    echo ""
    echo -e "${GREEN}${BOLD}✓  ${msg}${NC}"
    echo ""
}

# ─── Separator ────────────────────────────────────────────────────────────────

print_separator() {
    echo -e "${DIM}$(printf '─%.0s' $(seq 1 50))${NC}"
}

# ─── Timer ────────────────────────────────────────────────────────────────────
# Captures start time when this file is sourced.
# Call print_elapsed at the end of your script to show duration.

_style_start_time=$(date +%s)

print_elapsed() {
    local end_time
    end_time=$(date +%s)
    local elapsed=$(( end_time - _style_start_time ))

    if [ "$elapsed" -ge 60 ]; then
        local mins=$(( elapsed / 60 ))
        local secs=$(( elapsed % 60 ))
        echo -e "${DIM}Completed in ${mins}m ${secs}s${NC}"
    else
        echo -e "${DIM}Completed in ${elapsed}s${NC}"
    fi
}
