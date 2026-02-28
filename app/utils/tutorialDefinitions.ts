import type { TutorialDefinition } from '~/types/tutorial'
import { useTutorialStore } from '~/stores/tutorialStore'

/**
 * Helper: request an action on the store and wait for DOM to settle.
 * Components watch `pendingAction` and respond (e.g. open/close modals).
 */
function requestAction(
    action:
        | 'open-weapon-modal'
        | 'close-weapon-modal'
        | 'open-loadout-create'
        | 'close-loadout-create'
) {
    const store = useTutorialStore()
    store.requestAction(action)
    // Return a promise that resolves after a tick so DOM updates
    return new Promise<void>((resolve) => setTimeout(resolve, 400))
}

const tutorials: TutorialDefinition[] = [
    {
        id: 'navigate-app',
        nameKey: 'tutorial.navigateApp.name',
        descriptionKey: 'tutorial.navigateApp.description',
        startRoute: '/weapons/rifles',
        requiresAuth: false,
        steps: [
            {
                titleKey: 'tutorial.navigateApp.steps.sidebar.title',
                descriptionKey: 'tutorial.navigateApp.steps.sidebar.description',
                target: 'sidebar-nav',
                popoverPosition: 'right',
                type: 'info',
                spotlightPadding: 0,
            },
            {
                titleKey: 'tutorial.navigateApp.steps.settings.title',
                descriptionKey: 'tutorial.navigateApp.steps.settings.description',
                target: 'settings-dropdown',
                popoverPosition: 'bottom',
                type: 'info',
            },
            {
                titleKey: 'tutorial.navigateApp.steps.loadout.title',
                descriptionKey: 'tutorial.navigateApp.steps.loadout.description',
                target: 'loadout-area',
                popoverPosition: 'bottom',
                type: 'info',
            },
            {
                titleKey: 'tutorial.navigateApp.steps.weapons.title',
                descriptionKey: 'tutorial.navigateApp.steps.weapons.description',
                target: 'weapon-card',
                popoverPosition: 'bottom',
                type: 'info',
            },
            {
                titleKey: 'tutorial.navigateApp.steps.teamTabs.title',
                descriptionKey: 'tutorial.navigateApp.steps.teamTabs.description',
                target: 'team-tabs',
                popoverPosition: 'bottom',
                type: 'info',
            },
            {
                titleKey: 'tutorial.navigateApp.steps.ready.title',
                descriptionKey: 'tutorial.navigateApp.steps.ready.description',
                target: 'sidebar-nav',
                popoverPosition: 'right',
                type: 'info',
                spotlightPadding: 0,
            },
        ],
    },
    {
        id: 'customize-weapon',
        nameKey: 'tutorial.customizeWeapon.name',
        descriptionKey: 'tutorial.customizeWeapon.description',
        startRoute: '/weapons/rifles',
        requiresAuth: true,
        steps: [
            // Step 1: Weapon grid overview
            {
                titleKey: 'tutorial.customizeWeapon.steps.grid.title',
                descriptionKey: 'tutorial.customizeWeapon.steps.grid.description',
                target: 'weapon-card',
                popoverPosition: 'bottom',
                type: 'info',
                beforeStep: () => requestAction('close-weapon-modal'),
            },
            // Step 2: Click to open modal (or Next button opens it automatically)
            {
                titleKey: 'tutorial.customizeWeapon.steps.click.title',
                descriptionKey: 'tutorial.customizeWeapon.steps.click.description',
                target: 'weapon-card',
                popoverPosition: 'bottom',
                type: 'action',
                actionTrigger: 'click',
                beforeStep: () => requestAction('close-weapon-modal'),
                afterStep: () => requestAction('open-weapon-modal'),
            },
            // Step 3: Search bar (inside modal)
            {
                titleKey: 'tutorial.customizeWeapon.steps.search.title',
                descriptionKey: 'tutorial.customizeWeapon.steps.search.description',
                target: 'skin-search',
                popoverPosition: 'bottom',
                type: 'info',
                beforeStep: () => requestAction('open-weapon-modal'),
            },
            // Step 4: Sort & filter controls
            {
                titleKey: 'tutorial.customizeWeapon.steps.sortFilter.title',
                descriptionKey: 'tutorial.customizeWeapon.steps.sortFilter.description',
                target: 'sort-filter',
                popoverPosition: 'top',
                type: 'info',
            },
            // Step 5: Skin gallery grid
            {
                titleKey: 'tutorial.customizeWeapon.steps.skins.title',
                descriptionKey: 'tutorial.customizeWeapon.steps.skins.description',
                target: 'skin-grid',
                popoverPosition: 'top',
                type: 'info',
                spotlightPadding: 4,
            },
            // Step 6: Pagination
            {
                titleKey: 'tutorial.customizeWeapon.steps.pagination.title',
                descriptionKey: 'tutorial.customizeWeapon.steps.pagination.description',
                target: 'skin-pagination',
                popoverPosition: 'top',
                type: 'info',
            },
            // Step 7: Wear slider
            {
                titleKey: 'tutorial.customizeWeapon.steps.wear.title',
                descriptionKey: 'tutorial.customizeWeapon.steps.wear.description',
                target: 'wear-slider',
                popoverPosition: 'top',
                type: 'info',
                scrollBlock: 'end',
            },
            // Step 8: Paint index override
            {
                titleKey: 'tutorial.customizeWeapon.steps.paintIndex.title',
                descriptionKey: 'tutorial.customizeWeapon.steps.paintIndex.description',
                target: 'paint-index-override',
                popoverPosition: 'top',
                type: 'info',
            },
            // Step 9: Active switch
            {
                titleKey: 'tutorial.customizeWeapon.steps.activeSwitch.title',
                descriptionKey: 'tutorial.customizeWeapon.steps.activeSwitch.description',
                target: 'active-switch',
                popoverPosition: 'top',
                type: 'info',
            },
            // Step 10: Sticker slots with dragging
            {
                titleKey: 'tutorial.customizeWeapon.steps.stickers.title',
                descriptionKey: 'tutorial.customizeWeapon.steps.stickers.description',
                target: 'sticker-slots',
                popoverPosition: 'top',
                type: 'info',
            },
            // Step 11: Keychain slot
            {
                titleKey: 'tutorial.customizeWeapon.steps.keychain.title',
                descriptionKey: 'tutorial.customizeWeapon.steps.keychain.description',
                target: 'keychain-section',
                popoverPosition: 'top',
                type: 'info',
            },
            // Step 9: Reset button
            {
                titleKey: 'tutorial.customizeWeapon.steps.reset.title',
                descriptionKey: 'tutorial.customizeWeapon.steps.reset.description',
                target: 'reset-button',
                popoverPosition: 'bottom',
                type: 'info',
            },
            // Step 10: Version history
            {
                titleKey: 'tutorial.customizeWeapon.steps.history.title',
                descriptionKey: 'tutorial.customizeWeapon.steps.history.description',
                target: 'history-button',
                popoverPosition: 'bottom',
                type: 'info',
            },
            // Step 11: Import inspect link
            {
                titleKey: 'tutorial.customizeWeapon.steps.import.title',
                descriptionKey: 'tutorial.customizeWeapon.steps.import.description',
                target: 'import-button',
                popoverPosition: 'bottom',
                type: 'info',
            },
            // Step 12: Generate inspect link
            {
                titleKey: 'tutorial.customizeWeapon.steps.generate.title',
                descriptionKey: 'tutorial.customizeWeapon.steps.generate.description',
                target: 'save-button',
                popoverPosition: 'bottom',
                type: 'info',
            },
            // Step 13: Auto-save explanation
            {
                titleKey: 'tutorial.customizeWeapon.steps.autoSave.title',
                descriptionKey: 'tutorial.customizeWeapon.steps.autoSave.description',
                target: 'auto-save',
                popoverPosition: 'bottom',
                type: 'info',
            },
        ],
    },
    {
        id: 'inspect-link',
        nameKey: 'tutorial.inspectLink.name',
        descriptionKey: 'tutorial.inspectLink.description',
        startRoute: '/',
        requiresAuth: false,
        steps: [
            {
                titleKey: 'tutorial.inspectLink.steps.input.title',
                descriptionKey: 'tutorial.inspectLink.steps.input.description',
                target: 'inspect-input',
                popoverPosition: 'bottom',
                type: 'info',
            },
            {
                titleKey: 'tutorial.inspectLink.steps.decode.title',
                descriptionKey: 'tutorial.inspectLink.steps.decode.description',
                target: 'decode-button',
                popoverPosition: 'bottom',
                type: 'info',
            },
            {
                titleKey: 'tutorial.inspectLink.steps.editor.title',
                descriptionKey: 'tutorial.inspectLink.steps.editor.description',
                target: 'inspect-editor',
                popoverPosition: 'auto',
                type: 'info',
            },
            {
                titleKey: 'tutorial.inspectLink.steps.generate.title',
                descriptionKey: 'tutorial.inspectLink.steps.generate.description',
                target: 'generate-button',
                popoverPosition: 'top',
                type: 'info',
            },
        ],
    },
    {
        id: 'create-loadout',
        nameKey: 'tutorial.createLoadout.name',
        descriptionKey: 'tutorial.createLoadout.description',
        startRoute: '/weapons/rifles',
        requiresAuth: true,
        steps: [
            {
                titleKey: 'tutorial.createLoadout.steps.selector.title',
                descriptionKey: 'tutorial.createLoadout.steps.selector.description',
                target: 'loadout-selector',
                popoverPosition: 'bottom',
                type: 'info',
            },
            {
                titleKey: 'tutorial.createLoadout.steps.create.title',
                descriptionKey: 'tutorial.createLoadout.steps.create.description',
                target: 'loadout-create',
                popoverPosition: 'bottom',
                type: 'info',
            },
            // Step 3: Name input (inside create modal — open it first)
            {
                titleKey: 'tutorial.createLoadout.steps.name.title',
                descriptionKey: 'tutorial.createLoadout.steps.name.description',
                target: 'loadout-name-input',
                popoverPosition: 'bottom',
                type: 'info',
                beforeStep: () => requestAction('open-loadout-create'),
            },
            {
                titleKey: 'tutorial.createLoadout.steps.done.title',
                descriptionKey: 'tutorial.createLoadout.steps.done.description',
                target: 'loadout-selector',
                popoverPosition: 'bottom',
                type: 'info',
                beforeStep: () => requestAction('close-loadout-create'),
            },
        ],
    },
]

export function getAllTutorials(): TutorialDefinition[] {
    return tutorials
}

export function getTutorialById(id: string): TutorialDefinition | undefined {
    return tutorials.find((t) => t.id === id)
}
