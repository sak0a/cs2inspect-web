<script setup lang="ts">
// @saka-ui/registry v0.2.10 — dropdown
// Source: saka-ui@0.2.10
// Do not remove this header if you want `saka-ui diff` to work.
import { inject, computed } from 'vue'
import { cn } from '../../../lib/utils'
import { type IconProp } from '../../../lib/icon'
import SIcon from '../SIcon.vue'
import { SDropdownContextKey, type SDropdownContext } from './context'

defineOptions({ inheritAttrs: false })

export interface Props {
  /** Group header label */
  label: string
  /** Icon for the header */
  icon?: IconProp
}

const props = withDefaults(defineProps<Props>(), {
  icon: undefined,
})

// Inject context from parent dropdown
const context = inject<SDropdownContext>(SDropdownContextKey)

const sizeConfig = computed(
  () =>
    ({
      sm: 'px-2 pt-1.5 pb-0.5 text-[10px]',
      md: 'px-2.5 pt-2 pb-1 text-[11px]',
      lg: 'px-3 pt-2.5 pb-1 text-xs',
    })[context?.size ?? 'md']
)
</script>

<template>
  <div :class="cn('s-dropdown-group', $attrs.class ?? '')" v-bind="$attrs">
    <!-- Group header -->
    <div
      class="font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2 sticky top-0 bg-background/95 backdrop-blur-sm"
      :class="sizeConfig"
    >
      <SIcon v-if="icon" :icon="icon" :size="12" />
      <span>{{ label }}</span>
    </div>

    <!-- Group items -->
    <div class="s-dropdown-group-content">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.s-dropdown-group + .s-dropdown-group {
  margin-top: 4px;
  padding-top: 4px;
  border-top: 1px solid var(--s-border);
}
</style>
