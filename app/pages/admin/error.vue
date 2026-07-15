<script setup lang="ts">
import {
  LucideShieldAlert as ShieldAlertIcon,
  LucideLogIn as LogInIcon,
  LucideHome as HomeIcon,
  LucideRefreshCw as RefreshIcon,
  LucideArrowLeft as ArrowLeftIcon,
} from '@lucide/vue'
import { steamAuth, type SteamUser } from '~/services/steamAuth'
import { Button } from '@/components/ui/button'

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
        <ShieldAlertIcon :size="32" />
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
        <Button v-if="!isLoggedIn" class="w-full" @click="handleLogin">
          <LogInIcon :size="16" />
          Sign in with Steam
        </Button>

        <Button v-if="isLoggedIn" variant="secondary" class="w-full" @click="handleRetry">
          <RefreshIcon :size="16" />
          Try Again
        </Button>

        <Button
          v-if="isLoggedIn && errorType === 'superadmin_required'"
          variant="ghost"
          class="w-full"
          @click="router.push('/admin')"
        >
          <ArrowLeftIcon :size="16" />
          Back to Dashboard
        </Button>

        <Button variant="ghost" class="w-full" @click="handleGoHome">
          <HomeIcon :size="16" />
          Go Home
        </Button>
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
  background: var(--background)
  background-image: radial-gradient(circle, rgba(255, 255, 255, 0.2) 1.5px, transparent 1.5px)
  background-size: 40px 40px
  background-position: 0 0
  mask-image: linear-gradient(to bottom right, black 10%, transparent 100%)
  -webkit-mask-image: linear-gradient(to bottom right, black 10%, transparent 100%)

// Onyx panel surface (near-opaque, hairline border, token radii/shadow)
.error-container
  width: 100%
  max-width: 400px
  position: relative
  z-index: 1
  background: var(--card)
  border: 1px solid var(--border)
  border-radius: var(--radius-modal)
  padding: 32px
  text-align: center
  box-shadow: var(--shadow-modal)
  animation: cardIn var(--dur-slow) var(--ease-out)

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
  background: color-mix(in srgb, var(--destructive) 10%, transparent)
  border: 1px solid color-mix(in srgb, var(--destructive) 15%, transparent)
  border-radius: var(--radius-card)
  margin: 0 auto 20px
  color: var(--destructive)

.error-title
  font-family: var(--font-display, 'Space Grotesk', ui-sans-serif, system-ui, sans-serif)
  font-size: 20px
  font-weight: 700
  letter-spacing: -0.02em
  color: var(--foreground)
  margin: 0 0 8px
  line-height: 1.3

.error-message
  font-size: 14px
  color: var(--muted-foreground)
  margin: 0 0 20px
  line-height: 1.5

// User card — matches admin nav compact card
.user-card
  display: flex
  align-items: center
  gap: 12px
  padding: 10px 14px
  border-radius: var(--radius-card)
  background: var(--surface-2)
  border: 1px solid var(--border)
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
  color: var(--foreground)
  white-space: nowrap
  overflow: hidden
  text-overflow: ellipsis

.user-card-steamid
  font-family: var(--font-mono, 'JetBrains Mono', ui-monospace, monospace)
  font-size: 11px
  color: var(--text-tertiary)

.error-details
  font-size: 12px
  color: var(--text-tertiary)
  margin: 0 0 24px
  line-height: 1.5

// Debug
.debug-panel
  text-align: left
  font-family: var(--font-mono, 'JetBrains Mono', ui-monospace, monospace)
  font-size: 11px
  background: rgba(0, 0, 0, 0.3)
  border: 1px solid var(--border)
  border-radius: var(--radius-ctl)
  padding: 10px 12px
  margin-bottom: 24px

.debug-header
  color: var(--text-tertiary)
  font-size: 10px
  text-transform: uppercase
  letter-spacing: 0.12em
  margin-bottom: 6px

.debug-row
  display: flex
  justify-content: space-between
  gap: 12px
  padding: 3px 0

.debug-key
  color: var(--text-tertiary)
  flex-shrink: 0

.debug-value
  color: var(--muted-foreground)
  word-break: break-all
  text-align: right

// Actions
.error-actions
  display: flex
  flex-direction: column
  gap: 8px

@media (prefers-reduced-motion: reduce)
  .error-container
    animation: none
</style>
