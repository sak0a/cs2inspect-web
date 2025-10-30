<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { NModal, NButton, NInput, NSpin, NSpace, NInputNumber, NSlider, NSelect, useMessage } from 'naive-ui'
import { skinModalThemeOverrides } from '~/server/utils/themeCustomization'

import WearSlider from '~/components/WearSlider.vue'
import type { VisualCustomizerProps, VisualCustomizerEvents, CanvasElement, CanvasState } from '~/types/canvas'
import {
  stickerToCanvasElement,
  keychainToCanvasElement,
  canvasElementToKeychain,
  generateFlatImageUrl,
  generateFallbackWeaponImageUrl,
  createCoordinateTransform,
  getDefaultStickerPosition,
  DEFAULT_KEYCHAIN_POSITION,
  getExternalNormalizationRefs
} from '~/utils/canvasCoordinates'
import { VideoCanvasManager, generateVideoUrl, checkVideoExists } from '~/utils/videoCanvas'

const props = defineProps<VisualCustomizerProps>()
const emit = defineEmits<VisualCustomizerEvents>()

const { t } = useI18n()
const message = useMessage()

// Canvas refs
const canvasContainer = ref<HTMLDivElement>()
const canvas = ref<HTMLCanvasElement>()
const ctx = ref<CanvasRenderingContext2D | null>(null)
const video = ref<HTMLVideoElement>()

// Video canvas manager
const videoManager = ref<VideoCanvasManager | null>(null)

// State
const canvasState = ref<CanvasState>({
  elements: [],
  selectedElementId: null,
  canvasSize: { width: 1200, height: 800 },  // Much larger default canvas
  weaponImage: '',
  isDragging: false,
  isEditing: true
})

// Debug overlay state
const showCoordinateOverlay = ref(false)
const mousePosition = ref({ x: 0, y: 0 })

// Asset browser state
const assetSearchQuery = ref('')
const availableStickers = ref<any[]>([])
const availableKeychains = ref<any[]>([])
const isLoadingAssets = ref(false)

// Slot selection state
const selectedStickerSlot = ref<number | null>(null)
const selectedKeychainSlot = ref(false)

// Sticker and keychain slots (like WeaponSkinModal)
const stickerSlots = ref<(any | null)[]>([null, null, null, null, null])
const keychainSlot = ref<any | null>(null)

// Current weapon wear value
const currentWear = ref(0)

// Video state
const isVideoMode = ref(false)
const videoUrl = ref('')
const isVideoLoading = ref(false)

// Zoom removed - canvas is now full size

// Coordinate transformer
const coordinateTransform = createCoordinateTransform()


// Drawn background rect (image/video) used for coordinate transforms
const backgroundDrawRect = ref<{ x: number; y: number; width: number; height: number }>({ x: 0, y: 0, width: 0, height: 0 })

// Offset units and external normalization refs (approximate, configurable)
const offsetUnits = ref<'px' | 'ext'>('px')
const weaponNameForRefs = computed(() => props.weaponSkin?.name.split(' | ')[0] || 'unknown')
const initialExtRefs = getExternalNormalizationRefs(weaponNameForRefs.value)
const extXRef = ref(initialExtRefs.x)
const extYRef = ref(initialExtRefs.y)
const REF_WIDTH = 1328
const REF_HEIGHT = 384


// Default max sticker width in pixels (applies at initial draw and hit-testing)
const STICKER_MAX_WIDTH_PX = 120

// Default max sticker height in pixels (applies at initial draw and hit-testing)
const STICKER_MAX_HEIGHT_PX = 70

// Helpers to map coordinates within the drawn image/video rect
const normalizedToCanvasInImage = (p: { x: number; y: number }) => {
  const r = backgroundDrawRect.value
  if (r.width > 0 && r.height > 0) {
    return { x: r.x + p.x * r.width, y: r.y + p.y * r.height }
  }
  // Fallback to full canvas
  return coordinateTransform.normalizedToCanvas(p, canvasState.value.canvasSize)
}

const canvasToNormalizedInImage = (pt: { x: number; y: number }) => {
  const r = backgroundDrawRect.value
  if (r.width > 0 && r.height > 0) {
    const nx = (pt.x - r.x) / r.width
    const ny = (pt.y - r.y) / r.height
    return {
      x: Math.max(0, Math.min(1, nx)),
      y: Math.max(0, Math.min(1, ny))
    }
  }
  // Fallback to full canvas
  return coordinateTransform.canvasToNormalized(pt, canvasState.value.canvasSize)
}

// Compute default canvas position for a sticker's slot (inside drawn image rect)
const getStickerDefaultCanvasPos = (el: CanvasElement) => {
  const weaponName = props.weaponSkin?.name.split(' | ')[0] || 'unknown'
  const slot = typeof el.slotIndex === 'number' ? el.slotIndex : 0
  const defNorm = getDefaultStickerPosition(slot, weaponName)
  return normalizedToCanvasInImage(defNorm)
}

// Get element offset in canvas pixels relative to its default slot position
const getElementOffsetCanvasPx = (el: CanvasElement) => {
  const cur = normalizedToCanvasInImage(el.position)
  if (el.type === 'sticker') {
    const def = getStickerDefaultCanvasPos(el)
    return { x: Math.round(cur.x - def.x), y: Math.round(cur.y - def.y) }
  }
  return { x: 0, y: 0 }
}

// External normalized offsets (to match other sites)
const getElementOffsetExternalNorm = (el: CanvasElement) => {
  const r = backgroundDrawRect.value
  const cur = normalizedToCanvasInImage(el.position)
  const def = el.type === 'sticker' ? getStickerDefaultCanvasPos(el) : cur
  const dx = cur.x - def.x
  const dy = cur.y - def.y
  if (!r.width || !r.height) return { x: 0, y: 0 }
  return {
    x: (dx / r.width) * (REF_WIDTH / (extXRef.value || 1)),
    y: (dy / r.height) * (REF_HEIGHT / (extYRef.value || 1))
  }
}

// Update by external normalized offset
const updateSelectedElementOffsetExternal = (axis: 'x' | 'y', value: number | null) => {
  if (!selectedElement.value) return
  const el = selectedElement.value
  const r = backgroundDrawRect.value
  if (!r.width || !r.height) return
  const v = typeof value === 'number' ? value : 0
  const def = el.type === 'sticker' ? getStickerDefaultCanvasPos(el) : normalizedToCanvasInImage(el.position)
  const curExt = getElementOffsetExternalNorm(el)
  const targetExt = { x: axis === 'x' ? v : curExt.x, y: axis === 'y' ? v : curExt.y }
  const dx = targetExt.x * r.width * (extXRef.value || 1) / REF_WIDTH
  const dy = targetExt.y * r.height * (extYRef.value || 1) / REF_HEIGHT
  const targetCanvas = { x: def.x + dx, y: def.y + dy }
  el.position = canvasToNormalizedInImage(targetCanvas)
  renderCanvas()
}

// Update selected element's offset by axis in canvas pixel units
const updateSelectedElementOffset = (axis: 'x' | 'y', value: number | null) => {
  if (!selectedElement.value) return
  const el = selectedElement.value
  const v = typeof value === 'number' ? value : 0
  let def = normalizedToCanvasInImage(el.position)
  if (el.type === 'sticker') {
    def = getStickerDefaultCanvasPos(el)
  }
  const curOffset = getElementOffsetCanvasPx(el)
  const newOffset = { x: axis === 'x' ? v : curOffset.x, y: axis === 'y' ? v : curOffset.y }
  const targetCanvas = { x: def.x + newOffset.x, y: def.y + newOffset.y }
  const newNorm = canvasToNormalizedInImage(targetCanvas)
  el.position = newNorm
  renderCanvas()
}


// Image cache for loaded images
const imageCache = new Map<string, HTMLImageElement>()

