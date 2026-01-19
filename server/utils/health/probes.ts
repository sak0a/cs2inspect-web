/**
 * Health check probes for various system dependencies
 */
import { sql } from 'drizzle-orm';
import { db, pool } from '~/server/database/client';
import { getCS2Client } from '~/server/plugins/init';
import type { HealthCheckResult, HealthStatus } from '~/server/types/health';
import { $fetch } from 'ofetch';
import { steamServiceClient } from '~/server/utils/steamServiceClient';

/**
 * Calculate uptime percentage for a check based on historical data
 */
async function calculateUptimePercentage(checkName: string, minutes: number = 60): Promise<number> {
    try {
        const result = await db.execute(sql`
            SELECT 
                COUNT(*) as total_checks,
                SUM(CASE WHEN status = 'ok' THEN 1 ELSE 0 END) as ok_checks
            FROM health_check_history 
            WHERE check_name = ${checkName} 
            AND checked_at >= DATE_SUB(NOW(), INTERVAL ${minutes} MINUTE)
        `);

        const rows = result as unknown as Array<{ total_checks: number | bigint; ok_checks: number | bigint }>;

        if (rows.length > 0 && rows[0]) {
            const total = Number(rows[0].total_checks);
            const ok = Number(rows[0].ok_checks);

            if (Number.isFinite(total) && total > 0) {
                return (ok / total) * 100;
            }
        }

        return 100; // Default to 100% if no historical data
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('[Healthcheck] Failed to calculate uptime:', errorMessage);
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
        // Perform a simple query to verify connectivity using Drizzle
        await db.execute(sql`SELECT 1`);

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

        // Get pool stats from mysql2
        const poolConfig = (pool as unknown as { pool?: { config?: { connectionLimit?: number }; _connectionQueue?: unknown[] } }).pool;
        result.metadata = {
            pool_connection_limit: poolConfig?.config?.connectionLimit || 'unknown',
            pool_queue_size: poolConfig?._connectionQueue?.length || 0,
            avg_latency_ms: avgLatency,
            uptime_percentage: uptimePercentage,
        };
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
        const useSteamService = !!(process.env.STEAM_SERVICE_URL && process.env.STEAM_SERVICE_API_KEY);

        // If we're configured to use the external steam-service, report Steam client status from there.
        if (useSteamService) {
            const response = await steamServiceClient.getStatus();
            result.latency_ms = Date.now() - startTime;

            if (!response.success) {
                result.status = 'fail';
                result.message = `Steam service unreachable: ${response.error?.message || 'Unknown error'}`;
                result.metadata = {
                    source: 'steam-service',
                    steam_service_url: process.env.STEAM_SERVICE_URL,
                    error: response.error,
                    uptime_percentage: await calculateUptimePercentage('steam_client', 60),
                };
                return result;
            }

            const stats = response.data?.steamClient;
            const available = !!stats?.available;
            const statusText = stats?.status || 'unknown';

            result.status = available ? 'ok' : 'fail';
            result.message = available
                ? `Steam client ready (via steam-service) - ${statusText}`
                : `Steam client not ready (via steam-service) - ${statusText}`;

            result.metadata = {
                source: 'steam-service',
                steam_service_url: process.env.STEAM_SERVICE_URL,
                is_ready: available,
                status: statusText,
                uptime_percentage: await calculateUptimePercentage('steam_client', 60),
            };

            return result;
        }

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
 * Steam Service health check (only when STEAM_SERVICE_URL is configured)
 */
export async function checkSteamService(): Promise<HealthCheckResult> {
    const startTime = Date.now();
    const result: HealthCheckResult = {
        name: 'steam_service',
        status: 'ok',
        checked_at: new Date(),
    };

    const useSteamService = !!(process.env.STEAM_SERVICE_URL && process.env.STEAM_SERVICE_API_KEY);

    // If not configured, this isn't a failure: the app is simply using the local Steam client.
    if (!useSteamService) {
        result.status = 'degraded';
        result.latency_ms = Date.now() - startTime;
        result.message = 'Steam service not configured (using local Steam client)';
        result.metadata = {
            configured: false,
            steam_service_url: process.env.STEAM_SERVICE_URL,
        };
        return result;
    }

    try {
        // Prefer readiness probe so we can clearly see whether the service is "ready"
        const response = await steamServiceClient.getReady();
        result.latency_ms = Date.now() - startTime;

        if (!response.success || !response.data) {
            result.status = 'fail';
            result.message = `Steam service unreachable: ${response.error?.message || 'Unknown error'}`;
            result.metadata = {
                configured: true,
                steam_service_url: process.env.STEAM_SERVICE_URL,
                error: response.error,
                uptime_percentage: await calculateUptimePercentage('steam_service', 60),
            };
            return result;
        }

        const serviceStatusRaw = (response.data as { status?: unknown }).status;
        const ready = !!(response.data as { ready?: unknown }).ready;
        const checks = (response.data as { checks?: Record<string, unknown> }).checks || {};

        const toHealthStatus = (v: unknown): HealthStatus => {
            if (v === 'ok' || v === 'degraded' || v === 'fail') return v;
            // steam-service uses ok/fail; treat unknown as fail to be safe
            if (v === 'healthy') return 'ok';
            return 'fail';
        };

        const serviceStatus = toHealthStatus(serviceStatusRaw);
        // IMPORTANT: treat "responds but not ready" as degraded (service is up, but Steam client not ready)
        result.status = ready ? serviceStatus : 'degraded';
        result.message = ready ? 'Steam service ready' : 'Steam service reachable but not ready';

        result.metadata = {
            configured: true,
            steam_service_url: process.env.STEAM_SERVICE_URL,
            requested: '/api/health/ready',
            ready,
            checks,
            upstream_http: response.error?.code === 'UPSTREAM_HTTP' ? response.error : undefined,
            uptime_percentage: await calculateUptimePercentage('steam_service', 60),
        };
        return result;
    } catch (error: unknown) {
        result.status = 'fail';
        result.latency_ms = Date.now() - startTime;
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        result.message = `Steam service check failed: ${errorMessage}`;
        result.metadata = {
            configured: true,
            steam_service_url: process.env.STEAM_SERVICE_URL,
            requested: '/api/health/ready',
            error: errorMessage,
            uptime_percentage: await calculateUptimePercentage('steam_service', 60),
        };
        return result;
    }
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
 * Image proxy (CORS bypass) health check
 */
export async function checkImageProxy(): Promise<HealthCheckResult> {
    const startTime = Date.now()
    const result: HealthCheckResult = {
        name: 'image_proxy',
        status: 'ok',
        checked_at: new Date(),
    }

    const sampleUrl = 'https://steamcommunity-a.akamaihd.net/public/shared/images/header/logo_steam.svg'

    // Helper to compute baseURL for absolute calls
    const makeBaseURL = () => {
        const explicit = process.env.PROXY_HEALTH_BASE_URL
        if (explicit && /^https?:\/\//i.test(explicit)) return explicit.replace(/\/$/, '')
        const host = process.env.HOST || '127.0.0.1'
        const port = Number(process.env.PORT) || 3000
        const proto = process.env.NODE_ENV === 'production' ? 'https' : 'http'
        return `${proto}://${host}:${port}`
    }

    try {
        // First try: absolute HTTP call to our own server
        const baseURL = makeBaseURL();
        const resp = await $fetch.raw(`${baseURL}/api/proxy/image`, {
            method: 'GET',
            params: { url: sampleUrl },
        });

        const latency = Date.now() - startTime;
        result.latency_ms = latency;

        const contentType = resp.headers.get('content-type') || '';
        const ok = resp.status === 200 && (contentType.startsWith('image/') || contentType.includes('svg'));

        if (!ok) {
            result.status = 'fail';
            result.message = `Proxy responded with ${resp.status} (${contentType || 'no content-type'})`;
        } else if (latency > 1000) {
            result.status = 'degraded';
            result.message = `Proxy latency elevated: ${latency}ms`;
        } else {
            result.message = 'Image proxy operational';
        }

        result.metadata = {
            content_type: contentType,
            content_length: resp.headers.get('content-length') || null,
            upstream_host: new URL(sampleUrl).hostname,
            base_url: baseURL,
            uptime_percentage: await (async () => {
                try {
                    return await (calculateUptimePercentage?.('image_proxy', 60) ?? 100);
                } catch { return 100; }
            })(),
        };
    } catch (error1: unknown) {
        // Fallback: check upstream directly (degraded), confirms internet/CDN path
        try {
            const upstream = await fetch(sampleUrl, { method: 'GET' });
            const latency = Date.now() - startTime;
            result.latency_ms = latency;
            const contentType = upstream.headers.get('content-type') || '';
            const ok = upstream.ok && (contentType.startsWith('image/') || contentType.includes('svg'));
            if (ok) {
                result.status = 'degraded';
                result.message = 'Upstream reachable, but local proxy call failed (using direct fetch)';
            } else {
                result.status = 'fail';
                result.message = `Upstream check failed: ${upstream.status} (${contentType || 'no content-type'})`;
            }
            result.metadata = {
                upstream_host: new URL(sampleUrl).hostname,
                error_local: error1 instanceof Error ? error1.message : String(error1),
            };
        } catch (error2: unknown) {
            const latency = Date.now() - startTime;
            result.latency_ms = latency;
            result.status = 'fail';
            const msg1 = error1 instanceof Error ? error1.message : String(error1);
            const msg2 = error2 instanceof Error ? error2.message : String(error2);
            result.message = `Proxy check failed (absolute, upstream): ${msg1} | ${msg2}`;
            result.metadata = {
                upstream_host: new URL(sampleUrl).hostname,
            };
        }
    }

    return result
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
        checkSteamService(),
        checkSteamClient(),
        checkEnvironment(),
        checkImageProxy(),
    ]);

    return checks;
}
