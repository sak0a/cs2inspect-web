<script setup lang="ts">
// @saka-ui/registry v0.2.10 — option
// Source: saka-ui@0.2.10
// Do not remove this header if you want `saka-ui diff` to work.
import { inject, computed, type CSSProperties } from 'vue'
import { cn } from '../../../lib/utils'
import { type IconProp, isIconComponent } from '../../../lib/icon'

defineOptions({ inheritAttrs: false })

export interface Props {
  value: any
  label?: string
  disabled?: boolean
  icon?: IconProp
  description?: string
  color?: string
}

const props = withDefaults(defineProps<Props>(), {
  label: undefined,
  disabled: false,
  icon: undefined,
  description: undefined,
  color: undefined,
})

// Inject from parent SSelect
const selectContext = inject<{
  modelValue: any
  multiple: boolean
  highlightedIndex: number
  optionIndex: number
  registerOption: (option: { value: any; label: string; disabled: boolean }) => number
  selectOption: (value: any) => void
  isSelected: (value: any) => boolean
  color: string
  size: string
}>('s-select-context')

// Register this option and get its index
const displayLabel = computed(() => props.label ?? String(props.value))

const optionData = {
  value: props.value,
  label: displayLabel.value,
  disabled: props.disabled,
}

const index = selectContext?.registerOption(optionData) ?? -1

const isSelected = computed(() => selectContext?.isSelected(props.value) ?? false)
const isHighlighted = computed(() => selectContext?.highlightedIndex === index)

const resolvedColor = computed(() => props.color ?? selectContext?.color)
const hasCustomColor = computed(() => !!resolvedColor.value)

const handleClick = () => {
  if (props.disabled) return
  selectContext?.selectOption(props.value)
}

// Size configurations
const sizeConfig = computed(() => {
  const sizes = {
    sm: {
      padding: 'py-1.5 px-3',
      text: 'text-xs',
      icon: 'text-sm',
      gap: 'gap-2',
    },
    md: {
      padding: 'py-2 px-3',
      text: 'text-sm',
      icon: 'text-base',
      gap: 'gap-2.5',
    },
    lg: {
      padding: 'py-2.5 px-4',
      text: 'text-base',
      icon: 'text-lg',
      gap: 'gap-3',
    },
  }
  return sizes[selectContext?.size as keyof typeof sizes] ?? sizes.md
})

// Background style for selection/highlight
const bgStyle = computed<CSSProperties>(() => {
  if (isSelected.value && hasCustomColor.value) {
    return {
      backgroundColor: `color-mix(in srgb, ${resolvedColor.value} 15%, transparent)`,
    }
  }
  return {}
})

const bgClass = computed(() => {
  if (isSelected.value && !hasCustomColor.value) {
    return 'bg-primary/15'
  }
  if (!isSelected.value && isHighlighted.value) {
    return 'bg-accent'
  }
  return ''
})
</script>

<template>
  <div
    v-bind="$attrs"
    role="option"
    :aria-selected="isSelected"
    :aria-disabled="disabled"
    :class="
      cn(
        's-option relative flex items-center cursor-pointer transition-all duration-150 select-none',
        sizeConfig.padding,
        sizeConfig.gap,
        {
          'opacity-(--s-opacity-disabled) cursor-not-allowed': disabled,
          'text-foreground': isHighlighted || isSelected,
          'text-muted-foreground hover:text-foreground': !isHighlighted && !isSelected && !disabled,
        }
      )
    "
    @click="handleClick"
  >
    <!-- Highlight/Selection background -->
    <div
      v-if="isHighlighted || isSelected"
      class="absolute inset-0 transition-all duration-150 rounded-lg mx-1"
      :class="[isSelected ? 'opacity-100' : 'opacity-60', bgClass]"
      :style="bgStyle"
    />

    <!-- Icon -->
    <component
      v-if="icon && isIconComponent(icon)"
      :is="icon"
      :class="
        cn(
          'relative z-10 shrink-0',
          sizeConfig.icon,
          isSelected && !hasCustomColor ? 'text-primary' : ''
        )
      "
      :style="isSelected && hasCustomColor ? { color: resolvedColor } : {}"
    />
    <span
      v-else-if="icon"
      :class="
        cn(
          'relative z-10 shrink-0 mdi',
          `mdi-${icon}`,
          sizeConfig.icon,
          isSelected && !hasCustomColor ? 'text-primary' : ''
        )
      "
      :style="isSelected && hasCustomColor ? { color: resolvedColor } : {}"
    />

    <!-- Content -->
    <div class="relative z-10 flex-1 min-w-0">
      <div class="flex items-center gap-2">
        <span :class="sizeConfig.text" class="truncate">
          <slot>{{ displayLabel }}</slot>
        </span>
        <slot name="suffix" />
      </div>
      <p v-if="description" class="text-xs text-muted-foreground truncate mt-0.5">
        {{ description }}
      </p>
    </div>

    <!-- Check mark for selected -->
    <Transition
      enter-active-class="transition-all duration-150 ease-out"
      enter-from-class="scale-0 opacity-0"
      enter-to-class="scale-100 opacity-100"
      leave-active-class="transition-all duration-100 ease-in"
      leave-from-class="scale-100 opacity-100"
      leave-to-class="scale-0 opacity-0"
    >
      <span
        v-if="isSelected"
        class="relative z-10 mdi mdi-check shrink-0"
        :class="[sizeConfig.icon, !hasCustomColor ? 'text-primary' : '']"
        :style="hasCustomColor ? { color: resolvedColor } : {}"
      />
    </Transition>
  </div>
</template>

<style scoped>
.s-option:focus {
  outline: none;
}
</style>
