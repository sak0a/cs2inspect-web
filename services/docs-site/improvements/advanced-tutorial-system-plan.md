# Advanced Interactive Tutorial System Implementation Plan

## 1) Objectives and Scope

Implement a polished, multi-scenario tutorial framework that:

1. Provides **interactive step-by-step guidance** with highlighted UI targets and contextual explanations.
2. Supports a **catalog of tutorials** (different user scenarios) selectable from the **player settings dropdown in the top bar**.
3. Preserves visual consistency with the existing glassmorphism + motion style.
4. Enforces **tutorial isolation** so users stay within the active flow and cannot start conflicting actions/tutorials.
5. Allows **start/restart/stop at any time** with safe recovery and no feature regressions.

Out of scope for MVP:

- Server-side personalization/recommendation of tutorials.
- Cross-device sync of tutorial progress.

---

## 2) Product Requirements Mapping

| Requested behavior | Planned solution |
|---|---|
| Highlight specific UI elements with explanations | Spotlight overlay + anchored popover card per step (target selector + fallback positioning). |
| Different tutorials for specific scenarios | Tutorial registry with metadata (`id`, `title`, `description`, `difficulty`, `estimatedTime`, `steps[]`). |
| Beautiful design and smooth transitions | Reuse existing theme tokens and glassmorphism styles; add subtle spring/fade transitions between steps. |
| Stop anytime + restart anytime | Global tutorial controller with `start`, `stop`, `restart`, `resume` actions and persisted state. |
| Isolation so user cannot do disallowed actions during tutorial | “Guided mode” interaction lock layer + route/action guards + strict step validation. |
| Tutorial list in player settings menu (top bar) | Add a “Tutorials” submenu entry in `SettingsDropdown` and open a tutorial launcher modal/drawer. |

---

## 3) Technical Architecture

### 3.1 Core modules

1. **`stores/tutorialStore.ts` (Pinia)**
   - State:
     - `activeTutorialId`, `activeStepIndex`, `status` (`idle|running|paused|completed|cancelled`)
     - `isIsolationEnabled`
     - `lastKnownRoute`, `progressByTutorial`
   - Actions:
     - `startTutorial(id)`, `nextStep()`, `prevStep()`, `goToStep(index)`
     - `stopTutorial(reason)`, `restartTutorial(id)`, `resumeTutorial(id)`
     - `validateStepAction(actionId)` for gated interactions
   - Getters:
     - `currentTutorial`, `currentStep`, `isRunning`, `isActionAllowed`

2. **`composables/useTutorials.ts`**
   - Public interface for components/pages.
   - Encapsulates selector resolution, safe scrolling to target, and retry logic when target mounts late.

3. **Tutorial registry (`utils/tutorials/registry.ts`)**
   - Central typed list of tutorial definitions.
   - Scenario examples:
     - First loadout setup
     - Weapon customization flow
     - Sticker placement basics
     - Inspect link generation

4. **Presentation layer components**
   - `components/tutorials/TutorialOverlay.vue` (backdrop + spotlight cutout)
   - `components/tutorials/TutorialPopover.vue` (step card with title/body/controls/progress)
   - `components/tutorials/TutorialLauncher.vue` (list of available tutorials)
   - `components/tutorials/TutorialHotspotBadge.vue` (optional subtle markers)

5. **Global mount point**
   - Mount `TutorialOverlay` once (likely in `layouts/default.vue`) so coverage is route-wide.

### 3.2 Step definition model

Use strict typed schema:

```ts
interface TutorialStep {
  id: string
  titleKey: string
  bodyKey: string
  route?: string
  targetSelector?: string
  placement?: 'top' | 'bottom' | 'left' | 'right' | 'auto'
  allowInteractions?: string[]
  requiredActionId?: string
  onEnter?: 'openMenu' | 'navigate' | 'none'
  onExit?: 'none' | 'closeTransientUI'
}
```

Design notes:

- All copy uses i18n keys, no hardcoded user-facing text.
- Every step supports a fallback when `targetSelector` is unavailable.
- `requiredActionId` enables deterministic progression for interactive tasks.

---

## 4) Isolation and Safety Strategy (Critical Requirement)

When tutorial is active, enable **Guided Mode**:

1. **Input gating**
   - Backdrop intercepts clicks globally.
   - Only whitelisted target(s) and tutorial controls remain interactive.

2. **Action gating**
   - Wrap high-impact actions (e.g., route/menu switches, loadout destructive actions) with `tutorialStore.isActionAllowed(actionId)` checks.
   - Show non-blocking tooltip/toast: “Complete this step first.”

3. **Navigation guard**
   - Route middleware to prevent unauthorized route jumps during strict steps.
   - If a step requires route change, controller performs it explicitly.

4. **Single active tutorial policy**
   - Launcher disabled while a tutorial runs.
   - Attempting to start another tutorial prompts: stop current tutorial first.

5. **Recovery paths**
   - If target element is missing after retries:
     - Auto-skip (if optional step), or
     - Pause tutorial with explicit recovery instructions.

---

