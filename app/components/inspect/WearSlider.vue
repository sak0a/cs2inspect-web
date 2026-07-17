<!-- WearSlider.vue — Onyx wear slider on reka-ui SliderRoot -->
<script setup lang="ts">
import { SliderRange, SliderRoot, SliderThumb, SliderTrack } from 'reka-ui'
import { EASE } from '~/utils/motion'

interface Props {
  min?: number
  max?: number
}

const props = withDefaults(defineProps<Props>(), {
  min: 0.0,
  max: 1.0,
})

const modelValue = defineModel<number>({ default: 0.01 })

const { t } = useI18n()

/** Wear band boundaries (CS2 exterior thresholds). */
const BAND_TICKS = [0.07, 0.15, 0.38, 0.45] as const

const bands = computed(() => [
  { from: 0, mid: 0.035, short: t('wears.short.factoryNew'), label: t('wears.factoryNew') },
  { from: 0.07, mid: 0.11, short: t('wears.short.minimalWear'), label: t('wears.minimalWear') },
  { from: 0.15, mid: 0.265, short: t('wears.short.fieldTested'), label: t('wears.fieldTested') },
  { from: 0.38, mid: 0.415, short: t('wears.short.wellWorn'), label: t('wears.wellWorn') },
  {
    from: 0.45,
    mid: 0.725,
    short: t('wears.short.battleScarred'),
    label: t('wears.battleScarred'),
  },
])

const localValue = ref(clampValue(modelValue.value))
const isDragging = ref(false)
const isHovering = ref(false)
const isFocused = ref(false)

/* Release spring (Phase 3): thumb scale springs back on drag release and the
 * numeric pill pulses once. Model writes stay raw/live during drag — the
 * spring is purely visual on the thumb element. */
const rootEl = ref<HTMLElement | null>(null)
const inputEl = ref<HTMLInputElement | null>(null)
const { gsap, ctx } = useGsap(rootEl)
const reducedMotion = useReducedMotion()

function playReleaseSpring() {
  if (reducedMotion.value) return
  ctx(() => {
    const thumb = rootEl.value?.querySelector<HTMLElement>('[role="slider"]')
    if (thumb) {
      gsap.fromTo(
        thumb,
        { scale: 1.15 },
        { scale: 1, duration: 0.35, ease: 'elastic.out(1, 0.5)', overwrite: 'auto', clearProps: 'scale' }
      )
    }
    if (inputEl.value) {
      gsap.fromTo(
        inputEl.value,
        { scale: 1.06 },
        { scale: 1, duration: 0.3, ease: EASE.out, overwrite: 'auto', clearProps: 'scale' }
      )
    }
  })
}

const showReadout = computed(() => isDragging.value || isHovering.value || isFocused.value)

/** 3-decimal display for the numeric pill. */
const displayValue = computed(() => localValue.value.toFixed(3))

/** Full-precision readout for the drag tooltip (3 decimals minimum). */
const preciseValue = computed(() => {
  const v = localValue.value
  const full = Number(v.toFixed(10)).toString()
  const decimals = full.split('.')[1]?.length ?? 0
  return decimals < 3 ? v.toFixed(3) : full
})

const activeBandIndex = computed(() => {
  const list = bands.value
  for (let i = list.length - 1; i >= 0; i--) {
    const band = list[i]
    if (band && localValue.value >= band.from) return i
  }
  return 0
})

const currentWearLabel = computed(() => bands.value[activeBandIndex.value]?.label ?? '')

const handlePosition = computed(() => localValue.value * 100)

const hasRangeConstraint = computed(() => props.min > 0 || props.max < 1)

function clampValue(val: number | string) {
  const numVal = Number(val)
  if (isNaN(numVal)) return props.min
  return Math.min(Math.max(numVal, props.min), props.max)
}

/** Live drag/keyboard updates from reka — clamp to the skin's valid range. */
function handleSliderUpdate(values: number[] | undefined) {
  const raw = values?.[0]
  if (raw === undefined) return
  const newValue = clampValue(Math.round(raw * 1000) / 1000)
  localValue.value = newValue
  modelValue.value = newValue
}

function handleCustomInput(event: Event) {
  const value = (event.target as HTMLInputElement).value
  // Allow only numbers, single decimal point, and minus sign
  if (!/^-?\d*\.?\d*$/.test(value)) {
    ;(event.target as HTMLInputElement).value = displayValue.value
  }
}

function handleBlur(event: Event) {
  const newValue = parseFloat((event.target as HTMLInputElement).value)
  if (!isNaN(newValue)) {
    localValue.value = clampValue(newValue)
    modelValue.value = localValue.value
  }
  ;(event.target as HTMLInputElement).value = displayValue.value
}

function stopDragging() {
  if (isDragging.value) playReleaseSpring()
  isDragging.value = false
}

