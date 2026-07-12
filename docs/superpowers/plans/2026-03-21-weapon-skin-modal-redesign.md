# WeaponSkinModal Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign WeaponSkinModal from a two-column layout to a floating overlay layout with full-width weapon preview, compact sticker bar, inline sticker editing, integrated Visual Customizer transitions, and infinite scroll skin grid.

**Architecture:** The modal keeps its existing `NModal` container but replaces the inner `grid grid-cols-2` layout with a `relative` preview area containing absolutely-positioned floating panels. The skin grid changes from paginated `paginatedSkins` to an infinite-scroll `displayedSkins` computed that appends batches. A `modalState` ref (enum: `browse | stickerEdit | canvas | canvasSelected`) drives conditional rendering and transitions.

**Tech Stack:** Vue 3, Nuxt 4, Naive UI, Tailwind CSS, existing composables (`useItemModal`, `useAutoSave`)

**Spec:** `docs/superpowers/specs/2026-03-21-weapon-skin-modal-redesign.md`

---

## File Structure

| File | Action | Responsibility |
| --- | --- | --- |
| `app/components/modal/WeaponSkinModal.vue` | Modify | Main layout restructure, state machine, floating panels, sticker bar expansion, customizer transitions |
| `app/composables/useItemModal.ts` | Modify | Add `loadMore()`, `displayedSkins`, `hasMore`, `isLoadingMore` for infinite scroll. Keep pagination exports for Knife/Glove modals |
| `app/composables/useInfiniteScroll.ts` | Create | Reusable scroll-threshold observer composable (IntersectionObserver-based) |
| `app/utils/themeCustomization.ts` | No change | Existing theme overrides are sufficient |

---

## Task 1: Add Infinite Scroll to useItemModal

**Files:**

- Create: `app/composables/useInfiniteScroll.ts`
- Modify: `app/composables/useItemModal.ts`

This task adds infinite scroll support to the shared composable without breaking existing pagination for Knife/Glove modals.

**Note:** The existing `fetchSkins` already loads ALL skins in one API call (`limit: 500`). Infinite scroll here is **client-side slicing** — we progressively reveal more of the already-fetched `sortedSkins` array. This avoids API changes and matches the current data flow. The `isLoadingMore` state is kept for UI consistency but will be near-instant since it's just array slicing.

- [ ] **Step 1: Create the `useInfiniteScroll` composable**

```typescript
// app/composables/useInfiniteScroll.ts
/**
 * Reusable infinite scroll composable using IntersectionObserver.
 * Attach the returned `sentinelRef` to a div at the bottom of your scroll container.
 * When visible within `rootMargin`, calls `onLoadMore`.
 */
export function useInfiniteScroll(options: {
  onLoadMore: () => void
  rootMargin?: string
  enabled?: Ref<boolean> | ComputedRef<boolean>
  /** Root element for IntersectionObserver. If inside a scrolling container (e.g. NModal),
   *  pass the scroll container ref so the observer triggers correctly. Defaults to viewport. */
  root?: Ref<HTMLElement | null>
}) {
  const sentinelRef = ref<HTMLElement | null>(null)
  const observer = ref<IntersectionObserver | null>(null)

  const rootMargin = options.rootMargin ?? '200px'
  const enabled = options.enabled ?? ref(true)

  const setupObserver = () => {
    if (observer.value) observer.value.disconnect()
    if (!sentinelRef.value) return

    observer.value = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && unref(enabled)) {
          options.onLoadMore()
        }
      },
      { rootMargin, root: options.root ? unref(options.root) : null }
    )
    observer.value.observe(sentinelRef.value)
  }

  watch(sentinelRef, setupObserver)
  watch(enabled, (val) => {
    if (val) setupObserver()
    else observer.value?.disconnect()
  })
  if (options.root) {
    watch(options.root, setupObserver)
  }

  onBeforeUnmount(() => observer.value?.disconnect())

  return { sentinelRef }
}
```

- [ ] **Step 2: Add infinite scroll state and methods to `useItemModal`**

In `app/composables/useItemModal.ts`, add to `ItemModalState`:

```typescript
// Add to ItemModalState interface:
displayedCount: number
isLoadingMore: boolean
```

Initialize with `displayedCount: 0, isLoadingMore: false` in the state default.

