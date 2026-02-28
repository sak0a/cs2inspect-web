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
