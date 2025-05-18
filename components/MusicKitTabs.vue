<script setup lang="ts">
import { computed } from 'vue'
import { NCard } from 'naive-ui'
import { APIMusicKit } from "~/server/utils/interfaces";

const props = defineProps({
  musicKit: {
    type: Object as () => APIMusicKit,
    required: true
  }
})

const emit = defineEmits(['select'])
const { t } = useI18n()

const handleSelect = () => {
  emit('select', props.musicKit)
}

const hexToRgba = (hex: string, opacity: string) => {
  if (!hex) return `rgba(49, 48, 48, ${opacity})`
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${opacity})`
}

const isStatTrak = computed(() => {
  return props.musicKit.id.includes('_st') || props.musicKit.name.includes('StatTrak™')
})

// Extract the base music kit ID (without _st suffix for StatTrak)
const getMusicKitBaseId = computed(() => {
  return parseInt(props.musicKit.id.replace('music_kit-', '').replace('_st', ''))
})
</script>

<template>
  <NCard
      :style="{
        borderColor: musicKit.rarity?.color || '#313030',
        background: musicKit.rarity?.color ? 'linear-gradient(135deg, #101010, ' +
          hexToRgba(musicKit.rarity?.color, '0.15') + ')': '#242424'
      }"
      class="hover:shadow-lg transition-all cursor-pointer rounded-xl bg-[#242424] music-kit-card hover:z-10"
      @click="handleSelect"
  >
    <div class="flex flex-col items-center h-full">
      <img
          :src="musicKit.image"
          :alt="musicKit.name"
          class="w-full h-32 object-contain mb-2"
          loading="lazy"
      >
      <div class="w-full flex-grow flex flex-col">
        <div>
          <p class="text-sm text-white line-clamp-2 h-10 music-kit-name">{{ musicKit.name }}</p>
          <p v-if="musicKit.description" class="text-xs text-gray-400 line-clamp-4 h-16 music-kit-desc">{{ musicKit.description }}</p>
        </div>
        <div class="h-1 mt-auto" :style="{ background: musicKit.rarity?.color || '#313030' }" />
      </div>
    </div>
  </NCard>
</template>

<style scoped>
.n-card {
  background: #242424;
  border: 1px solid #313030;
  height: 300px; /* Reduced height to remove extra space */
  width: 250px; /* Reduced width to fit more in a row */
  display: flex;
  flex-direction: column;
}

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
</style>
