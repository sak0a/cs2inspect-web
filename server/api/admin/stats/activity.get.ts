/**
 * GET /api/admin/stats/activity
 *
 * Returns activity time-series data for the admin dashboard:
 * - Daily new users, active users, loadouts created, items saved
 * - Heatmap data for activity visualization
 *
 * Query parameters:
 * - range: '7d' | '30d' | '90d' (default '30d') - Time range for data
 */
import { createError } from 'h3'
import { z } from 'zod'
import { useErrorHandling } from '~/server/utils/errorHandler'
import { createSuccessResponse, createResponseMeta } from '~/server/utils/api/responseHelpers'
import { parseQueryWithSchema } from '~/server/utils/validation/zodHelpers'
import { ADMIN_ERROR_CODES } from '~/server/utils/constants'
import {
    getActivityTimeseries,
    getHeatmapData,
    type ActivityTimeseriesEntry,
    type HeatmapEntry,
} from '~/server/utils/admin/statsQueries'

// Query parameter schema
const activityQuerySchema = z.object({
    range: z.enum(['7d', '30d', '90d']).default('30d'),
})

// Map range string to number of days
const rangeToDays = {
    '7d': 7,
    '30d': 30,
    '90d': 90,
} as const

type RangeKey = keyof typeof rangeToDays

export interface AdminActivityStats {
    timeseries: ActivityTimeseriesEntry[]
    heatmap: HeatmapEntry[]
    summary: {
        totalNewUsers: number
        totalLoadoutsCreated: number
        totalItemsSaved: number
        averageDailyActiveUsers: number
    }
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
    const { range } = parseQueryWithSchema(activityQuerySchema, event)
    const days = rangeToDays[range as RangeKey]

    // Fetch activity data in parallel
    const [timeseries, heatmap] = await Promise.all([
        getActivityTimeseries(days),
        getHeatmapData(days),
    ])

    // Calculate summary statistics
    const totalNewUsers = timeseries.reduce((sum, entry) => sum + entry.newUsers, 0)
    const totalLoadoutsCreated = timeseries.reduce((sum, entry) => sum + entry.loadoutsCreated, 0)
    const totalItemsSaved = timeseries.reduce((sum, entry) => sum + entry.itemsSaved, 0)
    const totalActiveUsers = timeseries.reduce((sum, entry) => sum + entry.activeUsers, 0)
    const averageDailyActiveUsers =
        timeseries.length > 0 ? Math.round((totalActiveUsers / timeseries.length) * 100) / 100 : 0

    const stats: AdminActivityStats = {
        timeseries,
        heatmap,
        summary: {
            totalNewUsers,
            totalLoadoutsCreated,
            totalItemsSaved,
            averageDailyActiveUsers,
        },
    }

    const meta = createResponseMeta(startTime, {
        adminSteamId: event.context.admin.steamId,
        endpoint: 'admin/stats/activity',
        range,
        days,
    })

    return createSuccessResponse(stats, meta, 'Activity stats fetched successfully')
}, ADMIN_ERROR_CODES.STATS_ERROR)
