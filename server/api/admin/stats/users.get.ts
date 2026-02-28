/**
 * GET /api/admin/stats/users
 *
 * Returns user statistics for the admin dashboard:
 * - Top users by loadout count with total items
 * - User distribution statistics (average, max loadouts per user)
 *
 * Query parameters:
 * - limit: number (default 10, max 50) - Number of top users to return
 */
import { createError } from 'h3'
import { z } from 'zod'
import { useErrorHandling } from '~/server/utils/errorHandler'
import { createSuccessResponse, createResponseMeta } from '~/server/utils/api/responseHelpers'
import { parseQueryWithSchema } from '~/server/utils/validation/zodHelpers'
import { ADMIN_ERROR_CODES } from '~/server/utils/constants'
import {
    getTopUsersByLoadouts,
    getUserDistributionStats,
    type TopUser,
} from '~/server/utils/admin/statsQueries'

// Query parameter schema
const userStatsQuerySchema = z.object({
    limit: z.coerce.number().int().min(1).max(50).default(10),
})

export interface UserDistributionStats {
    averageLoadoutsPerUser: number
    maxLoadoutsPerUser: number
    usersWithSingleLoadout: number
    usersWithMultipleLoadouts: number
}

export interface AdminUserStats {
    topUsers: TopUser[]
    distribution: UserDistributionStats
}

export default useErrorHandling(async (event) => {
    const startTime = Date.now()

    // Verify admin access
    if (!event.context.admin) {
        throw createError({
            statusCode: 403,
            message: 'Admin access required',
        })
    }

    // Parse and validate query parameters
    const { limit } = parseQueryWithSchema(userStatsQuerySchema, event)

    // Fetch user statistics in parallel
    const [topUsers, distribution] = await Promise.all([
        getTopUsersByLoadouts(limit),
        getUserDistributionStats(),
    ])

    const stats: AdminUserStats = {
        topUsers,
        distribution,
    }

    const meta = createResponseMeta(startTime, {
        adminSteamId: event.context.admin.steamId,
        endpoint: 'admin/stats/users',
        limit,
    })

    return createSuccessResponse(stats, meta, 'User stats fetched successfully')
}, ADMIN_ERROR_CODES.STATS_ERROR)
