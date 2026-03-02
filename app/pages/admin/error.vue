<script setup lang="ts">
import {
  LucideShieldAlert as ShieldAlertIcon,
  LucideLogIn as LogInIcon,
  LucideHome as HomeIcon,
  LucideRefreshCw as RefreshIcon,
  LucideArrowLeft as ArrowLeftIcon,
} from 'lucide-vue-next'
import { steamAuth, type SteamUser } from '~/services/steamAuth'

definePageMeta({
  layout: 'blank',
})

const route = useRoute()
const router = useRouter()
const isDev = import.meta.dev

const user = ref<SteamUser | null>(null)
onMounted(() => {
  user.value = steamAuth.getSavedUser()
})

const isLoggedIn = computed(() => !!user.value)

const errorType = computed(() => (route.query.error as string) || 'unknown')
const redirectPath = computed(() => (route.query.redirect as string) || '/admin')

const errorInfo = computed(() => {
  switch (errorType.value) {
    case 'admin_required':
      return isLoggedIn.value
        ? {
            title: 'Admin Access Required',
            message: 'Your account does not have administrator privileges.',
            details: 'Contact a server admin if you believe this is a mistake.',
          }
        : {
            title: 'Authentication Required',
            message: 'Please sign in with Steam to access the admin panel.',
            details: 'You need to be signed in with an account that has admin access.',
          }
    case 'superadmin_required':
      return {
        title: 'Super Admin Required',
        message: 'This page requires super administrator privileges.',
        details: 'Your account has admin access but this page requires elevated permissions.',
      }
    case 'not_authenticated':
      return {
        title: 'Authentication Required',
        message: 'Please sign in with Steam to access the admin panel.',
        details: 'You need to be signed in with an account that has admin access.',
      }
    default:
      return {
        title: 'Access Denied',
        message: 'You do not have permission to access this resource.',
        details: `Error: ${errorType.value}`,
      }
  }
})

function handleLogin() {
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
    <div class="error-bg" />
    <div class="error-container">
      <!-- Icon -->
      <div class="error-icon">
        <NIcon :component="ShieldAlertIcon" :size="32" />
      </div>

      <!-- Title & message -->
      <h1 class="error-title">
        {{ errorInfo.title }}
      </h1>
      <p class="error-message">
        {{ errorInfo.message }}
      </p>

      <!-- User card (logged in) -->
      <div v-if="isLoggedIn && user" class="user-card">
        <img :src="user.avatarFull" :alt="user.personaName" class="user-card-avatar" />
        <div class="user-card-info">
          <span class="user-card-name">{{ user.personaName }}</span>
          <code class="user-card-steamid">{{ user.steamId }}</code>
        </div>
      </div>

      <!-- Details -->
      <p class="error-details">
        {{ errorInfo.details }}
      </p>

      <!-- Debug panel (dev only) -->
      <div v-if="isDev" class="debug-panel">
        <div class="debug-header">Debug</div>
        <div class="debug-row">
          <span class="debug-key">Error</span>
          <span class="debug-value">{{ errorType }}</span>
        </div>
        <div class="debug-row">
          <span class="debug-key">Redirect</span>
          <span class="debug-value">{{ redirectPath }}</span>
        </div>
        <div class="debug-row">
          <span class="debug-key">Steam ID</span>
          <span class="debug-value">{{ user?.steamId || 'null' }}</span>
        </div>
      </div>

      <!-- Actions -->
      <div class="error-actions">
        <button v-if="!isLoggedIn" class="btn btn-primary" @click="handleLogin">
          <NIcon :component="LogInIcon" :size="16" />
          Sign in with Steam
        </button>

        <button v-if="isLoggedIn" class="btn btn-secondary" @click="handleRetry">
          <NIcon :component="RefreshIcon" :size="16" />
          Try Again
        </button>

        <button
          v-if="isLoggedIn && errorType === 'superadmin_required'"
          class="btn btn-ghost"
          @click="router.push('/admin')"
        >
          <NIcon :component="ArrowLeftIcon" :size="16" />
          Back to Dashboard
        </button>

        <button class="btn btn-ghost" @click="handleGoHome">
          <NIcon :component="HomeIcon" :size="16" />
          Go Home
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped lang="sass">
// Full-page blurred backdrop with dot grid
.admin-error-page
  min-height: 100vh
  display: flex
  align-items: center
  justify-content: center
  padding: 24px
  background: rgba(0, 0, 0, 0.6)
  backdrop-filter: blur(8px) saturate(120%)
  -webkit-backdrop-filter: blur(8px) saturate(120%)
  position: relative
  overflow: hidden

.error-bg
  position: absolute
  inset: 0
  z-index: 0
  background: #000000
  background-image: radial-gradient(circle, rgba(255, 255, 255, 0.2) 1.5px, transparent 1.5px)
  background-size: 40px 40px
  background-position: 0 0
  mask-image: linear-gradient(to bottom right, black 10%, transparent 100%)
  -webkit-mask-image: linear-gradient(to bottom right, black 10%, transparent 100%)

// Glass card (matches .n-modal > .n-card)
.error-container
  width: 100%
  max-width: 400px
  position: relative
  z-index: 1
  backdrop-filter: var(--glass-blur-strong) var(--glass-saturation)
  -webkit-backdrop-filter: var(--glass-blur-strong) var(--glass-saturation)
  background: var(--glass-bg-primary, rgba(16, 16, 16, 0.70))
  border: 1px solid var(--glass-border, rgba(255, 255, 255, 0.1))
  border-radius: 18px
  padding: 32px
  text-align: center
  box-shadow: 0 32px 64px rgba(0, 0, 0, 0.9), 0 16px 32px rgba(0, 0, 0, 0.7), 0 8px 16px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.08)
  animation: cardIn 0.5s cubic-bezier(0.4, 0, 0.2, 1)

