/**
 * GET /api/admin/plugin-settings
 *
 * Returns all plugin settings sorted by category and sort_order.
 * Requires admin authentication (any admin role).
 */
import { useErrorHandling } from '~/server/utils/errorHandler'
import { useDatabase } from '~/server/utils/database'
import { pluginSettings } from '~/server/database/schema'
import { asc } from 'drizzle-orm'
import { createSuccessResponse, createResponseMeta } from '~/server/utils/api/responseHelpers'

export default useErrorHandling(async () => {
  const startTime = Date.now()

  const db = useDatabase()

  const settings = await db
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
    .orderBy(asc(pluginSettings.category), asc(pluginSettings.sort_order))

  const meta = createResponseMeta(startTime, { method: 'GET' })
  return createSuccessResponse(settings, meta, 'Plugin settings fetched successfully')
}, 'ADMIN_SETTINGS_ERROR')
