// @saka-ui/registry v0.2.10 — dropdown
// Source: saka-ui@0.2.10
// Do not remove this header if you want `saka-ui diff` to work.
import { type InjectionKey, type Ref } from 'vue'
import { type IconProp } from '../../../lib/icon'

// Types
export type DropdownTrigger = 'click' | 'hover' | 'context' | 'manual'
export type DropdownPlacement =
  | 'top'
  | 'top-start'
  | 'top-end'
  | 'bottom'
  | 'bottom-start'
  | 'bottom-end'
  | 'left'
  | 'left-start'
  | 'left-end'
  | 'right'
  | 'right-start'
  | 'right-end'
export type DropdownSize = 'sm' | 'md' | 'lg'
export type DropdownVariant = 'default' | 'filled' | 'glass'
export type DropdownAnimation = 'fade' | 'slide' | 'scale' | 'reveal'

export interface DropdownMenuItem {
  key: string
  label?: string
  icon?: IconProp
  trailingIcon?: IconProp
  description?: string
  shortcut?: string
  disabled?: boolean
  danger?: boolean
  checked?: boolean
  children?: DropdownMenuItem[]
  divider?: boolean
  header?: string
  onClick?: () => void
}

export interface SDropdownContext {
  size: DropdownSize
  color: string
  closeOnSelect: boolean
  highlightedIndex: Ref<number>
  registerItem: (item: { key: string; disabled: boolean }) => number
  unregisterItem: (key: string) => void
  selectItem: (key: string) => void
  close: () => void
}

export const SDropdownContextKey: InjectionKey<SDropdownContext> = Symbol('SDropdownContext')

export interface SDropdownParentContext {
  registerChildRef: (ref: Ref<HTMLElement | null>) => void
  unregisterChildRef: (ref: Ref<HTMLElement | null>) => void
  cancelHide: () => void
}

export const SDropdownParentKey: InjectionKey<SDropdownParentContext> = Symbol('SDropdownParent')
