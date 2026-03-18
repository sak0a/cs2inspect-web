<script setup lang="ts">
// @saka-ui/registry v0.2.11 — input
// Source: saka-ui@0.2.11
// Do not remove this header if you want `saka-ui diff` to work.
import { ref, computed, watch, nextTick, onMounted, type CSSProperties } from 'vue'
import { cn } from '../../lib/utils'
import { type IconProp, isIconComponent } from '../../lib/icon'

defineOptions({ inheritAttrs: false })

// Props interface
export interface Props {
  // Core
  modelValue?: string | number
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'search' | 'textarea'
  
  // Visual Design
  variant?: 'outlined' | 'filled' | 'underlined' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  color?: string
  rounded?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | 'full'
  
  // Label & Placeholder
  label?: string
  placeholder?: string
  labelPlacement?: 'top' | 'top-left' | 'top-center' | 'top-right' | 'bottom' | 'left' | 'right' | 'floating' | 'inside'
  labelAnimation?: 'morph' | 'slide' | 'fade' | 'none'
  
  // Icons
  iconLeft?: IconProp
  iconRight?: IconProp
  iconColor?: string
  
  // States
  disabled?: boolean
  readonly?: boolean
  loading?: boolean
  error?: string | boolean
  success?: string | boolean
  warning?: string | boolean
  hint?: string
  
  // Validation
  required?: boolean
  minLength?: number
  maxLength?: number
  pattern?: string | RegExp
  validator?: (value: string | number) => string | boolean | Promise<string | boolean>
  validateOn?: 'blur' | 'input' | 'submit' | 'never'
  
  // Input Behavior
  autocomplete?: string
  autofocus?: boolean
  spellcheck?: boolean
  inputmode?: 'none' | 'text' | 'tel' | 'url' | 'email' | 'numeric' | 'decimal' | 'search'
  max?: number | string
  min?: number | string
  step?: number | string
  
  // Advanced Features
  clearable?: boolean
  showPasswordToggle?: boolean
  counter?: boolean
  prefix?: string
  suffix?: string
  rows?: number
  resize?: 'none' | 'vertical' | 'horizontal' | 'both'
  
  // Autocomplete Suggestions
  suggestions?: string[] // e.g., ['@gmail.com', '@outlook.com'] for email
  showSuggestionsOnFocus?: boolean
  
  // Input Filtering/Masking
  allowOnly?: 'digits' | 'letters' | 'alphanumeric' | RegExp | ((char: string) => boolean)
  decimalPlaces?: number // For number type, max decimal places allowed
  
  // Accessibility
  name?: string
  id?: string
  ariaLabel?: string
  ariaDescribedBy?: string
  
  // Styling Overrides
  inputClass?: string
  labelClass?: string
  wrapperClass?: string
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  type: 'text',
  variant: 'outlined',
  size: 'md',
  color: undefined,
  rounded: 'md',
  labelPlacement: 'top',
  labelAnimation: 'morph',
  disabled: false,
  readonly: false,
  loading: false,
  required: false,
  validateOn: 'blur',
  clearable: false,
  showPasswordToggle: false,
  counter: false,
  rows: 3,
  resize: 'vertical',
  autofocus: false,
  spellcheck: true,
  suggestions: undefined,
  showSuggestionsOnFocus: true,
  allowOnly: undefined,
  decimalPlaces: undefined
})

const emit = defineEmits<{
  'update:modelValue': [value: string | number]
  'update:error': [error: string | null]
  'focus': [event: FocusEvent]
  'blur': [event: FocusEvent]
  'input': [event: Event]
  'change': [value: string | number, event: Event]
  'clear': []
  'enter': [event: KeyboardEvent]
  'validate': [isValid: boolean, error: string | null]
  'select-suggestion': [suggestion: string]
}>()

// Refs
const inputRef = ref<HTMLInputElement | HTMLTextAreaElement | null>(null)
const isFocused = ref(false)
const showPassword = ref(false)
const internalError = ref<string | null>(null)
const isValidating = ref(false)
const inputId = computed(() => props.id || `s-input-${Math.random().toString(36).slice(2, 9)}`)
const messageId = computed(() => `${inputId.value}-message`)

