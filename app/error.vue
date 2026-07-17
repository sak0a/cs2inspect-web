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
import { Button } from '@/components/ui/button'
import AppBackground from '@/components/app/AppBackground.vue'

interface ErrorConfig {
  icon: typeof LucideAlertTriangle
  /** Leaf under the `errorPage.*` i18n namespace (all six locales). */
  key: string
  /** English defaults used when i18n is unavailable (see `tSafe`). */
  fallbackTitle: string
  fallbackMessage: string
  /**
   * Status tint (Onyx: accent yellow 404, amber auth/unavailable,
   * destructive 5xx, violet timeout). Fed into `--sc` for the chip's
   * radial tint and the code glow.
   */
  color: string
}

const props = defineProps<{
  error: NuxtError
}>()

const isDev = import.meta.dev

/*
 * i18n guard: error.vue renders inside the Nuxt app, so nuxt-i18n-micro's
 * plugin normally has provided $t by the time we get here. But if a plugin
 * throws during init (including i18n's own translation loading, which throws
 * a 404 on failure), this page renders WITHOUT $t. The error page must never
 * crash, so every string goes through tSafe() with an English default.
 */
const nuxtApp = useNuxtApp()
function tSafe(key: string, fallback: string): string {
  const translate = nuxtApp.$t as ((key: string) => unknown) | undefined
  if (typeof translate !== 'function') return fallback
  try {
    const result = translate(key)
    if (typeof result === 'string' && result.length > 0 && result !== key) return result
  } catch {
    // i18n state unusable in this error context; use the English default
  }
  return fallback
}

const errorMap: Record<number, ErrorConfig> = {
  404: {
    icon: LucideFileQuestion,
    key: 'notFound',
    fallbackTitle: 'Page Not Found',
    fallbackMessage: 'The page you are looking for does not exist or has been moved.',
    color: 'var(--primary)',
  },
  403: {
    icon: LucideShieldX,
    key: 'forbidden',
    fallbackTitle: 'Access Forbidden',
    fallbackMessage: 'You do not have permission to access this resource.',
    color: '#f59e0b',
  },
  401: {
    icon: LucideLock,
    key: 'unauthorized',
    fallbackTitle: 'Authentication Required',
    fallbackMessage: 'Please sign in to access this page.',
    color: '#f59e0b',
  },
  500: {
    icon: LucideServerCrash,
    key: 'serverError',
    fallbackTitle: 'Internal Server Error',
    fallbackMessage: 'Something went wrong on our end. Please try again later.',
    color: 'var(--destructive)',
  },
  408: {
    icon: LucideClock,
    key: 'timeout',
    fallbackTitle: 'Request Timeout',
    fallbackMessage: 'The request took too long to process. Please try again.',
    color: '#8b5cf6',
  },
  503: {
    icon: LucideConstruction,
    key: 'unavailable',
    fallbackTitle: 'Service Unavailable',
    fallbackMessage: 'The service is temporarily unavailable. Please try again in a few moments.',
    color: '#f59e0b',
  },
}

const defaultError: ErrorConfig = {
  icon: LucideAlertTriangle,
  key: 'unexpected',
  fallbackTitle: 'Unexpected Error',
  fallbackMessage: 'An unexpected error occurred. Please try again.',
  color: 'var(--destructive)',
}

const errorConfig = computed(() => {
  const code = props.error.status ?? 0
  return errorMap[code] ?? defaultError
})

