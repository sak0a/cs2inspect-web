<script setup lang="ts">
import type { VisualCustomizerProps, CanvasElement, CanvasState } from '~/types/canvas'
import type { StickerConfiguration, KeychainConfiguration } from '~/types'
import {
    stickerToCanvasElement,
    keychainToCanvasElement,
    canvasElementToKeychain,
    canvasElementToSticker,
    generateFlatImageUrl,
    generateFallbackWeaponImageUrl,
    generateDefaultFlatImageUrl,
    getDefaultStickerPosition,
    createCoordinateTransform,
    getExternalNormalizationRefs,
    getWeaponAssetSizes,
    generateStickerImageUrl,
    getDefaultKeychainPosition,
    WEAPON_RESOLUTION_REFS,
    RESOLUTION_OVERRIDES,
} from '~/utils/canvasCoordinates'

/**
 * Updates an element's position in the canvas state
 */
const setElementPosition = (elementId: string, x: number, y: number) => {
    const el = canvasState.value.elements.find((e) => e.id === elementId)
    if (el) {
        el.position = { x, y }
    }
}

// Interface for inline customizer events (based on plan)
interface InlineVisualCustomizerEvents {
    (e: 'update-stickers', stickers: Array<StickerConfiguration | null>): void
    (e: 'update-keychain', keychain: KeychainConfiguration | null): void
    (e: 'update-wear' | 'select-sticker-slot' | 'open-sticker-modal', value: number): void
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
    isEditing: true,
})

// Current weapon wear value
const currentWear = ref(0)
const isVideoMode = ref(false)
const videoUrl = ref('')
const isVideoLoading = ref(false)

// Coordinates
const coordinateTransform = createCoordinateTransform()
const backgroundDrawRect = ref<{ x: number; y: number; width: number; height: number }>({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
})
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

// Image cache with LRU eviction
const IMAGE_CACHE_MAX = 50
const imageCache = new Map<string, HTMLImageElement>()
const evictOldestCacheEntry = () => {
    if (imageCache.size > IMAGE_CACHE_MAX) {
        const firstKey = imageCache.keys().next().value
        if (firstKey) imageCache.delete(firstKey)
    }
}

// Quick Settings State (Phase 5)
const showQuickSettings = ref(false)
const quickSettingsPosition = ref({ x: 0, y: 0 })

// --- Helpers ---

const _debugLog = (...args: unknown[]) => {
    if (isDevelopment) console.log(...args)
}
const _debugWarn = (...args: unknown[]) => {
    if (isDevelopment) console.warn(...args)
}

// Calibration State (Dev Mode Only)
const calibration = reactive({
    active: false,
    scaleX: 1.0,
    scaleY: 1.0,
    offsetX: 0,
    offsetY: 0,
    currentResolution: '',
})

const isFullscreen = ref(false)

const copyCalibrationConfig = () => {
    const config = `'${calibration.currentResolution}': { scaleX: ${calibration.scaleX}, scaleY: ${calibration.scaleY}, offsetX: ${calibration.offsetX}, offsetY: ${calibration.offsetY} }`
    window.navigator.clipboard
        .writeText(config)
        .then(() => {
            message.success('Config copied to clipboard')
        })
        .catch((err) => {
            _debugWarn('Failed to copy', err)
            message.error('Failed to copy config')
        })
}

const copySelectedElementPosition = () => {
    const p = selectedElement.value?.position
    if (!p) return
    const str = `{ x: ${p.x.toFixed(4)}, y: ${p.y.toFixed(4)} }, // slot ${selectedElement.value?.slotIndex ?? '?'}`
    window.navigator.clipboard.writeText(str)
    message.success('Pos copied!')
}

const normalizedToCanvasInImage = (p: { x: number; y: number }) => {
    const r = backgroundDrawRect.value
    if (r.width > 0 && r.height > 0) {
        let nx = p.x
        let ny = p.y

        if (videoManager.value && props.weaponSkin) {
            const meta = videoManager.value.getMetadata()
            const rawName = props.weaponSkin.name.split(' | ')[0]
            const weaponName = rawName ? rawName.toLowerCase().trim().replace('weapon_', '') : ''
            const ref = WEAPON_RESOLUTION_REFS[weaponName]

            if (ref && meta.width > 0 && meta.height > 0) {
                const resKey = `${meta.width}x${meta.height}`

                // Use calibration values if active, otherwise check overrides
                let scaleX = 1,
                    scaleY = 1,
                    offX = 0,
                    offY = 0

                if (calibration.active && calibration.currentResolution === resKey) {
                    scaleX = calibration.scaleX
                    scaleY = calibration.scaleY
                    offX = calibration.offsetX
                    offY = calibration.offsetY
                } else if (
                    RESOLUTION_OVERRIDES[weaponName] &&
                    RESOLUTION_OVERRIDES[weaponName][resKey]
                ) {
                    const ov = RESOLUTION_OVERRIDES[weaponName][resKey]
                    scaleX = ov.scaleX
                    scaleY = ov.scaleY
                    offX = ov.offsetX
                    offY = ov.offsetY
                } else if (meta.width !== ref.width || meta.height !== ref.height) {
                    // Default auto-scale theory (fallback if no override)
                    // scaleX = ref.width / meta.width
                    // scaleY = ref.height / meta.height
                    // Intentionally disabled in favor of manual calibration for now to avoid bad guesses
                }

                // Apply Transform:
                // Convert Normalized -> Reference Pixels -> Apply Scale/Offset -> Current Pixels -> Current Normalized

                // 1. Normalized to Reference Pixels (centered relative to 0.5)
                const refPxX = (p.x - 0.5) * ref.width
                const refPxY = (p.y - 0.5) * ref.height

                // 2. Apply Calibration Scale & Offset
                // "Scale" here implies stretching the reference plane to fit the current view
                // If scale > 1, the reference plane is larger (sticker moves out)
                const _adjPxX = refPxX * scaleX + offX
                const _adjPxY = refPxY * scaleY + offY

                // 3. Convert to Current Pixels (relative to center)
                // Current Pixels = Reference Pixels mapped to current resolution
                // Wait, simpler model:
                // We want to map p -> p_new.
                // Center (0.5) maps to Center (0.5) + Offset (normalized?)

                // Let's stick to the pixel math derived from the approved plan:
                // nx_px = (nx * REF_WIDTH * ScaleX) + OffsetX  (This assumes top-left origin, maybe center is safer?)

                // IMPLEMENTATION: Center-based
                // Goal: Map Normalized Coord P to Normalized Coord P'

                // P_ref_px = p.x * ref.width
                // P_target_px = (P_ref_px * scaleX) + offX
                // P_final_norm = P_target_px / current.width

                // But we want to preserve center.
                // Center Ref = ref.width / 2
                // Point relative to center: (p.x - 0.5) * ref.width

                // Adjusted point relative to center in Target:
                // ((p.x - 0.5) * ref.width * scaleX) + offX

                // Final Normalized:
                // new_x = 0.5 + ( ((p.x - 0.5) * ref.width * scaleX) + offX ) / meta.width

                nx = 0.5 + ((p.x - 0.5) * ref.width * scaleX + offX) / meta.width
                ny = 0.5 + ((p.y - 0.5) * ref.height * scaleY + offY) / meta.height
            }
        }

        return { x: r.x + nx * r.width, y: r.y + ny * r.height }
    }
    return coordinateTransform.normalizedToCanvas(p, canvasState.value.canvasSize)
}

