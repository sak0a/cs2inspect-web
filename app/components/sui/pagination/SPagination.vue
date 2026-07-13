<script setup lang="ts">
// @saka-ui/registry v0.2.11 — pagination
// Source: saka-ui@0.2.11
// Do not remove this header if you want `saka-ui diff` to work.
import { computed, ref, watch, nextTick } from 'vue'
import { cn } from '../../../lib/utils'

defineOptions({ inheritAttrs: false })

// Types
export type PaginationVariant = 'default' | 'outlined' | 'ghost' | 'minimal' | 'dots'
export type PaginationSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'
export type PaginationShape = 'rounded' | 'square' | 'pill'
export type AnimationType = 'none' | 'slide' | 'fade' | 'scale' | 'flip'

export interface Props {
  /** Current page (v-model) */
  modelValue?: number
  /** Total number of items */
  total: number
  /** Items per page */
  pageSize?: number
  /** Maximum visible page buttons */
  maxVisiblePages?: number
  /** Visual variant */
  variant?: PaginationVariant
  /** Size of pagination buttons */
  size?: PaginationSize
  /** Button shape */
  shape?: PaginationShape
  /** Primary color */
  color?: string
  /** Show first/last page buttons */
  showFirstLast?: boolean
  /** Show prev/next buttons */
  showPrevNext?: boolean
  /** Show total items info */
  showTotal?: boolean
  /** Show quick jump input */
  showQuickJump?: boolean
  /** Show page size selector */
  showPageSize?: boolean
  /** Page size options for selector */
  pageSizeOptions?: number[]
  /** Disabled state */
  disabled?: boolean
  /** Loading state */
  loading?: boolean
  /** Animation type for page transitions */
  animation?: AnimationType
  /** Show progress bar */
  showProgress?: boolean
  /** Compact mode - combine prev/next into one button group */
  compact?: boolean
  /** Simple mode - only shows prev/next with page info */
  simple?: boolean
  /** Custom previous button text/icon */
  prevText?: string
  /** Custom next button text/icon */
  nextText?: string
  /** Custom first button text/icon */
  firstText?: string
  /** Custom last button text/icon */
  lastText?: string
  /** Enable keyboard navigation */
  keyboard?: boolean
  /** Background for the container */
  background?: boolean
  /** Hide single page */
  hideSinglePage?: boolean
  /** Format for total text */
  totalFormat?: (total: number, range: [number, number]) => string
}

// Ellipsis hover state
const ellipsisStartHover = ref(false)
const ellipsisEndHover = ref(false)
const ellipsisStartRef = ref<HTMLElement | null>(null) // used as template ref
const ellipsisEndRef = ref<HTMLElement | null>(null) // used as template ref
void ellipsisStartRef
void ellipsisEndRef
let hoverTimeout: ReturnType<typeof setTimeout> | null = null

const props = withDefaults(defineProps<Props>(), {
  modelValue: 1,
  pageSize: 10,
  maxVisiblePages: 7,
  variant: 'default',
  size: 'md',
  shape: 'rounded',
  color: 'var(--s-primary)',
  showFirstLast: false,
  showPrevNext: true,
  showTotal: false,
  showQuickJump: false,
  showPageSize: false,
  pageSizeOptions: () => [10, 20, 50, 100],
  disabled: false,
  loading: false,
  animation: 'scale',
  showProgress: false,
  compact: false,
  simple: false,
  prevText: undefined,
  nextText: undefined,
  firstText: undefined,
  lastText: undefined,
  keyboard: true,
  background: false,
  hideSinglePage: false,
  totalFormat: undefined
})

const emit = defineEmits<{
  'update:modelValue': [page: number]
  'update:pageSize': [size: number]
  'change': [page: number]
  'pageSizeChange': [size: number]
}>()

// Internal state
const internalPage = ref(props.modelValue)
const internalPageSize = ref(props.pageSize)
const jumpValue = ref('')
const isAnimating = ref(false)
const animationDirection = ref<'left' | 'right'>('right')

