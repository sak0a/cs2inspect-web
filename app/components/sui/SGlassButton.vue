<script setup lang="ts">
// @saka-ui/registry v0.2.11 — glass-button
// Source: saka-ui@0.2.11
// Do not remove this header if you want `saka-ui diff` to work.
import { computed, ref, useSlots, onMounted, onUnmounted } from 'vue'
import { useTheme } from '../../composables/useTheme'
import { type IconProp, isIconComponent } from '../../lib/icon'

defineOptions({ inheritAttrs: false })

export interface Props {
  // SButton parity props
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
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
  type?: 'button' | 'submit' | 'reset'
  ripple?: boolean
  animationType?: 'slide' | 'vertical' | 'scale' | 'rotate'
  animateInactive?: boolean

  // Glass-specific props
  tint?: 'auto' | 'light' | 'dark'
  blur?: number
  saturation?: number
  highlightIntensity?: number
  color?: string
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
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
  type: 'button',
  ripple: true,
  animationType: 'slide',
  animateInactive: false,
  tint: 'auto',
  blur: 0,
  saturation: 150,
  highlightIntensity: 0.3,
  color: undefined,
})

const slots = useSlots()
const hasAnimateSlot = computed(() => !!slots.animate)

const emit = defineEmits<{
  click: [event: MouseEvent]
}>()

// Theme detection for auto tint
const { theme } = useTheme()

// System dark mode detection for 'system' theme
const systemDark = ref(false)
let mediaQuery: MediaQueryList | null = null

onMounted(() => {
  if (typeof window !== 'undefined') {
    mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    systemDark.value = mediaQuery.matches
    const handler = (e: MediaQueryListEvent) => {
      systemDark.value = e.matches
    }
    mediaQuery.addEventListener('change', handler)
    onUnmounted(() => mediaQuery?.removeEventListener('change', handler))
  }

  // Inject SVG glass lens refraction filter (once globally)
  if (typeof document !== 'undefined' && !document.getElementById('s-glass-filters')) {
    // Generate rectangular barrel-distortion displacement map via Canvas
    // Unlike a circular map, this covers the full rectangle for non-circular buttons
    const canvas = document.createElement('canvas')
    const mapW = 256
    const mapH = 256
    canvas.width = mapW
    canvas.height = mapH
    const ctx = canvas.getContext('2d')!
    const imgData = ctx.createImageData(mapW, mapH)
    const strength = 0.7

    for (let y = 0; y < mapH; y++) {
      for (let x = 0; x < mapW; x++) {
        // Normalized coordinates: -1 to +1
        const nx = (x / (mapW - 1)) * 2 - 1
        const ny = (y / (mapH - 1)) * 2 - 1

        // Rectangular edge distance (0 at edges, 1 at center)
        const edgeX = 1 - Math.abs(nx)
        const edgeY = 1 - Math.abs(ny)
        // Smooth falloff using squared edge distances
        const falloff = Math.pow(edgeX, 1.5) * Math.pow(edgeY, 1.5)

        // Displacement pushes pixels outward from center (barrel distortion)
        const r = Math.round(128 + nx * strength * falloff * 127)
        const g = Math.round(128 + ny * strength * falloff * 127)

        const i = (y * mapW + x) * 4
        imgData.data[i] = r // R = horizontal displacement
        imgData.data[i + 1] = g // G = vertical displacement
        imgData.data[i + 2] = 128 // B = unused
        imgData.data[i + 3] = 255 // A = opaque
      }
    }
    ctx.putImageData(imgData, 0, 0)
    const lensDataUri = canvas.toDataURL('image/png')

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    svg.id = 's-glass-filters'
    svg.setAttribute(
      'style',
      'position:absolute;width:0;height:0;overflow:hidden;pointer-events:none'
    )
    svg.setAttribute('aria-hidden', 'true')
    svg.innerHTML = `<defs>
      <filter id="s-glass-refract" primitiveUnits="objectBoundingBox">
        <feImage href="${lensDataUri}" x="0" y="0" width="1" height="1" result="lens" />
        <feDisplacementMap in="SourceGraphic" in2="lens" scale="0.3" xChannelSelector="R" yChannelSelector="G" />
      </filter>
    </defs>`
    document.body.appendChild(svg)
  }
})

const isDarkMode = computed(() => {
  if (theme.value === 'dark') return true
  if (theme.value === 'light') return false
  return systemDark.value
})

const effectiveTint = computed(() => {
  if (props.tint !== 'auto') return props.tint
  return isDarkMode.value ? 'light' : 'dark'
})

