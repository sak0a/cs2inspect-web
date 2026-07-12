# WeaponSkinModalV2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a complete rewrite of WeaponSkinModal as a V2 drop-in replacement with custom modal shell, always-on canvas editor, and direct sticker manipulation — no NModal dependency.

**Architecture:** V2 is decomposed into 7 focused components + 3 composables. The canvas rendering and interaction logic is extracted from InlineVisualCustomizer into reusable composables (`useCanvasRenderer`, `useCanvasInteraction`). A custom `ModalShell` replaces NModal with FLIP morph animation. The orchestrator (`WeaponSkinModalV2.vue`) ties everything together with the same props/emits interface as V1.

**Tech Stack:** Vue 3 (Composition API), HTML5 Canvas 2D, Tailwind CSS, existing utils (`canvasCoordinates.ts`, `videoCanvas.ts`), existing composables (`useItemModal`, `useInfiniteScroll`, `useAutoSave`)

**Spec:** `docs/superpowers/specs/2026-03-22-weapon-skin-modal-v2-design.md`

---

## File Structure

### New Files

```
app/composables/useModalShell.ts          — Backdrop, scroll lock, focus trap, escape, morph animation
app/composables/useCanvasRenderer.ts      — Canvas 2D rendering: weapon + stickers + slots + selection ring
app/composables/useCanvasInteraction.ts   — Hit testing, selection, drag, scale, arrow keys
app/components/modal/WeaponSkinModalV2.vue — Orchestrator component
app/components/modal/weapon-skin-v2/ModalShell.vue        — Custom modal (replaces NModal)
app/components/modal/weapon-skin-v2/CanvasPreview.vue     — Canvas element + rendering + interaction
app/components/modal/weapon-skin-v2/FloatingSettings.vue  — Settings panel overlay
app/components/modal/weapon-skin-v2/StickerBar.vue        — Compact sticker/keychain slot bar
app/components/modal/weapon-skin-v2/EditToolbar.vue       — Sticker editing controls toolbar
app/components/modal/weapon-skin-v2/SkinGrid.vue          — Infinite scroll skin card grid
```

### Existing Files (Reused, No Changes)

```
app/utils/canvasCoordinates.ts     — Coordinate transforms, asset sizes, converters
app/utils/videoCanvas.ts           — VideoCanvasManager for video frame rendering
app/types/canvas.ts                — CanvasElement, CanvasState, Point, Size types
app/composables/useItemModal.ts    — Skin fetching, sort, filter, infinite scroll
app/composables/useInfiniteScroll.ts — IntersectionObserver sentinel
app/composables/useAutoSave.ts     — Debounced auto-save
app/components/inspect/WearSlider.vue
app/components/modal/StickerModal.vue
app/components/modal/KeychainModal.vue
app/components/modal/InspectURLModal.vue
app/components/modal/DuplicateItemModal.vue
app/components/modal/ResetModal.vue
```

### Modified (Drop-in Swap)

```
app/pages/weapons/[type].vue      — Swap WeaponSkinModal → WeaponSkinModalV2, pass triggerRect
```

---

## Task 1: `useModalShell` Composable

**Files:**
- Create: `app/composables/useModalShell.ts`

This composable provides all the modal infrastructure that NModal currently gives us: backdrop management, scroll locking, focus trapping, escape-to-close, and the FLIP morph animation.

- [ ] **Step 1: Create the composable file**

```typescript
// app/composables/useModalShell.ts
import type { Ref } from 'vue'

export interface ModalShellOptions {
  visible: Ref<boolean>
  onClose: () => void
  triggerRect?: Ref<DOMRect | null>
}

export function useModalShell(options: ModalShellOptions) {
  const modalRef = ref<HTMLElement | null>(null)
  const backdropRef = ref<HTMLElement | null>(null)
  const isAnimating = ref(false)
  const animationStyle = ref<Record<string, string>>({})

  // ── Scroll lock ──
  let savedOverflow = ''
  let savedPaddingRight = ''

  function lockScroll() {
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth
    savedOverflow = document.body.style.overflow
    savedPaddingRight = document.body.style.paddingRight
    document.body.style.overflow = 'hidden'
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`
    }
  }

  function unlockScroll() {
    document.body.style.overflow = savedOverflow
    document.body.style.paddingRight = savedPaddingRight
  }

  // ── Focus trap ──
  function trapFocus(e: KeyboardEvent) {
    if (e.key !== 'Tab' || !modalRef.value) return
    const focusable = modalRef.value.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    if (focusable.length === 0) return
    const first = focusable[0]
    const last = focusable[focusable.length - 1]
    if (e.shiftKey) {
      if (document.activeElement === first) { last.focus(); e.preventDefault() }
    } else {
      if (document.activeElement === last) { first.focus(); e.preventDefault() }
    }
  }

  // ── Escape handler ──
  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      options.onClose()
      e.stopPropagation()
    }
    trapFocus(e)
  }

  // ── Backdrop click ──
  function handleBackdropClick(e: MouseEvent) {
    if (e.target === backdropRef.value) {
      options.onClose()
    }
  }

  // ── FLIP morph animation ──
  function calcMorphStyle(triggerRect: DOMRect, modalRect: DOMRect, progress: number): Record<string, string> {
    const eased = progress // easing applied via CSS
    const x = triggerRect.left + (modalRect.left - triggerRect.left) * eased
    const y = triggerRect.top + (modalRect.top - triggerRect.top) * eased
    const w = triggerRect.width + (modalRect.width - triggerRect.width) * eased
    const h = triggerRect.height + (modalRect.height - triggerRect.height) * eased
    const br = 12 + (24 - 12) * eased
    return {
      position: 'fixed',
      left: `${x}px`,
      top: `${y}px`,
      width: `${w}px`,
      height: `${h}px`,
      borderRadius: `${br}px`,
    }
  }

  async function animateOpen() {
    isAnimating.value = true
    const trigger = options.triggerRect?.value
    if (!trigger || !modalRef.value) {
      // Fallback: center scale+fade
      animationStyle.value = { transform: 'scale(0.95)', opacity: '0' }
      await nextTick()
      animationStyle.value = {
        transform: 'scale(1)',
        opacity: '1',
        transition: 'transform 300ms ease-out, opacity 300ms ease-out',
      }
      setTimeout(() => {
        animationStyle.value = {}
        isAnimating.value = false
      }, 300)
      return
    }

    // FLIP: start at trigger position
    const modalEl = modalRef.value
    // Get final position by temporarily showing at final size
    modalEl.style.visibility = 'hidden'
    modalEl.style.position = 'fixed'
    modalEl.style.left = '50%'
    modalEl.style.top = '50%'
    modalEl.style.transform = 'translate(-50%, -50%)'
    await nextTick()
    const finalRect = modalEl.getBoundingClientRect()
    modalEl.style.visibility = ''
    modalEl.style.position = ''
    modalEl.style.left = ''
    modalEl.style.top = ''
    modalEl.style.transform = ''

    // Set initial state (trigger rect)
    const startStyle = calcMorphStyle(trigger, finalRect, 0)
    Object.assign(modalEl.style, startStyle)
    modalEl.style.overflow = 'hidden'
    modalEl.style.opacity = '0'
    await nextTick()

    // Animate to final
    modalEl.style.transition = 'all 400ms cubic-bezier(0.4, 0, 0.2, 1)'
    modalEl.style.opacity = '1'
    modalEl.style.left = `${finalRect.left}px`
    modalEl.style.top = `${finalRect.top}px`
    modalEl.style.width = `${finalRect.width}px`
    modalEl.style.height = `${finalRect.height}px`
    modalEl.style.borderRadius = '24px'

    setTimeout(() => {
      // Clean up inline styles, let CSS handle positioning
      modalEl.style.transition = ''
      modalEl.style.position = ''
      modalEl.style.left = ''
      modalEl.style.top = ''
      modalEl.style.width = ''
      modalEl.style.height = ''
      modalEl.style.overflow = ''
      modalEl.style.opacity = ''
      isAnimating.value = false
    }, 400)
  }

  async function animateClose(): Promise<void> {
    isAnimating.value = true
    const trigger = options.triggerRect?.value
    if (!trigger || !modalRef.value) {
      animationStyle.value = {
        transform: 'scale(0.95)',
        opacity: '0',
        transition: 'transform 250ms ease-in, opacity 250ms ease-in',
      }
      return new Promise((resolve) => setTimeout(resolve, 250))
    }

    const modalEl = modalRef.value
    const currentRect = modalEl.getBoundingClientRect()

    modalEl.style.position = 'fixed'
    modalEl.style.left = `${currentRect.left}px`
    modalEl.style.top = `${currentRect.top}px`
    modalEl.style.width = `${currentRect.width}px`
    modalEl.style.height = `${currentRect.height}px`
    modalEl.style.overflow = 'hidden'
    await nextTick()

    modalEl.style.transition = 'all 350ms cubic-bezier(0.4, 0, 0.2, 1)'
    modalEl.style.left = `${trigger.left}px`
    modalEl.style.top = `${trigger.top}px`
    modalEl.style.width = `${trigger.width}px`
    modalEl.style.height = `${trigger.height}px`
    modalEl.style.borderRadius = '12px'
    modalEl.style.opacity = '0'

    return new Promise((resolve) => setTimeout(resolve, 350))
  }

  // ── Lifecycle ──
  watch(options.visible, async (show) => {
    if (show) {
      lockScroll()
      await nextTick()
      await animateOpen()
      document.addEventListener('keydown', handleKeydown)
    } else {
      await animateClose()
      document.removeEventListener('keydown', handleKeydown)
      unlockScroll()
      isAnimating.value = false
      animationStyle.value = {}
    }
  })

  onBeforeUnmount(() => {
    document.removeEventListener('keydown', handleKeydown)
    unlockScroll()
  })

  return {
    modalRef,
    backdropRef,
    isAnimating,
    animationStyle,
    handleBackdropClick,
  }
}
```

- [ ] **Step 2: Verify typecheck**

Run: `cd /Users/laurinfrank/Library/CloudStorage/Dropbox/Code/Web/cs2inspect-web && npx nuxi typecheck 2>&1 | grep -E 'useModalShell|error TS' | head -20`

Expected: No new errors from useModalShell.ts

---

## Task 2: `useCanvasRenderer` Composable

**Files:**
- Create: `app/composables/useCanvasRenderer.ts`

Extracts the canvas rendering logic from InlineVisualCustomizer. Handles: weapon image/video rendering, sticker/keychain drawing, empty slot indicators, selection ring + handles.

**Reference:** Read `app/components/inspect/InlineVisualCustomizer.vue` lines 1-500 for the rendering pipeline. Key functions to extract: `renderCanvas()`, `renderBackground()`, `renderElement()`, `renderSelectionRing()`, `renderSlotIndicators()`.

- [ ] **Step 1: Create the composable**

The composable accepts canvas refs and state, and provides a `render()` function. It reuses `VideoCanvasManager` from `app/utils/videoCanvas.ts` and coordinate utils from `app/utils/canvasCoordinates.ts`.

```typescript
// app/composables/useCanvasRenderer.ts
import type { CanvasElement, CanvasState, Size, Point } from '~/types/canvas'
import type { StickerConfiguration, KeychainConfiguration } from '~/types'
import {
  generateFlatImageUrl,
  generateFallbackWeaponImageUrl,
  generateDefaultFlatImageUrl,
  getDefaultStickerPosition,
  getDefaultKeychainPosition,
  getWeaponAssetSizes,
  generateStickerImageUrl,
  createCoordinateTransform,
  WEAPON_RESOLUTION_REFS,
  RESOLUTION_OVERRIDES,
} from '~/utils/canvasCoordinates'
import { VideoCanvasManager, generateVideoUrl, checkVideoExists } from '~/utils/videoCanvas'