// Computed values
const totalPages = computed(() => Math.ceil(props.total / internalPageSize.value) || 1)

const currentPage = computed({
  get: () => props.modelValue ?? internalPage.value,
  set: (value) => {
    const page = Math.max(1, Math.min(value, totalPages.value))
    internalPage.value = page
    emit('update:modelValue', page)
    emit('change', page)
  }
})

// Calculate current range
const currentRange = computed<[number, number]>(() => {
  const start = (currentPage.value - 1) * internalPageSize.value + 1
  const end = Math.min(currentPage.value * internalPageSize.value, props.total)
  return [start, end]
})

// Format total text
const totalText = computed(() => {
  if (props.totalFormat) {
    return props.totalFormat(props.total, currentRange.value)
  }
  return `${currentRange.value[0]}-${currentRange.value[1]} of ${props.total}`
})

// Progress percentage
const progressPercent = computed(() => {
  if (totalPages.value <= 1) return 100
  return ((currentPage.value - 1) / (totalPages.value - 1)) * 100
})

// Whether to show pagination
const shouldShow = computed(() => {
  if (props.hideSinglePage && totalPages.value <= 1) return false
  return true
})

// Generate page numbers with ellipsis
const visiblePages = computed(() => {
  const pages: (number | 'ellipsis-start' | 'ellipsis-end')[] = []
  const total = totalPages.value
  const current = currentPage.value
  const max = props.maxVisiblePages

  if (total <= max) {
    // Show all pages
    for (let i = 1; i <= total; i++) {
      pages.push(i)
    }
  } else {
    // Complex logic for ellipsis
    const sideCount = Math.floor((max - 3) / 2) // pages on each side of current
    
    // Always show first page
    pages.push(1)

    if (current <= sideCount + 2) {
      // Near the start
      for (let i = 2; i <= Math.max(max - 2, sideCount + 3); i++) {
        pages.push(i)
      }
      pages.push('ellipsis-end')
      pages.push(total)
    } else if (current >= total - sideCount - 1) {
      // Near the end
      pages.push('ellipsis-start')
      for (let i = Math.min(total - max + 3, total - sideCount - 2); i <= total; i++) {
        pages.push(i)
      }
    } else {
      // In the middle
      pages.push('ellipsis-start')
      for (let i = current - sideCount; i <= current + sideCount; i++) {
        pages.push(i)
      }
      pages.push('ellipsis-end')
      pages.push(total)
    }
  }

  return pages
})

// Compute hidden pages for ellipsis dropdown
const hiddenPagesStart = computed(() => {
  const pages: number[] = []
  const visible = visiblePages.value.filter(p => typeof p === 'number') as number[]
  const minVisible = Math.min(...visible)
  
  for (let i = 2; i < minVisible; i++) {
    pages.push(i)
  }
  return pages
})

const hiddenPagesEnd = computed(() => {
  const pages: number[] = []
  const visible = visiblePages.value.filter(p => typeof p === 'number') as number[]
  const maxVisible = Math.max(...visible)
  
  for (let i = maxVisible + 1; i < totalPages.value; i++) {
    pages.push(i)
  }
  return pages
})

// Ellipsis hover handlers
const handleEllipsisEnter = (type: 'start' | 'end') => {
  if (hoverTimeout) clearTimeout(hoverTimeout)
  if (type === 'start') {
    ellipsisStartHover.value = true
  } else {
    ellipsisEndHover.value = true
  }
}

const handleEllipsisLeave = (type: 'start' | 'end') => {
  hoverTimeout = setTimeout(() => {
    if (type === 'start') {
      ellipsisStartHover.value = false
    } else {
      ellipsisEndHover.value = false
    }
  }, 150)
}

const handleDropdownEnter = (_type: 'start' | 'end') => {
  if (hoverTimeout) clearTimeout(hoverTimeout)
}

