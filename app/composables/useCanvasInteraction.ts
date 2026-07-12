/**
 * useCanvasInteraction
 *
 * Handles all user interaction with the canvas:
 * - Hit testing / element selection
 * - Drag-to-reposition
 * - Scroll-to-scale (wheel)
 * - Arrow-key fine adjustment
 * - Empty slot click detection
 */

import type { CanvasElement, CanvasState, Point } from '~/types/canvas'
import { getDefaultStickerPosition, getDefaultKeychainPosition } from '~/utils/canvasCoordinates'

export interface CanvasInteractionOptions {
  canvas: Ref<HTMLCanvasElement | null>
  canvasState: Ref<CanvasState>
  /** Convert canvas pixel coordinates to normalized (0–1) coords */
  canvasToNormalized: (point: Point) => Point
  /** Convert normalized (0–1) coords to canvas pixel coordinates */
  normalizedToCanvas: (point: Point) => Point
  /** Global scale factor applied to asset sizes */
  globalScale: Ref<number>
  /** Returns the current asset sizes in canvas pixels */
  getAssetSizes: () => {
    stickerWidth: number
    stickerHeight: number
    keychainWidth: number
    keychainHeight: number
  }
  /** Called after any state mutation so the caller can re-render */
  onStateChanged: () => void
  /**
   * Called when the user clicks an empty slot.
   * For stickers slotIndex is 0-4; for keychain slotIndex is 0.
   */
  onEmptySlotClick: (slotIndex: number, type: 'sticker' | 'keychain') => void
  /** Optional: weapon name used for default slot position look-up */
  weaponName?: Ref<string | undefined>
}

