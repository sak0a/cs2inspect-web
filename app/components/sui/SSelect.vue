<script setup lang="ts">
// @saka-ui/registry v0.2.10 — select
// Source: saka-ui@0.2.10
// Do not remove this header if you want `saka-ui diff` to work.
import {
  ref,
  computed,
  watch,
  provide,
  onMounted,
  onBeforeUnmount,
  nextTick,
  type CSSProperties,
} from 'vue'
import { cn } from '../../lib/utils'
import { type IconProp, isIconComponent } from '../../lib/icon'

defineOptions({ inheritAttrs: false })

export interface SelectOption {
  value: any
  label?: string
  disabled?: boolean
  icon?: IconProp
  image?: string
  description?: string
  color?: string
  group?: string
}

export interface Props {
  modelValue?: any | any[]
  options?: SelectOption[]
  multiple?: boolean
  searchable?: boolean
  clearable?: boolean
  disabled?: boolean
  loading?: boolean
  placeholder?: string
  size?: 'sm' | 'md' | 'lg'
  color?: string
  variant?: 'outlined' | 'filled' | 'underlined'
  rounded?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | 'full'
  maxHeight?: string
  closeOnSelect?: boolean
  tagLimit?: number
  noOptionsText?: string
  noResultsText?: string
  label?: string
  error?: string
  hint?: string
  required?: boolean
  teleport?: boolean | string
  placement?: 'bottom' | 'top' | 'auto'
  // New props
  arrowIcon?: IconProp
  menuWidth?: string | number
  menuAlign?: 'start' | 'end' | 'center'
  creatable?: boolean
  createText?: string
  labelPlacement?:
    | 'top'
    | 'top-left'
    | 'top-center'
    | 'top-right'
    | 'bottom'
    | 'bottom-left'
    | 'bottom-center'
    | 'bottom-right'
    | 'left'
    | 'left-top'
    | 'left-center'
    | 'left-bottom'
    | 'right'
    | 'right-top'
    | 'right-center'
    | 'right-bottom'
  // Vuesax-inspired props
  labelPlaceholder?: string // Float label that animates from inside to top
  filter?: boolean // Inline filter - type directly in trigger
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: null,
  options: () => [],
  multiple: false,
  searchable: false,
  clearable: false,
  disabled: false,
  loading: false,
  placeholder: 'Select...',
  size: 'md',
  color: undefined,
  variant: 'outlined',
  rounded: 'md',
  maxHeight: '280px',
  closeOnSelect: undefined,
  tagLimit: 3,
  noOptionsText: 'No options available',
  noResultsText: 'No results found',
  label: undefined,
  error: undefined,
  hint: undefined,
  required: false,
  teleport: true,
  placement: 'auto',
  // New props defaults
  arrowIcon: 'chevron-down',
  menuWidth: undefined,
  menuAlign: 'start',
  creatable: false,
  createText: 'Create "{query}"',
  labelPlacement: 'top',
  // Vuesax-inspired props defaults
  labelPlaceholder: undefined,
  filter: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: any | any[]]
  change: [value: any | any[], event?: Event]
  open: []
  close: []
  search: [query: string]
  focus: [event: FocusEvent]
  blur: [event: FocusEvent]
  create: [value: string]
}>()

// Refs
const triggerRef = ref<HTMLElement | null>(null)
const dropdownRef = ref<HTMLElement | null>(null)
const searchInputRef = ref<HTMLInputElement | null>(null)
const filterInputRef = ref<HTMLInputElement | null>(null) // For inline filter
const isOpen = ref(false)
const isFocused = ref(false)
const searchQuery = ref('')
const filterQuery = ref('') // For inline filter mode
const isFilterActive = ref(false) // Track if user is typing in filter mode
const highlightedIndex = ref(-1)
const registeredOptions = ref<SelectOption[]>([])
const dropdownPosition = ref<{
  top?: number
  bottom?: number
  left: number
  width: number
  placement: 'top' | 'bottom'
}>({ top: 0, left: 0, width: 0, placement: 'bottom' })

// Computed
const shouldCloseOnSelect = computed(() => {
  if (props.closeOnSelect !== undefined) return props.closeOnSelect
  return !props.multiple
})

const selectedValues = computed(() => {
  if (props.modelValue === null || props.modelValue === undefined) return []
  return props.multiple
    ? Array.isArray(props.modelValue)
      ? props.modelValue
      : [props.modelValue]
    : [props.modelValue]
})

const selectedOptions = computed(() => {
  return selectedValues.value.map((val) => {
    const fromOptions = props.options.find((o) => o.value === val)
    if (fromOptions) return fromOptions
    const fromRegistered = registeredOptions.value.find((o) => o.value === val)
    if (fromRegistered) return fromRegistered
    return { value: val, label: String(val) }
  })
})

const displayValue = computed(() => {
  if (selectedOptions.value.length === 0) return ''
  if (props.multiple) {
    return selectedOptions.value.map((o) => o.label ?? o.value).join(', ')
  }
  return selectedOptions.value[0]?.label ?? selectedOptions.value[0]?.value ?? ''
})

// Active query - uses filterQuery for inline filter mode, searchQuery for searchable mode
const activeQuery = computed(() => {
  if (props.filter) return filterQuery.value
  return searchQuery.value
})

const filteredOptions = computed(() => {
  if (!activeQuery.value) return props.options
  const query = activeQuery.value.toLowerCase()
  return props.options.filter((option) => {
    const label = (option.label ?? String(option.value)).toLowerCase()
    return label.includes(query)
  })
})

