<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { NModal, NButton, NInput, NCard, NSpin, NSpace, NInputNumber, NSlider, useMessage } from 'naive-ui'
import WearSlider from '~/components/WearSlider.vue'
import type { VisualCustomizerProps, VisualCustomizerEvents, CanvasElement, CanvasState } from '~/types/canvas'
import {
  stickerToCanvasElement,
  keychainToCanvasElement,
  canvasElementToSticker,
  canvasElementToKeychain,
  generateFlatImageUrl,
  generateFallbackWeaponImageUrl,
  createCoordinateTransform,
  DEFAULT_STICKER_SLOT_POSITIONS,
  DEFAULT_KEYCHAIN_POSITION
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
  canvasSize: { width: 800, height: 600 },
  weaponImage: '',
  isDragging: false,
  isEditing: true
})

// Asset browser state
const showAssetBrowser = ref(true)
const assetSearchQuery = ref('')
const selectedAssetType = ref<'sticker' | 'keychain'>('sticker')
const availableStickers = ref<any[]>([])
const availableKeychains = ref<any[]>([])
const isLoadingAssets = ref(false)

// Property panel state
const showPropertyPanel = ref(true)

// Current weapon wear value
const currentWear = ref(0)

// Video state
const isVideoMode = ref(false)
const videoUrl = ref('')
const isVideoLoading = ref(false)

// Zoom state
const zoomLevel = ref(1)
const minZoom = 0.5
const maxZoom = 3

// Coordinate transformer
const coordinateTransform = createCoordinateTransform()

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
    initializeCanvas()
    loadAssets()
  }
})

// Initialize canvas
const initializeCanvas = async () => {
  await nextTick()

  if (!canvas.value || !canvasContainer.value || !video.value) return

  // Set canvas size to use the complete available space
  const containerRect = canvasContainer.value.getBoundingClientRect()
  const availableWidth = containerRect.width - 40 // Account for padding
  const availableHeight = containerRect.height - 40 // Account for padding

  // Ensure minimum size and use the full available space
  const canvasWidth = Math.max(800, availableWidth) // Minimum 800px width
  const canvasHeight = Math.max(600, availableHeight) // Minimum 600px height

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

  // Convert stickers - the conversion function now handles default positioning
  props.stickers.forEach((sticker, index) => {
    if (sticker) {
      const element = stickerToCanvasElement(sticker, index, 10 + index)
      if (element) {
        elements.push(element)
      }
    }
  })

  // Convert keychain - the conversion function now handles default positioning
  if (props.keychain) {
    const element = keychainToCanvasElement(props.keychain, 5)
    if (element) {
      elements.push(element)
    }
  }

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

  if (isVideoMode.value && videoManager.value) {
    // Video mode: render video frame
    videoManager.value.renderFrame()
    drawElements()
  } else {
    // Static image mode: render static background
    renderStaticBackground()
  }
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
      ctx.value?.drawImage(img, 0, 0, canvas.value!.width, canvas.value!.height)
      drawElements()
    }
    img.onerror = () => {
      // Try fallback weapon image
      const fallbackImg = new Image()
      fallbackImg.onload = () => {
        ctx.value?.drawImage(fallbackImg, 0, 0, canvas.value!.width, canvas.value!.height)
        drawElements()
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
        drawElements()
      }
      fallbackImg.src = generateFallbackWeaponImageUrl(props.weaponSkin?.name.split(' | ')[0] || 'ak-47')
    }
    img.src = canvasState.value.weaponImage
  } else {
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
      const pos = coordinateTransform.normalizedToCanvas(
        DEFAULT_STICKER_SLOT_POSITIONS[slot],
        canvasState.value.canvasSize
      )

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
    const pos = coordinateTransform.normalizedToCanvas(
      DEFAULT_KEYCHAIN_POSITION,
      canvasState.value.canvasSize
    )

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
}

