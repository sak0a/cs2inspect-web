/**
 * Liveness probe endpoint
 * Returns OK if the process is running
 * Used by container orchestrators to determine if the container should be restarted
 */
import { defineEventHandler } from 'h3';
import type { LivenessResponse } from '~/server/types/health';

export default defineEventHandler(async (event): Promise<LivenessResponse> => {
    // Simple liveness check - if we can respond, we're alive
    return {
        status: 'ok',
        timestamp: new Date(),
    };
});
