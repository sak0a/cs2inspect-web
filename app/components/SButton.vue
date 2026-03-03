<script setup lang="ts">
import type { Component } from 'vue'
import { computed, ref, useSlots } from 'vue'

export interface Props {
  variant?: 'filled' | 'outlined' | 'light' | 'ghost' | 'link' | 'dashed'
  type?: 'default' | 'primary' | 'error' | 'success' | 'info' | 'warning'
  size?: 'xs' | 'small' | 'medium' | 'large' | 'xl'
  color?: string
  disabled?: boolean
  loading?: boolean
  preserveSize?: boolean
  block?: boolean
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'full'
  iconLeft?: Component
  iconRight?: Component
  iconOnly?: boolean
  tag?: string
  href?: string
  to?: string | object
  buttonType?: 'button' | 'submit' | 'reset'
  ripple?: boolean
  animationType?: 'slide' | 'vertical' | 'scale' | 'rotate'
  animateInactive?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'filled',
  type: 'default',
  size: 'medium',
  color: undefined,
  disabled: false,
  loading: false,
  preserveSize: false,
  block: false,
  rounded: 'full',
  iconLeft: undefined,
  iconRight: undefined,
  iconOnly: false,
  tag: 'button',
  href: undefined,
  to: undefined,
  buttonType: 'button',
  ripple: true,
  animationType: 'slide',
  animateInactive: false,
})

const slots = useSlots()
const hasAnimateSlot = computed(() => !!slots.animate)

const emit = defineEmits<{
  click: [event: MouseEvent]
}>()

// Type-to-color mapping
type ButtonType = NonNullable<Props['type']>
const typeColors: Record<ButtonType, { color: string; alpha: string }> = {
  default: { color: 'var(--s-default)', alpha: 'var(--s-default-alpha)' },
  primary: { color: 'var(--s-primary)', alpha: 'var(--s-primary-alpha)' },
  error: { color: 'var(--s-error)', alpha: 'var(--s-error-alpha)' },
  success: { color: 'var(--s-success)', alpha: 'var(--s-success-alpha)' },
  info: { color: 'var(--s-info)', alpha: 'var(--s-info-alpha)' },
  warning: { color: 'var(--s-warning)', alpha: 'var(--s-warning-alpha)' },
}

// Resolve color: explicit color prop wins, otherwise derive from type
const resolvedColor = computed((): { color: string; alpha: string } => {
  if (props.color) return { color: props.color, alpha: `${props.color}15` }
  return typeColors[props.type]
})

// Ripple effect state
const ripples = ref<{ id: number; x: number; y: number; size: number }[]>([])
let rippleId = 0

const createRipple = (event: MouseEvent) => {
  if (!props.ripple || props.disabled || props.loading) return

  const button = event.currentTarget as HTMLElement
  const rect = button.getBoundingClientRect()
  const size = Math.max(rect.width, rect.height) * 2
  const x = event.clientX - rect.left - size / 2
  const y = event.clientY - rect.top - size / 2

  const id = rippleId++
  ripples.value.push({ id, x, y, size })

  setTimeout(() => {
    ripples.value = ripples.value.filter((r) => r.id !== id)
  }, 600)
}

const handleClick = (event: MouseEvent) => {
  if (props.disabled || props.loading) {
    event.preventDefault()
    return
  }
  createRipple(event)
  emit('click', event)
}

const handleKeydown = (event: KeyboardEvent) => {
  if (props.disabled || props.loading) return
  if (event.key === ' ' || event.key === 'Enter') {
    event.preventDefault()
    const mouseEvent = new MouseEvent('click', {
      bubbles: true,
      clientX: (event.target as HTMLElement).getBoundingClientRect().left + 20,
      clientY: (event.target as HTMLElement).getBoundingClientRect().top + 20,
    })
    ;(event.target as HTMLElement).dispatchEvent(mouseEvent)
  }
}

// Computed component tag
const componentTag = computed(() => {
  if (props.to) return 'router-link'
  if (props.href) return 'a'
  return props.tag
})