// Suggestions state
const showSuggestions = ref(false)
const selectedSuggestionIndex = ref(-1)
const suggestionsRef = ref<HTMLUListElement | null>(null) // used as template ref
void suggestionsRef

// Debounce timer
let validateTimer: ReturnType<typeof setTimeout> | null = null

// Computed
const hasValue = computed(() => {
  return props.modelValue !== null && props.modelValue !== undefined && String(props.modelValue).length > 0
})

const currentLength = computed(() => String(props.modelValue || '').length)

const computedType = computed(() => {
  if (props.type === 'password' && showPassword.value) {
    return 'text'
  }
  return props.type
})

const isFloatingLabel = computed(() => {
  return props.labelPlacement === 'floating' || props.labelPlacement === 'inside'
})

const isLabelFloated = computed(() => {
  return isFocused.value || hasValue.value
})

const displayError = computed(() => {
  if (typeof props.error === 'string') return props.error
  if (props.error === true) return 'Invalid value'
  return internalError.value
})

const displaySuccess = computed(() => {
  if (typeof props.success === 'string') return props.success
  return null
})

const displayWarning = computed(() => {
  if (typeof props.warning === 'string') return props.warning
  return null
})

const validationState = computed<'error' | 'success' | 'warning' | null>(() => {
  if (displayError.value || props.error) return 'error'
  if (displaySuccess.value || props.success) return 'success'
  if (displayWarning.value || props.warning) return 'warning'
  return null
})

const validationIcon = computed(() => {
  switch (validationState.value) {
    case 'error': return 'alert-circle'
    case 'success': return 'check-circle'
    case 'warning': return 'alert'
    default: return null
  }
})

// Filtered suggestions based on current value
const filteredSuggestions = computed(() => {
  if (!props.suggestions || !props.suggestions.length) return []
  const currentValue = String(props.modelValue || '')
  
  // For email type, show suggestions if @ is typed
  if (props.type === 'email') {
    const atIndex = currentValue.indexOf('@')
    if (atIndex === -1) return [] // No @ yet, don't show suggestions
    
    const afterAt = currentValue.slice(atIndex)
    // Filter suggestions that match what's typed after @
    return props.suggestions.filter(s => 
      s.toLowerCase().startsWith(afterAt.toLowerCase()) && s !== afterAt
    )
  }
  
  // For other types, filter by value
  return props.suggestions.filter(s => 
    s.toLowerCase().includes(currentValue.toLowerCase()) && s !== currentValue
  )
})

// Should show suggestions dropdown
const shouldShowSuggestions = computed(() => {
  return showSuggestions.value && 
         filteredSuggestions.value.length > 0 && 
         !props.disabled && 
         !props.readonly
})

// Size configurations
const sizeConfig = computed(() => {
  const sizes = {
    sm: {
      input: 'min-h-8 text-xs',
      padding: 'px-2.5 py-1.5',
      paddingWithIcon: 'px-2.5',
      label: 'text-xs',
      icon: 'text-sm',
      floatLabel: 'text-xs',
      floatLabelActive: '-top-2 text-[10px]'
    },
    md: {
      input: 'min-h-10 text-sm',
      padding: 'px-3 py-2',
      paddingWithIcon: 'px-3',
      label: 'text-sm',
      icon: 'text-base',
      floatLabel: 'text-sm',
      floatLabelActive: '-top-2.5 text-xs'
    },
    lg: {
      input: 'min-h-12 text-base',
      padding: 'px-4 py-2.5',
      paddingWithIcon: 'px-4',
      label: 'text-base',
      icon: 'text-lg',
      floatLabel: 'text-base',
      floatLabelActive: '-top-3 text-sm'
    }
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
    full: 'rounded-full'
  }
  return radii[props.rounded]
})

// Variant styles
const variantClasses = computed(() => {
  const base = {
    outlined: 'border bg-background border-border hover:border-input',
    filled: 'border-transparent bg-accent',
    underlined: 'border-b border-t-0 border-l-0 border-r-0 rounded-none! bg-transparent border-border',
    ghost: 'border-transparent bg-transparent hover:bg-accent'
  }
  return base[props.variant]
})