const title = computed(() =>
  tSafe(`errorPage.${errorConfig.value.key}.title`, errorConfig.value.fallbackTitle)
)
const message = computed(() =>
  tSafe(`errorPage.${errorConfig.value.key}.message`, errorConfig.value.fallbackMessage)
)
const goBackLabel = computed(() => tSafe('errorPage.goBack', 'Go Back'))
const goHomeLabel = computed(() => tSafe('errorPage.goHome', 'Go Home'))
const debugLabels = computed(() => ({
  title: tSafe('errorPage.debug.title', 'Debug'),
  status: tSafe('errorPage.debug.status', 'Status'),
  statusText: tSafe('errorPage.debug.statusText', 'Status Text'),
  message: tSafe('errorPage.debug.message', 'Message'),
  stackTrace: tSafe('errorPage.debug.stackTrace', 'Stack Trace'),
  none: tSafe('errorPage.debug.none', '(none)'),
}))

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
  <!-- html/body are overflow-hidden app-wide, so the error page is its own scroller -->
  <div class="relative h-screen overflow-x-hidden overflow-y-auto">
    <AppBackground />

    <div class="flex min-h-full items-center justify-center p-6">
      <div
        class="error-panel relative z-[1] w-full max-w-[440px] rounded-[var(--radius-modal)] border border-border bg-card px-9 py-10 text-center shadow-[var(--shadow-modal)] max-[480px]:px-6 max-[480px]:py-8"
        :style="{ '--sc': errorConfig.color }"
      >
        <!-- Status chip — radial rarity-glow-style tint, not a solid fill -->
        <div
          class="error-chip mx-auto mb-5 flex size-16 items-center justify-center rounded-[var(--radius-card)] border"
          aria-hidden="true"
        >
          <component :is="errorConfig.icon" :size="30" />
        </div>

        <!-- Error code -->
        <div
          class="error-code mb-2.5 font-mono text-[68px] font-semibold leading-none tracking-[-0.03em] max-[480px]:text-[52px]"
        >
          {{ error.status }}
        </div>

        <!-- Title -->
        <h1
          class="mb-2 font-display text-[21px] font-semibold leading-snug tracking-tight text-foreground"
        >
          {{ title }}
        </h1>

        <!-- Message -->
        <p class="mb-7 text-sm leading-relaxed text-muted-foreground">
          {{ error.statusText || message }}
        </p>

        <!-- Debug panel (dev only) -->
        <div
          v-if="isDev"
          class="mb-7 rounded-[var(--radius-ctl)] border border-border bg-black/30 px-3 py-2.5 text-left font-mono text-[11px]"
        >
          <div class="mb-1.5 text-[10px] uppercase tracking-[0.12em] text-[var(--text-tertiary)]">
            {{ debugLabels.title }}
          </div>
          <div class="flex justify-between gap-3 py-[3px]">
            <span class="shrink-0 text-[var(--text-tertiary)]">{{ debugLabels.status }}</span>
            <span class="break-all text-right text-muted-foreground">{{ error.status }}</span>
          </div>
          <div class="flex justify-between gap-3 py-[3px]">
            <span class="shrink-0 text-[var(--text-tertiary)]">{{ debugLabels.statusText }}</span>
            <span class="break-all text-right text-muted-foreground">{{
              error.statusText || debugLabels.none
            }}</span>
          </div>
          <div class="flex justify-between gap-3 py-[3px]">
            <span class="shrink-0 text-[var(--text-tertiary)]">{{ debugLabels.message }}</span>
            <span class="break-all text-right text-muted-foreground">{{
              error.message || debugLabels.none
            }}</span>
          </div>
          <div v-if="error.stack" class="mt-2 border-t border-border pt-2">
            <div class="text-[10px] uppercase tracking-[0.12em] text-[var(--text-tertiary)]">
              {{ debugLabels.stackTrace }}
            </div>
            <pre
              class="mt-1 max-h-[200px] overflow-y-auto rounded-[6px] bg-black/30 p-2 text-[10px] break-all whitespace-pre-wrap text-muted-foreground"
              >{{ error.stack }}</pre>
          </div>
        </div>

        <!-- Actions -->
        <div class="flex gap-2.5 max-[400px]:flex-col">
          <Button variant="secondary" class="flex-1" @click="handleGoBack">
            <LucideArrowLeft :size="16" />
            {{ goBackLabel }}
          </Button>
          <Button class="flex-1" @click="handleGoHome">
            <LucideHome :size="16" />
            {{ goHomeLabel }}
          </Button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Panel entrance */
.error-panel {
  animation: cardIn var(--dur-slow) var(--ease-out) both;
}

@keyframes cardIn {
  from {
    opacity: 0;
    transform: scale(0.96) translateY(12px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

/* Status chip — the light the status casts on the surface */
.error-chip {
  color: var(--sc);
  border-color: color-mix(in srgb, var(--sc) 22%, transparent);
  background: radial-gradient(
    80% 80% at 50% 32%,
    color-mix(in srgb, var(--sc) 20%, transparent),
    transparent 75%
  );
}

/* Error code — status-tinted glow, kept subtle */
.error-code {
  color: var(--sc);
  text-shadow:
    0 0 44px color-mix(in srgb, var(--sc) 42%, transparent),
    0 0 12px color-mix(in srgb, var(--sc) 18%, transparent);
}

@media (prefers-reduced-motion: reduce) {
  .error-panel {
    animation: none;
  }
}
</style>