const canvasToNormalizedInImage = (pt: { x: number; y: number }) => {
    const r = backgroundDrawRect.value
    if (r.width > 0 && r.height > 0) {
        const nx = (pt.x - r.x) / r.width
        const ny = (pt.y - r.y) / r.height
        // Relaxed bounds: Allow dragging outside the video rect
        return { x: nx, y: ny }
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
        y: (dy / r.height) * (REF_HEIGHT / (extYRef.value || 1)),
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
    const def =
        el.type === 'sticker'
            ? getStickerDefaultCanvasPos(el)
            : normalizedToCanvasInImage(el.position)
    const curExt = getElementOffsetExternalNorm(el)
    const targetExt = { x: axis === 'x' ? v : curExt.x, y: axis === 'y' ? v : curExt.y }
    const dx = (targetExt.x * r.width * (extXRef.value || 1)) / REF_WIDTH
    const dy = (targetExt.y * r.height * (extYRef.value || 1)) / REF_HEIGHT
    const targetCanvas = { x: def.x + dx, y: def.y + dy }
    el.position = canvasToNormalizedInImage(targetCanvas)
    renderCanvas()
}

const updateElementPosition = (axis: 'x' | 'y', value: number | null) => {
    if (!selectedElement.value || value === null) return
    if (axis === 'x') selectedElement.value.position.x = value
    if (axis === 'y') selectedElement.value.position.y = value
    renderCanvas()
}

const updateElementZ = (value: number | null) => {
    if (!selectedElement.value || value === null) return
    selectedElement.value.z = value
    renderCanvas()
}

// --- Image Loading ---

const toCanvasSafeUrl = (url: string) => {
    try {
        if (!url) {
            _debugWarn('toCanvasSafeUrl: Empty URL')
            return ''
        }

        const u = new URL(url, window.location.origin)

        // Allow same-origin requests
        if (u.origin === window.location.origin) return u.toString()

        // Allow assets server by hostname check (not string includes, to prevent spoofing)
        if (u.hostname === 'assets.cu.sakoa.xyz') return u.toString()

        // Check if it's the assets server via runtime config
        try {
            const config = useRuntimeConfig()
            const assetsUrl = config.public.assetsUrl as string
            if (assetsUrl && u.origin === new URL(assetsUrl).origin) {
                return u.toString()
            }
        } catch {
            // ignore
        }

        // Proxy other external images (e.g. Steam community images) to avoid CORS issues on canvas
        if (u.protocol === 'http:' || u.protocol === 'https:') {
            return `/api/proxy/image?url=${encodeURIComponent(u.toString())}`
        }
        return url
    } catch (_e) {
        _debugWarn('toCanvasSafeUrl: Invalid URL', url, _e)
        return url
    }
}

const imageLoadQueue = ref<
    Array<{
        url: string
        retryCount: number
        resolve: (img: HTMLImageElement) => void
        reject: (err: unknown) => void
    }>
>([])
const activeLoadCount = ref(0)
const MAX_CONCURRENT_LOADS = 3
const MAX_RETRIES = 3
const RETRY_DELAY = 1000

const processQueue = () => {
    if (imageLoadQueue.value.length === 0 || activeLoadCount.value >= MAX_CONCURRENT_LOADS) return

    const task = imageLoadQueue.value.shift()
    if (!task) return

    activeLoadCount.value++
    const { url, retryCount, resolve, reject } = task
    const finalUrl = toCanvasSafeUrl(url)

    const img = new Image()

    // CRITICAL FIX: Do NOT set crossOrigin for our assets server.
    // The server does not send CORS headers, so asking for 'anonymous' causes the load to fail.
    // By not setting it, we get an opaque response (tainted canvas), which is fine for display.
    try {
        const parsed = new URL(finalUrl, window.location.origin)
        if (parsed.hostname !== 'assets.cu.sakoa.xyz') {
            img.crossOrigin = 'anonymous'
        }
    } catch {
        img.crossOrigin = 'anonymous'
    }

    img.onload = () => {
        activeLoadCount.value--
        imageCache.set(url, img)
        evictOldestCacheEntry()

        resolve(img)
        processQueue() // Process next
    }
    img.onerror = (_e) => {
        activeLoadCount.value--

        if (retryCount < MAX_RETRIES) {
            setTimeout(() => {
                imageLoadQueue.value.push({ url, retryCount: retryCount + 1, resolve, reject })
                processQueue()
            }, RETRY_DELAY)
        } else {
            _debugWarn(
                `[InlineVisualCustomizer] Failed to load image after ${MAX_RETRIES + 1} attempts:`,
                finalUrl
            )
            reject(new Error(`Failed to load image after ${MAX_RETRIES + 1} attempts: ${finalUrl}`))
            processQueue()
        }
    }
    img.src = finalUrl
}

const queueImageLoad = (url: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
        if (!url) {
            reject(new Error('Empty URL'))
            return
        }
        if (imageCache.has(url)) {
            const cached = imageCache.get(url)
            if (cached && cached.complete && cached.naturalWidth > 0) {
                resolve(cached)
                return
            }
        }

        // Check if already in queue to avoid duplicates?
        // Simple optimization: if already queued, don't queue again (requires tracking)
        // For now, simple queue
        imageLoadQueue.value.push({ url, retryCount: 0, resolve, reject })
        processQueue()
    })
}