// Size configurations
const sizeClasses = computed(() => {
  if (props.iconOnly) {
    const iconOnlySizes = {
      xs: 'w-7 h-7 text-sm',
      small: 'w-8 h-8 text-sm',
      medium: 'w-10 h-10 text-base',
      large: 'w-12 h-12 text-lg',
      xl: 'w-14 h-14 text-xl',
    }
    return iconOnlySizes[props.size]
  }

  const sizes = {
    xs: 'px-3 py-0.5 text-sm gap-1',
    small: 'px-4 py-1.5 text-sm gap-1.5',
    medium: 'px-5 py-1.5 text-sm gap-2',
    large: 'px-6 py-2 text-base gap-2',
    xl: 'px-7 py-2.5 text-lg gap-2.5',
  }
  return sizes[props.size]
})

// Icon pixel sizes for Lucide components
const iconSize = computed(() => {
  const sizes = {
    xs: 14,
    small: 14,
    medium: 16,
    large: 18,
    xl: 20,
  }
  return sizes[props.size]
})

// Border radius
const radiusClasses = computed(() => {
  const radii = {
    none: 'rounded-none',
    sm: 'rounded',
    md: 'rounded-lg',
    lg: 'rounded-xl',
    full: 'rounded-full',
  }
  return radii[props.rounded]
})

// Computed styles based on variant and resolved color
const computedStyle = computed(() => {
  const style: Record<string, string> = {}
  const { color, alpha } = resolvedColor.value

  if (props.variant === 'filled') {
    style['--btn-bg'] = color
    style['--btn-bg-hover'] = color
    style['--btn-text'] = '#fff'
    style['--btn-border'] = 'transparent'
  } else if (props.variant === 'outlined') {
    style['--btn-bg'] = 'transparent'
    style['--btn-bg-hover'] = alpha
    style['--btn-text'] = color
    style['--btn-border'] = color
  } else if (props.variant === 'light') {
    style['--btn-bg'] = alpha
    style['--btn-bg-hover'] = alpha
    style['--btn-text'] = color
    style['--btn-border'] = 'transparent'
  } else if (props.variant === 'ghost') {
    style['--btn-bg'] = 'transparent'
    style['--btn-bg-hover'] = 'var(--s-bg-tertiary)'
    style['--btn-text'] = color
    style['--btn-border'] = 'transparent'
  } else if (props.variant === 'link') {
    style['--btn-bg'] = 'transparent'
    style['--btn-bg-hover'] = 'transparent'
    style['--btn-text'] = color
    style['--btn-border'] = 'transparent'
  } else if (props.variant === 'dashed') {
    style['--btn-bg'] = 'transparent'
    style['--btn-bg-hover'] = alpha
    style['--btn-text'] = color
    style['--btn-border'] = color
  }

  return style
})

// Component bindings
const componentBindings = computed(() => {
  const bindings: Record<string, unknown> = {}

  if (props.to) {
    bindings.to = props.to
  }
  if (props.href) {
    bindings.href = props.href
  }
  if (componentTag.value === 'button') {
    bindings.type = props.buttonType
  }
  if (props.disabled) {
    bindings.disabled = true
  }

  return bindings
})
</script>

<template>
  <component
    :is="componentTag"
    v-bind="componentBindings"
    class="s-button relative inline-flex items-center justify-center font-medium whitespace-nowrap transition-all duration-200 ease-out overflow-hidden select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-(--s-primary)"
    :class="[
      sizeClasses,
      radiusClasses,
      {
        'w-full': block,
        'opacity-50 cursor-not-allowed': disabled || loading,
        'cursor-pointer': !disabled && !loading,
        'hover:brightness-110': variant === 'filled' && !disabled && !loading,
        'hover:underline': variant === 'link' && !disabled && !loading,
        's-button--dashed': variant === 'dashed',
        's-button--animate': hasAnimateSlot && !animateInactive,
        [`s-button--animate-${animationType}`]: hasAnimateSlot && !animateInactive,
      },
    ]"
    :style="computedStyle"
    @click="handleClick"
    @keydown="handleKeydown"
  >
    <!-- Ripple effects -->
    <span
      v-for="ripple in ripples"
      :key="ripple.id"
      class="absolute rounded-full bg-white/30 animate-ripple pointer-events-none"
      :style="{
        left: `${ripple.x}px`,
        top: `${ripple.y}px`,
        width: `${ripple.size}px`,
        height: `${ripple.size}px`,
      }"
    />

    <!-- Loading spinner (absolute when preserveSize) -->
    <span
      v-if="loading"
      class="s-button__spinner animate-spin"
      :class="{ 'absolute inset-0 flex items-center justify-center': preserveSize }"
    />

    <!-- Default content wrapper -->
    <span
      class="s-button__content flex items-center justify-center gap-2"
      :class="{ 'opacity-0': loading && preserveSize }"
    >
      <!-- Left icon -->
      <template v-if="!loading || preserveSize">
        <slot name="icon-left">
          <component :is="iconLeft" v-if="iconLeft" :size="iconSize" />
        </slot>
      </template>

      <!-- Content -->
      <span v-if="!iconOnly && (!loading || preserveSize)">
        <slot />
      </span>

      <!-- Icon only content -->
      <template v-if="iconOnly && (!loading || preserveSize) && !iconLeft">
        <slot />
      </template>

      <!-- Right icon -->
      <template v-if="!loading || preserveSize">
        <slot name="icon-right">
          <component :is="iconRight" v-if="iconRight" :size="iconSize" />
        </slot>
      </template>
    </span>

    <!-- Animate slot content -->
    <span
      v-if="hasAnimateSlot"
      class="s-button__animate flex items-center justify-center gap-2"
      :class="[`s-button__animate--${animationType}`]"
    >
      <slot name="animate" />
    </span>
  </component>
