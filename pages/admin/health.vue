<script setup lang="ts">
import {
    LucideRefreshCw as RefreshIcon,
} from 'lucide-vue-next'
import { useAdminHealth, formatBytes, formatUptime } from '~/composables/useAdminHealth'

definePageMeta({
    middleware: 'admin',
    layout: 'admin',
})

const {
    healthChecks,
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
    refreshAll,
    fetchHistory,
    toggleAutoRefresh,
} = useAdminHealth()

// Time range options for history
const timeRangeOptions = [
    { label: 'Last Hour', value: '1h' },
    { label: 'Last 6 Hours', value: '6h' },
    { label: 'Last 24 Hours', value: '24h' },
    { label: 'Last 7 Days', value: '7d' },
]

// Status summary text
const statusSummary = computed(() => {
    const failed = failedChecks.value.length
    const degraded = degradedChecks.value.length
    if (failed > 0 && degraded > 0) return `${failed} failed, ${degraded} degraded`
    if (failed > 0) return `${failed} check${failed > 1 ? 's' : ''} failing`
    if (degraded > 0) return `${degraded} check${degraded > 1 ? 's' : ''} degraded`
    return 'All Systems Operational'
})

const statusBannerClass = computed(() => {
    if (overallStatus.value === 'fail') return 'status-banner--fail'
    if (overallStatus.value === 'degraded') return 'status-banner--degraded'
    return 'status-banner--ok'
})

// Time since last update
const timeSinceUpdate = ref('')
let updateTimer: ReturnType<typeof setInterval> | null = null

function updateTimeSince() {
    if (!lastUpdate.value) {
        timeSinceUpdate.value = ''
        return
    }
    const seconds = Math.floor((Date.now() - lastUpdate.value.getTime()) / 1000)
    if (seconds < 5) timeSinceUpdate.value = 'just now'
    else if (seconds < 60) timeSinceUpdate.value = `${seconds}s ago`
    else timeSinceUpdate.value = `${Math.floor(seconds / 60)}m ago`
}

onMounted(() => {
    updateTimer = setInterval(updateTimeSince, 1000)
})

onUnmounted(() => {
    if (updateTimer) clearInterval(updateTimer)
})
</script>

<template>
    <div class="health-page">
        <!-- Header -->
        <div class="health-header">
            <div class="health-header-left">
                <h2 class="text-xl font-semibold text-white">System Health</h2>
                <p class="text-sm text-white/50 mt-1">Monitor service status and diagnostics</p>
            </div>
            <div class="health-header-right">
                <span v-if="timeSinceUpdate" class="last-updated">
                    Updated {{ timeSinceUpdate }}
                </span>
                <div class="auto-refresh-toggle">
                    <span class="toggle-label">Auto-refresh</span>
                    <NSwitch
                        :value="autoRefreshEnabled"
                        size="small"
                        @update:value="toggleAutoRefresh"
                    />
                </div>
                <NButton
                    quaternary
                    circle
                    :loading="isLoading"
                    @click="refreshAll"
                >
                    <template #icon>
                        <NIcon :component="RefreshIcon" />
                    </template>
                </NButton>
            </div>
        </div>

        <!-- Error banner -->
        <div v-if="error" class="error-banner">
            {{ error }}
        </div>

        <!-- Overall Status Banner -->
        <div class="status-banner" :class="statusBannerClass">
            <div class="status-banner-left">
                <span class="status-banner-icon">
                    {{ overallStatus === 'ok' ? '\u2713' : overallStatus === 'degraded' ? '\u26A0' : '\u2717' }}
                </span>
                <span class="status-banner-text">{{ statusSummary }}</span>
            </div>
            <div v-if="serverInfo" class="status-banner-info">
                <span class="info-item">Node {{ serverInfo.nodeVersion }}</span>
                <span class="info-separator">&middot;</span>
                <span class="info-item">Uptime {{ formatUptime(serverInfo.uptimeSeconds) }}</span>
                <span class="info-separator">&middot;</span>
                <span class="info-item">RSS {{ formatBytes(serverInfo.memoryUsage.rss) }}</span>
                <span class="info-separator">&middot;</span>
                <span class="info-item">Heap {{ formatBytes(serverInfo.memoryUsage.heapUsed) }} / {{ formatBytes(serverInfo.memoryUsage.heapTotal) }}</span>
                <span v-if="samplerRunning" class="info-separator">&middot;</span>
                <NTag v-if="samplerRunning" size="tiny" type="success" round>Sampler Active</NTag>
            </div>
        </div>

        <!-- Health Check Cards -->
        <div class="health-cards">
            <template v-if="isLoading && healthChecks.length === 0">
                <div class="loading-placeholder" v-for="i in 6" :key="i">
                    <NSkeleton :height="120" :sharp="false" />
                </div>
            </template>
            <AdminHealthCard
                v-for="check in healthChecks"
                :key="check.name"
                :check="check"
                :loading="isLoading"
                @recheck="refreshAll"
            />
        </div>

        <!-- Performance History -->
        <div class="history-section">
            <div class="history-header">
                <h3 class="text-lg font-semibold text-white/90">Performance History</h3>
                <NSelect
                    v-model:value="timeRange"
                    :options="timeRangeOptions"
                    size="small"
                    style="width: 180px"
                    @update:value="fetchHistory"
                />
            </div>

            <NSpin :show="isLoadingHistory">
                <div v-if="filteredHistoricalData.length === 0 && !isLoadingHistory" class="history-empty">
                    No historical data available for this time range.
                </div>
                <div v-else class="history-charts">
                    <LazyHistoryChart
                        v-for="data in filteredHistoricalData"
                        :key="data.check_name"
                        :data="data"
                    />
                </div>
            </NSpin>
        </div>
    </div>