export interface CanvasRendererOptions {
  canvas: Ref<HTMLCanvasElement | null>
  video: Ref<HTMLVideoElement | null>
  canvasState: Ref<CanvasState>
  weaponDefindex: Ref<number>
  weaponName: Ref<string>
  paintindex: Ref<number | undefined>
  wear: Ref<number>
  minWear: Ref<number>
  maxWear: Ref<number>
}

export function useCanvasRenderer(options: CanvasRendererOptions) {
  const ctx = ref<CanvasRenderingContext2D | null>(null)
  const videoManager = ref<VideoCanvasManager | null>(null)
  const isVideoMode = ref(false)
  const isVideoLoading = ref(false)
  const backgroundDrawRect = ref<{ x: number; y: number; width: number; height: number }>({ x: 0, y: 0, width: 0, height: 0 })
  const coordinateTransform = createCoordinateTransform()
  const imageCache = new Map<string, HTMLImageElement>()
  const loadingImages = new Set<string>()
  let animFrameId: number | null = null

  // ── Image loading with cache ──
  function loadImage(url: string): Promise<HTMLImageElement> {
    if (imageCache.has(url)) return Promise.resolve(imageCache.get(url)!)
    if (loadingImages.has(url)) {
      return new Promise((resolve, reject) => {
        const check = setInterval(() => {
          if (imageCache.has(url)) { clearInterval(check); resolve(imageCache.get(url)!) }
        }, 50)
        setTimeout(() => { clearInterval(check); reject(new Error('timeout')) }, 10000)
      })
    }
    loadingImages.add(url)
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => {
        imageCache.set(url, img)
        loadingImages.delete(url)
        // Evict if cache too large
        if (imageCache.size > 50) {
          const firstKey = imageCache.keys().next().value
          if (firstKey) imageCache.delete(firstKey)
        }
        resolve(img)
      }
      img.onerror = () => { loadingImages.delete(url); reject(new Error(`Failed to load: ${url}`)) }
      img.src = url
    })
  }

  // ── Canvas setup ──
  function setupCanvas() {
    const canvasEl = options.canvas.value
    if (!canvasEl) return
    const context = canvasEl.getContext('2d')
    if (!context) return
    ctx.value = context

    const dpr = window.devicePixelRatio || 1
    const rect = canvasEl.getBoundingClientRect()
    canvasEl.width = rect.width * dpr
    canvasEl.height = rect.height * dpr
    context.setTransform(dpr, 0, 0, dpr, 0, 0)

    options.canvasState.value.canvasSize = { width: rect.width, height: rect.height }
  }

  // ── Rendering pipeline ──
  // Main render — draws everything on the canvas.
  // This is the core function extracted from InlineVisualCustomizer.
  // Implementer: read InlineVisualCustomizer.vue renderCanvas() (around line 400-600)
  // and port the logic here. Key steps:
  //
  // 1. Clear canvas
  // 2. Draw background (video frame via videoManager.renderFrame() or static image)
  //    - Fit weapon image to canvas with aspect ratio (letterbox with #1a1a1a background)
  //    - Store the draw rect in backgroundDrawRect for coordinate mapping
  // 3. Draw empty slot indicators (dashed circles at default positions)
  //    - Use getDefaultStickerPosition() for slots 0-4
  //    - Use getDefaultKeychainPosition() for keychain
  //    - Only draw indicators for slots that have no element
  // 4. Draw each CanvasElement (sorted by zIndex):
  //    - Apply position transform via coordinateTransform.normalizedToCanvas()
  //    - Apply rotation and scale transforms
  //    - Draw the sticker/keychain image
  // 5. Draw selection ring on selected element:
  //    - Yellow (#FACC15) dashed border
  //    - 4 corner handle squares (5×5px)
  //    - Inverse-scale to keep visual size consistent regardless of element scale
  //
  // The actual rendering code is ~200 lines in InlineVisualCustomizer.
  // The implementer should read that file and extract the rendering logic
  // into this composable's render() function.

  function render() {
    // Implementer: port renderCanvas() from InlineVisualCustomizer.vue
    // Reference lines ~400-600 of that file.
    // Use ctx.value, options.canvasState.value, backgroundDrawRect, etc.
  }

  // ── Video setup ──
  async function setupVideo() {
    // Implementer: port video setup from InlineVisualCustomizer.vue
    // Uses generateVideoUrl(), checkVideoExists(), VideoCanvasManager
    // Reference lines ~250-350 of InlineVisualCustomizer.vue
  }

  // ── Wear update ──
  async function updateWear(wear: number) {
    if (videoManager.value && isVideoMode.value) {
      await videoManager.value.updateWear(wear)
      render()
    }
  }

  // ── Coordinate mapping (canvas pixels ↔ normalized) ──
  function normalizedToCanvasInImage(normalized: Point): Point {
    const rect = backgroundDrawRect.value
    return {
      x: rect.x + normalized.x * rect.width,
      y: rect.y + normalized.y * rect.height,
    }
  }

  function canvasToNormalizedInImage(canvasPoint: Point): Point {
    const rect = backgroundDrawRect.value
    return {
      x: (canvasPoint.x - rect.x) / rect.width,
      y: (canvasPoint.y - rect.y) / rect.height,
    }
  }

  // ── Global scale (for asset sizing relative to canvas) ──
  const globalScale = computed(() => {
    return backgroundDrawRect.value.width / 1120
  })

  // ── Lifecycle ──
  function init() {
    setupCanvas()
    setupVideo()
    render()
  }

  function destroy() {
    if (animFrameId) cancelAnimationFrame(animFrameId)
    videoManager.value?.destroy()
    imageCache.clear()
  }

  // Watch for wear changes
  watch(options.wear, (val) => updateWear(val))

  // Watch for canvas resize
  const resizeObserver = ref<ResizeObserver | null>(null)
  onMounted(() => {
    if (options.canvas.value) {
      resizeObserver.value = new ResizeObserver(() => {
        setupCanvas()
        render()
      })
      resizeObserver.value.observe(options.canvas.value)
    }
  })

  onBeforeUnmount(() => {
    resizeObserver.value?.disconnect()
    destroy()
  })

  return {
    ctx,
    isVideoMode,
    isVideoLoading,
    backgroundDrawRect,
    globalScale,
    render,
    init,
    destroy,
    setupVideo,
    updateWear,
    loadImage,
    normalizedToCanvasInImage,
    canvasToNormalizedInImage,
  }
}
```

**IMPORTANT for implementer:** The `render()` and `setupVideo()` functions above are stubs. The implementer MUST read `app/components/inspect/InlineVisualCustomizer.vue` (the full file, ~1800 lines) and extract the rendering logic. Key functions to port:
- `renderCanvas()` → `render()`
- Video initialization block → `setupVideo()`
- Image loading queue → `loadImage()` (simplified above, may need the full queue from IVC)
- `renderSlotIndicators()` logic
- `renderElement()` logic
- `renderSelectionRing()` logic

- [ ] **Step 2: Verify typecheck**

Run: `cd /Users/laurinfrank/Library/CloudStorage/Dropbox/Code/Web/cs2inspect-web && npx nuxi typecheck 2>&1 | grep useCanvasRenderer`

Expected: No new errors

---

## Task 3: `useCanvasInteraction` Composable

**Files:**
- Create: `app/composables/useCanvasInteraction.ts`

Handles all user interaction with the canvas: hit testing (which element was clicked), element selection, drag-to-reposition, scroll-to-scale, arrow-key fine adjustment.

**Reference:** Read `app/components/inspect/InlineVisualCustomizer.vue` for `handleCanvasMouseDown`, `handleCanvasMouseMove`, `handleCanvasMouseUp`, `findElementAtPosition`, `handleWheel`.

- [ ] **Step 1: Create the composable**

```typescript
// app/composables/useCanvasInteraction.ts
import type { CanvasElement, CanvasState, Point, Size } from '~/types/canvas'

