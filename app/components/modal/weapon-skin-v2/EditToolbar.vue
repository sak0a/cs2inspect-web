<script setup lang="ts">
import type { CanvasElement } from '~/types/canvas'

interface Props {
  element: CanvasElement
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update-scale': [delta: number]
  'update-rotation': [delta: number]
  'update-wear': [wear: number]
  'update-seed': [seed: number]
  'change': []
  'remove': []
}>()

const localWear = ref(String(props.element.wear ?? 0))
const localSeed = ref(String(props.element.seed ?? 0))

watch(() => props.element.id, () => {
  localWear.value = String(props.element.wear ?? 0)
  localSeed.value = String(props.element.seed ?? 0)
})

function onWearChange(val: string | number) {
  const num = parseFloat(String(val))
  const wear = isNaN(num) ? 0 : Math.max(0, Math.min(1, num))
  localWear.value = String(wear)
  emit('update-wear', wear)
}

function onSeedChange(val: string | number) {
  const num = parseInt(String(val))
  const seed = isNaN(num) ? 1000 : Math.max(0, Math.min(100000, Math.round(num)))
  localSeed.value = String(seed)
  emit('update-seed', seed)
}
</script>

<template>
  <div class="flex items-center gap-2 px-3 py-2 text-sm text-gray-400 whitespace-nowrap">
    <span class="text-xs text-gray-200 font-semibold truncate max-w-[280px]">{{ element.apiData.name }}</span>
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
      <SInput
        v-model="localWear"
        type="number"
        size="sm"
        variant="filled"
        allow-only="digits"
        :decimal-places="2"
        class="w-16"
        @change="onWearChange"
      />
      <div class="w-px h-4 bg-[#333]" />
    </template>

    <!-- Seed (keychains only) -->
    <template v-if="element.type === 'keychain'">
      <span class="text-[10px]">Seed</span>
      <SInput
        v-model="localSeed"
        type="number"
        size="sm"
        variant="filled"
        allow-only="digits"
        class="w-20"
        @change="onSeedChange"
      />
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
</template>
