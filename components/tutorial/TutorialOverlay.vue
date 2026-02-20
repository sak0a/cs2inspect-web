<script setup lang="ts">
const store = useTutorialStore()
const spotlightRect = ref({ x: 0, y: 0, width: 0, height: 0 })
const previousTarget = ref<Element | null>(null)
let resizeObserver: ResizeObserver | null = null
let pollTimer: ReturnType<typeof requestAnimationFrame> | null = null

const DEFAULT_PADDING = 8

function cleanupHighlight() {
  if (previousTarget.value) {
    previousTarget.value.classList.remove('tutorial-highlight-active')
    previousTarget.value = null
  }
}

function cleanupObservers() {
  if (resizeObserver) {
    resizeObserver.disconnect()
    resizeObserver = null
  }
  if (pollTimer) {
    cancelAnimationFrame(pollTimer)
    pollTimer = null
  }
}

function updateRect(el: Element, padding: number) {
  const rect = el.getBoundingClientRect()
  spotlightRect.value = {
    x: rect.x - padding,
    y: rect.y - padding,
    width: rect.width + padding * 2,
    height: rect.height + padding * 2,
  }
  store.updateTargetRect(rect)
}

function highlightStep() {
  const step = store.currentStep
  if (!step) return

  cleanupHighlight()
  cleanupObservers()

  const padding = step.spotlightPadding ?? DEFAULT_PADDING

  const findAndHighlight = (attempts = 0) => {
    const el = document.querySelector(`[data-tutorial="${step.target}"]`)
    if (el) {
      // Scroll element into view so it's visible before highlighting
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })

      // Wait for smooth scroll to settle, then measure
      setTimeout(() => {
        el.classList.add('tutorial-highlight-active')
        previousTarget.value = el
        updateRect(el, padding)

        // Keep rect updated on resize/scroll
        resizeObserver = new ResizeObserver(() => updateRect(el, padding))
        resizeObserver.observe(el)
      }, 350)
      return
    }

    // Element not in DOM yet — poll for up to 3 seconds
    if (attempts < 60) {
      pollTimer = requestAnimationFrame(() => findAndHighlight(attempts + 1))
    } else {
      // Timeout: center spotlight as fallback
      spotlightRect.value = {
        x: window.innerWidth / 2 - 100,
        y: window.innerHeight / 2 - 50,
        width: 200,
        height: 100,
      }
    }
  }

  findAndHighlight()
}

async function runBeforeStep() {
  const step = store.currentStep
  if (step?.beforeStep) {
    await step.beforeStep()
    // Give the DOM a tick to update after navigation/modal opens
    await nextTick()
  }
}

// Update spotlight when step changes
watch(
  () => store.currentStepIndex,
  async () => {
    if (!store.isActive) return
    await runBeforeStep()
    highlightStep()
  },
)

// Initial highlight when tutorial starts
watch(
  () => store.isActive,
  async (active) => {
    if (active) {
      await nextTick()
      await runBeforeStep()
      highlightStep()
    } else {
      cleanupHighlight()
      cleanupObservers()
    }
  },
)

// Keep rect updated on scroll
function handleScroll() {
  if (!store.isActive || !previousTarget.value) return
  const padding = store.currentStep?.spotlightPadding ?? DEFAULT_PADDING
  updateRect(previousTarget.value, padding)
}

// Handle ESC to exit tutorial
function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && store.isActive) {
    e.preventDefault()
    store.stopTutorial()
  }
}

onMounted(() => {
  window.addEventListener('scroll', handleScroll, true)
  window.addEventListener('keydown', handleKeydown)
  window.addEventListener('resize', handleScroll)
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', handleScroll, true)
  window.removeEventListener('keydown', handleKeydown)
  window.removeEventListener('resize', handleScroll)
  cleanupHighlight()
  cleanupObservers()
})

function handleNext() {
  store.nextStep()
}

function handlePrevious() {
  store.previousStep()
}

function handleStop() {
  store.stopTutorial()
}

// For action steps: listen to clicks on the highlighted element
watch(
  () => [store.isActive, store.currentStep] as const,
  ([active, step]) => {
    if (!active || !step || step.type !== 'action') return

    const checkAction = () => {
      const el = document.querySelector(`[data-tutorial="${step.target}"]`)
      if (!el) return

      const listener = () => {
        el.removeEventListener('click', listener)
        // Small delay so the click action can complete
        setTimeout(() => store.nextStep(), 300)
      }
      el.addEventListener('click', listener)
    }

    // Wait for element to be highlighted
    setTimeout(checkAction, 100)
  },
  { immediate: true },
)
</script>

<template>
  <Teleport to="body">
    <Transition name="tutorial-overlay">
      <div v-if="store.isActive" class="tutorial-overlay">
        <!-- SVG Backdrop with spotlight cutout -->
        <svg class="tutorial-backdrop" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <mask id="tutorial-spotlight-mask">
              <rect fill="white" width="100%" height="100%" />
              <rect
                :x="spotlightRect.x"
                :y="spotlightRect.y"
                :width="spotlightRect.width"
                :height="spotlightRect.height"
                rx="12"
                fill="black"
                class="tutorial-spotlight-cutout"
              />
            </mask>
          </defs>

          <!-- Dark overlay with cutout hole -->
          <rect
            width="100%"
            height="100%"
            fill="rgba(0, 0, 0, 0.75)"
            mask="url(#tutorial-spotlight-mask)"
          />

          <!-- Yellow highlight border around the cutout -->
          <rect
            :x="spotlightRect.x"
            :y="spotlightRect.y"
            :width="spotlightRect.width"
            :height="spotlightRect.height"
            rx="12"
            fill="none"
            stroke="#FACC15"
            stroke-width="2"
            class="tutorial-spotlight-border"
          />
        </svg>

        <!-- Popover -->
        <TutorialPopover
          :step="store.currentStep"
          :target-rect="spotlightRect"
          :step-index="store.currentStepIndex"
          :total-steps="store.totalSteps"
          :is-last-step="store.isLastStep"
          @next="handleNext"
          @previous="handlePrevious"
          @stop="handleStop"
        />
      </div>
    </Transition>
  </Teleport>
</template>
