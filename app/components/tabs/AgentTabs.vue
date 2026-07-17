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
  return String(
    props.agent.team.id === 'terrorists' ? t('teams.terrorists') : t('teams.counterTerrorists')
  )
})

/** Agent names follow "Name | Faction" — split so the faction renders muted. */
const nameParts = computed(() => {
  const [main = '', ...rest] = props.agent.name.split(' | ')
  return { main, sub: rest.length > 0 ? rest.join(' | ') : undefined }
})
</script>

<template>
  <ItemCard
    :name="nameParts.main"
    :sub-name="nameParts.sub"
    :image-url="agent.image"
    :image-alt="agent.name"
    :rarity-color="agent.rarity?.color"
    :rarity-label="agent.rarity?.name"
    :selected="isSelected"
    :badge-text="teamLabel"
    stage-class="h-48"
    class="mx-2 mt-2 w-56 shrink-0 sm:w-64"
    @click="handleSelect"
  />
</template>
