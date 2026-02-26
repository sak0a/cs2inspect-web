# CLAUDE.md

## Project Overview

CS2Inspect Web is a full-stack Nuxt 4 application for Counter-Strike 2 players to customize loadouts with real-time preview. Steam OpenID auth, MariaDB storage.

## Tech Stack

- **Frontend**: Nuxt 4, Vue 3, Naive UI, Tailwind CSS, Pinia
- **Backend**: Nitro (H3), MariaDB, Drizzle ORM
- **Auth**: Steam OpenID + JWT

## Conventions

- **API endpoints**: Nitro file-based routing in `server/api/` (e.g., `[id].put.ts` → `PUT /api/:id`)
- **Types**: Import from `~/types` module, uses branded types in `types/core/branded.ts`
- **API client**: Use `api` from `~/utils/api.ts` for typed requests
- **Database fields**: Lowercase naming (e.g., `paintindex`, `paintseed`, `paintwear`)

## Git Workflow

- **Main branch**: `master` (all development happens here)
- **Releases**: Git tags (`v1.2.3`) on master — triggers Docker image builds
- **Docker images**: Built by GitHub Actions, pushed to GHCR
- **Deployment**: Coolify pulls images by tag (`WEB_IMAGE_TAG=latest` or `=v1.2.3`)

## Agent Gotchas

- Do NOT use `structuredClone()` on Vue reactive objects — it throws `DataCloneError` on Proxy objects. Use `JSON.parse(JSON.stringify())` instead.
- Do NOT reference `docker-compose.yml`, `docker-compose.dev.yml`, or `docker-compose.prod.yml` — they don't exist. Only `docker-compose.coolify.yml` exists.
- Do NOT reference `auto-deploy.yml` or `deploy-app.yml` workflows — they don't exist. Actual workflows: `ci.yml`, `docker.yml`, `release.yml`, `deploy-docs.yml`.
- Correct ports: web app = **3210**, steam service = **3211** (not 3000, 3001, or 3655).
- Docker service name for the database is `database`, not `db` or `mariadb`.
- The branch is `master`, not `main`.
- GITHUB_TOKEN events don't trigger other workflows. The release workflow uses `gh workflow run docker.yml` to work around this.

## Pre-existing Issues

These are known failures — don't chase them:

- 18 test failures in `services/steam-service/src/services/queue.test.ts`
- 1 lint error: `@typescript-eslint/no-explicit-any` in `nuxt.config.ts:118`
- 1 typecheck error in `scripts/project-cli.ts:536`