## 5) UX / Visual Design Plan

1. **Visual language alignment**
   - Reuse existing dark glass surfaces, border opacities, and blur from dropdown/menu system.
   - Use current icon set (`lucide-vue-next`) and Naive UI primitives where appropriate.

2. **Step transitions**
   - Overlay fade (120–180ms), popover slide/fade (180–240ms), spotlight morph easing.
   - Animate progress indicator between steps.

3. **Tutorial popover content**
   - Title + concise explanation
   - Step counter (`Step 2 of 7`)
   - Controls: Back, Next, Skip step, Stop tutorial
   - Optional “Try it now” CTA for interaction-required steps

4. **Accessibility**
   - Focus trap in popover
   - Keyboard controls (Esc to stop, Enter/Space for next when valid)
   - ARIA annotations for highlighted element and live step updates
   - Respect reduced-motion preference

---

## 6) Settings Integration Plan (Top Bar)

Update `components/SettingsDropdown.vue`:

1. Add a new top-level menu item/submenu: **Tutorials**.
2. On select, open `TutorialLauncher` modal/drawer.
3. Launcher displays:
   - Scenario name
   - Short description
   - Estimated duration
   - Difficulty tag
   - Start/Restart buttons
4. If a tutorial is currently running, show status badge and “Resume/Stop”.

This keeps discoverability exactly where requested (player settings button in top bar).

---

## 7) Data, Persistence, and Telemetry

1. **Local persistence**
   - Store progress in local storage (per tutorial id): `completed`, `lastStep`, `lastSeenAt`.
   - Keep it client-only for MVP.

2. **Versioning**
   - Add `tutorialSchemaVersion`; when changed, gracefully reset incompatible stored progress.

3. **Telemetry (optional but recommended)**
   - Emit client analytics hooks for:
     - tutorial_started
     - tutorial_step_viewed
     - tutorial_completed
     - tutorial_abandoned
   - Helps improve drop-off points later.

---

## 8) Implementation Phases

### Phase 1 — Foundations

- Define tutorial types and registry.
- Implement `tutorialStore` state machine.
- Add global overlay + popover shell.

### Phase 2 — Interaction isolation

- Implement backdrop input lock.
- Add action gating helper and route guards.
- Enforce single active tutorial rule.

### Phase 3 — Settings + launcher

- Extend `SettingsDropdown` with tutorials entry.
- Build tutorial launcher modal/drawer and wire start/resume/stop.

### Phase 4 — Scenario authoring

- Author 3–4 high-value tutorials (onboarding + weapon flow + stickers + inspect link).
- Add i18n strings for all supported locales.

### Phase 5 — Polish + hardening

- Motion tuning, responsive behavior, empty/missing target handling.
- Accessibility pass and reduced-motion support.
- Final QA and regression testing.

---

## 9) Testing and Verification Plan

### 9.1 Automated tests

1. **Unit tests (Vitest)**
   - `tutorialStore` transitions and guard logic.
   - Selector resolution and fallback behavior.

2. **Component tests**
   - Overlay interactivity lock behavior.
   - Popover control states across steps.

3. **Integration tests**
   - Start tutorial from settings dropdown.
   - Attempt forbidden actions during isolation (must be blocked).
   - Stop and restart flows from any step.

### 9.2 Manual QA checklist

- Tutorial can be started from top-bar settings.
- Exactly one tutorial can run at a time.
- User cannot perform blocked actions during strict steps.
- User can stop tutorial at any moment and UI returns to normal.
- User can restart same tutorial immediately.
- Layout remains stable across supported viewport sizes.
- No regressions to language switching/logout behavior in settings.

---

## 10) Risk Controls (No Feature Destruction)

1. **Feature flags**
   - Gate rollout with `ENABLE_TUTORIALS` runtime config.

2. **Non-invasive wrappers**
   - Use centralized action guard helper rather than scattering ad-hoc checks.

3. **Regression focus**
   - Specifically retest settings dropdown actions (language change + logout).

4. **Progressive rollout**
   - Ship internal/beta first, gather telemetry, then full enablement.

---

## 11) Definition of Done

The implementation is complete when all are true:

1. Users can open a tutorial list from the existing settings button in top bar.
2. At least three scenario tutorials run step-by-step with element highlighting and explanations.
3. Smooth transitions and visual style match current design language.
4. Active tutorial enforces isolation and prevents conflicting actions/tutorial starts.
5. Tutorial can be stopped anytime and restarted anytime without broken state.
6. Automated tests pass and manual regression checklist is completed.

---

## 12) Final Verification Against Your Request

- ✅ Interactive, step-by-step, highlighted guidance is explicitly covered.
- ✅ Multiple scenario-based tutorials are part of the architecture and phases.
- ✅ Beautiful visuals + smooth transitions are specified.
- ✅ Stop/restart-anytime and strict isolation are core requirements in the design.
- ✅ Tutorial list placement is defined in the top-bar settings menu.
- ✅ Best-practice safeguards (typed schema, store state machine, tests, feature flag, regression plan) are included to avoid breaking existing features.
