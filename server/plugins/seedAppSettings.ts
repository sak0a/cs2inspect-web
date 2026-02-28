import { db } from '~/server/database/client'
import { appSettings } from '~/server/database/schema'
import { DEFAULT_APP_SETTINGS } from '~/server/utils/constants'
import { Logger } from '~/server/utils/logger'

export default defineNitroPlugin(async () => {
    try {
        const existingSettings = await db.select({ key: appSettings.key }).from(appSettings)

        const existingKeys = new Set(existingSettings.map((s) => s.key))

        const missingSettings = Object.entries(DEFAULT_APP_SETTINGS)
            .filter(([key]) => !existingKeys.has(key))
            .map(([key, def]) => ({
                key,
                value: def.value,
                type: def.type,
                description: def.description,
            }))

        if (missingSettings.length > 0) {
            await db.insert(appSettings).values(missingSettings)
            Logger.info(
                `Seeded ${missingSettings.length} app settings (${missingSettings.map((s) => s.key).join(', ')})`,
                'app-settings'
            )
        }
    } catch (error) {
        Logger.error(
            `Failed to seed app settings error=${error instanceof Error ? error.message : String(error)}`,
            'app-settings'
        )
    }
})