export interface CanvasInteractionOptions {
  canvas: Ref<HTMLCanvasElement | null>
  canvasState: Ref<CanvasState>
  /** Convert canvas pixel coords to normalized coords within the weapon image */
  canvasToNormalized: (point: Point) => Point
  /** Convert normalized coords to canvas pixel coords */
  normalizedToCanvas: (point: Point) => Point
  /** Global scale factor for hit detection sizing */
  globalScale: Ref<number>
  /** Get asset sizes for current weapon */
  getAssetSizes: () => { stickerWidth: number; stickerHeight: number; keychainWidth: number; keychainHeight: number }
  /** Called after any interaction that changes element state */
  onStateChanged: () => void
  /** Called when an empty slot indicator is clicked */
  onEmptySlotClick: (slotIndex: number, type: 'sticker' | 'keychain') => void
}

export function useCanvasInteraction(options: CanvasInteractionOptions) {
  const selectedElementId = computed({
    get: () => options.canvasState.value.selectedElementId,
    set: (id) => { options.canvasState.value.selectedElementId = id },
  })

  const selectedElement = computed(() => {
    const id = selectedElementId.value
    if (!id) return null
    return options.canvasState.value.elements.find((e) => e.id === id) ?? null
  })

  let dragStart: Point | null = null
  let dragElementStartPos: Point | null = null

  // ── Hit testing ──
  // Implementer: port findElementAtPosition() from InlineVisualCustomizer.vue
  // It checks if a canvas pixel coordinate falls within any element's bounds
  // accounting for scale, rotation, and the global scale factor.
  // Also check empty slot indicators (dashed circles at default positions).
  function findElementAtPosition(canvasX: number, canvasY: number): CanvasElement | null {
    // Port from InlineVisualCustomizer.vue
    // Reference: search for "findElementAtPosition" in that file
    return null
  }

  function findEmptySlotAtPosition(canvasX: number, canvasY: number): { index: number; type: 'sticker' | 'keychain' } | null {
    // Check if click is within 20px radius of an empty slot indicator
    // Use getDefaultStickerPosition() / getDefaultKeychainPosition()
    // and normalizedToCanvas() to get pixel positions
    return null
  }

  // ── Selection ──
  function selectElement(id: string | null) {
    options.canvasState.value.elements.forEach((el) => { el.selected = el.id === id })
    selectedElementId.value = id
    options.onStateChanged()
  }

  // ── Mouse handlers ──
  function getCanvasCoords(e: MouseEvent): Point {
    const canvasEl = options.canvas.value
    if (!canvasEl) return { x: 0, y: 0 }
    const rect = canvasEl.getBoundingClientRect()
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }

  function handleMouseDown(e: MouseEvent) {
    const coords = getCanvasCoords(e)
    const element = findElementAtPosition(coords.x, coords.y)

    if (element) {
      selectElement(element.id)
      dragStart = coords
      dragElementStartPos = { ...element.position }
      options.canvasState.value.isDragging = true
    } else {
      // Check empty slots
      const slot = findEmptySlotAtPosition(coords.x, coords.y)
      if (slot) {
        options.onEmptySlotClick(slot.index, slot.type)
      } else {
        selectElement(null)
      }
    }
  }

  function handleMouseMove(e: MouseEvent) {
    if (!options.canvasState.value.isDragging || !dragStart || !dragElementStartPos) return
    const el = selectedElement.value
    if (!el) return

    const coords = getCanvasCoords(e)
    const dx = coords.x - dragStart.x
    const dy = coords.y - dragStart.y

    // Convert pixel delta to normalized delta
    const startCanvas = options.normalizedToCanvas(dragElementStartPos)
    const newCanvas = { x: startCanvas.x + dx, y: startCanvas.y + dy }
    const newNormalized = options.canvasToNormalized(newCanvas)

    el.position = newNormalized
    options.onStateChanged()
  }

  function handleMouseUp() {
    options.canvasState.value.isDragging = false
    dragStart = null
    dragElementStartPos = null
  }

  // ── Scroll to scale ──
  function handleWheel(e: WheelEvent) {
    e.preventDefault()
    const el = selectedElement.value
    if (!el) return
    const delta = e.deltaY > 0 ? -0.05 : 0.05
    el.scale = Math.max(0.1, Math.min(2.0, el.scale + delta))
    options.onStateChanged()
  }

  // ── Arrow keys for fine adjustment ──
  function handleKeydown(e: KeyboardEvent) {
    const el = selectedElement.value
    if (!el) return
    const step = e.shiftKey ? 0.0005 : 0.005
    let handled = false
    switch (e.key) {
      case 'ArrowLeft': el.position.x -= step; handled = true; break
      case 'ArrowRight': el.position.x += step; handled = true; break
      case 'ArrowUp': el.position.y -= step; handled = true; break
      case 'ArrowDown': el.position.y += step; handled = true; break
    }
    if (handled) {
      e.preventDefault()
      options.onStateChanged()
    }
  }

  // ── Scale/rotation from toolbar ──
  function updateScale(delta: number) {
    const el = selectedElement.value
    if (!el) return
    el.scale = Math.max(0.1, Math.min(2.0, el.scale + delta))
    options.onStateChanged()
  }

  function updateRotation(delta: number) {
    const el = selectedElement.value
    if (!el) return
    el.rotation = (el.rotation + delta) % 360
    options.onStateChanged()
  }

  function updateWear(wear: number) {
    const el = selectedElement.value
    if (!el || el.type !== 'sticker') return
    el.wear = wear
    options.onStateChanged()
  }

  function removeSelected() {
    const id = selectedElementId.value
    if (!id) return
    options.canvasState.value.elements = options.canvasState.value.elements.filter((e) => e.id !== id)
    selectElement(null)
  }

  // ── Attach/detach canvas listeners ──
  function attach() {
    const canvasEl = options.canvas.value
    if (!canvasEl) return
    canvasEl.addEventListener('mousedown', handleMouseDown)
    canvasEl.addEventListener('mousemove', handleMouseMove)
    canvasEl.addEventListener('mouseup', handleMouseUp)
    canvasEl.addEventListener('mouseleave', handleMouseUp)
    canvasEl.addEventListener('wheel', handleWheel, { passive: false })
  }

  function detach() {
    const canvasEl = options.canvas.value
    if (!canvasEl) return
    canvasEl.removeEventListener('mousedown', handleMouseDown)
    canvasEl.removeEventListener('mousemove', handleMouseMove)
    canvasEl.removeEventListener('mouseup', handleMouseUp)
    canvasEl.removeEventListener('mouseleave', handleMouseUp)
    canvasEl.removeEventListener('wheel', handleWheel)
  }

  onMounted(attach)
  onBeforeUnmount(detach)

  return {
    selectedElement,
    selectedElementId,
    selectElement,
    updateScale,
    updateRotation,
    updateWear,
    removeSelected,
    handleKeydown,
  }
}
```

**IMPORTANT for implementer:** `findElementAtPosition()` and `findEmptySlotAtPosition()` are stubs. Port the hit-testing logic from InlineVisualCustomizer.vue — search for `findElementAtPosition` in that file.

- [ ] **Step 2: Verify typecheck**

---

## Task 4: `ModalShell.vue` Component

**Files:**
- Create: `app/components/modal/weapon-skin-v2/ModalShell.vue`

The custom modal shell — replaces NModal entirely. Renders backdrop + centered modal card with header, content, and FLIP morph animation.

- [ ] **Step 1: Create the component**

```vue
<!-- app/components/modal/weapon-skin-v2/ModalShell.vue -->
<script setup lang="ts">
import { useModalShell } from '~/composables/useModalShell'

