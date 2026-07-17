# Default shadcn controls implementation plan

**Goal:** Remove the legacy SUI styling carried through the Tailwind v4 migration and use registry-default shadcn-vue New York v4 styles for shared buttons and dropdowns.

**Spec:** `docs/superpowers/specs/2026-07-14-default-shadcn-controls-design.md`

## Task 1: Restore the canonical Button primitive

- Replace the custom Button CVA with the current registry variants and sizes.
- Retain only non-visual loading, disabled, native-type, and optional leading-icon behavior.
- Remove unused button-only theme tokens.
- Run typechecking to expose every legacy consumer.

## Task 2: Migrate Button consumers

- Map actions to `default`, `destructive`, `outline`, `secondary`, `ghost`, or `link` by hierarchy.
- Replace legacy sizes and icon-only props with shadcn sizes.
- Remove intent, rounded, tinted, and block props.
- Remove consumer classes that repaint standard buttons.
- Update alert-dialog, dialog-footer, and pagination integrations.

## Task 3: Normalize dropdowns and generic actions

- Remove consumer glass backgrounds, blur, oversized shadows, custom radii, and forced item presentation from dropdowns.
- Keep alignment, width, and selected-state behavior.
- Move generic native error, retry, and dropdown-trigger buttons onto the shared Button.
- Preserve custom domain controls for skin, weapon, item-slot, and specialized selector interactions.

## Task 4: Static verification

- Confirm no removed Button props or variants remain.
- Confirm dropdown presentation overrides are gone.
- Run formatter, lint, typechecks, focused tests, and the production build.
- Fix regressions caused by the migration while preserving unrelated worktree changes.

## Task 5: Browser verification

- Run the app with development mock authentication.
- Check public navigation and inspect actions.
- Check settings, loadout, and weapon action dropdowns.
- Check dialogs and representative skin modals.
- Check authenticated user and available admin controls.
