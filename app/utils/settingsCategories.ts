export type AppSettingCategory = 'general' | 'features' | 'tutorials' | 'limits'

export interface AppSettingCategoryConfig {
    key: AppSettingCategory
    label: string
    description: string
    settingKeys: string[]
}

export const APP_SETTING_CATEGORIES: AppSettingCategoryConfig[] = [
    {
        key: 'general',
        label: 'General',
        description: 'Core application settings',
        settingKeys: [
            'MAINTENANCE_MODE',
            'REGISTRATION_ENABLED',
            'SITE_ANNOUNCEMENT',
        ],
    },
    {
        key: 'features',
        label: 'Features',
        description: 'Toggle application features on or off',
        settingKeys: [
            'FEATURE_INSPECT_URLS',
            'FEATURE_STICKERS',
            'FEATURE_KEYCHAINS',
            'FEATURE_TUTORIALS',
            'FEATURE_SHARE_CODES',
        ],
    },
    {
        key: 'tutorials',
        label: 'Tutorials',
        description: 'Control individual tutorial availability',
        settingKeys: [
            'TUTORIAL_NAVIGATE_APP',
            'TUTORIAL_CUSTOMIZE_WEAPON',
            'TUTORIAL_INSPECT_LINK',
            'TUTORIAL_CREATE_LOADOUT',
        ],
    },
    {
        key: 'limits',
        label: 'Limits',
        description: 'Configure application limits and thresholds',
        settingKeys: [
            'MAX_LOADOUTS_PER_USER',
            'MAX_LOADOUT_NAME_LENGTH',
            'MAX_VERSION_HISTORY_PER_ITEM',
        ],
    },
]

export const SETTING_KEY_TO_CATEGORY: Record<string, AppSettingCategory> = {}
for (const cat of APP_SETTING_CATEGORIES) {
    for (const key of cat.settingKeys) {
        SETTING_KEY_TO_CATEGORY[key] = cat.key
    }
}
