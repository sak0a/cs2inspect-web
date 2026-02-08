/**
 * useAdminStats - Composable for fetching and caching admin statistics
 *
 * @description Provides statistics fetching with caching, loading states,
 * and automatic refresh functionality for the admin dashboard.
 */
import { computed, ref, onMounted, watch, type ComputedRef, type Ref } from 'vue'
import { useAdminStore } from '~/stores/adminStore'
import type {
    AdminOverviewStats,
    AdminActivityData,
    AdminTopUser
} from '~/types'

// ============================================================================
// INTERFACES
// ============================================================================

export type TimeRange = '7d' | '30d' | '90d'

export interface AdminStatsOptions {
    /** Whether to fetch stats on mount (default: true) */
    fetchOnMount?: boolean
    /** Auto-refresh interval in milliseconds (default: 0 = disabled) */
    autoRefreshInterval?: number
    /** Default time range for activity data (default: '30d') */
    defaultTimeRange?: TimeRange
}

export interface AdminStatsReturn {
    /** Overview statistics */
    overviewStats: ComputedRef<AdminOverviewStats | null>
    /** Activity chart data */
    activityData: ComputedRef<AdminActivityData | null>
    /** Top users for leaderboard */
    topUsers: ComputedRef<AdminTopUser[]>
    /** Current time range selection */
    timeRange: Ref<TimeRange>
    /** Loading states */
    isLoadingStats: ComputedRef<boolean>
    isLoadingActivity: ComputedRef<boolean>
    isLoading: ComputedRef<boolean>
    /** Error message if any */
    error: ComputedRef<string | null>
    /** Fetch overview stats */
    fetchStats: (forceRefresh?: boolean) => Promise<void>
    /** Fetch activity data */
    fetchActivity: (range?: TimeRange) => Promise<void>
    /** Fetch top users */
    fetchTopUsers: (limit?: number) => Promise<void>
    /** Refresh all stats data */
    refreshAll: (force?: boolean) => Promise<void>
    /** Change time range and fetch new data */
    setTimeRange: (range: TimeRange) => Promise<void>
}

// ============================================================================
// COMPOSABLE
// ============================================================================

/**
 * Admin statistics composable with caching
 *
 * @param options - Configuration options
 *
 * @example
 * ```typescript
 * const {
 *   overviewStats,
 *   activityData,
 *   topUsers,
 *   timeRange,
 *   isLoading,
 *   fetchStats,
 *   setTimeRange
 * } = useAdminStats({
 *   fetchOnMount: true,
 *   autoRefreshInterval: 60000 // Refresh every minute
 * })
 *
 * // Change time range
 * await setTimeRange('7d')
 * ```
 */
export function useAdminStats(options: AdminStatsOptions = {}): AdminStatsReturn {
    const {
        fetchOnMount = true,
        autoRefreshInterval = 0,
        defaultTimeRange = '30d'
    } = options

    const adminStore = useAdminStore()
    const timeRange = ref<TimeRange>(defaultTimeRange)
    let refreshIntervalId: ReturnType<typeof setInterval> | null = null

    // ========================================================================
    // COMPUTED PROPERTIES
    // ========================================================================

    const overviewStats = computed(() => adminStore.overviewStats)
    const activityData = computed(() => adminStore.activityData)
    const topUsers = computed(() => adminStore.topUsers)
    const isLoadingStats = computed(() => adminStore.isLoadingStats)
    const isLoadingActivity = computed(() => adminStore.isLoadingActivity)
    const isLoading = computed(() => adminStore.isLoadingStats || adminStore.isLoadingActivity)
    const error = computed(() => adminStore.error)

    // ========================================================================
    // METHODS
    // ========================================================================

    /**
     * Fetch overview statistics
     */
    async function fetchStats(forceRefresh = false): Promise<void> {
        await adminStore.fetchOverviewStats(forceRefresh)
    }

    /**
     * Fetch activity data for charts
     */
    async function fetchActivity(range?: TimeRange, force = false): Promise<void> {
        const r = range || timeRange.value
        await adminStore.fetchActivityData(r, force)
    }

    /**
     * Fetch top users for leaderboard
     */
    async function fetchTopUsers(limit = 10): Promise<void> {
        await adminStore.fetchTopUsers(limit)
    }

    /**
     * Refresh all statistics data
     */
    async function refreshAll(force = false): Promise<void> {
        await Promise.all([
            fetchStats(force),
            fetchActivity(undefined, force),
            fetchTopUsers()
        ])
    }

    /**
     * Change time range and fetch new activity data
     */
    async function setTimeRange(range: TimeRange): Promise<void> {
        timeRange.value = range
        await fetchActivity(range)
    }

    // ========================================================================
    // LIFECYCLE
    // ========================================================================

    // Fetch on mount if enabled
    if (fetchOnMount) {
        onMounted(async () => {
            await refreshAll()
        })
    }

    // Setup auto-refresh if enabled
    if (autoRefreshInterval > 0) {
        onMounted(() => {
            refreshIntervalId = setInterval(() => {
                refreshAll()
            }, autoRefreshInterval)
        })

        // Cleanup on unmount handled by watch stop
        watch(() => autoRefreshInterval, () => {
            if (refreshIntervalId) {
                clearInterval(refreshIntervalId)
                refreshIntervalId = null
            }
        })
    }

    // ========================================================================
    // RETURN
    // ========================================================================

    return {
        overviewStats,
        activityData,
        topUsers,
        timeRange,
        isLoadingStats,
        isLoadingActivity,
        isLoading,
        error,
        fetchStats,
        fetchActivity,
        fetchTopUsers,
        refreshAll,
        setTimeRange
    }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Format large numbers with abbreviations
 *
 * @example
 * formatNumber(1234) // "1,234"
 * formatNumber(1234567) // "1.2M"
 */
export function formatNumber(value: number): string {
    if (value >= 1000000) {
        return `${(value / 1000000).toFixed(1)}M`
    }
    if (value >= 1000) {
        return `${(value / 1000).toFixed(1)}K`
    }
    return value.toLocaleString()
}

/**
 * Calculate percentage change between two values
 */
export function calculatePercentChange(current: number, previous: number): number {
    if (previous === 0) return current > 0 ? 100 : 0
    return ((current - previous) / previous) * 100
}

/**
 * Format percentage for display
 */
export function formatPercent(value: number, decimals = 1): string {
    const prefix = value > 0 ? '+' : ''
    return `${prefix}${value.toFixed(decimals)}%`
}

/**
 * Get time range display label
 */
export function getTimeRangeLabel(range: TimeRange): string {
    const labels: Record<TimeRange, string> = {
        '7d': 'Last 7 days',
        '30d': 'Last 30 days',
        '90d': 'Last 90 days'
    }
    return labels[range]
}

/**
 * Get days from time range string
 */
export function getDaysFromRange(range: TimeRange): number {
    const days: Record<TimeRange, number> = {
        '7d': 7,
        '30d': 30,
        '90d': 90
    }
    return days[range]
}
