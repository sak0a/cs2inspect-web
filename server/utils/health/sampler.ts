/**
 * Health check sampler - periodically runs health checks and saves results
 */
import { runAllHealthChecks } from './probes'
import { saveHealthCheckResults, cleanupHealthCheckHistory } from './history'
import { Logger } from '~/server/utils/logger'

let samplerInterval: NodeJS.Timeout | null = null
let cleanupInterval: NodeJS.Timeout | null = null

/**
 * Start the health check sampler
 * @param intervalMs - Interval in milliseconds between health checks (default: 60000 = 1 minute)
 */
export function startHealthCheckSampler(intervalMs: number = 60000): void {
    // Don't start multiple samplers
    if (samplerInterval) {
        Logger.debug('Sampler already running', 'healthcheck')
        return
    }

    const interval = intervalMs % 1000 === 0 ? `${intervalMs / 1000}s` : `${intervalMs}ms`
    Logger.info(`Sampler start interval=${interval}`, 'healthcheck')

    // Run immediately on start
    runHealthCheckSample()

    // Then run periodically
    samplerInterval = setInterval(async () => {
        await runHealthCheckSample()
    }, intervalMs)

    // Start cleanup job - runs once per day
    startCleanupJob()
}

/**
 * Stop the health check sampler
 */
export function stopHealthCheckSampler(): void {
    if (samplerInterval) {
        clearInterval(samplerInterval)
        samplerInterval = null
        Logger.info('Sampler stop', 'healthcheck')
    }

    if (cleanupInterval) {
        clearInterval(cleanupInterval)
        cleanupInterval = null
        Logger.info('Cleanup stop', 'healthcheck')
    }
}

/**
 * Run a single health check sample
 */
async function runHealthCheckSample(): Promise<void> {
    try {
        const results = await runAllHealthChecks()
        await saveHealthCheckResults(results)

        // Log summary
        const statusCounts = {
            ok: results.filter((r) => r.status === 'ok').length,
            degraded: results.filter((r) => r.status === 'degraded').length,
            fail: results.filter((r) => r.status === 'fail').length,
        }

        Logger.info(
            `Sample ok=${statusCounts.ok} degraded=${statusCounts.degraded} fail=${statusCounts.fail}`,
            'healthcheck'
        )
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        Logger.error(`Sample failed error=${errorMessage}`, 'healthcheck')
    }
}

/**
 * Start the cleanup job for old health check history
 */
function startCleanupJob(): void {
    // Run cleanup once per day
    const oneDayMs = 24 * 60 * 60 * 1000

    cleanupInterval = setInterval(async () => {
        try {
            const deleted = await cleanupHealthCheckHistory(7) // Keep 7 days
            Logger.info(`Cleanup removed=${deleted}`, 'healthcheck')
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error'
            Logger.error(`Cleanup failed error=${errorMessage}`, 'healthcheck')
        }
    }, oneDayMs)
}

/**
 * Get sampler status
 */
export function getHealthCheckSamplerStatus(): { running: boolean } {
    return {
        running: samplerInterval !== null,
    }
}
