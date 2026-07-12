# WeaponSkinModalV2 — Full Rewrite with Integrated Canvas Editor

**Date:** 2026-03-22
**Status:** Approved
**Component:** `app/components/modal/WeaponSkinModalV2.vue` (new, drop-in replacement)

## Summary

Complete rewrite of the WeaponSkinModal as a standalone V2 component. Replaces Naive UI's NModal with a custom modal shell. Integrates the InlineVisualCustomizer's canvas rendering directly — the weapon preview IS the canvas at all times, with stickers/keychains rendered on it and directly editable (drag, scale, rotate). No separate "customizer mode."

## Goals

1. **Custom modal** — No NModal dependency. Own backdrop, focus trap, scroll lock, morph transition
2. **Always-on canvas** — HTML5 Canvas 2D renders weapon + stickers at all times (same engine as InlineVisualCustomizer)
3. **Direct sticker editing** — Click sticker on canvas to select, drag to reposition, scroll to scale. No mode switching
4. **Drop-in replacement** — Same props/emits interface so parent can swap `<WeaponSkinModal>` → `<WeaponSkinModalV2>`
5. **Decomposed architecture** — Logic split across focused files instead of one 2000-line SFC

## Design

### Custom Modal Shell

The modal shell provides everything NModal currently does:

- **Backdrop**: Fixed overlay (`background: rgba(0,0,0,0.6)`), click-to-close
- **Scroll lock**: `document.body.style.overflow = 'hidden'` while open
- **Focus trap**: Tab cycling within modal boundaries
- **Escape to close**: Keydown listener on the modal wrapper
- **X button**: Close button in the header
- **Sizing**: `max-width: 1800px; width: 95vw`, centered with `margin: auto`
- **Styling**: Glassmorphism card (`background: var(--glass-bg-primary)`, `border-radius: 24px`, multi-layer box shadow)

#### Morph Open/Close Animation

Modal uses a FLIP (First-Last-Invert-Play) animation that morphs from the weapon card that was clicked:

1. **Open**: Parent passes `triggerRect` prop (bounding rect of clicked weapon card via `getBoundingClientRect()`). Modal interpolates from `triggerRect` position/size → final modal position/size. Border-radius interpolates `12px → 24px`. Backdrop fades in simultaneously.
2. **Close**: Reverse — modal shrinks back to `triggerRect`. Backdrop fades out.
3. **Fallback**: If `triggerRect` is not provided, fall back to center scale+fade animation (scale 0.95→1, opacity 0→1).

**Timing**: 400ms `cubic-bezier(0.4, 0, 0.2, 1)` for morph, 300ms for backdrop.

### Layout Structure

```
┌─────────────────────────────────────────────────┐
│ Header: Title + Team Badge │ Reset History Import Link [Search] [✕] │
├─────────────────────────────────────────────────┤
│                                                 │
│  Canvas (full width, ~400px height)             │
│  ┌─────────────────────────────────────┐        │
│  │  🔫 Weapon + stickers rendered      │ [Settings]
│  │  on HTML5 Canvas 2D                  │ [Panel  ]
│  │                                      │ [220px  ]
│  │  [S1][S2][S3][+][+] | [+]           │        │
│  └─────────────────────────────────────┘        │
│                                                 │
├─ Toolbar (only when sticker selected) ──────────┤
│ [🦅 NiP Holo] │ Scale −1.0+ │ Rot ↺0°↻ │ Wear │ Change │ Remove │
├─────────────────────────────────────────────────┤
│ Sort: Name ↑   │   ● Covert ● Classified ● ... │
├─────────────────────────────────────────────────┤
│ ┌──┐ ┌──┐ ┌──┐ ┌──┐ ┌──┐                      │
│ │  │ │  │ │  │ │  │ │  │  5-col skin grid      │
│ └──┘ └──┘ └──┘ └──┘ └──┘  infinite scroll      │
│ ┌──┐ ┌──┐ ┌──┐ ┌──┐ ┌──┐                      │
│ │  │ │  │ │  │ │  │ │  │                        │
│ └──┘ └──┘ └──┘ └──┘ └──┘                        │
└─────────────────────────────────────────────────┘
```

### Canvas Preview (Always-On)

The weapon preview is an HTML5 Canvas 2D element — the same rendering engine as InlineVisualCustomizer:

- **Weapon rendering**: `VideoCanvasManager` renders video frames (wear-based) or static image fallback
- **Sticker rendering**: All placed stickers drawn on canvas with position, scale, rotation transforms
- **Keychain rendering**: Keychain drawn at its position on canvas
- **Empty slot indicators**: Dashed circles with slot numbers ("1"-"5", "K") at default positions for unfilled slots
- **Canvas sizing**: Full modal width minus settings panel padding (`pr-[240px]`), ~400px height
- **DPI-aware**: Canvas backing buffer scaled to `devicePixelRatio` for sharp rendering

**Coordinate system**: Same as InlineVisualCustomizer — normalized 0-1 coordinates for positions, with weapon-specific defaults from `canvasCoordinates.ts`.