Add new computed and methods alongside existing pagination (don't remove pagination — Knife/Glove modals still use it):

```typescript
// After the existing paginatedSkins computed:

/** Skins shown so far (for infinite scroll mode) */
const displayedSkins = computed(() => {
  return sortedSkins.value.slice(0, state.value.displayedCount)
})

/** Whether there are more skins to load */
const hasMore = computed(() => {
  return state.value.displayedCount < sortedSkins.value.length
})

/** Load next batch of skins (for infinite scroll) */
function loadMore() {
  if (state.value.isLoadingMore || !hasMore.value) return
  state.value.isLoadingMore = true
  // Use nextTick to allow the UI to show loading state
  nextTick(() => {
    state.value.displayedCount += PAGE_SIZE.value
    state.value.isLoadingMore = false
  })
}

/** Reset displayed count (call when filters/sort change) */
function resetDisplayedCount() {
  state.value.displayedCount = PAGE_SIZE.value
}
```

Add watchers to reset `displayedCount` when search/sort/filter changes:

```typescript
// Reset infinite scroll when filters change
watch([() => state.value.searchQuery, sortBy, sortDir, rarityFilterIds], () => {
  resetDisplayedCount()
}, { deep: true })
```

Add to the return object: `displayedSkins`, `hasMore`, `loadMore`, `resetDisplayedCount`.

Also update `clearState` to reset `displayedCount: 0, isLoadingMore: false`.

- [ ] **Step 3: Initialize displayedCount after skins are fetched**

In the existing `fetchSkins` function, after skins are loaded and assigned to `apiState.value.skins`, add:

```typescript
// After: apiState.value.skins = skins
state.value.displayedCount = PAGE_SIZE.value
```

- [ ] **Step 4: Verify Knife/Glove modals still work**

Run the dev server and verify that KnifeSkinModal and GloveSkinModal still use `paginatedSkins` / `totalPages` without issues. The new exports are additive and don't affect existing pagination.

```bash
cd /Users/laurinfrank/Library/CloudStorage/Dropbox/Code/Web/cs2inspect-web && npx nuxi typecheck
```

- [ ] **Step 5: Commit**

```bash
git add app/composables/useInfiniteScroll.ts app/composables/useItemModal.ts
git commit -m "feat(modal): add infinite scroll support to useItemModal composable"
```

---

## Task 2: Add Frosted-Glass Panel Styles

**Files:**

- Modify: `app/components/modal/WeaponSkinModal.vue` (just the `<style>` section)

- [ ] **Step 1: Add CSS custom properties for floating panels**

In `app/components/modal/WeaponSkinModal.vue`, add these CSS classes in the `<style>` section (replacing the existing `.visual-customizer-overlay` with updated styles, and adding new classes):

```scss
/* Frosted-glass floating panel base */
.floating-panel {
  position: absolute;
  background: rgba(18, 18, 18, 0.92);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.07);
  border-radius: 8px;
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.5);
  z-index: 10;
}

.floating-panel--settings { z-index: 30; }
.floating-panel--sticker-bar { z-index: 20; }
.floating-panel--detail { z-index: 40; }
.floating-panel--toolbar { z-index: 15; }
.floating-panel--wear { z-index: 10; }

/* Compact sticker slot (28×28px) */
.compact-sticker-slot {
  width: 28px;
  height: 28px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.15s ease-in-out;
  flex-shrink: 0;
  overflow: hidden;
}

.compact-sticker-slot--empty {
  border: 1px dashed #444;
  background: rgba(24, 24, 24, 0.6);
}

.compact-sticker-slot--filled {
  border: 1px solid var(--selection-ring);
  background: rgba(26, 26, 10, 0.6);
}

.compact-sticker-slot--active {
  border-color: #22d3ee;
  background: rgba(10, 26, 26, 0.6);
  box-shadow: 0 0 8px rgba(34, 211, 238, 0.3);
}

/* Sticker bar expand animation */
.sticker-bar-expand-enter-active {
  transition: all 250ms ease-out;
}
.sticker-bar-expand-leave-active {
  transition: all 200ms ease-in;
}
.sticker-bar-expand-enter-from,
.sticker-bar-expand-leave-to {
  opacity: 0;
  max-width: 0;
}

/* Canvas morph transition */
.canvas-morph-enter-active {
  transition: all 400ms ease-out;
}
.canvas-morph-leave-active {
  transition: all 350ms ease-in;
}
.canvas-morph-enter-from { opacity: 0; }
.canvas-morph-leave-to { opacity: 0; transform: translateY(20px); }

/* Skin grid card entrance animation */
.skin-card-enter-active {
  transition: opacity 200ms ease-out, transform 200ms ease-out;
}
.skin-card-enter-from {
  opacity: 0;
  transform: translateY(12px);
}
```

- [ ] **Step 2: Commit**

```bash
git add app/components/modal/WeaponSkinModal.vue
git commit -m "feat(modal): add frosted-glass panel and animation CSS classes"
```

---

## Task 3: Restructure Modal Layout — Full-Width Preview + Floating Settings

**Files:**

- Modify: `app/components/modal/WeaponSkinModal.vue` (template, lines ~1297-1481)

This is the largest task. It replaces the two-column grid with the new floating layout.

- [ ] **Step 1: Add `modalViewState` ref to the script section**

Near line 96 (after `weaponState`), add:

```typescript
/**
 * Modal view state machine.
 * Note: 'canvasSelected' (State 4 from spec) is handled internally by InlineVisualCustomizer —
 * it manages its own selection state, detail panel, and toolbar. We only track 'canvas' here.
 * The existing `removeSticker` function in the component handles sticker removal.
 */
type ModalViewState = 'browse' | 'stickerEdit' | 'canvas'
const modalViewState = ref<ModalViewState>('browse')

/** Currently editing sticker index (for State 2) */
const editingStickerIndex = ref<number | null>(null)

/** Computed flags for template readability */
const isCanvasMode = computed(() => modalViewState.value === 'canvas')
const isStickerEditMode = computed(() => modalViewState.value === 'stickerEdit')
```

- [ ] **Step 2: Add state transition methods**

```typescript
/** Enter sticker inline edit (State 2) */
function enterStickerEdit(index: number) {
  const sticker = customization.value.stickers[index]
  if (!sticker) {
    // Empty slot — open StickerModal (existing behavior)
    handleAddSticker(index)
    return
  }
  editingStickerIndex.value = index
  modalViewState.value = 'stickerEdit'
}

/** Exit sticker inline edit back to browse */
function exitStickerEdit() {
  editingStickerIndex.value = null
  modalViewState.value = 'browse'
}

/** Enter Visual Customizer (State 3) */
function enterCanvas(preselectStickerIndex?: number) {
  modalViewState.value = 'canvas'
  weaponState.value.inlineVisualCustomizerActive = true
  // If a sticker was being edited, pre-select it on the canvas
  if (preselectStickerIndex !== undefined) {
    editingStickerIndex.value = preselectStickerIndex
    // The InlineVisualCustomizer handles sticker selection internally
  }
}

/** Exit Visual Customizer back to browse (State 1) */
function exitCanvas() {
  modalViewState.value = 'browse'
  editingStickerIndex.value = null
  weaponState.value.inlineVisualCustomizerActive = false
}
```

- [ ] **Step 3: Update the `handleExitInlineVisualCustomizer` function**

Find the existing `handleExitInlineVisualCustomizer` function and update it to use `exitCanvas()`:

```typescript
const handleExitInlineVisualCustomizer = () => {
  exitCanvas()
}
```

- [ ] **Step 4: Update Escape key handling**

In the existing `handleModalKeydown` function, update Escape behavior:

```typescript
// In handleModalKeydown, update the Escape case:
if (event.key === 'Escape') {
  if (isStickerEditMode.value) {
    exitStickerEdit()
    event.stopPropagation()
    return
  }
  if (isCanvasMode.value) {
    exitCanvas()
    event.stopPropagation()
    return
  }
  // Default: close modal (existing behavior)
}
```

- [ ] **Step 5: Update keyboard shortcuts 1-5 for sticker slots**

Update the existing keyboard handler for keys 1-5 to use `enterStickerEdit`:

```typescript
// In handleModalKeydown, update digit handling:
if (['1', '2', '3', '4', '5'].includes(event.key) && !isCanvasMode.value) {
  const index = parseInt(event.key) - 1
  enterStickerEdit(index)
  event.stopPropagation()
  return
}
```

- [ ] **Step 6: Replace the two-column layout template**

Replace the template section from `<div v-if="selectedSkin" class="bg-[var(--bg-secondary)] p-6 rounded-lg bg-opacity-50">` through the closing `</div>` of the sticker/keychain grid (approximately lines 1299-1641) with the new floating layout.

The new layout structure:

```html
<div v-if="selectedSkin" class="rounded-lg overflow-hidden">
  <!-- Preview Area (relative container for floating panels) -->
  <div class="relative" style="min-height: 320px;">
    <!-- Weapon Preview (full-width, with right padding for settings panel) -->
    <div class="pr-[200px]">
      <!-- Hidden video element for frame extraction -->
      <video ref="previewVideo" crossorigin="anonymous" playsinline style="display: none" />

      <!-- Canvas for video rendering -->
      <canvas
        v-show="isPreviewVideoMode && !isPreviewVideoLoading"
        ref="previewCanvas"
        class="w-full h-72"
      />

      <!-- Static image fallback -->
      <img
        v-show="!isPreviewVideoMode || isPreviewVideoLoading"
        :src="previewImageUrl"
        :alt="selectedSkin?.name"
        class="w-full h-72 object-contain"
      />
    </div>

    <!-- Visual Customizer Overlay Button (magic wand) -->
    <button
      class="visual-customizer-overlay"
      :class="{ disabled: !selectedSkin }"
      :disabled="!selectedSkin"
      :title="(t('modals.weaponSkin.visualCustomizer.button') as string) || 'Visual Customizer'"
      @click.stop="enterCanvas()"
    >
      <!-- existing SVG icon -->
    </button>

    <!-- Skin Name Overlay -->
    <div class="absolute bottom-14 left-3 text-lg font-bold text-white drop-shadow-lg">
      {{ selectedSkin?.name }}
    </div>

    <!-- FLOATING SETTINGS PANEL (top-right) -->
    <div class="floating-panel floating-panel--settings"
         style="top: 12px; right: 12px; width: 175px; padding: 10px;">
      <!-- StatTrak -->
      <div class="flex items-center justify-between mb-1.5">
        <span class="text-xs text-gray-400">{{ t('modals.weaponSkin.labels.stattrak') }}</span>
        <NSwitch v-model:value="customization.stattrak_enabled" size="small" />
      </div>
      <NInputNumber
        v-if="customization.stattrak_enabled"
        v-model:value="customization.stattrak_count"
        :min="0" :max="99999" size="tiny"
        class="w-full mb-1.5"
        :input-props="digitOnlyInputProps"
      />

      <!-- Wear -->
      <div class="flex items-center justify-between mb-1">
        <span class="text-xs text-gray-400">{{ t('modals.weaponSkin.labels.wear') }}</span>
        <span class="text-xs text-gray-200 font-mono">{{ customization.paintwear.toFixed(3) }}</span>
      </div>
      <WearSlider
        v-model="customization.paintwear"
        :max="selectedSkin?.maxFloat ?? 1"
        :min="selectedSkin?.minFloat ?? 0"
      />

      <!-- Paint Index -->
      <div class="flex items-center justify-between mt-1.5 mb-1">
        <span class="text-xs text-gray-400">{{ t('modals.weaponSkin.labels.paintIndex') }}</span>
        <NSwitch v-model:value="customization.paintIndexOverride" size="small" />
      </div>
      <NInputNumber
        v-model:value="customization.paintindex"
        :min="0" :max="9999" size="tiny"
        :disabled="!customization.paintIndexOverride"
        :input-props="digitOnlyInputProps"
        class="w-full mb-1.5"
      />

      <!-- Seed -->
      <div class="flex items-center justify-between mb-1">
        <span class="text-xs text-gray-400">{{ t('modals.weaponSkin.labels.pattern') }}</span>
      </div>
      <NInputNumber
        v-model:value="customization.paintseed"
        :min="0" :max="1000" size="tiny"
        :input-props="digitOnlyInputProps"
        class="w-full mb-1.5"
      />

      <!-- Name Tag -->
      <NInput
        v-model:value="customization.nametag"
        :placeholder="t('modals.weaponSkin.inputs.nameTagPlaceholder') as string"
        size="tiny" maxlength="20" show-count
        class="mb-1.5"
      />

      <!-- Active Toggle -->
      <div class="flex items-center gap-2 mb-2">
        <NSwitch v-model:value="customization.active" size="small">
          <template #checked>{{ t('modals.weaponSkin.labels.itemActive') }}</template>
          <template #unchecked>{{ t('modals.weaponSkin.labels.itemInactive') }}</template>
        </NSwitch>
      </div>

      <!-- Duplicate Button (styled) -->
      <button
        v-if="selectedSkin?.availableTeams === 'both'"
        class="w-full text-center text-xs py-1.5 px-2 rounded bg-[#1a1a1a] border border-[#2a2a2a] text-gray-400 hover:text-gray-200 hover:border-[#444] transition-colors"
        :disabled="!selectedSkin"
        @click="state.showDuplicateConfirm = true"
      >
        {{ t('modals.weaponSkin.buttons.duplicate') }} →
      </button>
    </div>

    <!-- FLOATING STICKER + KEYCHAIN BAR (bottom-left) -->
    <div
      class="floating-panel floating-panel--sticker-bar"
      style="bottom: 12px; left: 12px; padding: 6px 8px;"
    >
      <div class="flex items-center gap-1">
        <!-- Sticker slots -->
        <div
          v-for="(sticker, index) in customization.stickers"
          :key="'slot-' + index"
          class="compact-sticker-slot"
          :class="{
            'compact-sticker-slot--empty': !sticker,
            'compact-sticker-slot--filled': sticker,
            'compact-sticker-slot--active': editingStickerIndex === index && isStickerEditMode,
          }"
          :title="sticker?.api?.name || `Sticker #${index + 1}`"
          draggable="true"
          @dragstart="handleStickerDragStart($event, index)"
          @dragend="handleStickerDragEnd"
          @dragover="handleStickerDragOver"
          @dragleave="handleStickerDragLeave"
          @drop="handleStickerDrop($event, index)"
          @click.stop="enterStickerEdit(index)"
        >
          <img
            v-if="sticker"
            :src="generateStickerImageUrl(sticker.id, sticker.wear || 0)"
            :alt="sticker.api?.name ?? ''"
            class="w-full h-full object-contain"
            @error="(e) => ((e.target as HTMLImageElement).src = sticker?.api?.image || '')"
          />
          <span v-else class="text-[8px] text-gray-500">+</span>
        </div>

        <!-- Divider -->
        <div class="w-px h-5 bg-[#333] mx-1" />

        <!-- Keychain slot -->
        <div
          class="compact-sticker-slot"
          :class="{
            'compact-sticker-slot--empty': !customization.keychain,
            'compact-sticker-slot--filled': customization.keychain,
          }"
          :title="customization.keychain?.api?.name || 'Keychain'"
          @click="handleAddKeychain"
        >
          <img
            v-if="customization.keychain"
            :src="generateFlatKeychainUrl(
              customization.keychain.api?.name ?? '',
              customization.keychain.seed,
              undefined,
              customization.keychain.wrapped_sticker_id || undefined
            )"
            :alt="customization.keychain.api?.name ?? ''"
            class="w-full h-full object-contain"
          />
          <span v-else class="text-[8px] text-gray-500">+</span>
        </div>

        <!-- EXPANDED STICKER EDIT CONTROLS (State 2) -->
        <Transition name="sticker-bar-expand">
          <template v-if="isStickerEditMode && editingStickerIndex !== null">
            <div class="flex items-center gap-2 ml-2 pl-2 border-l border-[#333]">
              <!-- Sticker preview -->
              <div class="w-8 h-8 rounded bg-[#1a1a1a] border border-[#2a2a2a] flex items-center justify-center overflow-hidden flex-shrink-0">
                <img
                  v-if="customization.stickers[editingStickerIndex]"
                  :src="generateStickerImageUrl(customization.stickers[editingStickerIndex]!.id, customization.stickers[editingStickerIndex]!.wear || 0)"
                  class="w-full h-full object-contain"
                />
              </div>
              <!-- Info -->
              <div class="flex-1 min-w-0">
                <div class="text-xs text-gray-200 font-semibold truncate max-w-[160px]">
                  {{ customization.stickers[editingStickerIndex]?.api?.name ?? '' }}
                </div>
                <div class="flex gap-3 text-[10px] text-gray-500 mt-0.5">
                  <span>Wear: <span class="text-gray-300">{{ (customization.stickers[editingStickerIndex]?.wear ?? 0).toFixed(2) }}</span></span>
                  <span>Scale: <span class="text-gray-300">{{ (customization.stickers[editingStickerIndex]?.scale ?? 1).toFixed(1) }}</span></span>
                  <span>Rot: <span class="text-gray-300">{{ (customization.stickers[editingStickerIndex]?.rotation ?? 0) }}°</span></span>
                </div>
              </div>
              <!-- Actions -->
              <div class="flex gap-1 flex-shrink-0">
                <button
                  class="text-[10px] px-2 py-0.5 rounded bg-[#222] border border-[#333] text-gray-400 hover:text-gray-200 transition-colors"
                  @click.stop="enterCanvas(editingStickerIndex!)"
                  title="Open Visual Customizer"
                >✨</button>
                <button
                  class="text-[10px] px-2 py-0.5 rounded bg-[#222] border border-[#333] text-gray-400 hover:text-gray-200 transition-colors"
                  @click.stop="handleAddSticker(editingStickerIndex!)"
                >Change</button>
                <button
                  class="text-[10px] px-2 py-0.5 rounded bg-[#222] border border-[#3a1a1a] text-red-400 hover:text-red-300 transition-colors"
                  @click.stop="removeSticker(editingStickerIndex!); exitStickerEdit()"
                >Remove</button>
                <button
                  class="text-[10px] px-1 py-0.5 text-gray-500 hover:text-gray-300 transition-colors"
                  @click.stop="exitStickerEdit()"
                >✕</button>
              </div>
            </div>
          </template>
        </Transition>
      </div>
    </div>
  </div>
