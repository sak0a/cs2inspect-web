<script setup lang="ts">
interface Props {
  hasSider?: boolean
  siderPosition?: 'left' | 'top'
}

withDefaults(defineProps<Props>(), {
  hasSider: false,
  siderPosition: 'left',
})
</script>

<template>
  <div
    class="flex h-screen bg-transparent relative"
    :class="[hasSider && siderPosition === 'left' ? 'flex-row' : 'flex-col overflow-auto']"
  >
    <slot />
  </div>
</template>
