import type { Component } from 'vue'

/**
 * Icon prop type: accepts either an MDI icon name string (e.g. "home")
 * or a Vue component (e.g. a Lucide icon component).
 */
export type IconProp = string | Component

/**
 * Check if an icon prop value is a Vue component (not a string).
 */
export function isIconComponent(icon: IconProp): icon is Component {
  return typeof icon !== 'string'
}
