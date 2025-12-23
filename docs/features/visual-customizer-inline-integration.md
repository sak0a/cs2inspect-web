# Visual Customizer Inline Integration

## Overview

This document outlines the implementation for integrating the Visual Customizer directly into `WeaponSkinModal.vue`. When the user clicks the "Magic Stick" button, the modal transforms into a focused visual editing mode.

---

## Current Implemented State (v1.0)

### ✅ Completed Features

| Phase | Feature | Status |
|-------|---------|--------|
| 1 | State Management (`inlineVisualCustomizerActive`) | ✅ Done |
| 2 | Template Restructuring (conditional rendering) | ✅ Done |
| 3 | `InlineVisualCustomizer.vue` component created | ✅ Done |
| 4 | Integration with `WeaponSkinModal.vue` | ✅ Done |
| 5 | Quick Settings Panel (basic: +/- Scale, Rotation, Wear, Remove) | ✅ Done |
| 6 | Styling & Transitions | ✅ Done |
| 7 | Translations (en, de, fr, nl, ru, es) | ✅ Done |

### Component Structure

```
WeaponSkinModal.vue
├── Normal Mode (v-if="!inlineVisualCustomizerActive")
│   ├── Skin preview image
│   ├── Customization controls (Paint Index, Pattern, StatTrak, etc.)
│   └── Skin selection grid
└── Visual Customizer Mode (v-else)
    └── InlineVisualCustomizer.vue
        ├── Canvas (weapon background + stickers/keychains)
        ├── Quick Settings Panel (floating, appears on element select)
        └── Footer (Weapon name + WearSlider + Save button)
```

### Files Modified
- `components/WeaponSkinModal.vue` - Added inline mode state and toggle
- `components/InlineVisualCustomizer.vue` - New component (extracted from VisualCustomizerModal)
- `types/business/items.ts` - Updated StickerConfiguration/KeychainConfiguration types
- `types/components/modals.ts` - Added `inlineVisualCustomizerActive` to WeaponModalState
- `locales/*.json` - Added translations for inline visual customizer

---

## Planned Enhancements (v1.1)

Based on user feedback, the following enhancements are planned:

### Enhancement 1: Coordinate Inputs
Add X/Y coordinate number inputs to quick settings (like VisualCustomizerModal):
- Offset units toggle (px / normalized)
- X/Y offset inputs with `NInputNumber`
- External reference width/height inputs (for normalized mode)

### Enhancement 2: Numeric Scale/Rotation
Replace +/- buttons with `NInputNumber` for precise values:
- Scale: 0.1 - 3.0 with step 0.1
- Rotation: 0 - 360 degrees

### Enhancement 3: Glassmorphism Styling
Apply darker/transparent glassmorphism design to quick settings:
- `bg-black/70` with `backdrop-blur-xl`
- Subtle border with `border-white/5`
- Enhanced shadow

### Enhancement 4: Debug Mode
Add development-only debug toggle:
- Coordinate grid overlay on canvas
- Mouse position display
- Yellow-bordered debug button

### Enhancement 5: Dynamic Modal Title
When in visual customizer mode, show:
- Before: "Select Skin for AWP"
- After: "Visual Customizer for AWP | Desert Hydra"

---

## Quick Settings Panel Design

### Current Layout (v1.0)
```
┌─────────────────────────────────────────────────────────────┐
│  Scale  [-][+]  │  Rot  [↺][↻]  │  Wear [━━━━━━]  │ Remove │
└─────────────────────────────────────────────────────────────┘
```

### Target Layout (v1.1)
```
┌───────────────────────────────────────────────────────────────────┐
│  Offset Units: [PX] [EXT]                                          │
├───────────────────────────────────────────────────────────────────┤
│  X: [_____]  Y: [_____]                                            │
├───────────────────────────────────────────────────────────────────┤
│  Scale [-][___][+]  │  Rot [↺][___][↻]  │  Wear [━━━]  │  Remove  │
└───────────────────────────────────────────────────────────────────┘
```

---

## Translation Keys

### Existing Keys
```json
{
  "modals.weaponSkin.visualCustomizer.button": "Visual Customizer",
  "modals.weaponSkin.visualCustomizer.exit": "Exit Editor",
  "modals.weaponSkin.visualCustomizer.inline.title": "Visual Editor",
  "modals.weaponSkin.visualCustomizer.inline.controls.scale": "Scale",
  "modals.weaponSkin.visualCustomizer.inline.controls.rotate": "Rot",
  "modals.weaponSkin.visualCustomizer.inline.controls.wear": "Wear",
  "modals.weaponSkin.visualCustomizer.inline.controls.remove": "Remove"
}
```

### New Keys (v1.1)
```json
{
  "modals.weaponSkin.visualCustomizer.title": "Visual Customizer for {weaponName}",
  "modals.weaponSkin.visualCustomizer.inline.controls.offsetUnits": "Offset Units",
  "modals.weaponSkin.visualCustomizer.inline.controls.offsetX": "X",
  "modals.weaponSkin.visualCustomizer.inline.controls.offsetY": "Y",
  "modals.weaponSkin.visualCustomizer.inline.debug": "Debug"
}
```

---

## Testing Checklist

### v1.0 (Completed)
- [x] Magic Stick button toggles inline visual mode
- [x] Normal mode UI elements hidden in visual mode
- [x] Canvas renders full-width in visual mode
- [x] Wear slider controls video time correctly
- [x] Stickers can be dragged, scaled, rotated
- [x] Clicking sticker shows quick settings panel
- [x] Remove button removes element from canvas
- [x] Save button applies changes to customization
- [x] Exit button returns to normal mode

### v1.1 (Planned)
- [ ] Modal title changes to "Visual Customizer for X | Y" when active
- [ ] Quick settings has glassmorphism styling
- [ ] Scale input allows typing precise values
- [ ] Rotation input allows typing precise values
- [ ] X/Y coordinate inputs work for stickers
- [ ] px/ext toggle switches coordinate modes
- [ ] Debug button only visible in development
- [ ] Coordinate overlay renders when debug enabled
