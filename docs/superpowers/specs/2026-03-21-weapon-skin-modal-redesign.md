# WeaponSkinModal Redesign — Floating Settings Overlay

**Date:** 2026-03-21
**Status:** Approved
**Component:** `app/components/modal/WeaponSkinModal.vue`

## Summary

Redesign the WeaponSkinModal to use a floating overlay layout that maximizes the weapon preview area, compacts the sticker/keychain slots, tightens settings spacing, and replaces pagination with infinite scroll. The Visual Customizer (InlineVisualCustomizer) is integrated directly into the modal via an in-place morph transition.

## Current Problems

- Weapon preview and settings split 50/50 in a two-column grid — wastes space
- Sticker slots are oversized (~100px wide rectangles) for what are essentially square thumbnails
- Keychain slot is isolated in its own column, wasting a full grid row
- Settings controls (StatTrak, wear, paint index, seed) are spread vertically with excessive spacing
- Duplicate button has no background, looks unfinished
- Skin grid is limited to 5 columns with pagination
- Visual Customizer is a separate full-replacement mode with no smooth transition

## Design

### Layout: Floating Settings Overlay

The modal layout changes from a two-column grid to a full-width weapon preview with floating panels:

- **Weapon preview**: Full modal width, taking up the top ~50% of the modal
- **Settings panel**: Frosted-glass floating panel (top-right of preview area, `~175px` wide), always visible
- **Sticker + keychain bar**: Compact floating bar (bottom-left of preview area), 28px square slots
- **Skin grid**: Full-width below the preview, 6 columns, infinite scroll (no pagination)

#### Settings Panel Contents

Vertically stacked in a compact frosted-glass panel (`background: rgba(18,18,18,0.92)`, `backdrop-filter: blur(12px)`, `border: 1px solid rgba(255,255,255,0.07)`):

1. StatTrak toggle + count input
2. Wear value display + wear slider bar
3. Paint Index input (with override toggle)
4. Paint Seed input
5. Name Tag input
6. Active toggle
7. "Duplicate to Other Team" button — styled with dark background + border

**Positioning constraint**: The weapon preview canvas/video should render the weapon image with a right-side padding equal to the settings panel width + margin (~200px). This ensures the weapon renders left-aligned within the remaining space, and the settings panel floats over the empty right area. The panel is positioned with `position: absolute; top: 12px; right: 12px;`. This approach avoids dynamic collision detection — the weapon simply never renders under the panel.

**Frosted-glass styling** (shared by all floating panels — settings, sticker bar, wear slider, canvas toolbar, detail panel): `background: rgba(18,18,18,0.92)`, `backdrop-filter: blur(12px)`, `border: 1px solid rgba(255,255,255,0.07)`, `border-radius: 8px`, `box-shadow: 0 6px 24px rgba(0,0,0,0.5)`.

**Z-index stacking** (highest to lowest): detail panel (State 4) > settings panel > sticker bar > canvas toolbar > wear slider. In practice these panels don't overlap due to their fixed corner positions, but the z-index order resolves any edge cases.

**Magic wand button (✨)**: Positioned `top: 8px; left: 8px` on the weapon preview, 28×28px, same frosted-glass styling but smaller. Existing `.visual-customizer-overlay` styles apply.

#### Sticker + Keychain Bar

Horizontal bar with:

- 5 sticker slots (28×28px, square)
- Vertical divider
- 1 keychain slot (28×28px)

Filled slots: solid border (`border-color: var(--selection-ring)`).
Empty slots: dashed border (`border-color: #444`).

#### Skin Grid

- 6 columns at full width, responsive: 4 columns below 1024px, 3 columns below 768px
- Infinite scroll replaces pagination:
  - Batch size: same as current `PAGE_SIZE` (from `useItemModal`)
  - Scroll threshold: trigger load when user is within 200px of the bottom
  - Loading state: skeleton card placeholders (1 row) at the bottom while loading
  - Error state: inline "Failed to load, tap to retry" message below last loaded row
  - Strategy: offset-based (increment offset by batch size, reuse existing `fetchSkins` with offset param)
  - End-of-list: no indicator, simply stop loading when no more results returned
- Sort controls and rarity filter dots above the grid
- New rows fade in + slide up on load

### State Machine

The modal has 4 states:

```text
                         click filled sticker slot
┌─────────────┐  (single click on filled slot)  ┌──────────────────┐
│  1. Browse   │ ─────────────────────────────► │ 2. Sticker Edit  │
│              │ ◄───────────────────────────── │    (inline bar)   │
└──────┬───────┘  click outside / Esc / ✕       └──────┬───────────┘
       │                                               │
       │ click ✨ wand                                  │ click ✨ wand in bar
       ▼                                               ▼
┌─────────────┐  click sticker on canvas  ┌──────────────────┐
│ 3. Canvas    │ ────────────────────────► │ 4. Canvas +      │
│  (customizer)│ ◄──────────────────────── │   Sticker Selected│
└──────────────┘  click canvas bg          └──────────────────┘
       │
       │ Exit Customizer
       ▼
┌─────────────┐
│  1. Browse   │
└─────────────┘

Note: Clicking an EMPTY sticker slot opens StickerModal (unchanged behavior).
```

**Clarification on sticker slot interactions from State 1:**

- **Click a filled sticker slot** → State 2 (inline bar edit). This is the quick-edit path for adjusting wear/scale/rotation without leaving browse mode.
- **Click the ✨ magic wand button** → State 3 (canvas). This is for positioning stickers on the weapon.
- From State 2, a secondary ✨ button in the expanded bar lets you jump into canvas mode (State 3/4) with that sticker pre-selected.

### State 1: Browse Mode (Default)

- Full-width weapon preview (video canvas or static image)
- Floating settings panel (top-right), always visible
- Floating sticker/keychain bar (bottom-left), compact
- Magic wand button (✨) on the preview (top-left) to enter Visual Customizer
- 6-column infinite scroll skin grid below
- Sort/rarity filter controls above grid

### State 2: Sticker Inline Edit

Triggered by clicking a sticker slot in the bar.

- The sticker bar expands to full width of the preview area
- A vertical divider appears after the keychain slot
- Expanded section shows:
  - Sticker thumbnail (32×32px)
  - Sticker name
  - Inline wear / scale / rotation values
  - "Change" and "Remove" buttons
- A small ✨ button at the end of the expanded controls lets the user jump into the Visual Customizer with this sticker pre-selected
- Active slot gets a cyan glow (`border-color: #22d3ee`, `box-shadow: 0 0 8px rgba(34,211,238,0.3)`)
- Clicking outside the bar, pressing Escape, or clicking ✕ collapses back to State 1
- If an empty slot is clicked, open the StickerModal (existing behavior)
- "Change" button opens StickerModal pre-loaded for that slot position (existing behavior)
- "Remove" button clears the sticker from that slot and collapses the bar back to State 1
- The expanded bar floats over the weapon preview (does not push content down)

### State 3: Visual Customizer (Canvas)

Triggered by clicking the ✨ magic wand button.

- Weapon preview area morphs into the InlineVisualCustomizer canvas
- Canvas takes the full width and expands vertically (absorbing the skin grid area)
- Skin grid fades out and is hidden
- Floating settings panel is hidden (settings not relevant in canvas mode)
- Sticker bar is hidden (stickers are now on the canvas)
- Header bar changes: action buttons replaced with "Exit Customizer" (red) + "Save" (accent)
- Floating wear slider (top-left of canvas)
- Floating hint toolbar (bottom-center): "Click stickers to select, drag to reposition"
- Empty sticker/keychain slot indicators shown on canvas (existing behavior)

### State 4: Canvas + Sticker Selected

Triggered by clicking a sticker element on the canvas, OR by clicking a sticker slot from State 1 (which enters the customizer with that sticker pre-selected).

- Selected sticker shows selection handles (4 corner squares) with dashed ring
- Floating detail panel (top-right): sticker thumbnail, name, position, scale, rotation, wear
- Bottom toolbar morphs to include controls: Scale (−/+), Rotation (↺/↻), Wear value, Remove, Change
- Click canvas background to deselect → return to State 3
- Drag sticker to reposition
- Scroll wheel to scale

### Entry Points to Visual Customizer

Two entry paths:

1. **Magic wand button (✨)** from State 1 or State 2: Opens canvas in State 3 (no sticker pre-selected)
2. **✨ button in the expanded sticker bar** (State 2): Opens canvas in State 3/4 with that sticker pre-selected on the canvas

The direct sticker-slot-to-canvas path (State 1 → State 4) from the original brainstorm was removed to avoid ambiguity. Sticker slot click always means inline edit (State 2), and the canvas is always entered via a ✨ button.