</div>
```

Note: Preserve all existing event handlers (`handleStickerDragStart`, `handleStickerDragEnd`, etc.), just move them to the new elements. The existing `handleAddSticker`, `removeSticker`, `handleAddKeychain`, `generateStickerImageUrl` functions are unchanged.

- [ ] **Step 7: Click-outside handler for sticker edit**

Add a click handler on the preview area container to close sticker edit when clicking outside the bar:

```typescript
function handlePreviewAreaClick() {
  if (isStickerEditMode.value) {
    exitStickerEdit()
  }
}
```

Add `@click="handlePreviewAreaClick"` to the preview area `<div class="relative">` container. The sticker bar click handlers already use `.stop` modifier.

- [ ] **Step 8: Verify the layout renders correctly**

```bash
cd /Users/laurinfrank/Library/CloudStorage/Dropbox/Code/Web/cs2inspect-web && npx nuxi dev
```

Open the modal and verify:
- Weapon preview is full-width with right padding
- Settings panel floats top-right, not overlapping weapon
- Sticker bar is compact (28px slots) at bottom-left
- Click a filled sticker → bar expands with controls
- Click ✕ or outside → bar collapses
- Magic wand → enters Visual Customizer

- [ ] **Step 9: Commit**

```bash
git add app/components/modal/WeaponSkinModal.vue
git commit -m "feat(modal): restructure layout to floating overlay with state machine"
```

---

## Task 4: Replace Skin Grid with Infinite Scroll

**Files:**

- Modify: `app/components/modal/WeaponSkinModal.vue` (template + script)

- [ ] **Step 1: Import and use infinite scroll in WeaponSkinModal**

In the script section, import and destructure the new exports:

```typescript
const {
  state,
  apiState,
  PAGE_SIZE,
  sortBy,
  sortDir,
  rarityFilterIds,
  availableRarities,
  sortedSkins,
  // Remove: paginatedSkins, totalPages
  displayedSkins,
  hasMore,
  loadMore,
  resetDisplayedCount,
  fetchSkins,
  clearState,
  toggleSortDir,
  toggleRarityFilter,
} = useItemModal({
  itemType: 'weapon',
  pageSize: props.pageSize || 10,
  enableSortFilter: true,
})
```

Import and set up the scroll observer. Add a ref for the modal's scroll container (the `NModal` content body scrolls):

```typescript
import { useInfiniteScroll } from '~/composables/useInfiniteScroll'