// Float label should show above when focused/open or has value
const showFloatLabel = computed(() => {
  return (
    props.labelPlaceholder &&
    (isFocused.value || isOpen.value || hasValue.value || filterQuery.value)
  )
})

// Group options by their group property
const groupedOptions = computed(() => {
  const groups: Map<string | undefined, SelectOption[]> = new Map()

  for (const option of filteredOptions.value) {
    const group = option.group
    if (!groups.has(group)) {
      groups.set(group, [])
    }
    groups.get(group)!.push(option)
  }

  return groups
})

const hasGroups = computed(() => {
  return filteredOptions.value.some((o) => o.group)
})

// Show create option when creatable is enabled and query doesn't match any option
const showCreateOption = computed(() => {
  if (!props.creatable || !activeQuery.value.trim()) return false
  const query = activeQuery.value.toLowerCase().trim()
  return !props.options.some((o) => (o.label ?? String(o.value)).toLowerCase() === query)
})

const createOptionLabel = computed(() => {
  return props.createText.replace('{query}', activeQuery.value.trim())
})

const hasValue = computed(() => {
  if (props.multiple) {
    return Array.isArray(props.modelValue) && props.modelValue.length > 0
  }
  return props.modelValue !== null && props.modelValue !== undefined && props.modelValue !== ''
})

const visibleTags = computed(() => {
  if (!props.multiple) return []
  return selectedOptions.value.slice(0, props.tagLimit)
})

const hiddenTagCount = computed(() => {
  if (!props.multiple) return 0
  return Math.max(0, selectedOptions.value.length - props.tagLimit)
})

// Methods
const isSelected = (value: any) => selectedValues.value.includes(value)

const registerOption = (option: { value: any; label: string; disabled: boolean }) => {
  const existingIndex = registeredOptions.value.findIndex((o) => o.value === option.value)
  if (existingIndex >= 0) {
    return existingIndex
  }
  registeredOptions.value.push(option)
  return registeredOptions.value.length - 1
}

const selectOption = (value: any) => {
  if (props.disabled || props.loading) return

  let newValue: any

  if (props.multiple) {
    const arr = Array.isArray(props.modelValue) ? [...props.modelValue] : []
    const index = arr.indexOf(value)
    if (index >= 0) {
      arr.splice(index, 1)
    } else {
      arr.push(value)
    }
    newValue = arr
  } else {
    newValue = value
  }

  emit('update:modelValue', newValue)
  emit('change', newValue)

  // Clear filter state after selection
  filterQuery.value = ''
  isFilterActive.value = false

  if (shouldCloseOnSelect.value) {
    close()
  }
}

const createOption = () => {
  if (!props.creatable || !activeQuery.value.trim()) return
  const newValue = activeQuery.value.trim()
  emit('create', newValue)
  selectOption(newValue)
  searchQuery.value = ''
  filterQuery.value = ''
  isFilterActive.value = false
}

const removeTag = (value: any, event?: Event) => {
  event?.stopPropagation()
  if (props.disabled || props.loading) return

  if (props.multiple && Array.isArray(props.modelValue)) {
    const newValue = props.modelValue.filter((v) => v !== value)
    emit('update:modelValue', newValue)
    emit('change', newValue)
  }
}

const clear = (event?: Event) => {
  event?.stopPropagation()
  if (props.disabled || props.loading) return

  const newValue = props.multiple ? [] : null
  emit('update:modelValue', newValue)
  emit('change', newValue)
  searchQuery.value = ''
}

const updateDropdownPosition = () => {
  if (!triggerRef.value) return

  const rect = triggerRef.value.getBoundingClientRect()
  const viewportHeight = window.innerHeight
  const spaceBelow = viewportHeight - rect.bottom
  const spaceAbove = rect.top
  const dropdownHeight = parseInt(props.maxHeight) || 280

  let placement: 'top' | 'bottom' = 'bottom'

  if (props.placement === 'auto') {
    placement = spaceBelow < dropdownHeight && spaceAbove > spaceBelow ? 'top' : 'bottom'
  } else {
    placement = props.placement === 'top' ? 'top' : 'bottom'
  }

  dropdownPosition.value = {
    top: placement === 'bottom' ? rect.bottom + 2 : undefined,
    bottom: placement === 'top' ? window.innerHeight - rect.top + 2 : undefined,
    left: rect.left,
    width: rect.width,
    placement,
  }
}

const open = () => {
  if (props.disabled || props.loading || isOpen.value) return

  isOpen.value = true
  highlightedIndex.value = -1
  updateDropdownPosition()
  emit('open')

  nextTick(() => {
    // Focus appropriate input based on mode
    if (props.filter && filterInputRef.value) {
      filterInputRef.value.focus()
      isFilterActive.value = true
    } else if (props.searchable && searchInputRef.value) {
      searchInputRef.value.focus()
    }
    // Find first selected option to highlight
    if (selectedValues.value.length > 0) {
      const allOptions = props.options.length > 0 ? props.options : registeredOptions.value
      const selectedIndex = allOptions.findIndex((o) => o.value === selectedValues.value[0])
      if (selectedIndex >= 0) {
        highlightedIndex.value = selectedIndex
      }
    }
  })
}

const close = () => {
  if (!isOpen.value) return

  isOpen.value = false
  searchQuery.value = ''
  filterQuery.value = ''
  isFilterActive.value = false
  highlightedIndex.value = -1
  emit('close')
}

