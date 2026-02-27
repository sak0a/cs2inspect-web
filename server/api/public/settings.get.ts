/**
 * GET /api/public/settings
 *
 * Unauthenticated endpoint returning curated subset of app settings
 * for client-side feature awareness. Does NOT expose internal settings.
 */
import { getCachedSetting } from '~/server/utils/settingsCache'

// Settings exposed to the client with their default values and types
const PUBLIC_SETTINGS: Record<string, { default: boolean | number | string; type: 'boolean' | 'number' | 'string' }> = {
    // General
    MAINTENANCE_MODE: { default: false, type: 'boolean' },
    REGISTRATION_ENABLED: { default: true, type: 'boolean' },
    SITE_ANNOUNCEMENT: { default: '', type: 'string' },

    // Features
    FEATURE_INSPECT_URLS: { default: true, type: 'boolean' },
    FEATURE_STICKERS: { default: true, type: 'boolean' },
    FEATURE_KEYCHAINS: { default: true, type: 'boolean' },
    FEATURE_TUTORIALS: { default: true, type: 'boolean' },
    FEATURE_SHARE_CODES: { default: true, type: 'boolean' },

    // Tutorials
    TUTORIAL_NAVIGATE_APP: { default: true, type: 'boolean' },
    TUTORIAL_CUSTOMIZE_WEAPON: { default: true, type: 'boolean' },
    TUTORIAL_INSPECT_LINK: { default: true, type: 'boolean' },
    TUTORIAL_CREATE_LOADOUT: { default: true, type: 'boolean' },

    // Limits
    MAX_LOADOUTS_PER_USER: { default: 10, type: 'number' },
    MAX_LOADOUT_NAME_LENGTH: { default: 25, type: 'number' },
}

export default defineEventHandler(async () => {
    const settings: Record<string, boolean | number | string> = {}

    await Promise.all(
        Object.entries(PUBLIC_SETTINGS).map(async ([key, def]) => {
            settings[key] = await getCachedSetting(key, def.default)
        })
    )

    return { settings }
})