// Focus classes
const focusClasses = computed(() => {
  if (!isFocused.value) return ''
  if (props.color) return '' // handled by inline style
  if (props.variant === 'underlined') {
    return 'border-primary'
  }
  return 'ring-2 ring-ring/20 border-primary'
})

// Focus inline style when custom color is set
const focusStyle = computed<CSSProperties | undefined>(() => {
  if (!isFocused.value || !props.color) return undefined
  if (props.variant === 'underlined') {
    return { borderColor: props.color }
  }
  return {
    borderColor: props.color,
    boxShadow: `0 0 0 2px color-mix(in srgb, ${props.color} 20%, transparent)`
  }
})

// Validation state border colors
const validationBorderClasses = computed(() => {
  if (!validationState.value) return ''
  const colors = {
    error: 'border-red-500 hover:border-red-500',
    success: 'border-green-500 hover:border-green-500',
    warning: 'border-amber-500 hover:border-amber-500'
  }
  return colors[validationState.value]
})

// Character counter color
const counterColorClass = computed(() => {
  if (!props.maxLength) return 'text-muted-foreground'
  const ratio = currentLength.value / props.maxLength
  if (ratio >= 1) return 'text-red-500'
  if (ratio >= 0.9) return 'text-amber-500'
  if (ratio >= 0.75) return 'text-amber-400'
  return 'text-muted-foreground'
})

// Icon color classes
const iconColorClass = computed(() => {
  if (props.iconColor) return ''
  if (isFocused.value) return props.color ? '' : 'text-primary'
  return 'text-muted-foreground'
})

// Icon color inline style when custom color is set
const iconFocusStyle = computed<CSSProperties | undefined>(() => {
  if (!isFocused.value || props.iconColor || !props.color) return undefined
  return { color: props.color }
})

// Label layout classes for non-floating labels
const labelLayoutClasses = computed(() => {
  if (isFloatingLabel.value) return 'flex flex-col w-full'
  
  const [side, align] = props.labelPlacement.split('-') as [string, string | undefined]
  const classes = ['flex', 'w-full']

  if (side === 'top' || side === 'bottom') {
    classes.push('flex-col', 'gap-1.5')
    if (side === 'bottom') classes.push('flex-col-reverse')
  } else {
    classes.push('gap-3')
    if (side === 'right') classes.push('flex-row-reverse')
    else classes.push('flex-row')
    if (align === 'center') classes.push('items-center')
    else if (align === 'bottom') classes.push('items-end')
    else classes.push('items-start')
  }

  return classes.join(' ')
})

// Label text alignment
const labelClasses = computed(() => {
  const base = `font-medium text-muted-foreground ${sizeConfig.value.label}`
  if (isFloatingLabel.value) return base

  const [side, align] = props.labelPlacement.split('-')
  if (side === 'top' || side === 'bottom') {
    if (align === 'center') return `${base} text-center`
    if (align === 'right') return `${base} text-right`
  }
  return base
})

// Input padding based on icons
const inputPaddingClasses = computed(() => {
  const hasLeft = !!props.iconLeft || !!props.prefix
  const hasRight = !!props.iconRight || !!props.suffix || props.clearable || props.showPasswordToggle || props.loading || validationIcon.value
  
  let classes = sizeConfig.value.input
  
  if (props.size === 'sm') {
    classes += hasLeft ? ' pl-8' : ' pl-2.5'
    classes += hasRight ? ' pr-8' : ' pr-2.5'
  } else if (props.size === 'lg') {
    classes += hasLeft ? ' pl-12' : ' pl-4'
    classes += hasRight ? ' pr-12' : ' pr-4'
  } else {
    classes += hasLeft ? ' pl-10' : ' pl-3'
    classes += hasRight ? ' pr-10' : ' pr-3'
  }
  
  return classes
})