const toggle = () => {
  if (isOpen.value) {
    close()
  } else {
    open()
  }
}

const handleFocus = (event: FocusEvent) => {
  isFocused.value = true
  emit('focus', event)
}

const handleBlur = (event: FocusEvent) => {
  // Check if focus moved to dropdown
  const relatedTarget = event.relatedTarget as HTMLElement
  if (dropdownRef.value?.contains(relatedTarget)) return

  isFocused.value = false
  emit('blur', event)
}

const handleKeydown = (event: KeyboardEvent) => {
  if (props.disabled || props.loading) return

  const allOptions =
    filteredOptions.value.length > 0 ? filteredOptions.value : registeredOptions.value
  const enabledOptions = allOptions.filter((o) => !o.disabled)

  switch (event.key) {
    case 'Enter':
      event.preventDefault()
      if (!isOpen.value) {
        open()
      } else if (highlightedIndex.value >= 0 && allOptions[highlightedIndex.value]) {
        selectOption(allOptions[highlightedIndex.value]!.value)
      } else if (props.creatable && activeQuery.value.trim()) {
        createOption()
      }
      break

    case ' ':
      // In filter mode, space should type a space, not toggle
      if (props.filter && isFilterActive.value) {
        return // Let the space character be typed
      }
      event.preventDefault()
      if (!isOpen.value) {
        open()
      } else if (highlightedIndex.value >= 0 && allOptions[highlightedIndex.value]) {
        selectOption(allOptions[highlightedIndex.value]!.value)
      }
      break

    case 'Escape':
      event.preventDefault()
      close()
      if (props.filter) {
        filterInputRef.value?.blur()
      }
      triggerRef.value?.focus()
      break

    case 'ArrowDown':
      event.preventDefault()
      if (!isOpen.value) {
        open()
      } else {
        // Find next enabled option
        let nextIndex = highlightedIndex.value + 1
        while (nextIndex < allOptions.length && allOptions[nextIndex]?.disabled) {
          nextIndex++
        }
        if (nextIndex < allOptions.length) {
          highlightedIndex.value = nextIndex
        }
      }
      break

    case 'ArrowUp':
      event.preventDefault()
      if (!isOpen.value) {
        open()
      } else {
        // Find previous enabled option
        let prevIndex = highlightedIndex.value - 1
        while (prevIndex >= 0 && allOptions[prevIndex]?.disabled) {
          prevIndex--
        }
        if (prevIndex >= 0) {
          highlightedIndex.value = prevIndex
        }
      }
      break

    case 'Home':
      event.preventDefault()
      if (isOpen.value) {
        highlightedIndex.value =
          enabledOptions.length > 0 ? allOptions.indexOf(enabledOptions[0]!) : 0
      }
      break

    case 'End':
      event.preventDefault()
      if (isOpen.value) {
        highlightedIndex.value =
          enabledOptions.length > 0
            ? allOptions.indexOf(enabledOptions[enabledOptions.length - 1]!)
            : allOptions.length - 1
      }
      break

    case 'Tab':
      close()
      break
  }
}

const handleSearchInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  searchQuery.value = target.value
  emit('search', target.value)
  highlightedIndex.value = 0
}

// Handle inline filter input
const handleFilterInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  filterQuery.value = target.value
  isFilterActive.value = true
  emit('search', target.value)
  highlightedIndex.value = 0

  // Auto-open dropdown when typing
  if (!isOpen.value && target.value) {
    open()
  }
}

// Handle filter input focus
const handleFilterFocus = (event: FocusEvent) => {
  isFocused.value = true
  isFilterActive.value = true
  emit('focus', event)
}

// Handle filter input blur
const handleFilterBlur = (event: FocusEvent) => {
  const relatedTarget = event.relatedTarget as HTMLElement
  if (dropdownRef.value?.contains(relatedTarget)) return
  if (triggerRef.value?.contains(relatedTarget)) return

  isFocused.value = false
  isFilterActive.value = false

  // Reset filter query when blurring without selecting
  if (!isOpen.value) {
    filterQuery.value = ''
  }
  emit('blur', event)
}

const handleClickOutside = (event: MouseEvent) => {
  const target = event.target as HTMLElement
  if (!triggerRef.value?.contains(target) && !dropdownRef.value?.contains(target)) {
    close()
  }
}

// Watchers
watch(isOpen, (val) => {
  if (val) {
    window.addEventListener('scroll', updateDropdownPosition, true)
    window.addEventListener('resize', updateDropdownPosition)
  } else {
    window.removeEventListener('scroll', updateDropdownPosition, true)
    window.removeEventListener('resize', updateDropdownPosition)
  }
})

// Lifecycle
onMounted(() => {
  document.addEventListener('mousedown', handleClickOutside)
})

onBeforeUnmount(() => {
  document.removeEventListener('mousedown', handleClickOutside)
  window.removeEventListener('scroll', updateDropdownPosition, true)
  window.removeEventListener('resize', updateDropdownPosition)
})

// Provide context to child options
provide('s-select-context', {
  modelValue: computed(() => props.modelValue),
  multiple: computed(() => props.multiple),
  highlightedIndex,
  registerOption,
  selectOption,
  isSelected,
  color: computed(() => props.color),
  size: computed(() => props.size),
})