// Ref for the modal's scrollable content area — attach to the wrapper div inside NModal
const modalContentRef = ref<HTMLElement | null>(null)

const { sentinelRef } = useInfiniteScroll({
  onLoadMore: loadMore,
  rootMargin: '200px',
  enabled: computed(() => hasMore.value && !state.value.isLoadingSkins && !isCanvasMode.value),
  root: modalContentRef, // NModal scrolls its content area, not the viewport
})
```

- [ ] **Step 2: Replace the skin grid template**

Replace the existing grid (lines ~1694-1773) and pagination with:

```html
<!-- Skins Grid (infinite scroll) -->
<div v-if="!isCanvasMode">
  <!-- Sort / Filter controls (keep existing) -->
  <!-- ... existing sort/filter controls ... -->

  <!-- Loading skeleton (initial load only) -->
  <div v-if="state.isLoadingSkins" class="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
    <div v-for="i in PAGE_SIZE" :key="i"
         class="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-dark)] p-3">
      <NSkeleton height="96px" />
      <div class="mt-2">
        <NSkeleton text :repeat="1" />
        <div class="mt-1"><NSkeleton height="3px" /></div>
      </div>
    </div>
  </div>

  <!-- Skin cards grid -->
  <div v-else class="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3"
       data-tutorial="skin-grid">
    <TransitionGroup name="skin-card">
      <NCard
        v-for="skin in displayedSkins"
        :key="skin.id"
        :style="{
          borderColor: skin.rarity?.color || '#313030',
          background: 'linear-gradient(135deg, #101010, ' + (hexToRgba(skin.rarity?.color, '0.15') || '#313030') + ')',
        }"
        :class="[
          'hover:shadow-lg cursor-pointer transition-all rounded-xl',
          customization.paintindex === Number(skin.paint_index) ? 'ring-2 ring-[var(--selection-ring)] border-0 opacity-85' : '',
        ]"
        @click="handleSkinSelect(skin)"
      >
        <div class="flex flex-col items-center">
          <img :src="skin.image" :alt="skin.name"
               class="w-full h-24 object-contain mb-1.5" loading="lazy" />
          <div class="w-full">
            <p class="text-xs text-white truncate">{{ skin.name }}</p>
            <div class="h-0.5 mt-1.5 rounded-full"
                 :style="{ background: skin.rarity?.color || '#313030' }" />
          </div>
        </div>
      </NCard>
    </TransitionGroup>
  </div>

  <!-- Loading more indicator -->
  <div v-if="state.isLoadingMore" class="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 mt-3">
    <div v-for="i in 6" :key="'skel-' + i"
         class="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-dark)] p-3 animate-pulse">
      <div class="h-24 bg-[var(--bg-secondary)] rounded" />
      <div class="mt-2 h-3 bg-[var(--bg-secondary)] rounded w-3/4" />
    </div>
  </div>

  <!-- Infinite scroll sentinel -->
  <div ref="sentinelRef" class="h-1" />

  <!-- No Results -->
  <div v-if="!state.isLoadingSkins && sortedSkins.length === 0"
       class="flex justify-center items-center h-48">
    <NEmpty :description="String(t('modals.weaponSkin.noSearchResults'))" />
  </div>
