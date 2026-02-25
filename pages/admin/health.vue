<script setup lang="ts">
import {
    LucideRefreshCw as RefreshIcon,
    LucideSend as SendIcon,
    LucidePlus as PlusIcon,
    LucideX as RemoveIcon,
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

// =========================================================================
// Fetch Tester
// =========================================================================

const fetchTestUrl = ref('')
const fetchTestMethod = ref<string>('GET')
const fetchTestHeaders = ref<Array<{ key: string; value: string }>>([])
const fetchTestBody = ref('')
const fetchTestLoading = ref(false)
const fetchTestResult = ref<{
    request: { url: string; method: string; headers: Record<string, string>; hasBody: boolean }
    response: { status: number; statusText: string; headers: Record<string, string>; body: string } | null
    error: { code: string | null; message: string } | null
    latencyMs: number
} | null>(null)

const methodOptions = [
    { label: 'GET', value: 'GET' },
    { label: 'POST', value: 'POST' },
    { label: 'PUT', value: 'PUT' },
    { label: 'DELETE', value: 'DELETE' },
    { label: 'PATCH', value: 'PATCH' },
    { label: 'HEAD', value: 'HEAD' },
]

function addHeader() {
    fetchTestHeaders.value.push({ key: '', value: '' })
}

function removeHeader(index: number) {
    fetchTestHeaders.value.splice(index, 1)
}

const showBody = computed(() => !['GET', 'HEAD'].includes(fetchTestMethod.value))

async function sendFetchTest() {
    if (!fetchTestUrl.value.trim()) return

    fetchTestLoading.value = true
    fetchTestResult.value = null

    const headers: Record<string, string> = {}
    for (const h of fetchTestHeaders.value) {
        if (h.key.trim()) headers[h.key.trim()] = h.value
    }

    try {
        const resp = await $fetch<{ data: typeof fetchTestResult.value }>('/api/admin/health/fetch-test', {
            method: 'POST',
            body: {
                url: fetchTestUrl.value.trim(),
                method: fetchTestMethod.value,
                headers: Object.keys(headers).length > 0 ? headers : undefined,
                body: showBody.value && fetchTestBody.value.trim() ? fetchTestBody.value.trim() : undefined,
            },
        })
        fetchTestResult.value = resp.data
    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err)
        fetchTestResult.value = {
            request: { url: fetchTestUrl.value, method: fetchTestMethod.value, headers, hasBody: false },
            response: null,
            error: { code: 'CLIENT_ERROR', message: msg },
            latencyMs: 0,
        }
    } finally {
        fetchTestLoading.value = false
    }
}

function tryFormatJson(str: string): string {
    try {
        return JSON.stringify(JSON.parse(str), null, 2)
    } catch {
        return str
    }
}
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

        <!-- Fetch Tester -->
        <div class="fetch-tester-section">
            <h3 class="text-lg font-semibold text-white/90 mb-4">Request Tester</h3>
            <p class="text-xs text-white/35 mb-4">
                Send HTTP requests from the server process to test connectivity. Runs in the same network context as the app.
            </p>

            <!-- URL + Method row -->
            <div class="fetch-input-row">
                <NSelect
                    v-model:value="fetchTestMethod"
                    :options="methodOptions"
                    size="small"
                    style="width: 110px; flex-shrink: 0"
                />
                <NInput
                    v-model:value="fetchTestUrl"
                    placeholder="https://example.com/api/health/ready"
                    size="small"
                    clearable
                    @keydown.enter="sendFetchTest"
                />
                <NButton
                    type="primary"
                    size="small"
                    :loading="fetchTestLoading"
                    :disabled="!fetchTestUrl.trim()"
                    @click="sendFetchTest"
                >
                    <template #icon>
                        <NIcon :component="SendIcon" :size="14" />
                    </template>
                    Send
                </NButton>
            </div>

            <!-- Headers -->
            <div class="fetch-headers">
                <div class="fetch-section-label">
                    <span>Headers</span>
                    <NButton quaternary size="tiny" @click="addHeader">
                        <template #icon>
                            <NIcon :component="PlusIcon" :size="12" />
                        </template>
                        Add
                    </NButton>
                </div>
                <div v-for="(header, index) in fetchTestHeaders" :key="index" class="fetch-header-row">
                    <NInput
                        v-model:value="header.key"
                        placeholder="Header name (e.g. X-API-Key)"
                        size="tiny"
                    />
                    <NInput
                        v-model:value="header.value"
                        placeholder="Value"
                        size="tiny"
                    />
                    <NButton quaternary circle size="tiny" @click="removeHeader(index)">
                        <template #icon>
                            <NIcon :component="RemoveIcon" :size="12" />
                        </template>
                    </NButton>
                </div>
            </div>

            <!-- Body -->
            <div v-if="showBody" class="fetch-body">
                <div class="fetch-section-label">
                    <span>Body</span>
                </div>
                <NInput
                    v-model:value="fetchTestBody"
                    type="textarea"
                    placeholder='{"key": "value"}'
                    size="small"
                    :autosize="{ minRows: 2, maxRows: 8 }"
                />
            </div>

            <!-- Result -->
            <div v-if="fetchTestResult" class="fetch-result">
                <!-- Response or Error summary -->
                <div class="fetch-result-summary">
                    <template v-if="fetchTestResult.response">
                        <NTag
                            :type="fetchTestResult.response.status < 400 ? 'success' : 'error'"
                            size="small"
                            round
                        >
                            {{ fetchTestResult.response.status }} {{ fetchTestResult.response.statusText }}
                        </NTag>
                    </template>
                    <NTag v-else type="error" size="small" round>
                        Error
                    </NTag>
                    <span class="fetch-latency">{{ fetchTestResult.latencyMs }}ms</span>
                    <span class="fetch-result-method">{{ fetchTestResult.request.method }} {{ fetchTestResult.request.url }}</span>
                </div>

                <!-- Error details -->
                <div v-if="fetchTestResult.error" class="fetch-error-box">
                    <div v-if="fetchTestResult.error.code" class="fetch-error-code">{{ fetchTestResult.error.code }}</div>
                    <div class="fetch-error-message">{{ fetchTestResult.error.message }}</div>
                </div>

                <!-- Response headers -->
                <template v-if="fetchTestResult.response">
                    <NCollapse arrow-placement="left" class="fetch-response-collapse">
                        <NCollapseItem title="Response Headers" name="headers">
                            <template #header-extra>
                                <span class="details-count">{{ Object.keys(fetchTestResult.response.headers).length }} headers</span>
                            </template>
                            <div class="fetch-headers-table">
                                <div
                                    v-for="(value, key) in fetchTestResult.response.headers"
                                    :key="key"
                                    class="fetch-kv-row"
                                >
                                    <span class="fetch-kv-key">{{ key }}</span>
                                    <span class="fetch-kv-value">{{ value }}</span>
                                </div>
                            </div>
                        </NCollapseItem>
                    </NCollapse>

                    <!-- Response body -->
                    <div class="fetch-section-label mt-3">
                        <span>Response Body</span>
                    </div>
                    <pre class="fetch-response-body">{{ tryFormatJson(fetchTestResult.response.body) }}</pre>
                </template>
            </div>
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

