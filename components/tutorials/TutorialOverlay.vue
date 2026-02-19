<script setup lang="ts">
const { t } = useI18n()
const { tutorialStore, targetRect, goBack, goNext, stopTutorial, refreshTarget } = useTutorials()

const stepLabel = computed(() => {
  if (!tutorialStore.currentTutorial) {
    return ''
  }

  return t('tutorials.overlay.stepCounter', {
    current: tutorialStore.activeStepIndex + 1,
    total: tutorialStore.currentTutorial.steps.length,
  })
})

const popoverStyle = computed(() => {
  const rect = targetRect.value
  if (!import.meta.client || !rect) {
    return {
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
    }
  }

  const top = rect.bottom + 12
  const left = Math.min(Math.max(rect.left, 24), window.innerWidth - 360)
  return {
    top: `${top}px`,
    left: `${left}px`,
    transform: 'none',
  }
})

const spotlightStyle = computed(() => {
  const rect = targetRect.value
  if (!rect) {
    return {}
  }

  return {
    top: `${rect.top - 8}px`,
    left: `${rect.left - 8}px`,
    width: `${rect.width + 16}px`,
    height: `${rect.height + 16}px`,
  }
})

const handleRefresh = () => refreshTarget(tutorialStore.currentStep)

onMounted(() => {
  tutorialStore.initialize()
  window.addEventListener('resize', handleRefresh)
  window.addEventListener('scroll', handleRefresh, true)
})

onBeforeUnmount(() => {
  if (!import.meta.client) {
    return
  }

  window.removeEventListener('resize', handleRefresh)
  window.removeEventListener('scroll', handleRefresh, true)
})

watch(() => tutorialStore.currentStep, (step) => {
  refreshTarget(step)
}, { immediate: true })
</script>

<template>
  <Teleport to="body">
    <Transition name="tutorial-fade">
      <div v-if="tutorialStore.isRunning" class="tutorial-overlay">
        <div class="tutorial-backdrop" />
        <div v-if="targetRect" class="tutorial-spotlight" :style="spotlightStyle" />

        <div class="tutorial-popover" :style="popoverStyle" role="dialog" aria-live="polite">
          <div class="text-xs text-gray-400 mb-1">{{ stepLabel }}</div>
          <h4 class="text-base font-semibold">{{ t(tutorialStore.currentStep?.titleKey || '') }}</h4>
          <p class="text-sm text-gray-300 mt-1">{{ t(tutorialStore.currentStep?.bodyKey || '') }}</p>

          <div class="mt-4 flex items-center justify-between gap-2">
            <NButton size="small" tertiary :disabled="tutorialStore.activeStepIndex === 0" @click="goBack">
              {{ t('tutorials.overlay.back') }}
            </NButton>
            <div class="flex gap-2">
              <NButton size="small" tertiary type="error" @click="stopTutorial">
                {{ t('tutorials.overlay.stop') }}
              </NButton>
              <NButton size="small" type="primary" @click="goNext">
                {{ t('tutorials.overlay.next') }}
              </NButton>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped lang="sass">
.tutorial-overlay
  position: fixed
  inset: 0
  z-index: 4000

.tutorial-backdrop
  position: absolute
  inset: 0
  background: rgba(0, 0, 0, 0.74)
  backdrop-filter: blur(2px)

.tutorial-spotlight
  position: fixed
  border-radius: 12px
  border: 2px solid rgba(99, 226, 183, 0.85)
  box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.65), 0 0 18px rgba(99, 226, 183, 0.6)
  pointer-events: none

.tutorial-popover
  position: fixed
  width: min(340px, calc(100vw - 24px))
  border-radius: 14px
  border: 1px solid var(--glass-border, rgba(255, 255, 255, 0.1))
  background: rgba(20, 20, 20, 0.85)
  backdrop-filter: blur(14px)
  padding: 14px

.tutorial-fade-enter-active,
.tutorial-fade-leave-active
  transition: opacity 0.2s ease

.tutorial-fade-enter-from,
.tutorial-fade-leave-to
  opacity: 0
</style>
