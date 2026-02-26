# Nuxt 4 App Directory Migration Plan & Execution Summary

## Source of truth reviewed
- Nuxt Upgrade Guide: https://nuxt.com/docs/3.x/getting-started/upgrade
- Focus areas used from guide:
  - **New Directory Structure**
  - **Directory index scanning**
  - Nuxt 4 defaults around `srcDir`, `serverDir`, and `dir.app`

## Initial project state (before migration)
- Frontend/runtime source directories were at repository root (`assets/`, `components/`, `composables/`, `layouts/`, `middleware/`, `pages/`, `stores/`, `utils/`, `types/`, `locales/`, and `app.vue`).
- Nuxt was already on version 4 in `package.json`, but project structure still reflected Nuxt 3-style root layout.

## Migration goals
1. Adopt Nuxt 4 `app/` structure.
2. Keep `server/`, `public/`, `modules/`, `layers/` (if present) at repo root.
3. Preserve all features and behavior.
4. Validate runtime/dev/build/lint/typecheck health.
5. Ensure no duplicated import warnings in Nuxt dev output.

## Detailed TODO plan

### 1) Structural migration to `app/`
- [x] Create `app/` directory.
- [x] Move application source directories into `app/`:
  - `assets/`, `components/`, `composables/`, `layouts/`, `locales/`, `middleware/`, `pages/`, `stores/`, `utils/`, `types/`
- [x] Move root `app.vue` to `app/app.vue`.
- [x] Move app-side `services/steamAuth.ts` to `app/services/steamAuth.ts`.
- [x] Keep backend/runtime-root directories at root:
  - `server/`, `public/`, `services/` (microservices/docs), config files.

### 2) Nuxt config alignment
- [x] Set `srcDir: 'app/'` in `nuxt.config.ts` to explicitly align with Nuxt 4 app structure.
- [x] Update `imports.dirs` to preserve existing auto-import behavior and keep server utilities importable where needed.

### 3) Compatibility verification
- [x] Verify dev server starts on Nuxt 4 with new structure.
- [x] Verify build success.
- [x] Verify lint success.
- [x] Verify typecheck success.
- [x] Verify no duplicated imports warnings emitted during dev startup.

## Feature impact summary
- **No features removed.**
- Migration is structural/configurational only, with app code relocated to Nuxt 4 expected `app/` source root.
- Existing import style using `~` continues to work because app source now resides under `app/` and Nuxt 4 resolves `~` to `srcDir`.

## Notes on behavior changes required for transition
- No functional behavior changes were required.
- One explicit config alignment was added (`srcDir: 'app/'`) to make source root intent unambiguous and consistent across environments.

