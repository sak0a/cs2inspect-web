<script setup lang="ts">
interface Props {
  siderPosition?: 'left' | 'top'
}

withDefaults(defineProps<Props>(), {
  siderPosition: 'left',
})
</script>

<template>
  <main
    class="flex-1 bg-transparent min-w-0 min-h-0"
    :class="siderPosition === 'left' ? 'overflow-auto h-full' : 'overflow-visible'"
  >
    <slot />
  </main>
</template>