// Resolve URL to a canvas-safe variant. For cross-origin images, route via our proxy.
const toCanvasSafeUrl = (url: string): string => {
  try {
    const u = new URL(url, window.location.origin)
    // If already same-origin (relative or same host), use as-is
    if (u.origin === window.location.origin) return u.toString()
    // Only proxy http/https external URLs
    if (u.protocol === 'http:' || u.protocol === 'https:') {
      return `/api/proxy/image?url=${encodeURIComponent(u.toString())}`
    }
    return url
  } catch {
    // If invalid URL, try as-is (could be relative)
    return url
  }
}

// Load image with caching
const loadImage = (url: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    // Use original URL as cache key so callers can look it up consistently
    const cacheKey = url
    // Choose safe URL for canvas usage for actual network fetch
    const finalUrl = toCanvasSafeUrl(url)

    // Check cache first
    if (imageCache.has(cacheKey)) {
      const cachedImg = imageCache.get(cacheKey)!
      if (cachedImg.complete && cachedImg.naturalWidth > 0) {
        resolve(cachedImg)
        return
      }
    }

    // Create new image
    const img = new Image()
    // Keep anonymous to allow canvas usage; works fine for same-origin/proxied
    img.crossOrigin = 'anonymous'

    img.onload = () => {
      imageCache.set(cacheKey, img)
      resolve(img)
    }

    img.onerror = () => {
      reject(new Error(`Failed to load image: ${finalUrl}`))
    }

    img.src = finalUrl
  })
}

// Computed properties
const selectedElement = computed(() => {
  return canvasState.value.elements.find(el => el.id === canvasState.value.selectedElementId)
})

const filteredStickers = computed(() => {
  if (!assetSearchQuery.value) return availableStickers.value
  const query = assetSearchQuery.value.toLowerCase()
  return availableStickers.value.filter(sticker =>
    sticker.name.toLowerCase().includes(query)
  )
})

const filteredKeychains = computed(() => {
  if (!assetSearchQuery.value) return availableKeychains.value
  const query = assetSearchQuery.value.toLowerCase()
  return availableKeychains.value.filter(keychain =>
    keychain.name.toLowerCase().includes(query)
  )
})

// Initialize canvas when modal opens
watch(() => props.visible, (visible) => {
  if (visible) {
    // Use nextTick to ensure DOM is ready
    nextTick(() => {
      initializeCanvas()
      loadAssets()

      // Force video to load and fix sizing after a short delay
      setTimeout(() => {
        forceVideoLoad()
        // Force a resize to fix sticker sizing
        handleResize()
      }, 300)
    })
  }
})

// Force video to load and render
const forceVideoLoad = async () => {
  console.log('🎬 Forcing video load...')

  // First, try to initialize video if not already done
  if (!isVideoMode.value && props.weaponSkin) {
    console.log('🎬 Initializing video mode...')
    await initializeWeaponBackground()
  }

  if (isVideoMode.value && videoManager.value) {
    // Trigger video rendering by slightly adjusting wear
    const originalWear = currentWear.value

    // Small wear adjustment to trigger video frame update
    currentWear.value = Math.min(1, originalWear + 0.001)

    // Force immediate render
    renderCanvas()

    // Reset to original wear after a short delay
    setTimeout(() => {
      currentWear.value = originalWear
      renderCanvas()
      console.log('🎬 Video load complete')

      // Force a resize to ensure proper sticker sizing
      setTimeout(() => {
        handleResize()
        console.log('🔧 Forced resize to fix sticker sizing')
      }, 100)
    }, 150)
  } else {
    // For static mode, just render
    renderCanvas()
    console.log('🖼️ Static render complete')

    // Force a resize for static mode too
    setTimeout(() => {
      handleResize()
      console.log('🔧 Forced resize for static mode')
    }, 100)
  }
}

// Initialize canvas
const initializeCanvas = async () => {
  await nextTick()

  if (!canvas.value || !canvasContainer.value || !video.value) return

  // Set canvas size to use the complete available space
  const containerRect = canvasContainer.value.getBoundingClientRect()
  const availableWidth = containerRect.width - 16 // Account for 8px padding on each side (p-2 = 8px)
  const availableHeight = containerRect.height - 16 // Account for 8px padding on each side

  // If we have video dimensions, size canvas to match video aspect ratio
  let canvasWidth, canvasHeight

  /*if (video.value.videoWidth > 0 && video.value.videoHeight > 0) {
    const videoAspect = video.value.videoWidth / video.value.videoHeight
    const containerAspect = availableWidth / availableHeight

    if (videoAspect > containerAspect) {
      // Video is wider - fit to width
      canvasWidth = availableWidth
      canvasHeight = availableWidth / videoAspect
    } else {
      // Video is taller - fit to height
      canvasHeight = availableHeight
      canvasWidth = availableHeight * videoAspect
    }
  } else {
    // Fallback to container size if no video dimensions yet

  }*/
    canvasWidth = availableWidth
    canvasHeight = availableHeight

  canvasState.value.canvasSize = {
    width: canvasWidth,
    height: canvasHeight
  }

  canvas.value.width = canvasState.value.canvasSize.width
  canvas.value.height = canvasState.value.canvasSize.height

  ctx.value = canvas.value.getContext('2d')

  if (!ctx.value) return

  // Extract current wear value from props
  currentWear.value = props.weaponWear || 0

  // Try to load video first, fallback to static image
  await initializeWeaponBackground()

  // Convert existing stickers and keychain to canvas elements
  convertExistingCustomizations()

  // Start render loop
  renderCanvas()

  // Force a resize immediately to ensure proper sizing
  nextTick(() => {
    handleResize()
    console.log('🔧 Initial resize after canvas initialization')
  })
}

// Initialize weapon background (video or static image)
const initializeWeaponBackground = async () => {
  if (!props.weaponSkin || !video.value || !ctx.value) return

  const weaponName = props.weaponSkin.name.split(' | ')[0] || 'weapon'
  const skinName = props.weaponSkin.name.split(' | ')[1] || 'skin'

  // Generate video URL
  videoUrl.value = generateVideoUrl(weaponName, skinName)

  // Check if video exists
  isVideoLoading.value = true
  const videoExists = await checkVideoExists(videoUrl.value)

  if (videoExists) {
    try {
      // Initialize video canvas manager
      videoManager.value = new VideoCanvasManager({
        video: video.value,
        ctx: ctx.value,
        canvasSize: canvasState.value.canvasSize,
        wearValue: currentWear.value,
        minWear: props.minWear || 0,
        maxWear: props.maxWear || 1,
        videoDuration: 140 // Default duration
      })

      // Set up callback to resize canvas when video metadata loads
      /*video.value.addEventListener('loadedmetadata', () => {
        // Reinitialize canvas with video dimensions
        initializeCanvas()
      })*/

      // Set render callback to redraw elements after video frame changes
      videoManager.value.setRenderCallback(() => {
        drawElements()
      })

      // Load video
      await videoManager.value.loadVideo(videoUrl.value)
      isVideoMode.value = true

      console.log('Video mode enabled for weapon:', weaponName, skinName)
    } catch (error) {
      console.warn('Failed to load video, falling back to static image:', error)
      isVideoMode.value = false
      initializeStaticBackground()
    }
  } else {
    console.log('Video not found, using static image for:', weaponName, skinName)
    isVideoMode.value = false
    initializeStaticBackground()
  }

  isVideoLoading.value = false
}

// Initialize static image background
const initializeStaticBackground = () => {
  if (!props.weaponSkin) return

  const weaponName = props.weaponSkin.name.split(' | ')[0] || 'weapon'
  const skinName = props.weaponSkin.name.split(' | ')[1] || 'skin'

  canvasState.value.weaponImage = generateFlatImageUrl(weaponName, skinName)
}

