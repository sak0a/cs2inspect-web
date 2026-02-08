/**
 * GET /api/admin/stats/overview
 *
 * Returns overview statistics for the admin dashboard:
 * - Total users (unique Steam IDs with loadouts)
 * - Active users in last 7 and 30 days
 * - Total loadouts
 * - Total items by category
 * - Banned users count
 */
import { createError } from 'h3'
import { useErrorHandling } from '~/server/utils/errorHandler'
import { createSuccessResponse, createResponseMeta } from '~/server/utils/api/responseHelpers'
import { ADMIN_ERROR_CODES } from '~/server/utils/constants'
import {
    countDistinctUsers,
    countActiveUsers,
    countTotalLoadouts,
    countItemsByCategory,
    countBannedUsers
} from '~/server/utils/admin/statsQueries'

export interface AdminOverviewStats {
    totalUsers: number
    activeUsers7d: number
    activeUsers30d: number
    totalLoadouts: number
    totalItems: {
        weapons: number
        knives: number
        gloves: number
        agents: number
        musicKits: number
        pins: number
        total: number
    }
    bannedUsers: number
}

export default useErrorHandling(async (event) => {
    const startTime = Date.now()

    // Verify admin access
    if (!event.context.admin) {
        throw createError({
            statusCode: 403,
            message: 'Admin access required'
        })
    }

    // Fetch all statistics in parallel
    const [
        totalUsers,
        activeUsers7d,
        activeUsers30d,
        totalLoadouts,
        itemCounts,
        bannedUsers
    ] = await Promise.all([
        countDistinctUsers(),
        countActiveUsers(7),
        countActiveUsers(30),
        countTotalLoadouts(),
        countItemsByCategory(),
        countBannedUsers()
    ])

    // Calculate total items
    const totalItemsCount = itemCounts.weapons +
        itemCounts.knives +
        itemCounts.gloves +
        itemCounts.agents +
        itemCounts.musicKits +
        itemCounts.pins

    const stats: AdminOverviewStats = {
        totalUsers,
        activeUsers7d,
        activeUsers30d,
        totalLoadouts,
        totalItems: {
            ...itemCounts,
            total: totalItemsCount
        },
        bannedUsers
    }

    const meta = createResponseMeta(startTime, {
        adminSteamId: event.context.admin.steamId,
        endpoint: 'admin/stats/overview'
    })

    return createSuccessResponse(stats, meta, 'Admin overview stats fetched successfully')
}, ADMIN_ERROR_CODES.STATS_ERROR)