</div>
```

- [ ] **Step 3: Remove old pagination references**

Remove the `NPagination` import/usage from the template and remove `paginatedSkins`, `totalPages` from the destructured imports (but don't remove them from `useItemModal` — other modals still use them).

- [ ] **Step 4: Verify infinite scroll works**

Open the modal, scroll down, verify:
- 6-column grid renders
- Scrolling near the bottom loads more skins
- Skeleton loading placeholders appear while loading
- Sort/filter changes reset the grid to the first batch
- Empty state shows when no results match

- [ ] **Step 5: Commit**

```bash
git add app/components/modal/WeaponSkinModal.vue
git commit -m "feat(modal): replace pagination with infinite scroll skin grid"
```

---

## Task 5: Visual Customizer In-Place Transition

**Files:**

- Modify: `app/components/modal/WeaponSkinModal.vue` (template)

- [ ] **Step 1: Update the Visual Customizer section**

Replace the existing `<Transition name="fade" mode="out-in">` block that switches between inline customizer and normal view. The new approach wraps both in the same container so the canvas replaces the preview in-place:

The InlineVisualCustomizer block should render inside the same `<div class="relative">` preview area when `isCanvasMode` is true, replacing the weapon preview and floating panels:

```html
<!-- Inside the preview area <div class="relative">, add at the top: -->
<template v-if="isCanvasMode">
  <Transition name="canvas-morph" mode="out-in">
    <LazyInlineVisualCustomizer
      :visible="true"
      :weapon-skin="{
        name: selectedSkin?.name || '',
        image: selectedSkin?.image || '',
        defindex: selectedSkin?.weapon_defindex || 0,
        paintindex: customization.paintindex ?? undefined,
      }"
      :stickers="customization.stickers"
      :keychain="customization.keychain"
      :weapon-wear="customization.paintwear"
      :min-wear="selectedSkin?.minFloat || 0"
      :max-wear="selectedSkin?.maxFloat || 1"
      @save="handleInlineSave"
      @update-wear="(val) => (customization.paintwear = val)"
      @update-stickers="(stickers) => (customization.stickers = stickers)"
      @update-keychain="(keychain) => (customization.keychain = keychain)"
      @open-sticker-modal="handleInlineOpenStickerModal"
    />
  </Transition>
