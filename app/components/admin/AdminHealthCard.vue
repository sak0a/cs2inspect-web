<script setup lang="ts">
import { LucideRefreshCw as RefreshIcon, LucideChevronRight as ChevronRightIcon } from '@lucide/vue'
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

const metadataExpanded = ref<string[]>(props.check.status === 'fail' ? ['metadata'] : [])

const isMetadataOpen = computed(() => metadataExpanded.value.includes('metadata'))

function handleMetadataToggle(open: boolean) {
  metadataExpanded.value = open ? ['metadata'] : []
}

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
  if (props.check.status === 'ok') return '✓'
  if (props.check.status === 'degraded') return '⚠'
  return '✗'
})

const statusLabel = computed(() => {
  if (props.check.status === 'ok') return 'Operational'
  if (props.check.status === 'degraded') return 'Degraded'
  return 'Failed'
})

// Pill (tag) recipes for the old success/warning/error/default tag types
const badgeTypeClasses = {
  success: 'border-emerald-500/30 bg-emerald-500/15 text-emerald-400',
  warning: 'border-amber-500/30 bg-amber-500/15 text-amber-400',
  error: 'border-red-500/30 bg-red-500/15 text-red-400',
  default: 'border-white/10 bg-white/5 text-gray-300',
} as const

const statusBadgeClass = computed(() => {
  if (props.check.status === 'ok') return badgeTypeClasses.success
  if (props.check.status === 'degraded') return badgeTypeClasses.warning
  return badgeTypeClasses.error
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
        <Badge variant="outline" :class="statusBadgeClass">
          {{ statusLabel }}
        </Badge>
      </div>
      <div class="health-card-actions">
        <span v-if="check.latency_ms !== undefined" class="latency-badge">
          {{ check.latency_ms }}ms
        </span>
        <Button variant="ghost" size="icon-sm" :loading="loading" @click="emit('recheck')">
          <template #icon-left>
            <RefreshIcon :size="14" />
          </template>
        </Button>
      </div>
    </div>

    <!-- Uptime bar -->
    <div class="health-card-uptime">
      <div class="uptime-labels">
        <span class="uptime-label">Uptime (1h)</span>
        <span class="uptime-value">{{ uptimePercentage.toFixed(1) }}%</span>
      </div>
      <div class="uptime-track">
        <div
          class="uptime-fill"
          :style="{
            width: `${Math.min(Math.max(uptimePercentage, 0), 100)}%`,
            backgroundColor: uptimeColor,
          }"
        />
      </div>
    </div>

    <!-- Message -->
    <div
      v-if="check.message"
      class="health-card-message"
      :class="{ 'health-card-message--error': check.status === 'fail' }"
    >
      {{ check.message }}
    </div>

    <!-- Metadata Details (collapsible) -->
    <div v-if="hasMetadata" class="health-card-details">
      <Collapsible :open="isMetadataOpen" @update:open="handleMetadataToggle">
        <CollapsibleTrigger class="details-header">
          <ChevronRightIcon
            :size="14"
            class="shrink-0 transition-transform duration-200"
            :class="{ 'rotate-90': isMetadataOpen }"
          />
          <span>Details</span>
          <span class="details-count">{{ metadataEntries.length }} fields</span>
        </CollapsibleTrigger>
        <CollapsibleContent>
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
                    <Badge
                      v-for="(item, i) in entry.value as unknown[]"
                      :key="i"
                      variant="outline"
                      class="px-1.5 py-0 text-[10px]"
                      :class="entry.isError ? badgeTypeClasses.error : badgeTypeClasses.default"
                    >
                      {{ String(item) }}
                    </Badge>
                  </div>
                </template>

                <!-- Object values (like error, checks) -->
                <template v-else-if="entry.isObject && !entry.isArray">
                  <pre class="metadata-json">{{ formatValue(entry.value) }}</pre>
                </template>

                <!-- Boolean values -->
                <template v-else-if="typeof entry.value === 'boolean'">
                  <Badge
                    variant="outline"
                    class="px-1.5 py-0 text-[10px]"
                    :class="entry.value ? badgeTypeClasses.success : badgeTypeClasses.error"
                  >
                    {{ entry.value }}
                  </Badge>
                </template>

                <!-- Scalar values -->
                <template v-else>
                  <span
                    class="metadata-scalar"
                    :class="{
                      'metadata-scalar--error': entry.isError && entry.value,
                    }"
                  >
                    {{ formatValue(entry.value) }}
                  </span>
                </template>
              </div>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  </div>
</template>

<style scoped lang="sass">
.health-card
    background: var(--admin-glass-bg)
    backdrop-filter: var(--admin-glass-blur) saturate(160%)
    -webkit-backdrop-filter: var(--admin-glass-blur) saturate(160%)
    border: 1px solid var(--admin-glass-border)
    border-left: 4px solid #6b7280
    border-radius: 16px
    padding: 20px
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1)
    box-shadow: 0 4px 24px rgba(0, 0, 0, 0.15), var(--admin-glass-inset)

    &:hover
        border-color: var(--admin-glass-border-hover)
        border-left-width: 4px
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.06)

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

// Thin uptime progress bar (replacement for the old line progress)
.uptime-track
    height: 6px
    border-radius: 3px
    background: rgba(255, 255, 255, 0.05)
    overflow: hidden

.uptime-fill
    height: 100%
    border-radius: 3px
    transition: width 0.3s ease, background-color 0.3s ease

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

// Collapsible header (port of the old collapse-item header overrides)
.details-header
    display: flex
    align-items: center
    gap: 8px
    width: 100%
    padding: 8px 0
    background: transparent
    border: none
    text-align: left
    font-size: 13px
    font-weight: 500
    color: rgba(255, 255, 255, 0.6)

    &:hover
        color: rgba(255, 255, 255, 0.8)

.details-count
    margin-left: auto
    font-size: 11px
    color: rgba(255, 255, 255, 0.35)
    font-family: 'SF Mono', 'Fira Code', monospace

// Metadata table (port of the old collapse content-inner padding)
.metadata-table
    display: flex
    flex-direction: column
    gap: 6px
    padding-top: 8px

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
</style>