// Convert existing customizations to canvas elements
const convertExistingCustomizations = () => {
  const elements: CanvasElement[] = []

  console.log('Converting existing customizations:', { stickers: props.stickers, keychain: props.keychain })

  // Get weapon name for slot positioning
  const weaponName = props.weaponSkin?.name.split(' | ')[0] || 'unknown'
  console.log(`🔫 Converting stickers for weapon: ${weaponName}`)

  // Convert stickers - the conversion function now handles default positioning
  props.stickers.forEach((sticker, index) => {
    if (sticker) {
      console.log(`Converting sticker ${index}:`, sticker)
      const element = stickerToCanvasElement(sticker, index, 10 + index, weaponName)
      if (element) {
        console.log(`Created canvas element for sticker ${index}:`, element)
        elements.push(element)
      }
    }
  })

  // Convert keychain - the conversion function now handles default positioning
  if (props.keychain) {
    console.log('Converting keychain:', props.keychain)
    const element = keychainToCanvasElement(props.keychain, 5)
    if (element) {
      console.log('Created canvas element for keychain:', element)
      elements.push(element)
    }
  }

  console.log('Final canvas elements:', elements)
  canvasState.value.elements = elements
}

// Load available stickers and keychains
const loadAssets = async () => {
  isLoadingAssets.value = true

  try {
    // Load stickers
    const stickerResponse = await fetch('/api/data/stickers')
    if (stickerResponse.ok) {
      const stickerData = await stickerResponse.json()
      availableStickers.value = stickerData.data || []
    }

    // Load keychains
    const keychainResponse = await fetch('/api/data/keychains')
    if (keychainResponse.ok) {
      const keychainData = await keychainResponse.json()
      availableKeychains.value = keychainData.data || []
    }

    // Convert existing customizations after assets are loaded
    convertExistingCustomizations()

    // Ensure canvas is rendered and properly sized after assets load
    nextTick(() => {
      renderCanvas()
      // Force resize to ensure proper sticker sizing
      setTimeout(() => {
        handleResize()
        console.log('🔧 Resize after asset loading')
      }, 50)
    })
  } catch (error) {
    console.error('Error loading assets:', error)
    message.error('Failed to load stickers and keychains')
  } finally {
    isLoadingAssets.value = false
  }
}

// Render canvas
const renderCanvas = () => {
  if (!ctx.value || !canvas.value) return

  if (isVideoMode.value && videoManager.value && canvas.value) {
    // Video mode: render video frame and compute draw rect for element placement
    videoManager.value.renderFrame()

    const meta = videoManager.value.getMetadata()
    const cw = canvas.value.width
    const ch = canvas.value.height

    if (meta.width > 0 && meta.height > 0) {
      const videoAspect = meta.width / meta.height
      const canvasAspect = cw / ch
      let drawWidth: number, drawHeight: number, drawX: number, drawY: number
      if (videoAspect > canvasAspect) {
        drawWidth = cw
        drawHeight = cw / videoAspect
        drawX = 0
        drawY = (ch - drawHeight) / 2
      } else {
        drawHeight = ch
        drawWidth = ch * videoAspect
        drawX = (cw - drawWidth) / 2
        drawY = 0
      }
      backgroundDrawRect.value = { x: drawX, y: drawY, width: drawWidth, height: drawHeight }
    } else {
      backgroundDrawRect.value = { x: 0, y: 0, width: cw, height: ch }
    }

    drawElements()
  } else {
    // Static image mode: render static background
    renderStaticBackground()
  }
}

// Helper function to draw image with proper aspect ratio scaling
const drawImageWithAspectRatio = (img: HTMLImageElement, ctx: CanvasRenderingContext2D, canvasWidth: number, canvasHeight: number) => {
  const imgAspect = img.naturalWidth / img.naturalHeight
  const canvasAspect = canvasWidth / canvasHeight

  let drawWidth, drawHeight, drawX, drawY

  if (imgAspect > canvasAspect) {
    // Image is wider - fit to width
    drawWidth = canvasWidth
    drawHeight = canvasWidth / imgAspect
    drawX = 0
    drawY = (canvasHeight - drawHeight) / 2
  } else {
    // Image is taller - fit to height
    drawHeight = canvasHeight
    drawWidth = canvasHeight * imgAspect
    drawX = (canvasWidth - drawWidth) / 2
    drawY = 0
  }

  // Update background draw rect used for coordinate transforms
  backgroundDrawRect.value = { x: drawX, y: drawY, width: drawWidth, height: drawHeight }

  // Fill background with dark color first
  ctx.fillStyle = '#1a1a1a'
  ctx.fillRect(0, 0, canvasWidth, canvasHeight)

  // Draw the image centered and scaled
  ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight)
}

// Render static background
const renderStaticBackground = () => {
  if (!ctx.value || !canvas.value) return

  // Clear canvas
  ctx.value.clearRect(0, 0, canvas.value.width, canvas.value.height)

  // Draw weapon background
  if (canvasState.value.weaponImage) {
    const img = new Image()
    img.onload = () => {
      if (ctx.value && canvas.value) {
        drawImageWithAspectRatio(img, ctx.value, canvas.value.width, canvas.value.height)
        drawElements()
      }
    }
    img.onerror = () => {
      // Try fallback weapon image
      const fallbackImg = new Image()
      fallbackImg.onload = () => {
        if (ctx.value && canvas.value) {
          drawImageWithAspectRatio(fallbackImg, ctx.value, canvas.value.width, canvas.value.height)
          drawElements()
        }
      }
      fallbackImg.onerror = () => {
        // Final fallback: draw a placeholder background
        if (ctx.value) {
          ctx.value.fillStyle = '#2a2a2a'
          ctx.value.fillRect(0, 0, canvas.value!.width, canvas.value!.height)
          ctx.value.fillStyle = '#666'
          ctx.value.font = '16px Arial'
          ctx.value.textAlign = 'center'
          ctx.value.fillText('Weapon Preview', canvas.value!.width / 2, canvas.value!.height / 2)
        }
        backgroundDrawRect.value = { x: 0, y: 0, width: canvas.value!.width, height: canvas.value!.height }
        drawElements()
      }
      fallbackImg.src = generateFallbackWeaponImageUrl(props.weaponSkin?.name.split(' | ')[0] || 'ak-47')
    }
    img.src = canvasState.value.weaponImage
  } else {
    backgroundDrawRect.value = { x: 0, y: 0, width: canvas.value!.width, height: canvas.value!.height }
    drawElements()
  }
}

// Draw slot indicators for empty sticker slots
const drawSlotIndicators = () => {
  if (!ctx.value) return

  // Get occupied slot indices
  const occupiedSlots = new Set(
    canvasState.value.elements
      .filter(el => el.type === 'sticker')
      .map(el => el.slotIndex)
  )

  // Draw indicators for empty slots
  for (let slot = 0; slot < 5; slot++) {
    if (!occupiedSlots.has(slot)) {
      // Get weapon-specific position for empty slot indicator
      const weaponName = props.weaponSkin?.name.split(' | ')[0] || 'unknown'
      const slotPosition = getDefaultStickerPosition(slot, weaponName)
      const pos = normalizedToCanvasInImage(slotPosition)

      ctx.value.save()
      ctx.value.globalAlpha = 0.3
      ctx.value.strokeStyle = '#666666'
      ctx.value.setLineDash([4, 4])
      ctx.value.lineWidth = 2

      // Draw a dashed circle to indicate slot position
      ctx.value.beginPath()
      ctx.value.arc(pos.x, pos.y, 25, 0, 2 * Math.PI)
      ctx.value.stroke()

      // Draw slot number
      ctx.value.fillStyle = '#888888'
      ctx.value.font = '12px Arial'
      ctx.value.textAlign = 'center'
      ctx.value.fillText((slot + 1).toString(), pos.x, pos.y + 4)

      ctx.value.restore()
    }
  }

  // Draw keychain indicator if no keychain is present
  const hasKeychain = canvasState.value.elements.some(el => el.type === 'keychain')
  if (!hasKeychain) {
    const pos = normalizedToCanvasInImage(DEFAULT_KEYCHAIN_POSITION)

    ctx.value.save()
    ctx.value.globalAlpha = 0.3
    ctx.value.strokeStyle = '#666666'
    ctx.value.setLineDash([4, 4])
    ctx.value.lineWidth = 2

    // Draw a dashed square for keychain
    ctx.value.strokeRect(pos.x - 20, pos.y - 20, 40, 40)

    // Draw "K" for keychain
    ctx.value.fillStyle = '#888888'
    ctx.value.font = '14px Arial'
    ctx.value.textAlign = 'center'
    ctx.value.fillText('K', pos.x, pos.y + 4)

    ctx.value.restore()
  }
}

