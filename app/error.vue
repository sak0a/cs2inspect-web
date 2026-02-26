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
} from 'lucide-vue-next'
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
      <div
        class="error-card"
        :style="{ borderLeftColor: errorConfig.color }"
      >
        <!-- Icon -->
        <div
          class="icon-wrapper"
          :style="{
            background: `rgba(${errorConfig.colorRgb}, 0.1)`,
            borderColor: `rgba(${errorConfig.colorRgb}, 0.2)`,
          }"
        >
          <component
            :is="errorConfig.icon"
            :size="48"
            :color="errorConfig.color"
          />
        </div>

        <!-- Error code -->
        <div
          class="error-code"
          :style="{ color: errorConfig.color }"
        >
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
          <div class="debug-header">
            Debug Info
          </div>
          <div class="debug-row">
            <span class="debug-key">Status:</span>
            <span class="debug-value">{{ error.status }}</span>
          </div>
          <div class="debug-row">
            <span class="debug-key">Status Text:</span>
            <span class="debug-value">{{ error.statusText || '(none)' }}</span>
          </div>
          <div class="debug-row">
            <span class="debug-key">Message:</span>
            <span class="debug-value">{{ error.message || '(none)' }}</span>
          </div>
          <div v-if="error.stack" class="debug-stack">
            <div class="debug-key">
              Stack Trace:
            </div>
            <pre class="debug-stack-content">{{ error.stack }}</pre>
          </div>
        </div>

        <!-- Actions -->
        <div class="action-buttons">
          <button class="btn btn-secondary" @click="handleGoBack">
            <LucideArrowLeft :size="18" />
            Go Back
          </button>
          <button class="btn btn-primary" @click="handleGoHome">
            <LucideHome :size="18" />
            Go Home
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="sass">
.error-page
  min-height: 100vh
  display: flex
  align-items: center
  justify-content: center
  padding: 24px
  background: #0a0a0a
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

.error-container
  width: 100%
  max-width: 520px
  position: relative
  z-index: 1
  animation: errorFadeIn 0.6s cubic-bezier(0.4, 0, 0.2, 1)

.error-card
  backdrop-filter: var(--glass-blur-medium) saturate(160%)
  background: var(--glass-bg-secondary) !important
  border: 1px solid var(--glass-border)
  border-left: 4px solid #FACC15
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.08)
  border-radius: 16px
  padding: 48px 40px
  text-align: center

.icon-wrapper
  width: 88px
  height: 88px
  display: flex
  align-items: center
  justify-content: center
  border: 1px solid rgba(255, 255, 255, 0.2)
  border-radius: 50%
  margin: 0 auto 24px

.error-code
  font-family: 'JetBrains Mono', monospace
  font-size: 72px
  font-weight: 800
  line-height: 1
  margin-bottom: 8px
  letter-spacing: -2px
  text-shadow: 0 4px 24px rgba(0, 0, 0, 0.5)

.error-title
  font-size: 24px
  font-weight: 700
  color: var(--text-primary)
  margin: 0 0 12px

.error-message
  font-size: 15px
  color: var(--text-secondary)
  margin: 0 0 32px
  line-height: 1.6

.debug-panel
  text-align: left
  font-family: 'JetBrains Mono', monospace
  font-size: 11px
  background: rgba(0, 0, 0, 0.4)
  border: 1px solid rgba(255, 255, 255, 0.08)
  border-radius: 8px
  padding: 12px
  margin-bottom: 28px

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

.action-buttons
  display: flex
  gap: 12px
  justify-content: center

  @media (max-width: 480px)
    flex-direction: column

.btn
  display: inline-flex
  align-items: center
  justify-content: center
  gap: 8px
  padding: 12px 24px
  border-radius: 200px
  font-size: 14px
  font-weight: 600
  cursor: pointer
  transition: transform 0.22s cubic-bezier(0.2, 0.8, 0.2, 1), box-shadow 0.22s cubic-bezier(0.2, 0.8, 0.2, 1)
  border: none
  outline: none
  font-family: inherit

  &:hover
    transform: translateY(-1px) scale(1.01)

  &:active
    transform: translateY(0) scale(0.995)

  &:focus-visible
    box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.1), 0 8px 20px rgba(0, 0, 0, 0.28), inset 0 1px 0 rgba(255, 255, 255, 0.10)

.btn-primary
  background: linear-gradient(180deg, rgba(250, 204, 21, 0.18), rgba(250, 204, 21, 0.06)), rgba(16, 16, 16, 0.55)
  color: #FACC15
  box-shadow: 0 6px 18px rgba(250, 204, 21, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.12)

  &:hover
    box-shadow: 0 10px 24px rgba(250, 204, 21, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.16)

.btn-secondary
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.10), rgba(255, 255, 255, 0.03)), rgba(16, 16, 16, 0.55)
  color: var(--text-secondary, #d4d4d4)
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.28), inset 0 1px 0 rgba(255, 255, 255, 0.08)

  &:hover
    box-shadow: 0 10px 24px rgba(0, 0, 0, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.12)

@keyframes errorFadeIn
  from
    opacity: 0
    transform: scale(0.95) translateY(20px)
  to
    opacity: 1
    transform: scale(1) translateY(0)

@media (max-width: 480px)
  .error-card
    padding: 32px 24px

  .error-code
    font-size: 56px

  .icon-wrapper
    width: 72px
    height: 72px

@media (prefers-reduced-motion: reduce)
  .error-container
    animation: none

  .btn
    transition: none
</style>
