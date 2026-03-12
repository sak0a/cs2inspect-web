<script setup lang="ts">
// @saka-ui/registry v0.2.10 — dropdown
// Source: saka-ui@0.2.10
// Do not remove this header if you want `saka-ui diff` to work.
/**
 * SDropdown - Advanced Dropdown Menu Component
 * A highly customizable dropdown component for menus, actions, and navigation
 */
import {
  type Ref,
  ref,
  computed,
  provide,
  inject,
  watch,
  onMounted,
  onBeforeUnmount,
  nextTick,
} from 'vue'
import { type IconProp, isIconComponent } from '../../../lib/icon'
import { cn } from '../../../lib/utils'
import {
  SDropdownContextKey,
  SDropdownParentKey,
  type DropdownMenuItem,
  type DropdownPlacement,
  type DropdownTrigger,
  type DropdownSize,
  type DropdownVariant,
  type DropdownAnimation,
} from './context'

defineOptions({ inheritAttrs: false })

export interface Props {
  /** Menu items (alternative to slots) */
  items?: DropdownMenuItem[]
  /** How to trigger the dropdown */
  trigger?: DropdownTrigger
  /** Placement of the dropdown menu */
  placement?: DropdownPlacement
  /** Size variant */
  size?: DropdownSize
  /** Visual variant */
  variant?: DropdownVariant
  /** Accent color */
  color?: string
  /** Animation type */
  animation?: DropdownAnimation
  /** Close when item is selected */
  closeOnSelect?: boolean
  /** Show arrow pointing to trigger */
  arrow?: boolean
  /** Dropdown is disabled */
  disabled?: boolean
  /** Max height of menu */
  maxHeight?: string
  /** Menu width (number = px, string = CSS value) */
  width?: number | string
  /** Min width of menu */
  minWidth?: string
  /** Teleport target */
  teleport?: boolean | string
  /** Z-index for dropdown */
  zIndex?: number
  /** Delay before showing (hover trigger) */
  showDelay?: number
  /** Delay before hiding (hover trigger) */
  hideDelay?: number
  /** Manual control of visibility */
  visible?: boolean
  /** Enable search filtering */
  searchable?: boolean
  /** Search placeholder */
  searchPlaceholder?: string
  /** Offset from trigger */
  offset?: number
  /** Trigger button text */
  label?: string
  /** Trigger button icon */
  icon?: IconProp
  /** Hide the dropdown arrow on trigger */
  hideArrow?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  items: undefined,
  trigger: 'click',
  placement: 'bottom-start',
  size: 'md',
  variant: 'default',
  color: 'var(--s-primary)',
  animation: 'scale',
  closeOnSelect: true,
  arrow: false,
  disabled: false,
  maxHeight: '320px',
  width: undefined,
  minWidth: '180px',
  teleport: true,
  zIndex: 1000,
  showDelay: 100,
  hideDelay: 150,
  visible: undefined,
  searchable: false,
  searchPlaceholder: 'Search...',
  offset: 6,
  label: undefined,
  icon: undefined,
  hideArrow: false,
})

const emit = defineEmits<{
  'update:visible': [value: boolean]
  open: []
  close: []
  select: [key: string, item?: DropdownMenuItem]
}>()

// Refs
const triggerRef = ref<HTMLElement | null>(null)
const dropdownRef = ref<HTMLElement | null>(null)
const searchInputRef = ref<HTMLInputElement | null>(null)
const isOpen = ref(false)
const searchQuery = ref('')
const highlightedIndex = ref(-1)
const registeredItems = ref<{ key: string; disabled: boolean }[]>([])
const menuPosition = ref<{
  top?: number
  bottom?: number
  left?: number
  right?: number
  placement: DropdownPlacement
}>({ placement: props.placement })

let showTimeout: ReturnType<typeof setTimeout> | null = null
let hideTimeout: ReturnType<typeof setTimeout> | null = null

// Nested dropdown support: track child teleported menu refs
const childDropdownRefs = new Set<Ref<HTMLElement | null>>()
const parentDropdown = inject(SDropdownParentKey, null)