// Draw coordinate overlay for debugging
const drawCoordinateOverlay = () => {
  if (!ctx.value || !canvas.value) return

  ctx.value.save()

  // Draw grid lines every 100px
  ctx.value.strokeStyle = '#00ff00'
  ctx.value.lineWidth = 1
  ctx.value.globalAlpha = 0.5

  // Vertical lines
  for (let x = 0; x <= canvas.value.width; x += 100) {
    ctx.value.beginPath()
    ctx.value.moveTo(x, 0)
    ctx.value.lineTo(x, canvas.value.height)
    ctx.value.stroke()
  }

  // Horizontal lines
  for (let y = 0; y <= canvas.value.height; y += 100) {
    ctx.value.beginPath()
    ctx.value.moveTo(0, y)
    ctx.value.lineTo(canvas.value.width, y)
    ctx.value.stroke()
  }

  // Draw coordinate labels
  ctx.value.fillStyle = '#00ff00'
  ctx.value.font = '12px monospace'
  ctx.value.globalAlpha = 0.8

  // X-axis labels (every 100px)
  for (let x = 0; x <= canvas.value.width; x += 100) {
    ctx.value.fillText(x.toString(), x + 2, 15)
  }

  // Y-axis labels (every 100px)
  for (let y = 0; y <= canvas.value.height; y += 100) {
    if (y > 0) { // Skip 0,0 to avoid overlap
      ctx.value.fillText(y.toString(), 2, y - 2)
    }
  }

  // Draw mouse position
  ctx.value.fillStyle = '#ffff00'
  ctx.value.font = '14px monospace'
  ctx.value.fillText(`Mouse: (${mousePosition.value.x}, ${mousePosition.value.y})`, 10, canvas.value.height - 40)
  ctx.value.fillText('Coordinate Overlay Active - Hover to see positions', 10, canvas.value.height - 20)

  ctx.value.restore()
}

// Draw canvas elements
const drawElements = () => {
  if (!ctx.value) return

  // Draw slot indicators first (behind elements)
  drawSlotIndicators()

  // Sort elements by z-index
  const sortedElements = [...canvasState.value.elements].sort((a, b) => a.zIndex - b.zIndex)

  sortedElements.forEach(element => {
    drawElement(element)
  })

  // Draw coordinate overlay if enabled (on top of everything)
  if (showCoordinateOverlay.value) {
    drawCoordinateOverlay()
  }
}

// Draw individual element
const drawElement = (element: CanvasElement) => {
  if (!ctx.value) return

  const pos = normalizedToCanvasInImage(element.position)

  // Debug: Log element drawing
  console.log(`🎨 Drawing ${element.type} at:`, {
    normalized: element.position,
    canvas: pos,
    canvasSize: canvasState.value.canvasSize
  })

  ctx.value.save()

  // Apply transformations
  ctx.value.translate(pos.x, pos.y)
  ctx.value.rotate((element.rotation * Math.PI) / 180)
  ctx.value.scale(element.scale, element.scale)

  // Draw actual sticker/keychain images at native size
  // No base size cap - use native image dimensions scaled by user scale factor
  const size = 100 * element.scale  // Base multiplier for scaling, but actual size determined by image

  // Function to draw selection indicator
  const drawSelection = () => {
    if (element.selected) {
      const accent = getComputedStyle(document.documentElement)
        .getPropertyValue('--selection-ring').trim() || '#FACC15'
      ctx.value!.strokeStyle = accent
      ctx.value!.lineWidth = 2
      ctx.value!.setLineDash([4, 4])
      ctx.value!.strokeRect(-size/2 - 3, -size/2 - 3, size + 6, size + 6)
      ctx.value!.setLineDash([])

      // Draw corner handles
      const handleSize = 8
      const corners = [
        [-size/2 - 3, -size/2 - 3], // Top-left
        [size/2 + 3, -size/2 - 3],  // Top-right
        [size/2 + 3, size/2 + 3],   // Bottom-right
        [-size/2 - 3, size/2 + 3]   // Bottom-left
      ]

      ctx.value!.fillStyle = accent
      corners.forEach(([x, y]) => {
        ctx.value!.fillRect(x - handleSize/2, y - handleSize/2, handleSize, handleSize)
      })
    }
  }

  // Function to draw fallback rectangle
  const drawFallback = (reason = 'NO IMAGE') => {
    ctx.value!.fillStyle = element.type === 'sticker' ? '#FF6B6B' : '#4ECDC4'
    ctx.value!.fillRect(-size/2, -size/2, size, size)

    // Draw text label
    ctx.value!.fillStyle = '#FFFFFF'
    ctx.value!.font = '12px Arial'
    ctx.value!.textAlign = 'center'
    ctx.value!.fillText(reason, 0, -5)
    ctx.value!.fillText(element.apiData?.name?.slice(0, 15) || element.type.toUpperCase(), 0, 10)

    drawSelection()
  }

  // Try to draw image if available
  if (element.apiData?.image) {
    // Check if image is already cached
    const cachedImg = imageCache.get(element.apiData.image)

    if (cachedImg && cachedImg.complete && cachedImg.naturalWidth > 0) {
      // Log original sticker dimensions
      console.log(`📏 Sticker "${element.apiData.name || 'Unknown'}" original size: ${cachedImg.naturalWidth}x${cachedImg.naturalHeight}px`)

      // Calculate size with width/height caps so stickers have consistent default size
      const widthScale = STICKER_MAX_WIDTH_PX / cachedImg.naturalWidth
      const heightScale = STICKER_MAX_HEIGHT_PX / cachedImg.naturalHeight
      const baseScale = Math.min(widthScale, heightScale, 1)
      const baseWidth = cachedImg.naturalWidth * baseScale
      const baseHeight = cachedImg.naturalHeight * baseScale

      // Apply user scale on top of the capped size
      const drawWidth = baseWidth * element.scale
      const drawHeight = baseHeight * element.scale

      console.log(`🎯 Sticker "${element.apiData.name || 'Unknown'}" final size: ${drawWidth.toFixed(1)}x${drawHeight.toFixed(1)}px (scale: ${element.scale})`)

      // Draw cached image with capped size and scaling
      ctx.value!.drawImage(cachedImg, -drawWidth/2, -drawHeight/2, drawWidth, drawHeight)
      drawSelection()
    } else {
      // Load image asynchronously
      loadImage(element.apiData.image)
        .then(() => {
          // Image loaded successfully, re-render canvas
          renderCanvas()
        })
        .catch((error) => {
          console.warn(`Failed to load image for ${element.type}:`, error)
          // Re-render with fallback
          renderCanvas()
        })

      // Draw fallback while loading
      drawFallback('LOADING...')
    }
  } else {
    // No image URL, draw fallback immediately
    drawFallback()
  }

  ctx.value.restore()
}

// Handle canvas click
const handleCanvasClick = (event: MouseEvent) => {
  if (!canvas.value) return

  const rect = canvas.value.getBoundingClientRect()
  const canvasPos = {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top
  }

  console.log('Canvas clicked at:', canvasPos)

  // Find clicked element
  const clickedElement = findElementAtPosition(canvasPos)

  if (clickedElement) {
    selectElement(clickedElement.id)
  } else {
    selectElement(null)
  }

  renderCanvas()
}