</template>
<style scoped>
.s-button {
  font-weight: 400;
  background-color: var(--btn-bg);
  color: var(--btn-text);
  border: 1.5px solid var(--btn-border);
}

.s-button--dashed {
  border-style: dashed;
}

.s-button:not(:disabled):not(.opacity-50):hover {
  background-color: var(--btn-bg-hover);
  transform: translateY(-1px);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.1),
    0 4px 12px rgba(0, 0, 0, 0.25),
    0 1px 3px rgba(0, 0, 0, 0.15);
}

.s-button:not(:disabled):not(.opacity-50):active {
  transform: translateY(0);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.06),
    0 1px 4px rgba(0, 0, 0, 0.2);
}

/* Constrain SVGs inside icon slots to match font size */
.s-button__content :deep(svg) {
  width: 1em;
  height: 1em;
  flex-shrink: 0;
}

/* Loading spinner */
.s-button__spinner {
  width: 1em;
  height: 1em;
  border: 2px solid currentColor;
  border-top-color: transparent;
  border-radius: 50%;
}

/* Ripple animation */
@keyframes ripple {
  0% {
    transform: scale(0);
    opacity: 0.5;
  }
  100% {
    transform: scale(1);
    opacity: 0;
  }
}

.animate-ripple {
  animation: ripple 0.6s ease-out forwards;
}

/* Focus ring offset matches background */
.s-button:focus-visible {
  outline: none;
  box-shadow:
    0 0 0 2px var(--s-bg-primary),
    0 0 0 4px var(--s-primary);
}

/* Button content wrapper */
.s-button__content {
  transition:
    transform 0.3s ease,
    opacity 0.3s ease;
}

/* Animate slot - positioned absolute over content */
.s-button__animate {
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  pointer-events: none;
  transition:
    transform 0.3s ease,
    opacity 0.3s ease;
}

/* Slide animation (default) - slides horizontally */
.s-button__animate--slide {
  transform: translateX(100%);
}

.s-button--animate-slide:hover .s-button__content {
  transform: translateX(-100%);
}

.s-button--animate-slide:hover .s-button__animate--slide {
  transform: translateX(0);
}

/* Vertical animation - slides vertically */
.s-button__animate--vertical {
  transform: translateY(100%);
}

.s-button--animate-vertical:hover .s-button__content {
  transform: translateY(-100%);
  opacity: 0;
}

.s-button--animate-vertical:hover .s-button__animate--vertical {
  transform: translateY(0);
}

/* Scale animation - scales in/out */
.s-button__animate--scale {
  transform: scale(0.5);
  opacity: 0;
}

.s-button--animate-scale:hover .s-button__content {
  transform: scale(1.4);
  opacity: 0;
}

.s-button--animate-scale:hover .s-button__animate--scale {
  transform: scale(1);
  opacity: 1;
}

/* Rotate animation - rotates in/out */
.s-button__animate--rotate {
  transform: rotate(-180deg);
  opacity: 0;
}

.s-button--animate-rotate:hover .s-button__content {
  transform: rotate(180deg);
  opacity: 0;
}

.s-button--animate-rotate:hover .s-button__animate--rotate {
  transform: rotate(0);
  opacity: 1;
}
</style>
