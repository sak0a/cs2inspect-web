<script setup lang="ts">
import {
  LucideEye as ViewIcon,
  LucideBan as BanIcon,
  LucideShieldCheck as UnbanIcon,
  LucideTrash2 as DeleteIcon,
  LucidePackage as PackageIcon,
  LucideSword as SwordIcon,
  LucideCalendar as CalendarIcon,
  LucideAlertCircle as AlertIcon
} from 'lucide-vue-next'
import type { AdminUserDetails } from '~/types'

// Props
interface Props {
  /** User details to display */
  user: AdminUserDetails
}

const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
  /** Emitted when view details button is clicked */
  'view-details': [user: AdminUserDetails]
  /** Emitted when ban button is clicked */
  'ban': [user: AdminUserDetails]
  /** Emitted when unban button is clicked */
  'unban': [user: AdminUserDetails]
  /** Emitted when delete button is clicked */
  'delete': [user: AdminUserDetails]
}>()

// Computed properties
const totalItems = computed(() => {
  const counts = props.user.itemCounts
  return counts.weapons + counts.knives + counts.gloves + counts.agents + counts.musicKits + counts.pins
})

// Format date
function formatDate(isoDate: string): string {
  const date = new Date(isoDate)
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
}

// Format relative time
function formatRelativeTime(isoDate: string): string {
  const date = new Date(isoDate)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) {
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    if (diffHours === 0) {
      const diffMins = Math.floor(diffMs / (1000 * 60))
      return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`
    }
    return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`
  }
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays} days ago`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) !== 1 ? 's' : ''} ago`
  return formatDate(isoDate)
}

// Event handlers
function handleViewDetails() {
  emit('view-details', props.user)
}

function handleBan() {
  emit('ban', props.user)
}

function handleUnban() {
  emit('unban', props.user)
}

function handleDelete() {
  emit('delete', props.user)
}
</script>

<template>
  <NCard
    :bordered="false"
    class="admin-user-card"
    :class="{ 'admin-user-card--banned': user.isBanned }"
  >
    <NSpace vertical :size="16">
      <!-- Header: Steam ID and Status -->
      <NSpace align="center" justify="space-between">
        <NSpace align="center" :size="12">
          <div class="user-avatar">
            {{ user.steamId.slice(-2).toUpperCase() }}
          </div>
          <NSpace vertical :size="2">
            <span class="user-steam-id font-mono">{{ user.steamId }}</span>
            <NTag
              :type="user.isBanned ? 'error' : 'success'"
              size="small"
              round
            >
              {{ user.isBanned ? 'Banned' : 'Active' }}
            </NTag>
          </NSpace>
        </NSpace>
      </NSpace>

      <!-- Ban Info (if banned) -->
      <div v-if="user.isBanned && user.banInfo" class="ban-info">
        <NSpace align="center" :size="8">
          <NIcon :component="AlertIcon" :size="16" color="#ef4444" />
          <span class="text-sm">
            Banned {{ formatRelativeTime(user.banInfo.bannedAt) }}
            <template v-if="user.banInfo.reason">
              - {{ user.banInfo.reason }}
            </template>
          </span>
        </NSpace>
        <span v-if="user.banInfo.expiresAt" class="text-xs opacity-60">
          Expires: {{ formatDate(user.banInfo.expiresAt) }}
        </span>
        <span v-else class="text-xs opacity-60">
          Permanent ban
        </span>
      </div>

      <!-- Stats Grid -->
      <div class="stats-grid">
        <div class="stat-item">
          <NIcon :component="PackageIcon" :size="16" />
          <span class="stat-value">{{ user.loadoutCount }}</span>
          <span class="stat-label">Loadouts</span>
        </div>
        <div class="stat-item">
          <NIcon :component="SwordIcon" :size="16" />
          <span class="stat-value">{{ totalItems }}</span>
          <span class="stat-label">Items</span>
        </div>
      </div>

      <!-- Item Breakdown -->
      <div class="item-breakdown">
        <NSpace :size="8" :wrap="true">
          <NTag size="small" :bordered="false">
            {{ user.itemCounts.weapons }} Weapons
          </NTag>
          <NTag size="small" :bordered="false">
            {{ user.itemCounts.knives }} Knives
          </NTag>
          <NTag size="small" :bordered="false">
            {{ user.itemCounts.gloves }} Gloves
          </NTag>
          <NTag size="small" :bordered="false">
            {{ user.itemCounts.agents }} Agents
          </NTag>
          <NTag size="small" :bordered="false">
            {{ user.itemCounts.musicKits }} Music Kits
          </NTag>
          <NTag size="small" :bordered="false">
            {{ user.itemCounts.pins }} Pins
          </NTag>
        </NSpace>
      </div>

      <!-- Activity Dates -->
      <NSpace vertical :size="4" class="activity-dates">
        <NSpace align="center" :size="8">
          <NIcon :component="CalendarIcon" :size="14" class="opacity-50" />
          <span class="text-sm opacity-70">
            First seen: {{ formatDate(user.firstActivity) }}
          </span>
        </NSpace>
        <NSpace align="center" :size="8">
          <NIcon :component="CalendarIcon" :size="14" class="opacity-50" />
          <span class="text-sm opacity-70">
            Last active: {{ formatRelativeTime(user.lastActivity) }}
          </span>
        </NSpace>
      </NSpace>

      <!-- Action Buttons -->
      <NSpace :size="8" class="action-buttons">
        <NButton
          secondary
          size="small"
          @click="handleViewDetails"
        >
          <template #icon>
            <NIcon :component="ViewIcon" />
          </template>
          View Details
        </NButton>

        <NButton
          v-if="user.isBanned"
          type="success"
          secondary
          size="small"
          @click="handleUnban"
        >
          <template #icon>
            <NIcon :component="UnbanIcon" />
          </template>
          Unban
        </NButton>

        <NButton
          v-else
          type="warning"
          secondary
          size="small"
          @click="handleBan"
        >
          <template #icon>
            <NIcon :component="BanIcon" />
          </template>
          Ban
        </NButton>

        <NButton
          type="error"
          secondary
          size="small"
          @click="handleDelete"
        >
          <template #icon>
            <NIcon :component="DeleteIcon" />
          </template>
          Delete
        </NButton>
      </NSpace>
    </NSpace>
  </NCard>
