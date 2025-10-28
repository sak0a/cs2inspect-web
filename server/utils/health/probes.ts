/**
 * Health check probes for various system dependencies
 */
import { pool } from '~/server/database/database';
import { getCS2Client } from '~/server/plugins/init';
import type { HealthCheckResult, HealthStatus } from '~/server/types/health';

/**
 * Calculate uptime percentage for a check based on historical data
 */
async function calculateUptimePercentage(checkName: string, minutes: number = 60): Promise<number> {
    try {
        const { executeQuery } = await import('~/server/database/database');
        
        interface UptimeRow {
            total_checks: number | string | bigint;
            ok_checks: number | string | bigint;
        }
        
        const rows = await executeQuery<UptimeRow[]>(
            `SELECT 
                COUNT(*) as total_checks,
                SUM(CASE WHEN status = 'ok' THEN 1 ELSE 0 END) as ok_checks
             FROM health_check_history 
             WHERE check_name = ? 
             AND checked_at >= DATE_SUB(NOW(), INTERVAL ? MINUTE)`,
            [checkName, minutes],
            'Failed to calculate uptime'
        );

        if (rows.length > 0) {
            const toNumber = (v: unknown): number => {
                if (typeof v === 'number') return v;
                if (typeof v === 'bigint') return Number(v);
                if (typeof v === 'string') return Number(v);
                return Number(v as any);
            };

            const total = toNumber(rows[0].total_checks);
            const ok = toNumber(rows[0].ok_checks);

            if (Number.isFinite(total) && total > 0) {
                return (ok / total) * 100;
            }
        }
        
        return 100; // Default to 100% if no historical data
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('Failed to calculate uptime:', errorMessage);
        return 100; // Default to 100% on error
    }
}

/**
 * Database connectivity health check
 */
export async function checkDatabase(): Promise<HealthCheckResult> {
    const startTime = Date.now();
    const result: HealthCheckResult = {
        name: 'database',
        status: 'ok',
        checked_at: new Date(),
    };

    try {
        const conn = await pool.getConnection();
        
        try {
            // Perform a simple query to verify connectivity
            await conn.query('SELECT 1');
            
            const latency = Date.now() - startTime;
            result.latency_ms = latency;
            
            // Get average latency and uptime from history
            const { getAverageLatency } = await import('~/server/utils/health/history');
            const avgLatency = await getAverageLatency('database', 60);
            const uptimePercentage = await calculateUptimePercentage('database', 60);
            
            // Check thresholds
            if (latency > 200) {
                result.status = 'fail';
                result.message = `Database latency too high: ${latency}ms`;
            } else if (latency > 50) {
                result.status = 'degraded';
                result.message = `Database latency elevated: ${latency}ms`;
            } else {
                result.message = 'Database connection healthy';
            }
            
            result.metadata = {
                pool_active_connections: pool.activeConnections(),
                pool_total_connections: pool.totalConnections(),
                pool_idle_connections: pool.idleConnections(),
                avg_latency_ms: avgLatency,
                uptime_percentage: uptimePercentage,
            };
        } finally {
            conn.release();
        }
    } catch (error: unknown) {
        result.status = 'fail';
        result.latency_ms = Date.now() - startTime;
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        const errorCode = error && typeof error === 'object' && 'code' in error ? (error as { code: string }).code : undefined;
        result.message = `Database check failed: ${errorMessage}`;
        result.metadata = {
            error: errorMessage,
            error_code: errorCode,
            uptime_percentage: await calculateUptimePercentage('database', 60),
        };
    }

    return result;
}

/**
 * Steam API health check (API key presence and basic validation)
 */
export async function checkSteamAPI(): Promise<HealthCheckResult> {
    const startTime = Date.now();
    const result: HealthCheckResult = {
        name: 'steam_api',
        status: 'ok',
        checked_at: new Date(),
    };

    try {
        const apiKey = process.env.STEAM_API_KEY;
        
        if (!apiKey || apiKey.length < 10) {
            result.status = 'fail';
            result.message = 'Steam API key not configured or invalid';
            result.latency_ms = Date.now() - startTime;
            result.metadata = {
                uptime_percentage: await calculateUptimePercentage('steam_api', 60),
            };
            return result;
        }

        // Simple check - we can't make actual Steam API calls without implementing rate limiting
        // and proper request handling, so we just validate the key exists
        result.status = 'ok';
        result.message = 'Steam API key configured';
        result.latency_ms = Date.now() - startTime;
        result.metadata = {
            api_key_length: apiKey.length,
            has_steam_username: !!process.env.STEAM_USERNAME,
            has_steam_password: !!process.env.STEAM_PASSWORD,
            uptime_percentage: await calculateUptimePercentage('steam_api', 60),
        };
    } catch (error: unknown) {
        result.status = 'fail';
        result.latency_ms = Date.now() - startTime;
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        result.message = `Steam API check failed: ${errorMessage}`;
        result.metadata = {
            error: errorMessage,
            uptime_percentage: await calculateUptimePercentage('steam_api', 60),
        };
    }

    return result;
}

/**
 * Steam Client health check (CS2 inspect client status)
 */
