/**
 * GET /api/admin/settings
 *
 * Returns all app settings as an array.
 * Requires admin authentication (any admin role).
 */
import { useErrorHandling } from '~/server/utils/errorHandler'
import { useDatabase } from '~/server/utils/database'
import { appSettings } from '~/server/database/schema'
import { createSuccessResponse, createResponseMeta } from '~/server/utils/api/responseHelpers'

export default useErrorHandling(async () => {
    const startTime = Date.now()

    const db = useDatabase()

    // Fetch all settings
    const settings = await db
        .select({
            key: appSettings.key,
            value: appSettings.value,
            type: appSettings.type,
            description: appSettings.description,
            updatedAt: appSettings.updated_at,
            updatedBy: appSettings.updated_by,
        })
        .from(appSettings)

    const meta = createResponseMeta(startTime, { method: 'GET' })
    return createSuccessResponse(settings, meta, 'Settings fetched successfully')
}, 'ADMIN_SETTINGS_ERROR')
