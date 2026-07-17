<script setup lang="ts">
import type { APICollectible } from '~/server/types'

interface Props {
  collectible: APICollectible
  isSelected?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isSelected: false,
})

const emit = defineEmits<{
  (e: 'select', collectible: APICollectible): void
}>()

const handleSelect = () => {
  emit('select', props.collectible)
}
</script>

<template>
  <ItemCard
    :name="collectible.name"
    :image-url="collectible.image"
    :rarity-color="collectible.rarity?.color"
    :rarity-label="collectible.rarity?.name"
    :selected="isSelected"
    class="pin-card"
    @click="handleSelect"
  >
    <!-- "Genuine" pre-dates i18n here (was a hardcoded green suffix); kept verbatim -->
    <template v-if="collectible.genuine" #badge>
      <span
        class="rounded-full border border-[rgba(77,116,85,0.5)] bg-[rgba(77,116,85,0.18)] px-2 py-0.5 font-mono text-[10px] uppercase leading-tight tracking-[0.08em] text-[#8fbf9a]"
      >
        Genuine
      </span>
    </template>
    <p
      v-if="collectible.description"
      class="mt-1.5 line-clamp-4 text-xs leading-relaxed text-muted-foreground"
    >
      {{ collectible.description }}
    </p>
  </ItemCard>
</template>