// Deprecated direct load, use queue
const loadImage = (url: string) => queueImageLoad(url)

const loadAllElementImages = async () => {
    const elementsToLoad = canvasState.value.elements.filter(
        (el) => el.apiData?.image && !imageCache.has(el.apiData.image)
    )

    const promises = elementsToLoad.map((el) => {
        if (!el.apiData?.image) return Promise.resolve()
        return queueImageLoad(el.apiData.image)
            .then(() => {
                renderCanvas() // Re-render when an image loads
            })
            .catch((err) => _debugWarn(`[InlineVisualCustomizer] Element image failed:`, err))
    })
    await Promise.allSettled(promises)
}

// --- Computed ---

const selectedElement = computed(() => {
    return canvasState.value.elements.find((el) => el.id === canvasState.value.selectedElementId)
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
        height: containerRect.height || 600, // Fallback height
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
    if (!props.weaponSkin || !video.value || !ctx.value) {
        _debugWarn('[InlineVisualCustomizer] Missing props or refs', {
            skin: !!props.weaponSkin,
            video: !!video.value,
            ctx: !!ctx.value,
        })
        return
    }

    // Default skin (paintindex=0): skip video, use flat PNG directly
    if (props.weaponSkin.paintindex === 0) {
        isVideoMode.value = false
        isVideoLoading.value = false
        const weaponName = props.weaponSkin.name.split(' | ')[0] || 'weapon'
        const flatUrl = generateDefaultFlatImageUrl(weaponName)
        canvasState.value.weaponImage = flatUrl
        try {
            await loadImage(flatUrl)
        } catch (e) {
            _debugWarn('[InlineVisualCustomizer] Default flat image load failed', e)
        }
        renderCanvas()
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
                videoDuration: 140,
            })
            videoManager.value.setRenderCallback(() => drawElements())
            await videoManager.value.loadVideo(videoUrl.value)
            canvasState.value.weaponImage = ''
            isVideoMode.value = true
            videoReady = true

            // Update calibration resolution
            if (isDevelopment && videoManager.value) {
                const meta = videoManager.value.getMetadata()
                calibration.currentResolution = `${meta.width}x${meta.height}`

                // Auto-load override if exists
                const rawName = props.weaponSkin.name.split(' | ')[0]
                const weaponName = rawName
                    ? rawName.toLowerCase().trim().replace('weapon_', '')
                    : ''
                const weaponOverrides = RESOLUTION_OVERRIDES[weaponName]
                if (weaponOverrides) {
                    const ov = weaponOverrides[calibration.currentResolution]
                    if (ov) {
                        calibration.scaleX = ov.scaleX
                        calibration.scaleY = ov.scaleY
                        calibration.offsetX = ov.offsetX
                        calibration.offsetY = ov.offsetY
                    }
                }
            }
        }
    } catch (e) {
        _debugWarn('[InlineVisualCustomizer] Video initialization failed', e)
        videoReady = false
    }

    // Fallback to static image
    if (!videoReady) {
        isVideoMode.value = false

        const imageUrl = props.weaponSkin.image
        if (imageUrl) {
            canvasState.value.weaponImage = imageUrl
            try {
                await loadImage(imageUrl)
            } catch (e) {
                _debugWarn('[InlineVisualCustomizer] Static image load failed', e)
            }
            renderCanvas()
        } else {
            _debugWarn('[InlineVisualCustomizer] No static image available')
        }
    }
    isVideoLoading.value = false
}
const _initializeStaticBackground = () => {
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
            if (element) {
                _debugLog(`[InlineVisualCustomizer] Converted sticker ${index}:`, {
                    id: element.assetId,
                    imageUrl: element.apiData?.image,
                    wear: element.wear,
                })
                elements.push(element)
            }
        }
    })
    // Convert keychain
    if (props.keychain) {
        const kc = keychainToCanvasElement(props.keychain, 10, weaponName)
        if (kc) {
            // If we have an existing keychain in state (from internal editing), preserve its state if IDs match
            const existing = canvasState.value.elements.find((e) => e.type === 'keychain')
            if (existing && existing.assetId === kc.assetId && canvasState.value.isEditing) {
                // Keep existing position/scale/rotation if we are currently editing
                // BUT only if not explicitly triggered by external prop change?
                // Actually, if props change, we should probably reset unless we are the source of the change.
                // For now, let's assume props are truth.
                elements.push(kc)
            } else {
                elements.push(kc)
            }
        }
    }
    canvasState.value.elements = elements
    loadAllElementImages()
}

watch(
    () => [props.stickers, props.keychain],
    () => {
        convertExistingCustomizations()
        renderCanvas()
    },
    { deep: true }
)

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
        drawElements()
    } else {
        renderStaticBackground()
    }

    // Debug Overlay
    if (isDevelopment && showCoordinateOverlay.value) {
        drawCoordinateOverlay()
    }
}

const drawImageWithAspectRatio = (
    img: HTMLImageElement,
    ctx: CanvasRenderingContext2D,
    canvasWidth: number,
    canvasHeight: number
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
    ctx.fillStyle = '#1a1a1a'
    ctx.fillRect(0, 0, canvasWidth, canvasHeight)
    ctx.drawImage(img, dx, dy, dw, dh)
}

