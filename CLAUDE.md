# CLAUDE.md

## Project Overview

CS2Inspect Web is a full-stack Nuxt 4 application for Counter-Strike 2 players to customize loadouts with real-time preview. Steam OpenID auth, MariaDB storage.


## Tech Stack

- **Frontend**: Nuxt 3, Vue 3, Naive UI, Tailwind CSS, Pinia
- **Backend**: Nitro (H3), MariaDB, Drizzle ORM
- **Auth**: Steam OpenID + JWT

## Conventions

- **API endpoints**: Nitro file-based routing in `server/api/` (e.g., `[id].put.ts` → `PUT /api/:id`)
- **Types**: Import from `~/types` module, uses branded types in `types/core/branded.ts`
- **API client**: Use `api` from `~/utils/api.ts` for typed requests
- **Database fields**: Lowercase naming (e.g., `paintindex`, `paintseed`, `paintwear`)

## Git Workflow

- **Main branch**: `master`
- **Production branch**: `app` (auto-synced, do not edit directly)
- **Deploy**: `bun run deploy:app`

The role of this file is to tdescribe common mistakes and confusion points that agents might encounter as they work in this project.
If you ever encounter something in the project that surprises you, please alert the developer working with you and indicate that this the case in the AGENTS.MD / CLAUDE.md file to help prevent future agents from having the same issue.