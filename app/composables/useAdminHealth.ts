/**
 * useAdminHealth - Composable for fetching detailed system health data
 *
 * Used by the admin health page to display detailed health check results
 * with full metadata, error details, and server process info.
 */
import { computed, ref, onMounted, onUnmounted } from 'vue'

// ============================================================================
// INTERFACES
// ============================================================================

export type HealthStatus = 'ok' | 'degraded' | 'fail'

export interface HealthCheck {
    name: string
    status: HealthStatus
    latency_ms?: number
    message?: string
    metadata?: Record<string, unknown>
    checked_at: Date
}

export interface HistoricalData {
    check_name: string
    data_points: Array<{
        timestamp: Date
        status: HealthStatus
        latency_ms?: number
    }>
}

export interface ServerInfo {
    nodeVersion: string
    platform: string
    arch: string
    uptimeSeconds: number
    memoryUsage: {
        rss: number
        heapUsed: number
        heapTotal: number
        external: number
    }
}

export interface AdminHealthOptions {
    /** Auto-refresh interval in ms (default: 30000) */
    autoRefreshInterval?: number
    /** Whether to fetch on mount (default: true) */
    fetchOnMount?: boolean
}

export type HistoryTimeRange = '1h' | '6h' | '24h' | '7d'

// ============================================================================
// COMPOSABLE
// ============================================================================

export function useAdminHealth(options: AdminHealthOptions = {}) {
    const {
        autoRefreshInterval = 30000,
        fetchOnMount = true,
    } = options

    // State
    const healthChecks = ref<HealthCheck[]>([])
    const historicalData = ref<HistoricalData[]>([])
    const serverInfo = ref<ServerInfo | null>(null)
    const samplerRunning = ref(false)
    const isLoading = ref(false)
    const isLoadingHistory = ref(false)
    const lastUpdate = ref<Date | null>(null)
    const timeRange = ref<HistoryTimeRange>('24h')
    const autoRefreshEnabled = ref(true)
    const error = ref<string | null>(null)

    let refreshInterval: ReturnType<typeof setInterval> | null = null

    // Computed
    const overallStatus = computed<HealthStatus>(() => {
        if (healthChecks.value.length === 0) return 'ok'
        if (healthChecks.value.some(c => c.status === 'fail')) return 'fail'
        if (healthChecks.value.some(c => c.status === 'degraded')) return 'degraded'
        return 'ok'
    })

    const failedChecks = computed(() =>
        healthChecks.value.filter(c => c.status === 'fail')
    )

    const degradedChecks = computed(() =>
        healthChecks.value.filter(c => c.status === 'degraded')
    )

    const filteredHistoricalData = computed(() =>
        historicalData.value.filter(data => data.check_name !== 'environment')
    )

    // ========================================================================
    // METHODS
    // ========================================================================

    async function fetchHealth() {
        isLoading.value = true
        error.value = null
        try {
            const response = await $fetch<{ data: { status: HealthStatus; checks: HealthCheck[]; sampler: { running: boolean }; server: ServerInfo } }>('/api/admin/health/details')
            const data = response.data
            healthChecks.value = data.checks || []
            serverInfo.value = data.server || null
            samplerRunning.value = data.sampler?.running ?? false
            lastUpdate.value = new Date()
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Failed to fetch health data'
            error.value = msg
            console.error('Failed to load admin health status:', err)
        } finally {
            isLoading.value = false
        }
    }

    async function fetchHistory() {
        isLoadingHistory.value = true
        try {
            const now = new Date()
            let startTime: Date

            switch (timeRange.value) {
                case '1h':
                    startTime = new Date(now.getTime() - 60 * 60 * 1000)
                    break
                case '6h':
                    startTime = new Date(now.getTime() - 6 * 60 * 60 * 1000)
                    break
                case '24h':
                    startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000)
                    break
                case '7d':
                    startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
                    break
            }

            const data = await $fetch<HistoricalData[]>(`/api/health/history?start_time=${startTime.toISOString()}&limit=500`)
            historicalData.value = data || []
        } catch (err) {
            console.error('Failed to load health history:', err)
        } finally {
            isLoadingHistory.value = false
        }
    }

    async function refreshAll() {
        await Promise.all([fetchHealth(), fetchHistory()])
    }

    function startAutoRefresh() {
        stopAutoRefresh()
        if (autoRefreshEnabled.value && autoRefreshInterval > 0) {
            refreshInterval = setInterval(() => {
                fetchHealth()
            }, autoRefreshInterval)
        }
    }

    function stopAutoRefresh() {
        if (refreshInterval) {
            clearInterval(refreshInterval)
            refreshInterval = null
        }
    }

    function toggleAutoRefresh() {
        autoRefreshEnabled.value = !autoRefreshEnabled.value
        if (autoRefreshEnabled.value) {
            startAutoRefresh()
        } else {
            stopAutoRefresh()
        }
    }

    // ========================================================================
    // LIFECYCLE
    // ========================================================================

    if (fetchOnMount) {
        onMounted(async () => {
            await refreshAll()
            startAutoRefresh()
        })
    }

    onUnmounted(() => {
        stopAutoRefresh()
    })

    // ========================================================================
    // RETURN
    // ========================================================================

    return {
        healthChecks,
        historicalData,
        filteredHistoricalData,
        serverInfo,
        samplerRunning,
        overallStatus,
        failedChecks,
        degradedChecks,
        isLoading,
        isLoadingHistory,
        lastUpdate,
        timeRange,
        autoRefreshEnabled,
        error,
        fetchHealth,
        fetchHistory,
        refreshAll,
        toggleAutoRefresh,
    }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Format bytes to human-readable string
 */
export function formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
}

/**
 * Format seconds to human-readable uptime string
 */
export function formatUptime(seconds: number): string {
    const days = Math.floor(seconds / 86400)
    const hours = Math.floor((seconds % 86400) / 3600)
    const mins = Math.floor((seconds % 3600) / 60)

    const parts: string[] = []
    if (days > 0) parts.push(`${days}d`)
    if (hours > 0) parts.push(`${hours}h`)
    parts.push(`${mins}m`)
    return parts.join(' ')
}
