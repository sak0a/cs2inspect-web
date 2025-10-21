/**
 * Health check history persistence and retrieval
 */
import { executeQuery } from '~/server/database/database';
import type { HealthCheckResult, HistoricalHealthData, HealthHistoryQuery } from '~/server/types/health';

/**
 * Save health check result to history
 */
export async function saveHealthCheckResult(result: HealthCheckResult): Promise<void> {
    try {
        await executeQuery(
            `INSERT INTO health_check_history 
            (check_name, status, latency_ms, message, metadata, checked_at) 
            VALUES (?, ?, ?, ?, ?, ?)`,
            [
                result.name,
                result.status,
                result.latency_ms || null,
                result.message || null,
                result.metadata ? JSON.stringify(result.metadata) : null,
                result.checked_at,
            ],
            'Failed to save health check result'
        );
    } catch (error: unknown) {
        // Don't throw - health check persistence failures shouldn't break the app
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('Failed to save health check result:', errorMessage);
    }
}

/**
 * Save multiple health check results
 */
export async function saveHealthCheckResults(results: HealthCheckResult[]): Promise<void> {
    await Promise.all(results.map(result => saveHealthCheckResult(result)));
}

/**
 * Get health check history
 */
export async function getHealthCheckHistory(query: HealthHistoryQuery): Promise<HistoricalHealthData[]> {
    const {
        check_name,
        start_time,
        end_time,
        limit = 100,
    } = query;

    let sql = `SELECT check_name, status, latency_ms, checked_at 
               FROM health_check_history 
               WHERE 1=1`;
    const params: unknown[] = [];

    if (check_name) {
        sql += ' AND check_name = ?';
        params.push(check_name);
    }

    if (start_time) {
        sql += ' AND checked_at >= ?';
        params.push(start_time);
    }

    if (end_time) {
        sql += ' AND checked_at <= ?';
        params.push(end_time);
    }

    sql += ' ORDER BY checked_at DESC LIMIT ?';
    params.push(limit);

    try {
        interface HistoryRow {
            check_name: string;
            status: 'ok' | 'degraded' | 'fail';
            latency_ms: number | null;
            checked_at: string | Date;
        }
        
        const rows = await executeQuery<HistoryRow[]>(
            sql,
            params,
            'Failed to fetch health check history'
        );

        // Group by check_name
        const grouped = new Map<string, HistoricalHealthData>();

        for (const row of rows) {
            if (!grouped.has(row.check_name)) {
                grouped.set(row.check_name, {
                    check_name: row.check_name,
                    data_points: [],
                });
            }

            grouped.get(row.check_name)!.data_points.push({
                timestamp: new Date(row.checked_at),
                status: row.status,
                latency_ms: row.latency_ms,
            });
        }

        // Reverse data points to have oldest first
        Array.from(grouped.values()).forEach(data => {
            data.data_points.reverse();
        });

        return Array.from(grouped.values());
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('Failed to fetch health check history:', errorMessage);
        return [];
    }
}

/**
 * Clean up old health check history (retention policy)
 * Keep data for 7 days by default
 */
export async function cleanupHealthCheckHistory(daysToKeep: number = 7): Promise<number> {
    try {
        const result = await executeQuery<{ affectedRows?: number }>(
            `DELETE FROM health_check_history 
             WHERE checked_at < DATE_SUB(NOW(), INTERVAL ? DAY)`,
            [daysToKeep],
            'Failed to cleanup health check history'
        );

        return result.affectedRows || 0;
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('Failed to cleanup health check history:', errorMessage);
        return 0;
    }
}

/**
 * Get average latency for a specific check over the last N minutes
 */
export async function getAverageLatency(checkName: string, minutes: number = 60): Promise<number | null> {
    try {
        interface AvgRow {
            avg_latency: number | null;
        }
        
        const rows = await executeQuery<AvgRow[]>(
            `SELECT AVG(latency_ms) as avg_latency 
             FROM health_check_history 
             WHERE check_name = ? 
             AND checked_at >= DATE_SUB(NOW(), INTERVAL ? MINUTE)
             AND latency_ms IS NOT NULL`,
            [checkName, minutes],
            'Failed to calculate average latency'
        );

        if (rows.length > 0 && rows[0].avg_latency !== null) {
            return Math.round(rows[0].avg_latency);
        }
        
        return null;
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('Failed to calculate average latency:', errorMessage);
        return null;
    }
}
