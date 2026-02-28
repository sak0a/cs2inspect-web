/**
 * PUT /api/admin/plugin-settings
 *
 * Updates a single plugin setting by key.
 * Requires superadmin role.
 * Body: { key: string, value: string | number | boolean | object | array }
 *
 * After update, inserts a sync notification so the plugin can hot-reload.
 */
import { createError, readBody } from 'h3'
import { eq } from 'drizzle-orm'
import { useErrorHandling } from '~/server/utils/errorHandler'
import { useDatabase } from '~/server/utils/database'
import { pluginSettings, adminActivityLog } from '~/server/database/schema'
import { createSuccessResponse, createResponseMeta } from '~/server/utils/api/responseHelpers'
import { parseBodyWithSchema } from '~/server/utils/validation/zodHelpers'
import { adminUpdatePluginSettingSchema } from '~/server/utils/validation/adminSchemas'
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

    const body = await readBody(event)
    const { key, value } = parseBodyWithSchema(adminUpdatePluginSettingSchema, body)

    const db = useDatabase()
    const adminSteamId = event.context.admin.steamId

    // Convert value to string for storage
    const stringValue = typeof value === 'object' ? JSON.stringify(value) : String(value)

    // Check if setting exists
    const [existing] = await db
        .select({ id: pluginSettings.id })
        .from(pluginSettings)
        .where(eq(pluginSettings.key, key))
        .limit(1)

    if (!existing) {
        throw createError({
            statusCode: 404,
            message: `Plugin setting "${key}" not found`,
        })
    }

    // Update the setting
    await db
        .update(pluginSettings)
        .set({
            value: stringValue,
            updated_by: adminSteamId,
        })
        .where(eq(pluginSettings.key, key))

    // Log action
    await db.insert(adminActivityLog).values({
        admin_steamid: adminSteamId,
        action: 'update_plugin_setting',
        details: {
            key,
            value: stringValue,
        },
    })

    // Notify plugin of config change via sync notification
    notifyPluginOfWebChange('system', 0, 'config')

    // Fetch the updated setting
    const [updatedSetting] = await db
        .select({
            key: pluginSettings.key,
            value: pluginSettings.value,
            type: pluginSettings.type,
            category: pluginSettings.category,
            label: pluginSettings.label,
            description: pluginSettings.description,
            reloadBehavior: pluginSettings.reload_behavior,
            sortOrder: pluginSettings.sort_order,
            updatedAt: pluginSettings.updated_at,
            updatedBy: pluginSettings.updated_by,
        })
        .from(pluginSettings)
        .where(eq(pluginSettings.key, key))
        .limit(1)

    const meta = createResponseMeta(startTime, { method: 'PUT' })
    return createSuccessResponse(updatedSetting, meta, 'Plugin setting updated successfully')
}, 'ADMIN_SETTINGS_ERROR')
