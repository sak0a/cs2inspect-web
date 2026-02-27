<script setup lang="ts">
import {
  LucideSettings as SettingsIcon,
  LucideActivity as ActivityLogIcon,
  LucideShield as UserManagementIcon,
  LucideRefreshCw as RefreshIcon
} from 'lucide-vue-next'
import { useAdminStats, type TimeRange } from '~/composables/useAdminStats'
import type { AdminActivityData, AdminHeatmapData, AdminTopUser } from '~/types'

// Page meta
definePageMeta({
  middleware: 'admin',
  layout: 'admin'
})

// Composable for admin stats
const {
  overviewStats,
  activityData,
  topUsers,
  isLoadingStats,
  isLoadingActivity,
  isLoading,
  setTimeRange,
  refreshAll
} = useAdminStats({
  fetchOnMount: true,
  defaultTimeRange: '30d'
})

// Transform activity data for the chart component
const activityChartData = computed(() => {
  if (!activityData.value) return []
  // If it's an array, return as is; otherwise wrap in array
  return Array.isArray(activityData.value)
    ? activityData.value
    : [activityData.value]
})

// Transform data for item distribution pie chart
const itemDistributionData = computed(() => {
  if (!overviewStats.value?.totalItems) {
    return {
      weapons: 0,
      knives: 0,
      gloves: 0,
      agents: 0,
      musicKits: 0,
      pins: 0
    }
  }
  return overviewStats.value.totalItems
})

// Transform heatmap data (derived from activity data)
const heatmapData = computed<AdminHeatmapData[]>(() => {
  if (!activityData.value) return []
  const data = Array.isArray(activityData.value) ? activityData.value : [activityData.value]
  return data.map((item: AdminActivityData) => ({
    date: item.date,
    value: item.activeUsers + item.loadoutsCreated + item.itemsSaved
  }))
})

// Transform top users for leaderboard
const leaderboardData = computed<AdminTopUser[]>(() => {
  if (!topUsers.value) return []
  return topUsers.value.map(user => ({
    steamId: user.steamId,
    loadoutCount: user.loadoutCount,
    totalItems: user.totalItems
  }))
})

// Calculate total items
const totalItems = computed(() => {
  if (!overviewStats.value?.totalItems) return 0
  const items = overviewStats.value.totalItems
  return items.weapons + items.knives + items.gloves + items.agents + items.musicKits + items.pins
})

// Stats cards configuration
const statsCards = computed(() => [
  {
    title: 'Total Users',
    value: overviewStats.value?.totalUsers ?? 0,
    icon: 'users',
    trend: undefined
  },
  {
    title: 'Active Users (7d)',
    value: overviewStats.value?.activeUsers7d ?? 0,
    icon: 'activity',
    trend: undefined
  },
  {
    title: 'Total Loadouts',
    value: overviewStats.value?.totalLoadouts ?? 0,
    icon: 'package',
    trend: undefined
  },
  {
    title: 'Total Items',
    value: totalItems.value,
    icon: 'sword',
    trend: undefined
  }
])

// Quick actions configuration
const quickActions = [
  {
    title: 'User Management',
    description: 'View and manage all users',
    icon: UserManagementIcon,
    path: '/admin/users',
    color: 'blue'
  },
  {
    title: 'Settings',
    description: 'Configure application settings',
    icon: SettingsIcon,
    path: '/admin/settings',
    color: 'amber'
  },
  {
    title: 'Activity Log',
    description: 'View admin activity history',
    icon: ActivityLogIcon,
    path: '/admin/activity',
    color: 'emerald'
  }
]

// Handle time range change from chart
const handleRangeChange = async (range: string) => {
  await setTimeRange(range as TimeRange)
}

// Handle refresh
const handleRefresh = async () => {
  await refreshAll(true)
}
</script>

