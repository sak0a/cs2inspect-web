<script setup lang="ts">
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

const handleSelect = () => {
  emit('select', props.musicKit)
}

/** Kit names follow "Music Kit | Artist, Title" — split so the title renders muted. */
const nameParts = computed(() => {
  const [main = '', ...rest] = props.musicKit.name.split(' | ')
  return { main, sub: rest.length > 0 ? rest.join(' | ') : undefined }
})
</script>

<template>
  <ItemCard
    :name="nameParts.main"
    :sub-name="nameParts.sub"
    :image-url="musicKit.image"
    :image-alt="musicKit.name"
    :rarity-color="musicKit.rarity?.color"
    :rarity-label="musicKit.rarity?.name"
    :selected="isSelected"
    class="music-kit-card"
    @click="handleSelect"
  >
    <p
      v-if="musicKit.description"
      class="mt-1.5 line-clamp-4 text-xs leading-relaxed text-muted-foreground"
    >
      {{ musicKit.description }}
    </p>
  </ItemCard>
</template>