const handleDropdownLeave = (type: 'start' | 'end') => {
  if (type === 'start') {
    ellipsisStartHover.value = false
  } else {
    ellipsisEndHover.value = false
  }
}

const selectFromDropdown = (page: number) => {
  goToPage(page)
  ellipsisStartHover.value = false
  ellipsisEndHover.value = false
}

// Navigation
const canGoPrev = computed(() => currentPage.value > 1 && !props.disabled && !props.loading)
const canGoNext = computed(() => currentPage.value < totalPages.value && !props.disabled && !props.loading)
const canGoFirst = computed(() => currentPage.value > 1 && !props.disabled && !props.loading)
const canGoLast = computed(() => currentPage.value < totalPages.value && !props.disabled && !props.loading)

const goToPage = async (page: number) => {
  if (props.disabled || props.loading) return
  if (page < 1 || page > totalPages.value) return
  if (page === currentPage.value) return

  animationDirection.value = page > currentPage.value ? 'right' : 'left'
  isAnimating.value = true
  
  await nextTick()
  currentPage.value = page
  
  setTimeout(() => {
    isAnimating.value = false
  }, 100)
}

const goFirst = () => goToPage(1)
const goLast = () => goToPage(totalPages.value)
const goPrev = () => goToPage(currentPage.value - 1)
const goNext = () => goToPage(currentPage.value + 1)

// Quick jump
const handleQuickJump = () => {
  const page = parseInt(jumpValue.value)
  if (!isNaN(page) && page >= 1 && page <= totalPages.value) {
    goToPage(page)
  }
  jumpValue.value = ''
}

// Page size change
const handlePageSizeChange = (event: Event) => {
  const target = event.target as HTMLSelectElement
  const newSize = parseInt(target.value)
  internalPageSize.value = newSize
  emit('update:pageSize', newSize)
  emit('pageSizeChange', newSize)
  
  // Reset to page 1 when page size changes
  goToPage(1)
}

// Keyboard navigation
const handleKeydown = (event: KeyboardEvent) => {
  if (!props.keyboard || props.disabled || props.loading) return
  
  switch (event.key) {
    case 'ArrowLeft':
      event.preventDefault()
      goPrev()
      break
    case 'ArrowRight':
      event.preventDefault()
      goNext()
      break
    case 'Home':
      event.preventDefault()
      goFirst()
      break
    case 'End':
      event.preventDefault()
      goLast()
      break
  }
}

// Size classes
const sizeClasses = computed(() => {
  const sizes = {
    xs: 'h-6 min-w-6 text-xs px-1.5',
    sm: 'h-8 min-w-8 text-sm px-2',
    md: 'h-10 min-w-10 text-sm px-3',
    lg: 'h-12 min-w-12 text-base px-4',
    xl: 'h-14 min-w-14 text-lg px-5'
  }
  return sizes[props.size]
})

const iconSizes = computed(() => {
  const sizes = {
    xs: 'text-sm',
    sm: 'text-base',
    md: 'text-lg',
    lg: 'text-xl',
    xl: 'text-2xl'
  }
  return sizes[props.size]
})

const gapClasses = computed(() => {
  const gaps = {
    xs: 'gap-0.5',
    sm: 'gap-1',
    md: 'gap-1.5',
    lg: 'gap-2',
    xl: 'gap-2.5'
  }
  return gaps[props.size]
})

// Shape classes
const shapeClasses = computed(() => {
  const shapes = {
    rounded: 'rounded-lg',
    square: 'rounded-none',
    pill: 'rounded-full'
  }
  return shapes[props.shape]
})

// Active text color: use primary-foreground for default primary, white for custom colors
const activeTextColor = computed(() => props.color === 'var(--s-primary)' ? 'text-primary-foreground' : 'text-white')