// Find element at position
const findElementAtPosition = (canvasPos: { x: number, y: number }) => {
  // Check elements in reverse z-order (top to bottom)
  const sortedElements = [...canvasState.value.elements].sort((a, b) => b.zIndex - a.zIndex)

  console.log(`🔍 Searching for element at ${canvasPos.x}, ${canvasPos.y} among ${sortedElements.length} elements`)

  for (const element of sortedElements) {
    const pos = normalizedToCanvasInImage(element.position)

    // Calculate bounds using the same logic as drawing (with 128px cap)
    let bounds
    if (element.apiData?.image) {
      const cachedImg = imageCache.get(element.apiData.image)
      if (cachedImg && cachedImg.complete && cachedImg.naturalWidth > 0) {
        // Use same width/height cap logic as drawing
        const widthScale = STICKER_MAX_WIDTH_PX / cachedImg.naturalWidth
        const heightScale = STICKER_MAX_HEIGHT_PX / cachedImg.naturalHeight
        const baseScale = Math.min(widthScale, heightScale, 1)
        const baseWidth = cachedImg.naturalWidth * baseScale
        const baseHeight = cachedImg.naturalHeight * baseScale

        const drawWidth = baseWidth * element.scale
        const drawHeight = baseHeight * element.scale

        bounds = {
          left: pos.x - drawWidth/2,
          right: pos.x + drawWidth/2,
          top: pos.y - drawHeight/2,
          bottom: pos.y + drawHeight/2
        }
      } else {
        // Fallback to default size if image not loaded
        const fallbackWidth = (element.type === 'sticker' ? STICKER_MAX_WIDTH_PX : 80) * element.scale
        const fallbackHeight = (element.type === 'sticker' ? STICKER_MAX_HEIGHT_PX : 80) * element.scale
        bounds = {
          left: pos.x - fallbackWidth/2,
          right: pos.x + fallbackWidth/2,
          top: pos.y - fallbackHeight/2,
          bottom: pos.y + fallbackHeight/2
        }
      }
    } else {
      // Fallback to default size
      const fallbackWidth = (element.type === 'sticker' ? STICKER_MAX_WIDTH_PX : 80) * element.scale
      const fallbackHeight = (element.type === 'sticker' ? STICKER_MAX_HEIGHT_PX : 80) * element.scale
      bounds = {
        left: pos.x - fallbackWidth/2,
        right: pos.x + fallbackWidth/2,
        top: pos.y - fallbackHeight/2,
        bottom: pos.y + fallbackHeight/2
      }
    }

    console.log(`🎯 Checking ${element.type} "${element.id}":`, {
      elementPos: pos,
      bounds,
      isInside: canvasPos.x >= bounds.left && canvasPos.x <= bounds.right &&
                canvasPos.y >= bounds.top && canvasPos.y <= bounds.bottom
    })

    if (canvasPos.x >= bounds.left && canvasPos.x <= bounds.right &&
        canvasPos.y >= bounds.top && canvasPos.y <= bounds.bottom) {
      console.log(`✅ Hit detected on ${element.type}:`, element.id)
      return element
    }
  }

  console.log('❌ No element found at position')
  return null
}

// Select element
const selectElement = (elementId: string | null) => {
  console.log('Selecting element:', elementId)
  canvasState.value.elements.forEach(el => {
    el.selected = el.id === elementId
  })
  canvasState.value.selectedElementId = elementId
  renderCanvas()
}

// Handle save
const handleSave = () => {
  // Convert canvas elements back to sticker/keychain format
  const stickers: (any | null)[] = new Array(5).fill(null)
  let keychain: any | null = null


  canvasState.value.elements.forEach(element => {
    if (element.type === 'sticker' && typeof element.slotIndex === 'number') {
      // Compute external normalized offsets for persistence
      const ext = getElementOffsetExternalNorm(element)

      // Persist ext-normalized into DB x/y, and include explicit ext fields in client state
      stickers[element.slotIndex] = {
        id: parseInt(element.assetId),
        slot: element.slotIndex,
        // Persist ext-normalized directly into DB x/y
        x: Number(ext.x.toFixed(12)),
        y: Number(ext.y.toFixed(12)),
        // Keep explicit ext fields in client state for clarity (not used by DB)
        ext_norm_x: Number(ext.x.toFixed(12)),
        ext_norm_y: Number(ext.y.toFixed(12)),
        ext_ref_x: extXRef,
        ext_ref_y: extYRef,
        wear: element.wear || 0,
        scale: element.scale,
        rotation: element.rotation,
        api: element.apiData
      }
    } else if (element.type === 'keychain') {
      keychain = canvasElementToKeychain(element)
    }
  })

  emit('save', { stickers, keychain, weaponWear: currentWear.value })
  handleClose()
}

// Add sticker to canvas
const addStickerToCanvas = (sticker: any) => {
  // Find next available sticker slot
  const usedSlots = canvasState.value.elements
    .filter(el => el.type === 'sticker')
    .map(el => el.slotIndex)

  let nextSlot = 0
  while (nextSlot < 5 && usedSlots.includes(nextSlot)) {
    nextSlot++
  }

  if (nextSlot >= 5) {
    message.warning('Maximum 5 stickers allowed')
    return
  }

  const element: CanvasElement = {
    id: `sticker-${nextSlot}-${Date.now()}`,
    type: 'sticker',
    assetId: sticker.id,
    position: { x: 0.5, y: 0.5 },
    scale: 1.0,
    rotation: 0,
    wear: 0,
    zIndex: 10 + nextSlot,
    selected: false,
    slotIndex: nextSlot,
    apiData: {
      name: sticker.name,
      image: sticker.image,
      rarity: sticker.rarity
    }
  }

  canvasState.value.elements.push(element)
  selectElement(element.id)
  renderCanvas()
}

// Add keychain to canvas
const addKeychainToCanvas = (keychain: any) => {
  // Remove existing keychain if any
  canvasState.value.elements = canvasState.value.elements.filter(el => el.type !== 'keychain')

  const element: CanvasElement = {
    id: `keychain-${Date.now()}`,
    type: 'keychain',
    assetId: keychain.id,
    position: { x: 0.8, y: 0.8 },
    scale: 1.0,
    rotation: 0,
    zIndex: 5,
    selected: false,
    slotIndex: null,
    apiData: {
      name: keychain.name,
      image: keychain.image,
      rarity: keychain.rarity
    }
  }

  canvasState.value.elements.push(element)
  selectElement(element.id)
  renderCanvas()
}

// Update element property
const updateElementProperty = (property: string, value: any) => {
  if (!selectedElement.value) return

  const element = selectedElement.value

  if (property === 'position.x') {
    element.position.x = Math.max(0, Math.min(1, value))
  } else if (property === 'position.y') {
    element.position.y = Math.max(0, Math.min(1, value))
  } else if (property === 'scale') {
    element.scale = Math.max(0.1, Math.min(3, value))
  } else if (property === 'rotation') {
    element.rotation = value % 360
  } else if (property === 'wear') {
    element.wear = Math.max(0, Math.min(1, value))
  }

  renderCanvas()
}

// Update weapon wear value
const updateWeaponWear = async (wearValue: number) => {
  currentWear.value = wearValue

  // Emit wear change to parent component
  emit('update-wear', wearValue)

  if (isVideoMode.value && videoManager.value) {
    await videoManager.value.updateWear(wearValue)
  } else {
    renderCanvas()
  }
}


// Remove selected element
const removeSelectedElement = () => {
  if (!selectedElement.value) return

  canvasState.value.elements = canvasState.value.elements.filter(
    el => el.id !== selectedElement.value!.id
  )
  canvasState.value.selectedElementId = null
  renderCanvas()
}

// Canvas mouse handlers
const handleCanvasMouseDown = (event: MouseEvent) => {
  if (!canvas.value) return

  event.preventDefault()

  const rect = canvas.value.getBoundingClientRect()
  const canvasPos = {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top
  }

  console.log('🖱️ Mouse down at:', canvasPos)
  console.log('🔍 Available elements:', canvasState.value.elements.length)

  // Find element at click position
  const clickedElement = findElementAtPosition(canvasPos)

  if (clickedElement) {
    // Select the element and start dragging
    canvasState.value.selectedElementId = clickedElement.id
    canvasState.value.isDragging = true
    console.log('✅ Started dragging element:', clickedElement.id, clickedElement.type)
  } else {
    // Deselect if clicking empty space
    canvasState.value.selectedElementId = null
    canvasState.value.isDragging = false
    console.log('❌ No element found at position, deselecting')
  }

  renderCanvas()
}

