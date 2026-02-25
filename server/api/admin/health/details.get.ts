/**
 * GET /api/admin/health/details
 *
 * Returns detailed health check information for the admin panel.
 * Includes all probe results with full metadata, server process info,
 * and sampler status.
 */
import { createError } from 'h3'
import { useErrorHandling } from '~/server/utils/errorHandler'
import { createSuccessResponse, createResponseMeta } from '~/server/utils/api/responseHelpers'
import { ADMIN_ERROR_CODES } from '~/server/utils/constants'
import { runAllHealthChecks, getOverallStatus } from '~/server/utils/health/probes'
import { getHealthCheckSamplerStatus } from '~/server/utils/health/sampler'

export default useErrorHandling(async (event) => {
    const startTime = Date.now()

    if (!event.context.admin) {
        throw createError({
            statusCode: 403,
            message: 'Admin access required'
        })
    }

    const checks = await runAllHealthChecks()
    const overallStatus = getOverallStatus(checks)
    const samplerStatus = getHealthCheckSamplerStatus()

    const memUsage = process.memoryUsage()

    const data = {
        status: overallStatus,
        timestamp: new Date(),
        checks,
        sampler: samplerStatus,
        server: {
            nodeVersion: process.version,
            platform: process.platform,
            arch: process.arch,
            uptimeSeconds: Math.floor(process.uptime()),
            memoryUsage: {
                rss: memUsage.rss,
                heapUsed: memUsage.heapUsed,
                heapTotal: memUsage.heapTotal,
                external: memUsage.external,
            },
        },
    }

    const meta = createResponseMeta(startTime, {
        adminSteamId: event.context.admin.steamId,
        endpoint: 'admin/health/details'
    })

    return createSuccessResponse(data, meta, 'Health check details fetched')
}, ADMIN_ERROR_CODES.STATS_ERROR)
