/**
 * Readiness probe endpoint
 * Returns OK if all critical dependencies are healthy
 * Used by container orchestrators and load balancers to determine if the container can receive traffic
 */
import { defineEventHandler, createError } from 'h3';
import { checkDatabase, checkEnvironment, getOverallStatus } from '~/server/utils/health/probes';
import type { ReadinessResponse } from '~/server/types/health';

export default defineEventHandler(async (): Promise<ReadinessResponse> => {
    try {
        // Run critical checks only (database and environment)
        // Steam checks are optional - app can function without them for basic operations
        const checks = await Promise.all([
            checkDatabase(),
            checkEnvironment(),
        ]);

        const overallStatus = getOverallStatus(checks);
        const ready = overallStatus === 'ok';

        const response: ReadinessResponse = {
            status: overallStatus,
            timestamp: new Date(),
            ready,
            checks: checks.map(check => ({
                name: check.name,
                status: check.status,
                latency_ms: check.latency_ms,
            })),
        };

        // Return 503 if not ready
        if (!ready) {
            throw createError({
                statusCode: 503,
                message: 'Service not ready',
                data: response,
            });
        }

        return response;
    } catch (error: unknown) {
        // If it's already an H3 error, rethrow it
        if (error && typeof error === 'object' && 'statusCode' in error) {
            throw error;
        }

        // Otherwise, create a 503 error
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        throw createError({
            statusCode: 503,
            message: `Readiness check failed: ${errorMessage}`,
        });
    }
});