const renderStaticBackground = () => {
    if (!ctx.value || !canvas.value) return
    ctx.value.clearRect(0, 0, canvas.value.width, canvas.value.height)
    if (canvasState.value.weaponImage) {
        const img = new Image()
        img.onload = () => {
            if (ctx.value && canvas.value) {
                drawImageWithAspectRatio(img, ctx.value, canvas.value.width, canvas.value.height)
                drawElements()
            }
        }
        img.onerror = (e) => {
            _debugWarn('[InlineVisualCustomizer] Error drawing static background image', e)
            // Fallback logic
            const fallbackImg = new Image()
            fallbackImg.onload = () => {
                if (ctx.value && canvas.value) {
                    drawImageWithAspectRatio(
                        fallbackImg,
                        ctx.value,
                        canvas.value.width,
                        canvas.value.height
                    )
                    drawElements()
                }
            }
            fallbackImg.onerror = () => {
                if (ctx.value) {
                    ctx.value.fillStyle = '#2a2a2a'
                    ctx.value.fillRect(0, 0, canvas.value!.width, canvas.value!.height)
                }
                backgroundDrawRect.value = {
                    x: 0,
                    y: 0,
                    width: canvas.value!.width,
                    height: canvas.value!.height,
                }
                drawElements()
            }
            fallbackImg.src = generateFallbackWeaponImageUrl(
                props.weaponSkin?.name.split(' | ')[0] || 'ak-47'
            )
        }
        img.src = canvasState.value.weaponImage
    } else {
        backgroundDrawRect.value = {
            x: 0,
            y: 0,
            width: canvas.value!.width,
            height: canvas.value!.height,
        }
        drawElements()
    }
}

const drawElements = () => {
    if (!ctx.value) return
    drawSlotIndicators()
    const sorted = [...canvasState.value.elements].sort((a, b) => a.zIndex - b.zIndex)
    sorted.forEach((el) => drawElement(el))
}

const drawSlotIndicators = () => {
    if (!ctx.value) return
    const accent =
        getComputedStyle(document.documentElement).getPropertyValue('--selection-ring').trim() ||
        '#FACC15'
    const occupiedSlots = new Set(
        canvasState.value.elements.filter((el) => el.type === 'sticker').map((el) => el.slotIndex)
    )

    for (let slot = 0; slot < 5; slot++) {
        if (!occupiedSlots.has(slot)) {
            const weaponName = props.weaponSkin?.name.split(' | ')[0] || 'unknown'
            const slotPos = getDefaultStickerPosition(slot, weaponName)
            const pos = normalizedToCanvasInImage(slotPos)

            ctx.value.save()
            ctx.value.globalAlpha = 0.9
            ctx.value.lineWidth = 2
            ctx.value.strokeStyle = accent
            ctx.value.fillStyle = 'rgba(0,0,0,0.30)'
            ctx.value.setLineDash([6, 4])
            ctx.value.shadowColor = 'rgba(0,0,0,0.55)'
            ctx.value.shadowBlur = 8

            ctx.value.beginPath()
            ctx.value.arc(pos.x, pos.y, 20, 0, 2 * Math.PI)
            ctx.value.fill()
            ctx.value.stroke()

            ctx.value.shadowColor = 'transparent'
            ctx.value.setLineDash([])
            ctx.value.fillStyle = '#FFFFFF'
            ctx.value.font = '500 12px sans-serif'
            ctx.value.textAlign = 'center'
            ctx.value.textBaseline = 'middle'
            ctx.value.fillText((slot + 1).toString(), pos.x, pos.y)
            ctx.value.restore()
        }
    }
    // Keychain indicator
    if (!canvasState.value.elements.some((el) => el.type === 'keychain')) {
        const pos = normalizedToCanvasInImage(DEFAULT_KEYCHAIN_POSITION)
        ctx.value.save()
        ctx.value.globalAlpha = 0.9
        ctx.value.lineWidth = 2
        ctx.value.strokeStyle = accent
        ctx.value.fillStyle = 'rgba(0,0,0,0.30)'
        ctx.value.setLineDash([6, 4])
        ctx.value.shadowColor = 'rgba(0,0,0,0.55)'
        ctx.value.shadowBlur = 8

        ctx.value.beginPath()
        ctx.value.arc(pos.x, pos.y, 20, 0, 2 * Math.PI)
        ctx.value.fill()
        ctx.value.stroke()

        ctx.value.shadowColor = 'transparent'
        ctx.value.setLineDash([])
        ctx.value.fillStyle = '#FFFFFF'
        ctx.value.font = '500 12px sans-serif'
        ctx.value.textAlign = 'center'
        ctx.value.textBaseline = 'middle'
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
    ctx.value.fillText(
        `Mouse: (${mousePosition.value.x}, ${mousePosition.value.y})`,
        10,
        canvas.value.height - 40
    )
    ctx.value.fillText(
        'Coordinate Overlay Active - Hover to see positions',
        10,
        canvas.value.height - 20
    )

    ctx.value.restore()
}

// Calculate global scale factor relative to standard design width (1120px)
// This ensures stickers grow/shrink with the weapon image vs remaining fixed size
const getGlobalScaleFactor = () => {
    const STANDARD_DESIGN_WIDTH = 1120
    if (backgroundDrawRect.value.width > 0) {
        return backgroundDrawRect.value.width / STANDARD_DESIGN_WIDTH
    }
    return 1
}

const drawElement = (element: CanvasElement) => {
    if (!ctx.value) return
    const pos = normalizedToCanvasInImage(element.position)
    const globalScale = getGlobalScaleFactor()

    ctx.value.save()
    ctx.value.translate(pos.x, pos.y)
    ctx.value.rotate((element.rotation * Math.PI) / 180)
    ctx.value.scale(element.scale, element.scale)

    // Scale the base size by global scale
    const size = 100 * element.scale * globalScale // Just for placeholder box

    // Selection ring logic
    const drawSelection = (bounds?: { width: number; height: number }) => {
        if (element.selected) {
            // Use exact same logic from modal
            const accent =
                getComputedStyle(document.documentElement)
                    .getPropertyValue('--selection-ring')
                    .trim() || '#FACC15'
            ctx.value!.strokeStyle = accent
            const invScale = 1 / Math.max(0.1, element.scale || 1)
            // Scale UI elements inversely to global scale to keep them crisp/constant size?
            // Actually ring should probably scale with object.

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
                [-w / 2 - ringPadding, h / 2 + ringPadding],
            ]
            ctx.value!.fillStyle = accent
            corners.forEach((corner) => {
                const cx = corner[0]
                const cy = corner[1]
                ctx.value!.fillRect(
                    cx - handleSize / 2,
                    cy - handleSize / 2,
                    handleSize,
                    handleSize
                )
            })
        }
    }

    if (element.apiData?.image) {
        const cachedImg = imageCache.get(element.apiData.image)
        if (cachedImg && cachedImg.complete && cachedImg.naturalWidth > 0) {
            // APPLY GLOBAL SCALE to max dimensions
            const maxW = STICKER_MAX_WIDTH_PX.value * globalScale
            const maxH = STICKER_MAX_HEIGHT_PX.value * globalScale

            const widthScale = maxW / cachedImg.naturalWidth
            const heightScale = maxH / cachedImg.naturalHeight
            const _baseScale = Math.min(widthScale, heightScale, 1) // Allow upscaling? maybe remove ,1 if we want strict fit

            // Should usually just strict fit to box
            const fitScale = Math.min(maxW / cachedImg.naturalWidth, maxH / cachedImg.naturalHeight)

            const baseWidth = cachedImg.naturalWidth * fitScale
            const baseHeight = cachedImg.naturalHeight * fitScale

            // Draw width already includes global scale via baseWidth
            const drawWidth = baseWidth * element.scale
            const drawHeight = baseHeight * element.scale

            ctx.value.drawImage(cachedImg, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight)
            drawSelection({ width: drawWidth, height: drawHeight })
        } else {
            // Image not loaded yet - handled by loadAllElementImages watcher
            ctx.value!.fillStyle = element.type === 'sticker' ? '#FF6B6B' : '#4ECDC4'
            // Use scaled placeholder size
            const placeholderSize = 100 * element.scale * globalScale
            ctx.value!.fillRect(
                -placeholderSize / 2,
                -placeholderSize / 2,
                placeholderSize,
                placeholderSize
            )
            drawSelection({ width: placeholderSize, height: placeholderSize })
        }
    } else {
        ctx.value!.fillStyle = element.type === 'sticker' ? '#FF6B6B' : '#4ECDC4'
        const placeholderSize = 100 * element.scale * globalScale
        ctx.value!.fillRect(
            -placeholderSize / 2,
            -placeholderSize / 2,
            placeholderSize,
            placeholderSize
        )
        drawSelection({ width: placeholderSize, height: placeholderSize })
    }
    ctx.value.restore()
}