interface Props {
  visible: boolean
  triggerRect?: DOMRect | null
}

const props = withDefaults(defineProps<Props>(), {
  triggerRect: null,
})

const emit = defineEmits<{
  'update:visible': [value: boolean]
}>()

const visibleRef = computed(() => props.visible)
const triggerRectRef = computed(() => props.triggerRect ?? null)

const { modalRef, backdropRef, isAnimating, handleBackdropClick } = useModalShell({
  visible: visibleRef,
  onClose: () => emit('update:visible', false),
  triggerRect: triggerRectRef,
})
</script>

<template>
  <Teleport to="body">
    <Transition name="modal-backdrop">
      <div
        v-if="visible"
        ref="backdropRef"
        class="fixed inset-0 z-[2000] flex items-center justify-center"
        style="background: rgba(0, 0, 0, 0.6)"
        @click="handleBackdropClick"
      >
        <div
          ref="modalRef"
          class="modal-shell relative flex flex-col"
          style="max-width: 1800px; width: 95vw; max-height: 90vh"
          :class="{ 'pointer-events-none': isAnimating }"
          @click.stop
        >
          <!-- Header -->
          <div class="flex items-center gap-2 px-5 py-3 border-b border-white/5">
            <slot name="header" />
            <div class="flex-1" />
            <slot name="header-extra" />
            <button
              class="w-7 h-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
              @click="emit('update:visible', false)"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6L6 18"/><path d="M6 6l12 12"/></svg>
            </button>
          </div>

          <!-- Content (scrollable) -->
          <div class="flex-1 overflow-y-auto overflow-x-hidden">
            <slot />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-shell {
  background: var(--glass-bg-primary, rgba(18, 18, 18, 0.95));
  border-radius: 24px;
  box-shadow:
    0 32px 64px rgba(0, 0, 0, 0.9),
    0 0 0 1px rgba(255, 255, 255, 0.05),
    inset 0 1px 0 rgba(255, 255, 255, 0.05);
  color: #fff;
}

.modal-backdrop-enter-active { transition: opacity 300ms ease-out; }
.modal-backdrop-leave-active { transition: opacity 250ms ease-in; }
.modal-backdrop-enter-from,
.modal-backdrop-leave-to { opacity: 0; }
</style>
```

- [ ] **Step 2: Verify typecheck**

---

## Task 5: `CanvasPreview.vue` Component

**Files:**
- Create: `app/components/modal/weapon-skin-v2/CanvasPreview.vue`

The always-on canvas that renders the weapon + stickers. Uses `useCanvasRenderer` and `useCanvasInteraction`.

- [ ] **Step 1: Create the component**

```vue
<!-- app/components/modal/weapon-skin-v2/CanvasPreview.vue -->
<script setup lang="ts">
import type { CanvasState, CanvasElement } from '~/types/canvas'
import type { StickerConfiguration, KeychainConfiguration } from '~/types'
import { useCanvasRenderer } from '~/composables/useCanvasRenderer'
import { useCanvasInteraction } from '~/composables/useCanvasInteraction'
import { getWeaponAssetSizes } from '~/utils/canvasCoordinates'

interface Props {
  canvasState: CanvasState
  weaponDefindex: number
  weaponName: string
  paintindex?: number
  wear: number
  minWear: number
  maxWear: number
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:canvasState': [state: CanvasState]
  'element-selected': [element: CanvasElement | null]
  'empty-slot-click': [index: number, type: 'sticker' | 'keychain']
}>()

const canvasRef = ref<HTMLCanvasElement | null>(null)
const videoRef = ref<HTMLVideoElement | null>(null)
const canvasStateRef = computed({
  get: () => props.canvasState,
  set: (val) => emit('update:canvasState', val),
})

const renderer = useCanvasRenderer({
  canvas: canvasRef,
  video: videoRef,
  canvasState: canvasStateRef,
  weaponDefindex: computed(() => props.weaponDefindex),
  weaponName: computed(() => props.weaponName),
  paintindex: computed(() => props.paintindex),
  wear: computed(() => props.wear),
  minWear: computed(() => props.minWear),
  maxWear: computed(() => props.maxWear),
})

const interaction = useCanvasInteraction({
  canvas: canvasRef,
  canvasState: canvasStateRef,
  canvasToNormalized: renderer.canvasToNormalizedInImage,
  normalizedToCanvas: renderer.normalizedToCanvasInImage,
  globalScale: renderer.globalScale,
  getAssetSizes: () => getWeaponAssetSizes(props.weaponDefindex),
  onStateChanged: () => renderer.render(),
  onEmptySlotClick: (index, type) => emit('empty-slot-click', index, type),
})

// Forward selection changes
watch(interaction.selectedElement, (el) => emit('element-selected', el))

// Expose for parent to call
defineExpose({
  render: renderer.render,
  init: renderer.init,
  handleKeydown: interaction.handleKeydown,
  selectElement: interaction.selectElement,
})

