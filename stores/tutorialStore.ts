import { defineStore } from 'pinia'
import type { TutorialDefinition, TutorialStep } from '~/types/tutorial'
import { getTutorialById } from '~/utils/tutorialDefinitions'

const STORAGE_KEY = 'cs2inspect_tutorial_completions'

export type TutorialAction = 'open-weapon-modal' | 'close-weapon-modal' | 'open-loadout-create' | 'close-loadout-create' | null

interface TutorialState {
  activeTutorialId: string | null
  currentStepIndex: number
  isActive: boolean
  completedTutorials: string[]
  targetRect: DOMRect | null
  /** Signal for components to perform actions (e.g. open/close modals) */
  pendingAction: TutorialAction
}

export const useTutorialStore = defineStore('tutorial', {
  state: (): TutorialState => ({
    activeTutorialId: null,
    currentStepIndex: 0,
    isActive: false,
    completedTutorials: [],
    targetRect: null,
    pendingAction: null,
  }),

  getters: {
    activeTutorial(): TutorialDefinition | null {
      if (!this.activeTutorialId) return null
      return getTutorialById(this.activeTutorialId) ?? null
    },

    currentStep(): TutorialStep | null {
      const tutorial = this.activeTutorial
      if (!tutorial) return null
      return tutorial.steps[this.currentStepIndex] ?? null
    },

    totalSteps(): number {
      return this.activeTutorial?.steps.length ?? 0
    },

    progressLabel(): string {
      return `${this.currentStepIndex + 1} / ${this.totalSteps}`
    },

    isLastStep(): boolean {
      return this.currentStepIndex >= this.totalSteps - 1
    },

    isTutorialCompleted() {
      return (id: string) => this.completedTutorials.includes(id)
    },
  },

  actions: {
    async startTutorial(tutorialId: string) {
      if (this.isActive) return

      const tutorial = getTutorialById(tutorialId)
      if (!tutorial) return

      this.activeTutorialId = tutorialId
      this.currentStepIndex = 0
      this.isActive = true

      if (tutorial.startRoute) {
        await navigateTo(tutorial.startRoute)
      }
    },

    async nextStep() {
      if (!this.isActive || !this.activeTutorial) return

      const current = this.currentStep
      if (current?.afterStep) {
        await current.afterStep()
      }

      if (this.isLastStep) {
        this.completeTutorial(this.activeTutorialId!)
        this.stopTutorial()
        return
      }

      this.currentStepIndex++
    },

    async previousStep() {
      if (!this.isActive || this.currentStepIndex <= 0) return

      const current = this.currentStep
      if (current?.afterStep) {
        await current.afterStep()
      }

      this.currentStepIndex--
    },

    stopTutorial() {
      this.isActive = false
      this.activeTutorialId = null
      this.currentStepIndex = 0
      this.targetRect = null
      this.pendingAction = null

      if (import.meta.client) {
        document.querySelectorAll('.tutorial-highlight-active').forEach(el => {
          el.classList.remove('tutorial-highlight-active')
        })
      }
    },

    completeTutorial(tutorialId: string) {
      if (!this.completedTutorials.includes(tutorialId)) {
        this.completedTutorials.push(tutorialId)
        this.persistState()
      }
    },

    updateTargetRect(rect: DOMRect | null) {
      this.targetRect = rect
    },

    /**
     * Request a component to perform an action (e.g. open a modal).
     * Components watch `pendingAction` and respond accordingly.
     */
    requestAction(action: TutorialAction) {
      this.pendingAction = action
    },

    clearAction() {
      this.pendingAction = null
    },

    loadPersistedState() {
      if (!import.meta.client) return
      try {
        const raw = localStorage.getItem(STORAGE_KEY)
        if (raw) {
          const parsed = JSON.parse(raw)
          if (Array.isArray(parsed)) {
            this.completedTutorials = parsed.filter(
              (id: unknown) => typeof id === 'string'
            )
          }
        }
      } catch (e) {
        console.warn('Failed to load tutorial state:', e)
      }
    },

    persistState() {
      if (!import.meta.client) return
      try {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify(this.completedTutorials)
        )
      } catch (e) {
        console.warn('Failed to persist tutorial state:', e)
      }
    },
  },
})