// Button styles based on variant
const getButtonClasses = (isActive: boolean, isDisabled: boolean) => {
  const base = `
    relative flex items-center justify-center
    font-medium transition-all duration-(--s-duration-normal) ease-out
    select-none cursor-pointer
    focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2
    ${sizeClasses.value} ${shapeClasses.value}
  `

  if (isDisabled) {
    return `${base} opacity-(--s-opacity-disabled) cursor-not-allowed pointer-events-none`
  }

  if (props.variant === 'default') {
    return isActive
      ? `${base} ${activeTextColor.value} shadow-md hover:shadow-lg`
      : `${base} bg-muted text-foreground hover:bg-accent border border-border`
  }

  if (props.variant === 'outlined') {
    return isActive
      ? `${base} border-2 ${activeTextColor.value} shadow-md`
      : `${base} border-2 border-border text-muted-foreground hover:border-muted-foreground hover:text-foreground`
  }

  if (props.variant === 'ghost') {
    return isActive
      ? `${base} ${activeTextColor.value}`
      : `${base} text-muted-foreground hover:bg-muted hover:text-foreground`
  }
  
  if (props.variant === 'minimal') {
    return isActive
      ? `${base} font-bold`
      : `${base} text-muted-foreground hover:text-foreground`
  }
  
  if (props.variant === 'dots') {
    return isActive
      ? `${base} !w-3 !h-3 !min-w-3 !p-0 rounded-full shadow-md`
      : `${base} !w-2 !h-2 !min-w-2 !p-0 rounded-full bg-muted-foreground hover:bg-muted-foreground`
  }
  
  return base
}

// Active button style
const getActiveStyle = computed(() => {
  const color = props.color
  return {
    backgroundColor: color,
    '--tw-ring-color': `${color}50`,
    borderColor: color
  }
})

// Animation classes
const animationClass = computed(() => {
  if (props.animation === 'none') return ''
  
  return {
    'slide': isAnimating.value 
      ? `animate-pagination-slide-${animationDirection.value}` 
      : '',
    'fade': isAnimating.value ? 'animate-pagination-fade' : '',
    'scale': 'transition-transform hover:scale-110 active:scale-95',
    'flip': isAnimating.value ? 'animate-pagination-flip' : ''
  }[props.animation] || ''
})

// Watch for external page changes
watch(() => props.modelValue, (newVal) => {
  if (newVal !== undefined) {
    internalPage.value = newVal
  }
})

watch(() => props.pageSize, (newVal) => {
  internalPageSize.value = newVal
})
</script>