const handleCanvasMouseMove = (event: MouseEvent) => {
  if (!canvas.value) return

  const rect = canvas.value.getBoundingClientRect()
  const canvasPos = {
    x: Math.round(event.clientX - rect.left),
    y: Math.round(event.clientY - rect.top)
  }

  // Update mouse position for coordinate overlay
  mousePosition.value = canvasPos

  // Re-render if coordinate overlay is active to update mouse position display
  if (showCoordinateOverlay.value) {
    renderCanvas()
  }

  // Only log occasionally to avoid spam
  if (Math.random() < 0.1) {
    console.log('🖱️ Mouse move state:', {
      isDragging: canvasState.value.isDragging,
      selectedElementId: canvasState.value.selectedElementId,
      selectedElement: !!selectedElement.value,
      hasCanvas: !!canvas.value,
      mousePos: canvasPos
    })
  }

  if (!canvasState.value.isDragging || !selectedElement.value) return

  event.preventDefault()

  const normalizedPos = canvasToNormalizedInImage(canvasPos)

  console.log('🎯 Dragging to position:', { canvasPos, normalizedPos })

  if (coordinateTransform.validateCoordinates(normalizedPos)) {
    selectedElement.value.position = normalizedPos
    renderCanvas()
  } else {
    console.warn('❌ Invalid coordinates:', normalizedPos)
  }
}

const handleCanvasMouseUp = () => {
  if (canvasState.value.isDragging) {
    console.log('🛑 Stopped dragging')
    canvasState.value.isDragging = false
  } else {
    console.log('🖱️ Mouse up (was not dragging)')
  }
}

// Mouse wheel handler removed - no zoom functionality

// Handle close
const handleClose = () => {
  // Cleanup video resources
  if (videoManager.value) {
    videoManager.value.destroy()
    videoManager.value = null
  }

  emit('update:visible', false)
}

// Handle window resize
const handleResize = () => {
  if (!props.visible || !canvas.value || !canvasContainer.value) return

  const containerRect = canvasContainer.value.getBoundingClientRect()
  const availableWidth = containerRect.width - 16 // Account for 8px padding on each side (p-2 = 8px)
  const availableHeight = containerRect.height - 16 // Account for 8px padding on each side

  // Use the full available container space (same as initializeCanvas)
  const canvasWidth = availableWidth
  const canvasHeight = availableHeight

  canvasState.value.canvasSize = {
    width: canvasWidth,
    height: canvasHeight
  }

  canvas.value.width = canvasWidth
  canvas.value.height = canvasHeight

  // Update video manager if in video mode
  if (videoManager.value) {
    videoManager.value.updateCanvasSize(canvasState.value.canvasSize)
  }

  renderCanvas()
  console.log('🔧 Canvas resized to:', canvasWidth, 'x', canvasHeight)
}

// Watch for changes in stickers prop to update slots
watch(() => props.stickers, (newStickers) => {
  if (newStickers) {
    initializeSlotsFromProps()
  }
}, { deep: true })

// Watch for changes in keychain prop to update slot
watch(() => props.keychain, (newKeychain) => {
  if (newKeychain) {
    keychainSlot.value = newKeychain
  }
})

// Watch for modal visibility to initialize when opened
watch(() => props.visible, (isVisible) => {
  if (isVisible) {
    // Re-initialize slots when modal opens
    initializeSlotsFromProps()
    nextTick(() => {
      initializeCanvas()
      loadAssets()
    })
  }
})

// Lifecycle
onMounted(() => {
  // Always initialize slots from props, regardless of visibility
  initializeSlotsFromProps()

  if (props.visible) {
    initializeCanvas()
    loadAssets()
  }

  // Add resize listener
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  // Cleanup video resources
  if (videoManager.value) {
    videoManager.value.destroy()
    videoManager.value = null
  }

  // Remove resize listener
  window.removeEventListener('resize', handleResize)
})

// Slot management functions
const handleStickerSlotClick = (index: number) => {
  selectedStickerSlot.value = index
  selectedKeychainSlot.value = false
  assetSearchQuery.value = ''
}

const handleKeychainSlotClick = () => {
  selectedKeychainSlot.value = true
  selectedStickerSlot.value = null
  assetSearchQuery.value = ''
}

const clearSelection = () => {
  selectedStickerSlot.value = null
  selectedKeychainSlot.value = false
  assetSearchQuery.value = ''
}

const selectStickerForSlot = (sticker: any) => {
  if (selectedStickerSlot.value === null) return

  // Create sticker data in the format expected by WeaponSkinModal
  const stickerData = {
    id: sticker.id,
    slot: selectedStickerSlot.value, // Add slot information
    x: 0.5, // Default center position
    y: 0.5,
    wear: 0,
    scale: 1,
    rotation: 0,
    api: {
      name: sticker.name,
      image: sticker.image,
      type: sticker.type,
      effect: sticker.effect,
      tournament_event: sticker.tournament_event,
      tournament_team: sticker.tournament_team,
      rarity: sticker.rarity,
    }
  }

  // Update the slot
  stickerSlots.value[selectedStickerSlot.value] = stickerData

  // Also add to canvas
  addStickerToCanvas(sticker)

  clearSelection()
}

const selectKeychainForSlot = (keychain: any) => {
  if (!selectedKeychainSlot.value) return

  // Create keychain data in the format expected by WeaponSkinModal
  const keychainData = {
    id: keychain.id,
    x: 0.5, // Default center position
    y: 0.5,
    wear: 0,
    scale: 1,
    rotation: 0,
    api: {
      name: keychain.name,
      image: keychain.image,
      type: keychain.type,
      rarity: keychain.rarity,
    }
  }

  keychainSlot.value = keychainData

  // Also add to canvas
  addKeychainToCanvas(keychain)

  clearSelection()
}

// Initialize slots from props
const initializeSlotsFromProps = () => {
  // Initialize sticker slots from props.stickers array
  if (props.stickers && Array.isArray(props.stickers)) {
    // Create a new array with 5 slots, filling with stickers from props
    const newStickerSlots = [null, null, null, null, null]
    props.stickers.forEach((sticker, index) => {
      if (sticker && index < 5) {
        newStickerSlots[index] = sticker
      }
    })
    stickerSlots.value = newStickerSlots
  }

  // Initialize keychain slot
  if (props.keychain) {
    keychainSlot.value = props.keychain
  }
}
</script>

