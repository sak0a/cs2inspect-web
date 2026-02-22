# Interactive Tutorial System

## Overview

CS2Inspect includes an interactive tutorial system that guides users through the application's features using a step-by-step spotlight overlay. Tutorials highlight UI elements with an SVG mask-based spotlight, display descriptive popovers, and can programmatically open modals to demonstrate features inside them.

## Architecture

The tutorial system is composed of the following parts:

| File | Purpose |
|------|---------|
| `types/tutorial.ts` | TypeScript types for steps and definitions |
| `stores/tutorialStore.ts` | Pinia store managing tutorial state |
| `composables/useTutorial.ts` | Composable exposing tutorial controls |
| `utils/tutorialDefinitions.ts` | Declarative tutorial definitions |
| `components/tutorial/TutorialOverlay.vue` | SVG spotlight overlay + step lifecycle |
| `components/tutorial/TutorialPopover.vue` | Popover UI with navigation buttons |
| `assets/css/tutorial.css` | Glassmorphism styles and animations |

### Data Flow

```
tutorialDefinitions.ts          (step definitions + hooks)
        |
        v
tutorialStore.ts                (state: active tutorial, step index, pendingAction)
        |
        v
TutorialOverlay.vue             (finds target element, scrolls, highlights, runs hooks)
        |
        v
TutorialPopover.vue             (renders step info, navigation buttons)
```

## Types

### TutorialStep

```typescript
interface TutorialStep {
  titleKey: string              // i18n key for the step title
  descriptionKey: string        // i18n key for the step description
  target: string                // data-tutorial attribute value to locate the element
  popoverPosition: PopoverPosition  // 'top' | 'bottom' | 'left' | 'right' | 'auto'
  type: StepType                // 'info' | 'action'
  actionTrigger?: string        // for action steps: the expected user action (e.g. 'click')
  requiredRoute?: string        // route the user must be on
  beforeStep?: () => Promise<void> | void  // runs before step activates
  afterStep?: () => Promise<void> | void   // runs after advancing from step
  spotlightPadding?: number     // extra padding around spotlight (default: 8)
  scrollBlock?: ScrollLogicalPosition      // scrollIntoView block option (default: 'center')
}
```

### TutorialDefinition

```typescript
interface TutorialDefinition {
  id: string                    // unique identifier
  nameKey: string               // i18n key for tutorial name
  descriptionKey: string        // i18n key for description
  startRoute: string            // route to navigate to when starting
  steps: TutorialStep[]         // ordered list of steps
  requiresAuth?: boolean        // only show if user is authenticated
}
```

## Available Tutorials

### 1. Navigate App (`navigate-app`)

**Auth required**: No
**Start route**: `/weapons/rifles`
**Steps**: 6

Introduces the main UI layout: sidebar navigation, settings dropdown, loadout area, weapon cards, team tabs (CT/T), and a ready prompt.

### 2. Customize a Weapon (`customize-weapon`)

**Auth required**: Yes
**Start route**: `/weapons/rifles`
**Steps**: 16

Full walkthrough of the weapon customization modal. Programmatically opens the `WeaponSkinModal` by clicking the first weapon card, then guides through every feature:

1. Weapon grid overview
2. Click a weapon card (action step)
3. Search bar
4. Sort & filter controls
5. Skin gallery grid
6. Pagination buttons
7. Wear slider (float value + live image preview)
8. Paint index override
9. Active/inactive toggle
10. Sticker slots (drag & drop)
11. Keychain slot
12. Reset button
13. Version history
14. Import inspect link
15. Generate inspect link
16. Auto-save indicator

**Modal lifecycle**: Steps 1-2 have `beforeStep` hooks that close the modal (for back-navigation). Step 2's `afterStep` and step 3's `beforeStep` open the modal. When the tutorial stops (ESC/Skip), a watcher in `pages/weapons/[type].vue` auto-closes the modal.

### 3. Inspect Link Tool (`inspect-link`)

**Auth required**: No
**Start route**: `/`
**Steps**: 4

Covers the inspect link input, decode button, JSON editor, and generate button.

### 4. Create Loadout (`create-loadout`)

**Auth required**: Yes
**Start route**: `/weapons/rifles`
**Steps**: 4

Demonstrates loadout management: selector, create button, name input (opens modal via `beforeStep`), and completion (closes modal via `beforeStep`).

## Key Features

### Element Targeting via `data-tutorial`

Every targetable element has a `data-tutorial` attribute:

```html
<div data-tutorial="skin-grid">...</div>
```

The overlay finds elements with `document.querySelector('[data-tutorial="skin-grid"]')`. If the element isn't in the DOM yet (e.g. inside a modal that hasn't opened), it polls with `requestAnimationFrame` for up to 3 seconds.

### SVG Spotlight Overlay

