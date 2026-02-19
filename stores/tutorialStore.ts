import { defineStore } from 'pinia'
import { getTutorialById, tutorialRegistry, tutorialSchemaVersion } from '~/utils/tutorials/registry'
import type { TutorialProgress, TutorialStatus } from '~/utils/tutorials/types'

interface TutorialState {
  activeTutorialId: string | null
  activeStepIndex: number
  status: TutorialStatus
  blockedReason: string | null
  progressByTutorial: Record<string, TutorialProgress>
  schemaVersion: number
}

const storageKey = 'cs2inspect:tutorials'

export const useTutorialStore = defineStore('tutorial', {
  state: (): TutorialState => ({
    activeTutorialId: null,
    activeStepIndex: 0,
    status: 'idle',
    blockedReason: null,
    progressByTutorial: {},
    schemaVersion: tutorialSchemaVersion,
  }),

  getters: {
    tutorials: () => tutorialRegistry,
    isRunning: state => state.status === 'running',
    currentTutorial: state => state.activeTutorialId ? getTutorialById(state.activeTutorialId) : undefined,
    currentStep: (state) => {
      if (!state.activeTutorialId) {
        return undefined
      }
      const tutorial = getTutorialById(state.activeTutorialId)
      return tutorial?.steps[state.activeStepIndex]
    },
    canStartAnother: state => state.status !== 'running',
  },

  actions: {
    initialize() {
      if (!import.meta.client) {
        return
      }

      const raw = localStorage.getItem(storageKey)
      if (!raw) {
        return
      }

      try {
        const parsed = JSON.parse(raw) as Pick<TutorialState, 'schemaVersion' | 'progressByTutorial'>
        if (parsed.schemaVersion !== tutorialSchemaVersion) {
          localStorage.removeItem(storageKey)
          return
        }
        this.progressByTutorial = parsed.progressByTutorial || {}
      } catch {
        localStorage.removeItem(storageKey)
      }
    },

    persist() {
      if (!import.meta.client) {
        return
      }

      localStorage.setItem(storageKey, JSON.stringify({
        schemaVersion: tutorialSchemaVersion,
        progressByTutorial: this.progressByTutorial,
      }))
    },

    startTutorial(id: string) {
      if (this.status === 'running' && this.activeTutorialId !== id) {
        this.blockedReason = 'tutorials.toasts.stopCurrentFirst'
        return false
      }

      const tutorial = getTutorialById(id)
      if (!tutorial) {
        return false
      }

      this.activeTutorialId = id
      this.activeStepIndex = 0
      this.status = 'running'
      this.blockedReason = null
      return true
    },

    resumeTutorial(id: string) {
      const tutorial = getTutorialById(id)
      if (!tutorial) {
        return false
      }

      const saved = this.progressByTutorial[id]
      this.activeTutorialId = id
      this.activeStepIndex = saved?.lastStep || 0
      this.status = 'running'
      this.blockedReason = null
      return true
    },

    nextStep() {
      const tutorial = this.currentTutorial
      if (!tutorial) {
        return
      }

      if (this.activeStepIndex >= tutorial.steps.length - 1) {
        this.completeTutorial()
        return
      }

      this.activeStepIndex += 1
      this.saveProgress()
    },

    prevStep() {
      if (this.activeStepIndex <= 0) {
        return
      }

      this.activeStepIndex -= 1
      this.saveProgress()
    },

    stopTutorial() {
      if (!this.activeTutorialId) {
        return
      }

      this.saveProgress(false)
      this.status = 'cancelled'
      this.activeTutorialId = null
      this.activeStepIndex = 0
    },

    completeTutorial() {
      if (!this.activeTutorialId) {
        return
      }

      this.saveProgress(true)
      this.status = 'completed'
      this.activeTutorialId = null
      this.activeStepIndex = 0
    },

    saveProgress(completed = false) {
      if (!this.activeTutorialId) {
        return
      }

      this.progressByTutorial[this.activeTutorialId] = {
        completed,
        lastStep: this.activeStepIndex,
        lastSeenAt: Date.now(),
      }
      this.persist()
    },

    clearBlockedReason() {
      this.blockedReason = null
    },
  },
})