onMounted(() => renderer.init())
</script>

<template>
  <div class="relative">
    <video ref="videoRef" crossorigin="anonymous" playsinline style="display: none" />
    <canvas
      ref="canvasRef"
      class="w-full cursor-crosshair"
      style="height: 400px; background: #0f0f0f; border-radius: 8px;"
    />
  </div>
</template>
```

- [ ] **Step 2: Verify typecheck**

---

## Task 6: `FloatingSettings.vue`, `StickerBar.vue`, `EditToolbar.vue`

**Files:**
- Create: `app/components/modal/weapon-skin-v2/FloatingSettings.vue`
- Create: `app/components/modal/weapon-skin-v2/StickerBar.vue`
- Create: `app/components/modal/weapon-skin-v2/EditToolbar.vue`

Three smaller UI components. These are mostly template/styling — minimal logic.

- [ ] **Step 1: Create FloatingSettings.vue**

```vue
<!-- app/components/modal/weapon-skin-v2/FloatingSettings.vue -->
<script setup lang="ts">
import type { WeaponConfiguration } from '~/types'

interface Props {
  customization: WeaponConfiguration
  selectedSkinName: string
  availableTeams?: string
  minFloat: number
  maxFloat: number
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:customization': [value: WeaponConfiguration]
  'duplicate': []
}>()

const { t } = useI18n()

// Proxy for v-model bindings
const c = computed({
  get: () => props.customization,
  set: (val) => emit('update:customization', val),
})

const digitOnlyInputProps = { inputmode: 'numeric' as const, pattern: '[0-9]*' }
</script>

<template>
  <div
    class="absolute top-3 right-3 z-30"
    style="width: 220px; padding: 12px; background: rgba(18,18,18,0.92); backdrop-filter: blur(12px); border: 1px solid rgba(255,255,255,0.07); border-radius: 8px; box-shadow: 0 6px 24px rgba(0,0,0,0.5);"
    @click.stop
  >
    <!-- StatTrak -->
    <div class="flex items-center justify-between mb-1.5">
      <span class="text-xs text-gray-400">{{ t('modals.weaponSkin.labels.stattrak') }}</span>
      <NSwitch v-model:value="c.stattrak_enabled" size="small" />
    </div>
    <NInputNumber
      v-if="c.stattrak_enabled"
      v-model:value="c.stattrak_count"
      :min="0" :max="99999" size="tiny"
      class="w-full mb-1.5"
      :input-props="digitOnlyInputProps"
    />

    <!-- Wear Slider -->
    <WearSlider
      v-model="c.paintwear"
      :max="maxFloat"
      :min="minFloat"
    />

    <!-- Paint Index -->
    <div class="flex items-center justify-between mt-1.5 mb-1">
      <span class="text-xs text-gray-400">{{ t('modals.weaponSkin.labels.paintIndex') }}</span>
      <NSwitch v-model:value="c.paintIndexOverride" size="small" />
    </div>
    <NInputNumber
      v-model:value="c.paintindex"
      :min="0" :max="9999" size="tiny"
      :disabled="!c.paintIndexOverride"
      :input-props="digitOnlyInputProps"
      class="w-full mb-1.5"
    />

    <!-- Seed -->
    <div class="flex items-center justify-between mb-1">
      <span class="text-xs text-gray-400">{{ t('modals.weaponSkin.labels.pattern') }}</span>
    </div>
    <NInputNumber
      v-model:value="c.paintseed"
      :min="0" :max="1000" size="tiny"
      :input-props="digitOnlyInputProps"
      class="w-full mb-1.5"
    />

    <!-- Name Tag -->
    <NInput
      v-model:value="c.nametag"
      :placeholder="t('modals.weaponSkin.inputs.nameTagPlaceholder') as string"
      size="tiny" maxlength="20" show-count
      class="mb-1.5"
    />

    <!-- Active -->
    <div class="flex items-center gap-2 mb-2">
      <NSwitch v-model:value="c.active" size="small">
        <template #checked>{{ t('modals.weaponSkin.labels.itemActive') }}</template>
        <template #unchecked>{{ t('modals.weaponSkin.labels.itemInactive') }}</template>
      </NSwitch>
    </div>

    <!-- Duplicate -->
    <button
      v-if="availableTeams === 'both'"
      class="w-full text-center text-xs py-1.5 px-2 rounded bg-[#1a1a1a] border border-[#2a2a2a] text-gray-400 hover:text-gray-200 hover:border-[#444] transition-colors"
      @click="emit('duplicate')"
    >
      {{ t('modals.weaponSkin.buttons.duplicate') }} →
    </button>
  </div>
</template>
```

- [ ] **Step 2: Create StickerBar.vue**

```vue
<!-- app/components/modal/weapon-skin-v2/StickerBar.vue -->
<script setup lang="ts">
import type { StickerConfiguration, KeychainConfiguration } from '~/types'
import { generateStickerImageUrl, generateFlatKeychainUrl } from '~/utils/canvasCoordinates'

interface Props {
  stickers: (StickerConfiguration | null)[]
  keychain: KeychainConfiguration | null
  selectedSlotIndex: number | null
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'slot-click': [index: number]
  'keychain-click': []
  'drag-start': [event: DragEvent, index: number]
  'drag-end': []
  'drag-over': [event: DragEvent]
  'drag-leave': [event: DragEvent]
  'drop': [event: DragEvent, index: number]
}>()
</script>

<template>
  <div
    class="absolute bottom-3 left-3 z-20 flex items-center gap-1"
    style="padding: 6px 8px; background: rgba(18,18,18,0.92); backdrop-filter: blur(12px); border: 1px solid rgba(255,255,255,0.07); border-radius: 8px; box-shadow: 0 6px 24px rgba(0,0,0,0.5);"
    @click.stop
  >
    <!-- Sticker slots -->
    <div
      v-for="(sticker, index) in stickers"
      :key="'slot-' + index"
      class="w-7 h-7 rounded flex items-center justify-center cursor-pointer flex-shrink-0 overflow-hidden transition-all duration-150"
      :class="{
        'border border-dashed border-[#444] bg-white/5': !sticker,
        'border border-solid border-[var(--selection-ring)] bg-[rgba(26,26,10,0.6)]': sticker && selectedSlotIndex !== index,
        'border-2 border-solid border-[#22d3ee] bg-[rgba(10,26,26,0.6)] shadow-[0_0_8px_rgba(34,211,238,0.3)]': selectedSlotIndex === index,
      }"
      :title="sticker?.api?.name || `Sticker #${index + 1}`"
      draggable="true"
      @dragstart="emit('drag-start', $event, index)"
      @dragend="emit('drag-end')"
      @dragover="emit('drag-over', $event)"
      @dragleave="emit('drag-leave', $event)"
      @drop="emit('drop', $event, index)"
      @click.stop="emit('slot-click', index)"
    >
      <img
        v-if="sticker"
        :src="generateStickerImageUrl(sticker.id, sticker.wear || 0)"
        :alt="sticker.api?.name ?? ''"
        class="w-full h-full object-contain"
      />
      <span v-else class="text-[8px] text-gray-500">+</span>
    </div>

    <!-- Divider -->
    <div class="w-px h-4 bg-[#333] mx-1" />

    <!-- Keychain slot -->
    <div
      class="w-7 h-7 rounded flex items-center justify-center cursor-pointer flex-shrink-0 overflow-hidden transition-all duration-150"
      :class="{
        'border border-dashed border-[#444] bg-white/5': !keychain,
        'border border-solid border-[var(--selection-ring)] bg-[rgba(26,26,10,0.6)]': keychain,
      }"
      :title="keychain?.api?.name || 'Keychain'"
      @click.stop="emit('keychain-click')"
    >
      <img
        v-if="keychain"
        :src="generateFlatKeychainUrl(keychain.api?.name ?? '', keychain.seed, undefined, keychain.wrapped_sticker_id || undefined)"
        :alt="keychain.api?.name ?? ''"
        class="w-full h-full object-contain"
      />
      <span v-else class="text-[8px] text-gray-500">+</span>
    </div>
  </div>
