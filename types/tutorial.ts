export type PopoverPosition = 'top' | 'bottom' | 'left' | 'right' | 'auto'
export type StepType = 'info' | 'action'

export interface TutorialStep {
  /** i18n key for the step title */
  titleKey: string
  /** i18n key for the step description */
  descriptionKey: string
  /** data-tutorial attribute value of the target element */
  target: string
  /** Where to position the popover relative to the target */
  popoverPosition: PopoverPosition
  /** 'info' = Next button only, 'action' = wait for user interaction */
  type: StepType
  /** For action steps: identifier for the expected user action */
  actionTrigger?: string
  /** Route the user must be on for this step */
  requiredRoute?: string
  /** Async setup logic before the step activates (e.g., navigate, open modal) */
  beforeStep?: () => Promise<void> | void
  /** Async cleanup logic after advancing from this step */
  afterStep?: () => Promise<void> | void
  /** Extra padding around the spotlight in pixels (default: 8) */
  spotlightPadding?: number
}

export interface TutorialDefinition {
  /** Unique identifier */
  id: string
  /** i18n key for the tutorial name (shown in menu) */
  nameKey: string
  /** i18n key for the description */
  descriptionKey: string
  /** Route to navigate to when starting the tutorial */
  startRoute: string
  /** Ordered list of steps */
  steps: TutorialStep[]
  /** Only show this tutorial if the user is authenticated */
  requiresAuth?: boolean
}
