<script setup lang="ts">
import { computed } from 'vue'
import { NCard } from 'naive-ui'
import { APICollectible } from "~/server/utils/interfaces";

const props = defineProps({
  collectible: {
    type: Object as () => APICollectible,
    required: true
  },
  isSelected: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['select'])
const { t } = useI18n()

const handleSelect = () => {
  emit('select', props.collectible)
}

const hexToRgba = (hex: string, opacity: string) => {
  if (!hex) return `rgba(49, 48, 48, ${opacity})`
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${opacity})`
}

// Extract the base collectible ID
const getCollectibleBaseId = computed(() => {
  return parseInt(props.collectible.id.replace('collectible-', ''))
})

// Check if the collectible is a pin
const isPin = computed(() => {
  return props.collectible.type === 'Pin'
})
</script>

<template>
  <NCard
      :style="{
        borderColor: collectible.rarity?.color || '#313030',
        background: collectible.rarity?.color ? 'linear-gradient(135deg, #101010, ' +
          hexToRgba(collectible.rarity?.color, '0.15') + ')': '#242424'
      }"
      :class="[
        'cursor-pointer rounded-xl bg-[#242424] pin-card',
        isSelected ? 'selected-pin ring-2 ring-[#80E6C4] !border-0 visible' : 'hover:shadow-lg hover:scale-100 hover:z-10'
      ]"
      @click="handleSelect"
  >
    <div class="flex flex-col items-center h-full">
      <img
          :src="collectible.image"
          :alt="collectible.name"
          class="w-full h-32 object-contain mb-2"
          loading="lazy"
      >
      <div class="w-full flex-grow flex flex-col">
        <div>
          <p class="text-sm text-white line-clamp-2 h-10 pin-name">
            {{ collectible.name }}
            <span v-if="collectible.genuine" class="text-[#4D7455]">(Genuine)</span>
          </p>
          <p v-if="collectible.description" class="text-xs text-gray-400 line-clamp-4 h-16 pin-desc">{{ collectible.description }}</p>
        </div>
        <div class="h-1 mt-auto" :style="{ background: collectible.rarity?.color || '#313030' }" />
      </div>
    </div>
  </NCard>
</template>

<style scoped>
.n-card {
  background: #242424;
  border: 1px solid #313030;
  height: 300px;
  width: 100%; /* Full width to fit in grid cell */
  display: flex;
  flex-direction: column;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.pin-name {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}

.pin-desc {
  display: -webkit-box;
  -webkit-line-clamp: 4;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 0;
}

/* Ring styling for selected pins */
.selected-pin {
  transform: scale(1.05) !important;
  z-index: 20 !important;
  transition: none !important; /* Make the change instant */
  animation: none !important; /* Disable any animations */
  opacity: 1 !important;
  visibility: visible !important;
}
</style>
