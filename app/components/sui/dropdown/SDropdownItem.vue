<script setup lang="ts">
// @saka-ui/registry v0.2.10 — dropdown
// Source: saka-ui@0.2.10
// Do not remove this header if you want `saka-ui diff` to work.
import { inject, ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { cn } from '../../../lib/utils'
import { type IconProp, isIconComponent } from '../../../lib/icon'
import { SDropdownContextKey, type SDropdownContext } from './context'

defineOptions({ inheritAttrs: false })

export interface Props {
  /** Unique key for the item */
  itemKey: string
  /** Item label text */
  label?: string
  /** Leading icon (MDI icon name or Vue component) */
  icon?: IconProp
  /** Trailing icon (MDI icon name or Vue component) */
  trailingIcon?: IconProp
  /** Description text below label */
  description?: string
  /** Keyboard shortcut display */
  shortcut?: string
  /** Disable the item */
  disabled?: boolean
  /** Danger/destructive styling */
  danger?: boolean
  /** Checkable state (undefined = not checkable) */
  checked?: boolean
  /** Custom color for this item */
  color?: string
  /** Custom icon color */
  iconColor?: string
}

const props = withDefaults(defineProps<Props>(), {
  label: undefined,
  icon: undefined,
  trailingIcon: undefined,
  description: undefined,
  shortcut: undefined,
  disabled: false,
  danger: false,
  checked: undefined,
  color: undefined,
  iconColor: undefined,
})

const emit = defineEmits<{
  click: [event: MouseEvent]
  'update:checked': [checked: boolean]
}>()

// Inject context from parent dropdown
const context = inject<SDropdownContext>(SDropdownContextKey)

// Register with parent
const itemIndex = ref(-1)

onMounted(() => {
  if (context) {
    itemIndex.value = context.registerItem({
      key: props.itemKey,
      disabled: props.disabled,
    })
  }
})

onBeforeUnmount(() => {
  if (context) {
    context.unregisterItem(props.itemKey)
  }
})

// Size configurations - reduced padding for tighter, cleaner look
const sizeConfig = computed(
  () =>
    ({
      sm: {
        item: 'px-2 py-1 text-xs',
        icon: 'text-sm',
        iconSize: 'w-3.5 h-3.5',
        iconPx: 14,
      },
      md: {
        item: 'px-2.5 py-1.5 text-sm',
        icon: 'text-base',
        iconSize: 'w-4 h-4',
        iconPx: 16,
      },
      lg: {
        item: 'px-3 py-2 text-base',
        icon: 'text-lg',
        iconSize: 'w-5 h-5',
        iconPx: 20,
      },
    })[context?.size ?? 'md']
)

const accentColor = computed(() => props.color ?? context?.color ?? 'var(--s-primary)')

const isHighlighted = computed(() => {
  if (!context || itemIndex.value < 0) return false
  return context.highlightedIndex.value === itemIndex.value
})

const handleClick = (event: MouseEvent) => {
  if (props.disabled) return

  emit('click', event)

  if (props.checked !== undefined) {
    emit('update:checked', !props.checked)
  }

  if (context) {
    context.selectItem(props.itemKey)
  }
}
</script>

<template>
  <div
    role="menuitem"
    :tabindex="disabled ? -1 : 0"
    :class="
      cn(
        's-dropdown-item relative flex items-center cursor-pointer transition-all duration-150 select-none rounded-lg group',
        sizeConfig.item,
        {
          'opacity-(--s-opacity-disabled) cursor-not-allowed': disabled,
          'text-red-500 hover:bg-red-500/10': danger && !disabled,
          'text-foreground hover:bg-accent': !danger && !disabled,
          'bg-accent': isHighlighted && !disabled,
        },
        $attrs.class ?? ''
      )
    "
    v-bind="$attrs"
    @click="handleClick"
  >
    <!-- Checkbox for checkable items -->
    <span
      v-if="checked !== undefined"
      :class="[
        'mdi',
        checked ? 'mdi-checkbox-marked' : 'mdi-checkbox-blank-outline',
        'mr-2.5 transition-all duration-150',
        checked ? '' : 'text-muted-foreground',
      ]"
      :style="{ fontSize: sizeConfig.iconPx + 'px', color: checked ? accentColor : undefined }"
    />

    <!-- Leading icon (component) -->
    <component
      v-else-if="icon && isIconComponent(icon)"
      :is="icon"
      :size="sizeConfig.iconPx"
      :class="[
        'mr-2.5 shrink-0',
        !iconColor && !danger ? 'text-muted-foreground group-hover:text-foreground' : '',
      ]"
      :style="iconColor ? { color: iconColor } : undefined"
    />
    <!-- Leading icon (MDI string) -->
    <span
      v-else-if="icon"
      :class="[
        'mdi',
        `mdi-${icon}`,
        'mr-2.5 shrink-0',
        !iconColor && !danger ? 'text-muted-foreground group-hover:text-foreground' : '',
      ]"
      :style="{ fontSize: sizeConfig.iconPx + 'px', ...(iconColor ? { color: iconColor } : {}) }"
    />

    <!-- Content -->
    <div class="flex-1 min-w-0">
      <slot>
        <div class="truncate">{{ label }}</div>
      </slot>
      <div
        v-if="description"
        class="text-xs truncate mt-0.5"
        :class="danger ? 'text-red-400' : 'text-muted-foreground'"
      >
        {{ description }}
      </div>
    </div>

    <!-- Trailing content -->
    <div class="flex items-center gap-2 ml-4 shrink-0">
      <!-- Keyboard shortcut -->
      <kbd
        v-if="shortcut"
        class="px-1.5 py-0.5 text-[10px] font-mono rounded bg-background text-muted-foreground border border-border"
      >
        {{ shortcut }}
      </kbd>

      <!-- Trailing icon (component) -->
      <component
        v-if="trailingIcon && isIconComponent(trailingIcon)"
        :is="trailingIcon"
        :size="sizeConfig.iconPx"
        class="text-muted-foreground"
      />
      <!-- Trailing icon (MDI string) -->
      <span
        v-else-if="trailingIcon"
        :class="['mdi', `mdi-${trailingIcon}`, 'text-muted-foreground']"
        :style="{ fontSize: sizeConfig.iconPx + 'px' }"
      />

      <!-- Custom trailing slot -->
      <slot name="trailing" />
    </div>
  </div>
</template>

<style scoped>
.s-dropdown-item:focus-visible {
  outline: none;
  background-color: var(--s-accent);
}
</style>