// Draw individual element
const drawElement = (element: CanvasElement) => {
  if (!ctx.value) return
  
  const pos = coordinateTransform.normalizedToCanvas(element.position, canvasState.value.canvasSize)
  
  ctx.value.save()
  
  // Apply transformations
  ctx.value.translate(pos.x, pos.y)
  ctx.value.rotate((element.rotation * Math.PI) / 180)
  ctx.value.scale(element.scale, element.scale)
  
  // Draw element image with larger, more visible sizes
  const img = new Image()
  img.onload = () => {
    // Much larger sizes for better visibility and manipulation
    const baseSize = element.type === 'sticker' ? 80 : 60
    const size = baseSize * element.scale

    ctx.value?.drawImage(img, -size/2, -size/2, size, size)

    // Draw selection indicator with better visibility
    if (element.selected) {
      ctx.value!.strokeStyle = '#80E6C4'
      ctx.value!.lineWidth = 3
      ctx.value!.setLineDash([5, 5])
      ctx.value!.strokeRect(-size/2 - 4, -size/2 - 4, size + 8, size + 8)
      ctx.value!.setLineDash([]) // Reset line dash

      // Draw corner handles for resizing
      const handleSize = 8
      const corners = [
        [-size/2 - 4, -size/2 - 4], // Top-left
        [size/2 + 4, -size/2 - 4],  // Top-right
        [size/2 + 4, size/2 + 4],   // Bottom-right
        [-size/2 - 4, size/2 + 4]   // Bottom-left
      ]

      ctx.value!.fillStyle = '#80E6C4'
      corners.forEach(([x, y]) => {
        ctx.value!.fillRect(x - handleSize/2, y - handleSize/2, handleSize, handleSize)
      })
    }
  }
  img.src = element.apiData.image
  
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
  
  for (const element of sortedElements) {
    const pos = coordinateTransform.normalizedToCanvas(element.position, canvasState.value.canvasSize)
    const baseSize = element.type === 'sticker' ? 80 : 60
    const scaledSize = baseSize * element.scale

    if (canvasPos.x >= pos.x - scaledSize/2 &&
        canvasPos.x <= pos.x + scaledSize/2 &&
        canvasPos.y >= pos.y - scaledSize/2 &&
        canvasPos.y <= pos.y + scaledSize/2) {
      return element
    }
  }
  
  return null
}

// Select element
const selectElement = (elementId: string | null) => {
  canvasState.value.elements.forEach(el => {
    el.selected = el.id === elementId
  })
  canvasState.value.selectedElementId = elementId
}