**Canvas padding**: Right side padded to avoid overlap with the floating settings panel. The weapon image renders within the padded area, settings panel floats over the empty right portion.

### Interaction Model

#### State Machine

Only 2 states — no mode switching:

```
┌──────────────┐  click sticker on canvas  ┌─────────────────┐
│  1. Browse    │ ────────────────────────► │ 2. Editing       │
│  (default)    │ ◄──────────────────────── │ (sticker selected)│
└──────────────┘  click canvas bg / Escape  └─────────────────┘
```

#### State 1: Browse (Default)

- Canvas renders weapon + all placed stickers/keychains
- Floating settings panel visible (top-right)
- Sticker/keychain bar visible (bottom-left of canvas)
- Skin grid visible below canvas with sort/filter controls
- No editing toolbar

**Interactions:**
- Click a sticker/keychain on canvas → State 2 (select it)
- Click an empty slot indicator on canvas → Open StickerModal/KeychainModal
- Click a sticker slot in the bar → If filled: State 2 (select on canvas). If empty: Open StickerModal
- Click a keychain slot in the bar → Open KeychainModal
- Click a skin card → Change weapon skin (canvas re-renders)
- Drag stickers in the bar → Reorder slots (existing drag-and-drop)

#### State 2: Editing (Sticker/Keychain Selected)

- Selected element highlighted with yellow dashed ring + 4 corner handles
- Corresponding slot in the sticker bar highlighted with cyan glow
- Editing toolbar visible between canvas and skin grid
- Skin grid still visible below

**Interactions:**
- **Drag** selected element on canvas → Reposition (real-time re-render)
- **Scroll wheel** over canvas → Scale selected element (clamped 0.1–2.0)
- **Arrow keys** → Fine-grained position adjustment (±0.005, ±0.0005 with Shift)
- **Toolbar controls** → Scale ±0.1, Rotation ±5°, Wear slider
- **"Change" button** → Open StickerModal pre-loaded for that slot
- **"Remove" button** → Remove sticker, exit to State 1
- **Click canvas background** → Deselect, return to State 1
- **Escape** → Deselect, return to State 1
- **Click another sticker** → Switch selection to that sticker (stay in State 2)

### Floating Settings Panel

Frosted-glass panel (`background: rgba(18,18,18,0.92)`, `backdrop-filter: blur(12px)`) positioned `top: 12px; right: 12px; width: 220px` on the canvas area. Always visible in both states.

Contents (vertically stacked, compact):
1. StatTrak toggle + count input (conditional)
2. WearSlider (shows value internally, no separate text display)
3. Paint Index toggle + input
4. Paint Seed input
5. Name Tag input (20 char max)
6. Active toggle
7. "Duplicate to Other Team" button (styled, dark bg + border, conditional on `availableTeams === 'both'`)

### Sticker/Keychain Bar

Floating bar at `bottom: 12px; left: 12px` on the canvas area. Same frosted-glass styling.

- 5 sticker slots (28×28px squares) + vertical divider + 1 keychain slot
- Filled: solid border (`var(--selection-ring)`), sticker image inside
- Empty: dashed border (`#444`), "+" text
- Active (State 2): cyan glow border + shadow
- Drag-and-drop between slots to reorder

### Editing Toolbar

Appears between canvas and skin grid when a sticker/keychain is selected in State 2. Pushes the grid down (not overlaying it).

Frosted-glass background, horizontal layout:
- Sticker thumbnail (24×24px) + name
- Separator
- Scale: − / value / + buttons
- Rotation: ↺ / value / ↻ buttons
- Wear: value display
- Position: x, y coordinates
- Separator
- "Change" button (opens StickerModal)
- "Remove" button (red, removes element)

### Skin Grid

Below the canvas (and toolbar if visible). Full modal width.

- 5 columns, responsive (3 on small screens, 4 on medium)
- Infinite scroll (2 rows initially, load more on scroll via `useInfiniteScroll`)
- Sort controls: Name / Rarity dropdown + direction toggle
- Rarity filter: colored dots, click to toggle
- Card styling: gradient background with rarity color, selection ring on active skin

### Header

Custom header bar (not NModal slot):
- Left: Weapon name + team badge (T/CT) + save status indicator
- Right: Reset, History, Import from Link, Generate Link buttons + search input + close (✕) button

### Keyboard Shortcuts

Preserved from V1:
- `Escape` → In State 2: deselect. In State 1: close modal
- `1-5` → Select sticker slot (filled: select on canvas, empty: open StickerModal)
- `R` → Reset (with confirmation)
- `D` → Duplicate (with confirmation)
- Arrow keys → Fine-adjust selected sticker position (State 2 only)

### Auto-Save

Same as V1 — `useAutoSave` composable with 1500ms debounce. Saves on any customization change.

## File Architecture

### New Components