<template>
  <div class="dashboard-container">
      <!-- Header with Refresh Button -->
      <div class="flex items-center justify-between mb-6">
        <div>
          <h2 class="text-xl font-semibold text-white">Overview</h2>
          <p class="text-sm text-white/50 mt-1">Monitor your application statistics</p>
        </div>
        <NButton
          quaternary
          circle
          :loading="isLoading"
          @click="handleRefresh"
        >
          <template #icon>
            <NIcon :component="RefreshIcon" />
          </template>
        </NButton>
      </div>

      <!-- Stats Cards Grid -->
      <div class="stats-grid mb-8">
        <AdminStatsCard
          v-for="(stat, index) in statsCards"
          :key="index"
          :title="stat.title"
          :value="stat.value"
          :icon="stat.icon"
          :trend="stat.trend"
          :loading="isLoadingStats"
        />
      </div>

      <!-- Charts Row 1: Activity Timeline & Item Distribution -->
      <div class="charts-row mb-8">
        <!-- Activity Timeline Chart -->
        <div class="chart-card chart-card--wide">
          <AdminActivityChart
            :data="activityChartData"
            :loading="isLoadingActivity"
            @range-change="handleRangeChange"
          />
        </div>

        <!-- Item Distribution Pie Chart -->
        <div class="chart-card">
          <AdminPieChart
            :data="itemDistributionData"
            :loading="isLoadingStats"
          />
        </div>
      </div>

      <!-- Charts Row 2: Heatmap & Leaderboard -->
      <div class="charts-row mb-8">
        <!-- User Activity Heatmap -->
        <div class="chart-card">
          <AdminHeatmapChart
            :data="heatmapData"
            :loading="isLoadingActivity"
          />
        </div>

        <!-- Top Users Leaderboard -->
        <div class="chart-card">
          <AdminLeaderboardChart
            :data="leaderboardData"
            :loading="isLoadingStats"
          />
        </div>
      </div>

      <!-- Quick Actions Section -->
      <div class="quick-actions-section">
        <h3 class="text-lg font-semibold text-white/90 mb-4">Quick Actions</h3>
        <div class="quick-actions-grid">
          <NuxtLink
            v-for="action in quickActions"
            :key="action.path"
            :to="action.path"
            class="quick-action-card"
            :class="`quick-action-card--${action.color}`"
          >
            <div class="quick-action-icon">
              <NIcon :component="action.icon" :size="24" />
            </div>
            <div class="quick-action-content">
              <h4 class="quick-action-title">{{ action.title }}</h4>
              <p class="quick-action-description">{{ action.description }}</p>
            </div>
            <div class="quick-action-arrow">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </div>
          </NuxtLink>
        </div>
      </div>
  </div>
</template>

<style scoped lang="sass">
.dashboard-container
  max-width: 1600px
  margin: 0 auto

// Stats Grid - 4 columns on desktop
.stats-grid
  display: grid
  grid-template-columns: repeat(1, 1fr)
  gap: 16px

  @media (min-width: 640px)
    grid-template-columns: repeat(2, 1fr)

  @media (min-width: 1024px)
    grid-template-columns: repeat(4, 1fr)

// Charts Row
.charts-row
  display: grid
  grid-template-columns: 1fr
  gap: 24px

  @media (min-width: 1024px)
    grid-template-columns: 1fr 1fr

  // Wide chart takes more space
  &:first-of-type
    @media (min-width: 1024px)
      grid-template-columns: 2fr 1fr

// Chart Card with glassmorphism
.chart-card
  background: var(--admin-glass-bg)
  backdrop-filter: var(--admin-glass-blur)
  -webkit-backdrop-filter: var(--admin-glass-blur)
  border: 1px solid var(--admin-glass-border)
  border-radius: 16px
  padding: 20px
  overflow: hidden
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1)
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.15), var(--admin-glass-inset)

  &:hover
    border-color: var(--admin-glass-border-hover)
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.06)

  @media (max-width: 640px)
    padding: 16px

// Quick Actions Section
.quick-actions-section
  margin-top: 8px

.quick-actions-grid
  display: grid
  grid-template-columns: 1fr
  gap: 16px

  @media (min-width: 640px)
    grid-template-columns: repeat(2, 1fr)

  @media (min-width: 1024px)
    grid-template-columns: repeat(3, 1fr)

// Quick Action Card
.quick-action-card
  display: flex
  align-items: center
  gap: 16px
  padding: 20px
  background: var(--admin-glass-bg)
  backdrop-filter: var(--admin-glass-blur)
  -webkit-backdrop-filter: var(--admin-glass-blur)
  border: 1px solid var(--admin-glass-border)
  border-radius: 16px
  text-decoration: none
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1)
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.15), var(--admin-glass-inset)

  &:hover
    transform: translateY(-2px)
    border-color: var(--admin-glass-border-hover)
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.06)

    .quick-action-arrow
      transform: translateX(4px)
      opacity: 1

.quick-action-icon
  display: flex
  align-items: center
  justify-content: center
  width: 48px
  height: 48px
  border-radius: 12px
  flex-shrink: 0

.quick-action-card--blue
  .quick-action-icon
    background: linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(59, 130, 246, 0.1))
    color: #3b82f6

  &:hover
    border-color: rgba(59, 130, 246, 0.3)

.quick-action-card--amber
  .quick-action-icon
    background: linear-gradient(135deg, rgba(245, 158, 11, 0.2), rgba(245, 158, 11, 0.1))
    color: #f59e0b

  &:hover
    border-color: rgba(245, 158, 11, 0.3)

.quick-action-card--emerald
  .quick-action-icon
    background: linear-gradient(135deg, rgba(var(--admin-accent-rgb), 0.2), rgba(var(--admin-accent-rgb), 0.1))
    color: var(--admin-accent)

  &:hover
    border-color: rgba(var(--admin-accent-rgb), 0.3)

.quick-action-content
  flex: 1
  min-width: 0

.quick-action-title
  font-size: 16px
  font-weight: 600
  color: rgba(255, 255, 255, 0.95)
  margin-bottom: 4px

.quick-action-description
  font-size: 13px
  color: rgba(255, 255, 255, 0.5)
  margin: 0

.quick-action-arrow
  color: rgba(255, 255, 255, 0.4)
  transition: all 0.3s ease
  opacity: 0.5
  flex-shrink: 0
</style>
