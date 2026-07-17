<script setup lang="ts">
import type { SelectLabelProps } from "reka-ui"
import type { HTMLAttributes } from "vue"
import { SelectLabel } from "reka-ui"
import { cn } from "@/lib/utils"

const props = defineProps<SelectLabelProps & { class?: HTMLAttributes["class"] }>()
</script>

<template>
  <SelectLabel
    data-slot="select-label"
    :class="cn('text-text-tertiary px-2 py-1.5 font-mono text-[11px] font-medium tracking-[0.12em] uppercase', props.class)"
  >
    <slot />
  </SelectLabel>
</template>