provide(SDropdownParentKey, {
  registerChildRef: (childRef: Ref<HTMLElement | null>) => {
    childDropdownRefs.add(childRef)
  },
  unregisterChildRef: (childRef: Ref<HTMLElement | null>) => {
    childDropdownRefs.delete(childRef)
  },
  cancelHide: () => {
    if (hideTimeout) {
      clearTimeout(hideTimeout)
      hideTimeout = null
    }
    // Propagate up the chain for deeply nested dropdowns
    parentDropdown?.cancelHide()
  },
})

// Computed
const isManual = computed(() => props.trigger === 'manual')

const filteredItems = computed(() => {
  if (!props.items || !searchQuery.value) return props.items
  const query = searchQuery.value.toLowerCase()
  return props.items.filter((item) => {
    if (item.divider || item.header) return true
    return item.label?.toLowerCase().includes(query) ?? false
  })
})

const teleportTarget = computed(() => {
  if (props.teleport === true) return 'body'
  if (typeof props.teleport === 'string') return props.teleport
  return undefined
})

const menuStyle = computed(() => {
  const style: Record<string, string> = {
    zIndex: props.zIndex.toString(),
    maxHeight: props.maxHeight,
  }

  if (props.width) {
    style.width = typeof props.width === 'number' ? `${props.width}px` : props.width
  }

  if (props.minWidth) {
    style.minWidth = props.minWidth
  }

  if (menuPosition.value.top !== undefined) {
    style.top = `${menuPosition.value.top}px`
  }
  if (menuPosition.value.bottom !== undefined) {
    style.bottom = `${menuPosition.value.bottom}px`
  }
  if (menuPosition.value.left !== undefined) {
    style.left = `${menuPosition.value.left}px`
  }
  if (menuPosition.value.right !== undefined) {
    style.right = `${menuPosition.value.right}px`
  }

  return style
})

// Size configurations
const sizeConfig = computed(
  () =>
    ({
      sm: {
        trigger: 'px-2 py-0.5 text-xs gap-1.5',
        menu: 'py-1 px-1',
        item: 'px-2 py-0.5 text-xs',
        icon: 'text-sm',
        iconPx: 14,
        search: 'text-xs px-2 py-0.5',
      },
      md: {
        trigger: 'px-2 py-0.5 text-sm gap-2',
        menu: 'py-1 px-1',
        item: 'px-2 py-0.5 text-sm',
        icon: 'text-base',
        iconPx: 16,
        search: 'text-sm px-2 py-0.5',
      },
      lg: {
        trigger: 'px-2.5 py-0.5 text-base gap-2.5',
        menu: 'py-1.5 px-1.5',
        item: 'px-2.5 py-0.5 text-base',
        icon: 'text-lg',
        iconPx: 18,
        search: 'text-base px-2.5 py-0.5',
      },
    })[props.size]
)

const variantClasses = computed(
  () =>
    ({
      default: 'bg-background border border-border shadow-xl',
      filled: 'bg-muted border border-border shadow-lg',
      glass: 'bg-background/80 backdrop-blur-xl border border-border/50 shadow-2xl',
    })[props.variant]
)

// Animation classes
const animationClasses = computed(() => {
  const placement = menuPosition.value.placement
  const isTop = placement.startsWith('top')
  const isBottom = placement.startsWith('bottom')
  const isLeft = placement.startsWith('left')

  return {
    fade: {
      enter: 'transition-opacity duration-(--s-duration-normal) ease-out',
      enterFrom: 'opacity-0',
      enterTo: 'opacity-100',
      leave: 'transition-opacity duration-150 ease-in',
      leaveFrom: 'opacity-100',
      leaveTo: 'opacity-0',
    },
    slide: {
      enter: 'transition-all duration-(--s-duration-normal) ease-out',
      enterFrom: `opacity-0 ${isTop ? 'translate-y-2' : isBottom ? '-translate-y-2' : isLeft ? 'translate-x-2' : '-translate-x-2'}`,
      enterTo: 'opacity-100 translate-x-0 translate-y-0',
      leave: 'transition-all duration-150 ease-in',
      leaveFrom: 'opacity-100 translate-x-0 translate-y-0',
      leaveTo: `opacity-0 ${isTop ? 'translate-y-2' : isBottom ? '-translate-y-2' : isLeft ? 'translate-x-2' : '-translate-x-2'}`,
    },
    scale: {
      enter: 'transition-all duration-(--s-duration-normal) ease-out',
      enterFrom: 'opacity-0 scale-95',
      enterTo: 'opacity-100 scale-100',
      leave: 'transition-all duration-150 ease-in',
      leaveFrom: 'opacity-100 scale-100',
      leaveTo: 'opacity-0 scale-95',
    },
    reveal: {
      enter: 'transition-all duration-250 ease-out',
      enterFrom: 'opacity-0 scale-90 blur-sm',
      enterTo: 'opacity-100 scale-100 blur-0',
      leave: 'transition-all duration-150 ease-in',
      leaveFrom: 'opacity-100 scale-100 blur-0',
      leaveTo: 'opacity-0 scale-90 blur-sm',
    },
  }[props.animation]
})

