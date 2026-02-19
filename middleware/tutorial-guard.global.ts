export default defineNuxtRouteMiddleware((to) => {
  if (!import.meta.client) {
    return
  }

  const tutorialStore = useTutorialStore()
  if (!tutorialStore.isRunning) {
    return
  }

  const currentStep = tutorialStore.currentStep
  if (!currentStep?.lockNavigation) {
    return
  }

  if (currentStep.route && currentStep.route !== to.path) {
    return navigateTo(currentStep.route)
  }
})