</template>
```

- [ ] **Step 3: Create EditToolbar.vue**

```vue
<!-- app/components/modal/weapon-skin-v2/EditToolbar.vue -->
<script setup lang="ts">
import type { CanvasElement } from '~/types/canvas'
import { generateStickerImageUrl } from '~/utils/canvasCoordinates'

interface Props {
  element: CanvasElement
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update-scale': [delta: number]
  'update-rotation': [delta: number]
  'change': []
  'remove': []
}>()
</script>

<template>
  <Transition name="toolbar-slide">
    <div
      class="flex items-center gap-2 px-3 py-2 text-sm text-gray-400"
      style="background: rgba(18,18,18,0.95); backdrop-filter: blur(8px); border-top: 1px solid rgba(255,255,255,0.05); border-bottom: 1px solid rgba(255,255,255,0.05);"
    >
      <!-- Thumbnail -->
      <div class="w-6 h-6 rounded bg-[#1a1a1a] border border-[#2a2a2a] flex items-center justify-center overflow-hidden flex-shrink-0">
        <img
          v-if="element.type === 'sticker'"
          :src="generateStickerImageUrl(Number(element.assetId), element.wear || 0)"
          class="w-full h-full object-contain"
        />
      </div>

      <!-- Name -->
      <span class="text-xs text-gray-200 font-semibold truncate max-w-[140px]">{{ element.apiData.name }}</span>

      <div class="w-px h-4 bg-[#333]" />

      <!-- Scale -->
      <span class="text-[10px]">Scale</span>
      <button class="text-[10px] px-1.5 py-0.5 rounded bg-[#222] border border-[#333] hover:text-white transition-colors" @click="emit('update-scale', -0.1)">−</button>
      <span class="text-[10px] text-gray-200 font-mono w-6 text-center">{{ element.scale.toFixed(1) }}</span>
      <button class="text-[10px] px-1.5 py-0.5 rounded bg-[#222] border border-[#333] hover:text-white transition-colors" @click="emit('update-scale', 0.1)">+</button>

      <div class="w-px h-4 bg-[#333]" />

      <!-- Rotation -->
      <span class="text-[10px]">Rot</span>
      <button class="text-[10px] px-1.5 py-0.5 rounded bg-[#222] border border-[#333] hover:text-white transition-colors" @click="emit('update-rotation', -5)">↺</button>
      <span class="text-[10px] text-gray-200 font-mono w-6 text-center">{{ element.rotation }}°</span>
      <button class="text-[10px] px-1.5 py-0.5 rounded bg-[#222] border border-[#333] hover:text-white transition-colors" @click="emit('update-rotation', 5)">↻</button>

      <div class="w-px h-4 bg-[#333]" />

      <!-- Wear (stickers only) -->
      <template v-if="element.type === 'sticker'">
        <span class="text-[10px]">Wear</span>
        <span class="text-[10px] text-gray-200 font-mono">{{ (element.wear ?? 0).toFixed(2) }}</span>
        <div class="w-px h-4 bg-[#333]" />
      </template>

      <!-- Position -->
      <span class="text-[10px]">Pos</span>
      <span class="text-[10px] text-gray-200 font-mono">{{ element.position.x.toFixed(2) }}, {{ element.position.y.toFixed(2) }}</span>

      <div class="flex-1" />

      <!-- Actions -->
      <button class="text-[10px] px-2 py-0.5 rounded bg-[#222] border border-[#333] text-gray-400 hover:text-white transition-colors" @click="emit('change')">Change</button>
      <button class="text-[10px] px-2 py-0.5 rounded bg-[#222] border border-[#3a1a1a] text-red-400 hover:text-red-300 transition-colors" @click="emit('remove')">Remove</button>
    </div>
  </Transition>
</template>

<style scoped>
.toolbar-slide-enter-active { transition: all 200ms ease-out; }
.toolbar-slide-leave-active { transition: all 150ms ease-in; }
.toolbar-slide-enter-from,
.toolbar-slide-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
```

- [ ] **Step 4: Verify typecheck**

---

## Task 7: `SkinGrid.vue` Component

**Files:**
- Create: `app/components/modal/weapon-skin-v2/SkinGrid.vue`

Infinite scroll grid of weapon skins. Uses `useInfiniteScroll`.

- [ ] **Step 1: Create the component**

```vue
<!-- app/components/modal/weapon-skin-v2/SkinGrid.vue -->
<script setup lang="ts">
import type { IEnhancedWeapon } from '~/types'
import { useInfiniteScroll } from '~/composables/useInfiniteScroll'
import { hexToRgba } from '~/utils/themeCustomization'

interface Props {
  skins: IEnhancedWeapon[]
  isLoading: boolean
  isLoadingMore: boolean
  hasMore: boolean
  selectedPaintIndex: number
  sortBy: string
  sortDir: 'asc' | 'desc'
  availableRarities: Array<{ id: number; name: string; color: string }>
  activeRarityIds: Set<number>
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'select-skin': [skin: IEnhancedWeapon]
  'load-more': []
  'toggle-sort-dir': []
  'update:sort-by': [value: string]
  'toggle-rarity': [id: number]
}>()

const { t } = useI18n()

const scrollContainerRef = ref<HTMLElement | null>(null)
const { sentinelRef } = useInfiniteScroll({
  onLoadMore: () => emit('load-more'),
  rootMargin: '200px',
  enabled: computed(() => props.hasMore && !props.isLoading),
  root: scrollContainerRef,
})
</script>

<template>
  <div ref="scrollContainerRef">
    <!-- Sort + filter controls -->
    <div class="flex items-center justify-between px-3 py-2 text-xs text-gray-500 border-b border-white/5">
      <div class="flex items-center gap-2">
        <span>Sort:</span>
        <NSelect
          :value="sortBy"
          :options="[
            { label: String(t('modals.weaponSkin.sort.name')), value: 'name' },
            { label: String(t('modals.weaponSkin.sort.rarity')), value: 'rarity' },
          ]"
          size="tiny"
          class="w-24"
          @update:value="emit('update:sort-by', $event)"
        />
        <button class="hover:text-white transition-colors" @click="emit('toggle-sort-dir')">
          {{ sortDir === 'asc' ? '↑' : '↓' }}
        </button>
      </div>
      <div class="flex items-center gap-2">
        <span>Rarity</span>
        <button
          v-for="rarity in availableRarities"
          :key="rarity.id"
          class="w-2.5 h-2.5 rounded-full transition-opacity"
          :style="{ background: rarity.color }"
          :class="activeRarityIds.has(rarity.id) ? 'opacity-100' : 'opacity-30'"
          :title="rarity.name"
          @click="emit('toggle-rarity', rarity.id)"
        />
      </div>
    </div>

    <!-- Loading skeleton -->
    <div v-if="isLoading" class="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 p-3">
      <div v-for="i in 10" :key="i" class="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-dark)] p-3">
        <NSkeleton height="96px" />
        <div class="mt-2"><NSkeleton text :repeat="1" /><div class="mt-1"><NSkeleton height="3px" /></div></div>
      </div>
    </div>

    <!-- Skin cards -->
    <div v-else class="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 p-3">
      <NCard
        v-for="skin in skins"
        :key="skin.id"
        :style="{
          borderColor: skin.rarity?.color || '#313030',
          background: 'linear-gradient(135deg, #101010, ' + (hexToRgba(skin.rarity?.color, '0.15') || '#313030') + ')',
        }"
        :class="[
          'hover:shadow-lg cursor-pointer transition-all rounded-xl',
          selectedPaintIndex === Number(skin.paint_index) ? 'ring-2 ring-[var(--selection-ring)] border-0 opacity-85' : '',
        ]"
        @click="emit('select-skin', skin)"
      >
        <div class="flex flex-col items-center">
          <img :src="skin.image" :alt="skin.name" class="w-full h-24 object-contain mb-1.5" loading="lazy" />
          <div class="w-full">
            <p class="text-xs text-white truncate">{{ skin.name }}</p>
            <div class="h-0.5 mt-1.5 rounded-full" :style="{ background: skin.rarity?.color || '#313030' }" />
          </div>
        </div>
      </NCard>
    </div>

    <!-- Loading more skeleton -->
    <div v-if="isLoadingMore" class="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 px-3 pb-3">
      <div v-for="i in 5" :key="'skel-' + i" class="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-dark)] p-3 animate-pulse">
        <div class="h-24 bg-[var(--bg-secondary)] rounded" />
        <div class="mt-2 h-3 bg-[var(--bg-secondary)] rounded w-3/4" />
      </div>
    </div>

    <!-- Sentinel -->
    <div ref="sentinelRef" class="h-1" />

    <!-- No results -->
    <div v-if="!isLoading && skins.length === 0" class="flex justify-center items-center h-48">
      <NEmpty :description="String(t('modals.weaponSkin.noSearchResults'))" />
    </div>
  </div>
