/**
 * useCanvasRenderer — canvas rendering composable for weapon skin preview.
 *
 * Extracted from InlineVisualCustomizer.vue. Handles:
 *  - DPI-aware canvas initialisation
 *  - Video frame rendering (via VideoCanvasManager) with static-image fallback
 *  - Empty slot indicators (dashed circles)
 *  - CanvasElement rendering with global scale, transforms, and image cache
 *  - Selection ring + corner handles on the selected element
 *  - Coordinate helpers: normalizedToCanvasInImage / canvasToNormalizedInImage
 */

import { ref, computed, watch } from 'vue'
import type { Ref, ComputedRef } from 'vue'
import type { CanvasState, CanvasElement, Point } from '~/types/canvas'
import {
  VideoCanvasManager,
  generateVideoUrl,
  checkVideoExists,
} from '~/utils/videoCanvas'
import {
  getDefaultStickerPosition,
  getDefaultKeychainPosition,
  getWeaponAssetSizes,
  createCoordinateTransform,
  WEAPON_RESOLUTION_REFS,
  RESOLUTION_OVERRIDES,
  DEFAULT_KEYCHAIN_POSITION,
} from '~/utils/canvasCoordinates'

// ---------------------------------------------------------------------------
// Public interface
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Image cache constants
// ---------------------------------------------------------------------------

const IMAGE_CACHE_MAX = 50
const MAX_CONCURRENT_LOADS = 3
const MAX_RETRIES = 3
const RETRY_DELAY = 1_000

// Standard design width used to calculate global scale factor
const STANDARD_DESIGN_WIDTH = 1_120

// ---------------------------------------------------------------------------
// Implementation
// ---------------------------------------------------------------------------

