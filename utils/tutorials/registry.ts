import type { TutorialDefinition } from '~/utils/tutorials/types'

export const tutorialSchemaVersion = 1

export const tutorialRegistry: TutorialDefinition[] = [
  {
    id: 'quick-navigation',
    titleKey: 'tutorials.catalog.quickNavigation.title',
    descriptionKey: 'tutorials.catalog.quickNavigation.description',
    estimatedMinutes: 2,
    difficulty: 'beginner',
    steps: [
      {
        id: 'welcome',
        titleKey: 'tutorials.steps.welcome.title',
        bodyKey: 'tutorials.steps.welcome.body',
        placement: 'auto',
        allowOverlayNext: true,
      },
      {
        id: 'open-settings',
        titleKey: 'tutorials.steps.openSettings.title',
        bodyKey: 'tutorials.steps.openSettings.body',
        targetSelector: '[data-tutorial="settings-button"]',
        placement: 'bottom',
        allowOverlayNext: true,
      },
      {
        id: 'home-menu',
        titleKey: 'tutorials.steps.homeMenu.title',
        bodyKey: 'tutorials.steps.homeMenu.body',
        targetSelector: '[data-tutorial="home-menu"]',
        placement: 'bottom',
        allowOverlayNext: true,
      }
    ]
  },
  {
    id: 'loadout-basics',
    titleKey: 'tutorials.catalog.loadoutBasics.title',
    descriptionKey: 'tutorials.catalog.loadoutBasics.description',
    estimatedMinutes: 3,
    difficulty: 'beginner',
    steps: [
      {
        id: 'loadout-selector',
        titleKey: 'tutorials.steps.loadoutSelector.title',
        bodyKey: 'tutorials.steps.loadoutSelector.body',
        targetSelector: '[data-tutorial="loadout-selector"]',
        placement: 'bottom',
        lockNavigation: true,
        allowOverlayNext: true,
      },
      {
        id: 'weapons-menu',
        titleKey: 'tutorials.steps.weaponsMenu.title',
        bodyKey: 'tutorials.steps.weaponsMenu.body',
        targetSelector: '[data-tutorial="weapons-menu"]',
        placement: 'bottom',
        allowOverlayNext: true,
      }
    ]
  },
  {
    id: 'inspect-workflow',
    titleKey: 'tutorials.catalog.inspectWorkflow.title',
    descriptionKey: 'tutorials.catalog.inspectWorkflow.description',
    estimatedMinutes: 2,
    difficulty: 'intermediate',
    steps: [
      {
        id: 'extras-menu',
        titleKey: 'tutorials.steps.extrasMenu.title',
        bodyKey: 'tutorials.steps.extrasMenu.body',
        targetSelector: '[data-tutorial="extras-menu"]',
        placement: 'bottom',
        allowOverlayNext: true,
      },
      {
        id: 'finish',
        titleKey: 'tutorials.steps.finish.title',
        bodyKey: 'tutorials.steps.finish.body',
        placement: 'auto',
        allowOverlayNext: true,
      }
    ]
  }
]

export function getTutorialById(id: string) {
  return tutorialRegistry.find(tutorial => tutorial.id === id)
}
