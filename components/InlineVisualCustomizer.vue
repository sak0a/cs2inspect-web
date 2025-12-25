<script setup lang="ts">
import type { VisualCustomizerProps, CanvasElement, CanvasState } from '~/types/canvas'
import {
  stickerToCanvasElement,
  keychainToCanvasElement,
  canvasElementToKeychain,
  canvasElementToSticker,
  generateFlatImageUrl,
  generateFallbackWeaponImageUrl,
  getDefaultStickerPosition,
  createCoordinateTransform,
  getExternalNormalizationRefs,
  getWeaponAssetSizes,
} from '~/utils/canvasCoordinates'



/**
 * Updates an element's position in the canvas state
 */
const setElementPosition = (elementId: string, x: number, y: number) => {
    const el = canvasState.value.elements.find(e => e.id === elementId)
    if (el) {
        el.position = { x, y }
    }
}

// Interface for inline customizer events (based on plan)
interface InlineVisualCustomizerEvents {
  (e: 'update-stickers', stickers: Array<any>): void
  (e: 'update-keychain', keychain: any): void
  (e: 'update-wear', wear: number): void
  (e: 'select-sticker-slot', slotIndex: number): void // Keep for compat if used elsewhere? 
  (e: 'open-sticker-modal', slotIndex: number): void
  (e: 'save'): void
}

const props = defineProps<VisualCustomizerProps>()
const emit = defineEmits<InlineVisualCustomizerEvents>()

const { t } = useI18n()
const message = useMessage()
const isDevelopment = import.meta.env.DEV

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
  canvasSize: { width: 1120, height: 500 },
  weaponImage: '',
  isDragging: false,
  isEditing: true
})

// Current weapon wear value
const currentWear = ref(0)
const isVideoMode = ref(false)
const videoUrl = ref('')
const isVideoLoading = ref(false)

// Coordinates
const coordinateTransform = createCoordinateTransform()
const backgroundDrawRect = ref<{ x: number; y: number; width: number; height: number }>({ x: 0, y: 0, width: 0, height: 0 })
const extXRef = ref(0)
const extYRef = ref(0)
const offsetUnits = ref<'px' | 'ext'>('px')
const REF_WIDTH = 1328
const REF_HEIGHT = 384

// Debug mode state (only available in development)
const showCoordinateOverlay = ref(false)
const mousePosition = ref({ x: 0, y: 0 })

// Asset sizes are now computed based on weapon type
const assetSizes = computed(() => {
  const weaponName = props.weaponSkin?.name.split(' | ')[0] || 'unknown'
  return getWeaponAssetSizes(weaponName)
})

const STICKER_MAX_WIDTH_PX = computed(() => assetSizes.value.sticker.width)
const STICKER_MAX_HEIGHT_PX = computed(() => assetSizes.value.sticker.height)
const KEYCHAIN_MAX_WIDTH_PX = computed(() => assetSizes.value.keychain.width)
const KEYCHAIN_MAX_HEIGHT_PX = computed(() => assetSizes.value.keychain.height)

// Image cache
const imageCache = new Map<string, HTMLImageElement>()

// Quick Settings State (Phase 5)
const showQuickSettings = ref(false)
const quickSettingsPosition = ref({ x: 0, y: 0 })

// --- Helpers ---

const debugLog = (...args: unknown[]) => {
  if (isDevelopment) console.log(...args)
}
const debugWarn = (...args: unknown[]) => {
  if (isDevelopment) console.warn(...args)
}

const normalizedToCanvasInImage = (p: { x: number; y: number }) => {
  const r = backgroundDrawRect.value
  if (r.width > 0 && r.height > 0) {
    return { x: r.x + p.x * r.width, y: r.y + p.y * r.height }
  }
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
  return coordinateTransform.canvasToNormalized(pt, canvasState.value.canvasSize)
}

const getStickerDefaultCanvasPos = (el: CanvasElement) => {
  const weaponName = props.weaponSkin?.name.split(' | ')[0] || 'unknown'
  const slot = typeof el.slotIndex === 'number' ? el.slotIndex : 0
  const defNorm = getDefaultStickerPosition(slot, weaponName)
  return normalizedToCanvasInImage(defNorm)
}

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

// Get element offset in canvas pixels relative to its default slot position
const getElementOffsetCanvasPx = (el: CanvasElement) => {
  const cur = normalizedToCanvasInImage(el.position)
  if (el.type === 'sticker') {
    const def = getStickerDefaultCanvasPos(el)
    return { x: Math.round(cur.x - def.x), y: Math.round(cur.y - def.y) }
  }
  return { x: 0, y: 0 }
}

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

const updateElementPosition = (axis: 'x' | 'y', value: number | null) => {
    if(!selectedElement.value || value === null) return
    if(axis === 'x') selectedElement.value.position.x = value
    if(axis === 'y') selectedElement.value.position.y = value
    renderCanvas()
}

const updateElementZ = (value: number | null) => {
    if(!selectedElement.value || value === null) return
    selectedElement.value.z = value
    renderCanvas()
}

// --- Image Loading ---

