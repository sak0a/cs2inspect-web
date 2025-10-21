/**
 * Health check sampler - periodically runs health checks and saves results
 */
import { runAllHealthChecks } from './probes';
import { saveHealthCheckResults, cleanupHealthCheckHistory } from './history';

let samplerInterval: NodeJS.Timeout | null = null;
let cleanupInterval: NodeJS.Timeout | null = null;

/**
 * Start the health check sampler
 * @param intervalMs - Interval in milliseconds between health checks (default: 60000 = 1 minute)
 */
export function startHealthCheckSampler(intervalMs: number = 60000): void {
    // Don't start multiple samplers
    if (samplerInterval) {
        console.log('Health check sampler already running');
        return;
    }

    console.log(`Starting health check sampler with ${intervalMs}ms interval`);

    // Run immediately on start
    runHealthCheckSample();

    // Then run periodically
    samplerInterval = setInterval(async () => {
        await runHealthCheckSample();
    }, intervalMs);

    // Start cleanup job - runs once per day
    startCleanupJob();
}

/**
 * Stop the health check sampler
 */
export function stopHealthCheckSampler(): void {
    if (samplerInterval) {
        clearInterval(samplerInterval);
        samplerInterval = null;
        console.log('Health check sampler stopped');
    }

    if (cleanupInterval) {
        clearInterval(cleanupInterval);
        cleanupInterval = null;
        console.log('Health check cleanup job stopped');
    }
}

/**
 * Run a single health check sample
 */
async function runHealthCheckSample(): Promise<void> {
    try {
        const results = await runAllHealthChecks();
        await saveHealthCheckResults(results);
        
        // Log summary
        const statusCounts = {
            ok: results.filter(r => r.status === 'ok').length,
            degraded: results.filter(r => r.status === 'degraded').length,
            fail: results.filter(r => r.status === 'fail').length,
        };
        
        console.log(`Health check sample completed: ${statusCounts.ok} ok, ${statusCounts.degraded} degraded, ${statusCounts.fail} fail`);
    } catch (error: any) {
        console.error('Health check sample failed:', error.message);
    }
}

/**
 * Start the cleanup job for old health check history
 */
function startCleanupJob(): void {
    // Run cleanup once per day
    const oneDayMs = 24 * 60 * 60 * 1000;
    
    cleanupInterval = setInterval(async () => {
        try {
            const deleted = await cleanupHealthCheckHistory(7); // Keep 7 days
            console.log(`Cleaned up ${deleted} old health check records`);
        } catch (error: any) {
            console.error('Health check cleanup failed:', error.message);
        }
    }, oneDayMs);
}

/**
 * Get sampler status
 */
export function getHealthCheckSamplerStatus(): { running: boolean } {
    return {
        running: samplerInterval !== null,
    };
}
