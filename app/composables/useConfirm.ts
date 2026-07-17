import { reactive } from 'vue'

/**
 * Drop-in replacement for naive-ui's `useDialog()` confirmation dialogs.
 *
 * Usage (matches the old `dialog.warning({...})` call shape):
 *   const confirm = useConfirm()
 *   confirm.warning({
 *     title: 'Delete loadout',
 *     content: 'Are you sure?',
 *     positiveText: 'Delete',
 *     negativeText: 'Cancel',
 *     onPositiveClick: async () => { await api.delete(...) },
 *   })
 *
 * Backed by a module-level reactive store rendered by
 * <ConfirmDialogHost /> (mounted once in app.vue) — works from any
 * component without provide/inject.
 */
export type ConfirmType = 'warning' | 'error' | 'success' | 'info'

export interface ConfirmOptions {
  title: string
  content?: string
  positiveText?: string
  negativeText?: string
  /**
   * May be async — the positive button shows a pending state until it
   * resolves. Returning `false` keeps the dialog open (naive-ui semantics).
   */
  onPositiveClick?: () => unknown
  onNegativeClick?: () => unknown
}

interface ConfirmState {
  open: boolean
  type: ConfirmType
  pending: boolean
  options: ConfirmOptions
}

const confirmState = reactive<ConfirmState>({
  open: false,
  type: 'warning',
  pending: false,
  options: { title: '' },
})

function show(type: ConfirmType, options: ConfirmOptions) {
  confirmState.type = type
  confirmState.options = options
  confirmState.pending = false
  confirmState.open = true
}

/** Internal — used by ConfirmDialogHost.vue. Not part of the public API. */
export function useConfirmState() {
  return confirmState
}

export function useConfirm() {
  return {
    warning: (options: ConfirmOptions) => show('warning', options),
    error: (options: ConfirmOptions) => show('error', options),
    success: (options: ConfirmOptions) => show('success', options),
    info: (options: ConfirmOptions) => show('info', options),
  }
}
