<script setup lang="ts">
// @saka-ui/registry v0.2.11 — switch
// Source: saka-ui@0.2.11
// Do not remove this header if you want `saka-ui diff` to work.
import { computed, useAttrs, type CSSProperties } from 'vue'
import { cn } from '../../lib/utils'
import { type IconProp, isIconComponent } from '../../lib/icon'

defineOptions({ inheritAttrs: false })

const attrs = useAttrs()

export interface Props {
  modelValue?: boolean | string | number
  type?: 'inset' | 'outset'
  size?: 'sm' | 'md' | 'lg'
  color?: string
  disabled?: boolean
  loading?: boolean
  checkedValue?: boolean | string | number
  uncheckedValue?: boolean | string | number
  labelBefore?: string
  labelAfter?: string
  checkedIcon?: IconProp
  uncheckedIcon?: IconProp
  checkedText?: string
  uncheckedText?: string
  trackClass?: string
  thumbClass?: string
  labelClass?: string
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: false,
  type: 'inset',
  size: 'md',
  color: undefined,
  disabled: false,
  loading: false,
  checkedValue: true,
  uncheckedValue: false,
  labelBefore: undefined,
  labelAfter: undefined,
  checkedIcon: undefined,
  uncheckedIcon: undefined,
  checkedText: undefined,
  uncheckedText: undefined,
  trackClass: undefined,
  thumbClass: undefined,
  labelClass: undefined
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean | string | number]
  'change': [value: boolean | string | number]
}>()

const isChecked = computed(() => props.modelValue === props.checkedValue)
const hasTrackText = computed(() => props.checkedText || props.uncheckedText)

const toggle = () => {
  if (props.disabled || props.loading) return
  const newValue = isChecked.value ? props.uncheckedValue : props.checkedValue
  emit('update:modelValue', newValue)
  emit('change', newValue)
}

const handleKeydown = (e: KeyboardEvent) => {
  if (e.key === ' ' || e.key === 'Enter') {
    e.preventDefault()
    toggle()
  }
}

// Size configurations for inset type (thumb inside track)
const insetSizes = {
  sm: {
    track: 'w-8 h-4',
    thumb: 'w-3 h-3',
    thumbTranslate: 'translate-x-4',
    icon: 'text-[8px]',
    label: 'text-xs',
    trackText: 'text-[8px]'
  },
  md: {
    track: 'w-11 h-6',
    thumb: 'w-5 h-5',
    thumbTranslate: 'translate-x-5',
    icon: 'text-[10px]',
    label: 'text-sm',
    trackText: 'text-[10px]'
  },
  lg: {
    track: 'w-14 h-7',
    thumb: 'w-6 h-6',
    thumbTranslate: 'translate-x-7',
    icon: 'text-xs',
    label: 'text-base',
    trackText: 'text-xs'
  }
}

// Size configurations for outset type (thumb larger than track)
const outsetSizes = {
  sm: {
    track: 'w-7 h-3',
    thumb: 'w-4 h-4',
    thumbTranslate: 'translate-x-3',
    icon: 'text-[8px]',
    label: 'text-xs',
    trackText: 'text-[6px]'
  },
  md: {
    track: 'w-10 h-4',
    thumb: 'w-6 h-6',
    thumbTranslate: 'translate-x-4',
    icon: 'text-[10px]',
    label: 'text-sm',
    trackText: 'text-[8px]'
  },
  lg: {
    track: 'w-12 h-5',
    thumb: 'w-7 h-7',
    thumbTranslate: 'translate-x-5',
    icon: 'text-xs',
    label: 'text-base',
    trackText: 'text-[10px]'
  }
}

const sizeConfig = computed(() => {
  const sizes = props.type === 'outset' ? outsetSizes : insetSizes
  return sizes[props.size]
})

// Track style: when color is set and checked, use inline style; otherwise use token classes
const trackStyle = computed<CSSProperties | undefined>(() => {
  if (isChecked.value && props.color) {
    return { backgroundColor: props.color }
  }
  return undefined
})

// Icon color style for checked icon when color is set
const checkedIconStyle = computed<CSSProperties | undefined>(() => {
  if (props.color) {
    return { color: props.color }
  }
  return undefined
})

const wrapperClasses = computed(() => {
  return cn(
    'inline-flex items-center gap-2',
    { 'opacity-(--s-opacity-disabled) cursor-not-allowed': props.disabled },
    (attrs as Record<string, unknown>).class as string,
  )
})

