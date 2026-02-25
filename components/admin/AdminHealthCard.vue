<script setup lang="ts">
import {
    LucideRefreshCw as RefreshIcon,
    LucideChevronDown as ChevronDownIcon,
} from 'lucide-vue-next'
import type { HealthCheck } from '~/composables/useAdminHealth'

interface Props {
    check: HealthCheck
    loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
    loading: false,
})

const emit = defineEmits<{
    (e: 'recheck'): void
}>()

const metadataExpanded = ref<string[]>(
    props.check.status === 'fail' ? ['metadata'] : []
)

// Display name mapping
const displayNameMap: Record<string, string> = {
    database: 'Database',
    steam_api: 'Steam API',
    steam_client: 'Steam Client',
    steam_service: 'Steam Service',
    environment: 'Environment',
    image_proxy: 'Image Proxy',
}

const displayName = computed(() => displayNameMap[props.check.name] || props.check.name)

const statusIcon = computed(() => {
    if (props.check.status === 'ok') return '\u2713'
    if (props.check.status === 'degraded') return '\u26A0'
    return '\u2717'
})

const statusLabel = computed(() => {
    if (props.check.status === 'ok') return 'Operational'
    if (props.check.status === 'degraded') return 'Degraded'
    return 'Failed'
})

const statusTagType = computed(() => {
    if (props.check.status === 'ok') return 'success'
    if (props.check.status === 'degraded') return 'warning'
    return 'error'
})

const statusBorderColor = computed(() => {
    if (props.check.status === 'ok') return '#10b981'
    if (props.check.status === 'degraded') return '#f59e0b'
    return '#ef4444'
})

// Uptime percentage from metadata
const uptimePercentage = computed(() => {
    const meta = props.check.metadata
    if (meta && typeof meta.uptime_percentage === 'number') {
        return Math.round(meta.uptime_percentage * 100) / 100
    }
    if (props.check.status === 'ok') return 100
    if (props.check.status === 'degraded') return 50
    return 0
})

const uptimeColor = computed(() => {
    if (uptimePercentage.value >= 99) return '#10b981'
    if (uptimePercentage.value >= 90) return '#f59e0b'
    return '#ef4444'
})

// Metadata entries for display
const metadataEntries = computed(() => {
    if (!props.check.metadata) return []
    return Object.entries(props.check.metadata).map(([key, value]) => ({
        key,
        value,
        isObject: value !== null && typeof value === 'object',
        isError: key === 'error' || key === 'error_code' || key === 'missing_required',
        isArray: Array.isArray(value),
    }))
})

const hasMetadata = computed(() => metadataEntries.value.length > 0)

function formatValue(value: unknown): string {
    if (value === null || value === undefined) return 'null'
    if (typeof value === 'boolean') return value ? 'true' : 'false'
    if (typeof value === 'number') return String(value)
    if (typeof value === 'string') return value
    return JSON.stringify(value, null, 2)
}
</script>

<template>
    <div class="health-card" :style="{ borderLeftColor: statusBorderColor }">
        <!-- Header -->
        <div class="health-card-header">
            <div class="health-card-title-section">
                <span class="status-icon" :class="`status-icon--${check.status}`">{{ statusIcon }}</span>
                <h3 class="health-card-name">{{ displayName }}</h3>
                <NTag :type="statusTagType" size="small" round>
                    {{ statusLabel }}
                </NTag>
            </div>
            <div class="health-card-actions">
                <span v-if="check.latency_ms !== undefined" class="latency-badge">
                    {{ check.latency_ms }}ms
                </span>
                <NButton
                    quaternary
                    circle
                    size="small"
                    :loading="loading"
                    @click="emit('recheck')"
                >
                    <template #icon>
                        <NIcon :component="RefreshIcon" :size="14" />
                    </template>
                </NButton>
            </div>
        </div>

        <!-- Uptime bar -->
        <div class="health-card-uptime">
            <div class="uptime-labels">
                <span class="uptime-label">Uptime (1h)</span>
                <span class="uptime-value">{{ uptimePercentage.toFixed(1) }}%</span>
            </div>
            <NProgress
                type="line"
                :percentage="uptimePercentage"
                :show-indicator="false"
                :color="uptimeColor"
                rail-color="rgba(255, 255, 255, 0.05)"
                :height="6"
                :border-radius="3"
            />
        </div>

        <!-- Message -->
        <div v-if="check.message" class="health-card-message" :class="{ 'health-card-message--error': check.status === 'fail' }">
            {{ check.message }}
        </div>

        <!-- Metadata Details (collapsible) -->
        <div v-if="hasMetadata" class="health-card-details">
            <NCollapse v-model:expanded-names="metadataExpanded" arrow-placement="left">
                <NCollapseItem title="Details" name="metadata">
                    <template #header-extra>
                        <span class="details-count">{{ metadataEntries.length }} fields</span>
                    </template>
                    <div class="metadata-table">
                        <div
                            v-for="entry in metadataEntries"
                            :key="entry.key"
                            class="metadata-row"
                            :class="{ 'metadata-row--error': entry.isError }"
                        >
                            <span class="metadata-key">{{ entry.key }}</span>
                            <div class="metadata-value">
                                <!-- Array values (like missing_vars) -->
                                <template v-if="entry.isArray && Array.isArray(entry.value)">
                                    <div v-if="(entry.value as unknown[]).length === 0" class="metadata-empty">
                                        (empty)
                                    </div>
                                    <div v-else class="metadata-tags">
                                        <NTag
                                            v-for="(item, i) in (entry.value as unknown[])"
                                            :key="i"
                                            size="tiny"
                                            :type="entry.isError ? 'error' : 'default'"
                                            round
                                        >
                                            {{ String(item) }}
                                        </NTag>
                                    </div>
                                </template>

                                <!-- Object values (like error, checks) -->
                                <template v-else-if="entry.isObject && !entry.isArray">
                                    <pre class="metadata-json">{{ formatValue(entry.value) }}</pre>
                                </template>

                                <!-- Boolean values -->
                                <template v-else-if="typeof entry.value === 'boolean'">
                                    <NTag :type="entry.value ? 'success' : 'error'" size="tiny" round>
                                        {{ entry.value }}
                                    </NTag>
                                </template>

                                <!-- Scalar values -->
                                <template v-else>
                                    <span class="metadata-scalar" :class="{ 'metadata-scalar--error': entry.isError && entry.value }">
                                        {{ formatValue(entry.value) }}
                                    </span>
                                </template>
                            </div>
                        </div>
                    </div>
                </NCollapseItem>
            </NCollapse>
        </div>
    </div>
