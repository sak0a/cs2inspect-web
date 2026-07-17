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
 * follows the pointer. The pools are faintly team-reactive: `--pool-tint`
 * drifts toward the active side's hue (CT blue / T orange) at 2-3% alpha.
 * Fully static under reduced motion (the tint still updates — instantly).
 */
import { gsap } from 'gsap'

// Shared kill-switch (OS prefers-reduced-motion + E2E flag + runtime config).
// Resolved at setup so the Nuxt context is always available.
const reducedMotion = useReducedMotion()

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

// Team-reactive ambient tint: tween `--pool-tint` (consumed by the pool
// gradients at 2-3% alpha via color-mix) toward the active side's hue.
const { teamSide } = useTeamToggle()
let tintTween: gsap.core.Tween | null = null

function applyPoolTint(animate: boolean) {
  const el = rootEl.value
  if (!el) return
  const token = teamSide.value === 'ct' ? '--team-ct' : '--team-t'
  const fallback = teamSide.value === 'ct' ? '#5d8cff' : '#ff8a3d'
  const target = getComputedStyle(el).getPropertyValue(token).trim() || fallback
  tintTween?.kill()
  tintTween = null
  if (!animate || reducedMotion.value) {
    // Reduced motion / first paint: the tint is state, not motion — snap.
    el.style.setProperty('--pool-tint', target)
    return
  }
  tintTween = gsap.to(el, {
    '--pool-tint': target,
    duration: 1.2,
    ease: 'power2.inOut',
    overwrite: 'auto',
  })
}

watch(teamSide, () => applyPoolTint(true))

onMounted(() => {
  // Snap to the active side on load (the team cookie may say T).
  applyPoolTint(false)

  // Static under reduced motion: no listener, no var updates (CSS also
  // disables the drift keyframes).
  if (reducedMotion.value) return
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
  tintTween?.kill()
  tintTween = null
})
</script>

<style scoped>
.app-background {
  background-color: var(--background);
  /* Team-reactive ambient tint — JS tweens this toward --team-ct / --team-t.
   * Neutral white before mount so SSR paint matches the old look. */
  --pool-tint: #ffffff;
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
  background: radial-gradient(
    circle,
    color-mix(in srgb, var(--pool-tint) 2.5%, transparent) 0%,
    transparent 70%
  );
  animation: pool-drift-a 75s ease-in-out infinite alternate;
}

.bg-pool--b {
  right: -24vmax;
  bottom: -26vmax;
  background: radial-gradient(
    circle,
    color-mix(in srgb, var(--pool-tint) 2%, transparent) 0%,
    transparent 70%
  );
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
