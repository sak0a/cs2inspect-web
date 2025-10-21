/**
 * Health check history endpoint
 * Returns historical health check data for visualization
 */
import { defineEventHandler, getQuery } from 'h3';
import { getHealthCheckHistory } from '~/server/utils/health/history';
import type { HealthHistoryQuery, HistoricalHealthData } from '~/server/types/health';

export default defineEventHandler(async (event): Promise<HistoricalHealthData[]> => {
    const query = getQuery(event);

    // Parse query parameters
    const historyQuery: HealthHistoryQuery = {
        check_name: query.check_name as string | undefined,
        limit: query.limit ? parseInt(query.limit as string) : 100,
    };

    // Parse time range if provided
    if (query.start_time) {
        historyQuery.start_time = new Date(query.start_time as string);
    } else {
        // Default to last 24 hours
        historyQuery.start_time = new Date(Date.now() - 24 * 60 * 60 * 1000);
    }

    if (query.end_time) {
        historyQuery.end_time = new Date(query.end_time as string);
    }

    try {
        const history = await getHealthCheckHistory(historyQuery);
        return history;
    } catch (error: any) {
        console.error('Failed to fetch health check history:', error.message);
        return [];
    }
});
