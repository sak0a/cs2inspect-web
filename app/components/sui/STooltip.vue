<script setup lang="ts">
// @saka-ui/registry v0.2.10 — tooltip
// Source: saka-ui@0.2.10
// Do not remove this header if you want `saka-ui diff` to work.
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick, type CSSProperties } from 'vue'
import { cn } from '../../lib/utils'

defineOptions({ inheritAttrs: false })

export interface Props {
  placement?:
    | 'top'
    | 'bottom'
    | 'left'
    | 'right'
    | 'top-start'
    | 'top-end'
    | 'bottom-start'
    | 'bottom-end'
    | 'left-start'
    | 'left-end'
    | 'right-start'
    | 'right-end'
  trigger?: 'hover' | 'click' | 'focus' | 'manual'
  content?: string
  showDelay?: number
  hideDelay?: number
  offset?: number
  arrow?: boolean
  arrowSize?: number
  theme?: 'dark' | 'light' | 'custom'
  color?: string
  textColor?: string
  maxWidth?: string
  disabled?: boolean
  visible?: boolean
  teleport?: string
  zIndex?: number
  interactive?: boolean
  transition?: string
  tooltipClass?: string
}

const props = withDefaults(defineProps<Props>(), {
  placement: 'top',
  trigger: 'hover',
  content: undefined,
  showDelay: 100,
  hideDelay: 100,
  offset: 8,
  arrow: true,
  arrowSize: 6,
  theme: 'dark',
  color: undefined,
  textColor: undefined,
  maxWidth: '300px',
  disabled: false,
  visible: undefined,
  teleport: 'body',
  zIndex: 9999,
  interactive: false,
  transition: 'tooltip-fade',
  tooltipClass: undefined,
})

const emit = defineEmits<{
  show: []
  hide: []
  toggle: [visible: boolean]
  'update:visible': [visible: boolean]
}>()

// Refs
const triggerRef = ref<HTMLElement | null>(null)
const tooltipRef = ref<HTMLElement | null>(null)
const isVisible = ref(false)
const actualPlacement = ref(props.placement)
const tooltipPosition = ref({ top: 0, left: 0 })
const arrowPosition = ref({ top: '', left: '', right: '', bottom: '' })

let showTimeout: ReturnType<typeof setTimeout> | null = null
let hideTimeout: ReturnType<typeof setTimeout> | null = null

// Computed
const isManual = computed(() => props.trigger === 'manual')

const tooltipStyle = computed<CSSProperties>(() => {
  const styles: CSSProperties = {
    position: 'fixed',
    top: `${tooltipPosition.value.top}px`,
    left: `${tooltipPosition.value.left}px`,
    maxWidth: props.maxWidth,
    zIndex: props.zIndex,
  }

  if (props.theme === 'custom') {
    if (props.color) styles.backgroundColor = props.color
    if (props.textColor) styles.color = props.textColor
  }

  return styles
})

const arrowStyle = computed<CSSProperties>(() => {
  const styles: Record<string, string> = {
    position: 'absolute',
    width: '0',
    height: '0',
    borderStyle: 'solid',
  }

  const size = props.arrowSize
  const placement = actualPlacement.value

  // Set arrow position
  if (arrowPosition.value.top) styles.top = arrowPosition.value.top
  if (arrowPosition.value.left) styles.left = arrowPosition.value.left
  if (arrowPosition.value.right) styles.right = arrowPosition.value.right
  if (arrowPosition.value.bottom) styles.bottom = arrowPosition.value.bottom

  // Set arrow borders based on placement
  if (placement.startsWith('top')) {
    styles.borderWidth = `${size}px ${size}px 0 ${size}px`
    styles.borderColor = `${getArrowColor()} transparent transparent transparent`
    styles.bottom = `-${size}px`
  } else if (placement.startsWith('bottom')) {
    styles.borderWidth = `0 ${size}px ${size}px ${size}px`
    styles.borderColor = `transparent transparent ${getArrowColor()} transparent`
    styles.top = `-${size}px`
  } else if (placement.startsWith('left')) {
    styles.borderWidth = `${size}px 0 ${size}px ${size}px`
    styles.borderColor = `transparent transparent transparent ${getArrowColor()}`
    styles.right = `-${size}px`
  } else if (placement.startsWith('right')) {
    styles.borderWidth = `${size}px ${size}px ${size}px 0`
    styles.borderColor = `transparent ${getArrowColor()} transparent transparent`
    styles.left = `-${size}px`
  }

  return styles as CSSProperties
})

const tooltipClasses = computed(() => {
  return cn(
    'px-3 py-2 rounded-md text-sm leading-normal break-words pointer-events-auto shadow-lg',
    props.theme === 'dark' && 'bg-popover text-popover-foreground',
    props.theme === 'light' && 'bg-background text-foreground border border-border',
    props.theme === 'custom' && '',
    props.tooltipClass
  )
})

