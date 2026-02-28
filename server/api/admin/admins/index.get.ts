/**
 * GET /api/admin/admins
 *
 * Returns list of all admin users.
 * Requires superadmin role.
 */
import { createError } from 'h3'
import { useErrorHandling } from '~/server/utils/errorHandler'
import { useDatabase } from '~/server/utils/database'
import { adminUsers } from '~/server/database/schema'
import { createSuccessResponse, createResponseMeta } from '~/server/utils/api/responseHelpers'

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

    // Fetch all admin users
    const admins = await db
        .select({
            id: adminUsers.id,
            steamId: adminUsers.steamid,
            role: adminUsers.role,
            permissions: adminUsers.permissions,
            createdBy: adminUsers.created_by,
            createdAt: adminUsers.created_at,
        })
        .from(adminUsers)

    const meta = createResponseMeta(startTime, { method: 'GET' })
    return createSuccessResponse(admins, meta, 'Admin users fetched successfully')
}, 'ADMIN_MANAGEMENT_ERROR')
