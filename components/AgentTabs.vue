<script setup lang="ts">
import { computed } from 'vue'
import { NCard } from 'naive-ui'
import { APIAgent } from "~/server/utils/interfaces";

const props = defineProps({
  agent: {
    type: Object as () => APIAgent,
    required: true
  }
})

const emit = defineEmits(['select'])
const { t } = useI18n()

const handleSelect = () => {
  emit('select', props.agent)
}

const hexToRgba = (hex: string, opacity: string) => {
  if (!hex) return `rgba(49, 48, 48, ${opacity})`
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${opacity})`
}

const teamLabel = computed(() => {
  return props.agent.team.id === 'terrorists' ? t('teams.terrorists') : t('teams.counterTerrorists')
})
</script>

<template>
  <NCard
      :style="{
        borderColor: agent.rarity?.color || '#313030',
        background: agent.rarity?.color ? 'linear-gradient(135deg, #101010, ' +
          hexToRgba(agent.rarity?.color, '0.15') + ')': '#242424'
      }"
      class="hover:shadow-lg transition-all cursor-pointer bg-[#242424] w-[300px] agent-card"
      @click="handleSelect"
  >
    <div class="flex flex-col items-center">
      <img
          :src="agent.image"
          :alt="agent.name"
          class="w-full h-48 object-contain mb-2"
          loading="lazy"
      >
      <div class="w-full">
        <p class="text-sm text-white truncate">{{ agent.name }}</p>
        <p class="text-xs text-gray-400">{{ teamLabel }}</p>
        <div class="h-1 mt-2" :style="{ background: agent.rarity?.color || '#313030' }" />
      </div>
    </div>
  </NCard>
</template>

<style scoped>
.n-card {
  background: #242424;
  border: 1px solid #313030;
}
</style>