// Ripple effect
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
  }, 700)
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
      xs: 'w-6 h-6 text-xs',
      sm: 'w-8 h-8 text-sm',
      md: 'w-10 h-10 text-base',
      lg: 'w-12 h-12 text-lg',
      xl: 'w-14 h-14 text-xl',
    }
    return iconOnlySizes[props.size]
  }

  const sizes = {
    xs: 'px-1.5 py-0.5 text-xs gap-1',
    sm: 'px-2 py-0.5 text-sm gap-1.5',
    md: 'px-2 py-0.5 text-sm gap-2',
    lg: 'px-2.5 py-0.5 text-base gap-2',
    xl: 'px-3 py-0.5 text-lg gap-2.5',
  }
  return sizes[props.size]
})

const iconSizes = computed(() => {
  const sizes = {
    xs: 'text-xs',
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl',
  }
  return sizes[props.size]
})

// Border radius
const radiusClasses = computed(() => {
  const radii = {
    none: 'rounded-none',
    xs: 'rounded-xs',
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    xl: 'rounded-xl',
    '2xl': 'rounded-2xl',
    '3xl': 'rounded-3xl',
    full: 'rounded-full',
  }
  return radii[props.rounded]
})

// Glass computed styles
const computedStyle = computed(() => {
  const style: Record<string, string> = {}
  const isLight = effectiveTint.value === 'light'

  // Glass surface
  style['--glass-blur'] = `${props.blur}px`
  style['--glass-saturation'] = `${props.saturation}%`

  // Background (more transparent for liquid glass)
  style['--glass-bg'] = isLight ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)'

  // Text color
  if (props.color) {
    style['--glass-text'] = props.color
  } else {
    style['--glass-text'] = isLight ? '#ffffff' : '#1a1a1a'
  }

  // Inner glow (replaces border for more realistic glass edge)
  style['--glass-glow'] = isLight ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.15)'

  // Subtle outer shadow
  style['--glass-shadow-outer'] = isLight
    ? '0 2px 12px rgba(0, 0, 0, 0.06)'
    : '0 2px 12px rgba(0, 0, 0, 0.03)'

  // Highlight
  style['--glass-highlight'] = `${props.highlightIntensity}`

  // Hover states
  style['--glass-bg-hover'] = isLight ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.1)'
  style['--glass-shadow-hover'] = isLight
    ? '0 6px 24px rgba(0, 0, 0, 0.1)'
    : '0 6px 24px rgba(0, 0, 0, 0.06)'

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
    bindings.type = props.type
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
    v-bind="{ ...$attrs, ...componentBindings }"
    class="s-glass-button relative inline-flex items-center justify-center font-medium overflow-hidden select-none focus:outline-none"
    :class="[
      sizeClasses,
      radiusClasses,
      {
        'w-full': block,
        'opacity-(--s-opacity-disabled) cursor-not-allowed': disabled || loading,
        'cursor-pointer': !disabled && !loading,
        's-glass-button--loading': loading,
        's-glass-button--animate': hasAnimateSlot && !animateInactive,
        [`s-glass-button--animate-${animationType}`]: hasAnimateSlot && !animateInactive,
      },
    ]"
    :style="computedStyle"
    @click="handleClick"
    @keydown="handleKeydown"
  >
    <!-- Glass ripple effects -->
    <span
      v-for="ripple in ripples"
      :key="ripple.id"
      class="absolute rounded-full pointer-events-none animate-glass-ripple"
      :class="effectiveTint === 'light' ? 'bg-white/20' : 'bg-black/10'"
      :style="{
        left: `${ripple.x}px`,
        top: `${ripple.y}px`,
        width: `${ripple.size}px`,
        height: `${ripple.size}px`,
        zIndex: 2,
      }"
    />

    <!-- Loading spinner -->
    <span
      v-if="loading"
      class="mdi mdi-loading animate-spin relative z-10"
      :class="[iconSizes, { 'absolute inset-0 flex items-center justify-center': preserveSize }]"
    />

    <!-- Content (z-10 to sit above pseudo-element layers) -->
    <span
      class="s-glass-button__content relative z-10 flex items-center justify-center gap-2"
      :class="{ 'opacity-0': loading && preserveSize }"
    >
      <!-- Left icon -->
      <template v-if="!loading || preserveSize">
        <slot name="icon-left">
          <template v-if="iconLeft">
            <component v-if="isIconComponent(iconLeft)" :is="iconLeft" :class="[iconSizes]" />
            <span v-else :class="['mdi', `mdi-${iconLeft}`, iconSizes]" />
          </template>
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
          <template v-if="iconRight">
            <component v-if="isIconComponent(iconRight)" :is="iconRight" :class="[iconSizes]" />
            <span v-else :class="['mdi', `mdi-${iconRight}`, iconSizes]" />
          </template>
        </slot>
      </template>
    </span>

    <!-- Animate slot content -->
    <span
      v-if="hasAnimateSlot"
      class="s-glass-button__animate relative z-10 flex items-center justify-center gap-2"
      :class="[`s-glass-button__animate--${animationType}`]"
    >
      <slot name="animate" />
    </span>
  </component>
