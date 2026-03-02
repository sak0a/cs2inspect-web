/**
 * GET /api/admin/activity-log
 *
 * Returns paginated activity log entries.
 * Query params: page (default 1), limit (default 50), action (optional filter by action type)
 * Requires admin authentication (any admin role).
 */
import { eq, desc, sql } from 'drizzle-orm'
import { useErrorHandling } from '~/server/utils/errorHandler'
import { useDatabase } from '~/server/utils/database'
import { adminActivityLog } from '~/server/database/schema'
import {
  createPaginatedResponse,
  createResponseMeta,
  createPaginationMeta,
} from '~/server/utils/api/responseHelpers'
import { parseQueryWithSchema } from '~/server/utils/validation/zodHelpers'
import { adminActivityLogQuerySchema } from '~/server/utils/validation/adminSchemas'

export default useErrorHandling(async (event) => {
  const startTime = Date.now()

  const { page, limit, action } = parseQueryWithSchema(adminActivityLogQuerySchema, event)

  const db = useDatabase()
  const offset = (page - 1) * limit

  // Build base query conditions
  const whereCondition = action ? eq(adminActivityLog.action, action) : undefined

  // Get total count
  const [countResult] = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(adminActivityLog)
    .where(whereCondition)

  const totalItems = Number(countResult?.count || 0)

  // Fetch paginated entries
  const entries = await db
    .select({
      id: adminActivityLog.id,
      adminSteamId: adminActivityLog.admin_steamid,
      action: adminActivityLog.action,
      targetSteamId: adminActivityLog.target_steamid,
      details: adminActivityLog.details,
      createdAt: adminActivityLog.created_at,
    })
    .from(adminActivityLog)
    .where(whereCondition)
    .orderBy(desc(adminActivityLog.created_at))
    .limit(limit)
    .offset(offset)

  const pagination = createPaginationMeta(page, totalItems, limit, entries.length)
  const meta = createResponseMeta(startTime, { method: 'GET' })

  return createPaginatedResponse(
    entries,
    pagination,
    meta,
    action ? { action } : undefined,
    undefined,
    'Activity log fetched successfully'
  )
}, 'ADMIN_ACTIVITY_LOG_ERROR')
