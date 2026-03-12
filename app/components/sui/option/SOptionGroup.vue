<script setup lang="ts">
// @saka-ui/registry v0.2.10 — option
// Source: saka-ui@0.2.10
// Do not remove this header if you want `saka-ui diff` to work.
import { ref, provide, computed } from 'vue'
import { cn } from '../../../lib/utils'

defineOptions({ inheritAttrs: false })

export interface Props {
  label: string
  disabled?: boolean
  collapsible?: boolean
  defaultCollapsed?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
  collapsible: false,
  defaultCollapsed: false,
})

const isCollapsed = ref(props.defaultCollapsed)

const toggle = () => {
  if (props.collapsible) {
    isCollapsed.value = !isCollapsed.value
  }
}

// Provide disabled state to child options
provide(
  's-option-group-disabled',
  computed(() => props.disabled)
)
</script>

<template>
  <div v-bind="$attrs" :class="cn('s-option-group')">
    <!-- Group Header -->
    <div
      :class="
        cn(
          'flex items-center gap-2 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground',
          {
            'cursor-pointer hover:text-foreground': collapsible,
            'opacity-(--s-opacity-disabled)': disabled,
          }
        )
      "
      @click="toggle"
    >
      <slot name="label">
        <span class="flex-1">{{ label }}</span>
      </slot>
      <span
        v-if="collapsible"
        class="mdi transition-transform duration-(--s-duration-normal)"
        :class="isCollapsed ? 'mdi-chevron-right' : 'mdi-chevron-down'"
      />
    </div>

    <!-- Group Content -->
    <Transition
      enter-active-class="transition-all duration-(--s-duration-normal) ease-out"
      enter-from-class="opacity-0 max-h-0"
      enter-to-class="opacity-100 max-h-96"
      leave-active-class="transition-all duration-150 ease-in"
      leave-from-class="opacity-100 max-h-96"
      leave-to-class="opacity-0 max-h-0"
    >
      <div v-show="!isCollapsed" class="overflow-hidden">
        <slot />
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.s-option-group + .s-option-group {
  border-top: 1px solid var(--s-border);
  margin-top: 0.25rem;
  padding-top: 0.25rem;
}
</style>