// Size configurations
const sizeConfig = computed(() => {
  const sizes = {
    sm: {
      trigger: 'min-h-8 text-xs',
      padding: 'px-2.5 py-0.5',
      icon: 'text-sm',
      tag: 'text-xs px-1.5 py-0.5',
      label: 'text-xs',
      option: 'py-0.5 px-3 my-0.5 text-xs',
    },
    md: {
      trigger: 'min-h-10 text-sm',
      padding: 'px-3 py-0.5',
      icon: 'text-base',
      tag: 'text-xs px-2 py-0.5',
      label: 'text-sm',
      option: 'py-1 px-3 my-0.5 text-sm',
    },
    lg: {
      trigger: 'min-h-12 text-base',
      padding: 'px-4 py-0.5',
      icon: 'text-lg',
      tag: 'text-sm px-2.5 py-0.5',
      label: 'text-base',
      option: 'py-1.5 px-4 my-0.5 text-base',
    },
  }
  return sizes[props.size]
})

// Rounded classes
const roundedConfig = computed(() => {
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

// Dropdown rounded classes (max at xl to prevent oval shape)
const dropdownRoundedConfig = computed(() => {
  const radii = {
    none: 'rounded-none',
    xs: 'rounded-xs',
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    xl: 'rounded-xl',
    '2xl': 'rounded-xl', // Cap at xl for dropdown
    '3xl': 'rounded-xl', // Cap at xl for dropdown
    full: 'rounded-xl', // Cap at xl for dropdown
  }
  return radii[props.rounded]
})

// Variant styles
const variantClasses = computed(() => {
  const base = {
    outlined: 'border bg-background border-border hover:border-input',
    filled: 'border-transparent bg-accent',
    underlined:
      'border-b border-t-0 border-l-0 border-r-0 rounded-none bg-transparent border-border',
  }
  return base[props.variant]
})

const focusClasses = computed(() => {
  if (!isFocused.value && !isOpen.value) return ''
  if (props.color) return '' // handled by inline style
  return props.variant === 'underlined' ? 'border-primary' : 'ring-2 ring-ring/20 border-primary'
})

// Focus inline style when custom color is set
const focusStyle = computed<CSSProperties | undefined>(() => {
  if ((!isFocused.value && !isOpen.value) || !props.color) return undefined
  if (props.variant === 'underlined') {
    return { borderColor: props.color }
  }
  return {
    borderColor: props.color,
    boxShadow: `0 0 0 2px color-mix(in srgb, ${props.color} 20%, transparent)`,
  }
})

const teleportTarget = computed(() => {
  if (props.teleport === true) return 'body'
  if (typeof props.teleport === 'string') return props.teleport
  return undefined
})

// Label placement layout classes
// Label placement layout classes
const labelLayoutClasses = computed(() => {
  const [side, align] = props.labelPlacement.split('-') as [string, string | undefined]
  const classes = ['flex', 'w-full'] // Make sure wrapper is full width

  // Vertical placement (Top / Bottom)
  if (side === 'top' || side === 'bottom') {
    classes.push('gap-1.5') // Gap for vertical
    if (side === 'bottom') classes.push('flex-col-reverse')
    else classes.push('flex-col')
    // Vertical always stretches to keep input full width
    // Text alignment is handled on the label itself
  }
  // Horizontal placement (Left / Right)
  else {
    classes.push('gap-3') // Gap for horizontal
    if (side === 'right') classes.push('flex-row-reverse')
    else classes.push('flex-row') // left

    // Alignment (Vertical axis for row)
    if (align === 'center') classes.push('items-center')
    else if (align === 'bottom') classes.push('items-end')
    else classes.push('items-start') // default top/start
  }

  return classes.join(' ')
})

const labelClasses = computed(() => {
  const base = 'font-medium text-muted-foreground'
  const [side, align] = props.labelPlacement.split('-')

  let alignClass = ''
  // Only apply text alignment for vertical layouts
  if (side === 'top' || side === 'bottom') {
    if (align === 'center') alignClass = 'text-center'
    else if (align === 'right') alignClass = 'text-right'
    else alignClass = 'text-left'
  }

  return `${base} ${alignClass} ${sizeConfig.value.label}`
})

// Float label background based on variant
const floatLabelBackground = computed(() => {
  switch (props.variant) {
    case 'filled':
      return 'var(--s-accent)'
    case 'underlined':
      return 'transparent'
    default: // outlined
      return 'var(--s-background)'
  }
})

// Resolved color for inline styles - falls back to CSS variable
const resolvedColor = computed(() => props.color ?? 'var(--s-primary)')
</script>

<template>
  <div
    v-bind="$attrs"
    :class="cn('s-select relative w-full', labelLayoutClasses, $attrs.class as string)"
  >
    <!-- Static Label (traditional placement) -->
    <label v-if="label && !labelPlaceholder" class="shrink-0" :class="labelClasses">
      {{ label }}
      <span v-if="required" class="text-red-500 ml-0.5">*</span>
    </label>

    <!-- Select wrapper -->
    <div class="flex-1 min-w-0">
      <!-- Trigger -->
      <div
        ref="triggerRef"
        role="combobox"
        :aria-expanded="isOpen"
        :aria-haspopup="true"
        :aria-disabled="disabled || loading"
        :tabindex="filter ? -1 : 0"
        class="s-select-trigger relative flex items-center gap-2 cursor-pointer transition-all duration-250 outline-none"
        :class="[
          sizeConfig.trigger,
          sizeConfig.padding,
          roundedConfig,
          variantClasses,
          focusClasses,
          {
            'opacity-(--s-opacity-disabled) cursor-not-allowed': disabled,
            'cursor-wait': loading,
            's-select-trigger--float-label': labelPlaceholder,
            's-select-trigger--elevated': (isFocused || isOpen) && !disabled,
          },
        ]"
        :style="focusStyle"
        @click="!filter && toggle()"
        @keydown="!filter && handleKeydown($event)"
        @focus="!filter && handleFocus($event)"
        @blur="!filter && handleBlur($event)"
      >
        <!-- Float Label (Vuesax-style label-placeholder) -->
        <label
          v-if="labelPlaceholder"
          class="s-float-label absolute left-2.5 transition-all duration-250 ease-out pointer-events-none z-10"
          :class="[
            showFloatLabel
              ? 's-float-label--active text-xs px-1.5 opacity-100'
              : 'text-sm translate-y-0 opacity-40',
            { 'text-muted-foreground': !showFloatLabel },
          ]"
          :style="
            showFloatLabel ? { color: resolvedColor, backgroundColor: floatLabelBackground } : {}
          "
        >
          {{ labelPlaceholder }}
          <span v-if="required" class="text-red-500 ml-0.5">*</span>
        </label>

        <!-- Prefix slot -->
        <slot name="prefix" />

        <!-- Inline Filter Input (Vuesax-style filter) -->
        <template v-if="filter && !multiple">
          <input
            ref="filterInputRef"
            type="text"
            :value="isFilterActive ? filterQuery : hasValue ? displayValue : ''"
            :placeholder="hasValue ? '' : labelPlaceholder || placeholder"
            :disabled="disabled || loading"
            class="s-filter-input flex-1 min-w-0 bg-transparent outline-none text-foreground placeholder:text-muted-foreground"
            :class="{ 'cursor-not-allowed': disabled }"
            @input="handleFilterInput"
            @focus="handleFilterFocus"
            @blur="handleFilterBlur"
            @keydown="handleKeydown"
            @click.stop="!isOpen && open()"
          />
        </template>

        <!-- Selected value display (when not in filter mode or in multiple mode) -->
        <div v-else class="flex-1 flex items-center gap-1.5 min-w-0 overflow-hidden">
          <!-- Multiple: Tags -->
          <template v-if="multiple && visibleTags.length > 0">
            <TransitionGroup
              enter-active-class="transition-all duration-(--s-duration-normal) ease-out"
              enter-from-class="scale-90 opacity-0"
              enter-to-class="scale-100 opacity-100"
              leave-active-class="transition-all duration-(--s-duration-fast) ease-in absolute"
              leave-from-class="scale-100 opacity-100"
              leave-to-class="scale-90 opacity-0"
              tag="div"
              class="flex flex-wrap gap-1"
            >
              <slot
                v-for="option in visibleTags"
                :key="option.value"
                name="tag"
                :option="option"
                :remove="() => removeTag(option.value)"
              >
                <span
                  class="inline-flex items-center gap-1 rounded-md transition-colors"
                  :class="sizeConfig.tag"
                  :style="{
                    backgroundColor: `color-mix(in srgb, ${resolvedColor} 15%, transparent)`,
                    color: resolvedColor,
                  }"
                >
                  <span class="truncate max-w-24">{{ option.label ?? option.value }}</span>
                  <button
                    type="button"
                    class="mdi mdi-close text-xs opacity-70 hover:opacity-100 transition-opacity"
                    @click="removeTag(option.value, $event)"
                  />
                </span>
              </slot>
              <span
                v-if="hiddenTagCount > 0"
                :key="'more'"
                class="text-muted-foreground"
                :class="sizeConfig.tag"
              >
                +{{ hiddenTagCount }}
              </span>
            </TransitionGroup>

            <!-- Inline filter input for multiple mode -->
            <input
              v-if="filter"
              ref="filterInputRef"
              type="text"
              :value="filterQuery"
              :placeholder="visibleTags.length === 0 ? labelPlaceholder || placeholder : ''"
              :disabled="disabled || loading"
              class="s-filter-input flex-1 min-w-[60px] bg-transparent outline-none text-foreground placeholder:text-muted-foreground text-sm"
              @input="handleFilterInput"
              @focus="handleFilterFocus"
              @blur="handleFilterBlur"
              @keydown="handleKeydown"
              @click.stop="!isOpen && open()"
            />
          </template>

          <!-- Multiple with no tags but filter enabled -->
          <template v-else-if="multiple && filter && visibleTags.length === 0">
            <input
              ref="filterInputRef"
              type="text"
              :value="filterQuery"
              :placeholder="labelPlaceholder || placeholder"
              :disabled="disabled || loading"
              class="s-filter-input flex-1 min-w-0 bg-transparent outline-none text-foreground placeholder:text-muted-foreground"
              @input="handleFilterInput"
              @focus="handleFilterFocus"
              @blur="handleFilterBlur"
              @keydown="handleKeydown"
              @click.stop="!isOpen && open()"
            />
          </template>

          <!-- Single: Display value -->
          <template v-else-if="hasValue && !multiple">
            <slot name="selected" :option="selectedOptions[0]">
              <img
                v-if="selectedOptions[0]?.image"
                :src="selectedOptions[0].image"
                :alt="selectedOptions[0].label"
                class="w-5 h-5 rounded-full object-cover shrink-0"
              />
              <component
                v-else-if="selectedOptions[0]?.icon && isIconComponent(selectedOptions[0].icon)"
                :is="selectedOptions[0].icon"
                class="text-muted-foreground"
              />
              <span
                v-else-if="selectedOptions[0]?.icon"
                :class="['mdi', `mdi-${selectedOptions[0].icon}`, 'text-muted-foreground']"
              />
              <span class="truncate text-foreground">{{ displayValue }}</span>
            </slot>
          </template>

          <!-- Placeholder (only show if not using labelPlaceholder) -->
          <span v-else-if="!labelPlaceholder" class="text-muted-foreground truncate">
            {{ placeholder }}
          </span>

          <!-- Empty space when using labelPlaceholder without value -->
          <span v-else class="opacity-0">{{ placeholder }}</span>
        </div>

        <!-- Suffix slot -->
        <slot name="suffix" />

        <!-- Loading spinner -->
        <span
          v-if="loading"
          class="mdi mdi-loading animate-spin text-muted-foreground"
          :class="sizeConfig.icon"
        />

        <!-- Clear button -->
        <button
          v-else-if="clearable && hasValue && !disabled"
          type="button"
          class="mdi mdi-close-circle text-muted-foreground hover:text-muted-foreground transition-colors shrink-0"
          :class="sizeConfig.icon"
          @click="clear"
        />

        <!-- Dropdown arrow -->
        <slot name="arrow" :is-open="isOpen">
          <component
            v-if="!loading && isIconComponent(arrowIcon)"
            :is="arrowIcon"
            class="text-muted-foreground transition-transform duration-(--s-duration-normal) shrink-0"
            :class="[sizeConfig.icon, { 'rotate-180': isOpen }]"
          />
          <span
            v-else-if="!loading"
            class="text-muted-foreground transition-transform duration-(--s-duration-normal) shrink-0"
            :class="['mdi', `mdi-${arrowIcon}`, sizeConfig.icon, { 'rotate-180': isOpen }]"
          />
        </slot>
      </div>

      <!-- Error / Hint -->
      <p v-if="error" class="mt-1.5 text-xs text-red-500 flex items-center gap-1">
        <span class="mdi mdi-alert-circle" />
        {{ error }}
      </p>
      <p v-else-if="hint" class="mt-1.5 text-xs text-muted-foreground">
        {{ hint }}
      </p>

      <!-- Dropdown -->
      <Teleport v-if="teleportTarget" :to="teleportTarget" :disabled="!teleportTarget">
        <Transition
          enter-active-class="transition-all duration-(--s-duration-normal) ease-out"
          :enter-from-class="
            dropdownPosition.placement === 'top'
              ? 'opacity-0 translate-y-2'
              : 'opacity-0 -translate-y-2'
          "
          enter-to-class="opacity-100 translate-y-0"
          leave-active-class="transition-all duration-(--s-duration-fast) ease-in"
          leave-from-class="opacity-100 translate-y-0"
          :leave-to-class="
            dropdownPosition.placement === 'top'
              ? 'opacity-0 translate-y-2'
              : 'opacity-0 -translate-y-2'
          "
        >
          <div
            v-if="isOpen"
            ref="dropdownRef"
            role="listbox"
            :aria-multiselectable="multiple"
            class="s-select-dropdown fixed z-[100] overflow-hidden border border-border shadow-xl"
            :class="dropdownRoundedConfig"
            :style="{
              top: dropdownPosition.top ? `${dropdownPosition.top}px` : 'auto',
              bottom: dropdownPosition.bottom ? `${dropdownPosition.bottom}px` : 'auto',
              left: `${dropdownPosition.left}px`,
              width: menuWidth
                ? typeof menuWidth === 'number'
                  ? `${menuWidth}px`
                  : menuWidth
                : `${dropdownPosition.width}px`,
              maxHeight: maxHeight,
            }"
          >
            <!-- Glassmorphism background -->
            <div class="absolute inset-0 bg-background/95 backdrop-blur-xl" />

            <!-- Content -->
            <div class="relative">
              <!-- Search input -->
              <div v-if="searchable" class="p-2 border-b border-border">
                <div class="relative">
                  <span
                    class="absolute left-3 top-1/2 -translate-y-1/2 mdi mdi-magnify text-muted-foreground"
                  />
                  <input
                    ref="searchInputRef"
                    type="text"
                    :value="searchQuery"
                    placeholder="Search..."
                    class="w-full pl-9 pr-3 py-2 text-sm bg-muted border border-border rounded-lg outline-none focus:border-primary focus:ring-2 focus:ring-ring/20 transition-all text-foreground placeholder:text-muted-foreground"
                    @input="handleSearchInput"
                    @keydown="handleKeydown"
                  />
                </div>
              </div>

              <!-- Header slot -->
              <slot name="header" />

              <!-- Options list -->
              <div
                class="overflow-y-auto overscroll-contain py-0.5"
                :style="{ maxHeight: searchable ? `calc(${maxHeight} - 60px)` : maxHeight }"
              >
                <!-- Using options prop -->
                <template v-if="options.length > 0">
                  <template v-if="filteredOptions.length > 0 || showCreateOption">
                    <!-- Grouped options rendering -->
                    <template v-if="hasGroups">
                      <template
                        v-for="[groupName, groupOptions] in groupedOptions"
                        :key="groupName ?? 'ungrouped'"
                      >
                        <!-- Group header -->
                        <div
                          v-if="groupName"
                          class="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground sticky top-0 bg-background/95 backdrop-blur-sm mt-2 first:mt-0 border-t border-border first:border-t-0 z-20"
                        >
                          {{ groupName }}
                        </div>
                        <!-- Group options -->
                        <div
                          v-for="option in groupOptions"
                          :key="option.value"
                          role="option"
                          :aria-selected="isSelected(option.value)"
                          :aria-disabled="option.disabled"
                          class="s-option relative flex items-center cursor-pointer transition-all duration-(--s-duration-fast) select-none"
                          :class="[
                            sizeConfig.option,
                            {
                              'opacity-(--s-opacity-disabled) cursor-not-allowed': option.disabled,
                              'text-foreground': isSelected(option.value),
                              'text-muted-foreground hover:text-foreground hover:bg-accent/50':
                                !isSelected(option.value) && !option.disabled,
                            },
                          ]"
                          @click="!option.disabled && selectOption(option.value)"
                        >
                          <!-- Highlight background for selected -->
                          <div
                            v-if="isSelected(option.value)"
                            class="absolute inset-0 transition-all duration-(--s-duration-fast) rounded-lg mx-1"
                            :style="{
                              backgroundColor: `color-mix(in srgb, ${option.color ?? resolvedColor} 15%, transparent)`,
                            }"
                          />

                          <!-- Image -->
                          <img
                            v-if="option.image"
                            :src="option.image"
                            :alt="option.label"
                            class="relative z-10 w-6 h-6 rounded-full object-cover shrink-0 mr-2.5"
                          />
                          <!-- Icon -->
                          <component
                            v-else-if="option.icon && isIconComponent(option.icon)"
                            :is="option.icon"
                            class="relative z-10 shrink-0 mr-2.5"
                            :class="[sizeConfig.icon]"
                            :style="
                              isSelected(option.value)
                                ? { color: option.color ?? resolvedColor }
                                : {}
                            "
                          />
                          <span
                            v-else-if="option.icon"
                            class="relative z-10 shrink-0 mr-2.5"
                            :class="['mdi', `mdi-${option.icon}`, sizeConfig.icon]"
                            :style="
                              isSelected(option.value)
                                ? { color: option.color ?? resolvedColor }
                                : {}
                            "
                          />

                          <!-- Content -->
                          <div class="relative z-10 flex-1 min-w-0">
                            <slot
                              name="option"
                              :option="option"
                              :selected="isSelected(option.value)"
                            >
                              <span class="truncate block">{{ option.label ?? option.value }}</span>
                              <p
                                v-if="option.description"
                                class="text-xs text-muted-foreground truncate mt-0.5"
                              >
                                {{ option.description }}
                              </p>
                            </slot>
                          </div>

                          <!-- Check mark -->
                          <span
                            v-if="isSelected(option.value)"
                            class="relative z-10 mdi mdi-check shrink-0 ml-2"
                            :class="sizeConfig.icon"
                            :style="{ color: option.color ?? resolvedColor }"
                          />
                        </div>
                      </template>
                    </template>

                    <!-- Non-grouped options (flat list) -->
                    <template v-else>
                      <div
                        v-for="(option, index) in filteredOptions"
                        :key="option.value"
                        role="option"
                        :aria-selected="isSelected(option.value)"
                        :aria-disabled="option.disabled"
                        class="s-option relative flex items-center cursor-pointer transition-all duration-(--s-duration-fast) select-none"
                        :class="[
                          sizeConfig.option,
                          {
                            'opacity-(--s-opacity-disabled) cursor-not-allowed': option.disabled,
                            'text-foreground':
                              highlightedIndex === index || isSelected(option.value),
                            'text-muted-foreground hover:text-foreground':
                              highlightedIndex !== index &&
                              !isSelected(option.value) &&
                              !option.disabled,
                          },
                        ]"
                        @click="!option.disabled && selectOption(option.value)"
                        @mouseenter="highlightedIndex = index"
                      >
                        <!-- Highlight background -->
                        <div
                          v-if="highlightedIndex === index || isSelected(option.value)"
                          class="absolute inset-0 transition-all duration-(--s-duration-fast) rounded-lg mx-1"
                          :class="isSelected(option.value) ? 'opacity-100' : 'opacity-60'"
                          :style="{
                            backgroundColor: isSelected(option.value)
                              ? `color-mix(in srgb, ${option.color ?? resolvedColor} 15%, transparent)`
                              : 'var(--s-accent)',
                          }"
                        />

                        <!-- Image -->
                        <img
                          v-if="option.image"
                          :src="option.image"
                          :alt="option.label"
                          class="relative z-10 w-6 h-6 rounded-full object-cover shrink-0 mr-2.5"
                        />
                        <!-- Icon -->
                        <component
                          v-else-if="option.icon && isIconComponent(option.icon)"
                          :is="option.icon"
                          class="relative z-10 shrink-0 mr-2.5"
                          :class="[sizeConfig.icon]"
                          :style="
                            isSelected(option.value) ? { color: option.color ?? resolvedColor } : {}
                          "
                        />
                        <span
                          v-else-if="option.icon"
                          class="relative z-10 shrink-0 mr-2.5"
                          :class="['mdi', `mdi-${option.icon}`, sizeConfig.icon]"
                          :style="
                            isSelected(option.value) ? { color: option.color ?? resolvedColor } : {}
                          "
                        />

                        <!-- Content -->
                        <div class="relative z-10 flex-1 min-w-0">
                          <slot
                            name="option"
                            :option="option"
                            :selected="isSelected(option.value)"
                            :highlighted="highlightedIndex === index"
                          >
                            <span class="truncate block">{{ option.label ?? option.value }}</span>
                            <p
                              v-if="option.description"
                              class="text-xs text-muted-foreground truncate mt-0.5"
                            >
                              {{ option.description }}
                            </p>
                          </slot>
                        </div>

                        <!-- Check mark -->
                        <Transition
                          enter-active-class="transition-all duration-(--s-duration-fast) ease-out"
                          enter-from-class="scale-0 opacity-0"
                          enter-to-class="scale-100 opacity-100"
                          leave-active-class="transition-all duration-100 ease-in"
                          leave-from-class="scale-100 opacity-100"
                          leave-to-class="scale-0 opacity-0"
                        >
                          <span
                            v-if="isSelected(option.value)"
                            class="relative z-10 mdi mdi-check shrink-0 ml-2"
                            :class="sizeConfig.icon"
                            :style="{ color: option.color ?? resolvedColor }"
                          />
                        </Transition>
                      </div>
                    </template>

                    <!-- Creatable option -->
                    <div
                      v-if="showCreateOption"
                      class="s-option relative flex items-center cursor-pointer transition-all duration-(--s-duration-fast) select-none border-t border-border mt-1 pt-1"
                      :class="sizeConfig.option"
                      @click="createOption"
                    >
                      <span
                        class="mdi mdi-plus-circle mr-2.5"
                        :class="sizeConfig.icon"
                        :style="{ color: resolvedColor }"
                      />
                      <span class="text-muted-foreground">{{ createOptionLabel }}</span>
                    </div>
                  </template>

                  <!-- No results -->
                  <div v-else class="px-4 py-8 text-center">
                    <slot name="empty">
                      <span
                        class="mdi mdi-magnify-close text-3xl text-muted-foreground mb-2 block"
                      />
                      <p class="text-sm text-muted-foreground">{{ noResultsText }}</p>
                    </slot>
                  </div>
                </template>

                <!-- Using slots (SOption children) -->
                <template v-else-if="$slots.default">
                  <slot />
                </template>

                <!-- No options -->
                <div v-else class="px-4 py-8 text-center">
                  <slot name="empty">
                    <span class="mdi mdi-selection-off text-3xl text-muted-foreground mb-2 block" />
                    <p class="text-sm text-muted-foreground">{{ noOptionsText }}</p>
                  </slot>
                </div>

                <!-- Loading state -->
                <div v-if="loading" class="px-4 py-8 text-center">
                  <slot name="loading">
                    <span
                      class="mdi mdi-loading animate-spin text-2xl mb-2 block"
                      :style="{ color: resolvedColor }"
                    />
                    <p class="text-sm text-muted-foreground">Loading...</p>
                  </slot>
                </div>
              </div>

              <!-- Footer slot -->
              <slot name="footer" />
            </div>
          </div>
        </Transition>
      </Teleport>

      <!-- Non-teleported dropdown (fallback) -->
      <template v-else>
        <Transition
          enter-active-class="transition-all duration-(--s-duration-normal) ease-out"
          enter-from-class="opacity-0 -translate-y-2"
          enter-to-class="opacity-100 translate-y-0"
          leave-active-class="transition-all duration-(--s-duration-fast) ease-in"
          leave-from-class="opacity-100 translate-y-0"
          leave-to-class="opacity-0 -translate-y-2"
        >
          <div
            v-if="isOpen"
            ref="dropdownRef"
            role="listbox"
            class="s-select-dropdown absolute z-50 w-full mt-1 overflow-hidden border border-border shadow-xl bg-background"
            :class="roundedConfig"
            :style="{ maxHeight }"
          >
            <div class="overflow-y-auto overscroll-contain py-1" :style="{ maxHeight }">
              <slot />
            </div>
          </div>
        </Transition>
      </template>
    </div>
  </div>