// Fetch Tester
.fetch-tester-section
    background: rgba(255, 255, 255, 0.03)
    backdrop-filter: blur(12px)
    border: 1px solid rgba(255, 255, 255, 0.06)
    border-radius: 16px
    padding: 20px
    margin-bottom: 32px

.fetch-input-row
    display: flex
    gap: 8px
    margin-bottom: 12px

    @media (max-width: 640px)
        flex-direction: column

.fetch-section-label
    display: flex
    align-items: center
    justify-content: space-between
    font-size: 12px
    font-weight: 500
    color: rgba(255, 255, 255, 0.45)
    text-transform: uppercase
    letter-spacing: 0.05em
    margin-bottom: 6px

.fetch-headers
    margin-bottom: 12px

.fetch-header-row
    display: flex
    gap: 6px
    margin-bottom: 4px
    align-items: center

    .n-input
        flex: 1

.fetch-body
    margin-bottom: 12px

// Result
.fetch-result
    margin-top: 16px
    border-top: 1px solid rgba(255, 255, 255, 0.06)
    padding-top: 16px

.fetch-result-summary
    display: flex
    align-items: center
    gap: 10px
    margin-bottom: 12px
    flex-wrap: wrap

.fetch-latency
    font-size: 12px
    font-weight: 600
    font-family: 'SF Mono', 'Fira Code', monospace
    color: rgba(255, 255, 255, 0.5)

.fetch-result-method
    font-size: 12px
    font-family: 'SF Mono', 'Fira Code', monospace
    color: rgba(255, 255, 255, 0.35)
    word-break: break-all

.fetch-error-box
    background: rgba(239, 68, 68, 0.08)
    border: 1px solid rgba(239, 68, 68, 0.15)
    border-radius: 8px
    padding: 12px 14px
    margin-bottom: 12px

.fetch-error-code
    font-size: 12px
    font-weight: 600
    font-family: 'SF Mono', 'Fira Code', monospace
    color: #f87171
    margin-bottom: 4px

.fetch-error-message
    font-size: 13px
    color: #fca5a5
    word-break: break-word
    line-height: 1.5

.fetch-response-collapse
    margin-bottom: 8px

.details-count
    font-size: 11px
    color: rgba(255, 255, 255, 0.35)
    font-family: 'SF Mono', 'Fira Code', monospace

.fetch-headers-table
    display: flex
    flex-direction: column
    gap: 2px

.fetch-kv-row
    display: grid
    grid-template-columns: 200px 1fr
    gap: 12px
    padding: 4px 8px
    border-radius: 4px
    font-size: 12px

    &:nth-child(odd)
        background: rgba(255, 255, 255, 0.02)

    @media (max-width: 640px)
        grid-template-columns: 1fr
        gap: 2px

.fetch-kv-key
    font-family: 'SF Mono', 'Fira Code', monospace
    color: rgba(255, 255, 255, 0.5)
    font-weight: 500

.fetch-kv-value
    font-family: 'SF Mono', 'Fira Code', monospace
    color: rgba(255, 255, 255, 0.75)
    word-break: break-all

.fetch-response-body
    font-size: 12px
    font-family: 'SF Mono', 'Fira Code', monospace
    color: rgba(255, 255, 255, 0.7)
    background: rgba(0, 0, 0, 0.35)
    padding: 12px 14px
    border-radius: 8px
    margin: 0
    overflow-x: auto
    white-space: pre-wrap
    word-break: break-word
    line-height: 1.5
    max-height: 500px
    overflow-y: auto

:deep(.fetch-response-collapse .n-collapse-item__header)
    padding: 6px 0 !important

:deep(.fetch-response-collapse .n-collapse-item__header-main)
    font-size: 12px !important
    color: rgba(255, 255, 255, 0.5) !important

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