const toCanvasSafeUrl = (url: string) => {
  try {
    if (!url) {
        console.warn('toCanvasSafeUrl: Empty URL')
        return ''
    }
    const u = new URL(url, window.location.origin)
    if (u.origin === window.location.origin) return u.toString()
    if (u.protocol === 'http:' || u.protocol === 'https:') {
      return `/api/proxy/image?url=${encodeURIComponent(u.toString())}`
    }
    return url
  } catch (e) {
    console.warn('toCanvasSafeUrl: Invalid URL', url, e)
    return url
  }
}

const loadImage = (url: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const cacheKey = url
    const finalUrl = toCanvasSafeUrl(url)
    console.log(`[InlineVisualCustomizer] Loading image: ${url} -> ${finalUrl}`)
    
    if (imageCache.has(cacheKey)) {
      const cachedImg = imageCache.get(cacheKey)!
      if (cachedImg.complete && cachedImg.naturalWidth > 0) {
        console.log('[InlineVisualCustomizer] Cache hit for', url)
        resolve(cachedImg)
        return
      }
    }
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      console.log('[InlineVisualCustomizer] Image loaded successfully:', url)
      imageCache.set(cacheKey, img)
      resolve(img)
    }
    img.onerror = (e) => {
      console.error('[InlineVisualCustomizer] Failed to load image:', finalUrl, e)
      reject(new Error(`Failed to load image: ${finalUrl}`))
    }
    img.src = finalUrl
  })
}

// --- Computed ---

const selectedElement = computed(() => {
  return canvasState.value.elements.find(el => el.id === canvasState.value.selectedElementId)
})

// --- Initialization ---

// Force video to load and render
const forceVideoLoad = async () => {
  if (!isVideoMode.value && props.weaponSkin) {
    await initializeWeaponBackground()
  }
  if (isVideoMode.value && videoManager.value) {
    const originalWear = currentWear.value
    currentWear.value = Math.min(1, originalWear + 0.001)
    renderCanvas()
    setTimeout(() => {
      currentWear.value = originalWear
      renderCanvas()
      setTimeout(() => {
        handleResize()
      }, 100)
    }, 150)
  } else {
    renderCanvas()
    setTimeout(() => {
      handleResize()
    }, 100)
  }
}

const initializeCanvas = async () => {
  await nextTick()
  if (!canvas.value || !canvasContainer.value || !video.value) return

  console.log('[InlineVisualCustomizer] initializeCanvas started')
  
  const containerRect = canvasContainer.value.getBoundingClientRect()
  console.log('[InlineVisualCustomizer] Container Rect:', containerRect)
  
  canvasState.value.canvasSize = {
    width: containerRect.width,
    height: containerRect.height || 600 // Fallback height
  }
  
  canvas.value.width = canvasState.value.canvasSize.width
  canvas.value.height = canvasState.value.canvasSize.height
  console.log('[InlineVisualCustomizer] Canvas Size set to:', canvasState.value.canvasSize)

  ctx.value = canvas.value.getContext('2d')

  if (!ctx.value) return

  currentWear.value = props.weaponWear || 0
  
  // Set ext refs
  const weaponName = props.weaponSkin?.name.split(' | ')[0] || 'unknown'
  const refs = getExternalNormalizationRefs(weaponName)
  extXRef.value = refs.x
  extYRef.value = refs.y

  await initializeWeaponBackground()
  convertExistingCustomizations()
  renderCanvas()
  
  nextTick(() => handleResize())
}

const initializeWeaponBackground = async () => {
  console.log('[InlineVisualCustomizer] initializeWeaponBackground')
  if (!props.weaponSkin || !video.value || !ctx.value) {
    console.warn('[InlineVisualCustomizer] Missing props or refs', { skin: !!props.weaponSkin, video: !!video.value, ctx: !!ctx.value })
    return
  }
  
  const weaponName = props.weaponSkin.name.split(' | ')[0] || 'weapon'
  const skinName = props.weaponSkin.name.split(' | ')[1] || 'skin'
  videoUrl.value = generateVideoUrl(weaponName, skinName)
  isVideoLoading.value = true
  
  let videoReady = false
  
  // Try video first (if not explicitly disabled or forcing image)
  try {
      const videoExists = await checkVideoExists(videoUrl.value)
      if (videoExists) {
        videoManager.value = new VideoCanvasManager({
             video: video.value,
             ctx: ctx.value,
             canvasSize: canvasState.value.canvasSize,
             wearValue: currentWear.value,
             minWear: props.minWear || 0,
             maxWear: props.maxWear || 1,
             videoDuration: 140
        })
        videoManager.value.setRenderCallback(() => drawElements())
        await videoManager.value.loadVideo(videoUrl.value)
        canvasState.value.weaponImage = ''
        isVideoMode.value = true
        videoReady = true
        console.log('[InlineVisualCustomizer] Video initialized successfully')
      }
  } catch (e) {
      console.warn('[InlineVisualCustomizer] Video initialization failed', e)
      videoReady = false
  }
  
  // Fallback to static image
  if (!videoReady) {
      isVideoMode.value = false
      console.log('[InlineVisualCustomizer] Fallback to static image')
      const imageUrl = props.weaponSkin.image
      if (imageUrl) {
          canvasState.value.weaponImage = imageUrl
          try {
              await loadImage(imageUrl)
              console.log('[InlineVisualCustomizer] Static image loaded')
          } catch (e) {
              console.error('[InlineVisualCustomizer] Static image load failed', e)
          }
           renderCanvas()
      } else {
          console.error('[InlineVisualCustomizer] No static image available')
      }
  }
  isVideoLoading.value = false
}
const initializeStaticBackground = () => {
  if (!props.weaponSkin) return
  const weaponName = props.weaponSkin.name.split(' | ')[0] || 'weapon'
  const skinName = props.weaponSkin.name.split(' | ')[1] || 'skin'
  canvasState.value.weaponImage = generateFlatImageUrl(weaponName, skinName)
}

