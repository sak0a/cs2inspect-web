<script setup lang="ts">
import {
  LucideBan as BanIcon,
  LucideShieldCheck as UnbanIcon,
  LucideTrash2 as DeleteIcon,
  LucideAlertCircle as AlertIcon
} from 'lucide-vue-next'
import type { AdminUserDetails } from '~/types'

// Props
interface Props {
  /** User details to display */
  user: AdminUserDetails
}

defineProps<Props>()

// Emits
const emit = defineEmits<{
  /** Emitted when ban button is clicked */
  'ban': [user: AdminUserDetails]
  /** Emitted when unban button is clicked */
  'unban': [user: AdminUserDetails]
  /** Emitted when delete button is clicked */
  'delete': [user: AdminUserDetails]
}>()

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
</script>

<template>
  <NCard
    :bordered="false"
    class="admin-user-card"
    :class="{ 'admin-user-card--banned': user.isBanned }"
  >
    <NSpace vertical :size="16">
      <!-- Header: Steam ID, Status, and Actions -->
      <div class="flex items-center justify-between flex-wrap gap-3">
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

        <!-- Action Buttons -->
        <NSpace :size="8">
          <NButton
            v-if="user.isBanned"
            type="success"
            secondary
            size="small"
            @click="emit('unban', user)"
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
            @click="emit('ban', user)"
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
            @click="emit('delete', user)"
          >
            <template #icon>
              <NIcon :component="DeleteIcon" />
            </template>
            Delete
          </NButton>
        </NSpace>
      </div>

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
</style>