function startDragging() {
  isDragging.value = true
  window.addEventListener('pointerup', stopDragging, { once: true })
}

// Watch for external value changes
watch(
  modelValue,
  (newValue) => {
    if (newValue !== localValue.value) {
      localValue.value = clampValue(newValue ?? props.min)
    }
  },
  { immediate: true }
)

// Watch for min/max changes
watch([() => props.min, () => props.max], () => {
  localValue.value = clampValue(localValue.value)
})

onBeforeUnmount(() => {
  window.removeEventListener('pointerup', stopDragging)
})
</script>

<template>
  <div class="flex w-full items-center gap-4">
    <!-- Compact mono numeric pill -->
    <input
      ref="inputEl"
      type="text"
      inputmode="decimal"
      class="wear-input h-7 w-20 shrink-0 rounded-full border border-border bg-surface-2 text-center font-mono text-xs text-foreground tabular-nums transition-[border-color,box-shadow] duration-[var(--dur-fast)] ease-[var(--ease-out)] hover:border-border-strong focus:border-primary/60 focus:outline-none focus:ring-2 focus:ring-primary/20 motion-reduce:transition-none"
      :value="displayValue"
      :aria-label="String(t('wears.floatValue'))"
      @input="handleCustomInput"
      @blur="handleBlur"
      @keydown.enter="handleBlur"
    />

    <!-- Track + labels -->
    <div
      ref="rootEl"
      class="relative min-w-0 flex-1"
      @pointerenter="isHovering = true"
      @pointerleave="isHovering = false"
    >
      <SliderRoot
        :model-value="[localValue]"
        :min="0"
        :max="1"
        :step="0.001"
        class="relative flex h-5 w-full touch-none select-none items-center"
        :aria-label="String(t('wears.floatValue'))"
        @update:model-value="handleSliderUpdate"
        @pointerdown="startDragging"
        @focusin="isFocused = true"
        @focusout="isFocused = false"
      >
        <SliderTrack
          class="relative h-1.5 w-full grow overflow-hidden rounded-full border border-border bg-surface-2"
        >
          <!-- Valid-range shading (skin min/max float constraint) -->
          <div
            v-if="hasRangeConstraint"
            class="pointer-events-none absolute inset-y-0 bg-foreground/10"
            :style="{
              left: `${props.min * 100}%`,
              width: `${(props.max - props.min) * 100}%`,
            }"
          />

          <!-- Accent gradient fill from left to thumb -->
          <SliderRange
            class="absolute h-full rounded-full"
            :style="{
              background:
                'linear-gradient(90deg, color-mix(in srgb, var(--primary) 30%, transparent), var(--primary))',
            }"
          />

          <!-- Wear band tick marks -->
          <div
            v-for="tick in BAND_TICKS"
            :key="tick"
            class="pointer-events-none absolute inset-y-0 w-px bg-border-strong"
            :style="{ left: `${tick * 100}%` }"
          />
        </SliderTrack>

        <SliderThumb
          class="block size-4 shrink-0 cursor-grab rounded-full border-2 border-background bg-foreground shadow-[0_2px_6px_rgba(0,0,0,0.45)] transition-shadow duration-[var(--dur-fast)] ease-[var(--ease-out)] hover:ring-4 hover:ring-primary/25 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/40 active:cursor-grabbing motion-reduce:transition-none"
        />
      </SliderRoot>

      <!-- Precise readout tooltip (value + wear name) -->
      <div
        class="pointer-events-none absolute -top-7 z-10 transition-opacity duration-[var(--dur-fast)] ease-[var(--ease-out)] motion-reduce:transition-none"
        :class="showReadout ? 'opacity-100' : 'opacity-0'"
        :style="{ left: `${handlePosition}%` }"
        aria-hidden="true"
      >
        <div
          class="-translate-x-1/2 whitespace-nowrap rounded-md border border-border bg-surface-2 px-2 py-0.5 font-mono text-[10.5px] text-foreground tabular-nums shadow-[var(--shadow-card)]"
        >
          {{ preciseValue }}
          <span class="text-text-tertiary">· {{ currentWearLabel }}</span>
        </div>
      </div>

      <!-- Wear-band labels row -->
      <div
        class="pointer-events-none relative mt-1 h-3 font-mono text-[9px] uppercase tracking-[0.08em]"
        aria-hidden="true"
      >
        <span
          v-for="(band, i) in bands"
          :key="band.from"
          class="absolute top-0 -translate-x-1/2 transition-colors duration-[var(--dur-fast)] ease-[var(--ease-out)] motion-reduce:transition-none"
          :class="i === activeBandIndex ? 'text-primary' : 'text-text-tertiary'"
          :style="{ left: `${band.mid * 100}%` }"
        >
          {{ band.short }}
        </span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.wear-input {
  caret-color: var(--primary);
}
</style>