export function useCanvasInteraction(options: CanvasInteractionOptions) {
  const {
    canvas,
    canvasState,
    canvasToNormalized,
    normalizedToCanvas,
    globalScale,
    getAssetSizes,
    onStateChanged,
    onEmptySlotClick,
    weaponName,
  } = options

  // ---------------------------------------------------------------------------
  // Selection helpers
  // ---------------------------------------------------------------------------

  const selectedElement = computed<CanvasElement | null>(() => {
    const id = canvasState.value.selectedElementId
    if (!id) return null
    return canvasState.value.elements.find((el) => el.id === id) ?? null
  })

  const selectedElementId = computed({
    get: () => canvasState.value.selectedElementId,
    set: (id: string | null) => {
      selectElement(id)
    },
  })

  const selectElement = (id: string | null) => {
    canvasState.value.elements.forEach((el) => {
      el.selected = el.id === id
    })
    canvasState.value.selectedElementId = id
    onStateChanged()
  }

  // ---------------------------------------------------------------------------
  // Hit testing
  // ---------------------------------------------------------------------------

  /**
   * Find the topmost element at the given canvas pixel position.
   * Uses AABB based on asset sizes * element scale * globalScale.
   */
  const findElementAtPosition = (canvasPos: Point): CanvasElement | null => {
    const sorted = [...canvasState.value.elements].sort((a, b) => b.zIndex - a.zIndex)
    const scale = globalScale.value
    const sizes = getAssetSizes()

    for (const element of sorted) {
      const pos = normalizedToCanvas(element.position)

      const maxW =
        (element.type === 'sticker' ? sizes.stickerWidth : sizes.keychainWidth) *
        element.scale *
        scale
      const maxH =
        (element.type === 'sticker' ? sizes.stickerHeight : sizes.keychainHeight) *
        element.scale *
        scale

      const bounds = {
        left: pos.x - maxW / 2,
        right: pos.x + maxW / 2,
        top: pos.y - maxH / 2,
        bottom: pos.y + maxH / 2,
      }

      if (
        canvasPos.x >= bounds.left &&
        canvasPos.x <= bounds.right &&
        canvasPos.y >= bounds.top &&
        canvasPos.y <= bounds.bottom
      ) {
        return element
      }
    }
    return null
  }

  /**
   * Check whether the canvas position hits an empty sticker slot.
   * Returns { slotIndex, type } when a hit is detected, null otherwise.
   */
  const findEmptySlotAtPosition = (
    canvasPos: Point
  ): { slotIndex: number; type: 'sticker' | 'keychain' } | null => {
    const wName = weaponName?.value

    // Check sticker slots 0–4
    for (let i = 0; i < 5; i++) {
      const slotOccupied = canvasState.value.elements.some(
        (el) => el.type === 'sticker' && el.slotIndex === i
      )
      if (slotOccupied) continue

      const defaultPos = getDefaultStickerPosition(i, wName)
      const slotCanvasPos = normalizedToCanvas(defaultPos)
      const dx = canvasPos.x - slotCanvasPos.x
      const dy = canvasPos.y - slotCanvasPos.y
      const dist = Math.sqrt(dx * dx + dy * dy)
      if (dist < 40) {
        return { slotIndex: i, type: 'sticker' }
      }
    }

    // Check keychain slot
    const keychainOccupied = canvasState.value.elements.some((el) => el.type === 'keychain')
    if (!keychainOccupied) {
      const defaultPos = getDefaultKeychainPosition(wName)
      const slotCanvasPos = normalizedToCanvas(defaultPos)
      const dx = canvasPos.x - slotCanvasPos.x
      const dy = canvasPos.y - slotCanvasPos.y
      const dist = Math.sqrt(dx * dx + dy * dy)
      if (dist < 40) {
        return { slotIndex: 0, type: 'keychain' }
      }
    }

    return null
  }

  // ---------------------------------------------------------------------------
  // Drag state
  // ---------------------------------------------------------------------------

  /** Last known canvas position during a drag, used to compute deltas */
  const lastDragPos = ref<Point | null>(null)

  const getCanvasPos = (event: MouseEvent): Point => {
    const rect = canvas.value!.getBoundingClientRect()
    return { x: event.clientX - rect.left, y: event.clientY - rect.top }
  }

  // ---------------------------------------------------------------------------
  // Mouse event handlers
  // ---------------------------------------------------------------------------

  const handleMouseDown = (event: MouseEvent) => {
    if (!canvas.value) return
    event.preventDefault()

    const canvasPos = getCanvasPos(event)
    const clicked = findElementAtPosition(canvasPos)

    if (clicked) {
      selectElement(clicked.id)
      canvasState.value.isDragging = true
      lastDragPos.value = canvasPos
    } else {
      // Check for empty slot click
      const emptySlot = findEmptySlotAtPosition(canvasPos)
      if (emptySlot) {
        onEmptySlotClick(emptySlot.slotIndex, emptySlot.type)
        return
      }

      // Clicked empty canvas → deselect
      selectElement(null)
      canvasState.value.isDragging = false
      lastDragPos.value = null
    }

    onStateChanged()
  }

  const handleMouseMove = (event: MouseEvent) => {
    if (!canvas.value) return
    if (!canvasState.value.isDragging || !selectedElement.value) return

    event.preventDefault()

    const canvasPos = getCanvasPos(event)
    // Convert the current canvas position directly to normalized coords and
    // set it as the element's new position (mirrors InlineVisualCustomizer behaviour)
    const normalizedPos = canvasToNormalized(canvasPos)
    const el = selectedElement.value
    el.position = { x: normalizedPos.x, y: normalizedPos.y }
    lastDragPos.value = canvasPos

    onStateChanged()
  }

  const handleMouseUp = () => {
    canvasState.value.isDragging = false
    lastDragPos.value = null
  }

  // ---------------------------------------------------------------------------
  // Wheel handler (scroll-to-scale)
  // ---------------------------------------------------------------------------

  const handleWheel = (event: WheelEvent) => {
    event.preventDefault()
    if (!selectedElement.value) return

    const delta = event.deltaY > 0 ? -0.05 : 0.05
    updateScale(delta)
  }

  // ---------------------------------------------------------------------------
  // Keyboard handler (arrow-key fine adjustment)
  // ---------------------------------------------------------------------------

  const handleKeydown = (e: KeyboardEvent) => {
    if (!selectedElement.value) return

    let dx = 0
    let dy = 0
    // Fine: 0.0005; Coarse (Shift): 0.005
    const step = e.shiftKey ? 0.005 : 0.0005

    switch (e.key) {
      case 'ArrowLeft':
        dx = -step
        break
      case 'ArrowRight':
        dx = step
        break
      case 'ArrowUp':
        dy = -step
        break
      case 'ArrowDown':
        dy = step
        break
      default:
        return
    }

    e.preventDefault()
    const el = selectedElement.value
    el.position = { x: el.position.x + dx, y: el.position.y + dy }
    onStateChanged()
  }

  // ---------------------------------------------------------------------------
  // Element manipulation helpers
  // ---------------------------------------------------------------------------

  const updateScale = (delta: number) => {
    if (!selectedElement.value) return
    const el = selectedElement.value
    el.scale = Math.max(0.1, Math.min(2.0, el.scale + delta))
    onStateChanged()
  }

  const updateRotation = (delta: number) => {
    if (!selectedElement.value) return
    const el = selectedElement.value
    el.rotation = (el.rotation + delta) % 360
    onStateChanged()
  }

  const updateWear = (wear: number) => {
    if (!selectedElement.value) return
    if (selectedElement.value.type !== 'sticker') return
    selectedElement.value.wear = wear
    onStateChanged()
  }

  const removeSelected = () => {
    if (!selectedElement.value) return
    const idToRemove = selectedElement.value.id
    canvasState.value.elements = canvasState.value.elements.filter((el) => el.id !== idToRemove)
    selectElement(null)
  }

  // ---------------------------------------------------------------------------
  // Passive event listener registration
  // ---------------------------------------------------------------------------

  /**
   * Attach wheel listener to the canvas with { passive: false } so that
   * preventDefault() works. Must be called from onMounted in the consumer.
   */
  const attachWheelListener = () => {
    if (canvas.value) {
      canvas.value.addEventListener('wheel', handleWheel, { passive: false })
    }
  }

  const detachWheelListener = () => {
    if (canvas.value) {
      canvas.value.removeEventListener('wheel', handleWheel)
    }
  }

  return {
    // State
    selectedElement,
    selectedElementId,

    // Actions
    selectElement,
    updateScale,
    updateRotation,
    updateWear,
    removeSelected,

    // Event handlers to wire up in the template / parent
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleKeydown,
    handleWheel,

    // Wheel listener helpers (passive:false requires addEventListener)
    attachWheelListener,
    detachWheelListener,
  }
}