<template>
  <NModal
    :show="visible"
    style="width: 98vw; height: 95vh"
    preset="card"
    :title="props.weaponSkin?.name ? `${props.weaponSkin.name} - Visual Customizer` : String(t('modals.visualCustomizer.title'))"
    :bordered="false"
    :theme-overrides="skinModalThemeOverrides"
    size="huge"
    :mask-closable="false"
    @update:show="handleClose"
  >
    <template #header-extra>
      <NSpace>
        <NButton @click="handleSave" type="primary">
          {{ t('modals.visualCustomizer.save') }}
        </NButton>
        <NButton @click="handleClose">
          {{ t('modals.visualCustomizer.cancel') }}
        </NButton>
      </NSpace>
    </template>

    <div class="visual-customizer-container h-full flex flex-col">
      <!-- Main Canvas Area - Optimized Height -->
      <div
        ref="canvasContainer"
        class="canvas-container bg-gray-900 rounded-xl overflow-hidden"
        style="height: 400px;"
      >
          <!-- Hidden video element for video mode -->
          <video
            ref="video"
            style="display: none;"
            muted
            preload="metadata"
          />

          <canvas
            ref="canvas"
            class="w-full h-full"
            :class="{
              'cursor-crosshair': !canvasState.isDragging && !selectedElement,
              'cursor-move': canvasState.isDragging,
              'cursor-pointer': selectedElement && !canvasState.isDragging
            }"
            @click="handleCanvasClick"
            @mousedown="handleCanvasMouseDown"
            @mousemove="handleCanvasMouseMove"
            @mouseup="handleCanvasMouseUp"
            @mouseleave="handleCanvasMouseUp"

          />
        </div>

      <!-- Footer with Sticker Slots and Controls -->
      <div class="footer-panel mt-4 bg-[#1a1a1a] rounded-lg p-4">
        <div class="flex gap-4 h-64">
          <!-- When keychain is selected, show keychain container with fixed width -->
          <div v-if="selectedKeychainSlot" class="w-48">
            <div class="mt-4">
              <h4 class="font-bold mb-1 text-white">Keychain</h4>
              <div
                class="items-center flex justify-center bg-[#242424] p-2 rounded cursor-pointer hover:bg-[#2a2a2a] transition-all min-h-36 max-h-36"
                :class="{
                  'border-2 border-dashed border-gray-600': !keychainSlot,
                  'border-2 border-solid border-[var(--selection-ring)]': keychainSlot,
                  'ring-2 ring-[var(--selection-ring)]': selectedKeychainSlot
                }"
                @click="handleKeychainSlotClick"
              >
                <div v-if="keychainSlot" class="relative group h-30">
                  <img
                    :src="keychainSlot.api.image"
                    :alt="keychainSlot.api.name"
                    class="w-full h-full object-contain"
                  >
                  <p class="text-sm text-center text-gray-400 mt-1">{{ keychainSlot.api.name.replace('Charm | ', '') }}</p>
                </div>
                <div v-else class="h-30 flex items-center justify-center">
                  <span class="text-gray-400 text-sm">Add</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Left Side: Stickers and Keychain in One Row (like WeaponSkinModal) when not selecting keychain -->
          <div v-else class="flex-1">

            <!-- Normal layout when nothing selected or sticker selected -->
            <div class="grid gap-4 auto-rows-fr" :class="selectedStickerSlot !== null ? 'grid-cols-5' : 'grid-cols-6'">
              <!-- Stickers (completely hide when keychain is being selected) -->
              <div class="mt-4" :class="selectedStickerSlot !== null ? 'col-span-5' : 'col-span-5'">
                <h4 class="font-bold mb-1 text-white">Stickers</h4>
                <div class="grid grid-cols-5 gap-x-2 min-h-36 max-h-36">
                  <div
                    v-for="(sticker, index) in stickerSlots"
                    :key="index"
                    class="sticker-slot flex items-center justify-center bg-[#242424] p-2 rounded cursor-pointer transition-all relative hover:bg-[#2a2a2a]"
                    :class="{
                      'border-2 border-dashed border-gray-600': !sticker,
                      'border-2 border-solid border-[var(--selection-ring)]': sticker,
                      'ring-2 ring-[var(--selection-ring)]': selectedStickerSlot === index
                    }"
                    @click="handleStickerSlotClick(index)"
                  >
                    <div v-if="sticker" class="h-28 relative group">
                      <img
                        :src="sticker.api.image"
                        :alt="sticker.api.name"
                        class="w-full h-full object-contain"
                      >
                      <div class="absolute inset-0 bg-white rounded-lg bg-opacity-10 backdrop-blur-sm opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                        <span class="text-white text-xs">Edit</span>
                      </div>
                    </div>
                    <div v-else class="h-28 flex items-center justify-center">
                      <span class="text-gray-400 text-sm">Add</span>
                    </div>
                    <div class="mt-1 absolute top-0 left-1 text-xs text-gray-400">
                      #{{ index + 1 }}
                    </div>
                  </div>
                </div>
              </div>
              <!-- Keychain (completely hide when sticker is being selected) -->
              <div v-if="selectedStickerSlot === null" class="col-span-1 mt-4">
                <h4 class="font-bold mb-1 text-white">Keychain</h4>
                <div
                  class="items-center flex justify-center bg-[#242424] p-2 rounded cursor-pointer hover:bg-[#2a2a2a] transition-all min-h-36 max-h-36"
                  :class="{
                    'border-2 border-dashed border-gray-600': !keychainSlot,
                    'border-2 border-solid border-[var(--selection-ring)]': keychainSlot,
                    'ring-2 ring-[var(--selection-ring)]': selectedKeychainSlot
                  }"
                  @click="handleKeychainSlotClick"
                >
                  <div v-if="keychainSlot" class="relative group h-30">
                    <img
                      :src="keychainSlot.api.image"
                      :alt="keychainSlot.api.name"
                      class="w-full h-full object-contain"
                    >
                    <p class="text-sm text-center text-gray-400 mt-1">{{ keychainSlot.api.name.replace('Charm | ', '') }}</p>
                  </div>
                  <div v-else class="h-30 flex items-center justify-center">
                    <span class="text-gray-400 text-sm">Add</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Center: Search Panel (when slot is selected) -->
          <div v-if="selectedStickerSlot !== null || selectedKeychainSlot" class="bg-[#242424] rounded-lg p-4" :class="selectedKeychainSlot ? 'flex-1' : 'flex-1'">
            <div class="flex items-center justify-between mb-4 gap-4">
              <h4 class="font-bold text-white">
                {{ selectedStickerSlot !== null ? 'Select Sticker' : 'Select Keychain' }}
              </h4>
              <div class="flex items-center gap-3 flex-1">
                <NInput
                  v-model:value="assetSearchQuery"
                  placeholder="Search..."
                  class="flex-1"
                  clearable
                />
                <NButton size="small" @click="clearSelection">Cancel</NButton>
              </div>
            </div>

            <div v-if="isLoadingAssets" class="flex justify-center py-8">
              <NSpin size="medium" />
            </div>

            <div v-else class="asset-grid grid grid-cols-6 gap-2 max-h-40 overflow-y-auto">
              <!-- Stickers -->
              <template v-if="selectedStickerSlot !== null">
                <div
                  v-for="sticker in filteredStickers.slice(0, 50)"
                  :key="sticker.id"
                  class="asset-item p-2 bg-[#2a2a2a] rounded cursor-pointer hover:bg-[#333333] transition-colors"
                  :title="sticker.name"
                  @click="selectStickerForSlot(sticker)"
                >
                  <img
                    :src="sticker.image"
                    :alt="sticker.name"
                    class="w-full h-8 object-contain mb-1"
                  >
                  <p class="text-xs text-gray-300 truncate">
                    {{ sticker.name.replace('Sticker | ', '') }}
                  </p>
                </div>
              </template>

              <!-- Keychains -->
              <template v-if="selectedKeychainSlot">
                <div
                  v-for="keychain in filteredKeychains.slice(0, 50)"
                  :key="keychain.id"
                  class="asset-item p-2 bg-[#2a2a2a] rounded cursor-pointer hover:bg-[#333333] transition-colors"
                  :title="keychain.name"
                  @click="selectKeychainForSlot(keychain)"
                >
                  <img
                    :src="keychain.image"
                    :alt="keychain.name"
                    class="w-full h-8 object-contain mb-1"
                  >
                  <p class="text-xs text-gray-300 truncate">
                    {{ keychain.name.replace('Charm | ', '') }}
                  </p>
                </div>
              </template>
            </div>
          </div>

          <!-- Right Side: Wear Control and Settings Panel -->
          <div class="w-80 space-y-4">
            <!-- Wear Control (only show in video mode) -->
            <div v-if="isVideoMode" class="bg-[#242424] rounded-lg p-3">
              <div class="flex items-center justify-between mb-2">
                <span class="text-sm font-medium text-gray-300">Weapon Wear</span>
                <span class="text-xs font-mono text-white">{{ currentWear.toFixed(3) }}</span>
              </div>
              <WearSlider
                v-model="currentWear"
                :min="props.minWear || 0"
                :max="props.maxWear || 1"
                @update:model-value="updateWeaponWear"
              />
            </div>

            <!-- Settings Panel -->
            <div class="bg-[#242424] rounded-lg p-4">
              <h4 class="font-bold mb-4 text-white">Settings <span v-if="selectedElement">| {{ selectedElement.type === 'sticker' ? 'Sticker' : 'Keychain' }}</span> </h4>

              <!-- Debug Tools -->
              <div class="mb-4 p-3 bg-[#1a1a1a] rounded border border-yellow-600">
                <h5 class="text-yellow-400 font-semibold mb-2">🛠️ Debug Tools</h5>
                <div class="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="coordinateOverlay"
                    v-model="showCoordinateOverlay"
                    class="w-4 h-4"
                  />
                  <label for="coordinateOverlay" class="text-sm text-gray-300">
                    Show Coordinate Grid (X/Y positions)
                  </label>
                </div>
                <p class="text-xs text-gray-400 mt-1">
                  Toggle to see pixel coordinates for precise sticker positioning
                </p>
              </div>

              <!-- Element Properties (when element is selected) -->
              <div v-if="selectedElement" class="space-y-4">
              <!---<div class="text-sm text-gray-300 mb-3">
                Editing: {{ selectedElement.type === 'sticker' ? 'Sticker' : 'Keychain' }}
              </div>-->


              <div v-if="selectedElement && selectedElement.type === 'sticker'" class="space-y-3">
                <div>
                  <label class="block text-xs font-medium text-gray-300 mb-1">Offset Units</label>
                  <NSelect
                    v-model:value="offsetUnits"
                    size="small"
                    :options="[
                      { label: 'Pixels', value: 'px' },
                      { label: 'Normalized (ext)', value: 'ext' }
                    ]"
                  />
                </div>

                <div v-if="offsetUnits === 'px'" class="grid grid-cols-2 gap-2">
                  <div>
                    <label class="block text-xs font-medium text-gray-300 mb-1">Offset X (px)</label>
                    <NInputNumber
                      :value="getElementOffsetCanvasPx(selectedElement).x"
                      :min="-5000"
                      :max="5000"
                      :step="1"
                      :precision="0"
                      size="small"
                      class="w-full"
                      @update:value="v => updateSelectedElementOffset('x', v)"
                    />
                  </div>
                  <div>
                    <label class="block text-xs font-medium text-gray-300 mb-1">Offset Y (px)</label>
                    <NInputNumber
                      :value="getElementOffsetCanvasPx(selectedElement).y"
                      :min="-5000"
                      :max="5000"
                      :step="1"
                      :precision="0"
                      size="small"
                      class="w-full"
                      @update:value="v => updateSelectedElementOffset('y', v)"
                    />
                  </div>
                </div>

                <div v-else class="grid grid-cols-2 gap-2">
                  <div>
                    <label class="block text-xs font-medium text-gray-300 mb-1">Offset X (norm)</label>
                    <NInputNumber
                      :value="getElementOffsetExternalNorm(selectedElement).x"
                      :min="-2"
                      :max="2"
                      :step="0.000001"
                      :precision="12"
                      size="small"
                      class="w-full"
                      @update:value="v => updateSelectedElementOffsetExternal('x', v)"
                    />
                  </div>
                  <div>
                    <label class="block text-xs font-medium text-gray-300 mb-1">Offset Y (norm)</label>
                    <NInputNumber
                      :value="getElementOffsetExternalNorm(selectedElement).y"
                      :min="-2"
                      :max="2"
                      :step="0.000001"
                      :precision="12"
                      size="small"
                      class="w-full"
                      @update:value="v => updateSelectedElementOffsetExternal('y', v)"
                    />
                  </div>
                </div>

                <div v-if="offsetUnits === 'ext'" class="grid grid-cols-2 gap-2">
                  <div>
                    <label class="block text-xs font-medium text-gray-300 mb-1">External Ref Width</label>
                    <NInputNumber v-model:value="extXRef" :min="100" :max="5000" :step="1" size="small" class="w-full" />
                  </div>
                  <div>
                    <label class="block text-xs font-medium text-gray-300 mb-1">External Ref Height</label>
                    <NInputNumber v-model:value="extYRef" :min="100" :max="5000" :step="1" size="small" class="w-full" />
                  </div>
                </div>

                <div class="text-[11px] text-gray-400">
                  <template v-if="offsetUnits === 'px'">
                    ext norm ≈ (
                    {{ (getElementOffsetCanvasPx(selectedElement).x / backgroundDrawRect.width * (REF_WIDTH / extXRef)).toFixed(12) }},
                    {{ (getElementOffsetCanvasPx(selectedElement).y / backgroundDrawRect.height * (REF_HEIGHT / extYRef)).toFixed(12) }}
                    )
                  </template>
                  <template v-else>
                    px ≈ (
                    {{ Math.round(getElementOffsetExternalNorm(selectedElement).x * backgroundDrawRect.width * (extXRef / REF_WIDTH)) }},
                    {{ Math.round(getElementOffsetExternalNorm(selectedElement).y * backgroundDrawRect.height * (extYRef / REF_HEIGHT)) }}
                    )
                  </template>
                </div>
              </div>

              <div>
                <label class="block text-xs font-medium text-gray-300 mb-1">Scale</label>
                <NSlider
                  :value="selectedElement.scale"
                  :min="0.1"
                  :max="3"
                  :step="0.1"
                  @update:value="updateElementProperty('scale', $event)"
                />
              </div>

              <div>
                <label class="block text-xs font-medium text-gray-300 mb-1">Rotation</label>
                <NSlider
                  :value="selectedElement.rotation"
                  :min="0"
                  :max="360"
                  :step="1"
                  @update:value="updateElementProperty('rotation', $event)"
                />
              </div>

              <div v-if="selectedElement.type === 'sticker'">
                <label class="block text-xs font-medium text-gray-300 mb-1">Wear</label>
                <NSlider
                  :value="selectedElement.wear || 0"
                  :min="0"
                  :max="1"
                  :step="0.01"
                  @update:value="updateElementProperty('wear', $event)"
                />
              </div>

              <NButton
                type="error"
                size="small"
                class="w-full"
                @click="removeSelectedElement"
              >
                Remove {{ selectedElement.type === 'sticker' ? 'Sticker' : 'Keychain' }}
              </NButton>
            </div>

              <!-- Instructions when no element selected -->
              <div v-else class="text-sm text-gray-300 space-y-2">
                <p>• Click sticker/keychain slots to add items</p>
                <p>• Click elements on canvas to select and edit</p>
                <p>• Drag elements to reposition them</p>
                <p>• Use sliders to fine-tune properties</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </NModal>