### History Panel

The History button remains in the header bar (all states). Clicking it opens `LazyItemHistoryPanel` as a slide-in sidebar panel from the right (existing behavior, unchanged). In canvas states (3/4), the history panel overlays the canvas. No changes to history panel internals.

### Keyboard Shortcuts

Existing shortcuts preserved, no new shortcuts added:

- `1-5` → Open sticker slot (triggers State 2 for filled slots, StickerModal for empty)
- `R` → Reset (with confirmation)
- `D` → Duplicate (with confirmation)
- `Escape` → In State 2: collapse bar. In States 3/4: exit customizer. In State 1: close modal

## Animation Specification

| Transition | Animation | Duration / Easing |
| --- | --- | --- |
| Modal open | Floating panels: opacity 0→1 + translateY(8px→0). Grid cards stagger in per row | 200ms ease-out, 30ms stagger per card |
| Sticker slot click (→ State 2) | Bar width expands. Inline controls fade in. Active slot gets cyan glow pulse | 250ms ease-out (width), 150ms (fade), continuous pulse |
| Sticker bar collapse (→ State 1) | Controls fade out, bar shrinks. Glow fades | 200ms ease-in |
| Enter Visual Customizer (→ State 3) | Preview morphs into canvas (border dissolves, height expands). Grid slides down + fades. Stickers animate from slot positions to canvas positions via bezier arc | 400ms (morph), 300ms (grid fade), 200ms stagger (sticker scatter) |
| Enter from State 2 (→ State 3/4) | Sticker bar collapses (200ms), then same morph transition as above. If sticker was being edited, it is pre-selected on canvas after morph completes | 200ms (bar collapse) + 400ms (morph) |
| Select sticker on canvas (→ State 4) | Selection ring draws with dash animation (stroke-dashoffset). Corner handles pop in (scale 0→1). Toolbar morphs wider. Detail panel slides in from right | 200ms each |
| Exit Customizer (→ State 1) | Reverse of enter: stickers fly back to slots, canvas shrinks to preview, grid fades in from below | 350ms (reverse morph), 250ms (grid) |
| Infinite scroll load | New row fades in + slides up (translateY 12px→0) | 200ms ease-out |
| Skin card select | Weapon preview crossfades to new skin. Card gets selection ring | 300ms crossfade |

## Files to Modify

### Primary

- `app/components/modal/WeaponSkinModal.vue` — Main layout restructure, state machine, floating panels, infinite scroll

### Secondary

- `app/composables/useItemModal.ts` — Replace pagination with infinite scroll (offset-based loading)
- `app/components/inspect/WearSlider.vue` — May need compact variant for floating panel
- `app/utils/themeCustomization.ts` — Update modal theme overrides if needed

### No Changes Expected

- `app/components/inspect/InlineVisualCustomizer.vue` — Already works as embedded component, just needs proper transition in/out
- `app/components/modal/StickerModal.vue` — Still opened the same way (from sticker slot click on empty slot or "Change" button)
- `app/components/modal/KeychainModal.vue` — Same, opened from keychain slot click

## Acceptance Criteria

1. **Weapon preview is full modal width** — no two-column split with settings
2. **Settings panel floats** over the preview area (top-right) without overlapping the weapon image
3. **Sticker slots are 28×28px squares** in a compact horizontal bar (bottom-left)
4. **Sticker bar expands inline** when a slot is clicked, showing wear/scale/rotation controls
5. **Visual Customizer** opens in-place (morph transition) via magic wand or sticker click
6. **Skin grid uses 6 columns** with infinite scroll (no pagination)
7. **Duplicate button** has a dark background + border styling
8. **All transitions** follow the animation spec (durations, easings)
9. **Settings panel never obscures** the rendered weapon skin
10. **Existing functionality preserved**: auto-save, keyboard shortcuts, drag-and-drop sticker reorder, inspect link import/export, history panel

## Out of Scope

- StickerModal internals — opened the same way, no changes
- KeychainModal internals — opened the same way, no changes
- InlineVisualCustomizer internals — canvas rendering, drag logic, coordinate transforms unchanged
- API endpoints — no backend changes
- KnifeSkinModal / GloveSkinModal — separate components, not part of this redesign
- Mobile-specific layouts beyond responsive column adjustments (no dedicated mobile design)
