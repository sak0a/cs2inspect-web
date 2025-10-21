/**
 * Detailed health check endpoint
 * Returns detailed health information for all system components
 */
import { defineEventHandler } from 'h3';
import { runAllHealthChecks, getOverallStatus } from '~/server/utils/health/probes';
import type { DetailedHealthResponse } from '~/server/types/health';

export default defineEventHandler(async (event): Promise<DetailedHealthResponse> => {
    try {
        const checks = await runAllHealthChecks();
        const overallStatus = getOverallStatus(checks);

        return {
            status: overallStatus,
            timestamp: new Date(),
            checks,
        };
    } catch (error: any) {
        // Even if the check fails, try to return some information
        return {
            status: 'fail',
            timestamp: new Date(),
            checks: [{
                name: 'system',
                status: 'fail',
                checked_at: new Date(),
                message: `Health check failed: ${error.message}`,
            }],
        };
    }
});