const convertExistingCustomizations = () => {
  const elements: CanvasElement[] = []
  const weaponName = props.weaponSkin?.name.split(' | ')[0] || 'unknown'
  props.stickers.forEach((sticker, index) => {
    if (sticker) {
      const element = stickerToCanvasElement(sticker, index, 10 + index, weaponName)
      if (element) elements.push(element)
    }
  })
  if (props.keychain) {
    const element = keychainToCanvasElement(props.keychain, 5, weaponName)
    if (element) elements.push(element)
  }
  canvasState.value.elements = elements
}

// --- Rendering ---

const renderCanvas = () => {
  if (!ctx.value || !canvas.value) return
  if (isVideoMode.value && videoManager.value) {
    videoManager.value.renderFrame()
    const meta = videoManager.value.getMetadata()
    const cw = canvas.value.width
    const ch = canvas.value.height
    if (meta.width > 0 && meta.height > 0) {
      const videoAspect = meta.width / meta.height
      const canvasAspect = cw / ch
      let dw, dh, dx, dy
      if (videoAspect > canvasAspect) {
        dw = cw; dh = cw / videoAspect; dx = 0; dy = (ch - dh) / 2
      } else {
        dh = ch; dw = ch * videoAspect; dx = (cw - dw) / 2; dy = 0
      }
      backgroundDrawRect.value = { x: dx, y: dy, width: dw, height: dh }
    }
    drawElements()
  } else {
    renderStaticBackground()
  }
  
  // Debug Overlay
  if (isDevelopment && showCoordinateOverlay.value) {
    drawCoordinateOverlay()
  }
}

const drawImageWithAspectRatio = (img: HTMLImageElement, ctx: CanvasRenderingContext2D, canvasWidth: number, canvasHeight: number) => {
  const imgAspect = img.naturalWidth / img.naturalHeight
  const canvasAspect = canvasWidth / canvasHeight
  let dw, dh, dx, dy
  if (imgAspect > canvasAspect) {
    dw = canvasWidth; dh = canvasWidth / imgAspect; dx = 0; dy = (canvasHeight - dh) / 2
  } else {
    dh = canvasHeight; dw = canvasHeight * imgAspect; dx = (canvasWidth - dw) / 2; dy = 0
  }
  backgroundDrawRect.value = { x: dx, y: dy, width: dw, height: dh }
  ctx.fillStyle = '#1a1a1a'
  ctx.fillRect(0, 0, canvasWidth, canvasHeight)
  ctx.drawImage(img, dx, dy, dw, dh)
}

const renderStaticBackground = () => {
    if(!ctx.value || !canvas.value) return
    ctx.value.clearRect(0,0, canvas.value.width, canvas.value.height)
    if(canvasState.value.weaponImage) {
        const img = new Image()
        img.onload = () => {
            if(ctx.value && canvas.value) {
                console.log('[InlineVisualCustomizer] Drawing static background image')
                drawImageWithAspectRatio(img, ctx.value, canvas.value.width, canvas.value.height)
                drawElements()
            }
        }
        img.onerror = (e) => {
             console.error('[InlineVisualCustomizer] Error drawing static background image', e)
             // Fallback logic
             const fallbackImg = new Image()
             fallbackImg.onload = () => {
                 if(ctx.value && canvas.value) {
                     drawImageWithAspectRatio(fallbackImg, ctx.value, canvas.value.width, canvas.value.height)
                     drawElements()
                 }
             }
             fallbackImg.onerror = () => {
                 if(ctx.value) {
                     ctx.value.fillStyle = '#2a2a2a'
                     ctx.value.fillRect(0,0, canvas.value!.width, canvas.value!.height)
                 }
                 backgroundDrawRect.value = {x:0,y:0,width:canvas.value!.width, height:canvas.value!.height}
                 drawElements()
             }
             fallbackImg.src = generateFallbackWeaponImageUrl(props.weaponSkin?.name.split(' | ')[0] || 'ak-47')
        }
        img.src = canvasState.value.weaponImage
    } else {
        backgroundDrawRect.value = {x:0,y:0,width:canvas.value!.width, height:canvas.value!.height}
        drawElements()
    }
}

