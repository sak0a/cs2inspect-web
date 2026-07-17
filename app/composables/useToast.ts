import { toast } from 'vue-sonner'

/**
 * Drop-in replacement for naive-ui's `useMessage()`.
 *
 * Usage (identical shape to the old code):
 *   const message = useToast()
 *   message.success('Saved', { duration: 3000, closable: true })
 *
 * Each method returns the toast id — pass it to `dismiss(id)` to close a
 * persistent toast (e.g. one created with `loading()` or `duration: 0`).
 */
export interface ToastOptions {
  /** Auto-dismiss delay in ms. `0` keeps the toast open until dismissed (naive-ui semantics). Default 3000 (naive-ui default). */
  duration?: number
  /** Show a close (X) button on the toast */
  closable?: boolean
}

type ToastId = string | number

function normalizeOptions(opts?: ToastOptions, fallbackDuration = 3000) {
  const duration =
    opts?.duration === 0
      ? Number.POSITIVE_INFINITY
      : (opts?.duration ?? fallbackDuration)
  return {
    duration,
    closeButton: opts?.closable ?? false,
  }
}

export function useToast() {
  return {
    success: (content: string, opts?: ToastOptions): ToastId =>
      toast.success(content, normalizeOptions(opts)),
    error: (content: string, opts?: ToastOptions): ToastId =>
      toast.error(content, normalizeOptions(opts)),
    warning: (content: string, opts?: ToastOptions): ToastId =>
      toast.warning(content, normalizeOptions(opts)),
    info: (content: string, opts?: ToastOptions): ToastId =>
      toast.info(content, normalizeOptions(opts)),
    /** Persistent by default (until dismissed) — like a pending operation indicator */
    loading: (content: string, opts?: ToastOptions): ToastId =>
      toast.loading(content, normalizeOptions(opts, Number.POSITIVE_INFINITY)),
    /** Dismiss a specific toast by id, or all toasts when no id is given */
    dismiss: (id?: ToastId) => toast.dismiss(id),
  }
}