```
app/components/modal/
├── WeaponSkinModalV2.vue              # Orchestrator — props/emits, state machine, ties everything together
└── weapon-skin-v2/
    ├── ModalShell.vue                 # Custom modal: backdrop, focus trap, scroll lock, morph transition
    ├── CanvasPreview.vue              # HTML5 Canvas 2D rendering + mouse/touch interaction
    ├── FloatingSettings.vue           # Settings panel overlay (StatTrak, wear, paint, nametag, etc.)
    ├── StickerBar.vue                 # Compact sticker/keychain slot bar
    ├── EditToolbar.vue                # Sticker editing controls (scale, rot, wear, change, remove)
    └── SkinGrid.vue                   # Infinite scroll skin card grid with sort/filter
```

### New Composables

```
app/composables/
├── useModalShell.ts                   # Backdrop, scroll lock, focus trap, escape handler, morph animation
├── useCanvasRenderer.ts               # Canvas 2D rendering: weapon image/video + stickers + slots + selection ring
└── useCanvasInteraction.ts            # Hit testing, element selection, drag, scale (scroll), arrow-key adjust
```

### Reused (No Changes)

```
app/utils/canvasCoordinates.ts         # Coordinate transforms, asset sizes, sticker↔canvas converters
app/utils/videoCanvas.ts               # VideoCanvasManager for video frame rendering
app/types/canvas.ts                    # CanvasElement, CanvasState types
app/composables/useItemModal.ts        # Skin fetching, sort, filter, infinite scroll state
app/composables/useInfiniteScroll.ts   # IntersectionObserver sentinel
app/composables/useAutoSave.ts         # Debounced auto-save
app/components/modal/StickerModal.vue  # Opened as overlay when adding/changing stickers
app/components/modal/KeychainModal.vue # Opened as overlay when adding keychains
app/components/modal/InspectURLModal.vue
app/components/modal/DuplicateItemModal.vue
app/components/modal/ResetModal.vue
app/components/inspect/WearSlider.vue
```

### Drop-in Replacement Strategy

`WeaponSkinModalV2` exposes the same props/emits interface as `WeaponSkinModal`:

```typescript
interface Props {
  visible: boolean
  weapon: WeaponDefinition
  team: TeamNumber
  loadoutId: string
  pageSize?: number
  triggerRect?: DOMRect  // NEW — bounding rect of clicked card for morph animation
}

interface Emits {
  'update:visible': [value: boolean]
  'saved': []
}
```

Parent component swaps `<WeaponSkinModal>` → `<WeaponSkinModalV2>` and passes `triggerRect` from the click event. V1 stays in the codebase until V2 is validated.

## Animation Specification

| Transition | Animation | Duration / Easing |
|---|---|---|
| Modal open | FLIP morph from `triggerRect` → modal rect. Backdrop opacity 0→0.6. Border-radius 12px→24px | 400ms cubic-bezier(0.4,0,0.2,1), backdrop 300ms |
| Modal close | Reverse FLIP: modal → `triggerRect`. Backdrop fades out | 350ms, backdrop 250ms |
| Modal open (no triggerRect) | Scale 0.95→1 + opacity 0→1, centered. Backdrop fades in | 300ms ease-out |
| Sticker select (→ State 2) | Selection ring dash-offset animation. Corner handles scale 0→1. Toolbar slides in (translateY) | 200ms each |
| Sticker deselect (→ State 1) | Ring fades, handles shrink, toolbar slides out | 150ms |
| Sticker drag | Real-time canvas re-render at pointer position (60fps). Subtle drop shadow under element | Immediate |
| Skin card select | Canvas crossfades weapon image. Card gets selection ring | 300ms crossfade |
| Infinite scroll load | New row fade-in + translateY(12px→0) | 200ms ease-out, 30ms stagger |
| Settings change | Canvas re-renders immediately (wear slider → video frame update) | Immediate |

## Acceptance Criteria

1. **No NModal dependency** — modal is fully custom (ModalShell.vue)
2. **Canvas always renders** weapon + stickers — no separate "preview" vs "customizer" mode
3. **Direct sticker editing** — click to select, drag to move, scroll to scale, toolbar for controls
4. **Morph animation** — modal opens/closes by morphing from/to the trigger card
5. **Drop-in replacement** — same props/emits as WeaponSkinModal (plus optional `triggerRect`)
6. **File decomposition** — no single file exceeds ~500 lines
7. **All V1 features preserved** — auto-save, keyboard shortcuts, sticker drag-reorder in bar, inspect link import/export, history panel, sort/filter, rarity dots
8. **Floating settings panel** always visible, never overlaps weapon image
9. **Inline toolbar** appears between canvas and grid when sticker is selected
10. **5-column infinite scroll** grid with 2 initial rows
11. **Sticker/keychain adding** still uses StickerModal/KeychainModal as overlays
12. **Focus trap, scroll lock, escape-to-close, click-outside-to-close** all work

## Out of Scope

- StickerModal / KeychainModal internals — unchanged
- API endpoints — no backend changes
- KnifeSkinModal / GloveSkinModal — separate components
- Mobile-specific layouts
- Touch gesture support beyond basic tap (pinch-to-zoom etc.)