</template>

<style scoped>
/* === BASE GLASS SURFACE === */
.s-glass-button {
  background-color: var(--glass-bg);
  color: var(--glass-text);
  box-shadow: var(--glass-shadow-outer);
  transition:
    background-color 0.2s ease-out,
    box-shadow 0.2s ease-out,
    transform 0.2s ease-out;
  isolation: isolate;
}

/* === INNER GLOW + SPECULAR HIGHLIGHT === */
.s-glass-button::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  box-shadow:
    inset 2px 2px 0px -2px var(--glass-glow),
    inset 0 0 3px 1px var(--glass-glow);
  background: linear-gradient(
    180deg,
    rgba(255, 255, 255, var(--glass-highlight)) 0%,
    transparent 50%
  );
  pointer-events: none;
  z-index: 1;
  transition: opacity 0.2s ease-out;
}

/* === GLASS REFRACTION + BLUR (backdrop layer) === */
.s-glass-button::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  z-index: -1;
  backdrop-filter: blur(var(--glass-blur)) saturate(var(--glass-saturation));
  -webkit-backdrop-filter: blur(var(--glass-blur)) saturate(var(--glass-saturation));
  filter: url(#s-glass-refract);
  overflow: hidden;
  isolation: isolate;
  pointer-events: none;
}

/* === HOVER === */
.s-glass-button:not(:disabled):not(.s-glass-button--loading):hover {
  background-color: var(--glass-bg-hover);
  box-shadow: var(--glass-shadow-hover);
  transform: translateY(-1px);
}

/* === ACTIVE === */
.s-glass-button:not(:disabled):not(.s-glass-button--loading):active {
  transform: scale(0.98) translateY(0);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
}

/* === FOCUS VISIBLE === */
.s-glass-button:focus-visible {
  outline: none;
  box-shadow:
    0 0 0 2px rgba(255, 255, 255, 0.3),
    0 0 0 4px var(--s-primary),
    var(--glass-shadow-outer);
}

/* === GLASS RIPPLE === */
@keyframes glass-ripple {
  0% {
    transform: scale(0);
    opacity: 0.4;
  }
  100% {
    transform: scale(1);
    opacity: 0;
  }
}

.animate-glass-ripple {
  animation: glass-ripple 0.7s ease-out forwards;
}

/* === CONTENT === */
.s-glass-button__content {
  transition:
    transform 0.3s ease,
    opacity 0.3s ease;
}

/* === ANIMATE SLOT === */
.s-glass-button__animate {
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

/* Slide animation */
.s-glass-button__animate--slide {
  transform: translateX(100%);
}
.s-glass-button--animate-slide:hover .s-glass-button__content {
  transform: translateX(-100%);
}
.s-glass-button--animate-slide:hover .s-glass-button__animate--slide {
  transform: translateX(0);
}

/* Vertical animation */
.s-glass-button__animate--vertical {
  transform: translateY(100%);
}
.s-glass-button--animate-vertical:hover .s-glass-button__content {
  transform: translateY(-100%);
  opacity: 0;
}
.s-glass-button--animate-vertical:hover .s-glass-button__animate--vertical {
  transform: translateY(0);
}

/* Scale animation */
.s-glass-button__animate--scale {
  transform: scale(0.5);
  opacity: 0;
}
.s-glass-button--animate-scale:hover .s-glass-button__content {
  transform: scale(1.4);
  opacity: 0;
}
.s-glass-button--animate-scale:hover .s-glass-button__animate--scale {
  transform: scale(1);
  opacity: 1;
}

/* Rotate animation */
.s-glass-button__animate--rotate {
  transform: rotate(-180deg);
  opacity: 0;
}
.s-glass-button--animate-rotate:hover .s-glass-button__content {
  transform: rotate(180deg);
  opacity: 0;
}
.s-glass-button--animate-rotate:hover .s-glass-button__animate--rotate {
  transform: rotate(0);
  opacity: 1;
}
</style>