// Methods
function getArrowColor(): string {
  if (props.theme === 'custom' && props.color) return props.color
  if (props.theme === 'light') return 'var(--s-background)'
  return 'var(--s-popover)'
}

function calculatePosition() {
  if (!triggerRef.value || !tooltipRef.value) return

  const trigger = triggerRef.value.getBoundingClientRect()
  const tooltip = tooltipRef.value.getBoundingClientRect()
  const viewport = {
    width: window.innerWidth,
    height: window.innerHeight,
  }

  let placement = props.placement
  let top = 0
  let left = 0

  // Calculate initial position based on placement
  const positions: Record<string, { top: number; left: number }> = {
    top: {
      top: trigger.top - tooltip.height - props.offset,
      left: trigger.left + trigger.width / 2 - tooltip.width / 2,
    },
    'top-start': {
      top: trigger.top - tooltip.height - props.offset,
      left: trigger.left,
    },
    'top-end': {
      top: trigger.top - tooltip.height - props.offset,
      left: trigger.right - tooltip.width,
    },
    bottom: {
      top: trigger.bottom + props.offset,
      left: trigger.left + trigger.width / 2 - tooltip.width / 2,
    },
    'bottom-start': {
      top: trigger.bottom + props.offset,
      left: trigger.left,
    },
    'bottom-end': {
      top: trigger.bottom + props.offset,
      left: trigger.right - tooltip.width,
    },
    left: {
      top: trigger.top + trigger.height / 2 - tooltip.height / 2,
      left: trigger.left - tooltip.width - props.offset,
    },
    'left-start': {
      top: trigger.top,
      left: trigger.left - tooltip.width - props.offset,
    },
    'left-end': {
      top: trigger.bottom - tooltip.height,
      left: trigger.left - tooltip.width - props.offset,
    },
    right: {
      top: trigger.top + trigger.height / 2 - tooltip.height / 2,
      left: trigger.right + props.offset,
    },
    'right-start': {
      top: trigger.top,
      left: trigger.right + props.offset,
    },
    'right-end': {
      top: trigger.bottom - tooltip.height,
      left: trigger.right + props.offset,
    },
  }

  const pos = positions[placement]!
  top = pos.top
  left = pos.left

  // Edge detection and auto-repositioning
  const overflow = {
    top: top < 0,
    bottom: top + tooltip.height > viewport.height,
    left: left < 0,
    right: left + tooltip.width > viewport.width,
  }

  // Flip placement if needed
  if (placement.startsWith('top') && overflow.top) {
    placement = placement.replace('top', 'bottom') as typeof props.placement
    const newPos = positions[placement]!
    top = newPos.top
  } else if (placement.startsWith('bottom') && overflow.bottom) {
    placement = placement.replace('bottom', 'top') as typeof props.placement
    const newPos = positions[placement]!
    top = newPos.top
  } else if (placement.startsWith('left') && overflow.left) {
    placement = placement.replace('left', 'right') as typeof props.placement
    const newPos = positions[placement]!
    left = newPos.left
  } else if (placement.startsWith('right') && overflow.right) {
    placement = placement.replace('right', 'left') as typeof props.placement
    const newPos = positions[placement]!
    left = newPos.left
  }

  // Constrain to viewport
  if (left < 8) left = 8
  if (left + tooltip.width > viewport.width - 8) {
    left = viewport.width - tooltip.width - 8
  }
  if (top < 8) top = 8
  if (top + tooltip.height > viewport.height - 8) {
    top = viewport.height - tooltip.height - 8
  }

  actualPlacement.value = placement
  tooltipPosition.value = { top, left }

  // Calculate arrow position
  calculateArrowPosition(trigger, tooltip, placement)
}

function calculateArrowPosition(
  trigger: DOMRect,
  tooltip: DOMRect,
  placement: typeof props.placement
) {
  const arrowPos: typeof arrowPosition.value = { top: '', left: '', right: '', bottom: '' }

  if (placement.startsWith('top') || placement.startsWith('bottom')) {
    const triggerCenter = trigger.left + trigger.width / 2
    const tooltipLeft = tooltipPosition.value.left
    const arrowLeft = triggerCenter - tooltipLeft - props.arrowSize
    arrowPos.left = `${Math.max(props.arrowSize, Math.min(arrowLeft, tooltip.width - props.arrowSize * 3))}px`
  } else if (placement.startsWith('left') || placement.startsWith('right')) {
    const triggerCenter = trigger.top + trigger.height / 2
    const tooltipTop = tooltipPosition.value.top
    const arrowTop = triggerCenter - tooltipTop - props.arrowSize
    arrowPos.top = `${Math.max(props.arrowSize, Math.min(arrowTop, tooltip.height - props.arrowSize * 3))}px`
  }

  arrowPosition.value = arrowPos
}

