<script setup lang="ts">
import type { VisualCustomizerProps, CanvasElement, CanvasState } from '~/types/canvas'
import {
  stickerToCanvasElement,
  keychainToCanvasElement,
  canvasElementToKeychain,
  canvasElementToSticker,
  generateFlatImageUrl,
  generateFallbackWeaponImageUrl,
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
  (e: 'select-sticker-slot', slotIndex: number): void
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
  canvasSize: { width: 1200, height: 800 },
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

const STICKER_MAX_WIDTH_PX = 70
const STICKER_MAX_HEIGHT_PX = 70

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

const toCanvasSafeUrl = (url: string): string => {
  try {
    const u = new URL(url, window.location.origin)
    if (u.origin === window.location.origin) return u.toString()
    if (u.protocol === 'http:' || u.protocol === 'https:') {
      return `/api/proxy/image?url=${encodeURIComponent(u.toString())}`
    }
    return url
  } catch {
    return url
  }
}

const loadImage = (url: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const cacheKey = url
    const finalUrl = toCanvasSafeUrl(url)
    if (imageCache.has(cacheKey)) {
      const cachedImg = imageCache.get(cacheKey)!
      if (cachedImg.complete && cachedImg.naturalWidth > 0) {
        resolve(cachedImg)
        return
      }
    }
    const img = new Image()
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

  const containerRect = canvasContainer.value.getBoundingClientRect()
  canvasState.value.canvasSize = {
    width: containerRect.width,
    height: containerRect.height || 600 // Fallback height
  }

  canvas.value.width = canvasState.value.canvasSize.width
  canvas.value.height = canvasState.value.canvasSize.height
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
  if (!props.weaponSkin || !video.value || !ctx.value) return
  const weaponName = props.weaponSkin.name.split(' | ')[0] || 'weapon'
  const skinName = props.weaponSkin.name.split(' | ')[1] || 'skin'
  videoUrl.value = generateVideoUrl(weaponName, skinName)
  isVideoLoading.value = true
  const videoExists = await checkVideoExists(videoUrl.value)
  if (videoExists && !isDevelopment) { // Assuming video works, strict DEV check removed for now to allow trying
     try {
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
       isVideoMode.value = true
     } catch (e) {
       isVideoMode.value = false
       initializeStaticBackground()
     }
  } else {
    // If strict DEV check or generic fallback
    if(videoExists) {
        // Try anyway
        try {
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
            isVideoMode.value = true
        } catch (e) {
            isVideoMode.value = false
            initializeStaticBackground()
        }
    } else {
        isVideoMode.value = false
        initializeStaticBackground()
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
    const element = keychainToCanvasElement(props.keychain, 5)
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
    backgroundDrawRect.value = { x: 0, y: 0, width: cw, height: ch }
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
                drawImageWithAspectRatio(img, ctx.value, canvas.value.width, canvas.value.height)
                drawElements()
            }
        }
        img.onerror = () => {
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
            const widthScale = STICKER_MAX_WIDTH_PX / cachedImg.naturalWidth
            const heightScale = STICKER_MAX_HEIGHT_PX / cachedImg.naturalHeight
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
        const widthScale = STICKER_MAX_WIDTH_PX / cachedImg.naturalWidth
        const heightScale = STICKER_MAX_HEIGHT_PX / cachedImg.naturalHeight
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
          const fallbackWidth = (element.type === 'sticker' ? STICKER_MAX_WIDTH_PX : 80) * element.scale
          const fallbackHeight = (element.type === 'sticker' ? STICKER_MAX_HEIGHT_PX : 80) * element.scale
          bounds = {
            left: pos.x - fallbackWidth/2, right: pos.x + fallbackWidth/2,
            top: pos.y - fallbackHeight/2, bottom: pos.y + fallbackHeight/2
          }
      }
    } else {
        const fallbackWidth = (element.type === 'sticker' ? STICKER_MAX_WIDTH_PX : 80) * element.scale
        const fallbackHeight = (element.type === 'sticker' ? STICKER_MAX_HEIGHT_PX : 80) * element.scale
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

const handleSave = () => {
  // Convert elements back to format for emit
  const stickers: Array<any> = new Array(5).fill(null)
  let keychain: any = null
  
  canvasState.value.elements.forEach(element => {
    if (element.type === 'sticker' && typeof element.slotIndex === 'number') {
      stickers[element.slotIndex] = canvasElementToSticker(element)
    } else if (element.type === 'keychain') {
      keychain = canvasElementToKeychain(element)
    }
  })
  
  emit('update-stickers', stickers)
  emit('update-keychain', keychain)
  emit('save')
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
  }
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
      <!-- Debug Toggle (Dev only) -->
      <div v-if="isDevelopment" class="absolute top-2 right-2 z-30">
          <NButton size="tiny" secondary type="warning" @click="showCoordinateOverlay = !showCoordinateOverlay; renderCanvas()">
              {{ showCoordinateOverlay ? 'Debug: ON' : 'Debug' }}
          </NButton>
      </div>
      <canvas 
        ref="canvas" 
        class="w-full h-full cursor-grab active:cursor-grabbing"
        @mousedown="handleCanvasMouseDown"
        @mousemove="handleCanvasMouseMove"
        @mouseup="handleCanvasMouseUp"
        @mouseleave="handleCanvasMouseUp"
      />
      <video ref="video" class="hidden" muted playsinline />
      
      <!-- Loading indicator -->
      <div v-if="isVideoLoading" class="absolute inset-0 flex items-center justify-center bg-black/50 pointer-events-none">
        <div class="animate-spin rounded-full h-12 w-12 border-4 border-[var(--selection-ring)] border-t-transparent"></div>
      </div>
      
      <!-- Phase 5 Quick Settings (Enhanced with glassmorphism and numeric inputs) -->
      <div v-if="selectedElement" 
           class="quick-settings-panel absolute bottom-4 left-1/2 transform -translate-x-1/2 
                  bg-black/75 backdrop-blur-xl 
                  border border-white/5 
                  rounded-xl p-3 
                  flex flex-col gap-3 
                  shadow-2xl shadow-black/60 
                  z-20"
           @mousedown.stop
      >
        <!-- Top Row: Scale & Rotation with numeric inputs -->
        <div class="flex items-center gap-3">
          <!-- Scale -->
          <div class="flex items-center gap-1 border-r border-white/10 pr-3">
              <span class="text-[10px] text-gray-400 uppercase font-bold px-1">{{ t('modals.weaponSkin.visualCustomizer.inline.controls.scale') }}</span>
              <NButton size="tiny" secondary circle @click="handleUpdateScale(-0.1)">-</NButton>
              <NInputNumber 
                :value="selectedElement.scale" 
                :min="0.1" :max="3" :step="0.1" :precision="1"
                size="tiny" 
                class="w-16"
                @update:value="handleSetScale"
              />
              <NButton size="tiny" secondary circle @click="handleUpdateScale(0.1)">+</NButton>
          </div>
          
          <!-- Rotation -->
          <div class="flex items-center gap-1 border-r border-white/10 pr-3">
              <span class="text-[10px] text-gray-400 uppercase font-bold px-1">{{ t('modals.weaponSkin.visualCustomizer.inline.controls.rotate') }}</span>
              <NButton size="tiny" secondary circle @click="handleUpdateRotation(-15)">↺</NButton>
              <NInputNumber 
                :value="selectedElement.rotation" 
                :min="0" :max="360" :step="1" :precision="0"
                size="tiny" 
                class="w-16"
                @update:value="handleSetRotation"
              />
              <NButton size="tiny" secondary circle @click="handleUpdateRotation(15)">↻</NButton>
          </div>
          
          <!-- Wear (Sticker only) -->
          <div v-if="selectedElement.type === 'sticker'" class="flex items-center gap-1 border-r border-white/10 pr-3">
               <span class="text-[10px] text-gray-400 uppercase font-bold px-1">{{ t('modals.weaponSkin.visualCustomizer.inline.controls.wear') }}</span>
               <div class="w-24 px-1">
                  <NSlider :value="selectedElement.wear || 0" :step="0.05" :min="0" :max="1" @update:value="handleUpdateStickerWear" />
               </div>
          </div>
          
          <!-- Remove -->
          <NButton type="error" size="tiny" secondary @click="handleRemoveSelected">
              {{ t('modals.weaponSkin.visualCustomizer.inline.controls.remove') }}
          </NButton>
        </div>

        <!-- Row 2: Coordinates (Sticker only) -->
        <div v-if="selectedElement.type === 'sticker'" class="flex items-center gap-3 pt-2 border-t border-white/10 mt-1">
            <!-- Units Toggle -->
             <div class="flex items-center">
                <NSelect 
                    v-model:value="offsetUnits" 
                    size="tiny" 
                    :options="[
                      { label: t('modals.visualCustomizer.labels.pixels') as string, value: 'px' }, 
                      { label: t('modals.visualCustomizer.labels.normalized') as string, value: 'ext' }
                    ]" 
                    class="w-24" 
                />
             </div>
             
             <!-- X / Y Inputs -->
             <div class="flex items-center gap-2">
                 <!-- Px Mode -->
                 <template v-if="offsetUnits === 'px'">
                     <div class="flex items-center gap-1">
                         <span class="text-[10px] text-gray-400 font-bold">X</span>
                         <NInputNumber size="tiny" :value="getElementOffsetCanvasPx(selectedElement).x" @update:value="v => updateSelectedElementOffset('x', v)" class="w-16" :show-button="false" placeholder="0" />
                     </div>
                     <div class="flex items-center gap-1">
                         <span class="text-[10px] text-gray-400 font-bold">Y</span>
                         <NInputNumber size="tiny" :value="getElementOffsetCanvasPx(selectedElement).y" @update:value="v => updateSelectedElementOffset('y', v)" class="w-16" :show-button="false" placeholder="0" />
                     </div>
                 </template>
                 
                 <!-- Ext Mode -->
                 <template v-else>
                     <div class="flex items-center gap-1">
                         <span class="text-[10px] text-gray-400 font-bold">X</span>
                         <NInputNumber size="tiny" :value="getElementOffsetExternalNorm(selectedElement).x" :precision="4" @update:value="v => updateSelectedElementOffsetExternal('x', v)" class="w-20" :show-button="false" />
                     </div>
                     <div class="flex items-center gap-1">
                         <span class="text-[10px] text-gray-400 font-bold">Y</span>
                         <NInputNumber size="tiny" :value="getElementOffsetExternalNorm(selectedElement).y" :precision="4" @update:value="v => updateSelectedElementOffsetExternal('y', v)" class="w-20" :show-button="false" />
                     </div>
                 </template>
             </div>
        </div>
        
        <!-- Row 3: External Refs (only if units=ext) -->
        <div v-if="selectedElement.type === 'sticker' && offsetUnits === 'ext'" class="flex items-center gap-3 pt-1 border-t border-white/10 mt-1">
            <span class="text-[10px] text-gray-400">Ref:</span>
            <NInputNumber v-model:value="extXRef" size="tiny" class="w-16" :show-button="false" placeholder="W" />
            <span class="text-[10px] text-gray-400">x</span>
            <NInputNumber v-model:value="extYRef" size="tiny" class="w-16" :show-button="false" placeholder="H" />
        </div>

        <!-- Keychain Controls -->
        <div v-if="selectedElement.type === 'keychain'" class="flex items-center gap-3 pt-2 border-t border-white/10 mt-1">
             <div class="flex items-center gap-2">
                 <div class="flex items-center gap-1">
                     <span class="text-[10px] text-gray-400 font-bold">X</span>
                     <NInputNumber size="tiny" :value="selectedElement.position.x" :step="0.01" :min="0" :max="1" :precision="2" @update:value="v => updateElementPosition('x', v)" class="w-16" :show-button="false" />
                 </div>
                 <div class="flex items-center gap-1">
                     <span class="text-[10px] text-gray-400 font-bold">Y</span>
                     <NInputNumber size="tiny" :value="selectedElement.position.y" :step="0.01" :min="0" :max="1" :precision="2" @update:value="v => updateElementPosition('y', v)" class="w-16" :show-button="false" />
                 </div>
                 <div class="flex items-center gap-1">
                     <span class="text-[10px] text-gray-400 font-bold">Z</span>
                     <NInputNumber size="tiny" :value="selectedElement.z || 0" :step="0.01" :min="-2" :max="2" :precision="2" @update:value="v => updateElementZ(v)" class="w-16" :show-button="false" />
                 </div>
             </div>
        </div>
      </div>
    </div>

    <!-- Footer: Weapon Name + Wear Slider + Save -->
    <div class="flex items-center justify-between mt-4 px-4 w-full">
      <!-- Left: Weapon Name -->
      <div class="w-1/4">
        <h3 class="text-lg font-bold text-white truncate">
          {{ props.weaponSkin?.name }}
        </h3>
        <p class="text-xs text-gray-400">{{ t('modals.weaponSkin.visualCustomizer.inline.title') }}</p>
      </div>

      <!-- Center: Wear Slider -->
      <div class="flex-1 max-w-lg mx-8">
        <WearSlider
          v-model="currentWear"
          :min="props.minWear || 0"
          :max="props.maxWear || 1"
          @update:model-value="handleWearUpdate"
        />
      </div>

      <!-- Right: Save Button -->
      <div class="w-1/4 flex justify-end">
        <NButton type="success" secondary class="w-32" @click="handleSave">
          {{ t('modals.weaponSkin.buttons.save') }}
        </NButton>
      </div>
    </div>
  </div>
</template>

<style scoped>
.canvas-container {
  box-shadow: inset 0 0 20px rgba(0,0,0,0.5);
  border: 1px solid rgba(255,255,255,0.05);
}
</style>
