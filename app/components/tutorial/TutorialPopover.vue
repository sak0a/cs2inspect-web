<script setup lang="ts">
import type { TutorialStep, PopoverPosition } from '~/types/tutorial'

interface Props {
  step: TutorialStep | null
  targetRect: { x: number; y: number; width: number; height: number } | null
  stepIndex: number
  totalSteps: number
  isLastStep: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'next' | 'previous' | 'stop'): void
}>()

const { t } = useI18n()

const POPOVER_GAP = 16
const POPOVER_WIDTH = 380

const resolvedPosition = computed<PopoverPosition>(() => {
  if (!props.step || !props.targetRect) return 'bottom'
  if (props.step.popoverPosition !== 'auto') return props.step.popoverPosition

  const rect = props.targetRect
  const vw = window.innerWidth
  const vh = window.innerHeight

  const spaceTop = rect.y
  const spaceBottom = vh - (rect.y + rect.height)
  const spaceLeft = rect.x
  const spaceRight = vw - (rect.x + rect.width)

  const spaces: [PopoverPosition, number][] = [
    ['bottom', spaceBottom],
    ['top', spaceTop],
    ['right', spaceRight],
    ['left', spaceLeft],
  ]

  spaces.sort((a, b) => b[1] - a[1])
  return spaces[0]?.[0] ?? 'bottom'
})

const popoverStyle = computed(() => {
  if (!props.targetRect) return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }

  const rect = props.targetRect
  const pos = resolvedPosition.value
  const style: Record<string, string> = {}

  switch (pos) {
    case 'bottom':
      style.top = `${rect.y + rect.height + POPOVER_GAP}px`
      style.left = `${Math.max(16, Math.min(rect.x + rect.width / 2 - POPOVER_WIDTH / 2, window.innerWidth - POPOVER_WIDTH - 16))}px`
      break
    case 'top':
      style.bottom = `${window.innerHeight - rect.y + POPOVER_GAP}px`
      style.left = `${Math.max(16, Math.min(rect.x + rect.width / 2 - POPOVER_WIDTH / 2, window.innerWidth - POPOVER_WIDTH - 16))}px`
      break
    case 'right':
      style.top = `${Math.max(16, rect.y + rect.height / 2 - 80)}px`
      style.left = `${rect.x + rect.width + POPOVER_GAP}px`
      break
    case 'left':
      style.top = `${Math.max(16, rect.y + rect.height / 2 - 80)}px`
      style.right = `${window.innerWidth - rect.x + POPOVER_GAP}px`
      break
  }

  return style
})

const stepContentKey = computed(() => `step-${props.stepIndex}`)
</script>

<template>
  <div
    v-if="step"
    :class="['tutorial-popover', `tutorial-popover--${resolvedPosition}`]"
    :style="popoverStyle"
    role="dialog"
    aria-modal="false"
    :aria-label="String(t(step.titleKey) || '')"
  >
    <!-- Arrow -->
    <div class="tutorial-popover__arrow" />

    <!-- Content with step transition -->
    <Transition name="tutorial-step" mode="out-in">
      <div :key="stepContentKey">
        <div class="tutorial-popover__title">
          {{ t(step.titleKey) }}
        </div>
        <div class="tutorial-popover__description">
          {{ t(step.descriptionKey) }}
        </div>
      </div>
    </Transition>

    <!-- Progress Dots -->
    <div v-if="totalSteps > 1" class="tutorial-progress-dots mb-4">
      <div
        v-for="i in totalSteps"
        :key="i"
        :class="[
          'tutorial-progress-dot',
          { 'tutorial-progress-dot--active': i - 1 === stepIndex },
          { 'tutorial-progress-dot--completed': i - 1 < stepIndex },
        ]"
      />
    </div>

    <!-- Actions -->
    <div class="tutorial-popover__actions">
      <div class="tutorial-popover__actions-left">
        <button class="tutorial-popover__skip" @click="emit('stop')">
          {{ t('tutorial.skip') }}
        </button>
      </div>
      <div class="tutorial-popover__actions-right">
        <button
          v-if="stepIndex > 0"
          class="tutorial-btn tutorial-btn--secondary"
          @click="emit('previous')"
        >
          {{ t('tutorial.back') }}
        </button>
        <button
          class="tutorial-btn tutorial-btn--primary"
          @click="emit('next')"
        >
          {{ isLastStep ? t('tutorial.finish') : t('tutorial.next') }}
        </button>
      </div>
    </div>
  </div>
</template>
