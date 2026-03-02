import { db } from '~/server/database/client'
import { pluginSettings } from '~/server/database/schema'
import { count } from 'drizzle-orm'
import { PLUGIN_SETTINGS_SEEDS } from '~/server/utils/pluginSettingsSeeds'
import { Logger } from '~/server/utils/logger'

export default defineNitroPlugin(async () => {
  try {
    const [result] = await db.select({ count: count() }).from(pluginSettings)
    if (result && result.count === 0) {
      await db.insert(pluginSettings).values(PLUGIN_SETTINGS_SEEDS)
      Logger.info(
        `Seeded ${PLUGIN_SETTINGS_SEEDS.length} default plugin settings`,
        'plugin-settings'
      )
    }
  } catch (error) {
    Logger.error(
      `Failed to seed plugin settings error=${error instanceof Error ? error.message : String(error)}`,
      'plugin-settings'
    )
  }
})
