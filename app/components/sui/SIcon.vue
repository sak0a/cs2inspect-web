<script setup lang="ts">
// @saka-ui/registry v0.2.10 — icon
// Source: saka-ui@0.2.10
// Do not remove this header if you want `saka-ui diff` to work.
import { computed, type CSSProperties, type Component } from 'vue'
import { cn } from '../../lib/utils'
import { type IconProp, isIconComponent } from '../../lib/icon'

defineOptions({ inheritAttrs: false })

export interface Props {
  /** Unified icon prop - accepts MDI string name or Vue component */
  icon?: IconProp
  /** Vue component icon (explicit) */
  component?: Component
  /** MDI icon name (explicit) */
  name?: string
  size?: number | string
  color?: string
  depth?: 1 | 2 | 3 | 4 | 5
}

const props = withDefaults(defineProps<Props>(), {
  icon: undefined,
  component: undefined,
  name: undefined,
  size: 24,
  color: undefined,
  depth: undefined,
})

// Resolve rendering: icon > component > name > slot
const resolvedComponent = computed<Component | undefined>(() => {
  if (props.icon && isIconComponent(props.icon)) return props.icon as Component
  if (props.component) return props.component
  return undefined
})

const resolvedName = computed<string | undefined>(() => {
  if (props.icon && !isIconComponent(props.icon)) return props.icon as string
  if (props.name) return props.name
  return undefined
})

const computedStyle = computed<CSSProperties>(() => {
  const style: CSSProperties = {}

  // Handle size
  if (props.size !== undefined) {
    const sizeVal = typeof props.size === 'number' ? `${props.size}px` : props.size
    style.fontSize = sizeVal
    style.width = sizeVal
    style.height = sizeVal
  }

  // Handle color
  if (props.color) {
    style.color = props.color
  }

  // Handle depth (opacity)
  if (props.depth) {
    const opacityMap: Record<number, string> = {
      1: '1',
      2: '0.82',
      3: '0.6',
      4: '0.38',
      5: '0.18',
    }
    style.opacity = opacityMap[props.depth] || '1'
  }

  return style
})
</script>

<template>
  <i
    :class="
      cn('inline-flex items-center justify-center align-middle leading-none', ($attrs as any).class)
    "
    :style="computedStyle"
    role="img"
    v-bind="{ ...$attrs, class: undefined }"
  >
    <component :is="resolvedComponent" v-if="resolvedComponent" />
    <span v-else-if="resolvedName" :class="['mdi', `mdi-${resolvedName}`]" />
    <slot v-else />
  </i>
</template>

<style scoped>
/* Ensure svg children scale correctly */
.inline-flex :deep(svg) {
  width: 1em;
  height: 1em;
  fill: currentColor;
}

/* Ensure font icons inherit size */
.inline-flex :deep(i),
.inline-flex :deep(span) {
  font-size: inherit;
}
</style>
