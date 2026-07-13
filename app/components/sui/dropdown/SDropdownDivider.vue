<script setup lang="ts">
// @saka-ui/registry v0.2.10 — dropdown
// Source: saka-ui@0.2.10
// Do not remove this header if you want `saka-ui diff` to work.
import { cn } from '../../../lib/utils'

defineOptions({ inheritAttrs: false })

export interface Props {
  /** Custom margin */
  margin?: string
}

withDefaults(defineProps<Props>(), {
  margin: '4px',
})
</script>

<template>
  <div
    :class="cn('s-dropdown-divider h-px bg-border/60', $attrs.class ?? '')"
    role="separator"
    :style="{ marginTop: margin, marginBottom: margin }"
    v-bind="$attrs"
  />
</template>
