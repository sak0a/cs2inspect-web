<script setup lang="ts">
/**
 * MainNav — Onyx horizontal nav group.
 *
 * - lg+: persistent labels next to icons (reserved width, no
 *   expand-on-active reflow).
 * - below lg: icon-only items with a tooltip carrying the label.
 * - Active item: quiet pill (bg-white/6 + text-foreground) plus a single
 *   absolutely-positioned 2px accent underline. The underline is one element
 *   per nav group whose x/width are computed from the active item and moved
 *   with a CSS transition on the motion tokens for now — Phase 3 swaps the
 *   transition for a GSAP morph tween on the same element
 *   (`data-nav-indicator` / `indicatorEl`).
 *
 * Active state derives from the current route (option `key` = route path).
 */
import type { Component, VNode } from 'vue'
import type { WeaponSilhouetteName } from '~/components/navigation/WeaponSilhouette.vue'

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

/* Active underline indicator — measured from the active item */
const navEl = ref<HTMLElement | null>(null)
const indicatorEl = ref<HTMLElement | null>(null)
const indicator = reactive({ x: 0, width: 0, visible: false })
const INDICATOR_INSET = 10
let resizeObserver: ResizeObserver | null = null

function updateIndicator() {
  const activeItem = navEl.value?.querySelector<HTMLElement>('[aria-current="page"]')
  if (!activeItem) {
    indicator.visible = false
    return
  }
  const width = Math.max(activeItem.offsetWidth - INDICATOR_INSET * 2, 12)
  indicator.x = activeItem.offsetLeft + (activeItem.offsetWidth - width) / 2
  indicator.width = width
  indicator.visible = true
}

watch(
  () => route.path,
  () => {
    nextTick(updateIndicator)
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

      <!-- Single per-group underline; Phase 3 GSAP morph target -->
      <span
        ref="indicatorEl"
        data-nav-indicator
        class="main-nav-indicator"
        :style="{
          transform: `translateX(${indicator.x}px)`,
          width: `${indicator.width}px`,
          opacity: indicator.visible ? 1 : 0,
        }"
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
  height: 2px;
  border-radius: 1px;
  background: var(--primary);
  pointer-events: none;
  transition:
    transform var(--dur-base) var(--ease-out),
    width var(--dur-base) var(--ease-out),
    opacity var(--dur-fast) var(--ease-out);
}

@media (prefers-reduced-motion: reduce) {
  .main-nav-item,
  .main-nav-indicator {
    transition: none;
  }
}
</style>