const drawElements = () => {
    if(!ctx.value) return
    drawSlotIndicators()
    const sorted = [...canvasState.value.elements].sort((a,b) => a.zIndex - b.zIndex)
    sorted.forEach(el => drawElement(el))
}

const drawSlotIndicators = () => {
    if(!ctx.value) return
    const accent = getComputedStyle(document.documentElement).getPropertyValue('--selection-ring').trim() || '#FACC15'
    const occupiedSlots = new Set(canvasState.value.elements.filter(el => el.type === 'sticker').map(el => el.slotIndex))
    
    for(let slot=0; slot<5; slot++) {
        if(!occupiedSlots.has(slot)) {
            const weaponName = props.weaponSkin?.name.split(' | ')[0] || 'unknown'
            const slotPos = getDefaultStickerPosition(slot, weaponName)
            const pos = normalizedToCanvasInImage(slotPos)
            
            ctx.value.save()
            ctx.value.globalAlpha = 0.9; ctx.value.lineWidth = 2; ctx.value.strokeStyle = accent
            ctx.value.fillStyle = 'rgba(0,0,0,0.30)'; ctx.value.setLineDash([6,4])
            ctx.value.shadowColor = 'rgba(0,0,0,0.55)'; ctx.value.shadowBlur = 8
            
            ctx.value.beginPath(); ctx.value.arc(pos.x, pos.y, 20, 0, 2*Math.PI); ctx.value.fill(); ctx.value.stroke()
            
            ctx.value.shadowColor = 'transparent'; ctx.value.setLineDash([])
            ctx.value.fillStyle = '#FFFFFF'; ctx.value.font = '500 12px sans-serif'
            ctx.value.textAlign = 'center'; ctx.value.textBaseline = 'middle'
            ctx.value.fillText((slot+1).toString(), pos.x, pos.y)
            ctx.value.restore()
        }
    }
    // Keychain indicator
    if(!canvasState.value.elements.some(el => el.type === 'keychain')) {
        const pos = normalizedToCanvasInImage(DEFAULT_KEYCHAIN_POSITION)
        ctx.value.save()
        ctx.value.globalAlpha = 0.9; ctx.value.lineWidth = 2; ctx.value.strokeStyle = accent
        ctx.value.fillStyle = 'rgba(0,0,0,0.30)'; ctx.value.setLineDash([6,4])
        ctx.value.shadowColor = 'rgba(0,0,0,0.55)'; ctx.value.shadowBlur = 8
        
        ctx.value.beginPath(); ctx.value.arc(pos.x, pos.y, 20, 0, 2*Math.PI); ctx.value.fill(); ctx.value.stroke()
        
        ctx.value.shadowColor = 'transparent'; ctx.value.setLineDash([])
        ctx.value.fillStyle = '#FFFFFF'; ctx.value.font = '500 12px sans-serif'
        ctx.value.textAlign = 'center'; ctx.value.textBaseline = 'middle'
    ctx.value.fillText('K', pos.x, pos.y)
    ctx.value.restore()
  }
}

// Draw coordinate overlay for debugging (only in development)
const drawCoordinateOverlay = () => {
  if (!isDevelopment || !ctx.value || !canvas.value) return

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

  // X-axis labels
  for (let x = 0; x <= canvas.value.width; x += 100) {
    ctx.value.fillText(x.toString(), x + 2, 15)
  }

  // Y-axis labels
  for (let y = 0; y <= canvas.value.height; y += 100) {
    if (y > 0) ctx.value.fillText(y.toString(), 2, y - 2)
  }

  // Draw mouse position
  ctx.value.fillStyle = '#ffff00'
  ctx.value.font = '14px monospace'
  ctx.value.fillText(`Mouse: (${mousePosition.value.x}, ${mousePosition.value.y})`, 10, canvas.value.height - 40)
  ctx.value.fillText('Coordinate Overlay Active - Hover to see positions', 10, canvas.value.height - 20)

  ctx.value.restore()
}