<template>
  <nav
    v-if="shouldShow"
    v-bind="$attrs"
    :class="cn(
      's-pagination flex flex-wrap items-center',
      gapClasses,
      background && 'p-3 rounded-xl bg-muted border border-border',
      (disabled || loading) && 'opacity-60 pointer-events-none',
      $attrs.class ?? ''
    )"
    role="navigation"
    aria-label="Pagination"
    tabindex="0"
    @keydown="handleKeydown"
  >
    <!-- Loading overlay -->
    <Transition name="fade">
      <div 
        v-if="loading" 
        class="absolute inset-0 flex items-center justify-center bg-background/50 rounded-xl z-10"
      >
        <span class="mdi mdi-loading animate-spin text-2xl" :style="{ color }"></span>
      </div>
    </Transition>

    <!-- Total info -->
    <div 
      v-if="showTotal && !simple" 
      class="flex items-center text-muted-foreground text-sm mr-2"
    >
      <slot name="total" :total="total" :range="currentRange">
        <span>{{ totalText }}</span>
      </slot>
    </div>

    <!-- Page size selector -->
    <div v-if="showPageSize && !simple" class="flex items-center gap-1.5 mr-2">
      <slot name="pageSize" :size="internalPageSize" :options="pageSizeOptions" :change="handlePageSizeChange">
        <select
          :value="internalPageSize"
          class="h-9 px-2 rounded-lg bg-muted border border-border text-foreground text-sm cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/50"
          :disabled="disabled || loading"
          @change="handlePageSizeChange"
        >
          <option 
            v-for="option in pageSizeOptions" 
            :key="option" 
            :value="option"
          >
            {{ option }} / page
          </option>
        </select>
      </slot>
    </div>

    <!-- Simple mode -->
    <template v-if="simple">
      <button
        type="button"
        class="flex items-center gap-1.5"
        :class="getButtonClasses(false, !canGoPrev)"
        :disabled="!canGoPrev"
        @click="goPrev"
      >
        <slot name="prev">
          <span v-if="prevText">{{ prevText }}</span>
          <span v-else class="mdi mdi-chevron-left" :class="iconSizes"></span>
        </slot>
      </button>
      
      <div class="flex items-center gap-2 px-4 text-foreground font-medium">
        <slot name="simple-content" :current="currentPage" :total="totalPages">
          <span :style="{ color }">{{ currentPage }}</span>
          <span class="text-muted-foreground">/</span>
          <span class="text-muted-foreground">{{ totalPages }}</span>
        </slot>
      </div>
      
      <button
        type="button"
        class="flex items-center gap-1.5"
        :class="getButtonClasses(false, !canGoNext)"
        :disabled="!canGoNext"
        @click="goNext"
      >
        <slot name="next">
          <span v-if="nextText">{{ nextText }}</span>
          <span v-else class="mdi mdi-chevron-right" :class="iconSizes"></span>
        </slot>
      </button>
    </template>

    <!-- Full pagination -->
    <template v-else>
      <!-- First button -->
      <button
        v-if="showFirstLast"
        type="button"
        :class="getButtonClasses(false, !canGoFirst)"
        :disabled="!canGoFirst"
        aria-label="First page"
        @click="goFirst"
      >
        <slot name="first">
          <span v-if="firstText">{{ firstText }}</span>
          <span v-else class="mdi mdi-chevron-double-left" :class="iconSizes"></span>
        </slot>
      </button>

      <!-- Previous button -->
      <button
        v-if="showPrevNext"
        type="button"
        :class="getButtonClasses(false, !canGoPrev)"
        :disabled="!canGoPrev"
        aria-label="Previous page"
        @click="goPrev"
      >
        <slot name="prev">
          <span v-if="prevText">{{ prevText }}</span>
          <span v-else class="mdi mdi-chevron-left" :class="iconSizes"></span>
        </slot>
      </button>

      <!-- Page buttons -->
      <div 
        class="flex items-center"
        :class="gapClasses"
      >
        <template v-for="page in visiblePages" :key="page">
          <!-- Ellipsis Start with Dropdown -->
          <div 
            v-if="page === 'ellipsis-start'"
            ref="ellipsisStartRef"
            class="relative"
            @mouseenter="handleEllipsisEnter('start')"
            @mouseleave="handleEllipsisLeave('start')"
          >
            <span 
              class="flex items-center justify-center text-muted-foreground cursor-pointer hover:text-muted-foreground transition-colors"
              :class="sizeClasses"
            >
              <slot name="ellipsis">
                <span class="mdi mdi-dots-horizontal"></span>
              </slot>
            </span>
            
            <!-- Dropdown for hidden pages -->
            <Transition
              enter-active-class="transition-all duration-100 ease-out"
              enter-from-class="opacity-0 scale-95 -translate-y-1"
              enter-to-class="opacity-100 scale-100 translate-y-0"
              leave-active-class="transition-all duration-75 ease-in"
              leave-from-class="opacity-100 scale-100"
              leave-to-class="opacity-0 scale-95"
            >
              <div 
                v-if="ellipsisStartHover && hiddenPagesStart.length > 0"
                class="absolute top-full left-1/2 -translate-x-1/2 mt-1 z-50 p-1.5 rounded-lg bg-background border border-border shadow-xl backdrop-blur-xl max-h-48 overflow-y-auto"
                @mouseenter="handleDropdownEnter('start')"
                @mouseleave="handleDropdownLeave('start')"
              >
                <div class="flex flex-wrap gap-1 min-w-max" :style="{ maxWidth: '200px' }">
                  <button
                    v-for="p in hiddenPagesStart"
                    :key="p"
                    type="button"
                    class="flex items-center justify-center text-sm min-w-8 h-8 px-2 rounded-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                    @click="selectFromDropdown(p)"
                  >
                    {{ p }}
                  </button>
                </div>
              </div>
            </Transition>
          </div>
          
          <!-- Ellipsis End with Dropdown -->
          <div 
            v-else-if="page === 'ellipsis-end'"
            ref="ellipsisEndRef"
            class="relative"
            @mouseenter="handleEllipsisEnter('end')"
            @mouseleave="handleEllipsisLeave('end')"
          >
            <span 
              class="flex items-center justify-center text-muted-foreground cursor-pointer hover:text-muted-foreground transition-colors"
              :class="sizeClasses"
            >
              <slot name="ellipsis">
                <span class="mdi mdi-dots-horizontal"></span>
              </slot>
            </span>
            
            <!-- Dropdown for hidden pages -->
            <Transition
              enter-active-class="transition-all duration-100 ease-out"
              enter-from-class="opacity-0 scale-95 -translate-y-1"
              enter-to-class="opacity-100 scale-100 translate-y-0"
              leave-active-class="transition-all duration-75 ease-in"
              leave-from-class="opacity-100 scale-100"
              leave-to-class="opacity-0 scale-95"
            >
              <div 
                v-if="ellipsisEndHover && hiddenPagesEnd.length > 0"
                class="absolute top-full left-1/2 -translate-x-1/2 mt-1 z-50 p-1.5 rounded-lg bg-background border border-border shadow-xl backdrop-blur-xl max-h-48 overflow-y-auto"
                @mouseenter="handleDropdownEnter('end')"
                @mouseleave="handleDropdownLeave('end')"
              >
                <div class="flex flex-wrap gap-1 min-w-max" :style="{ maxWidth: '200px' }">
                  <button
                    v-for="p in hiddenPagesEnd"
                    :key="p"
                    type="button"
                    class="flex items-center justify-center text-sm min-w-8 h-8 px-2 rounded-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                    @click="selectFromDropdown(p)"
                  >
                    {{ p }}
                  </button>
                </div>
              </div>
            </Transition>
          </div>

          <!-- Page button -->
          <button
            v-else
            type="button"
            :class="[
              getButtonClasses(page === currentPage, false),
              animationClass,
              { 's-pagination__page--active': page === currentPage }
            ]"
            :style="page === currentPage ? getActiveStyle : undefined"
            :aria-current="page === currentPage ? 'page' : undefined"
            :aria-label="`Page ${page}`"
            @click="goToPage(page)"
          >
            <slot name="page" :page="page" :active="page === currentPage">
              <template v-if="variant === 'dots'">
                <span class="sr-only">{{ page }}</span>
              </template>
              <template v-else>
                {{ page }}
              </template>
            </slot>
          </button>
        </template>
      </div>

      <!-- Next button -->
      <button
        v-if="showPrevNext"
        type="button"
        :class="getButtonClasses(false, !canGoNext)"
        :disabled="!canGoNext"
        aria-label="Next page"
        @click="goNext"
      >
        <slot name="next">
          <span v-if="nextText">{{ nextText }}</span>
          <span v-else class="mdi mdi-chevron-right" :class="iconSizes"></span>
        </slot>
      </button>

      <!-- Last button -->
      <button
        v-if="showFirstLast"
        type="button"
        :class="getButtonClasses(false, !canGoLast)"
        :disabled="!canGoLast"
        aria-label="Last page"
        @click="goLast"
      >
        <slot name="last">
          <span v-if="lastText">{{ lastText }}</span>
          <span v-else class="mdi mdi-chevron-double-right" :class="iconSizes"></span>
        </slot>
      </button>
    </template>

    <!-- Quick jump -->
    <div v-if="showQuickJump && !simple" class="flex items-center gap-2 ml-2">
      <slot name="quickJump" :value="jumpValue" :jump="handleQuickJump">
        <span class="text-sm text-muted-foreground">Go to</span>
        <input
          v-model="jumpValue"
          type="number"
          :min="1"
          :max="totalPages"
          class="w-16 h-9 px-2 rounded-lg bg-muted border border-border text-foreground text-sm text-center focus:outline-none focus:ring-2 focus:ring-primary/50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          :disabled="disabled || loading"
          placeholder="#"
          @keydown.enter="handleQuickJump"
        />
      </slot>
    </div>

    <!-- Progress bar -->
    <div 
      v-if="showProgress" 
      class="w-full h-1 mt-2 rounded-full bg-accent overflow-hidden"
    >
      <div 
        class="h-full rounded-full transition-all duration-(--s-duration-slow) ease-out"
        :style="{ 
          width: `${progressPercent}%`,
          backgroundColor: color 
        }"
      ></div>
    </div>
  </nav>