</template>

<style scoped lang="sass">
.health-card
    background: rgba(255, 255, 255, 0.04)
    backdrop-filter: blur(16px) saturate(160%)
    border: 1px solid rgba(255, 255, 255, 0.08)
    border-left: 4px solid #6b7280
    border-radius: 16px
    padding: 20px
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1)

    &:hover
        border-color: rgba(255, 255, 255, 0.12)
        border-left-width: 4px
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2)

.health-card-header
    display: flex
    align-items: center
    justify-content: space-between
    gap: 12px
    margin-bottom: 12px

.health-card-title-section
    display: flex
    align-items: center
    gap: 10px
    min-width: 0

.status-icon
    font-size: 20px
    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))

    &--ok
        color: #10b981

    &--degraded
        color: #f59e0b

    &--fail
        color: #ef4444

.health-card-name
    font-size: 16px
    font-weight: 600
    color: rgba(255, 255, 255, 0.95)
    margin: 0
    white-space: nowrap

.health-card-actions
    display: flex
    align-items: center
    gap: 8px
    flex-shrink: 0

.latency-badge
    font-size: 12px
    font-weight: 600
    font-family: 'SF Mono', 'Fira Code', monospace
    color: rgba(255, 255, 255, 0.7)
    background: rgba(255, 255, 255, 0.06)
    padding: 3px 8px
    border-radius: 6px

.health-card-uptime
    margin-bottom: 12px

.uptime-labels
    display: flex
    justify-content: space-between
    margin-bottom: 4px

.uptime-label
    font-size: 12px
    color: rgba(255, 255, 255, 0.45)

.uptime-value
    font-size: 12px
    font-weight: 600
    font-family: 'SF Mono', 'Fira Code', monospace
    color: rgba(255, 255, 255, 0.7)

.health-card-message
    font-size: 13px
    color: rgba(255, 255, 255, 0.65)
    margin-bottom: 12px
    line-height: 1.5
    word-break: break-word

    &--error
        color: #fca5a5
        background: rgba(239, 68, 68, 0.08)
        padding: 8px 12px
        border-radius: 8px
        border: 1px solid rgba(239, 68, 68, 0.15)

.health-card-details
    border-top: 1px solid rgba(255, 255, 255, 0.06)
    padding-top: 8px

.details-count
    font-size: 11px
    color: rgba(255, 255, 255, 0.35)
    font-family: 'SF Mono', 'Fira Code', monospace

// Metadata table
.metadata-table
    display: flex
    flex-direction: column
    gap: 6px

.metadata-row
    display: grid
    grid-template-columns: 180px 1fr
    gap: 12px
    padding: 6px 8px
    border-radius: 6px
    background: rgba(255, 255, 255, 0.02)
    align-items: start

    &--error
        background: rgba(239, 68, 68, 0.06)

    @media (max-width: 640px)
        grid-template-columns: 1fr
        gap: 4px

.metadata-key
    font-size: 12px
    font-weight: 500
    color: rgba(255, 255, 255, 0.5)
    font-family: 'SF Mono', 'Fira Code', monospace
    word-break: break-all

.metadata-value
    font-size: 12px
    color: rgba(255, 255, 255, 0.8)
    min-width: 0

.metadata-tags
    display: flex
    flex-wrap: wrap
    gap: 4px

.metadata-json
    font-size: 11px
    font-family: 'SF Mono', 'Fira Code', monospace
    color: rgba(255, 255, 255, 0.7)
    background: rgba(0, 0, 0, 0.3)
    padding: 8px 10px
    border-radius: 6px
    margin: 0
    overflow-x: auto
    white-space: pre-wrap
    word-break: break-word
    line-height: 1.5

.metadata-scalar
    font-family: 'SF Mono', 'Fira Code', monospace
    word-break: break-all

    &--error
        color: #fca5a5

.metadata-empty
    font-style: italic
    color: rgba(255, 255, 255, 0.3)

// Override NCollapse styles for dark theme
:deep(.n-collapse-item__header)
    padding: 8px 0 !important

:deep(.n-collapse-item__header-main)
    font-size: 13px !important
    font-weight: 500
    color: rgba(255, 255, 255, 0.6) !important

:deep(.n-collapse-item__content-inner)
    padding-top: 8px !important
</style>
