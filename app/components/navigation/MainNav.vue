<script setup lang="ts">
/**
 * MainNav — custom horizontal nav replacing the former `NMenu mode="horizontal"`
 * instances in layouts/default.vue.
 *
 * Reproduces the old look 1:1, including the icon→label expand-on-select
 * animation that used to be implemented via `.top-bar-menu` overrides of
 * menu-library internals (max-width/opacity/margin transitions on the label,
 * 0→8px icon margin, color transitions with the same cubic-bezier).
 *
 * Active state derives from the current route (option `key` = route path).
 */
import type { Component, VNode } from 'vue'

interface NavItem {
  key: string
  label: string
  icon: Component | VNode
}

interface Props {
  items: NavItem[]
  /** Rendered icon square size in px (former NMenu `:icon-size`) */
  iconSize?: number
}

withDefaults(defineProps<Props>(), {
  iconSize: 24,
})

const route = useRoute()

function isActive(key: string): boolean {
  return route.path === key
}
</script>

<template>
  <div class="main-nav flex shrink-0 grow-0 items-center text-[14px]">
    <NuxtLink
      v-for="item in items"
      :key="item.key"
      :to="item.key"
      class="main-nav-item"
      :class="{ 'main-nav-item--selected': isActive(item.key) }"
      :aria-current="isActive(item.key) ? 'page' : undefined"
    >
      <span class="main-nav-icon" :style="{ fontSize: `${iconSize}px` }">
        <component :is="item.icon" />
      </span>
      <span class="main-nav-label">{{ item.label }}</span>
    </NuxtLink>
  </div>
</template>

<style scoped>
/* Item box — former .n-menu-item / .n-menu-item-content (flex-centered,
   42px tall, 0 8px padding, transparent bottom border like naive's
   horizontal menu items) */
.main-nav-item {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  height: 42px;
  padding: 0 8px;
  border-bottom: 2px solid transparent;
  cursor: pointer;
  color: rgba(255, 255, 255, 0.82);
  text-decoration: none;
  outline: none;
  transition: color 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Icon — former .n-menu-item-content__icon + naive .n-icon sizing:
   1em box driven by font-size, nested svg scaled to 1em, fill inherits */
.main-nav-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 1em;
  height: 1em;
  margin-right: 0;
  color: rgba(255, 255, 255, 0.9);
  fill: currentColor;
  transition:
    color 0.3s cubic-bezier(0.4, 0, 0.2, 1),
    margin-right 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.main-nav-icon :deep(div) {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.main-nav-icon :deep(svg) {
  display: block;
  width: 1em;
  height: 1em;
}

/* Label — former .n-menu-item-content-header override: collapsed by
   default, expands on selection (exact transition timings preserved) */
.main-nav-label {
  display: block;
  max-width: 0;
  margin-left: 0;
  overflow: hidden;
  white-space: nowrap;
  opacity: 0;
  transition:
    max-width 0.3s ease,
    opacity 0.2s ease,
    margin 0.3s ease;
}

/* Hover / keyboard focus on non-selected items —
   naive itemTextColorHoverHorizontal = primaryColorHover (#f59e0b) */
.main-nav-item:not(.main-nav-item--selected):hover,
.main-nav-item:not(.main-nav-item--selected):focus-visible {
  color: #f59e0b;
}

.main-nav-item:not(.main-nav-item--selected):hover .main-nav-icon,
.main-nav-item:not(.main-nav-item--selected):focus-visible .main-nav-icon {
  color: #f59e0b;
}

/* Selected — primary #facc15; icon regains naive's 8px margin,
   label expands into view */
.main-nav-item--selected {
  color: #facc15;
}

.main-nav-item--selected .main-nav-icon {
  margin-right: 8px;
  color: #facc15;
}

.main-nav-item--selected .main-nav-label {
  max-width: 150px;
  margin-left: 8px;
  opacity: 1;
}
</style>