// Methods
const calculatePosition = () => {
  if (!triggerRef.value) return

  const trigger = triggerRef.value.getBoundingClientRect()
  const viewport = { width: window.innerWidth, height: window.innerHeight }
  const offset = props.offset

  let placement = props.placement
  let top: number | undefined
  let bottom: number | undefined
  let left: number | undefined
  let right: number | undefined

  // Calculate based on placement
  const positions: Record<DropdownPlacement, () => void> = {
    top: () => {
      bottom = viewport.height - trigger.top + offset
      left = trigger.left + trigger.width / 2
    },
    'top-start': () => {
      bottom = viewport.height - trigger.top + offset
      left = trigger.left
    },
    'top-end': () => {
      bottom = viewport.height - trigger.top + offset
      right = viewport.width - trigger.right
    },
    bottom: () => {
      top = trigger.bottom + offset
      left = trigger.left + trigger.width / 2
    },
    'bottom-start': () => {
      top = trigger.bottom + offset
      left = trigger.left
    },
    'bottom-end': () => {
      top = trigger.bottom + offset
      right = viewport.width - trigger.right
    },
    left: () => {
      top = trigger.top + trigger.height / 2
      right = viewport.width - trigger.left + offset
    },
    'left-start': () => {
      top = trigger.top
      right = viewport.width - trigger.left + offset
    },
    'left-end': () => {
      bottom = viewport.height - trigger.bottom
      right = viewport.width - trigger.left + offset
    },
    right: () => {
      top = trigger.top + trigger.height / 2
      left = trigger.right + offset
    },
    'right-start': () => {
      top = trigger.top
      left = trigger.right + offset
    },
    'right-end': () => {
      bottom = viewport.height - trigger.bottom
      left = trigger.right + offset
    },
  }

  positions[placement]()

  // Auto-flip if needed
  const menuHeight = parseInt(props.maxHeight) || 320
  const menuWidth = props.width ? (typeof props.width === 'number' ? props.width : 200) : 200

  if (
    placement.startsWith('bottom') &&
    top !== undefined &&
    top + menuHeight > viewport.height - 10
  ) {
    placement = placement.replace('bottom', 'top') as DropdownPlacement
    top = undefined
    bottom = viewport.height - trigger.top + offset
  } else if (
    placement.startsWith('top') &&
    bottom !== undefined &&
    viewport.height - bottom + menuHeight > viewport.height - 10
  ) {
    placement = placement.replace('top', 'bottom') as DropdownPlacement
    bottom = undefined
    top = trigger.bottom + offset
  }

  // Constrain to viewport
  if (left !== undefined && left + menuWidth > viewport.width - 10) {
    left = viewport.width - menuWidth - 10
  }
  if (left !== undefined && left < 10) {
    left = 10
  }

  menuPosition.value = { top, bottom, left, right, placement }
}

const open = async () => {
  if (props.disabled || isOpen.value) return

  if (hideTimeout) {
    clearTimeout(hideTimeout)
    hideTimeout = null
  }

  // Cancel parent hide timeout when a nested dropdown opens
  parentDropdown?.cancelHide()

  isOpen.value = true
  emit('update:visible', true)
  emit('open')

  await nextTick()
  calculatePosition()

  if (props.searchable && searchInputRef.value) {
    searchInputRef.value.focus()
  }
}