</template>

<style scoped>
.visual-customizer-container {
  height: calc(95vh - 120px);
}

.canvas-container {
  /* Remove min-height to allow inline height style to work */
  flex: 0 0 auto; /* Don't flex, use fixed height */
}

.footer-panel {
  height: 280px;
  flex-shrink: 0;
}

.canvas-area {
  min-width: 0; /* Allow flex item to shrink */
}

.sidebar {
  flex-shrink: 0;
}

.asset-grid {
  scrollbar-width: thin;
  scrollbar-color: #4a5568 #2d3748;
}

.asset-grid::-webkit-scrollbar {
  width: 6px;
}

.asset-grid::-webkit-scrollbar-track {
  background: #2d3748;
  border-radius: 3px;
}

.asset-grid::-webkit-scrollbar-thumb {
  background: #4a5568;
  border-radius: 3px;
}

.asset-grid::-webkit-scrollbar-thumb:hover {
  background: #718096;
}

.asset-item {
  transition: all 0.2s ease;
}

.asset-item:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
}

.property-panel .n-input-number {
  background: #1a1a1a;
}

.property-panel .n-slider {
  margin: 8px 0;
}

.wear-control-compact {
  border: 1px solid #374151;
}

canvas {
  background: #1a1a1a;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
  border-radius: 8px;
  max-width: 100%;
  max-height: 100%;
}

/* Responsive adjustments */
@media (max-width: 1200px) {
  .sidebar {
    width: 300px;
  }
}

@media (max-width: 768px) {
  .visual-customizer-container {
    flex-direction: column;
  }

  .sidebar {
    width: 100%;
    margin-left: 0;
    margin-top: 1rem;
    max-height: 300px;
  }

  .asset-grid {
    max-height: 150px;
  }
}
</style>
