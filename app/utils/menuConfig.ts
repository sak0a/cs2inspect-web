import { LucideMusic as Music, LucidePin as Pin, LucideHome as Home } from '@lucide/vue'
import type { Component, VNode } from 'vue'
import type { WeaponSilhouetteName } from '~/components/navigation/WeaponSilhouette.vue'

/**
 * Option shape consumed by the navigation components
 * (app/components/navigation/MainNav.vue, MobileNav.vue). `key` doubles as
 * the route path. Items carry either a Lucide `icon` component or a
 * `silhouette` name rendered through
 * app/components/navigation/WeaponSilhouette.vue (trusted static assets from
 * app/assets/svg). The nav controls the rendered icon size, so no per-option
 * size is needed.
 */
export interface NavMenuOption {
  labelKey: string
  key: string
  icon?: Component | VNode
  silhouette?: WeaponSilhouetteName
}

export const homeMenuOptions: NavMenuOption[] = [
  {
    labelKey: 'extras.home',
    key: '/',
    icon: Home,
  },
]

export const weaponMenuOptions: NavMenuOption[] = [
  {
    labelKey: 'weapons.rifles',
    key: '/weapons/rifles',
    silhouette: 'rifles',
  },
  {
    labelKey: 'weapons.smgs',
    key: '/weapons/smgs',
    silhouette: 'smgs',
  },
  {
    labelKey: 'weapons.pistols',
    key: '/weapons/pistols',
    silhouette: 'pistols',
  },
  {
    labelKey: 'weapons.heavys',
    key: '/weapons/heavys',
    silhouette: 'heavys',
  },
]

export const equipmentMenuOptions: NavMenuOption[] = [
  {
    labelKey: 'melee.knives',
    key: '/knives',
    silhouette: 'knives',
  },
  {
    labelKey: 'melee.gloves',
    key: '/gloves',
    silhouette: 'gloves',
  },
]

export const extrasMenuOptions: NavMenuOption[] = [
  {
    labelKey: 'extras.pins',
    key: '/pins',
    icon: Pin,
  },
  {
    labelKey: 'extras.agents',
    key: '/agents',
    silhouette: 'agents',
  },
  {
    labelKey: 'extras.music',
    key: '/music-kits',
    icon: Music,
  },
]
