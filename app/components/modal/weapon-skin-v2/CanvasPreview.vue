<script setup lang="ts">
import type { CanvasState, CanvasElement } from '~/types/canvas'
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
  getAssetSizes: () => {
    const sizes = getWeaponAssetSizes(props.weaponName)
    return {
      stickerWidth: sizes.sticker.width,
      stickerHeight: sizes.sticker.height,
      keychainWidth: sizes.keychain.width,
      keychainHeight: sizes.keychain.height,
    }
  },
  onStateChanged: () => renderer.render(),
  onEmptySlotClick: (index, type) => emit('empty-slot-click', index, type),
})

watch(() => interaction.selectedElement.value, (el) => emit('element-selected', el))

defineExpose({
  render: renderer.render,
  init: renderer.init,
  setupVideo: renderer.setupVideo,
  loadAllElementImages: renderer.loadAllElementImages,
  handleKeydown: interaction.handleKeydown,
  selectElement: interaction.selectElement,
  updateScale: interaction.updateScale,
  updateRotation: interaction.updateRotation,
  updateWear: interaction.updateWear,
  removeSelected: interaction.removeSelected,
})

onMounted(() => {
  renderer.init()
  interaction.attachWheelListener()
})

onBeforeUnmount(() => {
  interaction.detachWheelListener()
})
</script>

<template>
  <div class="relative">
    <video ref="videoRef" crossorigin="anonymous" playsinline style="display: none" />
    <canvas
      ref="canvasRef"
      class="w-full cursor-crosshair"
      style="height: 400px; background: #0f0f0f; border-radius: 8px;"
      @mousedown="interaction.handleMouseDown"
      @mousemove="interaction.handleMouseMove"
      @mouseup="interaction.handleMouseUp"
      @mouseleave="interaction.handleMouseUp"
    />
  </div>
</template>
