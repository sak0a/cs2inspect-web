/**
 * POST /api/admin/plugin-settings/reset
 *
 * Resets all plugin settings to defaults.
 * Deletes all rows and re-inserts seed data.
 * Requires superadmin role.
 */
import { createError } from 'h3'
import { useErrorHandling } from '~/server/utils/errorHandler'
import { useDatabase } from '~/server/utils/database'
import { pluginSettings, adminActivityLog } from '~/server/database/schema'
import { createSuccessResponse, createResponseMeta } from '~/server/utils/api/responseHelpers'
import { PLUGIN_SETTINGS_SEEDS } from '~/server/utils/pluginSettingsSeeds'
import { notifyPluginOfWebChange } from '~/server/utils/sync/notifySync'

export default useErrorHandling(async (event) => {
    const startTime = Date.now()

    // Check superadmin role
    if (event.context.admin?.role !== 'superadmin') {
        throw createError({
            statusCode: 403,
            message: 'Superadmin access required',
        })
    }

    const db = useDatabase()
    const adminSteamId = event.context.admin.steamId

    // Delete all and re-insert defaults
    await db.delete(pluginSettings)
    await db.insert(pluginSettings).values(PLUGIN_SETTINGS_SEEDS)

    // Log action
    await db.insert(adminActivityLog).values({
        admin_steamid: adminSteamId,
        action: 'reset_plugin_settings',
        details: {
            settingsCount: PLUGIN_SETTINGS_SEEDS.length,
        },
    })

    // Notify plugin of config change
    notifyPluginOfWebChange('system', 0, 'config')

    const meta = createResponseMeta(startTime, { method: 'POST' })
    return createSuccessResponse(
        { resetCount: PLUGIN_SETTINGS_SEEDS.length },
        meta,
        'Plugin settings reset to defaults'
    )
}, 'ADMIN_SETTINGS_ERROR')