const close = () => {
  if (!isOpen.value) return

  if (showTimeout) {
    clearTimeout(showTimeout)
    showTimeout = null
  }

  isOpen.value = false
  searchQuery.value = ''
  highlightedIndex.value = -1
  emit('update:visible', false)
  emit('close')
}

const toggle = () => {
  if (isOpen.value) {
    close()
  } else {
    open()
  }
}

const handleTriggerClick = (event: MouseEvent) => {
  if (props.trigger === 'click' && !props.disabled) {
    event.preventDefault()
    toggle()
  }
}

const handleTriggerContextMenu = (event: MouseEvent) => {
  if (props.trigger === 'context' && !props.disabled) {
    event.preventDefault()
    toggle()
  }
}

const handleTriggerMouseEnter = () => {
  if (props.trigger === 'hover' && !props.disabled) {
    showTimeout = setTimeout(open, props.showDelay)
  }
}

const handleTriggerMouseLeave = () => {
  if (props.trigger === 'hover' && !props.disabled) {
    hideTimeout = setTimeout(close, props.hideDelay)
  }
}

const handleMenuMouseEnter = () => {
  if (props.trigger === 'hover') {
    if (hideTimeout) {
      clearTimeout(hideTimeout)
      hideTimeout = null
    }
  }
  // Also cancel parent hide when entering a nested menu
  parentDropdown?.cancelHide()
}

const handleMenuMouseLeave = () => {
  if (props.trigger === 'hover') {
    hideTimeout = setTimeout(close, props.hideDelay)
  }
}

const handleClickOutside = (event: MouseEvent) => {
  const target = event.target as Node
  if (
    triggerRef.value &&
    dropdownRef.value &&
    !triggerRef.value.contains(target) &&
    !dropdownRef.value.contains(target) &&
    // Don't close if click is inside a child dropdown's teleported menu
    ![...childDropdownRefs].some((childRef) => childRef.value?.contains(target))
  ) {
    close()
  }
}

const handleKeydown = (event: KeyboardEvent) => {
  if (!isOpen.value) {
    if (event.key === 'Enter' || event.key === ' ' || event.key === 'ArrowDown') {
      event.preventDefault()
      open()
    }
    return
  }

  const enabledItems = registeredItems.value.filter((i) => !i.disabled)

  switch (event.key) {
    case 'Escape':
      event.preventDefault()
      close()
      triggerRef.value?.focus()
      break
    case 'ArrowDown':
      event.preventDefault()
      highlightedIndex.value = Math.min(highlightedIndex.value + 1, enabledItems.length - 1)
      if (highlightedIndex.value < 0) highlightedIndex.value = 0
      break
    case 'ArrowUp':
      event.preventDefault()
      highlightedIndex.value = Math.max(highlightedIndex.value - 1, 0)
      break
    case 'Home':
      event.preventDefault()
      highlightedIndex.value = 0
      break
    case 'End':
      event.preventDefault()
      highlightedIndex.value = enabledItems.length - 1
      break
    case 'Enter':
    case ' ':
      event.preventDefault()
      if (highlightedIndex.value >= 0 && enabledItems[highlightedIndex.value]) {
        selectItem(enabledItems[highlightedIndex.value]!.key)
      }
      break
    case 'Tab':
      close()
      break
  }
}

const registerItem = (item: { key: string; disabled: boolean }) => {
  const existing = registeredItems.value.findIndex((i) => i.key === item.key)
  if (existing >= 0) {
    registeredItems.value[existing] = item
    return existing
  }
  registeredItems.value.push(item)
  return registeredItems.value.length - 1
}

const unregisterItem = (key: string) => {
  const index = registeredItems.value.findIndex((i) => i.key === key)
  if (index >= 0) {
    registeredItems.value.splice(index, 1)
  }
}

const selectItem = (key: string) => {
  const item = props.items?.find((i) => i.key === key)
  emit('select', key, item)

  if (item?.onClick) {
    item.onClick()
  }

  if (props.closeOnSelect) {
    close()
  }
}