// --- Interaction ---

const findElementAtPosition = (canvasPos: { x: number; y: number }) => {
    const sorted = [...canvasState.value.elements].sort((a, b) => b.zIndex - a.zIndex)
    const globalScale = getGlobalScaleFactor()

    for (const element of sorted) {
        const pos = normalizedToCanvasInImage(element.position)
        let bounds
        if (element.apiData?.image) {
            const cachedImg = imageCache.get(element.apiData.image)
            if (cachedImg && cachedImg.complete && cachedImg.naturalWidth > 0) {
                // Apply Global Scale to hit detection too
                const maxW = STICKER_MAX_WIDTH_PX.value * globalScale
                const maxH = STICKER_MAX_HEIGHT_PX.value * globalScale

                const fitScale = Math.min(
                    maxW / cachedImg.naturalWidth,
                    maxH / cachedImg.naturalHeight
                )

                const baseWidth = cachedImg.naturalWidth * fitScale
                const baseHeight = cachedImg.naturalHeight * fitScale
                const drawWidth = baseWidth * element.scale
                const drawHeight = baseHeight * element.scale
                bounds = {
                    left: pos.x - drawWidth / 2,
                    right: pos.x + drawWidth / 2,
                    top: pos.y - drawHeight / 2,
                    bottom: pos.y + drawHeight / 2,
                }
            } else {
                // Fallback with global scale
                const fallbackWidth =
                    (element.type === 'sticker'
                        ? STICKER_MAX_WIDTH_PX.value
                        : KEYCHAIN_MAX_WIDTH_PX.value) *
                    element.scale *
                    globalScale
                const fallbackHeight =
                    (element.type === 'sticker'
                        ? STICKER_MAX_HEIGHT_PX.value
                        : KEYCHAIN_MAX_HEIGHT_PX.value) *
                    element.scale *
                    globalScale
                bounds = {
                    left: pos.x - fallbackWidth / 2,
                    right: pos.x + fallbackWidth / 2,
                    top: pos.y - fallbackHeight / 2,
                    bottom: pos.y + fallbackHeight / 2,
                }
            }
        } else {
            const fallbackWidth =
                (element.type === 'sticker'
                    ? STICKER_MAX_WIDTH_PX.value
                    : KEYCHAIN_MAX_WIDTH_PX.value) *
                element.scale *
                globalScale
            const fallbackHeight =
                (element.type === 'sticker'
                    ? STICKER_MAX_HEIGHT_PX.value
                    : KEYCHAIN_MAX_HEIGHT_PX.value) *
                element.scale *
                globalScale
            bounds = {
                left: pos.x - fallbackWidth / 2,
                right: pos.x + fallbackWidth / 2,
                top: pos.y - fallbackHeight / 2,
                bottom: pos.y + fallbackHeight / 2,
            }
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

const selectElement = (elementId: string | null) => {
    canvasState.value.elements.forEach((el) => (el.selected = el.id === elementId))
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
                if (
                    canvasState.value.elements.some(
                        (element) => element.type === 'sticker' && element.slotIndex === i
                    )
                )
                    continue

                const defaultPos = getDefaultStickerPosition(i, props.weaponSkin.name)
                const canvasSlotPos = normalizedToCanvasInImage(defaultPos)

                // Calculate distance (hit radius approx 40px)
                const dx = canvasPos.x - canvasSlotPos.x
                const dy = canvasPos.y - canvasSlotPos.y
                const dist = Math.sqrt(dx * dx + dy * dy)

                if (dist < 40) {
                    // Hit radius
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
    const canvasPos = {
        x: Math.round(event.clientX - rect.left),
        y: Math.round(event.clientY - rect.top),
    }

    // Update mouse position for debug overlay
    if (isDevelopment) {
        mousePosition.value = canvasPos
        if (showCoordinateOverlay.value) renderCanvas()
    }

    if (!canvasState.value.isDragging || !selectedElement.value) return
    event.preventDefault()

    const normalizedPos = canvasToNormalizedInImage(canvasPos)
    // Relaxed bounds: Allow placing anywhere (even outside 0-1 range)
    // if (coordinateTransform.validateCoordinates(normalizedPos)) {
    setElementPosition(selectedElement.value.id, normalizedPos.x, normalizedPos.y)
    renderCanvas()
    // }
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

const handleKeyDown = (e: KeyboardEvent) => {
    if (!selectedElement.value) return

    let dx = 0
    let dy = 0
    // Base step size (0.0005 for precision, 0.005 for shift)
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

    const current = selectedElement.value.position
    // Use the existing validation logic via the setter helper to ensure bounds
    const p = { x: current.x + dx, y: current.y + dy }

    // Check bounds (Relaxed)
    // if (p.x >= 0 && p.x <= 1 && p.y >= 0 && p.y <= 1) {
    setElementPosition(selectedElement.value.id, p.x, p.y)
    renderCanvas()
    // }
}

const handleSave = (arg: boolean | MouseEvent = false) => {
    const silent = typeof arg === 'boolean' ? arg : false
    // Convert elements back to format for emit
    const stickers: Array<StickerConfiguration | null> = new Array(5).fill(null)
    let keychain: KeychainConfiguration | null = null
    const weaponName = props.weaponSkin?.name.split(' | ')[0] || 'unknown'

    canvasState.value.elements.forEach((element) => {
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
    canvasState.value.elements = canvasState.value.elements.filter((el) => el.id !== idToRemove)
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

    // Update the image based on the new wear value
    if (selectedElement.value.assetId) {
        const newImage = generateStickerImageUrl(selectedElement.value.assetId, wear)
        // Update apiData so it persists
        if (selectedElement.value.apiData) {
            // Only trigger reload if URL changed
            if (selectedElement.value.apiData.image !== newImage) {
                selectedElement.value.apiData.image = newImage

                queueImageLoad(newImage).then(() => {
                    renderCanvas()
                })
            }
        }
    }

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

// Helper: Get Keychain offset relative to default
const getKeychainRelativePos = (axis: 'x' | 'y') => {
    if (!selectedElement.value || selectedElement.value.type !== 'keychain') return 0
    const weaponName = props.weaponSkin?.name.split(' | ')[0] || 'awp'
    const def = getDefaultKeychainPosition(weaponName)
    const current = selectedElement.value.position[axis]
    return current - def[axis]
}

const updateKeychainRelativePos = (axis: 'x' | 'y', val: number) => {
    if (!selectedElement.value || selectedElement.value.type !== 'keychain') return
    const weaponName = props.weaponSkin?.name.split(' | ')[0] || 'awp'
    const def = getDefaultKeychainPosition(weaponName)

    // New absolute = default + relative offset
    const newAbs = def[axis] + val
    updateElementPosition(axis, newAbs)
}

// Watchers
watch(
    calibration,
    () => {
        if (isDevelopment && calibration.active) {
            renderCanvas()
        }
    },
    { deep: true }
)

watch(
    () => props.stickers,
    () => convertExistingCustomizations(),
    { deep: true }
)
watch(
    () => props.keychain,
    () => convertExistingCustomizations()
)

onMounted(() => {
    initializeCanvas()
    window.addEventListener('resize', handleResize)
    window.addEventListener('keydown', handleKeyDown)
    setTimeout(() => forceVideoLoad(), 500)
})

onUnmounted(() => {
    handleSave(true) // Auto-save on exit
    window.removeEventListener('resize', handleResize)
    window.removeEventListener('keydown', handleKeyDown)
    if (video.value) {
        video.value.pause()
        video.value.removeAttribute('src')
        video.value.load() // Release network resources
    }
    if (videoManager.value) {
        videoManager.value.destroy()
        videoManager.value = null
    }
    imageCache.clear()
})

// Expose refreshCanvas for parent
defineExpose({
    refreshCanvas: () => {
        convertExistingCustomizations()
        renderCanvas()
    },
    save: () => handleSave(true),
})
</script>

<template>
    <div class="inline-visual-customizer flex flex-col items-center">
        <!-- Full-width Canvas Container -->
        <div
            ref="canvasContainer"
            class="canvas-container w-full relative bg-[var(--bg-dark)] rounded-lg overflow-hidden"
            :class="{ 'fixed inset-0 z-[9999] h-screen w-screen rounded-none': isFullscreen }"
            :style="!isFullscreen ? { height: '700px' } : {}"
        >
            <video ref="video" crossorigin="anonymous" playsinline style="display: none" />
            <canvas
                ref="canvas"
                class="w-full h-full cursor-crosshair select-none touch-none"
                @mousedown="handleCanvasMouseDown"
                @mousemove="handleCanvasMouseMove"
                @mouseup="handleCanvasMouseUp"
                @mouseleave="handleCanvasMouseUp"
            />
            <!-- Loading indicator -->
            <div
                v-if="isVideoLoading"
                class="absolute inset-0 flex items-center justify-center bg-black/50 pointer-events-none"
            >
                <div
                    class="animate-spin rounded-full h-12 w-12 border-4 border-[var(--selection-ring)] border-t-transparent"
                />
            </div>

            <!-- Debug Toggle (Dev only) -->
            <div
                v-if="isDevelopment"
                class="absolute top-2 right-2 z-50 flex flex-col gap-2 items-end"
            >
                <!-- Fullscreen Toggle -->
                <NButton
                    size="tiny"
                    secondary
                    circle
                    :type="isFullscreen ? 'primary' : 'default'"
                    class="opacity-50 hover:opacity-100 transition-opacity"
                    title="Toggle Fullscreen"
                    @click="
                        () => {
                            isFullscreen = !isFullscreen
                            nextTick(handleResize)
                        }
                    "
                >
                    <template #icon>
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                        >
                            <path
                                fill="currentColor"
                                d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"
                            />
                        </svg>
                    </template>
                </NButton>

                <NButton
                    size="tiny"
                    secondary
                    circle
                    :type="showCoordinateOverlay ? 'primary' : 'default'"
                    class="opacity-50 hover:opacity-100 transition-opacity"
                    title="Toggle Debug Overlay"
                    @click="showCoordinateOverlay = !showCoordinateOverlay"
                >
                    <template #icon>
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                        >
                            <path
                                fill="currentColor"
                                d="M9 3L5 6.99h3V14h2V6.99h3L9 3zm7 14.01V10h-2v7.01h-3L15 21l4-3.99h-3z"
                            />
                        </svg>
                    </template>
                </NButton>

                <!-- Calibration Toggle -->
                <NButton
                    size="tiny"
                    secondary
                    circle
                    :type="calibration.active ? 'warning' : 'default'"
                    class="opacity-50 hover:opacity-100 transition-opacity"
                    title="Toggle Calibration UI"
                    @click="calibration.active = !calibration.active"
                >
                    <template #icon>
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                        >
                            <path
                                fill="currentColor"
                                d="M3 17v2h6v-2H3M3 5v2h10V5H3m10 16v-2h8v-2h-8v-2h-2v6h2M7 9v2H3v2h4v2h2V9H7m14 4v-2H11v2h10m-6-4h2V7h4V5h-4V3h-2v6z"
                            />
                        </svg>
                    </template>
                </NButton>

                <!-- Calibration Panel -->
                <div
                    v-if="calibration.active"
                    class="bg-black/80 backdrop-blur-md border border-white/10 p-3 rounded-lg w-64 text-xs"
                >
                    <div class="flex justify-between items-center mb-2">
                        <span class="font-bold text-yellow-400">CALIBRATION</span>
                        <span class="text-gray-400">{{ calibration.currentResolution }}</span>
                    </div>

                    <div class="grid grid-cols-2 gap-2 mb-2">
                        <div>
                            <span class="text-gray-500 block mb-1">Scale X</span>
                            <NInputNumber
                                v-model:value="calibration.scaleX"
                                size="tiny"
                                :step="0.001"
                                :precision="4"
                                :show-button="false"
                            />
                        </div>
                        <div>
                            <span class="text-gray-500 block mb-1">Scale Y</span>
                            <NInputNumber
                                v-model:value="calibration.scaleY"
                                size="tiny"
                                :step="0.001"
                                :precision="4"
                                :show-button="false"
                            />
                        </div>
                        <div>
                            <span class="text-gray-500 block mb-1">Offset X</span>
                            <NInputNumber
                                v-model:value="calibration.offsetX"
                                size="tiny"
                                :step="1"
                                :precision="0"
                                :show-button="false"
                            />
                        </div>
                        <div>
                            <span class="text-gray-500 block mb-1">Offset Y</span>
                            <NInputNumber
                                v-model:value="calibration.offsetY"
                                size="tiny"
                                :step="1"
                                :precision="0"
                                :show-button="false"
                            />
                        </div>
                    </div>

                    <NButton size="tiny" block secondary type="info" @click="copyCalibrationConfig">
                        Copy Config
                    </NButton>
                </div>
            </div>

            <!-- Phase 5 Quick Settings (Moved to footer) -->
        </div>

        <!-- Footer: Controls + Wear Slider + Save -->
        <div class="flex items-center justify-between mt-4 px-4 w-full gap-4">
            <!-- Left: Controls Panel (Replaces Weapon Name) -->
            <!-- Use flex-none to fit content, max-w-[70%] to prevent pushing slider too much -->
            <div class="flex-none flex items-center p-1 max-w-[70%]">
                <div
                    v-if="selectedElement"
                    class="flex flex-col gap-1.5 bg-black/40 backdrop-blur-md border border-white/5 rounded-xl p-2 shadow-sm"
                    @mousedown.stop
                >
                    <!-- Row 1: Transform & Actions -->
                    <div class="flex items-center gap-2">
                        <span
                            class="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-px"
                            >Scale</span
                        >

                        <!-- Scale -->
                        <div class="flex items-center gap-1 border-r border-white/10 pr-2">
                            <NButton size="tiny" secondary circle @click="handleUpdateScale(-0.1)"
                                >-</NButton
                            >
                            <NInputNumber
                                :value="selectedElement.scale"
                                :min="0.1"
                                :max="3"
                                :step="0.1"
                                :precision="1"
                                size="tiny"
                                class="w-14"
                                :show-button="false"
                                @update:value="handleSetScale"
                            />
                            <NButton size="tiny" secondary circle @click="handleUpdateScale(0.1)"
                                >+</NButton
                            >
                        </div>

                        <!-- Rotation -->
                        <span
                            class="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-px"
                            >Rotation</span
                        >
                        <div class="flex items-center gap-1 border-r border-white/10 pr-2">
                            <NButton size="tiny" secondary circle @click="handleUpdateRotation(-15)"
                                >↺</NButton
                            >
                            <NInputNumber
                                :value="selectedElement.rotation"
                                :min="0"
                                :max="360"
                                :step="1"
                                :precision="0"
                                size="tiny"
                                class="w-14"
                                :show-button="false"
                                @update:value="handleSetRotation"
                            />
                            <NButton size="tiny" secondary circle @click="handleUpdateRotation(15)"
                                >↻</NButton
                            >
                        </div>

                        <!-- Wear (Sticker only) -->
                        <div
                            v-if="selectedElement.type === 'sticker'"
                            class="flex items-center gap-1 border-r border-white/10 pr-2"
                        >
                            <span class="text-[9px] text-gray-400">WEAR</span>
                            <div class="w-16 px-1">
                                <NSlider
                                    :value="selectedElement.wear || 0"
                                    :step="0.05"
                                    :min="0"
                                    :max="1"
                                    @update:value="handleUpdateStickerWear"
                                />
                            </div>
                        </div>

                        <!-- Remove -->
                        <NButton
                            type="error"
                            size="tiny"
                            secondary
                            circle
                            @click="handleRemoveSelected"
                        >
                            <template #icon>
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="12"
                                    height="12"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        fill="currentColor"
                                        d="M19 6.41L17.59 5L12 10.59L6.41 5L5 6.41L10.59 12L5 17.59L6.41 19L12 13.41L17.59 19L19 17.59L13.41 12z"
                                    />
                                </svg>
                            </template>
                        </NButton>
                    </div>

                    <!-- Row 2: Position -->
                    <div class="flex items-center gap-2">
                        <span
                            class="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-px"
                            >Position</span
                        >

                        <!-- Sticker Position -->
                        <div
                            v-if="selectedElement.type === 'sticker'"
                            class="flex items-center gap-2"
                        >
                            <!-- Units -->
                            <NSelect
                                v-model:value="offsetUnits"
                                size="tiny"
                                :options="[
                                    { label: 'PX', value: 'px' },
                                    { label: 'EXT', value: 'ext' },
                                ]"
                                class="w-14"
                            />

                            <div class="flex items-center gap-1">
                                <template v-if="offsetUnits === 'px'">
                                    <span class="text-[9px] text-gray-400">X</span>
                                    <NInputNumber
                                        size="tiny"
                                        :value="getElementOffsetCanvasPx(selectedElement).x"
                                        class="w-12"
                                        :show-button="false"
                                        placeholder="0"
                                        @update:value="(v) => updateSelectedElementOffset('x', v)"
                                    />
                                    <span class="text-[9px] text-gray-400 ml-1">Y</span>
                                    <NInputNumber
                                        size="tiny"
                                        :value="getElementOffsetCanvasPx(selectedElement).y"
                                        class="w-12"
                                        :show-button="false"
                                        placeholder="0"
                                        @update:value="(v) => updateSelectedElementOffset('y', v)"
                                    />
                                </template>
                                <template v-else>
                                    <span class="text-[9px] text-gray-400">X</span>
                                    <NInputNumber
                                        size="tiny"
                                        :value="getElementOffsetExternalNorm(selectedElement).x"
                                        :precision="4"
                                        class="w-14"
                                        :show-button="false"
                                        @update:value="
                                            (v) => updateSelectedElementOffsetExternal('x', v)
                                        "
                                    />
                                    <span class="text-[9px] text-gray-400 ml-1">Y</span>
                                    <NInputNumber
                                        size="tiny"
                                        :value="getElementOffsetExternalNorm(selectedElement).y"
                                        :precision="4"
                                        class="w-14"
                                        :show-button="false"
                                        @update:value="
                                            (v) => updateSelectedElementOffsetExternal('y', v)
                                        "
                                    />

                                    <div
                                        class="flex items-center gap-1 border-l border-white/10 pl-2 ml-1"
                                    >
                                        <span class="text-[9px] text-gray-500">REF</span>
                                        <NInputNumber
                                            v-model:value="extXRef"
                                            size="tiny"
                                            class="w-10"
                                            :show-button="false"
                                        />
                                        <NInputNumber
                                            v-model:value="extYRef"
                                            size="tiny"
                                            class="w-10"
                                            :show-button="false"
                                        />
                                    </div>
                                </template>

                                <NButton
                                    v-if="isDevelopment"
                                    size="tiny"
                                    secondary
                                    circle
                                    type="info"
                                    class="ml-1"
                                    title="Copy Position Object"
                                    @click="copySelectedElementPosition"
                                >
                                    <template #icon>
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            width="10"
                                            height="10"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                fill="currentColor"
                                                d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"
                                            />
                                        </svg>
                                    </template>
                                </NButton>
                            </div>
                        </div>

                        <!-- Keychain Position -->
                        <div
                            v-if="selectedElement.type === 'keychain'"
                            class="flex items-center gap-2"
                        >
                            <span class="text-[9px] text-gray-400">X</span>
                            <NInputNumber
                                size="tiny"
                                :value="getKeychainRelativePos('x')"
                                :step="0.01"
                                :min="-2"
                                :max="2"
                                :precision="4"
                                class="w-14"
                                :show-button="false"
                                @update:value="(v) => updateKeychainRelativePos('x', v || 0)"
                            />
                            <span class="text-[9px] text-gray-400 ml-1">Y</span>
                            <NInputNumber
                                size="tiny"
                                :value="getKeychainRelativePos('y')"
                                :step="0.01"
                                :min="-2"
                                :max="2"
                                :precision="4"
                                class="w-14"
                                :show-button="false"
                                @update:value="(v) => updateKeychainRelativePos('y', v || 0)"
                            />
                            <span class="text-[9px] text-gray-400 ml-1">Z</span>
                            <NInputNumber
                                size="tiny"
                                :value="selectedElement.z || 0"
                                :step="0.01"
                                :min="-2"
                                :max="2"
                                :precision="2"
                                class="w-12"
                                :show-button="false"
                                @update:value="(v) => updateElementZ(v || 0)"
                            />

                            <NButton
                                v-if="isDevelopment"
                                size="tiny"
                                secondary
                                circle
                                type="info"
                                class="ml-1"
                                title="Copy Position Object"
                                @click="copySelectedElementPosition"
                            >
                                <template #icon>
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="10"
                                        height="10"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            fill="currentColor"
                                            d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"
                                        />
                                    </svg>
                                </template>
                            </NButton>
                        </div>
                    </div>
                </div>
                <div v-else class="text-xs text-gray-500 italic pl-2">
                    {{
                        t(
                            'modals.weaponSkin.visualCustomizer.inline.selectHint',
                            {},
                            'Select a sticker/keychain to edit'
                        )
                    }}
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
    box-shadow: inset 0 0 20px rgba(0, 0, 0, 0.5);
    border: 1px solid rgba(255, 255, 255, 0.05);
}
</style>
