/**
 * Exposes reactive tutorial state and control methods wired to the tutorial store.
 *
 * The composable loads persisted tutorial state when running on the client and provides
 * read-only computed bindings for current tutorial state alongside controls to start,
 * stop, navigate, check completion, and reset completed tutorials.
 *
 * @returns An object with:
 * - `isActive`: computed boolean indicating whether a tutorial is active
 * - `activeTutorialId`: computed current tutorial id or `null`
 * - `currentStep`: computed current step data or `null`
 * - `currentStepIndex`: computed index of the current step
 * - `totalSteps`: computed total number of steps in the active tutorial
 * - `progressLabel`: computed human-readable progress label
 * - `isLastStep`: computed boolean indicating whether the current step is the last
 * - `start(tutorialId)`: starts the tutorial with the given id
 * - `stop()`: stops the active tutorial
 * - `next()`: advances to the next step
 * - `previous()`: goes back to the previous step
 * - `isCompleted(tutorialId)`: returns `true` if the tutorial with the given id is completed, `false` otherwise
 * - `resetAll()`: clears completed tutorials and persists the cleared state
 */
export function useTutorial() {
  const store = useTutorialStore()

  if (import.meta.client) {
    onMounted(() => {
      store.loadPersistedState()
    })
  }

  function start(tutorialId: string) {
    store.startTutorial(tutorialId)
  }

  function stop() {
    store.stopTutorial()
  }

  function next() {
    store.nextStep()
  }

  function previous() {
    store.previousStep()
  }

  function isCompleted(tutorialId: string): boolean {
    return store.isTutorialCompleted(tutorialId)
  }

  function resetAll() {
    store.completedTutorials = []
    store.persistState()
  }

  return {
    isActive: computed(() => store.isActive),
    activeTutorialId: computed(() => store.activeTutorialId),
    currentStep: computed(() => store.currentStep),
    currentStepIndex: computed(() => store.currentStepIndex),
    totalSteps: computed(() => store.totalSteps),
    progressLabel: computed(() => store.progressLabel),
    isLastStep: computed(() => store.isLastStep),

    start,
    stop,
    next,
    previous,
    isCompleted,
    resetAll,
  }
}