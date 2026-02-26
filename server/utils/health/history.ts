/**
 * Health check history persistence and retrieval using Drizzle ORM
 */
import { eq, and, gte, lte, desc, sql } from 'drizzle-orm';
import { db } from '~/server/database/client';
import { healthCheckHistory } from '~/server/database/schema';
import type { HealthCheckResult, HistoricalHealthData, HealthHistoryQuery } from '~/server/types/health';
import { Logger } from '~/server/utils/logger';

/**
 * Save health check result to history
 */
export async function saveHealthCheckResult(result: HealthCheckResult): Promise<void> {
    try {
        await db.insert(healthCheckHistory).values({
            check_name: result.name,
            status: result.status,
            latency_ms: result.latency_ms || null,
            message: result.message || null,
            metadata: result.metadata ? JSON.stringify(result.metadata) : null,
            checked_at: result.checked_at,
        });
    } catch (error: unknown) {
        // Don't throw - health check persistence failures shouldn't break the app
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        Logger.error(`Save result failed error=${errorMessage}`, 'healthcheck');
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

    try {
        // Build the where conditions
        const conditions = [];

        if (check_name) {
            conditions.push(eq(healthCheckHistory.check_name, check_name));
        }

        if (start_time) {
            conditions.push(gte(healthCheckHistory.checked_at, start_time));
        }

        if (end_time) {
            conditions.push(lte(healthCheckHistory.checked_at, end_time));
        }

        const rows = await db.select({
            check_name: healthCheckHistory.check_name,
            status: healthCheckHistory.status,
            latency_ms: healthCheckHistory.latency_ms,
            checked_at: healthCheckHistory.checked_at,
        })
            .from(healthCheckHistory)
            .where(conditions.length > 0 ? and(...conditions) : undefined)
            .orderBy(desc(healthCheckHistory.checked_at))
            .limit(limit);

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
                status: row.status as 'ok' | 'degraded' | 'fail',
                latency_ms: row.latency_ms ?? undefined,
            });
        }

        // Reverse data points to have oldest first
        Array.from(grouped.values()).forEach(data => {
            data.data_points.reverse();
        });

        return Array.from(grouped.values());
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        Logger.error(`Fetch history failed error=${errorMessage}`, 'healthcheck');
        return [];
    }
}

/**
 * Clean up old health check history (retention policy)
 * Keep data for 7 days by default
 */
export async function cleanupHealthCheckHistory(daysToKeep: number = 7): Promise<number> {
    try {
        const result = await db.execute(sql`
            DELETE FROM health_check_history 
            WHERE checked_at < DATE_SUB(NOW(), INTERVAL ${daysToKeep} DAY)
        `);

        // mysql2 returns an array with [ResultSetHeader, FieldPacket[]]
        const affectedRows = (result as unknown as [{ affectedRows?: number }])?.[0]?.affectedRows || 0;
        return affectedRows;
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        Logger.error(`Cleanup history failed error=${errorMessage}`, 'healthcheck');
        return 0;
    }
}

/**
 * Get average latency for a specific check over the last N minutes
 */
export async function getAverageLatency(checkName: string, minutes: number = 60): Promise<number | null> {
    try {
        const result = await db.execute(sql`
            SELECT AVG(latency_ms) as avg_latency 
            FROM health_check_history 
            WHERE check_name = ${checkName} 
            AND checked_at >= DATE_SUB(NOW(), INTERVAL ${minutes} MINUTE)
            AND latency_ms IS NOT NULL
        `);

        const rows = result as unknown as Array<{ avg_latency: number | null }>;

        if (rows.length > 0 && rows[0]?.avg_latency !== null) {
            return Math.round(rows[0]!.avg_latency!);
        }

        return null;
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        Logger.error(`Latency calc failed error=${errorMessage}`, 'healthcheck');
        return null;
    }
}
