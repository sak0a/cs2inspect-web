<script setup lang="ts">
import {
  LucideShieldAlert as ShieldAlertIcon,
  LucideLogIn as LogInIcon,
  LucideHome as HomeIcon,
  LucideRefreshCw as RefreshIcon
} from 'lucide-vue-next'
import { steamAuth } from '~/services/steamAuth'

// Don't apply admin middleware to error page - use blank layout for full page
definePageMeta({
  layout: 'blank'
})

const route = useRoute()
const router = useRouter()

// Check if in development mode
const isDev = import.meta.dev

// Get current user's steamId from localStorage
const currentSteamId = ref<string | null>(null)
onMounted(() => {
  const savedUser = steamAuth.getSavedUser()
  currentSteamId.value = savedUser?.steamId ?? null
})

// Get error details from query params
const errorType = computed(() => route.query.error as string || 'unknown')
const redirectPath = computed(() => route.query.redirect as string || '/admin')

const errorInfo = computed(() => {
  switch (errorType.value) {
    case 'admin_required':
      return {
        title: 'Admin Access Required',
        message: 'You need administrator privileges to access this page.',
        details: 'Either you are not logged in, or your account does not have admin access.',
        showLogin: true,
        showRetry: true
      }
    case 'superadmin_required':
      return {
        title: 'Super Admin Access Required',
        message: 'This page requires super administrator privileges.',
        details: 'Your account has admin access, but this specific page requires super admin permissions.',
        showLogin: false,
        showRetry: false
      }
    case 'not_authenticated':
      return {
        title: 'Authentication Required',
        message: 'Please log in to access the admin panel.',
        details: 'You need to be signed in with Steam to access admin features.',
        showLogin: true,
        showRetry: false
      }
    default:
      return {
        title: 'Access Denied',
        message: 'You do not have permission to access this resource.',
        details: `Error type: ${errorType.value}`,
        showLogin: true,
        showRetry: true
      }
  }
})

function handleLogin() {
  // Redirect to Steam login with return URL
  window.location.href = `/api/auth/steam?returnTo=${encodeURIComponent(redirectPath.value)}`
}

function handleRetry() {
  router.push(redirectPath.value)
}

function handleGoHome() {
  router.push('/')
}
</script>

<template>
  <div class="admin-error-page">
    <div class="error-container">
      <div class="error-card">
        <!-- Icon -->
        <div class="icon-wrapper">
          <NIcon :component="ShieldAlertIcon" :size="48" color="#ef4444" />
        </div>

        <!-- Title -->
        <h1 class="error-title">
          {{ errorInfo.title }}
        </h1>

        <!-- Message -->
        <p class="error-message">
          {{ errorInfo.message }}
        </p>

        <!-- Details -->
        <div class="error-details">
          {{ errorInfo.details }}
        </div>

        <!-- Steam ID Info -->
        <div v-if="currentSteamId" class="steamid-info">
          <span class="steamid-label">Your Steam ID:</span>
          <code class="steamid-value">{{ currentSteamId }}</code>
        </div>
        <div v-else class="steamid-info steamid-none">
          <span class="steamid-label">Not logged in</span>
        </div>

        <!-- Debug Info (development only) -->
        <div v-if="isDev" class="debug-panel">
          <div class="debug-header">Debug Info</div>
          <div class="debug-row">
            <span class="debug-key">Error Type:</span>
            <span class="debug-value">{{ errorType }}</span>
          </div>
          <div class="debug-row">
            <span class="debug-key">Redirect Path:</span>
            <span class="debug-value">{{ redirectPath }}</span>
          </div>
          <div class="debug-row">
            <span class="debug-key">Steam ID:</span>
            <span class="debug-value">{{ currentSteamId || 'null' }}</span>
          </div>
          <div class="debug-row">
            <span class="debug-key">Full Query:</span>
            <span class="debug-value">{{ JSON.stringify(route.query) }}</span>
          </div>
        </div>

        <!-- Actions -->
        <div class="action-buttons">
          <NButton
            v-if="errorInfo.showLogin"
            type="primary"
            size="large"
            round
            @click="handleLogin"
          >
            <template #icon>
              <NIcon :component="LogInIcon" />
            </template>
            Sign in with Steam
          </NButton>

          <NButton
            v-if="errorInfo.showRetry"
            secondary
            size="large"
            round
            @click="handleRetry"
          >
            <template #icon>
              <NIcon :component="RefreshIcon" />
            </template>
            Try Again
          </NButton>

          <NButton
            quaternary
            size="large"
            round
            @click="handleGoHome"
          >
            <template #icon>
              <NIcon :component="HomeIcon" />
            </template>
            Go Home
          </NButton>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="sass">
