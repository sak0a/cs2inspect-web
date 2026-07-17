<script setup lang="ts">
/**
 * MainNav — Onyx horizontal nav group.
 *
 * - lg+: persistent labels next to icons (reserved width, no
 *   expand-on-active reflow).
 * - below lg: icon-only items with a tooltip carrying the label.
 * - Active item: quiet pill (bg-white/6 + text-foreground) plus a single
 *   absolutely-positioned 2px accent underline. The underline is one element
 *   per nav group whose x/width are computed from the active item and morphed
 *   into place with GSAP (Phase 3): x gets a slight `back.out` overshoot, the
 *   width morph is transform-only — a fixed 100px base scaled via `scaleX`
 *   (origin left) on `expo.out` (motion law: never tween width). Mount/resize
 *   re-measures snap without animating; reduced motion / E2E flag always
 *   snaps.
 *
 * Active state derives from the current route (option `key` = route path).
 */
import type { Component, VNode } from 'vue'
import type { WeaponSilhouetteName } from '~/components/navigation/WeaponSilhouette.vue'
import { EASE } from '~/utils/motion'

interface NavItem {
  key: string
  label: string
  icon?: Component | VNode
  silhouette?: WeaponSilhouetteName
}

interface Props {
  items: NavItem[]
  /**
   * Legacy prop kept for call-site compatibility (layouts pass 24/36).
   * Onyx normalizes icon sizes internally: silhouettes render at 28px,
   * Lucide glyphs at 18px, so this value is accepted but unused.
   */
  iconSize?: number
}

withDefaults(defineProps<Props>(), {
  iconSize: 24,
})

const SILHOUETTE_SIZE = 25
const LUCIDE_SIZE = 17

const route = useRoute()

function isActive(key: string): boolean {
  return route.path === key
}

/* Tooltips only below lg (labels are visible at lg+) */
const isLgUp = ref(false)
let mediaQuery: MediaQueryList | null = null
function onMediaChange(event: MediaQueryListEvent) {
  isLgUp.value = event.matches
}

/* Active underline indicator — measured from the active item, moved by GSAP */
const navEl = ref<HTMLElement | null>(null)
const indicatorEl = ref<HTMLElement | null>(null)
const indicator = reactive({ x: 0, width: 0, visible: false })
const INDICATOR_INSET = 10
/** CSS width of the underline; target widths become scaleX = width / base. */
const INDICATOR_BASE_WIDTH = 100
let resizeObserver: ResizeObserver | null = null

const { gsap, ctx } = useGsap(navEl)
const reducedMotion = useReducedMotion()

function updateIndicator(animate = false) {
  const activeItem = navEl.value?.querySelector<HTMLElement>('[aria-current="page"]')
  if (!activeItem) {
    indicator.visible = false
    return
  }
  const wasVisible = indicator.visible
  const width = Math.max(activeItem.offsetWidth - INDICATOR_INSET * 2, 12)
  indicator.x = activeItem.offsetLeft + (activeItem.offsetWidth - width) / 2
  indicator.width = width
  indicator.visible = true
  applyIndicator(animate && wasVisible)
}

/**
 * Move the underline via GSAP — transform/opacity only (motion law): the
 * element keeps a fixed 100px CSS width and the measured width maps to
 * `scaleX` around a left origin, so `x + 100 * scaleX` is the right edge
 * (identical interpolation to a width tween, zero layout work). Route
 * changes morph (x with a slight back.out overshoot, scaleX on expo.out,
 * 0.35s); mount/resize re-measures and reduced motion snap instantly.
 * `overwrite: 'auto'` kills any in-flight morph on rapid navigation.
 */
function applyIndicator(animate: boolean) {
  const el = indicatorEl.value
  if (!el) return
  const scaleX = indicator.width / INDICATOR_BASE_WIDTH
  if (!animate || reducedMotion.value) {
    // Every animated morph is preceded by at least one snap (mount/resize),
    // so the left origin is always established here first.
    gsap.set(el, { x: indicator.x, scaleX, transformOrigin: 'left center' })
    return
  }
  ctx(() => {
    gsap.to(el, {
      x: indicator.x,
      duration: 0.35,
      ease: 'back.out(1.2)',
      overwrite: 'auto',
    })
    gsap.to(el, {
      scaleX,
      duration: 0.35,
      ease: EASE.out,
      overwrite: 'auto',
    })
  })
}

