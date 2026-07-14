<script setup lang="ts">
import type { HTMLAttributes } from "vue"
import { cn } from "@/lib/utils"

const props = defineProps<{
  class?: HTMLAttributes["class"]
}>()
</script>

<template>
  <tr
    data-slot="table-row"
    :class="cn('hover:bg-white/[0.03] data-[state=selected]:bg-muted border-b transition-colors duration-[var(--dur-fast)] [transition-timing-function:var(--ease-out)]', props.class)"
  >
    <slot />
  </tr>
</template>
