/**
 * Detailed health check endpoint
 * Returns detailed health information for all system components
 */
import { defineEventHandler } from 'h3';
import { runAllHealthChecks, getOverallStatus } from '~/server/utils/health/probes';
import type { DetailedHealthResponse } from '~/server/types/health';

export default defineEventHandler(async (): Promise<DetailedHealthResponse> => {
    try {
        const checks = await runAllHealthChecks();
        const overallStatus = getOverallStatus(checks);

        return {
            status: overallStatus,
            timestamp: new Date(),
            checks,
        };
    } catch (error: unknown) {
        // Even if the check fails, try to return some information
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return {
            status: 'fail',
            timestamp: new Date(),
            checks: [{
                name: 'system',
                status: 'fail',
                checked_at: new Date(),
                message: `Health check failed: ${errorMessage}`,
            }],
        };
    }
});