</template>

<style scoped>
.s-select-trigger:focus-visible {
  outline: none;
}

/* Float label container - add padding top for label space */
.s-select-trigger--float-label {
  margin-top: 0.5rem;
}

/* Float label positioning - starts centered vertically */
.s-float-label {
  transform-origin: left center;
  will-change: transform, opacity, color;
  top: 50%;
  transform: translateY(-50%);
}

/* Float label active state - sits on top of border */
.s-float-label--active {
  font-weight: 500;
  /* Position on top of the border */
  top: 0;
  transform: translateY(-50%);
  /* Background applied via inline style based on variant */
  border-radius: 2px;
  line-height: 1.2;
}

/* Elevation effect on focus/open (Vuesax-style lift) */
.s-select-trigger--elevated {
  transform: translateY(-2px);
  box-shadow:
    0 8px 25px -5px rgba(0, 0, 0, 0.1),
    0 4px 10px -5px rgba(0, 0, 0, 0.05);
}

/* When elevated with float label, also move label up slightly */
.s-select-trigger--elevated.s-select-trigger--float-label .s-float-label--active {
  transform: translateY(calc(-50% - 2px));
}

/* Smooth transition for trigger */
.s-select-trigger {
  transition: all 0.25s ease;
}

/* Filter input styles */
.s-filter-input {
  caret-color: var(--s-primary);
}

.s-filter-input::selection {
  background-color: color-mix(in srgb, var(--s-primary) 30%, transparent);
}

.s-select-dropdown {
  scrollbar-width: thin;
  scrollbar-color: var(--s-border) transparent;
}

.s-select-dropdown::-webkit-scrollbar {
  width: 6px;
}

.s-select-dropdown::-webkit-scrollbar-track {
  background: transparent;
}

.s-select-dropdown::-webkit-scrollbar-thumb {
  background: var(--s-border);
  border-radius: 3px;
}

.s-select-dropdown::-webkit-scrollbar-thumb:hover {
  background: var(--s-input);
}
</style>