// Watchers
watch(
  () => props.visible,
  (val) => {
    if (isManual.value && val !== undefined) {
      if (val) open()
      else close()
    }
  }
)

watch(isOpen, (val) => {
  if (val) {
    window.addEventListener('scroll', calculatePosition, true)
    window.addEventListener('resize', calculatePosition)
  } else {
    window.removeEventListener('scroll', calculatePosition, true)
    window.removeEventListener('resize', calculatePosition)
  }
})

// Register this dropdown's menu ref with parent (for nested teleported menus)
if (parentDropdown) {
  parentDropdown.registerChildRef(dropdownRef)
}

// Lifecycle
onMounted(() => {
  document.addEventListener('mousedown', handleClickOutside)
})

onBeforeUnmount(() => {
  if (showTimeout) clearTimeout(showTimeout)
  if (hideTimeout) clearTimeout(hideTimeout)
  if (parentDropdown) {
    parentDropdown.unregisterChildRef(dropdownRef)
  }
  document.removeEventListener('mousedown', handleClickOutside)
  window.removeEventListener('scroll', calculatePosition, true)
  window.removeEventListener('resize', calculatePosition)
})

// Provide context
provide(SDropdownContextKey, {
  size: props.size,
  color: props.color,
  closeOnSelect: props.closeOnSelect,
  highlightedIndex,
  registerItem,
  unregisterItem,
  selectItem,
  close,
})

// Expose for manual control
defineExpose({
  open,
  close,
  toggle,
})
</script>

