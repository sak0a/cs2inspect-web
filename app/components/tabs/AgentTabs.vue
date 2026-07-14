<script setup lang="ts">
import type { APIAgent } from '~/types'

interface Props {
  agent: APIAgent
  isSelected?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isSelected: false,
})

const emit = defineEmits<{
  (e: 'select', agent: APIAgent): void
}>()
const { t } = useI18n()

const handleSelect = () => {
  emit('select', props.agent)
}

const teamLabel = computed(() => {
  return props.agent.team.id === 'terrorists' ? t('teams.terrorists') : t('teams.counterTerrorists')
})
</script>

<template>
  <div
    :style="{
      borderColor: agent.rarity?.color || '#313030',
      background: agent.rarity?.color
        ? 'linear-gradient(135deg, #101010, ' + hexToRgba(agent.rarity?.color, '0.15') + ')'
        : '#242424',
    }"
    :class="[
      'px-6 py-5 hover:shadow-lg transition-all cursor-pointer rounded-xl mt-2 mx-2 bg-[var(--card-bg)] w-[300px] agent-card',
      isSelected ? 'ring-2 ring-[var(--selection-ring)] border-0 visible' : 'border',
    ]"
    @click="handleSelect"
  >
    <div class="flex flex-col items-center">
      <img
        :src="agent.image"
        :alt="agent.name"
        class="w-full h-48 object-contain mb-2"
        loading="lazy"
      />
      <div class="w-full">
        <p class="text-sm text-white line-clamp-2 h-10 agent-name">{{ agent.name }}</p>
        <p class="text-xs text-gray-400">{{ teamLabel }}</p>
        <div class="h-1 mt-2" :style="{ background: agent.rarity?.color || '#313030' }" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.agent-name {
  display: -webkit-box;
  line-clamp: 2;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