The overlay uses an SVG mask to create a dark backdrop with a rectangular cutout around the target element, highlighted with a yellow (#FACC15) border. The cutout rectangle updates on scroll, resize, and when the element's size changes (via `ResizeObserver`).

### Auto-Scroll

When a step activates, the target element is scrolled into view:

```typescript
el.scrollIntoView({ behavior: 'smooth', block: step.scrollBlock ?? 'center' })
```

The `scrollBlock` option allows per-step control. For example, the wear slider uses `scrollBlock: 'end'` to position the element at the bottom of the viewport, leaving room above for a `'top'`-positioned popover.

### Programmatic Modal Control (`pendingAction`)

Some tutorials need to open or close modals to reach elements inside them. This is handled through a store-based action pattern:

1. **Tutorial definition** calls `requestAction('open-weapon-modal')` in a `beforeStep` or `afterStep` hook
2. **`tutorialStore.pendingAction`** is set to the action string
3. **Component watcher** (in `pages/weapons/[type].vue` or `LoadoutSelector.vue`) detects the action, performs it (e.g. clicks a weapon card, opens a modal), and calls `clearAction()`

Available actions:

| Action | Component | Effect |
|--------|-----------|--------|
| `open-weapon-modal` | `pages/weapons/[type].vue` | Clicks first `.weapon-card` to open WeaponSkinModal |
| `close-weapon-modal` | `pages/weapons/[type].vue` | Closes WeaponSkinModal |
| `open-loadout-create` | `LoadoutSelector.vue` | Opens the create loadout modal |
| `close-loadout-create` | `LoadoutSelector.vue` | Closes the create loadout modal |

### Step Lifecycle Hooks

- **`beforeStep`**: Runs before the step becomes active. Used to open/close modals or navigate. The overlay waits for the hook to complete before finding and highlighting the target element.
- **`afterStep`**: Runs after advancing from a step (both forward and backward). Used to trigger side effects like opening a modal after a click step.

### Action Steps

Steps with `type: 'action'` listen for user interaction on the target element. When the user clicks the highlighted element, the tutorial auto-advances after 300ms. The Next button is also available as a fallback.

### Completion Persistence

Completed tutorial IDs are stored in `localStorage` under `cs2inspect_tutorial_completions`. The settings menu shows a checkmark next to completed tutorials.

## Adding a New Tutorial

### 1. Define the tutorial

Add a new entry to the `tutorials` array in `utils/tutorialDefinitions.ts`:

```typescript
{
  id: 'my-tutorial',
  nameKey: 'tutorial.myTutorial.name',
  descriptionKey: 'tutorial.myTutorial.description',
  startRoute: '/weapons/rifles',
  requiresAuth: false,
  steps: [
    {
      titleKey: 'tutorial.myTutorial.steps.first.title',
      descriptionKey: 'tutorial.myTutorial.steps.first.description',
      target: 'my-element',
      popoverPosition: 'bottom',
      type: 'info',
    },
  ],
}
```

### 2. Add `data-tutorial` attributes

Mark the target elements in your templates:

```html
<div data-tutorial="my-element">...</div>
```

### 3. Add i18n translations

Add the translation keys to all 6 locale files (`en.json`, `de.json`, `ru.json`, `fr.json`, `es.json`, `nl.json`) under the `tutorial` section.

### 4. Handle modals (if needed)

If steps target elements inside modals:

1. Add a new action to `TutorialAction` type in `tutorialStore.ts`
2. Add a watcher in the component that controls the modal
3. Use `beforeStep` / `afterStep` hooks in the step definitions to call `requestAction()`
4. Add `beforeStep` hooks on pre-modal steps to close the modal for back-navigation

### Tips

- Use `popoverPosition: 'top'` with `scrollBlock: 'end'` when the popover needs space above the element
- Set `spotlightPadding: 0` for elements that should have no padding around the spotlight (e.g. sidebar)
- Set `spotlightPadding: 4` for large elements like grids to keep the highlight tight
- Use `type: 'action'` sparingly -- only when the user must interact (e.g. clicking to open a modal)

## Internationalization

All tutorial text uses i18n keys under the `tutorial` namespace. Each locale file has the following structure:

```json
{
  "tutorial": {
    "title": "Tutorials",
    "navigateApp": {
      "name": "Navigate the App",
      "description": "...",
      "steps": {
        "sidebar": { "title": "...", "description": "..." },
        ...
      }
    },
    "customizeWeapon": { ... },
    "inspectLink": { ... },
    "createLoadout": { ... },
    "popover": {
      "next": "Next",
      "previous": "Back",
      "finish": "Finish",
      "skip": "Skip Tutorial",
      "stepOf": "Step {current} of {total}"
    }
  }
}
```

Supported locales: English, German, Russian, French, Spanish, Dutch.
