# Theme Customization Guide

This document explains how colors and theming are structured in the app and how to customize or reset them.

## Overview
The app’s look-and-feel is controlled in two layers:
- CSS variables for app-wide accents (e.g., selection rings, tab indicators)
- Naive UI theme overrides for component-level colors (e.g., primary buttons)

Additionally, we apply a consistent dark modal theme to specific modals via Naive UI theme overrides.

## Key files
- App accent variables: `assets/css/theme-variables.css`
- Naive UI overrides: `components/ThemeProvider.vue`
- Modal dark theme overrides: `server/utils/themeCustomization.ts`

---

## 1) App accent variables (rings, indicators)
File: `assets/css/theme-variables.css`

These control the primary accent used by selection rings and tab indicators:

```css
/* UI element colors */
--tab-indicator: #FACC15;  /* active tab underline/indicator */
--selection-ring: #FACC15; /* cards’ selected ring color */
```

- Change these to any hex to update the accent globally.
- All ring usages now reference `var(--selection-ring)`, so updating the variable will update rings across the app.

Reset to previous default (teal):
```css
--tab-indicator: #80E6C4;
--selection-ring: #80E6C4;
```

Optional: Add more variables (e.g., `--accent-secondary`) if you want to drive gradients or hover glows from centralized tokens.

---

## 2) Naive UI primary color (buttons, primary states)
File: `components/ThemeProvider.vue`

We override Naive UI’s primary palette:

```ts
common: {
  primaryColor: '#FACC15',
  primaryColorHover: '#F59E0B',
  primaryColorPressed: '#CA8A04',
  primaryColorSuppl: '#EAB308'
},
```

- These affect `type="primary"` components (buttons, tags, focus states, etc.).
- Tweak these shades to your brand palette.

Reset to Naive UI defaults:
- Remove the four `common.*` lines above. Naive’s dark theme defaults will take over.

Reset to previous accent (teal family):
- Replace the four values with your teal shades.

---

## 3) Dark modal theme (uniform look across modals)
File: `server/utils/themeCustomization.ts`

We export `skinModalThemeOverrides` and pass it to modals:

```ts
export const skinModalThemeOverrides = {
  peers: { Card: { borderRadius: '20px', colorModal: '#101010' } }
}
```

Usage in components:
```vue
<NModal :theme-overrides="skinModalThemeOverrides" .../>
```

This ensures all targeted modals share the same darker appearance and rounded corners.

---

## 4) Where the accent is used (already converted)
These components’ selected states now use `var(--selection-ring)`:
- Weapon skins: `components/WeaponSkinModal.vue`
- Knife skins: `components/KnifeSkinModal.vue`
- Glove skins: `components/GloveSkinModal.vue`
- Agents: `components/AgentTabs.vue`
- Pins: `components/PinTabs.vue`
- Music kits: `components/MusicKitTabs.vue`
- Stickers: `components/StickerModal.vue`
- Keychains: `components/KeychainModal.vue`
- Visual customizer canvas selection overlays: `components/VisualCustomizerModal.vue`

If you add new selected states, prefer:
```html
<div class="ring-2 ring-[var(--selection-ring)]">...</div>
```

---

## 5) Canvas and programmatic usage of the accent
Some drawing logic (e.g., selection outlines on canvas) should read the CSS variable at runtime:

```ts
const accent = getComputedStyle(document.documentElement)
  .getPropertyValue('--selection-ring')
  .trim() || '#FACC15'
ctx.strokeStyle = accent
ctx.fillStyle = accent
```

This keeps programmatic drawings in sync with your CSS variable.

---

## 6) Runtime switching (optional)
You can switch the accent dynamically (e.g., from a settings page) without editing files:

```js
document.documentElement.style.setProperty('--selection-ring', '#FACC15')
document.documentElement.style.setProperty('--tab-indicator', '#FACC15')
```

Persist user choice:
```js
// On change
localStorage.setItem('accent', '#FACC15')
// On load
const saved = localStorage.getItem('accent')
if (saved) {
  document.documentElement.style.setProperty('--selection-ring', saved)
  document.documentElement.style.setProperty('--tab-indicator', saved)
}
```

---

## 7) How to reset
Choose one of the following based on what you want to undo:

- Reset accent variables (rings/indicators) back to teal:
  - Edit `assets/css/theme-variables.css` and set both `--selection-ring` and `--tab-indicator` to `#80E6C4`.

- Reset Naive UI’s primary color to defaults:
  - In `components/ThemeProvider.vue`, remove the four `common.primaryColor*` overrides.

- Reset dark modals to framework defaults:
  - Remove `:theme-overrides="skinModalThemeOverrides"` from the modals you want to revert.

---

## 8) Tips and best practices
- Prefer CSS variables over hard-coded hex values for anything “accent-like”.
- For Tailwind rings/borders, use arbitrary values referencing variables: `ring-[var(--selection-ring)]`, `border-[var(--selection-ring)]`.
- Keep brand shades together: define additional variables (e.g., `--accent`, `--accent-hover`, `--accent-pressed`) if you need more control outside of Naive UI.
- When adjusting Naive UI tokens, keep hover/pressed/supplement shades consistent for accessibility and visual feedback.

---

## Related docs
- Sticker slot authoring: `docs/StickerSlots.md`