const trackClasses = computed(() => {
  return cn(
    's-switch-track relative inline-flex items-center shrink-0 rounded-full transition-all duration-(--s-duration-slow) ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-ring',
    hasTrackText.value ? 'min-w-16 px-1' : sizeConfig.value.track,
    // Unchecked state uses accent background; checked uses primary (or inline style when color is set)
    isChecked.value && !props.color ? 'bg-primary' : '',
    !isChecked.value ? 'bg-accent' : '',
    { 'cursor-pointer': !props.disabled && !props.loading, 'cursor-not-allowed': props.disabled || props.loading },
    { 'h-6': hasTrackText.value && props.size === 'md', 'h-5': hasTrackText.value && props.size === 'sm', 'h-7': hasTrackText.value && props.size === 'lg' },
    props.trackClass,
  )
})

const thumbClasses = computed(() => {
  return cn(
    's-switch-thumb inline-flex items-center justify-center rounded-full shadow-md transition-all duration-(--s-duration-slow) ease-in-out z-10',
    isChecked.value && !props.color ? 'bg-primary-foreground' : 'bg-white',
    hasTrackText.value ? 'w-5 h-5' : sizeConfig.value.thumb,
    hasTrackText.value
      ? (isChecked.value ? 'ml-auto' : 'mr-auto')
      : (isChecked.value ? sizeConfig.value.thumbTranslate : 'translate-x-0.5'),
    props.thumbClass,
  )
})
</script>

<template>
  <div
    v-bind="$attrs"
    :class="wrapperClasses"
  >
    <!-- Label Before -->
    <span
      v-if="labelBefore"
      class="select-none text-muted-foreground"
      :class="[sizeConfig.label, labelClass]"
    >
      {{ labelBefore }}
    </span>

    <!-- Switch Track -->
    <button
      type="button"
      role="switch"
      :aria-checked="isChecked"
      :disabled="disabled || loading"
      :class="trackClasses"
      :style="trackStyle"
      @click="toggle"
      @keydown="handleKeydown"
    >
      <!-- Track Text (unchecked - right side) -->
      <span
        v-if="hasTrackText && !isChecked && uncheckedText"
        :class="['absolute right-2 font-semibold select-none', color ? 'text-white' : 'text-primary-foreground', sizeConfig.trackText]"
      >
        {{ uncheckedText }}
      </span>

      <!-- Track Text (checked - left side) -->
      <span
        v-if="hasTrackText && isChecked && checkedText"
        :class="['absolute left-2 font-semibold select-none', color ? 'text-white' : 'text-primary-foreground', sizeConfig.trackText]"
      >
        {{ checkedText }}
      </span>

      <!-- Thumb -->
      <span :class="thumbClasses">
        <!-- Loading Spinner -->
        <span
          v-if="loading"
          class="mdi mdi-loading animate-spin text-muted-foreground"
          :class="sizeConfig.icon"
        ></span>

        <!-- Custom Icons via Slots -->
        <template v-else>
          <slot v-if="isChecked" name="checked-icon">
            <component v-if="checkedIcon && isIconComponent(checkedIcon)" :is="checkedIcon" :class="[sizeConfig.icon]" :style="checkedIconStyle" />
            <span
              v-else-if="checkedIcon"
              :class="['mdi', `mdi-${checkedIcon}`, sizeConfig.icon]"
              :style="checkedIconStyle"
              :data-no-color="!color ? '' : undefined"
            ></span>
          </slot>
          <slot v-else name="unchecked-icon">
            <component v-if="uncheckedIcon && isIconComponent(uncheckedIcon)" :is="uncheckedIcon" :class="[sizeConfig.icon, 'text-muted-foreground']" />
            <span
              v-else-if="uncheckedIcon"
              :class="['mdi', `mdi-${uncheckedIcon}`, sizeConfig.icon, 'text-muted-foreground']"
            ></span>
          </slot>
        </template>
      </span>
    </button>

    <!-- Label After -->
    <span
      v-if="labelAfter"
      class="select-none text-muted-foreground"
      :class="[sizeConfig.label, labelClass]"
    >
      {{ labelAfter }}
    </span>
  </div>
</template>

<style scoped>
.s-switch-track {
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.1);
}

.s-switch-thumb {
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15), 0 1px 2px rgba(0, 0, 0, 0.1);
}

.s-switch-track:hover:not(:disabled) .s-switch-thumb {
  box-shadow: 0 3px 6px rgba(0, 0, 0, 0.2), 0 2px 4px rgba(0, 0, 0, 0.12);
}
</style>
