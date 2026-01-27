# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

CS2Inspect Web is a full-stack Nuxt 3 application for Counter-Strike 2 players to customize loadouts (weapons, knives, gloves, agents, music kits, pins) with real-time preview. Users authenticate via Steam OpenID, and configurations are stored in MariaDB.

## Commands

```bash
# Development
bun install              # Install dependencies
bun run dev              # Start dev server (localhost:3210)

# Build & Preview
bun run build            # Production build
bun run preview          # Preview production build

# Testing
bun test                 # Run tests (Vitest)
bun test --watch         # Watch mode
bun test path/to/file    # Run specific test file

# Code Quality
bun run lint             # ESLint
bun run typecheck        # TypeScript check

# Database (Drizzle ORM + MariaDB)
bun run db:push          # Push schema changes
bun run db:generate      # Generate migrations
bun run db:migrate       # Run migrations
bun run db:studio        # Drizzle Studio GUI

# Documentation Site
bun run docs:dev         # Start docs site
```

## Architecture

### Tech Stack
- **Frontend**: Nuxt 3, Vue 3, Naive UI, Tailwind CSS, Pinia
- **Backend**: Nitro (H3), MariaDB, Drizzle ORM
- **Auth**: Steam OpenID + JWT
- **i18n**: nuxt-i18n-micro (EN, DE, RU, ES, FR, NL)
- **CS2 Libraries**: `cs2-inspect-lib`, `node-cs2`

### Key Directories
```
components/          # Vue components (modals, tabs, customizers)
composables/         # useInspectItem, useItemModal, useItems
pages/               # Auto-routed pages (weapons/[type].vue, knives/, etc.)
server/api/          # Nitro API endpoints
server/database/     # Drizzle schema and helpers
stores/              # Pinia stores (loadoutStore.ts)
types/               # TypeScript types (core/, business/, api/, database/)
utils/               # Client utilities (api.ts)
```

### API Structure
API endpoints follow Nitro conventions in `server/api/`:
- File naming: `[method].[route].ts` (e.g., `loadouts/[id].put.ts` → `PUT /api/loadouts/:id`)
- Loadout CRUD: `server/api/loadouts/`
- Item data: `server/api/items/`
- Health checks: `server/api/health/` (live, ready, details, history)

### Branded Types Pattern

The codebase uses branded types in `types/core/branded.ts` for compile-time safety:

```typescript
// Prevents mixing up different ID types
type LoadoutId = number & { readonly __brand: 'LoadoutId' }
type SteamId = string & { readonly __brand: 'SteamId' }
type Defindex = number & { readonly __brand: 'Defindex' }
type PaintIndex = number & { readonly __brand: 'PaintIndex' }

// Use conversion helpers
import { toLoadoutId, isValidLoadoutId } from '~/types/core/branded'
const loadoutId = toLoadoutId(params.id)
```

### API Client Pattern

Use the typed API client in `utils/api.ts`:

```typescript
import { api } from '~/utils/api'

// Returns ApiResponse<T> with automatic error handling
const response = await api.get<IEnhancedWeapon[]>('/api/items/weapons/rifles', {
  loadoutId: String(id),
  steamId: String(steamId)
})
```

### Database Field Naming

Database fields use lowercase without camelCase. When mapping:
```typescript
paintIndex: dbInfo.paintindex      // Not paintIndex
pattern: dbInfo.paintseed          // Not pattern
wear: dbInfo.paintwear             // Not paintWear
statTrak: dbInfo.stattrak_enabled  // Not statTrak
nameTag: dbInfo.nametag            // Not nameTag
```

### Type Imports

Always import types from the main `~/types` module:
```typescript
import type { WeaponConfiguration, WeaponItemData, UserProfile } from '~/types'
```

## Git Workflow

- **Main branch**: `master` (source of truth)
- **Production branch**: `app` (filtered for deployment, auto-synced)
- **Deploy to app**: `bun run deploy:app`

Do not directly edit `app` or `*-only` branches (they're automated projections).

## Environment Variables

Required variables (validated via Zod in `server/env.ts`):
- `STEAM_API_KEY` - Steam Web API key
- `JWT_TOKEN` - JWT signing secret
- `DATABASE_HOST`, `DATABASE_PORT`, `DATABASE_USER`, `DATABASE_PASSWORD`, `DATABASE_NAME`

Optional:
- `LOG_API_REQUESTS` - Enable API logging
- `STEAM_SERVICE_URL` - External Steam service URL
