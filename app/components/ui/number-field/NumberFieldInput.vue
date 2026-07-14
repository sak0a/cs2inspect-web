<script setup lang="ts">
import type { HTMLAttributes } from "vue"
import { NumberFieldInput } from "reka-ui"
import { cn } from "@/lib/utils"

const props = defineProps<{
  class?: HTMLAttributes["class"]
}>()
</script>

<template>
  <NumberFieldInput
    data-slot="input"
    :class="cn(
      'placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground bg-surface-2 border-input flex h-9 w-full min-w-0 rounded-[var(--radius-ctl)] border py-1 text-center text-base transition-[color,border-color,box-shadow] duration-[var(--dur-fast)] ease-[var(--ease-out)] outline-none disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
      'focus-visible:border-ring focus-visible:ring-ring/40 focus-visible:ring-2',
      'aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive',
      props.class,
    )"
  />
</template>
