<!--
  SaveStatusIndicator.vue

  A minimal status indicator for auto-save functionality.
  Shows saving spinner, success checkmark, or error with retry button.

  Motion (Phase 3): GSAP state morph — the pill scales in with a slight
  overshoot (back.out), status changes crossfade the icon+text content, and
  the success state pulses its emerald glow once. All JS-driven; skipped
  under reduced motion / the E2E kill-switch.

  Props:
  - status: Current save status ('idle' | 'saving' | 'saved' | 'error')
  - showRetry: Show retry button on error
  - fixed: Position fixed at top-center (like toast messages)
-->
<template>
  <Teleport to="body" :disabled="!fixed">
    <!-- `appear` so a mount with non-idle status still runs onEnter (it
         applies the fixed-mode xPercent centering) -->
    <Transition :css="false" appear @enter="onEnter" @leave="onLeave">
      <div
        v-if="status !== 'idle'"
        ref="pillEl"
        v-bind="$attrs"
        class="save-status-indicator"
        :class="[statusClass, { 'save-status-indicator--fixed': fixed }]"
      >
        <!-- Emerald success glow: static shadow, opacity-animated only -->
        <span class="status-glow" aria-hidden="true" />

        <Transition :css="false" mode="out-in" @enter="onSwapEnter" @leave="onSwapLeave">
          <span :key="status" class="status-content">
            <!-- Saving state -->
            <template v-if="status === 'saving'">
              <div class="status-spinner" />
              <span class="status-text">{{ t('autoSave.saving') }}</span>
            </template>

            <!-- Saved state -->
            <template v-else-if="status === 'saved'">
              <svg
                class="status-icon status-icon--success"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span class="status-text">{{ t('autoSave.saved') }}</span>
            </template>

            <!-- Error state -->
            <template v-else-if="status === 'error'">
              <svg
                class="status-icon status-icon--error"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span class="status-text">{{ t('autoSave.failed') }}</span>
              <Button v-if="showRetry" variant="link" size="xs" @click="$emit('retry')">
                {{ t('autoSave.retry') }}
              </Button>
            </template>
          </span>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import type { SaveStatus } from '~/composables/useAutoSave'
import { Button } from '@/components/ui/button'
import { DUR } from '~/utils/motion'

// The root is a Teleport, so attrs (e.g. data-tutorial="auto-save") cannot
// auto-inherit; bind them explicitly onto the teleported pill instead.
defineOptions({ inheritAttrs: false })

interface Props {
  status: SaveStatus
  showRetry?: boolean
  fixed?: boolean
}

const props = defineProps<Props>()

defineEmits<{
  (e: 'retry'): void
}>()

const { t } = useI18n()

const pillEl = ref<HTMLElement | null>(null)
const { gsap, ctx } = useGsap()
const reducedMotion = useReducedMotion()

const statusClass = computed(() => {
  return {
    'save-status-indicator--saving': props.status === 'saving',
    'save-status-indicator--saved': props.status === 'saved',
    'save-status-indicator--error': props.status === 'error',
  }
})

/* --- Pill enter/leave (idle <-> visible) ------------------------------- */
/* Fixed mode centers via left:50% + GSAP xPercent (no CSS transform — GSAP
 * owns the transform channel so the two never fight). The status machine and
 * teleport/z-index contracts are untouched; only the motion is JS-driven. */

function onEnter(el: Element, done: () => void) {
  const target = el as HTMLElement
  if (reducedMotion.value) {
    if (props.fixed) gsap.set(target, { xPercent: -50 })
    done()
    return
  }
  ctx(() => {
    gsap.fromTo(
      target,
      {
        autoAlpha: 0,
        scale: 0.85,
        y: props.fixed ? -14 : 0,
        xPercent: props.fixed ? -50 : 0,
      },
      {
        autoAlpha: 1,
        scale: 1,
        y: 0,
        xPercent: props.fixed ? -50 : 0,
        duration: 0.3,
        ease: 'back.out(1.4)',
        onComplete: done,
      }
    )
  })
}