</template>

<style scoped lang="sass">
.admin-user-card
  backdrop-filter: blur(16px) saturate(160%)
  background: var(--glass-bg-secondary, rgba(30, 30, 30, 0.7)) !important
  border: 1px solid var(--glass-border, rgba(255, 255, 255, 0.08))
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.08)
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1)
  border-radius: 16px !important

  &:hover
    transform: translateY(-2px)
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.12)

  &--banned
    border-left: 4px solid #ef4444
    background: linear-gradient(135deg, rgba(239, 68, 68, 0.08), var(--glass-bg-secondary, rgba(30, 30, 30, 0.7))) !important

.user-avatar
  width: 44px
  height: 44px
  border-radius: 10px
  background: linear-gradient(135deg, rgba(var(--admin-accent-rgb), 0.3), rgba(var(--admin-accent-rgb), 0.1))
  display: flex
  align-items: center
  justify-content: center
  font-size: 14px
  font-weight: 700
  color: var(--admin-accent)
  text-transform: uppercase

.user-steam-id
  font-size: 13px
  color: rgba(255, 255, 255, 0.9)
  word-break: break-all

.ban-info
  padding: 12px
  border-radius: 10px
  background: rgba(239, 68, 68, 0.1)
  border: 1px solid rgba(239, 68, 68, 0.2)
  display: flex
  flex-direction: column
  gap: 4px

.stats-grid
  display: grid
  grid-template-columns: repeat(2, 1fr)
  gap: 12px

.stat-item
  display: flex
  align-items: center
  gap: 8px
  padding: 12px
  border-radius: 10px
  background: rgba(255, 255, 255, 0.04)
  color: rgba(255, 255, 255, 0.7)

  .stat-value
    font-size: 18px
    font-weight: 700
    color: rgba(255, 255, 255, 0.95)
    font-variant-numeric: tabular-nums

  .stat-label
    font-size: 12px
    opacity: 0.6

.item-breakdown
  padding: 12px
  border-radius: 10px
  background: rgba(255, 255, 255, 0.02)

.activity-dates
  padding-top: 8px
  border-top: 1px solid var(--glass-border, rgba(255, 255, 255, 0.08))

.action-buttons
  padding-top: 8px
  flex-wrap: wrap
</style>
