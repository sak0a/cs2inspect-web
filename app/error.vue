<script setup lang="ts">
import {
  LucideFileQuestion,
  LucideShieldX,
  LucideLock,
  LucideServerCrash,
  LucideClock,
  LucideConstruction,
  LucideAlertTriangle,
  LucideArrowLeft,
  LucideHome,
} from '@lucide/vue'
import type { NuxtError } from '#app'

interface ErrorConfig {
  icon: typeof LucideAlertTriangle
  title: string
  message: string
  color: string
  colorRgb: string
}

const props = defineProps<{
  error: NuxtError
}>()

const isDev = import.meta.dev

const errorMap: Record<number, ErrorConfig> = {
  404: {
    icon: LucideFileQuestion,
    title: 'Page Not Found',
    message: 'The page you are looking for does not exist or has been moved.',
    color: '#FACC15',
    colorRgb: '250, 204, 21',
  },
  403: {
    icon: LucideShieldX,
    title: 'Access Forbidden',
    message: 'You do not have permission to access this resource.',
    color: '#F97316',
    colorRgb: '249, 115, 22',
  },
  401: {
    icon: LucideLock,
    title: 'Authentication Required',
    message: 'Please sign in to access this page.',
    color: '#F59E0B',
    colorRgb: '245, 158, 11',
  },
  500: {
    icon: LucideServerCrash,
    title: 'Internal Server Error',
    message: 'Something went wrong on our end. Please try again later.',
    color: '#EF4444',
    colorRgb: '239, 68, 68',
  },
  408: {
    icon: LucideClock,
    title: 'Request Timeout',
    message: 'The request took too long to process. Please try again.',
    color: '#8B5CF6',
    colorRgb: '139, 92, 246',
  },
  503: {
    icon: LucideConstruction,
    title: 'Service Unavailable',
    message: 'The service is temporarily unavailable. Please try again in a few moments.',
    color: '#F59E0B',
    colorRgb: '245, 158, 11',
  },
}

const defaultError: ErrorConfig = {
  icon: LucideAlertTriangle,
  title: 'Unexpected Error',
  message: 'An unexpected error occurred. Please try again.',
  color: '#EF4444',
  colorRgb: '239, 68, 68',
}

const errorConfig = computed(() => {
  const code = props.error.status ?? 0
  return errorMap[code] ?? defaultError
})

function handleGoBack() {
  if (window.history.length > 2) {
    clearError()
    window.history.back()
  } else {
    clearError({ redirect: '/' })
  }
}

function handleGoHome() {
  clearError({ redirect: '/' })
}
</script>

<template>
  <div class="error-page">
    <div class="error-bg" />

    <div class="error-container">
      <!-- Icon -->
      <div
        class="error-icon"
        :style="{
          background: `rgba(${errorConfig.colorRgb}, 0.1)`,
          borderColor: `rgba(${errorConfig.colorRgb}, 0.15)`,
        }"
      >
        <component :is="errorConfig.icon" :size="32" :color="errorConfig.color" />
      </div>

      <!-- Error code -->
      <div class="error-code" :style="{ color: errorConfig.color }">
        {{ error.status }}
      </div>

      <!-- Title -->
      <h1 class="error-title">
        {{ errorConfig.title }}
      </h1>

      <!-- Message -->
      <p class="error-message">
        {{ error.statusText || errorConfig.message }}
      </p>

      <!-- Debug panel (dev only) -->
      <div v-if="isDev" class="debug-panel">
        <div class="debug-header">Debug</div>
        <div class="debug-row">
          <span class="debug-key">Status</span>
          <span class="debug-value">{{ error.status }}</span>
        </div>
        <div class="debug-row">
          <span class="debug-key">Status Text</span>
          <span class="debug-value">{{ error.statusText || '(none)' }}</span>
        </div>
        <div class="debug-row">
          <span class="debug-key">Message</span>
          <span class="debug-value">{{ error.message || '(none)' }}</span>
        </div>
        <div v-if="error.stack" class="debug-stack">
          <div class="debug-key">Stack Trace</div>
          <pre class="debug-stack-content">{{ error.stack }}</pre>
        </div>
      </div>

      <!-- Actions -->
      <div class="error-actions">
        <button class="btn btn-secondary" @click="handleGoBack">
          <LucideArrowLeft :size="16" />
          Go Back
        </button>
        <button class="btn btn-primary" @click="handleGoHome">
          <LucideHome :size="16" />
          Go Home
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped lang="sass">
// Full-page blurred backdrop with dot grid
.error-page
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
  max-width: 440px
  position: relative
  z-index: 1
  backdrop-filter: var(--glass-blur-strong) var(--glass-saturation)
  -webkit-backdrop-filter: var(--glass-blur-strong) var(--glass-saturation)
  background: var(--glass-bg-primary, rgba(16, 16, 16, 0.70))
  border: 1px solid var(--glass-border, rgba(255, 255, 255, 0.1))
  border-radius: 18px
  padding: 40px 36px
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
  width: 64px
  height: 64px
  display: flex
  align-items: center
  justify-content: center
  border: 1px solid
  border-radius: 16px
  margin: 0 auto 20px

.error-code
  font-family: 'JetBrains Mono', monospace
  font-size: 64px
  font-weight: 800
  line-height: 1
  margin-bottom: 8px
  letter-spacing: -2px
  text-shadow: 0 4px 24px rgba(0, 0, 0, 0.5)

.error-title
  font-size: 20px
  font-weight: 700
  color: rgba(255, 255, 255, 0.95)
  margin: 0 0 8px
  line-height: 1.3

.error-message
  font-size: 14px
  color: rgba(255, 255, 255, 0.55)
  margin: 0 0 28px
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
  margin-bottom: 28px

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

.debug-stack
  margin-top: 8px
  padding-top: 8px
  border-top: 1px solid rgba(255, 255, 255, 0.06)

.debug-stack-content
  font-size: 10px
  color: #60a5fa
  white-space: pre-wrap
  word-break: break-all
  max-height: 200px
  overflow-y: auto
  margin-top: 4px
  padding: 8px
  background: rgba(0, 0, 0, 0.3)
  border-radius: 4px

// Actions — side by side
.error-actions
  display: flex
  gap: 10px

  @media (max-width: 400px)
    flex-direction: column

.btn
  display: flex
  flex: 1
  align-items: center
  justify-content: center
  gap: 8px
  padding: 11px 20px
  border: none
  border-radius: 10px
  font-size: 13px
  font-weight: 600
  cursor: pointer
  transition: all 0.2s ease
  backdrop-filter: var(--glass-blur-light)
  -webkit-backdrop-filter: var(--glass-blur-light)
  font-family: inherit

  &:active
    transform: scale(0.98)

.btn-primary
  background: linear-gradient(180deg, rgba(250, 204, 21, 0.18), rgba(250, 204, 21, 0.06)), rgba(16, 16, 16, 0.55)
  color: #FACC15
  box-shadow: 0 4px 12px rgba(250, 204, 21, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.12)

  &:hover
    box-shadow: 0 6px 16px rgba(250, 204, 21, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.16)

.btn-secondary
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.10), rgba(255, 255, 255, 0.03)), rgba(16, 16, 16, 0.55)
  color: rgba(255, 255, 255, 0.75)
  border: 1px solid rgba(255, 255, 255, 0.14)
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.08)

  &:hover
    border-color: rgba(255, 255, 255, 0.18)
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.12)

@media (max-width: 480px)
  .error-container
    padding: 32px 24px

  .error-code
    font-size: 48px

@media (prefers-reduced-motion: reduce)
  .error-container
    animation: none

  .btn
    transition: none
</style>