// Handle save
const handleSave = () => {
  // Convert canvas elements back to sticker/keychain format
  const stickers: (any | null)[] = new Array(5).fill(null)
  let keychain: any | null = null
  
  canvasState.value.elements.forEach(element => {
    if (element.type === 'sticker' && element.slotIndex !== null) {
      stickers[element.slotIndex] = canvasElementToSticker(element)
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

// Update wear range when weapon changes
const updateWearRange = (minWear: number, maxWear: number) => {
  if (videoManager.value) {
    videoManager.value.updateWearRange(minWear, maxWear)
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
  // Implementation for drag start
  canvasState.value.isDragging = true
}

const handleCanvasMouseMove = (event: MouseEvent) => {
  if (!canvasState.value.isDragging || !selectedElement.value || !canvas.value) return

  const rect = canvas.value.getBoundingClientRect()
  const canvasPos = {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top
  }

  const normalizedPos = coordinateTransform.canvasToNormalized(canvasPos, canvasState.value.canvasSize)

  if (coordinateTransform.validateCoordinates(normalizedPos)) {
    selectedElement.value.position = normalizedPos
    renderCanvas()
  }
}

const handleCanvasMouseUp = () => {
  canvasState.value.isDragging = false
}

// Handle mouse wheel for zooming
const handleCanvasWheel = (event: WheelEvent) => {
  event.preventDefault()

  const delta = event.deltaY > 0 ? -0.1 : 0.1
  const newZoom = Math.max(minZoom, Math.min(maxZoom, zoomLevel.value + delta))
  zoomLevel.value = newZoom
}

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
  const availableWidth = containerRect.width - 40
  const availableHeight = containerRect.height - 40

  const canvasWidth = Math.max(800, availableWidth)
  const canvasHeight = Math.max(600, availableHeight)

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
}

// Lifecycle
onMounted(() => {
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
</script>

<template>
  <NModal
    :show="visible"
    style="width: 98vw; height: 95vh"
    preset="card"
    :title="t('modals.visualCustomizer.title')"
    :bordered="false"
    size="huge"
    @update:show="handleClose"
    :mask-closable="false"
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

    <div class="visual-customizer-container h-full flex">
      <!-- Main Canvas Area -->
      <div class="canvas-area flex-1 flex flex-col">
        <div class="canvas-header mb-4 flex items-center justify-between">
          <h3 class="text-lg font-semibold text-white">
            {{ props.weaponSkin?.name || 'Weapon Customizer' }}
          </h3>

          <!-- Zoom Controls -->
          <div class="zoom-controls flex items-center space-x-2">
            <NButton
              size="small"
              @click="zoomLevel = Math.max(minZoom, zoomLevel - 0.25)"
              :disabled="zoomLevel <= minZoom"
            >
              <template #icon>
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4"/>
                </svg>
              </template>
            </NButton>

            <span class="text-sm text-gray-300 min-w-16 text-center">
              {{ Math.round(zoomLevel * 100) }}%
            </span>

            <NButton
              size="small"
              @click="zoomLevel = Math.min(maxZoom, zoomLevel + 0.25)"
              :disabled="zoomLevel >= maxZoom"
            >
              <template #icon>
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
                </svg>
              </template>
            </NButton>

            <NButton
              size="small"
              @click="zoomLevel = 1"
              type="tertiary"
            >
              Reset
            </NButton>
          </div>
        </div>

        <div
          ref="canvasContainer"
          class="canvas-container flex-1 flex items-center justify-center bg-gray-900 rounded-lg p-4"
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
            class="border border-gray-600 rounded transition-transform duration-200"
            :class="{
              'cursor-crosshair': !canvasState.isDragging && !selectedElement,
              'cursor-move': canvasState.isDragging,
              'cursor-pointer': selectedElement && !canvasState.isDragging
            }"
            :style="{ transform: `scale(${zoomLevel})` }"
            @click="handleCanvasClick"
            @mousedown="handleCanvasMouseDown"
            @mousemove="handleCanvasMouseMove"
            @mouseup="handleCanvasMouseUp"
            @mouseleave="handleCanvasMouseUp"
            @wheel="handleCanvasWheel"
          />
        </div>

        <div class="canvas-footer mt-4 text-sm text-gray-400 text-center space-y-1">
          <div>Click elements to select • Drag to move • Use property panel to fine-tune • Scroll to zoom</div>
          <div class="text-xs">
            Canvas: {{ canvasState.canvasSize.width }}×{{ canvasState.canvasSize.height }}px
            • Zoom: {{ Math.round(zoomLevel * 100) }}%
            <span v-if="isVideoMode" class="text-green-400 ml-2">• Video Mode Active</span>
          </div>
        </div>
      </div>

      <!-- Right Sidebar -->
      <div class="sidebar w-80 ml-4 flex flex-col space-y-4">
        <!-- Weapon Wear Control (only show in video mode) -->
        <div v-if="isVideoMode" class="wear-control-compact bg-gray-800 rounded-lg p-3">
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
        <!-- Asset Browser -->
        <NCard
          v-if="showAssetBrowser"
          title="Asset Browser"
          class="flex-1"
          :bordered="false"
          style="background: #242424"
        >
          <template #header-extra>
            <NSpace>
              <NButton
                size="small"
                :type="selectedAssetType === 'sticker' ? 'primary' : 'default'"
                @click="selectedAssetType = 'sticker'"
              >
                Stickers
              </NButton>
              <NButton
                size="small"
                :type="selectedAssetType === 'keychain' ? 'primary' : 'default'"
                @click="selectedAssetType = 'keychain'"
              >
                Keychains
              </NButton>
            </NSpace>
          </template>

          <div class="asset-browser-content">
            <NInput
              v-model:value="assetSearchQuery"
              placeholder="Search assets..."
              class="mb-4"
              clearable
            />

            <div v-if="isLoadingAssets" class="flex justify-center py-8">
              <NSpin size="medium" />
            </div>

            <div v-else class="asset-grid grid grid-cols-3 gap-2 max-h-60 overflow-y-auto">
              <!-- Stickers -->
              <template v-if="selectedAssetType === 'sticker'">
                <div
                  v-for="sticker in filteredStickers.slice(0, 50)"
                  :key="sticker.id"
                  class="asset-item p-2 bg-gray-800 rounded cursor-pointer hover:bg-gray-700 transition-colors"
                  :title="sticker.name"
                  @click="addStickerToCanvas(sticker)"
                >
                  <img
                    :src="sticker.image"
                    :alt="sticker.name"
                    class="w-full h-12 object-contain mb-1"
                  />
                  <p class="text-xs text-gray-300 truncate">
                    {{ sticker.name.replace('Sticker | ', '') }}
                  </p>
                </div>
              </template>

              <!-- Keychains -->
              <template v-if="selectedAssetType === 'keychain'">
                <div
                  v-for="keychain in filteredKeychains.slice(0, 50)"
                  :key="keychain.id"
                  class="asset-item p-2 bg-gray-800 rounded cursor-pointer hover:bg-gray-700 transition-colors"
                  :title="keychain.name"
                  @click="addKeychainToCanvas(keychain)"
                >
                  <img
                    :src="keychain.image"
                    :alt="keychain.name"
                    class="w-full h-12 object-contain mb-1"
                  />
                  <p class="text-xs text-gray-300 truncate">
                    {{ keychain.name.replace('Charm | ', '') }}
                  </p>
                </div>
              </template>
            </div>
          </div>
        </NCard>

        <!-- Property Panel -->
        <NCard
          v-if="showPropertyPanel && selectedElement"
          title="Properties"
          :bordered="false"
          style="background: #242424"
        >
          <div class="property-panel space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-300 mb-2">Position X</label>
              <NInputNumber
                :value="selectedElement.position.x"
                :min="0"
                :max="1"
                :step="0.01"
                :precision="3"
                class="w-full"
                @update:value="updateElementProperty('position.x', $event)"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-300 mb-2">Position Y</label>
              <NInputNumber
                :value="selectedElement.position.y"
                :min="0"
                :max="1"
                :step="0.01"
                :precision="3"
                class="w-full"
                @update:value="updateElementProperty('position.y', $event)"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-300 mb-2">Scale</label>
              <NSlider
                :value="selectedElement.scale"
                :min="0.1"
                :max="3"
                :step="0.1"
                @update:value="updateElementProperty('scale', $event)"
              />
              <NInputNumber
                :value="selectedElement.scale"
                :min="0.1"
                :max="3"
                :step="0.1"
                :precision="1"
                class="w-full mt-2"
                @update:value="updateElementProperty('scale', $event)"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-300 mb-2">Rotation (degrees)</label>
              <NSlider
                :value="selectedElement.rotation"
                :min="0"
                :max="360"
                :step="1"
                @update:value="updateElementProperty('rotation', $event)"
              />
              <NInputNumber
                :value="selectedElement.rotation"
                :min="0"
                :max="360"
                :step="1"
                class="w-full mt-2"
                @update:value="updateElementProperty('rotation', $event)"
              />
            </div>

            <div v-if="selectedElement.type === 'sticker'">
              <label class="block text-sm font-medium text-gray-300 mb-2">Wear</label>
              <NSlider
                :value="selectedElement.wear || 0"
                :min="0"
                :max="1"
                :step="0.01"
                @update:value="updateElementProperty('wear', $event)"
              />
              <NInputNumber
                :value="selectedElement.wear || 0"
                :min="0"
                :max="1"
                :step="0.01"
                :precision="2"
                class="w-full mt-2"
                @update:value="updateElementProperty('wear', $event)"
              />
            </div>

            <div class="pt-4 border-t border-gray-600">
              <NButton
                @click="removeSelectedElement"
                type="error"
                size="small"
                class="w-full"
              >
                Remove {{ selectedElement.type === 'sticker' ? 'Sticker' : 'Keychain' }}
              </NButton>
            </div>
          </div>
        </NCard>

        <!-- Instructions when no element selected -->
        <NCard
          v-if="!selectedElement"
          title="Instructions"
          :bordered="false"
          style="background: #242424"
        >
          <div class="text-sm text-gray-300 space-y-2">
            <p>• Click on stickers or keychains in the asset browser to add them to your weapon</p>
            <p>• Click on elements in the canvas to select and edit them</p>
            <p>• Use the property panel to fine-tune position, scale, rotation, and wear</p>
            <p>• Drag elements directly on the canvas to reposition them</p>
          </div>
        </NCard>
      </div>
    </div>
  </NModal>
</template>

<style scoped>
.visual-customizer-container {
  height: calc(95vh - 120px);
}

.canvas-container {
  min-height: 700px;
  height: 100%;
  flex: 1;
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