function onLeave(el: Element, done: () => void) {
  if (reducedMotion.value) {
    done()
    return
  }
  ctx(() => {
    gsap.to(el, {
      autoAlpha: 0,
      scale: 0.9,
      duration: 0.2,
      ease: 'power2.in',
      onComplete: done,
    })
  })
}

/* --- Status content crossfade (saving <-> saved <-> error) -------------- */

function onSwapEnter(el: Element, done: () => void) {
  if (reducedMotion.value) {
    done()
    return
  }
  ctx(() => {
    gsap.fromTo(
      el,
      { opacity: 0, y: 4 },
      { opacity: 1, y: 0, duration: DUR.fast, ease: 'power2.out', onComplete: done }
    )
  })
}

function onSwapLeave(el: Element, done: () => void) {
  if (reducedMotion.value) {
    done()
    return
  }
  ctx(() => {
    gsap.to(el, { opacity: 0, y: -4, duration: 0.1, ease: 'power2.in', onComplete: done })
  })
}

/* --- Success pulse: one emerald glow bloom + subtle scale breath --------- */

watch(
  () => props.status,
  (status) => {
    if (status !== 'saved' || reducedMotion.value) return
    nextTick(() => {
      const pill = pillEl.value
      if (!pill) return
      const glow = pill.querySelector<HTMLElement>('.status-glow')
      ctx(() => {
        gsap.fromTo(
          pill,
          { scale: 1 },
          { scale: 1.04, duration: DUR.fast, ease: 'power2.out', yoyo: true, repeat: 1 }
        )
        if (glow) {
          gsap.fromTo(
            glow,
            { opacity: 0 },
            { opacity: 0.8, duration: 0.2, ease: 'power2.out', yoyo: true, repeat: 1 }
          )
        }
      })
    })
  }
)
</script>

<style scoped>
/* Onyx pill: near-opaque elevated surface, hairline border, mono micro-text */
.save-status-indicator {
  position: relative;
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: 999px;
  border: 1px solid var(--border);
  background: var(--surface-2);
  font-family: var(--font-mono, ui-monospace, monospace);
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.02em;
  transition:
    color 0.2s var(--ease-out),
    border-color 0.2s var(--ease-out);
}

.save-status-indicator--saving {
  color: var(--muted-foreground);
}

.save-status-indicator--saved {
  color: #34d399;
  border-color: rgba(52, 211, 153, 0.3);
}

.save-status-indicator--error {
  color: #f87171;
  border-color: rgba(239, 68, 68, 0.35);
}

.save-status-indicator--fixed {
  position: fixed;
  top: 24px;
  left: 50%;
  /* Horizontal centering is applied by GSAP (xPercent: -50) so the tweened
     transform doesn't stack on a CSS translateX(-50%). */
  z-index: 9999;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
  padding: 5px 20px;
  font-size: 12px;
}

/* Success glow layer — static emerald shadow, revealed by opacity only */
.status-glow {
  position: absolute;
  inset: -1px;
  border-radius: 999px;
  box-shadow: 0 0 18px rgba(52, 211, 153, 0.45);
  opacity: 0;
  pointer-events: none;
}

.status-content {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.save-status-indicator--fixed .status-content {
  gap: 8px;
}

.save-status-indicator--fixed .status-spinner {
  width: 18px;
  height: 18px;
}

.save-status-indicator--fixed .status-icon {
  width: 18px;
  height: 18px;
}

.status-spinner {
  width: 14px;
  height: 14px;
  border: 2px solid transparent;
  border-top-color: currentColor;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.status-icon {
  width: 14px;
  height: 14px;
}

.status-icon--success,
.status-icon--error {
  color: currentColor;
}

.status-text {
  white-space: nowrap;
}
</style>