</template>

<style scoped>
.s-pagination {
  position: relative;
}

/* Focus styles */
.s-pagination:focus-visible {
  outline: 2px solid var(--s-primary);
  outline-offset: 2px;
  border-radius: 0.75rem;
}

button:focus-visible {
  outline: none;
  box-shadow: 0 0 0 2px var(--s-background), 0 0 0 4px var(--s-primary);
}

/* Ripple effect for buttons */
.s-pagination button::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: radial-gradient(circle at center, rgba(255,255,255,0.3) 0%, transparent 70%);
  opacity: 0;
  transform: scale(0);
  transition: opacity var(--s-duration-normal), transform var(--s-duration-slow);
}

.s-pagination button:active::after {
  opacity: 1;
  transform: scale(1);
  transition: opacity 0s, transform 0s;
}

/* Animations - Fast and clean to avoid digit overlap */
.pagination-slide-enter-active,
.pagination-slide-leave-active {
  transition: all 0.1s ease-out;
}

.pagination-slide-enter-from {
  opacity: 0;
  transform: translateX(-6px);
}

.pagination-slide-leave-to {
  opacity: 0;
  transform: translateX(6px);
}

.pagination-fade-enter-active,
.pagination-fade-leave-active {
  transition: opacity 0.08s ease;
}