</template>

<!-- Weapon preview and floating panels only show when NOT in canvas mode -->
<template v-else>
  <!-- ... existing preview + floating panels from Task 3 ... -->
</template>
```

- [ ] **Step 2: Update the header-extra for canvas mode**

The header buttons should change based on `isCanvasMode` instead of `weaponState.inlineVisualCustomizerActive`:

```html
<template #header-extra>
  <div v-if="isCanvasMode" class="flex items-center shrink-0 gap-2">
    <SButton variant="light" :color="buttonColor.error" @click="exitCanvas()">
      <template #icon-left><!-- X icon SVG --></template>
      {{ t('modals.weaponSkin.visualCustomizer.exit') }}
    </SButton>
    <SButton variant="elevated" :color="buttonColor.primary" @click="handleInlineSave">
      Save
    </SButton>
  </div>
  <div v-else class="flex items-center shrink-0">
    <!-- existing browse-mode header buttons (Reset, History, Import, Generate Link, Search) -->
  </div>
</template>
```

- [ ] **Step 3: Verify transitions**

- Click ✨ wand → canvas should appear with fade transition, grid disappears
- Click "Exit Customizer" → preview returns, grid reappears
- From sticker edit, click ✨ → bar collapses, canvas opens
- Escape in canvas mode → exits back to browse

- [ ] **Step 4: Commit**

```bash
git add app/components/modal/WeaponSkinModal.vue
git commit -m "feat(modal): integrate Visual Customizer with in-place morph transition"
```

---

## Task 6: Final Polish and Reset on Modal Close

**Files:**

- Modify: `app/components/modal/WeaponSkinModal.vue`

- [ ] **Step 1: Reset state when modal closes**

Update the existing `handleClose` or `watch(visible)` to reset the view state:

```typescript
// In the existing close/visibility handler:
watch(() => props.visible, (newVal) => {
  if (!newVal) {
    modalViewState.value = 'browse'
    editingStickerIndex.value = null
    weaponState.value.inlineVisualCustomizerActive = false
  }
})
```

- [ ] **Step 2: Ensure search input is in the header bar**

Verify the search `NInput` is still in the `#header-extra` slot for browse mode, positioned after the action buttons.

- [ ] **Step 3: Run typecheck**

```bash
cd /Users/laurinfrank/Library/CloudStorage/Dropbox/Code/Web/cs2inspect-web && npx nuxi typecheck
```

Fix any type errors.

- [ ] **Step 4: Manual QA checklist**

Verify all acceptance criteria from the spec:

1. Weapon preview is full modal width
2. Settings panel floats top-right, never overlaps weapon
3. Sticker slots are 28×28px in compact bar
4. Sticker bar expands inline on click
5. Visual Customizer opens in-place via wand or sticker bar ✨
6. Skin grid has 6 columns + infinite scroll
7. Duplicate button has dark background + border
8. Transitions are smooth
9. Auto-save still works
10. Keyboard shortcuts (1-5, R, D, Escape) work correctly
11. Drag-and-drop sticker reorder works
12. Import/Export inspect links work
13. History panel works

- [ ] **Step 5: Commit**

```bash
git add app/components/modal/WeaponSkinModal.vue
git commit -m "feat(modal): final polish and state reset on modal close"
```