export function useCanvasRenderer(options: CanvasRendererOptions) {
  const { canvas, video, canvasState, weaponName, paintindex, wear, minWear, maxWear } = options

  // --- internal refs --------------------------------------------------------

  const ctx = ref<CanvasRenderingContext2D | null>(null)
  const isVideoMode = ref(false)
  const isVideoLoading = ref(false)
  const videoManager = ref<VideoCanvasManager | null>(null)
  const backgroundDrawRect = ref<{ x: number; y: number; width: number; height: number }>({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  })

  // Image cache with LRU eviction
  const imageCache = new Map<string, HTMLImageElement>()

  // Load queue
  type LoadTask = {
    url: string
    retryCount: number
    resolve: (img: HTMLImageElement) => void
    reject: (err: unknown) => void
  }
  const imageLoadQueue: LoadTask[] = []
  let activeLoadCount = 0

  // Coordinate transform utility
  const coordinateTransform = createCoordinateTransform()

  // --- computed -------------------------------------------------------------

  const assetSizes = computed(() => {
    const meta = videoManager.value?.getMetadata()
    return getWeaponAssetSizes(weaponName.value, meta?.width, meta?.height)
  })

  const globalScale: ComputedRef<number> = computed(() => {
    if (backgroundDrawRect.value.width > 0) {
      return backgroundDrawRect.value.width / STANDARD_DESIGN_WIDTH
    }
    return 1
  })

  // ---------------------------------------------------------------------------
  // URL helpers
  // ---------------------------------------------------------------------------

  /**
   * Make an image URL safe for canvas use (CORS / proxy handling).
   */
  const toCanvasSafeUrl = (url: string): string => {
    try {
      if (!url) return ''
      const u = new URL(url, window.location.origin)

      if (u.origin === window.location.origin) return u.toString()
      if (u.hostname === 'assets.cu.sakoa.xyz') return u.toString()

      try {
        const config = useRuntimeConfig()
        const assetsUrl = config.public.assetsUrl as string
        if (assetsUrl && u.origin === new URL(assetsUrl).origin) return u.toString()
      } catch {
        // ignore
      }

      if (u.protocol === 'http:' || u.protocol === 'https:') {
        return `/api/proxy/image?url=${encodeURIComponent(u.toString())}`
      }
      return url
    } catch {
      return url
    }
  }

  // ---------------------------------------------------------------------------
  // Image loading
  // ---------------------------------------------------------------------------

  const evictOldestCacheEntry = () => {
    if (imageCache.size > IMAGE_CACHE_MAX) {
      const firstKey = imageCache.keys().next().value
      if (firstKey) imageCache.delete(firstKey)
    }
  }

  const processQueue = () => {
    if (imageLoadQueue.length === 0 || activeLoadCount >= MAX_CONCURRENT_LOADS) return

    const task = imageLoadQueue.shift()
    if (!task) return

    activeLoadCount++
    const { url, retryCount, resolve, reject } = task
    const finalUrl = toCanvasSafeUrl(url)

    const img = new Image()

    try {
      const parsed = new URL(finalUrl, window.location.origin)
      if (parsed.hostname !== 'assets.cu.sakoa.xyz') {
        img.crossOrigin = 'anonymous'
      }
    } catch {
      img.crossOrigin = 'anonymous'
    }

    img.onload = () => {
      activeLoadCount--
      imageCache.set(url, img)
      evictOldestCacheEntry()
      resolve(img)
      processQueue()
    }

    img.onerror = () => {
      activeLoadCount--
      if (retryCount < MAX_RETRIES) {
        setTimeout(() => {
          imageLoadQueue.push({ url, retryCount: retryCount + 1, resolve, reject })
          processQueue()
        }, RETRY_DELAY)
      } else {
        reject(new Error(`Failed to load image after ${MAX_RETRIES + 1} attempts: ${finalUrl}`))
        processQueue()
      }
    }

    img.src = finalUrl
  }

  const loadImage = (url: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      if (!url) {
        reject(new Error('Empty URL'))
        return
      }
      if (imageCache.has(url)) {
        const cached = imageCache.get(url)!
        if (cached.complete && cached.naturalWidth > 0) {
          resolve(cached)
          return
        }
      }
      imageLoadQueue.push({ url, retryCount: 0, resolve, reject })
      processQueue()
    })
  }

  // ---------------------------------------------------------------------------
  // Coordinate helpers
  // ---------------------------------------------------------------------------

  const normalizedToCanvasInImage = (p: Point): Point => {
    const r = backgroundDrawRect.value
    if (r.width > 0 && r.height > 0) {
      let nx = p.x
      let ny = p.y

      const meta = videoManager.value?.getMetadata()
      if (meta && meta.width > 0 && meta.height > 0) {
        const rawName = weaponName.value
        const wName = rawName.toLowerCase().trim().replace('weapon_', '').replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
        const ref = WEAPON_RESOLUTION_REFS[wName]

        if (ref) {
          const resKey = `${meta.width}x${meta.height}`
          let scaleX = 1, scaleY = 1, offX = 0, offY = 0

          const overrides = RESOLUTION_OVERRIDES[wName]
          if (overrides && overrides[resKey]) {
            const ov = overrides[resKey]!
            scaleX = ov.scaleX
            scaleY = ov.scaleY
            offX = ov.offsetX
            offY = ov.offsetY
          }

          nx = 0.5 + ((p.x - 0.5) * ref.width * scaleX + offX) / meta.width
          ny = 0.5 + ((p.y - 0.5) * ref.height * scaleY + offY) / meta.height
        }
      }

      return { x: r.x + nx * r.width, y: r.y + ny * r.height }
    }
    return coordinateTransform.normalizedToCanvas(p, canvasState.value.canvasSize)
  }

  const canvasToNormalizedInImage = (pt: Point): Point => {
    const r = backgroundDrawRect.value
    if (r.width > 0 && r.height > 0) {
      return { x: (pt.x - r.x) / r.width, y: (pt.y - r.y) / r.height }
    }
    return coordinateTransform.canvasToNormalized(pt, canvasState.value.canvasSize)
  }

  // ---------------------------------------------------------------------------
  // Selection ring helper
  // ---------------------------------------------------------------------------

  const drawSelectionRing = (
    context: CanvasRenderingContext2D,
    element: CanvasElement,
    bounds: { width: number; height: number },
  ) => {
    if (!element.selected) return

    const accent = '#FACC15'
    const invScale = 1 / Math.max(0.1, element.scale || 1)
    const ringPadding = 0.75 * invScale
    const ringLineWidth = 1.1 * invScale
    const dash = 2.5 * invScale
    const w = bounds.width
    const h = bounds.height

    context.strokeStyle = accent
    context.lineWidth = ringLineWidth
    context.setLineDash([dash, dash])
    context.strokeRect(
      -w / 2 - ringPadding,
      -h / 2 - ringPadding,
      w + ringPadding * 2,
      h + ringPadding * 2,
    )
    context.setLineDash([])

    const handleSize = 5 * invScale
    const corners: [number, number][] = [
      [-w / 2 - ringPadding, -h / 2 - ringPadding],
      [w / 2 + ringPadding, -h / 2 - ringPadding],
      [w / 2 + ringPadding, h / 2 + ringPadding],
      [-w / 2 - ringPadding, h / 2 + ringPadding],
    ]
    context.fillStyle = accent
    corners.forEach(([cx, cy]) => {
      context.fillRect(cx - handleSize / 2, cy - handleSize / 2, handleSize, handleSize)
    })
  }

  // ---------------------------------------------------------------------------
  // Slot indicators
  // ---------------------------------------------------------------------------

  const drawSlotIndicators = (context: CanvasRenderingContext2D) => {
    const accent = '#FACC15'
    const occupiedSlots = new Set(
      canvasState.value.elements
        .filter((el) => el.type === 'sticker')
        .map((el) => el.slotIndex),
    )

    for (let slot = 0; slot < 5; slot++) {
      if (occupiedSlots.has(slot)) continue

      const slotPos = getDefaultStickerPosition(slot, weaponName.value)
      const pos = normalizedToCanvasInImage(slotPos)

      context.save()
      context.globalAlpha = 0.9
      context.lineWidth = 2
      context.strokeStyle = accent
      context.fillStyle = 'rgba(0,0,0,0.30)'
      context.setLineDash([6, 4])
      context.shadowColor = 'rgba(0,0,0,0.55)'
      context.shadowBlur = 8

      context.beginPath()
      context.arc(pos.x, pos.y, 20, 0, 2 * Math.PI)
      context.fill()
      context.stroke()

      context.shadowColor = 'transparent'
      context.setLineDash([])
      context.fillStyle = '#FFFFFF'
      context.font = '500 12px sans-serif'
      context.textAlign = 'center'
      context.textBaseline = 'middle'
      context.fillText((slot + 1).toString(), pos.x, pos.y)
      context.restore()
    }

    // Keychain indicator
    if (!canvasState.value.elements.some((el) => el.type === 'keychain')) {
      const pos = normalizedToCanvasInImage(
        getDefaultKeychainPosition(weaponName.value) ?? DEFAULT_KEYCHAIN_POSITION,
      )

      context.save()
      context.globalAlpha = 0.9
      context.lineWidth = 2
      context.strokeStyle = accent
      context.fillStyle = 'rgba(0,0,0,0.30)'
      context.setLineDash([6, 4])
      context.shadowColor = 'rgba(0,0,0,0.55)'
      context.shadowBlur = 8

      context.beginPath()
      context.arc(pos.x, pos.y, 20, 0, 2 * Math.PI)
      context.fill()
      context.stroke()

      context.shadowColor = 'transparent'
      context.setLineDash([])
      context.fillStyle = '#FFFFFF'
      context.font = '500 12px sans-serif'
      context.textAlign = 'center'
      context.textBaseline = 'middle'
      context.fillText('K', pos.x, pos.y)
      context.restore()
    }
  }

  // ---------------------------------------------------------------------------
  // Element drawing
  // ---------------------------------------------------------------------------

  const drawElement = (context: CanvasRenderingContext2D, element: CanvasElement) => {
    const pos = normalizedToCanvasInImage(element.position)
    const scale = globalScale.value
    const sizes = assetSizes.value

    context.save()
    context.translate(pos.x, pos.y)
    context.rotate((element.rotation * Math.PI) / 180)
    context.scale(element.scale, element.scale)

    if (element.apiData?.image) {
      const cachedImg = imageCache.get(element.apiData.image)
      if (cachedImg && cachedImg.complete && cachedImg.naturalWidth > 0) {
        const maxW = sizes.sticker.width * scale
        const maxH = sizes.sticker.height * scale
        const fitScale = Math.min(maxW / cachedImg.naturalWidth, maxH / cachedImg.naturalHeight)

        const baseWidth = cachedImg.naturalWidth * fitScale
        const baseHeight = cachedImg.naturalHeight * fitScale
        const drawWidth = baseWidth * element.scale
        const drawHeight = baseHeight * element.scale

        context.drawImage(cachedImg, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight)
        drawSelectionRing(context, element, { width: drawWidth, height: drawHeight })
      } else {
        // Placeholder while image loads
        const placeholderSize = 100 * element.scale * scale
        context.fillStyle = element.type === 'sticker' ? '#FF6B6B' : '#4ECDC4'
        context.fillRect(-placeholderSize / 2, -placeholderSize / 2, placeholderSize, placeholderSize)
        drawSelectionRing(context, element, { width: placeholderSize, height: placeholderSize })
      }
    } else {
      const placeholderSize = 100 * element.scale * scale
      context.fillStyle = element.type === 'sticker' ? '#FF6B6B' : '#4ECDC4'
      context.fillRect(-placeholderSize / 2, -placeholderSize / 2, placeholderSize, placeholderSize)
      drawSelectionRing(context, element, { width: placeholderSize, height: placeholderSize })
    }

    context.restore()
  }

  // ---------------------------------------------------------------------------
  // Preload all element images into cache, then re-render
  // ---------------------------------------------------------------------------

  const loadAllElementImages = async () => {
    const elementsToLoad = canvasState.value.elements.filter(
      (el) => el.apiData?.image && !imageCache.has(el.apiData.image)
    )
    if (elementsToLoad.length === 0) return

    const promises = elementsToLoad.map((el) => {
      if (!el.apiData?.image) return Promise.resolve()
      return loadImage(el.apiData.image).catch(() => {
        // Silently fail — placeholder will show
      })
    })
    await Promise.all(promises)
    render()
  }

  // ---------------------------------------------------------------------------
  // Draw all elements (slot indicators + sorted elements)
  // ---------------------------------------------------------------------------

  const drawElements = (context: CanvasRenderingContext2D) => {
    drawSlotIndicators(context)
    const sorted = [...canvasState.value.elements].sort((a, b) => a.zIndex - b.zIndex)
    sorted.forEach((el) => drawElement(context, el))
  }

  // ---------------------------------------------------------------------------
  // Background: video frame path
  // ---------------------------------------------------------------------------

  const renderVideoBackground = (context: CanvasRenderingContext2D) => {
    if (!videoManager.value) return

    videoManager.value.renderFrame()

    const meta = videoManager.value.getMetadata()
    const cw = canvasState.value.canvasSize.width
    const ch = canvasState.value.canvasSize.height

    if (meta.width > 0 && meta.height > 0) {
      const videoAspect = meta.width / meta.height
      const canvasAspect = cw / ch
      let dw, dh, dx, dy

      if (videoAspect > canvasAspect) {
        dw = cw
        dh = cw / videoAspect
        dx = 0
        dy = (ch - dh) / 2
      } else {
        dh = ch
        dw = ch * videoAspect
        dx = (cw - dw) / 2
        dy = 0
      }
      backgroundDrawRect.value = { x: dx, y: dy, width: dw, height: dh }
    }

    drawElements(context)
  }

  // ---------------------------------------------------------------------------
  // Background: static image path
  // ---------------------------------------------------------------------------

  const drawImageWithAspectRatio = (
    img: HTMLImageElement,
    context: CanvasRenderingContext2D,
    canvasWidth: number,
    canvasHeight: number,
  ) => {
    const imgAspect = img.naturalWidth / img.naturalHeight
    const canvasAspect = canvasWidth / canvasHeight
    let dw, dh, dx, dy

    if (imgAspect > canvasAspect) {
      dw = canvasWidth
      dh = canvasWidth / imgAspect
      dx = 0
      dy = (canvasHeight - dh) / 2
    } else {
      dh = canvasHeight
      dw = canvasHeight * imgAspect
      dx = (canvasWidth - dw) / 2
      dy = 0
    }

    backgroundDrawRect.value = { x: dx, y: dy, width: dw, height: dh }
    context.fillStyle = '#1a1a1a'
    context.fillRect(0, 0, canvasWidth, canvasHeight)
    context.drawImage(img, dx, dy, dw, dh)
  }

  const renderStaticBackground = (context: CanvasRenderingContext2D) => {
    const cw = canvasState.value.canvasSize.width
    const ch = canvasState.value.canvasSize.height
    context.clearRect(0, 0, cw, ch)

    if (!canvasState.value.weaponImage) {
      context.fillStyle = '#1a1a1a'
      context.fillRect(0, 0, cw, ch)
      backgroundDrawRect.value = { x: 0, y: 0, width: cw, height: ch }
      drawElements(context)
      return
    }

    const img = new Image()
    img.onload = () => {
      if (!ctx.value) return
      drawImageWithAspectRatio(img, ctx.value, cw, ch)
      drawElements(ctx.value)
    }
    img.onerror = () => {
      // Fallback: dark fill
      if (!ctx.value) return
      ctx.value.fillStyle = '#2a2a2a'
      ctx.value.fillRect(0, 0, cw, ch)
      backgroundDrawRect.value = { x: 0, y: 0, width: cw, height: ch }
      drawElements(ctx.value)
    }
    img.src = canvasState.value.weaponImage
  }

  // ---------------------------------------------------------------------------
  // Main render function
  // ---------------------------------------------------------------------------

  const render = () => {
    if (!ctx.value || !canvas.value) return

    if (isVideoMode.value && videoManager.value) {
      renderVideoBackground(ctx.value)
    } else {
      renderStaticBackground(ctx.value)
    }
  }

  // ---------------------------------------------------------------------------
  // Video setup
  // ---------------------------------------------------------------------------

  const setupVideo = async (fullSkinName?: string, fallbackImageUrl?: string): Promise<void> => {
    if (!video.value || !ctx.value) return

    // Destroy previous video manager if exists
    if (videoManager.value) {
      videoManager.value.destroy()
      videoManager.value = null
    }
    isVideoMode.value = false

    const nameToSplit = fullSkinName || weaponName.value
    const parts = nameToSplit.split(' | ')
    const wName = parts[0] ?? weaponName.value
    const sName = parts[1] ?? ''

    // Default skin (paintindex=0): skip video, use static image
    if (paintindex.value === 0 || !sName) {
      isVideoMode.value = false
      if (fallbackImageUrl) {
        canvasState.value.weaponImage = fallbackImageUrl
      }
      isVideoLoading.value = false
      render()
      return
    }

    const vUrl = generateVideoUrl(wName, sName)
    isVideoLoading.value = true
    let videoReady = false

    try {
      const exists = await checkVideoExists(vUrl)
      if (exists && video.value && ctx.value) {
        videoManager.value = new VideoCanvasManager({
          video: video.value,
          ctx: ctx.value,
          canvasSize: canvasState.value.canvasSize,
          wearValue: wear.value,
          minWear: minWear.value,
          maxWear: maxWear.value,
          videoDuration: 140,
        })
        videoManager.value.setRenderCallback(() => {
          // After video seeks to new frame, renderFrame() already drew the video.
          // We just need to draw elements on top.
          if (ctx.value) drawElements(ctx.value)
        })
        await videoManager.value.loadVideo(vUrl)
        // Explicitly seek to the current wear frame and wait
        // (loadVideo resolves on loadeddata, but the frame is at t=0)
        await videoManager.value.updateWear(wear.value)
        canvasState.value.weaponImage = ''
        isVideoMode.value = true
        videoReady = true
      }
    } catch (e) {
      console.warn('[useCanvasRenderer] Video load failed:', e)
    }

    // Fallback to static image if video didn't load
    if (!videoReady) {
      isVideoMode.value = false
      if (fallbackImageUrl) {
        canvasState.value.weaponImage = fallbackImageUrl
      }
    }

    isVideoLoading.value = false
    render()
  }

  // ---------------------------------------------------------------------------
  // Wear update
  // ---------------------------------------------------------------------------

  const updateWear = async (wearValue: number): Promise<void> => {
    if (videoManager.value) {
      await videoManager.value.updateWear(wearValue)
      render()
    }
  }

  // ---------------------------------------------------------------------------
  // Watch wear changes → seek video and re-render
  // ---------------------------------------------------------------------------

  watch(wear, async (val) => {
    if (videoManager.value && isVideoMode.value) {
      await videoManager.value.updateWear(val)
      render()
    }
  })

  // Watch canvas state elements for changes → re-render (e.g. after sync)
  watch(
    () => canvasState.value.elements.length,
    () => render()
  )

  // ---------------------------------------------------------------------------
  // Init / Destroy
  // ---------------------------------------------------------------------------

  const init = (): void => {
    if (!canvas.value) return

    const rect = canvas.value.getBoundingClientRect()
    const dpr = window.devicePixelRatio || 1

    canvasState.value.canvasSize = {
      width: rect.width || 1120,
      height: rect.height || 500,
    }

    canvas.value.width = canvasState.value.canvasSize.width * dpr
    canvas.value.height = canvasState.value.canvasSize.height * dpr
    canvas.value.style.width = `${canvasState.value.canvasSize.width}px`
    canvas.value.style.height = `${canvasState.value.canvasSize.height}px`

    ctx.value = canvas.value.getContext('2d')
    if (!ctx.value) return

    ctx.value.setTransform(dpr, 0, 0, dpr, 0, 0)
  }

  const destroy = (): void => {
    videoManager.value?.destroy()
    videoManager.value = null
    ctx.value = null
    imageCache.clear()
  }

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------

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
    loadAllElementImages,
    normalizedToCanvasInImage,
    canvasToNormalizedInImage,
  }
}