// Validation
const isValidEmail = (email: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

const isValidUrl = (url: string): boolean => {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

const validate = async (value: string | number): Promise<string | null> => {
  const strValue = String(value)
  
  // Required validation
  if (props.required && strValue.trim() === '') {
    return 'This field is required'
  }
  
  // Skip other validations if empty and not required
  if (strValue === '') return null
  
  // Min length
  if (props.minLength && strValue.length < props.minLength) {
    return `Minimum ${props.minLength} characters required`
  }
  
  // Max length
  if (props.maxLength && strValue.length > props.maxLength) {
    return `Maximum ${props.maxLength} characters allowed`
  }
  
  // Pattern
  if (props.pattern) {
    const regex = typeof props.pattern === 'string' ? new RegExp(props.pattern) : props.pattern
    if (!regex.test(strValue)) {
      return 'Invalid format'
    }
  }
  
  // Type-specific validation
  if (props.type === 'email' && strValue && !isValidEmail(strValue)) {
    return 'Please enter a valid email address'
  }
  
  if (props.type === 'url' && strValue && !isValidUrl(strValue)) {
    return 'Please enter a valid URL'
  }
  
  // Number range validation
  if (props.type === 'number') {
    const numValue = Number(value)
    if (props.min !== undefined && numValue < Number(props.min)) {
      return `Minimum value is ${props.min}`
    }
    if (props.max !== undefined && numValue > Number(props.max)) {
      return `Maximum value is ${props.max}`
    }
  }
  
  // Custom validator
  if (props.validator) {
    isValidating.value = true
    try {
      const result = await props.validator(value)
      if (typeof result === 'string') return result
      if (result === false) return 'Invalid value'
    } finally {
      isValidating.value = false
    }
  }
  
  return null
}

const runValidation = async () => {
  if (props.validateOn === 'never') return
  
  const error = await validate(props.modelValue ?? '')
  internalError.value = error
  emit('update:error', error)
  emit('validate', error === null, error)
}

// Input character filtering
const isCharacterAllowed = (char: string, newValue: string): boolean => {
  const allowOnly = props.allowOnly
  if (!allowOnly) return true
  
  if (allowOnly === 'digits') {
    // Allow digits and one decimal point for numbers with decimalPlaces
    if (props.decimalPlaces !== undefined) {
      return /[\d.]/.test(char) && !(char === '.' && newValue.includes('.'))
    }
    return /\d/.test(char)
  }
  if (allowOnly === 'letters') return /[a-zA-Z]/.test(char)
  if (allowOnly === 'alphanumeric') return /[a-zA-Z0-9]/.test(char)
  if (allowOnly instanceof RegExp) return allowOnly.test(char)
  if (typeof allowOnly === 'function') return allowOnly(char)
  return true
}

const enforceDecimalPlaces = (value: string): string => {
  if (props.decimalPlaces === undefined) return value
  
  const parts = value.split('.')
  if (parts.length === 2 && parts[1].length > props.decimalPlaces) {
    return parts[0] + '.' + parts[1].slice(0, props.decimalPlaces)
  }
  return value
}

// Handle keypress for character filtering (beforeinput)
const handleBeforeInput = (event: InputEvent) => {
  if (!props.allowOnly && props.decimalPlaces === undefined) return
  
  const char = event.data
  if (!char) return // Allow control keys
  
  const target = event.target as HTMLInputElement
  const newValue = target.value + char
  
  // Check if character is allowed
  if (!isCharacterAllowed(char, target.value)) {
    event.preventDefault()
    return
  }
  
  // Check decimal places
  if (props.decimalPlaces !== undefined && char !== '.') {
    const parts = newValue.split('.')
    if (parts.length === 2 && parts[1].length > props.decimalPlaces) {
      event.preventDefault()
      return
    }
  }
}

// Event handlers
const handleInput = (event: Event) => {
  const target = event.target as HTMLInputElement | HTMLTextAreaElement
  let value: string | number = target.value
  
  // Enforce decimal places after paste
  if (props.decimalPlaces !== undefined) {
    value = enforceDecimalPlaces(String(value))
    target.value = value
  }
  
  if (props.type === 'number' && value !== '') {
    value = Number(value)
  }
  
  emit('update:modelValue', value)
  emit('input', event)
  
  // Show suggestions on input
  if (props.suggestions?.length) {
    showSuggestions.value = true
    selectedSuggestionIndex.value = -1
  }
  
  // Clear error on input if it was set
  if (internalError.value && props.validateOn === 'input') {
    if (validateTimer) clearTimeout(validateTimer)
    validateTimer = setTimeout(() => {
      runValidation()
    }, 500)
  } else if (props.validateOn === 'input') {
    if (validateTimer) clearTimeout(validateTimer)
    validateTimer = setTimeout(() => {
      runValidation()
    }, 350000)
  }
}

const handleFocus = (event: FocusEvent) => {
  isFocused.value = true
  emit('focus', event)
  
  // Show suggestions on focus if configured
  if (props.showSuggestionsOnFocus && props.suggestions?.length) {
    showSuggestions.value = true
  }
}

const handleBlur = (event: FocusEvent) => {
  isFocused.value = false
  emit('blur', event)
  
  // Delay hiding suggestions to allow click on suggestion
  setTimeout(() => {
    showSuggestions.value = false
    selectedSuggestionIndex.value = -1
  }, 300)
  
  if (props.validateOn === 'blur') {
    runValidation()
  }
}

const handleChange = (event: Event) => {
  emit('change', props.modelValue ?? '', event)
}

const handleKeydown = (event: KeyboardEvent) => {
  // Handle keyboard navigation for suggestions
  if (shouldShowSuggestions.value) {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      selectedSuggestionIndex.value = Math.min(
        selectedSuggestionIndex.value + 1,
        filteredSuggestions.value.length - 1
      )
      return
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault()
      selectedSuggestionIndex.value = Math.max(selectedSuggestionIndex.value - 1, -1)
      return
    }
    if (event.key === 'Enter' && selectedSuggestionIndex.value >= 0) {
      event.preventDefault()
      selectSuggestion(filteredSuggestions.value[selectedSuggestionIndex.value])
      return
    }
    if (event.key === 'Escape') {
      showSuggestions.value = false
      selectedSuggestionIndex.value = -1
      return
    }
    if (event.key === 'Tab' && filteredSuggestions.value.length > 0) {
      // Auto-complete with first suggestion on Tab
      event.preventDefault()
      selectSuggestion(filteredSuggestions.value[0])
      return
    }
  }
  
  if (event.key === 'Enter' && props.type !== 'textarea') {
    emit('enter', event)
  }
}

// Select a suggestion
const selectSuggestion = (suggestion: string) => {
  let newValue = suggestion
  
  // For email type, append suggestion to the part before @
  if (props.type === 'email') {
    const currentValue = String(props.modelValue || '')
    const atIndex = currentValue.indexOf('@')
    if (atIndex >= 0) {
      newValue = currentValue.slice(0, atIndex) + suggestion
    }
  }
  
  emit('update:modelValue', newValue)
  emit('select-suggestion', suggestion)
  showSuggestions.value = false
  selectedSuggestionIndex.value = -1
  
  // Focus input after selection
  nextTick(() => {
    inputRef.value?.focus()
  })
}

const clear = () => {
  emit('update:modelValue', '')
  emit('clear')
  internalError.value = null
  nextTick(() => {
    inputRef.value?.focus()
  })
}

const togglePassword = () => {
  showPassword.value = !showPassword.value
}

// Focus method
const focus = () => {
  inputRef.value?.focus()
}

const blur = () => {
  inputRef.value?.blur()
}

// Expose methods
defineExpose({
  focus,
  blur,
  validate: runValidation,
  inputElement: inputRef
})

// Lifecycle
onMounted(() => {
  if (props.autofocus) {
    nextTick(() => {
      inputRef.value?.focus()
    })
  }
})

// Watch for external error changes
watch(() => props.error, (newError) => {
  if (newError) {
    internalError.value = null
  }
})
</script>

<template>
  <div
    v-bind="$attrs"
    :class="cn('s-input-wrapper relative w-full', labelLayoutClasses, wrapperClass, $attrs.class as string)"
  >
    <!-- Static Label (non-floating) -->
    <label 
      v-if="label && !isFloatingLabel"
      :for="inputId"
      class="shrink-0"
      :class="[labelClasses, labelClass]"
    >
      {{ label }}
      <span v-if="required" class="text-red-500 ml-0.5">*</span>
    </label>

    <!-- Input Container -->
    <div class="flex-1 min-w-0">
      <div class="s-input-container relative">
        <!-- Prefix / Left Icon -->
        <span 
          v-if="iconLeft || prefix" 
          class="absolute left-0 top-1/2 -translate-y-1/2 flex items-center gap-1 pointer-events-none transition-colors duration-(--s-duration-normal)"
          :class="[
            sizeConfig.icon,
            iconColorClass,
            size === 'sm' ? 'pl-2.5' : size === 'lg' ? 'pl-4' : 'pl-3'
          ]"
          :style="iconColor ? { color: iconColor } : iconFocusStyle"
        >
          <slot name="prefix">
            <component v-if="iconLeft && isIconComponent(iconLeft)" :is="iconLeft" />
            <span v-else-if="iconLeft" :class="['mdi', `mdi-${iconLeft}`]" />
            <span v-if="prefix" class="text-muted-foreground text-sm">{{ prefix }}</span>
          </slot>
        </span>

        <!-- Input Element -->
        <input
          v-if="type !== 'textarea'"
          ref="inputRef"
          :id="inputId"
          :name="name"
          :type="computedType"
          :value="modelValue"
          :placeholder="isFloatingLabel && !isLabelFloated ? '' : placeholder"
          :disabled="disabled"
          :readonly="readonly"
          :required="required"
          :autocomplete="autocomplete"
          :spellcheck="spellcheck"
          :inputmode="inputmode"
          :min="min"
          :max="max"
          :step="step"
          :maxlength="maxLength"
          :aria-label="ariaLabel || label"
          :aria-describedby="(displayError || displaySuccess || displayWarning || hint) ? messageId : ariaDescribedBy"
          :aria-invalid="!!displayError"
          :aria-required="required"
          class="s-input w-full outline-none transition-all duration-(--s-duration-normal) text-foreground placeholder:text-muted-foreground"
          :class="[
            inputPaddingClasses,
            roundedConfig,
            variantClasses,
            focusClasses,
            validationBorderClasses,
            inputClass,
            {
              'opacity-(--s-opacity-disabled) cursor-not-allowed': disabled,
              'cursor-wait': loading,
              'py-2': isFloatingLabel
            }
          ]"
          :style="focusStyle"
          @input="handleInput"
          @focus="handleFocus"
          @blur="handleBlur"
          @change="handleChange"
          @keydown="handleKeydown"
          @beforeinput="handleBeforeInput"
        />

        <!-- Textarea Element -->
        <textarea
          v-else
          ref="inputRef"
          :id="inputId"
          :name="name"
          :value="modelValue"
          :placeholder="isFloatingLabel && !isLabelFloated ? '' : placeholder"
          :disabled="disabled"
          :readonly="readonly"
          :required="required"
          :autocomplete="autocomplete"
          :spellcheck="spellcheck"
          :rows="rows"
          :maxlength="maxLength"
          :aria-label="ariaLabel || label"
          :aria-describedby="(displayError || displaySuccess || displayWarning || hint) ? messageId : ariaDescribedBy"
          :aria-invalid="!!displayError"
          :aria-required="required"
          class="s-input w-full outline-none transition-all duration-(--s-duration-normal) text-foreground placeholder:text-muted-foreground"
          :class="[
            sizeConfig.input,
            size === 'sm' ? 'px-2.5 py-1.5' : size === 'lg' ? 'px-4 py-2.5' : 'px-3 py-2',
            roundedConfig,
            variantClasses,
            focusClasses,
            validationBorderClasses,
            inputClass,
            {
              'opacity-(--s-opacity-disabled) cursor-not-allowed': disabled,
              'cursor-wait': loading,
              'resize-none': resize === 'none',
              'resize-y': resize === 'vertical',
              'resize-x': resize === 'horizontal',
              'resize': resize === 'both'
            }
          ]"
          :style="{ ...focusStyle, minHeight: type === 'textarea' ? `${rows * 1.5 + 1}rem` : undefined }"
          @input="handleInput"
          @focus="handleFocus"
          @blur="handleBlur"
          @change="handleChange"
        />

        <!-- Floating/Inside Label -->
        <label
          v-if="label && isFloatingLabel"
          :for="inputId"
          class="s-input-label-floating absolute left-0 pointer-events-none transition-all duration-(--s-duration-normal) ease-out origin-left"
          :class="[
            labelClass,
            size === 'sm' ? 'left-2.5' : size === 'lg' ? 'left-4' : 'left-3',
            iconLeft || prefix ? (size === 'sm' ? 'left-8' : size === 'lg' ? 'left-12' : 'left-10') : '',
            isLabelFloated
              ? [sizeConfig.floatLabelActive, color ? '' : 'text-primary', 'bg-background px-1 -ml-1']
              : ['top-1/2 -translate-y-1/2', sizeConfig.floatLabel, 'text-muted-foreground']
          ]"
          :style="isLabelFloated && color ? { color } : undefined"
        >
          {{ label }}
          <span v-if="required" class="text-red-500 ml-0.5">*</span>
        </label>

        <!-- Suffix / Right Icon / Actions -->
        <span 
          v-if="iconRight || suffix || clearable || showPasswordToggle || loading || validationIcon" 
          class="absolute right-0 top-1/2 -translate-y-1/2 flex items-center gap-1 transition-colors duration-(--s-duration-normal)"
          :class="[
            sizeConfig.icon,
            size === 'sm' ? 'pr-2.5' : size === 'lg' ? 'pr-4' : 'pr-3'
          ]"
        >
          <!-- Loading spinner -->
          <span 
            v-if="loading" 
            class="mdi mdi-loading animate-spin text-muted-foreground"
          />
          
          <!-- Clear button -->
          <button
            v-else-if="clearable && hasValue && !disabled && !readonly"
            type="button"
            class="mdi mdi-close-circle text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            tabindex="-1"
            @click="clear"
          />
          
          <!-- Validation icon -->
          <span 
            v-else-if="validationIcon && !iconRight"
            :class="[
              'mdi', 
              `mdi-${validationIcon}`,
              validationState === 'error' ? 'text-red-500' : '',
              validationState === 'success' ? 'text-green-500' : '',
              validationState === 'warning' ? 'text-amber-500' : ''
            ]"
          />
          
          <!-- Password toggle -->
          <button
            v-if="type === 'password' && showPasswordToggle && !loading"
            type="button"
            class="mdi transition-colors cursor-pointer text-muted-foreground hover:text-foreground"
            :class="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
            tabindex="-1"
            @click="togglePassword"
          />
          
          <!-- Custom suffix -->
          <slot name="suffix">
            <component
              v-if="iconRight && isIconComponent(iconRight)"
              :is="iconRight"
              :class="[iconColorClass]"
              :style="iconColor ? { color: iconColor } : iconFocusStyle"
            />
            <span
              v-else-if="iconRight"
              :class="['mdi', `mdi-${iconRight}`, iconColorClass]"
              :style="iconColor ? { color: iconColor } : iconFocusStyle"
            />
            <span v-if="suffix" class="text-muted-foreground text-sm">{{ suffix }}</span>
          </slot>
        </span>

        <!-- Animated border line (underlined variant) -->
        <div 
          v-if="variant === 'underlined'"
          class="s-input-border-animated absolute bottom-0 left-1/2 h-0.5 transition-all duration-(--s-duration-normal) ease-out"
          :class="[color ? '' : 'bg-primary', isFocused ? 'w-full -translate-x-1/2' : 'w-0 -translate-x-1/2']"
          :style="color ? { backgroundColor: color } : undefined"
        />

        <!-- Suggestions Dropdown -->
        <Transition
          enter-active-class="transition-all duration-150 ease-out"
          enter-from-class="opacity-0 -translate-y-2 scale-95"
          enter-to-class="opacity-100 translate-y-0 scale-100"
          leave-active-class="transition-all duration-100 ease-in"
          leave-from-class="opacity-100 translate-y-0 scale-100"
          leave-to-class="opacity-0 -translate-y-2 scale-95"
        >
          <ul
            v-if="shouldShowSuggestions"
            ref="suggestionsRef"
            class="s-input-suggestions absolute left-0 right-0 top-full mt-1 z-50 rounded-lg border border-border bg-background shadow-lg overflow-hidden"
            role="listbox"
            :aria-label="`Suggestions for ${label || 'input'}`"
          >
            <li
              v-for="(suggestion, index) in filteredSuggestions"
              :key="suggestion"
              role="option"
              :aria-selected="index === selectedSuggestionIndex"
              class="px-3 py-2 text-sm cursor-pointer transition-colors"
              :class="[
                index === selectedSuggestionIndex
                  ? 'bg-primary text-primary-foreground'
                  : 'text-foreground hover:bg-accent'
              ]"
              @mousedown.prevent="selectSuggestion(suggestion)"
              @mouseenter="selectedSuggestionIndex = index"
            >
              <template v-if="type === 'email'">
                <span class="text-muted-foreground">{{ String(modelValue || '').split('@')[0] }}</span>
                <span :class="index === selectedSuggestionIndex ? 'text-primary-foreground' : 'text-primary font-medium'">{{ suggestion }}</span>
              </template>
              <template v-else>
                {{ suggestion }}
              </template>
            </li>
          </ul>
        </Transition>
      </div>

      <!-- Messages Row -->
      <div 
        v-if="displayError || displaySuccess || displayWarning || hint || (counter && maxLength)"
        :id="messageId"
        class="s-input-messages flex items-start justify-between gap-2 mt-1.5"
      >
        <!-- Message -->
        <Transition
          enter-active-class="transition-all duration-(--s-duration-normal) ease-out"
          enter-from-class="opacity-0 -translate-y-1"
          enter-to-class="opacity-100 translate-y-0"
          leave-active-class="transition-all duration-150 ease-in"
          leave-from-class="opacity-100 translate-y-0"
          leave-to-class="opacity-0 -translate-y-1"
          mode="out-in"
        >
          <p 
            v-if="displayError" 
            key="error"
            class="text-xs text-red-500 flex items-center gap-1"
          >
            <span class="mdi mdi-alert-circle text-sm" />
            {{ displayError }}
          </p>
          <p 
            v-else-if="displaySuccess"
            key="success" 
            class="text-xs text-green-500 flex items-center gap-1"
          >
            <span class="mdi mdi-check-circle text-sm" />
            {{ displaySuccess }}
          </p>
          <p 
            v-else-if="displayWarning"
            key="warning"
            class="text-xs text-amber-500 flex items-center gap-1"
          >
            <span class="mdi mdi-alert text-sm" />
            {{ displayWarning }}
          </p>
          <p 
            v-else-if="hint"
            key="hint"
            class="text-xs text-muted-foreground"
          >
            {{ hint }}
          </p>
          <span v-else key="empty" />
        </Transition>

        <!-- Character counter -->
        <span 
          v-if="counter && maxLength"
          class="text-xs shrink-0 tabular-nums transition-colors duration-(--s-duration-normal)"
          :class="counterColorClass"
        >
          {{ currentLength }} / {{ maxLength }}
        </span>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Ensure floating label background matches input */
.s-input-label-floating {
  z-index: 1;
}

/* Remove default browser styling for search inputs */
.s-input[type="search"]::-webkit-search-cancel-button,
.s-input[type="search"]::-webkit-search-decoration {
  -webkit-appearance: none;
  appearance: none;
}

/* Remove number input spinners */
.s-input[type="number"]::-webkit-inner-spin-button,
.s-input[type="number"]::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.s-input[type="number"] {
  -moz-appearance: textfield;
  appearance: textfield;
}
</style>
