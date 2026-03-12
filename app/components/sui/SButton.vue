<script setup lang="ts">
// @saka-ui/registry v0.2.10 — button
// Source: saka-ui@0.2.10
// Do not remove this header if you want `saka-ui diff` to work.
import { computed, ref, useSlots, type CSSProperties } from 'vue'
import { cn } from '../../lib/utils'
import { type IconProp, isIconComponent } from '../../lib/icon'
import { buttonVariants } from './button'

export interface Props {
  variant?: 'filled' | 'outlined' | 'light' | 'ghost' | 'link' | 'dashed' | 'glass'
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  color?: string
  type?: 'default' | 'primary' | 'error' | 'success' | 'info' | 'warning'
  disabled?: boolean
  loading?: boolean
  preserveSize?: boolean
  block?: boolean
  rounded?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | 'full'
  iconLeft?: IconProp
  iconRight?: IconProp
  iconOnly?: boolean
  tag?: string
  href?: string
  to?: string | object
  nativeType?: 'button' | 'submit' | 'reset'
  ripple?: boolean
  animationType?: 'slide' | 'vertical' | 'scale' | 'rotate'
  animateInactive?: boolean
  contentClass?: string
  iconClass?: string
}

const iconOnlySizes: Record<string, string> = {
  xs: 'w-6 h-6 text-xs',
  sm: 'w-8 h-8 text-sm',
  md: 'w-10 h-10 text-base',
  lg: 'w-12 h-12 text-lg',
  xl: 'w-14 h-14 text-xl',
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'filled',
  size: 'md',
  color: undefined,
  type: undefined,
  disabled: false,
  loading: false,
  preserveSize: false,
  block: false,
  rounded: 'md',
  iconLeft: undefined,
  iconRight: undefined,
  iconOnly: false,
  tag: 'button',
  href: undefined,
  to: undefined,
  nativeType: 'button',
  ripple: true,
  animationType: 'slide',
  animateInactive: false,
  contentClass: undefined,
  iconClass: undefined,
})

const typeColorMap: Record<string, string> = {
  primary: 'var(--s-primary)',
  error: 'var(--s-error)',
  success: 'var(--s-success)',
  warning: 'var(--s-warning)',
  info: 'var(--s-info)',
}

const typeForegroundMap: Record<string, string> = {
  primary: 'var(--s-primary-foreground)',
  error: 'var(--s-error-foreground)',
  success: 'var(--s-success-foreground)',
  warning: 'var(--s-warning-foreground)',
  info: 'var(--s-info-foreground)',
}

defineOptions({ inheritAttrs: false })

const slots = useSlots()
const hasAnimateSlot = computed(() => !!slots.animate)

const emit = defineEmits<{
  click: [event: MouseEvent]
}>()

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

const componentTag = computed(() => {
  if (props.to) return 'router-link'
  if (props.href) return 'a'
  return props.tag
})

const iconSizes = computed(() => {
  const sizes: Record<string, string> = {
    xs: 'text-xs',
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl',
  }
  return sizes[props.size]
})

const resolvedColor = computed(() => {
  if (props.type && props.type !== 'default') return typeColorMap[props.type]
  return props.color
})

// Custom color override: when color/type is set, use inline styles for color-specific properties
const colorStyle = computed<CSSProperties | undefined>(() => {
  if (!resolvedColor.value) return undefined

  const c = resolvedColor.value

  if (props.variant === 'filled') {
    const fg =
      props.type && props.type !== 'default' ? (typeForegroundMap[props.type] ?? '#fff') : '#fff'
    return { backgroundColor: c, color: fg, borderColor: 'transparent' }
  } else if (props.variant === 'outlined') {
    return { backgroundColor: 'transparent', borderColor: c, color: c }
  } else if (props.variant === 'light') {
    const bg = c.startsWith('var(') ? `color-mix(in srgb, ${c} 15%, transparent)` : `${c}20`
    return { backgroundColor: bg, color: c, borderColor: 'transparent' }
  } else if (props.variant === 'ghost') {
    return { backgroundColor: 'transparent', color: c, borderColor: 'transparent' }
  } else if (props.variant === 'link') {
    return { backgroundColor: 'transparent', color: c, borderColor: 'transparent' }
  } else if (props.variant === 'dashed') {
    return { backgroundColor: 'transparent', borderColor: c, color: c, borderStyle: 'dashed' }
  } else if (props.variant === 'glass') {
    return { '--glass-glow-color': `${c}40`, color: c } as CSSProperties
  }

  return undefined
})