.pagination-fade-enter-from,
.pagination-fade-leave-to {
  opacity: 0;
}

.pagination-scale-enter-active,
.pagination-scale-leave-active {
  transition: all 0.1s ease-out;
}

.pagination-scale-enter-from,
.pagination-scale-leave-to {
  opacity: 0;
  transform: scale(0.9);
}

.pagination-flip-enter-active,
.pagination-flip-leave-active {
  transition: all 0.12s ease-out;
}

.pagination-flip-enter-from {
  opacity: 0;
  transform: rotateY(-45deg);
}

.pagination-flip-leave-to {
  opacity: 0;
  transform: rotateY(45deg);
}

/* Active page pulse animation */
.s-pagination__page--active {
  animation: pagination-pulse 0.15s ease-out;
}

@keyframes pagination-pulse {
  0% {
    transform: scale(0.9);
  }
  50% {
    transform: scale(1.05);
  }
  100% {
    transform: scale(1);
  }
}

/* Hover glow effect */
.s-pagination button:not(:disabled):hover {
  box-shadow: 0 0 0 2px var(--s-border);
}

.s-pagination__page--active:hover {
  box-shadow: 0 4px 12px -2px var(--btn-glow, rgba(0,0,0,0.2));
}

/* Fade transition */
.fade-enter-active,
.fade-leave-active {
  transition: opacity var(--s-duration-normal) ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Screen reader only */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
</style>