const drawElement = (element: CanvasElement) => {
    if(!ctx.value) return
    const pos = normalizedToCanvasInImage(element.position)
    ctx.value.save()
    ctx.value.translate(pos.x, pos.y)
    ctx.value.rotate((element.rotation * Math.PI)/180)
    ctx.value.scale(element.scale, element.scale)
    
    const size = 100 * element.scale
    
    // Selection ring logic
    const drawSelection = (bounds?: {width: number, height: number}) => {
        if(element.selected) { // Use exact same logic from modal
            const accent = getComputedStyle(document.documentElement).getPropertyValue('--selection-ring').trim() || '#FACC15'
            ctx.value!.strokeStyle = accent
             const invScale = 1 / Math.max(0.1, element.scale || 1)
             const ringPadding = 0.75 * invScale
             const ringLineWidth = 1.1 * invScale
             const dash = 2.5 * invScale
             const w = bounds?.width ?? size
             const h = bounds?.height ?? size

             ctx.value!.lineWidth = ringLineWidth
             ctx.value!.setLineDash([dash, dash])
             ctx.value!.strokeRect(
                -w / 2 - ringPadding,
                -h / 2 - ringPadding,
                w + ringPadding * 2,
                h + ringPadding * 2
             )
             ctx.value!.setLineDash([])
             // Corners
             const handleSize = 5 * invScale
             const corners: [number, number][] = [
                [-w / 2 - ringPadding, -h / 2 - ringPadding], 
                [w / 2 + ringPadding, -h / 2 - ringPadding], 
                [w / 2 + ringPadding, h / 2 + ringPadding], 
                [-w / 2 - ringPadding, h / 2 + ringPadding] 
             ]
             ctx.value!.fillStyle = accent
             corners.forEach((corner) => {
                const cx = corner[0]
                const cy = corner[1]
                ctx.value!.fillRect(cx - handleSize/2, cy - handleSize/2, handleSize, handleSize)
             })
        }
    }
    
    if(element.apiData?.image) {
        const cachedImg = imageCache.get(element.apiData.image)
        if(cachedImg && cachedImg.complete && cachedImg.naturalWidth > 0) {
            const widthScale = STICKER_MAX_WIDTH_PX.value / cachedImg.naturalWidth
            const heightScale = STICKER_MAX_HEIGHT_PX.value / cachedImg.naturalHeight
            const baseScale = Math.min(widthScale, heightScale, 1)
            const baseWidth = cachedImg.naturalWidth * baseScale
            const baseHeight = cachedImg.naturalHeight * baseScale
            
            const drawWidth = baseWidth * element.scale
            const drawHeight = baseHeight * element.scale
            
            ctx.value.drawImage(cachedImg, -drawWidth/2, -drawHeight/2, drawWidth, drawHeight)
            drawSelection({width: drawWidth, height: drawHeight})
        } else {
            loadImage(element.apiData.image).then(() => renderCanvas()).catch(() => renderCanvas())
            // Fallback draw
             ctx.value!.fillStyle = element.type === 'sticker' ? '#FF6B6B' : '#4ECDC4'
             ctx.value!.fillRect(-size/2, -size/2, size, size)
             drawSelection()
        }
    } else {
        ctx.value!.fillStyle = element.type === 'sticker' ? '#FF6B6B' : '#4ECDC4'
        ctx.value!.fillRect(-size/2, -size/2, size, size)
        drawSelection()
    }
    ctx.value.restore()
}

// --- Interaction ---

const findElementAtPosition = (canvasPos: { x: number, y: number }) => {
  const sorted = [...canvasState.value.elements].sort((a, b) => b.zIndex - a.zIndex)
  for (const element of sorted) {
    const pos = normalizedToCanvasInImage(element.position)
    let bounds
    if (element.apiData?.image) {
      const cachedImg = imageCache.get(element.apiData.image)
      if (cachedImg && cachedImg.complete && cachedImg.naturalWidth > 0) {
        const widthScale = STICKER_MAX_WIDTH_PX.value / cachedImg.naturalWidth
        const heightScale = STICKER_MAX_HEIGHT_PX.value / cachedImg.naturalHeight
        const baseScale = Math.min(widthScale, heightScale, 1)
        const baseWidth = cachedImg.naturalWidth * baseScale
        const baseHeight = cachedImg.naturalHeight * baseScale
        const drawWidth = baseWidth * element.scale
        const drawHeight = baseHeight * element.scale
        bounds = {
          left: pos.x - drawWidth/2, right: pos.x + drawWidth/2,
          top: pos.y - drawHeight/2, bottom: pos.y + drawHeight/2
        }
      } else {
          const fallbackWidth = (element.type === 'sticker' ? STICKER_MAX_WIDTH_PX.value : KEYCHAIN_MAX_WIDTH_PX.value) * element.scale
          const fallbackHeight = (element.type === 'sticker' ? STICKER_MAX_HEIGHT_PX.value : KEYCHAIN_MAX_HEIGHT_PX.value) * element.scale
          bounds = {
            left: pos.x - fallbackWidth/2, right: pos.x + fallbackWidth/2,
            top: pos.y - fallbackHeight/2, bottom: pos.y + fallbackHeight/2
          }
      }
    } else {
        const fallbackWidth = (element.type === 'sticker' ? STICKER_MAX_WIDTH_PX.value : KEYCHAIN_MAX_WIDTH_PX.value) * element.scale
        const fallbackHeight = (element.type === 'sticker' ? STICKER_MAX_HEIGHT_PX.value : KEYCHAIN_MAX_HEIGHT_PX.value) * element.scale
        bounds = {
          left: pos.x - fallbackWidth/2, right: pos.x + fallbackWidth/2,
          top: pos.y - fallbackHeight/2, bottom: pos.y + fallbackHeight/2
        }
    }
    
    if (canvasPos.x >= bounds.left && canvasPos.x <= bounds.right &&
        canvasPos.y >= bounds.top && canvasPos.y <= bounds.bottom) {
      return element
    }
  }
  return null
}

const selectElement = (elementId: string | null) => {
  canvasState.value.elements.forEach(el => el.selected = el.id === elementId)
  canvasState.value.selectedElementId = elementId
  renderCanvas()
}