</template>

<style scoped lang="sass">
.health-page
    max-width: 1200px
    margin: 0 auto

// Header
.health-header
    display: flex
    align-items: flex-start
    justify-content: space-between
    margin-bottom: 24px
    gap: 16px

    @media (max-width: 640px)
        flex-direction: column

.health-header-right
    display: flex
    align-items: center
    gap: 12px
    flex-shrink: 0

.last-updated
    font-size: 12px
    color: rgba(255, 255, 255, 0.35)
    font-family: 'SF Mono', 'Fira Code', monospace
    white-space: nowrap

.auto-refresh-toggle
    display: flex
    align-items: center
    gap: 8px

.toggle-label
    font-size: 12px
    color: rgba(255, 255, 255, 0.5)
    white-space: nowrap

// Error banner
.error-banner
    background: rgba(239, 68, 68, 0.1)
    border: 1px solid rgba(239, 68, 68, 0.2)
    border-radius: 12px
    padding: 12px 16px
    margin-bottom: 16px
    font-size: 13px
    color: #fca5a5

// Status Banner
.status-banner
    display: flex
    align-items: center
    justify-content: space-between
    flex-wrap: wrap
    gap: 12px
    padding: 16px 20px
    border-radius: 14px
    margin-bottom: 24px
    backdrop-filter: blur(12px)
    border: 1px solid rgba(255, 255, 255, 0.08)

    &--ok
        background: linear-gradient(135deg, rgba(16, 185, 129, 0.12), rgba(16, 185, 129, 0.04))
        border-left: 4px solid #10b981

    &--degraded
        background: linear-gradient(135deg, rgba(245, 158, 11, 0.12), rgba(245, 158, 11, 0.04))
        border-left: 4px solid #f59e0b

    &--fail
        background: linear-gradient(135deg, rgba(239, 68, 68, 0.12), rgba(239, 68, 68, 0.04))
        border-left: 4px solid #ef4444

.status-banner-left
    display: flex
    align-items: center
    gap: 10px

.status-banner-icon
    font-size: 20px
    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))

.status-banner-text
    font-size: 15px
    font-weight: 600
    color: rgba(255, 255, 255, 0.9)

.status-banner-info
    display: flex
    align-items: center
    gap: 8px
    flex-wrap: wrap

.info-item
    font-size: 12px
    font-family: 'SF Mono', 'Fira Code', monospace
    color: rgba(255, 255, 255, 0.45)

.info-separator
    color: rgba(255, 255, 255, 0.2)

// Health Cards
.health-cards
    display: flex
    flex-direction: column
    gap: 16px
    margin-bottom: 32px

.loading-placeholder
    border-radius: 16px
    overflow: hidden

// History Section
.history-section
    background: rgba(255, 255, 255, 0.03)
    backdrop-filter: blur(12px)
    border: 1px solid rgba(255, 255, 255, 0.06)
    border-radius: 16px
    padding: 20px

.history-header
    display: flex
    align-items: center
    justify-content: space-between
    margin-bottom: 16px
    gap: 16px

.history-empty
    text-align: center
    padding: 48px 0
    font-size: 14px
    color: rgba(255, 255, 255, 0.35)

.history-charts
    display: flex
    flex-direction: column
    gap: 16px
</style>
