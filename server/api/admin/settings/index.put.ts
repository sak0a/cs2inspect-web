/**
 * PUT /api/admin/settings
 *
 * Upsert an app setting (insert if not exists, update if exists).
 * Requires superadmin role.
 * Body: { key: string, value: string | number | boolean }
 */
import { createError, readBody } from 'h3'
import { eq } from 'drizzle-orm'
import { useErrorHandling } from '~/server/utils/errorHandler'
import { useDatabase } from '~/server/utils/database'
import { appSettings, adminActivityLog } from '~/server/database/schema'
import {
    createSuccessResponse,
    createResponseMeta,
} from '~/server/utils/api/responseHelpers'
import { parseBodyWithSchema } from '~/server/utils/validation/zodHelpers'
import { adminUpdateSettingSchema } from '~/server/utils/validation/adminSchemas'
import { DEFAULT_APP_SETTINGS } from '~/server/utils/constants'

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
    const { key, value } = parseBodyWithSchema(adminUpdateSettingSchema, body)

    const db = useDatabase()
    const adminSteamId = event.context.admin.steamId

    // Convert value to string for storage
    const stringValue = String(value)

    // Determine the type for storage
    let valueType: string = 'string'
    if (typeof value === 'boolean') {
        valueType = 'boolean'
    } else if (typeof value === 'number') {
        valueType = 'number'
    }

    // Check if setting exists
    const [existing] = await db
        .select({ id: appSettings.id })
        .from(appSettings)
        .where(eq(appSettings.key, key))
        .limit(1)

    if (existing) {
        // Update existing setting
        await db
            .update(appSettings)
            .set({
                value: stringValue,
                type: valueType,
                updated_by: adminSteamId,
            })
            .where(eq(appSettings.key, key))
    } else {
        // Insert new setting — include description from defaults if available
        const defaultDef = DEFAULT_APP_SETTINGS[key as keyof typeof DEFAULT_APP_SETTINGS]
        await db.insert(appSettings).values({
            key,
            value: stringValue,
            type: valueType,
            description: defaultDef?.description ?? null,
            updated_by: adminSteamId,
        })
    }

    // Log action to adminActivityLog
    await db.insert(adminActivityLog).values({
        admin_steamid: adminSteamId,
        action: 'update_setting',
        details: {
            key,
            value: stringValue,
            type: valueType,
            operation: existing ? 'update' : 'insert',
        },
    })

    // Fetch the updated/created setting
    const [updatedSetting] = await db
        .select({
            key: appSettings.key,
            value: appSettings.value,
            type: appSettings.type,
            description: appSettings.description,
            updatedAt: appSettings.updated_at,
            updatedBy: appSettings.updated_by,
        })
        .from(appSettings)
        .where(eq(appSettings.key, key))
        .limit(1)

    const meta = createResponseMeta(startTime, { method: 'PUT' })
    return createSuccessResponse(
        updatedSetting,
        meta,
        existing ? 'Setting updated successfully' : 'Setting created successfully'
    )
}, 'ADMIN_SETTINGS_ERROR')
