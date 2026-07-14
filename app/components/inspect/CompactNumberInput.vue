<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { cn } from '~/lib/utils'

/**
 * Compact numeric input used by the inline visual customizer control panel.
 * Wraps the shadcn/reka `NumberField` with the app's tiny glass-pill styling
 * (replaces Naive `NInputNumber size="tiny" :show-button="false"`).
 *
 * Supports both `v-model` and the controlled `:model-value` + `@update:model-value`
 * pattern. The model is a plain `number` (default 0) — matching reka's numeric
 * emit — so it binds cleanly to number-typed refs; parent handlers still accept
 * `number | null` for Naive parity.
 */
interface Props {
  min?: number
  max?: number
  step?: number
  /** Fixed number of decimal places (maps from Naive `precision`). */
  precision?: number
  placeholder?: string
  disabled?: boolean
  class?: HTMLAttributes['class']
}

const props = defineProps<Props>()
const model = defineModel<number>({ default: 0 })

const formatOptions = computed<Intl.NumberFormatOptions>(() => {
  const opts: Intl.NumberFormatOptions = { useGrouping: false }
  if (props.precision !== undefined) {
    opts.minimumFractionDigits = props.precision
    opts.maximumFractionDigits = props.precision
  }
  return opts
})
</script>

<template>
  <NumberField
    v-model="model"
    :min="min"
    :max="max"
    :step="step"
    :disabled="disabled"
    :format-options="formatOptions"
    :class="cn('gap-0', props.class)"
  >
    <NumberFieldInput
      :placeholder="placeholder"
      class="h-6 min-w-0 rounded-full border-white/10 bg-white/[0.06] px-2 py-0 text-xs text-white shadow-none transition-colors hover:border-white/20 focus-visible:border-[var(--primary-color)]"
    />
  </NumberField>
</template>