const handleCanvasMouseDown = (event: MouseEvent) => {
  if (!canvas.value) return
  event.preventDefault()
  const rect = canvas.value.getBoundingClientRect()
  const canvasPos = { x: event.clientX - rect.left, y: event.clientY - rect.top }
  
  const clicked = findElementAtPosition(canvasPos)
  if (clicked) {
    selectElement(clicked.id)
    canvasState.value.isDragging = true
    
    // Show Quick Settings (Phase 5) logic
    showQuickSettings.value = true
    quickSettingsPosition.value = { x: event.clientX, y: event.clientY } // Screen coordinates or relative? 
    // We will fix quick settings position in Phase 5
  } else {
    // Check for empty sticker slot click if weapon is loaded and not currently adding a sticker
    if (!selectedElement.value && props.weaponSkin) {
      for (let i = 0; i < 5; i++) {
        // Skip if slot is occupied
        if (canvasState.value.elements.some(element => element.type === 'sticker' && element.slotIndex === i)) continue

        const defaultPos = getDefaultStickerPosition(i, props.weaponSkin.name)
        const canvasSlotPos = normalizedToCanvasInImage(defaultPos)
        
        // Calculate distance (hit radius approx 40px)
        const dx = canvasPos.x - canvasSlotPos.x
        const dy = canvasPos.y - canvasSlotPos.y
        const dist = Math.sqrt(dx*dx + dy*dy)
        
        if (dist < 40) { // Hit radius
          emit('open-sticker-modal', i)
          return
        }
      }
    }

    selectElement(null)
    canvasState.value.isDragging = false
    showQuickSettings.value = false
  }
  renderCanvas()
}

const handleCanvasMouseMove = (event: MouseEvent) => {
  if (!canvas.value) return
  const rect = canvas.value.getBoundingClientRect()
  const canvasPos = { x: Math.round(event.clientX - rect.left), y: Math.round(event.clientY - rect.top) }

  // Update mouse position for debug overlay
  if (isDevelopment) {
    mousePosition.value = canvasPos
    if (showCoordinateOverlay.value) renderCanvas()
  }

  if (!canvasState.value.isDragging || !selectedElement.value) return
  event.preventDefault()
  
  const normalizedPos = canvasToNormalizedInImage(canvasPos)
  if (coordinateTransform.validateCoordinates(normalizedPos)) {
    setElementPosition(selectedElement.value.id, normalizedPos.x, normalizedPos.y)
    renderCanvas()
  }
}

const handleCanvasMouseUp = () => {
    canvasState.value.isDragging = false
}

const handleWearUpdate = (val: number) => {
  currentWear.value = val
  emit('update-wear', val)
  if (isVideoMode.value && videoManager.value) {
    videoManager.value.updateWear(val)
  } else {
    renderCanvas()
  }
}

const handleResize = () => {
  if (!canvas.value || !canvasContainer.value) return
  const containerRect = canvasContainer.value.getBoundingClientRect()
  canvasState.value.canvasSize = { width: containerRect.width, height: containerRect.height }
  canvas.value.width = containerRect.width
  canvas.value.height = containerRect.height
  if (videoManager.value) videoManager.value.updateCanvasSize(canvasState.value.canvasSize)
  renderCanvas()
}

const handleSave = (arg: boolean | MouseEvent = false) => {
  const silent = typeof arg === 'boolean' ? arg : false
  // Convert elements back to format for emit
  const stickers: Array<any> = new Array(5).fill(null)
  let keychain: any = null
  const weaponName = props.weaponSkin?.name.split(' | ')[0] || 'unknown'
  
  canvasState.value.elements.forEach(element => {
    if (element.type === 'sticker' && typeof element.slotIndex === 'number') {
      stickers[element.slotIndex] = canvasElementToSticker(element, weaponName)
    } else if (element.type === 'keychain') {
      keychain = canvasElementToKeychain(element, weaponName)
    }
  })
  
  emit('update-stickers', stickers)
  emit('update-keychain', keychain)
  
  if (!silent) {
    emit('save')
  }
}

// --- Quick Settings Handlers ---

const handleRemoveSelected = () => {
  if (!selectedElement.value) return
  const idToRemove = selectedElement.value.id
  canvasState.value.elements = canvasState.value.elements.filter(el => el.id !== idToRemove)
  selectElement(null)
  renderCanvas()
}

const handleUpdateScale = (delta: number) => {
  if (!selectedElement.value) return
  const newScale = Math.max(0.1, Math.min(2.0, selectedElement.value.scale + delta))
  selectedElement.value.scale = newScale
  renderCanvas()
}

const handleUpdateRotation = (delta: number) => {
  if (!selectedElement.value) return
  selectedElement.value.rotation = (selectedElement.value.rotation + delta) % 360
  renderCanvas()
}

const handleUpdateStickerWear = (wear: number) => {
  if (!selectedElement.value || selectedElement.value.type !== 'sticker') return
  selectedElement.value.wear = wear
  renderCanvas()
}