</template>
```

- [ ] **Step 2: Verify typecheck**

---

## Task 8: `WeaponSkinModalV2.vue` Orchestrator

**Files:**
- Create: `app/components/modal/WeaponSkinModalV2.vue`

The main component that ties everything together. Same props/emits interface as V1.

- [ ] **Step 1: Create the orchestrator**

This is the largest component but should still stay under ~400 lines since logic is in composables and sub-components.

The orchestrator:
1. Accepts same props as V1 (`visible`, `weapon`, `pageSize`, + new `triggerRect`)
2. Same emits as V1 (`update:visible`, `select`, `auto-save`, `duplicate`, `error`)
3. Uses `useItemModal` for skin fetching/filtering (existing)
4. Manages `canvasState` — converts between `StickerConfiguration[]` ↔ `CanvasElement[]` using `stickerToCanvasElement`/`canvasElementToSticker` from `canvasCoordinates.ts`
5. Renders `ModalShell` > `CanvasPreview` + `FloatingSettings` + `StickerBar` + `EditToolbar` + `SkinGrid`
6. Handles all cross-component events (skin select, sticker add/remove, etc.)
7. Auto-save via `useAutoSave`

**IMPORTANT for implementer:** Read `app/components/modal/WeaponSkinModal.vue` (the full V1 file) to understand:
- How `customization` ref is initialized from `props.weapon`
- How `selectedSkin` is managed
- How video preview is set up
- How sticker drag-and-drop reorder works
- How `handleSkinSave`, `handleAutoSave`, `handleSkinSelect` work
- How keyboard shortcuts are handled
- How child modals (StickerModal, KeychainModal, etc.) are integrated

The V2 orchestrator should replicate ALL of this business logic, but delegate rendering to the sub-components.

```vue
<!-- app/components/modal/WeaponSkinModalV2.vue -->
<script setup lang="ts">
// Implementer: this is a scaffold. Read WeaponSkinModal.vue (V1) in full
// and port all business logic here, delegating rendering to sub-components.

import type { IEnhancedWeapon, WeaponConfiguration, StickerConfiguration, KeychainConfiguration } from '~/types'
import type { CanvasState, CanvasElement } from '~/types/canvas'
import {
  stickerToCanvasElement,
  canvasElementToSticker,
  keychainToCanvasElement,
  canvasElementToKeychain,
} from '~/utils/canvasCoordinates'

interface Props {
  visible: boolean
  weapon: IEnhancedWeapon | null
  isLoading?: boolean
  pageSize?: number
  triggerRect?: DOMRect | null
}

const props = withDefaults(defineProps<Props>(), {
  isLoading: false,
  pageSize: 10,
  triggerRect: null,
})

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
  (e: 'select' | 'duplicate' | 'auto-save', skin: IEnhancedWeapon, customization: WeaponConfiguration): void
  (e: 'error', error: string): void
}>()

const { t } = useI18n()

// ── State ──
const selectedSkin = ref<IEnhancedWeapon | null>(null)
const customization = ref<WeaponConfiguration>(/* init from weapon prop — port from V1 */)
const canvasState = ref<CanvasState>({
  elements: [],
  selectedElementId: null,
  canvasSize: { width: 1120, height: 500 },
  weaponImage: '',
  isDragging: false,
  isEditing: true,
})

// ── Item modal (skins, sort, filter, infinite scroll) ──
const {
  state, apiState, PAGE_SIZE,
  sortBy, sortDir, rarityFilterIds, availableRarities,
  sortedSkins, displayedSkins, hasMore, loadMore,
  fetchSkins, clearState, toggleSortDir, toggleRarityFilter,
} = useItemModal({ itemType: 'weapon', pageSize: props.pageSize, enableSortFilter: true })

// ── Canvas state sync ──
// Convert stickers/keychain → canvas elements when customization changes
// Convert canvas elements → stickers/keychain when canvas state changes
// Implementer: use stickerToCanvasElement() and canvasElementToSticker()
// from canvasCoordinates.ts. Port the sync logic from InlineVisualCustomizer.vue.

// ── Child modal state ──
const showStickerModal = ref(false)
const showKeychainModal = ref(false)
const currentStickerPosition = ref(0)
const showHistoryPanel = ref(false)
const showInspectUrlModal = ref(false)
const showDuplicateConfirm = ref(false)
const showResetConfirm = ref(false)

// ── Selected element (from canvas interaction) ──
const selectedElement = ref<CanvasElement | null>(null)

function handleElementSelected(el: CanvasElement | null) {
  selectedElement.value = el
}

function handleEmptySlotClick(index: number, type: 'sticker' | 'keychain') {
  if (type === 'sticker') {
    currentStickerPosition.value = index
    showStickerModal.value = true
  } else {
    showKeychainModal.value = true
  }
}

// ── Handlers ──
// Implementer: port handleSkinSelect, handleAutoSave, handleClose,
// handleAddSticker, handleRemoveSticker, handleStickerDragReorder,
// handleInspectLink, handleDuplicate, handleReset, keyboard shortcuts
// from WeaponSkinModal.vue (V1)

function handleClose() {
  emit('update:visible', false)
}
</script>

<template>
  <ModalShell
    :visible="visible"
    :trigger-rect="triggerRect"
    @update:visible="emit('update:visible', $event)"
  >
    <template #header>
      <span class="text-lg font-bold">{{ weapon?.weapon_name || '' }}</span>
      <!-- Team badge, save status — port from V1 -->
    </template>

    <template #header-extra>
      <!-- Reset, History, Import, Generate Link, Search — port from V1 header-extra -->
      <SButton variant="light" size="sm" @click="showResetConfirm = true">Reset</SButton>
      <SButton variant="light" size="sm" @click="showHistoryPanel = true">History</SButton>
      <NInput v-model:value="state.searchQuery" :placeholder="t('modals.weaponSkin.inputs.searchPlaceholder') as string" size="small" class="max-w-72" />
    </template>

    <!-- Canvas + floating panels -->
    <div class="relative">
      <div class="pr-[240px]">
        <CanvasPreview
          :canvas-state="canvasState"
          :weapon-defindex="selectedSkin?.weapon_defindex || 0"
          :weapon-name="selectedSkin?.weapon_name || ''"
          :paintindex="customization.paintindex"
          :wear="customization.paintwear"
          :min-wear="selectedSkin?.minFloat || 0"
          :max-wear="selectedSkin?.maxFloat || 1"
          @element-selected="handleElementSelected"
          @empty-slot-click="handleEmptySlotClick"
        />
      </div>

      <FloatingSettings
        :customization="customization"
        :selected-skin-name="selectedSkin?.name || ''"
        :available-teams="selectedSkin?.availableTeams"
        :min-float="selectedSkin?.minFloat || 0"
        :max-float="selectedSkin?.maxFloat || 1"
        @update:customization="customization = $event"
        @duplicate="showDuplicateConfirm = true"
      />

      <StickerBar
        :stickers="customization.stickers"
        :keychain="customization.keychain"
        :selected-slot-index="selectedElement?.slotIndex ?? null"
        @slot-click="(i) => { /* select on canvas or open modal */ }"
        @keychain-click="showKeychainModal = true"
      />
    </div>

    <!-- Edit toolbar (when sticker selected) -->
    <EditToolbar
      v-if="selectedElement"
      :element="selectedElement"
      @update-scale="(d) => { /* forward to canvas interaction */ }"
      @update-rotation="(d) => { /* forward to canvas interaction */ }"
      @change="currentStickerPosition = selectedElement!.slotIndex!; showStickerModal = true"
      @remove="/* remove from canvas and customization */"
    />

    <!-- Skin grid -->
    <SkinGrid
      :skins="displayedSkins"
      :is-loading="state.isLoadingSkins"
      :is-loading-more="state.isLoadingMore"
      :has-more="hasMore"
      :selected-paint-index="customization.paintindex"
      :sort-by="sortBy"
      :sort-dir="sortDir"
      :available-rarities="availableRarities"
      :active-rarity-ids="rarityFilterIds"
      @select-skin="/* handleSkinSelect */"
      @load-more="loadMore"
      @toggle-sort-dir="toggleSortDir"
      @update:sort-by="sortBy = $event"
      @toggle-rarity="toggleRarityFilter"
    />

    <!-- Child modals — port from V1 -->
    <LazyStickerModal v-model:visible="showStickerModal" :position="currentStickerPosition" />
    <KeychainModal v-model:visible="showKeychainModal" />
    <InspectURLModal v-model:visible="showInspectUrlModal" />
    <DuplicateItemModal v-model:visible="showDuplicateConfirm" />
    <ResetModal v-model:visible="showResetConfirm" />
    <LazyItemHistoryPanel v-model:visible="showHistoryPanel" />
  </ModalShell>