export async function checkSteamClient(): Promise<HealthCheckResult> {
    const startTime = Date.now();
    const result: HealthCheckResult = {
        name: 'steam_client',
        status: 'ok',
        checked_at: new Date(),
    };

    try {
        const client = getCS2Client();
        const stats = client.getSteamClientStats();
        
        result.latency_ms = Date.now() - startTime;
        const uptimePercentage = await calculateUptimePercentage('steam_client', 60);
        
        if (!stats.isAvailable) {
            // Steam client not available - provide detailed feedback
            const hasUsername = !!process.env.STEAM_USERNAME;
            const hasPassword = !!process.env.STEAM_PASSWORD;
            
            if (!hasUsername && !hasPassword) {
                result.status = 'degraded';
                result.message = 'Steam client not configured (missing STEAM_USERNAME and STEAM_PASSWORD)';
            } else if (!hasUsername) {
                result.status = 'fail';
                result.message = 'Steam client missing STEAM_USERNAME environment variable';
            } else if (!hasPassword) {
                result.status = 'fail';
                result.message = 'Steam client missing STEAM_PASSWORD environment variable';
            } else {
                // Credentials exist but client isn't connected
                result.status = 'fail';
                result.message = `Steam client check failed: ${stats.status || 'Not connected'}. Check credentials or network connection.`;
            }
        } else {
            result.status = 'ok';
            result.message = `Steam client ready - ${stats.status}`;
        }
        
        result.metadata = {
            is_ready: stats.isAvailable,
            status: stats.status,
            queue_length: stats.queueLength,
            unmasked_support: stats.unmaskedSupport,
            has_username: !!process.env.STEAM_USERNAME,
            has_password: !!process.env.STEAM_PASSWORD,
            uptime_percentage: uptimePercentage,
        };
    } catch (error: unknown) {
        result.status = 'fail';
        result.latency_ms = Date.now() - startTime;
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        result.message = `Steam client check failed: ${errorMessage}`;
        result.metadata = {
            error: errorMessage,
            has_username: !!process.env.STEAM_USERNAME,
            has_password: !!process.env.STEAM_PASSWORD,
            uptime_percentage: await calculateUptimePercentage('steam_client', 60),
        };
    }

    return result;
}

/**
 * Environment configuration health check
 */
export async function checkEnvironment(): Promise<HealthCheckResult> {
    const startTime = Date.now();
    const result: HealthCheckResult = {
        name: 'environment',
        status: 'ok',
        checked_at: new Date(),
    };

    try {
        // Required environment variables (minimum)
        const requiredVars = [
            'DATABASE_HOST',
            'DATABASE_USER',
            'DATABASE_PASSWORD',
            'DATABASE_NAME',
            'JWT_TOKEN',
            'STEAM_API_KEY',
        ];

        // All environment variables from .env.example
        const allEnvVars = [
            'PORT',
            'HOST',
            'JWT_TOKEN',
            'JWT_EXPIRY',
            'DATABASE_HOST',
            'DATABASE_PORT',
            'DATABASE_USER',
            'DATABASE_PASSWORD',
            'DATABASE_NAME',
            'DATABASE_CONNECTION_LIMIT',
            'STEAM_API_KEY',
            'STEAM_USERNAME',
            'STEAM_PASSWORD',
            'LOG_API_REQUESTS',
        ];

        const missingRequired: string[] = [];
        const missingAll: string[] = [];
        const presentAll: string[] = [];

        // Check required variables
        for (const varName of requiredVars) {
            if (!process.env[varName]) {
                missingRequired.push(varName);
            }
        }

        // Check all variables
        for (const varName of allEnvVars) {
            if (!process.env[varName]) {
                missingAll.push(varName);
            } else {
                presentAll.push(varName);
            }
        }

        result.latency_ms = Date.now() - startTime;

        // Set status based on presence
        if (missingRequired.length > 0) {
            result.status = 'fail';
            result.message = `Missing required environment variables: ${missingRequired.join(', ')}`;
        } else if (missingAll.length > 0) {
            result.status = 'degraded';
            result.message = `Some optional environment variables missing: ${presentAll.length} of ${allEnvVars.length} present`;
        } else {
            result.status = 'ok';
            result.message = 'All environment variables present';
        }

        

        result.metadata = {
            total_env_vars: allEnvVars.length,
            required_vars_count: requiredVars.length,
            present_vars_count: presentAll.length,
            missing_vars: missingAll,
            missing_required: missingRequired,
            node_env: process.env.NODE_ENV || 'unknown',
            port: process.env.PORT || 'default',
        };
    } catch (error: unknown) {
        result.status = 'fail';
        result.latency_ms = Date.now() - startTime;
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        result.message = `Environment check failed: ${errorMessage}`;
        result.metadata = {
            error: errorMessage,
        };
    }

    return result;
}

/**
 * Get overall system status from individual check results
 */
export function getOverallStatus(checks: HealthCheckResult[]): HealthStatus {
    // If any check fails, overall status is fail
    if (checks.some(check => check.status === 'fail')) {
        return 'fail';
    }
    // If any check is degraded, overall status is degraded
    if (checks.some(check => check.status === 'degraded')) {
        return 'degraded';
    }
    // All checks passed
    return 'ok';
}

/**
 * Run all health checks in parallel
 */
export async function runAllHealthChecks(): Promise<HealthCheckResult[]> {
    const checks = await Promise.all([
        checkDatabase(),
        checkSteamAPI(),
        checkSteamClient(),
        checkEnvironment(),
    ]);

    return checks;
}
