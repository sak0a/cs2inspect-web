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
    class="absolute -bottom-1 left-3 z-20 flex items-center gap-1.5"
    style="padding: 8px 10px; background: rgba(18,18,18,0.92); backdrop-filter: blur(12px); border: 1px solid rgba(255,255,255,0.07); border-radius: 8px; box-shadow: 0 6px 24px rgba(0,0,0,0.5);"
    @click.stop
  >
    <div
      v-for="(sticker, index) in stickers"
      :key="'slot-' + index"
      class="w-9 h-9 rounded flex items-center justify-center cursor-pointer flex-shrink-0 overflow-hidden transition-all duration-150"
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
    <div class="w-px h-6 bg-[#333] mx-1.5" />
    <div
      class="w-9 h-9 rounded flex items-center justify-center cursor-pointer flex-shrink-0 overflow-hidden transition-all duration-150"
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
