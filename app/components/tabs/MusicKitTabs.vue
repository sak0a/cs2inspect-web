<script setup lang="ts">
// Removed unused computed import
import type { APIMusicKit } from '~/server/types'

interface Props {
  musicKit: APIMusicKit
  isSelected?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isSelected: false,
})

const emit = defineEmits<{
  (e: 'select', musicKit: APIMusicKit): void
}>()
const { t: _t } = useI18n()

const handleSelect = () => {
  emit('select', props.musicKit)
}

// Removed unused getMusicKitBaseId computed property
</script>

<template>
  <div
    :style="{
      borderColor: musicKit.rarity?.color || '#313030',
      background: musicKit.rarity?.color
        ? 'linear-gradient(135deg, #101010, ' + hexToRgba(musicKit.rarity?.color, '0.15') + ')'
        : '#242424',
    }"
    :class="[
      'h-[300px] w-full flex flex-col px-6 py-5 transition-[transform,box-shadow] duration-300 cursor-pointer rounded-xl bg-[var(--card-bg)] music-kit-card',
      isSelected
        ? 'selected-music-kit ring-2 ring-[var(--selection-ring)] border-0 visible'
        : 'border hover:shadow-lg hover:scale-100 hover:z-10',
    ]"
    @click="handleSelect"
  >
    <div class="flex flex-col items-center h-full">
      <img
        :src="musicKit.image"
        :alt="musicKit.name"
        class="w-full h-32 object-contain mb-2"
        loading="lazy"
      />
      <div class="w-full grow flex flex-col">
        <div>
          <p class="text-sm text-white line-clamp-2 h-10 music-kit-name">
            {{ musicKit.name }}
          </p>
          <p
            v-if="musicKit.description"
            class="text-xs text-gray-400 line-clamp-4 h-16 music-kit-desc"
          >
            {{ musicKit.description }}
          </p>
        </div>
        <div class="h-1 mt-auto" :style="{ background: musicKit.rarity?.color || '#313030' }" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.music-kit-name {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}

.music-kit-desc {
  display: -webkit-box;
  -webkit-line-clamp: 4;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 0;
}

/* Ring styling for selected music kits */
.selected-music-kit {
  transform: scale(1.05) !important;
  z-index: 20 !important;
  transition: none !important; /* Make the change instant */
  animation: none !important; /* Disable any animations */
  opacity: 1 !important;
  visibility: visible !important;
}
</style>
