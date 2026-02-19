export type TutorialStatus = 'idle' | 'running' | 'paused' | 'completed' | 'cancelled'

export interface TutorialStep {
  id: string
  titleKey: string
  bodyKey: string
  route?: string
  targetSelector?: string
  placement?: 'top' | 'bottom' | 'left' | 'right' | 'auto'
  allowOverlayNext?: boolean
  allowTargetInteraction?: boolean
  requiredActionId?: string
  lockNavigation?: boolean
}

export interface TutorialDefinition {
  id: string
  titleKey: string
  descriptionKey: string
  estimatedMinutes: number
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  steps: TutorialStep[]
}

export interface TutorialProgress {
  completed: boolean
  lastStep: number
  lastSeenAt: number
}