<template>
  <div :class="cn('s-dropdown relative inline-block', $attrs.class ?? '')" v-bind="$attrs">
    <!-- Trigger -->
    <div
      ref="triggerRef"
      class="s-dropdown-trigger outline-none"
      tabindex="0"
      :aria-expanded="isOpen"
      :aria-haspopup="true"
      :aria-disabled="disabled"
      @click="handleTriggerClick"
      @contextmenu="handleTriggerContextMenu"
      @mouseenter="handleTriggerMouseEnter"
      @mouseleave="handleTriggerMouseLeave"
      @keydown="handleKeydown"
    >
      <slot name="trigger">
        <!-- Default trigger button -->
        <button
          type="button"
          class="s-dropdown-btn inline-flex items-center justify-center font-medium rounded-lg border transition-all duration-(--s-duration-normal) outline-none select-none"
          :class="[
            sizeConfig.trigger,
            disabled
              ? 'opacity-(--s-opacity-disabled) cursor-not-allowed bg-accent border-border text-muted-foreground'
              : 'bg-muted border-border text-foreground hover:bg-accent hover:border-input focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          ]"
          :disabled="disabled"
        >
          <component v-if="icon && isIconComponent(icon)" :is="icon" :size="sizeConfig.iconPx" />
          <span
            v-else-if="icon"
            :class="['mdi', `mdi-${icon}`]"
            :style="{ fontSize: sizeConfig.iconPx + 'px' }"
          />
          <span v-if="label">{{ label }}</span>
          <span
            v-if="!hideArrow"
            class="mdi mdi-chevron-down transition-transform duration-(--s-duration-normal)"
            :class="{ 'rotate-180': isOpen }"
            :style="{ fontSize: sizeConfig.iconPx + 'px' }"
          />
        </button>
      </slot>
    </div>

    <!-- Dropdown Menu -->
    <Teleport v-if="teleportTarget" :to="teleportTarget" :disabled="!teleportTarget">
      <Transition
        :enter-active-class="animationClasses.enter"
        :enter-from-class="animationClasses.enterFrom"
        :enter-to-class="animationClasses.enterTo"
        :leave-active-class="animationClasses.leave"
        :leave-from-class="animationClasses.leaveFrom"
        :leave-to-class="animationClasses.leaveTo"
      >
        <div
          v-if="isOpen"
          ref="dropdownRef"
          role="menu"
          class="s-dropdown-menu fixed rounded-xl overflow-hidden"
          :class="[sizeConfig.menu, variantClasses]"
          :style="menuStyle"
          @mouseenter="handleMenuMouseEnter"
          @mouseleave="handleMenuMouseLeave"
        >
          <!-- Arrow pointer -->
          <div
            v-if="arrow"
            class="s-dropdown-arrow absolute w-2.5 h-2.5 rotate-45 bg-background border border-border"
            :class="{
              'bottom-full left-4 -mb-1 border-b-0 border-r-0':
                menuPosition.placement.startsWith('bottom'),
              'top-full left-4 -mt-1 border-t-0 border-l-0':
                menuPosition.placement.startsWith('top'),
              'left-full top-4 -ml-1 border-l-0 border-b-0':
                menuPosition.placement.startsWith('right'),
              'right-full top-4 -mr-1 border-r-0 border-t-0':
                menuPosition.placement.startsWith('left'),
            }"
          />

          <!-- Search input -->
          <div v-if="searchable" class="p-2 border-b border-border">
            <div class="relative">
              <span
                class="mdi mdi-magnify absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                :style="{ fontSize: sizeConfig.iconPx + 'px' }"
              />
              <input
                ref="searchInputRef"
                v-model="searchQuery"
                type="text"
                :placeholder="searchPlaceholder"
                :class="sizeConfig.search"
                class="w-full pl-9 pr-3 bg-accent border border-border rounded-lg outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-foreground placeholder:text-muted-foreground"
                @keydown="handleKeydown"
              />
            </div>
          </div>

          <!-- Header slot -->
          <slot name="header" />

          <!-- Menu content -->
          <div
            class="overflow-y-auto overflow-x-hidden overscroll-contain"
            :style="{ maxHeight: searchable ? `calc(${maxHeight} - 60px)` : maxHeight }"
          >
            <!-- Render from items prop -->
            <template v-if="filteredItems && filteredItems.length > 0">
              <template v-for="(item, index) in filteredItems" :key="item.key || `item-${index}`">
                <!-- Divider -->
                <div v-if="item.divider" class="my-1 h-px bg-border/60" />

                <!-- Section header -->
                <div
                  v-else-if="item.header"
                  class="px-2.5 pt-2 pb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"
                >
                  {{ item.header }}
                </div>

                <!-- Menu item -->
                <div
                  v-else
                  role="menuitem"
                  :tabindex="item.disabled ? -1 : 0"
                  class="s-dropdown-item relative flex items-center cursor-pointer transition-all duration-150 select-none rounded-lg"
                  :class="[
                    sizeConfig.item,
                    {
                      'opacity-(--s-opacity-disabled) cursor-not-allowed': item.disabled,
                      'text-red-500 hover:bg-red-500/10': item.danger && !item.disabled,
                      'text-foreground hover:bg-accent': !item.danger && !item.disabled,
                      'bg-accent': highlightedIndex === index && !item.disabled,
                    },
                  ]"
                  @click="!item.disabled && selectItem(item.key)"
                  @mouseenter="highlightedIndex = index"
                >
                  <!-- Checkbox for checkable items -->
                  <span
                    v-if="item.checked !== undefined"
                    :class="[
                      'mdi',
                      item.checked ? 'mdi-checkbox-marked' : 'mdi-checkbox-blank-outline',
                      'mr-2 transition-all duration-150',
                      item.checked ? '' : 'text-muted-foreground',
                    ]"
                    :style="{
                      fontSize: sizeConfig.iconPx + 'px',
                      color: item.checked ? color : undefined,
                    }"
                  />

                  <!-- Leading icon (component) -->
                  <component
                    v-else-if="item.icon && isIconComponent(item.icon)"
                    :is="item.icon"
                    :size="sizeConfig.iconPx"
                    :class="['mr-2.5', item.danger ? '' : 'text-muted-foreground']"
                  />
                  <!-- Leading icon (MDI string) -->
                  <span
                    v-else-if="item.icon"
                    :class="[
                      'mdi',
                      `mdi-${item.icon}`,
                      'mr-2.5',
                      item.danger ? '' : 'text-muted-foreground',
                    ]"
                    :style="{ fontSize: sizeConfig.iconPx + 'px' }"
                  />

                  <!-- Content -->
                  <div class="flex-1 min-w-0">
                    <div class="truncate">{{ item.label }}</div>
                    <div
                      v-if="item.description"
                      class="text-xs truncate mt-0.5"
                      :class="item.danger ? 'text-red-400' : 'text-muted-foreground'"
                    >
                      {{ item.description }}
                    </div>
                  </div>

                  <!-- Trailing content -->
                  <div class="flex items-center gap-2 ml-4 shrink-0">
                    <!-- Keyboard shortcut -->
                    <kbd
                      v-if="item.shortcut"
                      class="px-1.5 py-0.5 text-[10px] font-mono rounded bg-accent text-muted-foreground border border-border"
                    >
                      {{ item.shortcut }}
                    </kbd>

                    <!-- Trailing icon (component) -->
                    <component
                      v-if="item.trailingIcon && isIconComponent(item.trailingIcon)"
                      :is="item.trailingIcon"
                      :size="sizeConfig.iconPx"
                      class="text-muted-foreground"
                    />
                    <!-- Trailing icon (MDI string) -->
                    <span
                      v-else-if="item.trailingIcon"
                      :class="['mdi', `mdi-${item.trailingIcon}`, 'text-muted-foreground']"
                      :style="{ fontSize: sizeConfig.iconPx + 'px' }"
                    />

                    <!-- Submenu indicator -->
                    <span
                      v-if="item.children && item.children.length > 0"
                      class="mdi mdi-chevron-right text-muted-foreground"
                      :style="{ fontSize: sizeConfig.iconPx + 'px' }"
                    />
                  </div>
                </div>
              </template>
            </template>

            <!-- Slots for custom content -->
            <slot v-else />

            <!-- Empty state -->
            <div
              v-if="searchable && searchQuery && (!filteredItems || filteredItems.length === 0)"
              class="px-4 py-8 text-center"
            >
              <span
                class="mdi mdi-magnify-close text-muted-foreground mb-2 block"
                :style="{ fontSize: '30px' }"
              />
              <p class="text-sm text-muted-foreground">No results found</p>
            </div>
          </div>

          <!-- Footer slot -->
          <slot name="footer" />
        </div>
      </Transition>
    </Teleport>

    <!-- Non-teleported fallback -->
    <template v-else>
      <Transition
        :enter-active-class="animationClasses.enter"
        :enter-from-class="animationClasses.enterFrom"
        :enter-to-class="animationClasses.enterTo"
        :leave-active-class="animationClasses.leave"
        :leave-from-class="animationClasses.leaveFrom"
        :leave-to-class="animationClasses.leaveTo"
      >
        <div
          v-if="isOpen"
          ref="dropdownRef"
          role="menu"
          class="s-dropdown-menu absolute mt-1.5 rounded-xl overflow-hidden"
          :class="[sizeConfig.menu, variantClasses]"
          :style="{ minWidth: minWidth, maxHeight: maxHeight, zIndex: zIndex }"
          @mouseenter="handleMenuMouseEnter"
          @mouseleave="handleMenuMouseLeave"
        >
          <div class="overflow-y-auto overscroll-contain" :style="{ maxHeight: maxHeight }">
            <slot />
          </div>
        </div>
      </Transition>
    </template>
  </div>
</template>

<style scoped>
.s-dropdown-trigger:focus-visible {
  outline: none;
}

.s-dropdown-menu {
  transform-origin: top left;
  scrollbar-width: thin;
  scrollbar-color: var(--s-border) transparent;
}

.s-dropdown-menu::-webkit-scrollbar {
  width: 6px;
}

.s-dropdown-menu::-webkit-scrollbar-track {
  background: transparent;
}

.s-dropdown-menu::-webkit-scrollbar-thumb {
  background: var(--s-border);
  border-radius: 3px;
}

.s-dropdown-menu::-webkit-scrollbar-thumb:hover {
  background: var(--s-input);
}

/* Submenu positioning for bottom placements */
[data-placement^='bottom'] .s-dropdown-menu {
  transform-origin: top;
}

[data-placement^='top'] .s-dropdown-menu {
  transform-origin: bottom;
}

[data-placement^='left'] .s-dropdown-menu {
  transform-origin: right;
}

[data-placement^='right'] .s-dropdown-menu {
  transform-origin: left;
}
</style>
