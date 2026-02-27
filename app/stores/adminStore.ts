/**
 * Admin Store - State management for admin panel functionality
 *
 * @description Manages admin authentication, overview stats, user management,
 * settings, and activity data for the admin panel.
 */
import { defineStore } from 'pinia'
import { api } from '~/utils/api'
import type {
    AdminOverviewStats,
    AdminUserDetails,
    AdminUserSummary,
    AdminActivityData,
    AdminSetting,
    AdminInfo,
    AdminActivityLogEntry,
    AdminTopUser,
    PluginSetting,
    PluginSettingCategory,
    APIResponse
} from '~/types'
import { toISOTimestamp } from '~/types'
import { APP_SETTING_CATEGORIES, SETTING_KEY_TO_CATEGORY } from '~/utils/settingsCategories'

// ============================================================================
// INTERFACES
// ============================================================================

interface AdminState {
    /** Whether the current user is an admin */
    isAdmin: boolean
    /** Admin role ('admin' | 'superadmin' | null) */
    adminRole: 'admin' | 'superadmin' | null
    /** Admin permissions array */
    adminPermissions: string[]
    /** Overview statistics for dashboard */
    overviewStats: AdminOverviewStats | null
    /** User list for management */
    users: AdminUserSummary[]
    /** Total user count for pagination */
    usersTotal: number
    /** Activity data for charts */
    activityData: AdminActivityData | null
    /** Top users for leaderboard */
    topUsers: AdminTopUser[]
    /** App settings */
    settings: AdminSetting[]
    /** Activity log entries */
    activityLog: AdminActivityLogEntry[]
    /** Activity log total count */
    activityLogTotal: number
    /** Admin users list (superadmin only) */
    adminUsers: AdminInfo[]
    /** Plugin settings */
    pluginSettings: PluginSetting[]
    /** Loading states */
    isLoading: boolean
    isLoadingStats: boolean
    isLoadingUsers: boolean
    isLoadingSettings: boolean
    isLoadingPluginSettings: boolean
    isLoadingActivity: boolean
    /** Error message */
    error: string | null
    /** Cache keys for list queries */
    lastUsersQuery: string | null
    lastActivityLogQuery: string | null
    /** Last fetched activity range */
    lastActivityRange: '7d' | '30d' | '90d' | null
    /** Last fetch timestamps for caching */
    lastFetch: {
        adminStatus: number | null
        stats: number | null
        users: number | null
        settings: number | null
        activity: number | null
        activityLog: number | null
        adminUsers: number | null
        pluginSettings: number | null
    }
}

// Cache duration in milliseconds (5 minutes)
const CACHE_DURATION = 5 * 60 * 1000

type PaginatedPayload<T, K extends string> = T[] | (Record<K, T[]> & { pagination?: { totalItems: number } })
type PaginatedApiResponse<T> = APIResponse<T> & { pagination?: { totalItems?: number } }

function normalizePaginatedList<T, K extends string>(payload: PaginatedPayload<T, K> | undefined, key: K) {
    if (!payload) {
        return { items: [] as T[], pagination: undefined as { totalItems?: number } | undefined }
    }
    if (Array.isArray(payload)) {
        return { items: payload, pagination: undefined as { totalItems?: number } | undefined }
    }
    return {
        items: Array.isArray(payload[key]) ? payload[key] : [],
        pagination: payload.pagination
    }
}

