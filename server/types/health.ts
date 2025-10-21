/**
 * Health check types and interfaces
 */

export type HealthStatus = 'ok' | 'degraded' | 'fail';

export interface HealthCheckResult {
    name: string;
    status: HealthStatus;
    latency_ms?: number;
    message?: string;
    metadata?: Record<string, any>;
    checked_at: Date;
}

export interface HealthCheckConfig {
    name: string;
    enabled: boolean;
    warning_threshold_ms?: number;
    error_threshold_ms?: number;
}

export interface HealthCheckProbe {
    name: string;
    check: () => Promise<HealthCheckResult>;
}

export interface DetailedHealthResponse {
    status: HealthStatus;
    timestamp: Date;
    checks: HealthCheckResult[];
}

export interface LivenessResponse {
    status: 'ok';
    timestamp: Date;
}

export interface ReadinessResponse {
    status: HealthStatus;
    timestamp: Date;
    ready: boolean;
    checks: {
        name: string;
        status: HealthStatus;
        latency_ms?: number;
    }[];
}

export interface HistoricalHealthData {
    check_name: string;
    data_points: {
        timestamp: Date;
        status: HealthStatus;
        latency_ms?: number;
    }[];
}

export interface HealthHistoryQuery {
    check_name?: string;
    start_time?: Date;
    end_time?: Date;
    limit?: number;
}