</template>
```

**IMPORTANT for implementer:** This is a SCAFFOLD. The `/* port from V1 */` comments indicate where you must read `WeaponSkinModal.vue` and replicate the business logic. Every handler, every watcher, every computed property from V1 must be ported. The V2 orchestrator should be functionally identical to V1 — just with different rendering (sub-components instead of inline template).

- [ ] **Step 2: Verify typecheck**

---

## Task 9: Wire Up Parent Component

**Files:**
- Modify: `app/pages/weapons/[type].vue`

Swap `WeaponSkinModal` → `WeaponSkinModalV2` in the parent page and pass `triggerRect`.

- [ ] **Step 1: Add triggerRect tracking**

In the parent component's script, add:

```typescript
const weaponCardTriggerRect = ref<DOMRect | null>(null)

// Update handleWeaponClick to capture the card's bounding rect:
const handleWeaponClick = (weapon: IEnhancedWeapon, event?: MouseEvent) => {
  selectedWeapon.value = weapon
  if (event?.currentTarget instanceof HTMLElement) {
    weaponCardTriggerRect.value = event.currentTarget.getBoundingClientRect()
  }
  showSkinModal.value = true
}
```

- [ ] **Step 2: Swap the component in template**

Replace:
```vue
<LazyWeaponSkinModal ... />
```

With:
```vue
<LazyWeaponSkinModalV2
  v-if="user"
  v-model:visible="showSkinModal"
  :weapon="selectedWeapon"
  :trigger-rect="weaponCardTriggerRect"
  @select="handleSkinSave"
  @auto-save="handleAutoSave"
  @duplicate="handleWeaponDuplicate"
/>
```

- [ ] **Step 3: Update the weapon card click handlers to pass the event**

Find the weapon card click handlers in the template and ensure they pass the mouse event:

```vue
@click="handleWeaponClick(weapon, $event)"
```

- [ ] **Step 4: Verify typecheck and manual test**

Run: `cd /Users/laurinfrank/Library/CloudStorage/Dropbox/Code/Web/cs2inspect-web && npx nuxi typecheck`
Then: `npx nuxi dev` and test the modal opens/closes correctly

---

## Task 10: Port Canvas Rendering from InlineVisualCustomizer

**Files:**
- Modify: `app/composables/useCanvasRenderer.ts` (fill in the stubs)

This is the most critical implementation task. The implementer must read `app/components/inspect/InlineVisualCustomizer.vue` in full (~1800 lines) and extract the rendering pipeline into `useCanvasRenderer.ts`.

- [ ] **Step 1: Port `renderCanvas()` → `render()`**

Read InlineVisualCustomizer.vue and find the `renderCanvas()` function (search for it). Port the full rendering logic:

1. Clear canvas with `#1a1a1a` background
2. Render weapon background (video frame or static image with aspect ratio fitting)
3. Render empty slot indicators (dashed circles)
4. Render each canvas element (sticker/keychain images with transforms)
5. Render selection ring on selected element

- [ ] **Step 2: Port video initialization → `setupVideo()`**

Read InlineVisualCustomizer.vue and find where `VideoCanvasManager` is created and `videoUrl` is set. Port that logic.

- [ ] **Step 3: Port image loading queue**

The current `loadImage()` stub is simplified. Check if InlineVisualCustomizer has a more robust queue (MAX_CONCURRENT_LOADS, retry logic) and port it if needed.

- [ ] **Step 4: Port hit testing → `findElementAtPosition()`**

In `useCanvasInteraction.ts`, fill in `findElementAtPosition()` by porting the hit-testing logic from InlineVisualCustomizer.vue.

- [ ] **Step 5: Verify by running the dev server**

Run: `npx nuxi dev` and verify the canvas renders the weapon + stickers correctly.

---

## Task 11: Port Business Logic from V1 to V2 Orchestrator

**Files:**
- Modify: `app/components/modal/WeaponSkinModalV2.vue` (fill in all stubs)

The implementer must read `app/components/modal/WeaponSkinModal.vue` (V1, the full file) and port ALL business logic into V2.

- [ ] **Step 1: Port customization initialization**

How `customization` ref is created from `props.weapon`, including defaults for all fields.

- [ ] **Step 2: Port canvas ↔ customization sync**

Convert `customization.stickers` → `canvasState.elements` using `stickerToCanvasElement()` when customization changes.
Convert `canvasState.elements` → `customization.stickers` using `canvasElementToSticker()` when canvas state changes.
Same for keychain via `keychainToCanvasElement()`/`canvasElementToKeychain()`.

- [ ] **Step 3: Port skin selection, auto-save, and event handlers**

Port `handleSkinSelect`, `handleAutoSave`, all emit handlers, watcher on `props.visible`, etc.

- [ ] **Step 4: Port keyboard shortcuts**

Escape, 1-5, R, D, arrow keys — all from V1's `handleModalKeydown`.

- [ ] **Step 5: Port child modal integration**

StickerModal, KeychainModal, InspectURLModal, DuplicateItemModal, ResetModal, ItemHistoryPanel — all opened the same way as V1.

- [ ] **Step 6: Full end-to-end test**

Run the dev server, open a weapon, verify:
- Canvas renders weapon + stickers
- Clicking a sticker selects it, toolbar appears
- Drag to reposition works
- Settings panel controls work (wear slider updates canvas)
- Skin grid works (infinite scroll, sort, filter)
- Adding/removing stickers works
- Auto-save fires
- Modal opens with morph animation, closes correctly

---

## Dependency Order

```
Task 1 (useModalShell)        — no dependencies
Task 2 (useCanvasRenderer)    — no dependencies
Task 3 (useCanvasInteraction) — no dependencies
Task 4 (ModalShell.vue)       — depends on Task 1
Task 5 (CanvasPreview.vue)    — depends on Tasks 2, 3
Task 6 (Settings, Bar, Toolbar) — no dependencies
Task 7 (SkinGrid.vue)         — no dependencies
Task 8 (Orchestrator V2)      — depends on Tasks 4-7
Task 9 (Parent wiring)        — depends on Task 8
Task 10 (Port rendering)      — depends on Tasks 2, 3 (fills stubs)
Task 11 (Port business logic) — depends on Task 8 (fills stubs)
```

Tasks 1-3 can run in parallel. Tasks 4-7 can run in parallel (after their deps). Tasks 8-9 are sequential. Tasks 10-11 can run in parallel (after Task 8).