// Direct setters for numeric inputs
const handleSetScale = (value: number | null) => {
  if (!selectedElement.value || value === null) return
  selectedElement.value.scale = Math.max(0.1, Math.min(3, value))
  renderCanvas()
}

const handleSetRotation = (value: number | null) => {
  if (!selectedElement.value || value === null) return
  selectedElement.value.rotation = ((value % 360) + 360) % 360
  renderCanvas()
}

// Watchers
watch(() => props.stickers, () => convertExistingCustomizations(), { deep: true })
watch(() => props.keychain, () => convertExistingCustomizations())

onMounted(() => {
  initializeCanvas()
  window.addEventListener('resize', handleResize)
  setTimeout(() => forceVideoLoad(), 500)
})

onUnmounted(() => {
  handleSave(true) // Auto-save on exit
  window.removeEventListener('resize', handleResize)
  if (videoManager.value) {
    videoManager.value.destroy()
    videoManager.value = null
  }
})

// Expose refreshCanvas for parent
defineExpose({
  refreshCanvas: () => {
    convertExistingCustomizations()
    renderCanvas()
  },
  save: () => handleSave(true)
})
</script>

<template>
  <div class="inline-visual-customizer flex flex-col items-center">
    <!-- Full-width Canvas Container -->
    <div 
        ref="canvasContainer" 
        class="canvas-container w-full relative bg-[#101010] rounded-lg overflow-hidden" 
        style="height: 500px;"
    >
      <video ref="video" crossorigin="anonymous" playsinline style="display: none;"></video>
      <canvas 
        ref="canvas" 
        class="w-full h-full cursor-crosshair select-none touch-none"
        @mousedown="handleCanvasMouseDown"
        @mousemove="handleCanvasMouseMove"
        @mouseup="handleCanvasMouseUp"
        @mouseleave="handleCanvasMouseUp"
      />
      <!-- Loading indicator -->
      <div v-if="isVideoLoading" class="absolute inset-0 flex items-center justify-center bg-black/50 pointer-events-none">
        <div class="animate-spin rounded-full h-12 w-12 border-4 border-[var(--selection-ring)] border-t-transparent"></div>
      </div>

      <!-- Debug Toggle (Dev only) -->
      <div v-if="isDevelopment" class="absolute top-2 right-2 z-50">
        <NButton 
          size="tiny" 
          secondary
          circle 
          @click="showCoordinateOverlay = !showCoordinateOverlay"
          :type="showCoordinateOverlay ? 'primary' : 'default'"
          class="opacity-50 hover:opacity-100 transition-opacity"
          title="Toggle Debug Overlay"
        >
          <template #icon>
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24">
               <path fill="currentColor" d="M9 3L5 6.99h3V14h2V6.99h3L9 3zm7 14.01V10h-2v7.01h-3L15 21l4-3.99h-3z"/>
            </svg>
          </template>
        </NButton>
      </div>
      
      <!-- Phase 5 Quick Settings (Moved to footer) -->
    </div>

    <!-- Footer: Controls + Wear Slider + Save -->
    <div class="flex items-center justify-between mt-4 px-4 w-full gap-4">
      <!-- Left: Controls Panel (Replaces Weapon Name) -->
      <!-- Use flex-none to fit content, max-w-[70%] to prevent pushing slider too much -->
      <div class="flex-none flex items-center p-1 max-w-[70%]">
          <div v-if="selectedElement" 
               class="flex flex-col gap-1.5
                      bg-black/40 backdrop-blur-md 
                      border border-white/5 
                      rounded-xl p-2 
                      shadow-sm"
               @mousedown.stop
          >
            <!-- Row 1: Transform & Actions -->
            <div class="flex items-center gap-2">
              <span class="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-px">Scale</span>
              
              <!-- Scale -->
              <div class="flex items-center gap-1 border-r border-white/10 pr-2">
                  <NButton size="tiny" secondary circle @click="handleUpdateScale(-0.1)">-</NButton>
                  <NInputNumber 
                    :value="selectedElement.scale" 
                    :min="0.1" :max="3" :step="0.1" :precision="1"
                    size="tiny" 
                    class="w-14"
                    :show-button="false"
                    @update:value="handleSetScale"
                  />
                  <NButton size="tiny" secondary circle @click="handleUpdateScale(0.1)">+</NButton>
              </div>
              
              <!-- Rotation -->
              <span class="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-px">Rotation</span>
              <div class="flex items-center gap-1 border-r border-white/10 pr-2">
                  <NButton size="tiny" secondary circle @click="handleUpdateRotation(-15)">↺</NButton>
                  <NInputNumber 
                    :value="selectedElement.rotation" 
                    :min="0" :max="360" :step="1" :precision="0"
                    size="tiny" 
                    class="w-14"
                    :show-button="false"
                    @update:value="handleSetRotation"
                  />
                  <NButton size="tiny" secondary circle @click="handleUpdateRotation(15)">↻</NButton>
              </div>
              
              <!-- Wear (Sticker only) -->
              <div v-if="selectedElement.type === 'sticker'" class="flex items-center gap-1 border-r border-white/10 pr-2">
                   <span class="text-[9px] text-gray-400">WEAR</span>
                   <div class="w-16 px-1">
                      <NSlider :value="selectedElement.wear || 0" :step="0.05" :min="0" :max="1" @update:value="handleUpdateStickerWear" />
                   </div>
              </div>
              
              <!-- Remove -->
              <NButton type="error" size="tiny" secondary circle @click="handleRemoveSelected">
                  <template #icon>
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24"><path fill="currentColor" d="M19 6.41L17.59 5L12 10.59L6.41 5L5 6.41L10.59 12L5 17.59L6.41 19L12 13.41L17.59 19L19 17.59L13.41 12z"/></svg>
                  </template>
              </NButton>
            </div>

            <!-- Row 2: Position -->
            <div class="flex items-center gap-2">
                <span class="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-px">Position</span>

                <!-- Sticker Position -->
                <div v-if="selectedElement.type === 'sticker'" class="flex items-center gap-2">
                     <!-- Units -->
                     <NSelect 
                        v-model:value="offsetUnits" 
                        size="tiny" 
                        :options="[{ label: 'PX', value: 'px' }, { label: 'EXT', value: 'ext' }]" 
                        class="w-14" 
                    />
                     
                     <div class="flex items-center gap-1">
                         <template v-if="offsetUnits === 'px'">
                             <span class="text-[9px] text-gray-400">X</span>
                             <NInputNumber size="tiny" :value="getElementOffsetCanvasPx(selectedElement).x" @update:value="v => updateSelectedElementOffset('x', v)" class="w-12" :show-button="false" placeholder="0" />
                             <span class="text-[9px] text-gray-400 ml-1">Y</span>
                             <NInputNumber size="tiny" :value="getElementOffsetCanvasPx(selectedElement).y" @update:value="v => updateSelectedElementOffset('y', v)" class="w-12" :show-button="false" placeholder="0" />
                         </template>
                         <template v-else>
                             <span class="text-[9px] text-gray-400">X</span>
                             <NInputNumber size="tiny" :value="getElementOffsetExternalNorm(selectedElement).x" :precision="4" @update:value="v => updateSelectedElementOffsetExternal('x', v)" class="w-14" :show-button="false" />
                             <span class="text-[9px] text-gray-400 ml-1">Y</span>
                             <NInputNumber size="tiny" :value="getElementOffsetExternalNorm(selectedElement).y" :precision="4" @update:value="v => updateSelectedElementOffsetExternal('y', v)" class="w-14" :show-button="false" />
                             
                             <div class="flex items-center gap-1 border-l border-white/10 pl-2 ml-1">
                                <span class="text-[9px] text-gray-500">REF</span>
                                <NInputNumber v-model:value="extXRef" size="tiny" class="w-10" :show-button="false" />
                                <NInputNumber v-model:value="extYRef" size="tiny" class="w-10" :show-button="false" />
                             </div>
                         </template>
                     </div>
                </div>

                <!-- Keychain Position -->
                <div v-if="selectedElement.type === 'keychain'" class="flex items-center gap-2">
                     <span class="text-[9px] text-gray-400">X</span>
                     <NInputNumber size="tiny" :value="selectedElement.position.x" :step="0.01" :min="0" :max="1" :precision="2" @update:value="v => updateElementPosition('x', v)" class="w-12" :show-button="false" />
                     <span class="text-[9px] text-gray-400 ml-1">Y</span>
                     <NInputNumber size="tiny" :value="selectedElement.position.y" :step="0.01" :min="0" :max="1" :precision="2" @update:value="v => updateElementPosition('y', v)" class="w-12" :show-button="false" />
                     <span class="text-[9px] text-gray-400 ml-1">Z</span>
                     <NInputNumber size="tiny" :value="selectedElement.z || 0" :step="0.01" :min="-2" :max="2" :precision="2" @update:value="v => updateElementZ(v)" class="w-12" :show-button="false" />
                </div>
            </div>
          </div>
          <div v-else class="text-xs text-gray-500 italic pl-2">
             {{ t('modals.weaponSkin.visualCustomizer.inline.selectHint', {}, 'Select a sticker/keychain to edit') }}
          </div>
      </div>

      <!-- Center: Wear Slider -->
      <!-- Use flex-1 to fill remaining space, min-w-200px to ensure it's not crushed -->
      <div class="flex-1 min-w-[200px] px-4 border-l border-r border-white/5">
        <WearSlider
          v-model="currentWear"
          :min="props.minWear || 0"
          :max="props.maxWear || 1"
          @update:model-value="handleWearUpdate"
        />
      </div>

      <!-- Right: Save Button -->
      <!--<div class="flex-none">
        <NButton type="success" secondary class="w-28" @click="handleSave">
          {{ t('modals.weaponSkin.buttons.save') }}
        </NButton>
      </div>-->
    </div>
  </div>
</template>

<style scoped>
.canvas-container {
  box-shadow: inset 0 0 20px rgba(0,0,0,0.5);
  border: 1px solid rgba(255,255,255,0.05);
}
</style>