@keyframes cardIn
  from
    opacity: 0
    transform: scale(0.95) translateY(12px)
  to
    opacity: 1
    transform: scale(1) translateY(0)

.error-icon
  width: 56px
  height: 56px
  display: flex
  align-items: center
  justify-content: center
  background: rgba(239, 68, 68, 0.1)
  border: 1px solid rgba(239, 68, 68, 0.15)
  border-radius: 14px
  margin: 0 auto 20px
  color: #ef4444

.error-title
  font-size: 20px
  font-weight: 700
  color: rgba(255, 255, 255, 0.95)
  margin: 0 0 8px
  line-height: 1.3

.error-message
  font-size: 14px
  color: rgba(255, 255, 255, 0.55)
  margin: 0 0 20px
  line-height: 1.5

// User card — matches admin nav compact card
.user-card
  display: flex
  align-items: center
  gap: 12px
  padding: 10px 14px
  border-radius: 12px
  background: rgba(255, 255, 255, 0.04)
  border: 1px solid rgba(255, 255, 255, 0.08)
  margin-bottom: 16px
  text-align: left

.user-card-avatar
  width: 36px
  height: 36px
  border-radius: 50%
  flex-shrink: 0
  object-fit: cover

.user-card-info
  display: flex
  flex-direction: column
  min-width: 0
  gap: 2px

.user-card-name
  font-size: 13px
  font-weight: 600
  color: rgba(255, 255, 255, 0.92)
  white-space: nowrap
  overflow: hidden
  text-overflow: ellipsis

.user-card-steamid
  font-family: 'JetBrains Mono', monospace
  font-size: 11px
  color: rgba(255, 255, 255, 0.4)

.error-details
  font-size: 12px
  color: rgba(255, 255, 255, 0.35)
  margin: 0 0 24px
  line-height: 1.5

// Debug
.debug-panel
  text-align: left
  font-family: 'JetBrains Mono', monospace
  font-size: 11px
  background: rgba(0, 0, 0, 0.3)
  border: 1px solid rgba(255, 255, 255, 0.06)
  border-radius: 10px
  padding: 10px 12px
  margin-bottom: 24px

.debug-header
  color: rgba(255, 255, 255, 0.3)
  font-size: 10px
  text-transform: uppercase
  letter-spacing: 0.5px
  margin-bottom: 6px

.debug-row
  display: flex
  justify-content: space-between
  gap: 12px
  padding: 3px 0

.debug-key
  color: rgba(255, 255, 255, 0.3)
  flex-shrink: 0

.debug-value
  color: #60a5fa
  word-break: break-all
  text-align: right

// Actions
.error-actions
  display: flex
  flex-direction: column
  gap: 8px

.btn
  display: flex
  align-items: center
  justify-content: center
  gap: 8px
  width: 100%
  padding: 10px 16px
  border: none
  border-radius: 10px
  font-size: 13px
  font-weight: 600
  cursor: pointer
  transition: all 0.2s ease
  backdrop-filter: var(--glass-blur-light)
  -webkit-backdrop-filter: var(--glass-blur-light)

  &:active
    transform: scale(0.98)

.btn-primary
  background: linear-gradient(180deg, rgba(250, 204, 21, 0.95), rgba(250, 204, 21, 0.85))
  color: #0a0a0a
  border: 1px solid rgba(250, 204, 21, 0.3)
  box-shadow: 0 4px 8px rgba(250, 204, 21, 0.2), 0 2px 4px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.2)

  &:hover
    background: linear-gradient(180deg, rgba(253, 224, 71, 0.95), rgba(250, 204, 21, 0.9))
    box-shadow: 0 6px 12px rgba(250, 204, 21, 0.25), 0 3px 6px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.25)

.btn-secondary
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.10), rgba(255, 255, 255, 0.03)), rgba(16, 16, 16, 0.55)
  color: rgba(255, 255, 255, 0.85)
  border: 1px solid rgba(255, 255, 255, 0.14)
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.08)

  &:hover
    background: linear-gradient(180deg, rgba(255, 255, 255, 0.14), rgba(255, 255, 255, 0.05)), rgba(16, 16, 16, 0.55)
    border-color: rgba(255, 255, 255, 0.18)

.btn-ghost
  background: transparent
  color: rgba(255, 255, 255, 0.5)

  &:hover
    color: rgba(255, 255, 255, 0.75)
    background: rgba(255, 255, 255, 0.04)
</style>