function show() {
  if (props.disabled || isVisible.value) return

  if (hideTimeout) {
    clearTimeout(hideTimeout)
    hideTimeout = null
  }

  showTimeout = setTimeout(async () => {
    isVisible.value = true
    emit('update:visible', true)
    emit('show')
    emit('toggle', true)

    await nextTick()
    calculatePosition()
  }, props.showDelay)
}

function hide() {
  if (!isVisible.value) return

  if (showTimeout) {
    clearTimeout(showTimeout)
    showTimeout = null
  }

  hideTimeout = setTimeout(() => {
    isVisible.value = false
    emit('update:visible', false)
    emit('hide')
    emit('toggle', false)
  }, props.hideDelay)
}

function toggle() {
  if (isVisible.value) {
    hide()
  } else {
    show()
  }
}

function handleTriggerMouseEnter() {
  if (props.trigger === 'hover' && !props.disabled) {
    show()
  }
}

function handleTriggerMouseLeave() {
  if (props.trigger === 'hover' && !props.disabled && !props.interactive) {
    hide()
  }
}

function handleTriggerClick() {
  if (props.trigger === 'click' && !props.disabled) {
    toggle()
  }
}

function handleTriggerFocus() {
  if (props.trigger === 'focus' && !props.disabled) {
    show()
  }
}

function handleTriggerBlur() {
  if (props.trigger === 'focus' && !props.disabled) {
    hide()
  }
}

function handleTooltipMouseEnter() {
  if (props.interactive && props.trigger === 'hover') {
    if (hideTimeout) {
      clearTimeout(hideTimeout)
      hideTimeout = null
    }
  }
}

function handleTooltipMouseLeave() {
  if (props.interactive && props.trigger === 'hover') {
    hide()
  }
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape' && isVisible.value) {
    hide()
  }
}

function handleClickOutside(event: MouseEvent) {
  if (props.trigger !== 'click') return

  const target = event.target as Node
  if (
    triggerRef.value &&
    tooltipRef.value &&
    !triggerRef.value.contains(target) &&
    !tooltipRef.value.contains(target)
  ) {
    hide()
  }
}

function handleScroll() {
  if (isVisible.value) {
    calculatePosition()
  }
}

// Watchers
watch(
  () => props.visible,
  (newVal) => {
    if (isManual.value && newVal !== undefined) {
      if (newVal) {
        show()
      } else {
        hide()
      }
    }
  }
)

// Lifecycle
onMounted(() => {
  if (props.trigger === 'click') {
    document.addEventListener('click', handleClickOutside)
  }
  document.addEventListener('keydown', handleKeydown)
  window.addEventListener('scroll', handleScroll, true)
  window.addEventListener('resize', handleScroll)
})

onBeforeUnmount(() => {
  if (showTimeout) clearTimeout(showTimeout)
  if (hideTimeout) clearTimeout(hideTimeout)
  document.removeEventListener('click', handleClickOutside)
  document.removeEventListener('keydown', handleKeydown)
  window.removeEventListener('scroll', handleScroll, true)
  window.removeEventListener('resize', handleScroll)
})

// Expose methods for manual control
defineExpose({
  show,
  hide,
  toggle,
})
</script>

<template>
  <div :class="cn('inline-block', ($attrs as any).class)" v-bind="{ ...$attrs, class: undefined }">
    <!-- Trigger slot -->
    <div
      ref="triggerRef"
      class="inline-block"
      @mouseenter="handleTriggerMouseEnter"
      @mouseleave="handleTriggerMouseLeave"
      @click="handleTriggerClick"
      @focus="handleTriggerFocus"
      @blur="handleTriggerBlur"
    >
      <slot />
    </div>

    <!-- Tooltip content -->
    <Teleport :to="teleport">
      <Transition :name="transition">
        <div
          v-show="isVisible"
          ref="tooltipRef"
          :class="tooltipClasses"
          :style="tooltipStyle"
          role="tooltip"
          @mouseenter="handleTooltipMouseEnter"
          @mouseleave="handleTooltipMouseLeave"
        >
          <div class="relative z-1">
            <slot name="content">
              {{ content }}
            </slot>
          </div>

          <!-- Arrow -->
          <div v-if="arrow" :style="arrowStyle" />
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
/* Transitions */
.tooltip-fade-enter-active,
.tooltip-fade-leave-active {
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
}

.tooltip-fade-enter-from,
.tooltip-fade-leave-to {
  opacity: 0;
  transform: scale(0.95);
}

.tooltip-fade-enter-to,
.tooltip-fade-leave-from {
  opacity: 1;
  transform: scale(1);
}
</style>