export const useAdminStore = defineStore('admin', {
    state: (): AdminState => ({
        isAdmin: false,
        adminRole: null,
        adminPermissions: [],
        overviewStats: null,
        users: [],
        usersTotal: 0,
        activityData: null,
        topUsers: [],
        settings: [],
        activityLog: [],
        activityLogTotal: 0,
        adminUsers: [],
        pluginSettings: [],
        isLoading: false,
        isLoadingStats: false,
        isLoadingUsers: false,
        isLoadingSettings: false,
        isLoadingPluginSettings: false,
        isLoadingActivity: false,
        error: null,
        lastUsersQuery: null,
        lastActivityLogQuery: null,
        lastActivityRange: null,
        lastFetch: {
            adminStatus: null,
            stats: null,
            users: null,
            settings: null,
            activity: null,
            activityLog: null,
            adminUsers: null,
            pluginSettings: null
        }
    }),

    getters: {
        /** Check if current user is a superadmin */
        isSuperAdmin: (state) => state.adminRole === 'superadmin',

        /** Check if stats data is stale and needs refresh */
        isStatsCacheStale: (state) => {
            if (!state.lastFetch.stats) return true
            return Date.now() - state.lastFetch.stats > CACHE_DURATION
        },

        /** Check if user data is stale and needs refresh */
        isUsersCacheStale: (state) => {
            if (!state.lastFetch.users) return true
            return Date.now() - state.lastFetch.users > CACHE_DURATION
        },

        /** Check if settings data is stale and needs refresh */
        isSettingsCacheStale: (state) => {
            if (!state.lastFetch.settings) return true
            return Date.now() - state.lastFetch.settings > CACHE_DURATION
        },

        /** Check if plugin settings data is stale and needs refresh */
        isPluginSettingsCacheStale: (state) => {
            if (!state.lastFetch.pluginSettings) return true
            return Date.now() - state.lastFetch.pluginSettings > CACHE_DURATION
        },

        /** Plugin settings grouped by category and sorted by sortOrder */
        pluginSettingsByCategory: (state): Record<PluginSettingCategory, PluginSetting[]> => {
            const grouped = {} as Record<PluginSettingCategory, PluginSetting[]>
            for (const setting of state.pluginSettings) {
                const cat = setting.category as PluginSettingCategory
                if (!grouped[cat]) grouped[cat] = []
                grouped[cat].push(setting)
            }
            for (const cat of Object.keys(grouped) as PluginSettingCategory[]) {
                grouped[cat].sort((a, b) => a.sortOrder - b.sortOrder)
            }
            return grouped
        },

        /** App settings grouped by category using the frontend category map */
        settingsByCategory: (state): Record<string, AdminSetting[]> => {
            const grouped: Record<string, AdminSetting[]> = {}

            for (const cat of APP_SETTING_CATEGORIES) {
                grouped[cat.key] = []
            }

            for (const setting of state.settings) {
                const category = SETTING_KEY_TO_CATEGORY[setting.key] || 'other'
                if (!grouped[category]) grouped[category] = []
                grouped[category]!.push(setting)
            }

            for (const cat of APP_SETTING_CATEGORIES) {
                const order = cat.settingKeys
                grouped[cat.key]?.sort((a, b) => {
                    const ai = order.indexOf(a.key)
                    const bi = order.indexOf(b.key)
                    return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi)
                })
            }

            for (const key of Object.keys(grouped)) {
                if (grouped[key]?.length === 0) {
                    // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
                    delete grouped[key]
                }
            }

            return grouped
        },

        /** Get formatted total items count */
        totalItems: (state) => {
            if (!state.overviewStats?.totalItems) return 0
            const items = state.overviewStats.totalItems
            return items.weapons + items.knives + items.gloves + items.agents + items.musicKits + items.pins
        }
    },

    actions: {
        // ====================================================================
        // ADMIN AUTHENTICATION
        // ====================================================================

        /**
         * Check if current user is an admin
         * Called on app initialization or when navigating to admin routes
         */
        async checkAdminStatus(): Promise<boolean> {
            this.error = null
            console.log('[adminStore] Checking admin status...')

            const now = Date.now()
            const adminStatusFresh = !!this.lastFetch.adminStatus && now - this.lastFetch.adminStatus < CACHE_DURATION
            const adminRoleFresh = !!this.lastFetch.adminUsers && now - this.lastFetch.adminUsers < CACHE_DURATION

            if (this.isAdmin && adminStatusFresh) {
                if (!this.adminRole || !adminRoleFresh) {
                    await this.fetchCurrentAdminInfo()
                }
                return true
            }

            try {
                // Try fetching overview stats - if it succeeds, user is admin
                const response = await api.get<AdminOverviewStats>('/api/admin/stats/overview')

                console.log('[adminStore] API response:', response)

                if (response.success && response.data) {
                    this.isAdmin = true
                    this.error = null
                    this.lastFetch.adminStatus = Date.now()
                    // Role is set from the API context, we'll fetch it from admins endpoint
                    await this.fetchCurrentAdminInfo()
                    console.log('[adminStore] Admin status confirmed, role:', this.adminRole)
                    return true
                }

                this.isAdmin = false
                this.adminRole = null
                this.lastFetch.adminStatus = null
                this.error = response.error?.message || 'Admin access denied'
                console.log('[adminStore] Admin check failed:', this.error)
                return false
            } catch (err) {
                this.isAdmin = false
                this.adminRole = null
                this.lastFetch.adminStatus = null
                this.error = err instanceof Error ? err.message : 'Failed to verify admin status'
                console.log('[adminStore] Admin check error:', this.error)
                return false
            }
        },

        /**
         * Fetch current admin's info (role, permissions)
         */
        async fetchCurrentAdminInfo(forceRefresh = false): Promise<void> {
            const now = Date.now()
            if (!forceRefresh && this.adminRole && this.lastFetch.adminUsers && now - this.lastFetch.adminUsers < CACHE_DURATION) {
                return
            }

            try {
                const response = await api.get<AdminInfo[] | { admins: AdminInfo[] }>('/api/admin/admins')

                if (response.success && response.data) {
                    // The current user is in the list if they can access this endpoint
                    // We need to match by steamId from auth context
                    const payload = response.data
                    this.adminUsers = Array.isArray(payload) ? payload : payload?.admins || []

                    // Find current user's role from the first admin (they must be one to access this)
                    // In practice, we'd get this from the JWT or session, but for now we'll use superadmin
                    // if they can access /api/admin/admins
                    this.adminRole = 'superadmin'
                    this.lastFetch.adminUsers = Date.now()
                }
            } catch {
                // If can't fetch admins list, user is regular admin
                this.adminRole = 'admin'
                this.lastFetch.adminUsers = Date.now()
            }
        },

        // ====================================================================
        // STATISTICS
        // ====================================================================

        /**
         * Fetch overview statistics for the dashboard
         */
        async fetchOverviewStats(forceRefresh = false): Promise<void> {
            if (!forceRefresh && !this.isStatsCacheStale && this.overviewStats) {
                return
            }

            this.isLoadingStats = true
            this.error = null

            try {
                const response = await api.get<AdminOverviewStats>('/api/admin/stats/overview')

                if (response.success && response.data) {
                    this.overviewStats = response.data
                    this.lastFetch.stats = Date.now()
                }
            } catch (error) {
                this.error = error instanceof Error ? error.message : 'Failed to fetch statistics'
                throw error
            } finally {
                this.isLoadingStats = false
            }
        },

        /**
         * Fetch activity data for charts
         */
        async fetchActivityData(range: '7d' | '30d' | '90d' = '30d', force = false): Promise<void> {
            const activityFresh = !!this.lastFetch.activity && Date.now() - this.lastFetch.activity < CACHE_DURATION
            if (!force && activityFresh && this.activityData && this.lastActivityRange === range) {
                return
            }

            this.isLoadingActivity = true
            this.error = null

            try {
                const response = await api.get<AdminActivityData>('/api/admin/stats/activity', { range })

                if (response.success && response.data) {
                    this.activityData = response.data
                    this.lastFetch.activity = Date.now()
                    this.lastActivityRange = range
                }
            } catch (error) {
                this.error = error instanceof Error ? error.message : 'Failed to fetch activity data'
                throw error
            } finally {
                this.isLoadingActivity = false
            }
        },

        /**
         * Fetch top users for leaderboard
         */
        async fetchTopUsers(limit = 10): Promise<void> {
            try {
                const response = await api.get<{ topUsers: AdminTopUser[] }>('/api/admin/stats/users', { limit })

                if (response.success && response.data?.topUsers) {
                    this.topUsers = response.data.topUsers
                }
            } catch (error) {
                console.error('Failed to fetch top users:', error)
            }
        },

        // ====================================================================
        // USER MANAGEMENT
        // ====================================================================

        /**
         * Search/fetch users with pagination
         */
        async fetchUsers(params: { search?: string; page?: number; limit?: number; force?: boolean; sortBy?: string; sortDir?: string; bannedOnly?: boolean; activeOnly?: boolean } = {}): Promise<void> {
            const { search, page = 1, limit = 20, force = false, sortBy, sortDir, bannedOnly, activeOnly } = params
            const queryKey = `${search || ''}|${page}|${limit}|${sortBy || ''}|${sortDir || ''}|${bannedOnly || ''}|${activeOnly || ''}`

            if (!force && !this.isUsersCacheStale && this.users.length > 0 && this.lastUsersQuery === queryKey) {
                return
            }

            this.isLoadingUsers = true
            this.error = null

            try {
                const queryParams: Record<string, string> = {
                    page: String(page),
                    limit: String(limit)
                }
                if (search) queryParams.search = search
                if (sortBy) queryParams.sortBy = sortBy
                if (sortDir) queryParams.sortDir = sortDir
                if (bannedOnly) queryParams.bannedOnly = 'true'
                if (activeOnly) queryParams.activeOnly = 'true'

                const response = await api.get<PaginatedPayload<AdminUserSummary, 'users'>>(
                    '/api/admin/users',
                    queryParams
                ) as PaginatedApiResponse<PaginatedPayload<AdminUserSummary, 'users'>>

                if (response.success && response.data) {
                    const { items, pagination } = normalizePaginatedList(response.data, 'users')
                    this.users = items
                    this.usersTotal = response.pagination?.totalItems || pagination?.totalItems || items.length || 0
                    this.lastFetch.users = Date.now()
                    this.lastUsersQuery = queryKey
                }
            } catch (error) {
                this.error = error instanceof Error ? error.message : 'Failed to fetch users'
                throw error
            } finally {
                this.isLoadingUsers = false
            }
        },

        /**
         * Get detailed user information
         */
        async fetchUserDetails(steamId: string): Promise<AdminUserDetails | null> {
            try {
                const response = await api.get<AdminUserDetails>(`/api/admin/users/${steamId}`)

                if (response.success && response.data) {
                    return response.data
                }
                return null
            } catch (error) {
                this.error = error instanceof Error ? error.message : 'Failed to fetch user details'
                throw error
            }
        },

        /**
         * Ban a user
         */
        async banUser(
            steamId: string,
            reason: string,
            durationHours?: number,
            options: { refreshList?: boolean } = {}
        ): Promise<void> {
            this.isLoading = true
            this.error = null

            try {
                await api.post(`/api/admin/users/${steamId}/ban`, {
                    reason,
                    durationHours
                })

                // Refresh user list
                if (options.refreshList !== false) {
                    await this.fetchUsers({ force: true })
                }
            } catch (error) {
                this.error = error instanceof Error ? error.message : 'Failed to ban user'
                throw error
            } finally {
                this.isLoading = false
            }
        },

        /**
         * Unban a user
         */
        async unbanUser(steamId: string, options: { refreshList?: boolean } = {}): Promise<void> {
            this.isLoading = true
            this.error = null

            try {
                await api.post(`/api/admin/users/${steamId}/unban`, {})

                // Refresh user list
                if (options.refreshList !== false) {
                    await this.fetchUsers({ force: true })
                }
            } catch (error) {
                this.error = error instanceof Error ? error.message : 'Failed to unban user'
                throw error
            } finally {
                this.isLoading = false
            }
        },

        /**
         * Delete all user data
         */
        async deleteUserData(steamId: string): Promise<void> {
            this.isLoading = true
            this.error = null

            try {
                await api.delete(`/api/admin/users/${steamId}`)

                // Refresh user list and stats
                await Promise.all([
                    this.fetchUsers({ force: true }),
                    this.fetchOverviewStats(true)
                ])
            } catch (error) {
                this.error = error instanceof Error ? error.message : 'Failed to delete user data'
                throw error
            } finally {
                this.isLoading = false
            }
        },

        // ====================================================================
        // SETTINGS MANAGEMENT
        // ====================================================================

        /**
         * Fetch all application settings
         */
        async fetchSettings(forceRefresh = false): Promise<void> {
            if (!forceRefresh && !this.isSettingsCacheStale && this.settings.length > 0) {
                return
            }

            this.isLoadingSettings = true
            this.error = null

            try {
                const response = await api.get<AdminSetting[] | { settings: AdminSetting[] }>('/api/admin/settings')

                if (response.success && response.data) {
                    const payload = response.data
                    this.settings = Array.isArray(payload) ? payload : payload?.settings || []
                    this.lastFetch.settings = Date.now()
                }
            } catch (error) {
                this.error = error instanceof Error ? error.message : 'Failed to fetch settings'
                throw error
            } finally {
                this.isLoadingSettings = false
            }
        },

        /**
         * Update a setting value
         */
        async updateSetting(key: string, value: string | number | boolean): Promise<void> {
            this.isLoading = true
            this.error = null

            try {
                await api.put('/api/admin/settings', { key, value })

                // Update local state
                const index = this.settings.findIndex(s => s.key === key)
                const existing = this.settings[index]
                if (index !== -1 && existing) {
                    this.settings[index] = {
                        key: existing.key,
                        value: String(value),
                        type: existing.type,
                        description: existing.description,
                        updatedAt: toISOTimestamp(new Date()),
                        updatedBy: existing.updatedBy
                    }
                }
            } catch (error) {
                this.error = error instanceof Error ? error.message : 'Failed to update setting'
                throw error
            } finally {
                this.isLoading = false
            }
        },

        // ====================================================================
        // PLUGIN SETTINGS
        // ====================================================================

        /**
         * Fetch all plugin settings
         */
        async fetchPluginSettings(forceRefresh = false): Promise<void> {
            if (!forceRefresh && !this.isPluginSettingsCacheStale && this.pluginSettings.length > 0) {
                return
            }

            this.isLoadingPluginSettings = true
            this.error = null

            try {
                const response = await api.get<PluginSetting[]>('/api/admin/plugin-settings')

                if (response.success && response.data) {
                    this.pluginSettings = Array.isArray(response.data) ? response.data : []
                    this.lastFetch.pluginSettings = Date.now()
                }
            } catch (error) {
                this.error = error instanceof Error ? error.message : 'Failed to fetch plugin settings'
                throw error
            } finally {
                this.isLoadingPluginSettings = false
            }
        },

        /**
         * Update a plugin setting value
         */
        async updatePluginSetting(key: string, value: string | number | boolean | Record<string, unknown> | unknown[]): Promise<void> {
            this.error = null

            try {
                const response = await api.put<PluginSetting>('/api/admin/plugin-settings', { key, value })

                if (response.success && response.data) {
                    // Update local state
                    const index = this.pluginSettings.findIndex(s => s.key === key)
                    if (index !== -1) {
                        this.pluginSettings[index] = response.data
                    }
                }
            } catch (error) {
                this.error = error instanceof Error ? error.message : 'Failed to update plugin setting'
                throw error
            }
        },

        /**
         * Reset all plugin settings to defaults
         */
        async resetPluginSettings(): Promise<void> {
            this.isLoadingPluginSettings = true
            this.error = null

            try {
                await api.post('/api/admin/plugin-settings/reset', {})

                // Refetch settings after reset
                await this.fetchPluginSettings(true)
            } catch (error) {
                this.error = error instanceof Error ? error.message : 'Failed to reset plugin settings'
                throw error
            } finally {
                this.isLoadingPluginSettings = false
            }
        },

        // ====================================================================
        // ACTIVITY LOG
        // ====================================================================

        /**
         * Fetch activity log with pagination
         */
        async fetchActivityLog(params: { page?: number; limit?: number; action?: string; force?: boolean } = {}): Promise<void> {
            const { page = 1, limit = 50, action, force = false } = params
            const queryKey = `${action || ''}|${page}|${limit}`

            const logFresh = !!this.lastFetch.activityLog && Date.now() - this.lastFetch.activityLog < CACHE_DURATION
            if (!force && logFresh && this.activityLog.length > 0 && this.lastActivityLogQuery === queryKey) {
                return
            }

            this.isLoading = true
            this.error = null

            try {
                const queryParams: Record<string, string> = {
                    page: String(page),
                    limit: String(limit)
                }
                if (action) queryParams.action = action

                const response = await api.get<PaginatedPayload<AdminActivityLogEntry, 'entries'>>(
                    '/api/admin/activity-log',
                    queryParams
                ) as PaginatedApiResponse<PaginatedPayload<AdminActivityLogEntry, 'entries'>>

                if (response.success && response.data) {
                    const { items, pagination } = normalizePaginatedList(response.data, 'entries')
                    this.activityLog = items
                    this.activityLogTotal = response.pagination?.totalItems || pagination?.totalItems || items.length || 0
                    this.lastFetch.activityLog = Date.now()
                    this.lastActivityLogQuery = queryKey
                }
            } catch (error) {
                this.error = error instanceof Error ? error.message : 'Failed to fetch activity log'
                throw error
            } finally {
                this.isLoading = false
            }
        },

        // ====================================================================
        // ADMIN MANAGEMENT (SUPERADMIN ONLY)
        // ====================================================================

        /**
         * Fetch all admin users
         */
        async fetchAdminUsers(forceRefresh = false): Promise<void> {
            const now = Date.now()
            const adminUsersFresh = !!this.lastFetch.adminUsers && now - this.lastFetch.adminUsers < CACHE_DURATION
            if (!forceRefresh && adminUsersFresh && this.adminUsers.length > 0) {
                return
            }

            this.isLoading = true
            this.error = null

            try {
                const response = await api.get<AdminInfo[] | { admins: AdminInfo[] }>('/api/admin/admins')

                if (response.success && response.data) {
                    const payload = response.data
                    this.adminUsers = Array.isArray(payload) ? payload : payload?.admins || []
                    this.lastFetch.adminUsers = Date.now()
                }
            } catch (error) {
                this.error = error instanceof Error ? error.message : 'Failed to fetch admin users'
                throw error
            } finally {
                this.isLoading = false
            }
        },

        /**
         * Add a new admin
         */
        async addAdmin(steamId: string, role: 'admin' | 'superadmin'): Promise<void> {
            this.isLoading = true
            this.error = null

            try {
                await api.post('/api/admin/admins', { steamId, role })

                // Refresh admin list
                await this.fetchAdminUsers(true)
            } catch (error) {
                this.error = error instanceof Error ? error.message : 'Failed to add admin'
                throw error
            } finally {
                this.isLoading = false
            }
        },

        /**
         * Remove an admin
         */
        async removeAdmin(steamId: string): Promise<void> {
            this.isLoading = true
            this.error = null

            try {
                await api.delete(`/api/admin/admins/${steamId}`)

                // Refresh admin list
                await this.fetchAdminUsers(true)
            } catch (error) {
                this.error = error instanceof Error ? error.message : 'Failed to remove admin'
                throw error
            } finally {
                this.isLoading = false
            }
        },

        // ====================================================================
        // UTILITY ACTIONS
        // ====================================================================

        /**
         * Clear all cached data
         */
        clearCache(): void {
            this.overviewStats = null
            this.users = []
            this.activityData = null
            this.settings = []
            this.pluginSettings = []
            this.activityLog = []
            this.lastUsersQuery = null
            this.lastActivityLogQuery = null
            this.lastActivityRange = null
            this.lastFetch = {
                adminStatus: null,
                stats: null,
                users: null,
                settings: null,
                activity: null,
                activityLog: null,
                adminUsers: null,
                pluginSettings: null
            }
        },

        /**
         * Reset store to initial state
         */
        reset(): void {
            this.isAdmin = false
            this.adminRole = null
            this.adminPermissions = []
            this.clearCache()
            this.error = null
        }
    }
})