.admin-error-page
  min-height: 100vh
  display: flex
  align-items: center
  justify-content: center
  padding: 24px
  background: #0a0a0a

.error-container
  width: 100%
  max-width: 480px

.error-card
  backdrop-filter: var(--glass-blur-medium) saturate(160%)
  background: var(--glass-bg-secondary) !important
  border: 1px solid var(--glass-border)
  border-left: 4px solid #ef4444
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.08)
  border-radius: 16px
  padding: 40px
  text-align: center

.icon-wrapper
  width: 80px
  height: 80px
  display: flex
  align-items: center
  justify-content: center
  background: rgba(239, 68, 68, 0.1)
  border: 1px solid rgba(239, 68, 68, 0.2)
  border-radius: 50%
  margin: 0 auto 24px

.error-title
  font-size: 24px
  font-weight: 700
  color: var(--text-primary)
  margin: 0 0 12px

.error-message
  font-size: 15px
  color: var(--text-secondary)
  margin: 0 0 16px
  line-height: 1.5

.error-details
  font-size: 13px
  color: var(--text-tertiary)
  background: rgba(255, 255, 255, 0.03)
  border: 1px solid rgba(255, 255, 255, 0.06)
  border-radius: 8px
  padding: 12px 16px
  margin-bottom: 20px

.steamid-info
  display: flex
  align-items: center
  justify-content: center
  gap: 8px
  padding: 12px
  background: rgba(var(--admin-accent-rgb, 250, 204, 21), 0.08)
  border: 1px solid rgba(var(--admin-accent-rgb, 250, 204, 21), 0.2)
  border-radius: 8px
  margin-bottom: 20px

  &.steamid-none
    background: rgba(245, 158, 11, 0.08)
    border-color: rgba(245, 158, 11, 0.2)

.steamid-label
  font-size: 13px
  color: var(--text-secondary)

.steamid-value
  font-family: 'JetBrains Mono', monospace
  font-size: 13px
  color: var(--admin-accent, var(--primary-color))
  background: rgba(var(--admin-accent-rgb, 250, 204, 21), 0.15)
  padding: 4px 8px
  border-radius: 4px

.debug-panel
  text-align: left
  font-family: 'JetBrains Mono', monospace
  font-size: 11px
  background: rgba(0, 0, 0, 0.4)
  border: 1px solid rgba(255, 255, 255, 0.08)
  border-radius: 8px
  padding: 12px
  margin-bottom: 24px

.debug-header
  color: var(--text-tertiary)
  font-size: 10px
  text-transform: uppercase
  letter-spacing: 0.5px
  margin-bottom: 8px
  padding-bottom: 8px
  border-bottom: 1px solid rgba(255, 255, 255, 0.06)

.debug-row
  display: flex
  justify-content: space-between
  gap: 12px
  padding: 4px 0

  &:not(:last-child)
    border-bottom: 1px solid rgba(255, 255, 255, 0.03)

.debug-key
  color: var(--text-tertiary)
  flex-shrink: 0

.debug-value
  color: #60a5fa
  word-break: break-all
  text-align: right

.action-buttons
  display: flex
  flex-direction: column
  gap: 12px

  @media (min-width: 480px)
    flex-direction: row
    justify-content: center
</style>
