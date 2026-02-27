<script setup lang="ts">
import {
  LucideTrendingUp as TrendingUpIcon,
  LucideTrendingDown as TrendingDownIcon,
  LucideUsers as UsersIcon,
  LucidePackage as PackageIcon,
  LucideSword as SwordIcon,
  LucideActivity as ActivityIcon,
  LucideShield as ShieldIcon,
  LucideBan as BanIcon,
  LucideDatabase as DatabaseIcon,
  LucideCalendar as CalendarIcon
} from 'lucide-vue-next'
import type { Component } from 'vue'

// Props
interface Props {
  /** Title of the stat card */
  title: string
  /** Value to display (number or formatted string) */
  value: number | string
  /** Icon name to display */
  icon: string
  /** Optional trend indicator */
  trend?: {
    value: number
    label: string
  }
  /** Loading state */
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  trend: undefined,
  loading: false
})

// Icon mapping
const iconMap: Record<string, Component> = {
  users: UsersIcon,
  package: PackageIcon,
  sword: SwordIcon,
  activity: ActivityIcon,
  shield: ShieldIcon,
  ban: BanIcon,
  database: DatabaseIcon,
  calendar: CalendarIcon,
  'trending-up': TrendingUpIcon,
  'trending-down': TrendingDownIcon
}

// Get the icon component
const iconComponent = computed(() => {
  return iconMap[props.icon] || PackageIcon
})

const trendIcon = computed(() => {
  if (!props.trend) return undefined
  return props.trend.value >= 0 ? TrendingUpIcon : TrendingDownIcon
})

const trendClass = computed(() => {
  if (!props.trend) return ''
  return props.trend.value >= 0 ? 'trend-up' : 'trend-down'
})

// Format value for display
const displayValue = computed(() => {
  if (typeof props.value === 'number') {
    return new Intl.NumberFormat().format(props.value)
  }
  return props.value
})
</script>

<template>
  <NCard
    :bordered="false"
    class="admin-stats-card"
  >
    <!-- Loading State -->
    <template v-if="loading">
      <div class="stats-loading">
        <NSkeleton :width="120" :height="16" :sharp="false" />
        <NSkeleton :width="80" :height="32" :sharp="false" class="mt-3" />
        <NSkeleton :width="100" :height="14" :sharp="false" class="mt-2" />
      </div>
    </template>

    <!-- Content -->
    <template v-else>
      <NSpace vertical :size="12">
        <!-- Header with Icon and Title -->
        <NSpace align="center" justify="space-between">
          <span class="stats-title">{{ title }}</span>
          <div class="stats-icon-wrapper">
            <NIcon :component="iconComponent" :size="20" />
          </div>
        </NSpace>

        <!-- Value -->
        <div class="stats-value">{{ displayValue }}</div>

        <!-- Trend Indicator -->
        <div
          v-if="trend"
          class="stats-trend"
          :class="trendClass"
        >
          <NIcon :component="trendIcon" :size="14" />
          <span class="trend-value">{{ Math.abs(trend.value) }}%</span>
          <span class="trend-label">{{ trend.label }}</span>
        </div>
      </NSpace>
    </template>
  </NCard>
</template>

<style scoped lang="sass">
.admin-stats-card
  backdrop-filter: var(--admin-glass-blur) saturate(160%)
  -webkit-backdrop-filter: var(--admin-glass-blur) saturate(160%)
  background: var(--admin-glass-bg) !important
  border: 1px solid var(--admin-glass-border)
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.2), var(--admin-glass-inset)
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1)
  border-radius: 16px !important

  &:hover
    transform: translateY(-2px)
    border-color: var(--admin-glass-border-hover)
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.06)

.stats-loading
  padding: 4px 0

.stats-title
  font-size: 14px
  font-weight: 500
  color: rgba(255, 255, 255, 0.6)
  text-transform: uppercase
  letter-spacing: 0.05em

.stats-icon-wrapper
  display: flex
  align-items: center
  justify-content: center
  width: 40px
  height: 40px
  border-radius: 10px
  background: linear-gradient(135deg, rgba(var(--admin-accent-rgb), 0.2), rgba(var(--admin-accent-rgb), 0.1))
  color: var(--admin-accent)

.stats-value
  font-size: 32px
  font-weight: 700
  color: rgba(255, 255, 255, 0.95)
  line-height: 1.2
  font-variant-numeric: tabular-nums

.stats-trend
  display: flex
  align-items: center
  gap: 6px
  font-size: 13px
  padding: 6px 10px
  border-radius: 8px
  width: fit-content

  &.trend-up
    background: rgba(var(--admin-accent-rgb), 0.18)
    color: var(--admin-accent)

    .trend-value
      font-weight: 600

  &.trend-down
    background: rgba(239, 68, 68, 0.15)
    color: #ef4444

    .trend-value
      font-weight: 600

.trend-label
  color: rgba(255, 255, 255, 0.5)
  margin-left: 2px
</style>