watch(
  () => route.path,
  () => {
    nextTick(() => updateIndicator(true))
  }
)

onMounted(() => {
  // Labels render at xl+; below that we are icon-only and want tooltips.
  mediaQuery = window.matchMedia('(min-width: 1280px)')
  isLgUp.value = mediaQuery.matches
  mediaQuery.addEventListener('change', onMediaChange)

  updateIndicator()
  // Re-measure when label widths shift (breakpoint changes, webfont load,
  // locale switch) — any of those resizes the nav element itself.
  if (navEl.value) {
    resizeObserver = new ResizeObserver(() => updateIndicator())
    resizeObserver.observe(navEl.value)
  }
})

onBeforeUnmount(() => {
  mediaQuery?.removeEventListener('change', onMediaChange)
  resizeObserver?.disconnect()
})
</script>

<template>
  <TooltipProvider :delay-duration="300">
    <div ref="navEl" class="main-nav relative flex shrink-0 grow-0 items-center gap-0.5">
      <Tooltip v-for="item in items" :key="item.key" :disabled="isLgUp">
        <TooltipTrigger as-child>
          <NuxtLink
            :to="item.key"
            class="main-nav-item"
            :class="{ 'main-nav-item--active': isActive(item.key) }"
            :aria-current="isActive(item.key) ? 'page' : undefined"
            :aria-label="item.label"
          >
            <WeaponSilhouette
              v-if="item.silhouette"
              :name="item.silhouette"
              :size="SILHOUETTE_SIZE"
            />
            <span v-else-if="item.icon" class="main-nav-lucide">
              <component :is="item.icon" :size="LUCIDE_SIZE" />
            </span>
            <span class="main-nav-label hidden xl:inline">{{ item.label }}</span>
          </NuxtLink>
        </TooltipTrigger>
        <TooltipContent side="bottom">{{ item.label }}</TooltipContent>
      </Tooltip>

      <!-- Single per-group underline; x/width owned by GSAP (applyIndicator),
           only visibility is template-driven -->
      <span
        ref="indicatorEl"
        data-nav-indicator
        class="main-nav-indicator"
        :style="{ opacity: indicator.visible ? 1 : 0 }"
        aria-hidden="true"
      />
    </div>
  </TooltipProvider>
</template>

<style scoped>
.main-nav-item {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
  height: 36px;
  padding: 0 8px;
  border-radius: 9999px;
  color: var(--muted-foreground);
  text-decoration: none;
  outline: none;
  transition:
    color var(--dur-fast) var(--ease-out),
    background-color var(--dur-fast) var(--ease-out);
}

.main-nav-item:hover {
  color: var(--foreground);
  background: rgba(255, 255, 255, 0.04);
}

.main-nav-item:focus-visible {
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--ring) 40%, transparent);
}

.main-nav-item--active {
  color: var(--foreground);
  background: rgba(255, 255, 255, 0.06);
}

.main-nav-lucide {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.main-nav-label {
  font-size: 13.5px;
  font-weight: 500;
  line-height: 1;
  white-space: nowrap;
}

.main-nav-indicator {
  position: absolute;
  left: 0;
  bottom: -2px;
  /* Fixed base width — GSAP maps the measured width to scaleX (origin left),
     keeping the morph transform-only. Hidden (opacity 0) until measured. */
  width: 100px;
  height: 2px;
  border-radius: 1px;
  background: var(--primary);
  transform: scaleX(0);
  transform-origin: left center;
  pointer-events: none;
  /* transform is GSAP-owned (no CSS transition — it would double-animate the
     morph); only the show/hide fade stays in CSS */
  transition: opacity var(--dur-fast) var(--ease-out);
}

@media (prefers-reduced-motion: reduce) {
  .main-nav-item,
  .main-nav-indicator {
    transition: none;
  }
}
</style>
