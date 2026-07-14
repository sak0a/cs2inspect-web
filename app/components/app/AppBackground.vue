<template>
  <div
    ref="rootEl"
    class="app-background pointer-events-none fixed inset-0 z-0 overflow-hidden"
    aria-hidden="true"
  >
    <!-- Ambient drift: two large radial pools, keyframe drift + pointer shift -->
    <div class="bg-pools">
      <div class="bg-pool bg-pool--a" />
      <div class="bg-pool bg-pool--b" />
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * AppBackground — the single Onyx background layer (spec section 7).
 *
 * Replaces the dot-grid recipes previously duplicated inline in app.vue and
 * error.vue. Near-black #070708 ground with a subtle vignette, faint film
 * grain, and an extremely subtle ambient drift (two radial pools) that gently
 * follows the pointer. Fully static under reduced motion.
 */

/**
 * The shared useReducedMotion composable may not be merged yet — resolve it
 * defensively (Nuxt auto-import leaves the identifier undefined when the
 * composable does not exist, so `typeof` is safe), falling back to matchMedia.
 */
function prefersReducedMotion(): boolean {
  try {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment -- @ts-ignore (not expect-error) because the line is only errorful until the composable merges
    // @ts-ignore
    if (typeof useReducedMotion === 'function') {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment -- see above
      // @ts-ignore
      return Boolean(unref(useReducedMotion()))
    }
  } catch {
    // fall through to the matchMedia check
  }
  if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  }
  return false
}

const rootEl = ref<HTMLElement | null>(null)

// Pointer -> CSS vars (--mx/--my in -1..1), throttled via rAF. The pools
// translate by at most 12px (see .bg-pools transform below).
let rafId = 0
let pendingX = 0
let pendingY = 0
let listenerAttached = false

function onPointerMove(event: PointerEvent) {
  pendingX = (event.clientX / window.innerWidth - 0.5) * 2
  pendingY = (event.clientY / window.innerHeight - 0.5) * 2
  if (rafId) return
  rafId = window.requestAnimationFrame(() => {
    rafId = 0
    const el = rootEl.value
    if (!el) return
    el.style.setProperty('--mx', pendingX.toFixed(4))
    el.style.setProperty('--my', pendingY.toFixed(4))
  })
}

onMounted(() => {
  // Static under reduced motion: no listener, no var updates (CSS also
  // disables the drift keyframes).
  if (prefersReducedMotion()) return
  window.addEventListener('pointermove', onPointerMove, { passive: true })
  listenerAttached = true
})

onUnmounted(() => {
  if (listenerAttached) {
    window.removeEventListener('pointermove', onPointerMove)
    listenerAttached = false
  }
  if (rafId) {
    window.cancelAnimationFrame(rafId)
    rafId = 0
  }
})
</script>

<style scoped>
.app-background {
  background-color: var(--background);
}

/* Vignette — very subtle darker edges over the pools */
.app-background::before {
  content: '';
  position: absolute;
  inset: 0;
  z-index: 2;
  background: radial-gradient(120% 90% at 50% 42%, transparent 55%, rgba(0, 0, 0, 0.38) 100%);
}

/* Film grain — tiny inline SVG feTurbulence tile on a non-scrolling fixed
 * layer, ~0.025 opacity */
.app-background::after {
  content: '';
  position: fixed;
  inset: 0;
  z-index: 3;
  opacity: 0.025;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
  background-size: 160px 160px;
}

/* Pointer shift wrapper — pools translate by at most 12px toward the cursor.
 * The slow transition keeps the chase gentle on top of the rAF throttle. */
.bg-pools {
  position: absolute;
  inset: 0;
  z-index: 1;
  transform: translate3d(calc(var(--mx, 0) * 12px), calc(var(--my, 0) * 12px), 0);
  transition: transform 600ms var(--ease-out);
  will-change: transform;
}

.bg-pool {
  position: absolute;
  width: 70vmax;
  height: 70vmax;
  border-radius: 50%;
}

.bg-pool--a {
  top: -22vmax;
  left: -18vmax;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.02) 0%, transparent 70%);
  animation: pool-drift-a 75s ease-in-out infinite alternate;
}

.bg-pool--b {
  right: -24vmax;
  bottom: -26vmax;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.015) 0%, transparent 70%);
  animation: pool-drift-b 95s ease-in-out infinite alternate;
}

/* Transform-only drift, 60s+ loops */
@keyframes pool-drift-a {
  0% {
    transform: translate3d(0, 0, 0) scale(1);
  }
  50% {
    transform: translate3d(6vw, 5vh, 0) scale(1.08);
  }
  100% {
    transform: translate3d(-4vw, 8vh, 0) scale(1.02);
  }
}

@keyframes pool-drift-b {
  0% {
    transform: translate3d(0, 0, 0) scale(1);
  }
  50% {
    transform: translate3d(-7vw, -4vh, 0) scale(1.06);
  }
  100% {
    transform: translate3d(3vw, -7vh, 0) scale(1);
  }
}

/* Fully static under reduced motion (the JS side also skips the pointer
 * listener) */
@media (prefers-reduced-motion: reduce) {
  .bg-pool {
    animation: none;
  }

  .bg-pools {
    transform: none !important;
    transition: none;
  }
}
</style>
