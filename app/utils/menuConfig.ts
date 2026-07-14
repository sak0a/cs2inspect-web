import { LucideMusic as Music, LucidePin as Pin, LucideHome as Home } from '@lucide/vue'
import type { Component, VNode } from 'vue'

/**
 * Option shape consumed by the custom horizontal nav
 * (app/components/navigation/MainNav.vue). `key` doubles as the route path.
 * Icons are either Lucide components or the pre-built inline-SVG vnodes from
 * `menuIcons` (trusted static assets — see app/utils/menuIcons.ts). The nav
 * controls the rendered icon size, so no per-option size is needed.
 */
export interface NavMenuOption {
  labelKey: string
  key: string
  icon: Component | VNode
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
    icon: menuIcons.rifles,
  },
  {
    labelKey: 'weapons.smgs',
    key: '/weapons/smgs',
    icon: menuIcons.smgs,
  },
  {
    labelKey: 'weapons.pistols',
    key: '/weapons/pistols',
    icon: menuIcons.pistols,
  },
  {
    labelKey: 'weapons.heavys',
    key: '/weapons/heavys',
    icon: menuIcons.heavys,
  },
]

export const equipmentMenuOptions: NavMenuOption[] = [
  {
    labelKey: 'melee.knives',
    key: '/knives',
    icon: menuIcons.knives,
  },
  {
    labelKey: 'melee.gloves',
    key: '/gloves',
    icon: menuIcons.gloves,
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
    icon: menuIcons.agents,
  },
  {
    labelKey: 'extras.music',
    key: '/music-kits',
    icon: Music,
  },
]
