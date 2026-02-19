import type { TutorialStep } from '~/utils/tutorials/types'

export function useTutorials() {
  const tutorialStore = useTutorialStore()
  const message = useMessage()
  const route = useRoute()
  const { t } = useI18n()

  const targetRect = ref<DOMRect | null>(null)

  const refreshTarget = (step?: TutorialStep) => {
    if (!import.meta.client || !step?.targetSelector) {
      targetRect.value = null
      return
    }

    const element = document.querySelector(step.targetSelector)
    if (!element) {
      targetRect.value = null
      return
    }

    targetRect.value = element.getBoundingClientRect()
  }

  const startTutorial = (id: string) => {
    const started = tutorialStore.startTutorial(id)
    if (!started && tutorialStore.blockedReason) {
      message.warning(String(t(tutorialStore.blockedReason)))
      tutorialStore.clearBlockedReason()
      return false
    }

    return started
  }

  const canNavigateTo = (path: string) => {
    const step = tutorialStore.currentStep
    if (!tutorialStore.isRunning || !step?.lockNavigation) {
      return true
    }

    return step.route ? path === step.route : path === route.path
  }

  return {
    tutorialStore,
    targetRect,
    startTutorial,
    stopTutorial: tutorialStore.stopTutorial,
    goNext: tutorialStore.nextStep,
    goBack: tutorialStore.prevStep,
    refreshTarget,
    canNavigateTo,
  }
}