const buttonClasses = computed(() => {
  return cn(
    // Base + size + rounded from cva; skip variant when color is set (inline style handles it)
    buttonVariants({
      variant: resolvedColor.value ? null : props.variant,
      size: props.iconOnly ? null : props.size,
      rounded: props.rounded,
    }),
    props.iconOnly && iconOnlySizes[props.size],
    // Hover/active interactions when color is set
    resolvedColor.value && props.variant === 'filled' && 'hover:brightness-110 active:scale-[0.98]',
    resolvedColor.value && props.variant === 'link' && 'hover:underline',
    props.variant === 'glass' && 's-button--glass',
    {
      'w-full': props.block,
      'opacity-(--s-opacity-disabled) cursor-not-allowed': props.disabled || props.loading,
      'cursor-pointer': !props.disabled && !props.loading,
      's-button--animate': hasAnimateSlot.value && !props.animateInactive,
      [`s-button--animate-${props.animationType}`]: hasAnimateSlot.value && !props.animateInactive,
    }
  )
})

const componentBindings = computed(() => {
  const bindings: Record<string, unknown> = {}

  if (props.to) bindings.to = props.to
  if (props.href) bindings.href = props.href
  if (componentTag.value === 'button') bindings.type = props.nativeType
  if (props.disabled) bindings.disabled = true

  return bindings
})
</script>

<template>
  <component
    :is="componentTag"
    v-bind="{ ...componentBindings, ...$attrs }"
    :class="cn(buttonClasses, $attrs.class as string)"
    :style="colorStyle"
    :data-disabled="props.disabled || props.loading || undefined"
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
      class="mdi mdi-loading animate-spin"
      :class="[iconSizes, { 'absolute inset-0 flex items-center justify-center': preserveSize }]"
    />

    <!-- Default content wrapper -->
    <span
      class="s-button__content flex items-center justify-center gap-2"
      :class="[contentClass, { 'opacity-0': loading && preserveSize }]"
    >
      <template v-if="!loading || preserveSize">
        <slot name="icon-left">
          <template v-if="iconLeft">
            <component
              v-if="isIconComponent(iconLeft)"
              :is="iconLeft"
              :class="[iconSizes, iconClass]"
            />
            <span v-else :class="['mdi', `mdi-${iconLeft}`, iconSizes, iconClass]" />
          </template>
        </slot>
      </template>

      <span v-if="!iconOnly && (!loading || preserveSize)">
        <slot />
      </span>

      <template v-if="iconOnly && (!loading || preserveSize) && !iconLeft">
        <slot />
      </template>

      <template v-if="!loading || preserveSize">
        <slot name="icon-right">
          <template v-if="iconRight">
            <component
              v-if="isIconComponent(iconRight)"
              :is="iconRight"
              :class="[iconSizes, iconClass]"
            />
            <span v-else :class="['mdi', `mdi-${iconRight}`, iconSizes, iconClass]" />
          </template>
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

/* Button content wrapper */
.s-button__content {
  transition:
    transform var(--s-duration-slow) ease,
    opacity var(--s-duration-slow) ease;
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
    transform var(--s-duration-slow) ease,
    opacity var(--s-duration-slow) ease;
}

/* Slide animation (default) */
.s-button__animate--slide {
  transform: translateX(100%);
}

.s-button--animate-slide:hover .s-button__content {
  transform: translateX(-100%);
}

.s-button--animate-slide:hover .s-button__animate--slide {
  transform: translateX(0);
}

/* Vertical animation */
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

/* Scale animation */
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

/* Rotate animation */
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

/* Glass variant */
.s-button--glass {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(12px) saturate(180%);
  -webkit-backdrop-filter: blur(12px) saturate(180%);
  border-color: rgba(255, 255, 255, 0.15);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.18),
    0 4px 16px rgba(0, 0, 0, 0.35),
    0 1px 4px rgba(0, 0, 0, 0.2);
}

.s-button--glass:not(:disabled):not([data-disabled]):hover {
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.22),
    0 8px 24px rgba(0, 0, 0, 0.45),
    0 2px 6px rgba(0, 0, 0, 0.25);
}

.s-button--glass:not(:disabled):not([data-disabled]):active {
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.14),
    0 2px 8px rgba(0, 0, 0, 0.3);
}
</style>
