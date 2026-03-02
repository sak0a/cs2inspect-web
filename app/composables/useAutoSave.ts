/**
 * useAutoSave - Composable for automatic saving with debouncing and status tracking
 *
 * @description Provides automatic saving functionality with:
 * - Debounced save to avoid excessive API calls
 * - Save status tracking (idle, saving, saved, error)
 * - Network failure handling with retry
 * - Dirty state detection via deep comparison
 *
 * @version 1.0.0
 * @since 2.0.0
 */

import { ref, computed, watch, onBeforeUnmount, type Ref, type WatchSource } from 'vue'
// deepEqual is auto-imported from shared/utils/

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

/**
 * Save status for UI indicators
 */
export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

/**
 * Options for configuring the useAutoSave composable
 */
export interface AutoSaveOptions {
  /** Debounce delay in milliseconds (default: 1500ms) */
  debounceMs?: number
  /** Number of retry attempts on failure (default: 3) */
  retryAttempts?: number
  /** Delay between retries in milliseconds (default: 1000ms) */
  retryDelayMs?: number
  /** Duration to show "saved" status before returning to idle (default: 2000ms) */
  savedDisplayMs?: number
  /** Callback when save starts */
  onSaveStart?: () => void
  /** Callback when save succeeds */
  onSaveSuccess?: () => void
  /** Callback when save fails after all retries */
  onSaveError?: (error: Error) => void
}

/**
 * Return type for the useAutoSave composable
 */
export interface AutoSaveReturn<T> {
  /** Current save status for UI display */
  status: Ref<SaveStatus>
  /** Whether there are unsaved changes */
  isDirty: Ref<boolean>
  /** Whether currently attempting to save */
  isSaving: Ref<boolean>
  /** Whether there is a pending save operation */
  hasPending: Ref<boolean>
  /** Last error message if save failed */
  errorMessage: Ref<string | null>
  /** Trigger a save operation (will be debounced) */
  triggerSave: (data: T) => void
  /** Immediately save without debouncing */
  saveNow: (data: T) => Promise<void>
  /** Flush any pending debounced save immediately */
  flushPending: () => Promise<void>
  /** Cancel any pending save operation */
  cancelPending: () => void
  /** Retry the last failed save */
  retry: () => Promise<void>
  /** Mark current state as saved (useful after external save) */
  markAsSaved: () => void
  /** Reset status to idle */
  resetStatus: () => void
}

// ============================================================================
// COMPOSABLE IMPLEMENTATION
// ============================================================================

/**
 * Create an auto-save composable instance
 *
 * @param saveFn - The async function to call when saving
 * @param options - Configuration options
 * @returns Reactive state and control functions
 *
 * @example
 * ```typescript
 * const { status, triggerSave, isDirty } = useAutoSave(
 *   async (data) => {
 *     await $fetch('/api/items/weapons/save', { method: 'POST', body: data })
 *   },
 *   { debounceMs: 1500 }
 * )
 *
 * // Watch customization changes
 * watch(customization, (newVal) => {
 *   triggerSave(newVal)
 * }, { deep: true })
 * ```
 */
export function useAutoSave<T>(
  saveFn: (data: T) => Promise<void>,
  options: AutoSaveOptions = {}
): AutoSaveReturn<T> {
  const {
    debounceMs = 1500,
    retryAttempts = 3,
    retryDelayMs = 1000,
    savedDisplayMs = 2000,
    onSaveStart,
    onSaveSuccess,
    onSaveError,
  } = options

  // ============================================================================
  // State
  // ============================================================================

  const status = ref<SaveStatus>('idle')
  const isDirty = ref(false)
  const isSaving = ref(false)
  const errorMessage = ref<string | null>(null)

  // Internal state
  let lastSavedData: T | null = null
  let pendingData: T | null = null
  let savedTimeoutId: ReturnType<typeof setTimeout> | null = null
  const isOnline = ref(typeof navigator !== 'undefined' ? navigator.onLine : true)

  // ============================================================================
  // Utility Functions
  // ============================================================================

  /**
   * Sleep for a given duration
   */
  function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  /**
   * Clear the "saved" status timeout
   */
  function clearSavedTimeout() {
    if (savedTimeoutId) {
      clearTimeout(savedTimeoutId)
      savedTimeoutId = null
    }
  }

  // ============================================================================
  // Core Save Logic
  // ============================================================================

  /**
   * Execute the save operation with retry logic
   */
  async function executeSave(data: T): Promise<void> {
    // Don't save if offline
    if (!isOnline.value) {
      pendingData = data
      status.value = 'error'
      errorMessage.value = 'You are offline. Changes will be saved when you reconnect.'
      return
    }

    status.value = 'saving'
    isSaving.value = true
    errorMessage.value = null
    clearSavedTimeout()
    onSaveStart?.()

    let lastError: Error | null = null

    for (let attempt = 1; attempt <= retryAttempts; attempt++) {
      try {
        await saveFn(data)

        // Success
        lastSavedData = JSON.parse(JSON.stringify(data))
        pendingData = null
        isDirty.value = false
        status.value = 'saved'
        isSaving.value = false
        onSaveSuccess?.()

        // Return to idle after savedDisplayMs
        savedTimeoutId = setTimeout(() => {
          if (status.value === 'saved') {
            status.value = 'idle'
          }
        }, savedDisplayMs)

        return
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error))
        console.warn(`Auto-save attempt ${attempt}/${retryAttempts} failed:`, lastError.message)

        if (attempt < retryAttempts) {
          // Wait before retrying with exponential backoff
          await sleep(retryDelayMs * Math.pow(2, attempt - 1))
        }
      }
    }

    // All retries failed
    status.value = 'error'
    isSaving.value = false
    errorMessage.value = lastError?.message || 'Failed to save changes'
    pendingData = data
    onSaveError?.(lastError || new Error('Unknown error'))
  }

  /**
   * Debounced save function with cancel support
   */
  let debounceTimeoutId: ReturnType<typeof setTimeout> | null = null

  const debouncedSave = {
    call: (data: T) => {
      // Cancel any pending debounce
      if (debounceTimeoutId) {
        clearTimeout(debounceTimeoutId)
      }
      // Schedule new save
      debounceTimeoutId = setTimeout(async () => {
        debounceTimeoutId = null
        await executeSave(data)
      }, debounceMs)
    },
    cancel: () => {
      if (debounceTimeoutId) {
        clearTimeout(debounceTimeoutId)
        debounceTimeoutId = null
      }
    },
  }

  // ============================================================================
  // Public API
  // ============================================================================

  /**
   * Trigger a save operation (debounced)
   */
  function triggerSave(data: T): void {
    // Check if data actually changed
    if (lastSavedData !== null && deepEqual(data, lastSavedData)) {
      return
    }

    isDirty.value = true
    pendingData = data
    debouncedSave.call(data)
  }

  /**
   * Immediately save without debouncing
   */
  async function saveNow(data: T): Promise<void> {
    debouncedSave.cancel()
    await executeSave(data)
  }

  /**
   * Cancel any pending save operation
   */
  function cancelPending(): void {
    debouncedSave.cancel()
    pendingData = null
  }

  /**
   * Flush any pending debounced save immediately
   */
  async function flushPending(): Promise<void> {
    debouncedSave.cancel()
    if (pendingData !== null) {
      await executeSave(pendingData)
    }
  }

  /**
   * Retry the last failed save
   */
  async function retry(): Promise<void> {
    if (pendingData !== null) {
      await executeSave(pendingData)
    }
  }

  /**
   * Mark current state as saved (useful after external save)
   */
  function markAsSaved(): void {
    isDirty.value = false
    pendingData = null
    status.value = 'saved'
    clearSavedTimeout()
    savedTimeoutId = setTimeout(() => {
      if (status.value === 'saved') {
        status.value = 'idle'
      }
    }, savedDisplayMs)
  }

  /**
   * Reset status to idle
   */
  function resetStatus(): void {
    status.value = 'idle'
    isDirty.value = false
    errorMessage.value = null
    pendingData = null
    lastSavedData = null
    clearSavedTimeout()
  }

  // ============================================================================
  // Online/Offline Handling
  // ============================================================================

  if (typeof window !== 'undefined') {
    const handleOnline = () => {
      isOnline.value = true
      // Retry pending save when back online
      if (pendingData !== null) {
        executeSave(pendingData)
      }
    }

    const handleOffline = () => {
      isOnline.value = false
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Cleanup on unmount
    onBeforeUnmount(() => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      clearSavedTimeout()

      // Attempt to save pending changes before unmount
      if (pendingData !== null && isOnline.value) {
        // Fire and forget - we can't await in onBeforeUnmount
        saveFn(pendingData).catch(console.error)
      }
    })
  }

  // ============================================================================
  // Return Public API
  // ============================================================================

  return {
    status,
    isDirty,
    isSaving: computed(() => isSaving.value),
    hasPending: computed(() => pendingData !== null || debounceTimeoutId !== null),
    errorMessage,
    triggerSave,
    saveNow,
    flushPending,
    cancelPending,
    retry,
    markAsSaved,
    resetStatus,
  }
}

// ============================================================================
// UTILITY COMPOSABLE: Watch and Auto-save
// ============================================================================

/**
 * Options for useWatchAutoSave
 */
export interface WatchAutoSaveOptions<T> extends AutoSaveOptions {
  /** Condition to check before auto-saving */
  shouldSave?: (data: T) => boolean
  /** Whether to perform deep watch (default: true) */
  deep?: boolean
  /** Whether to trigger on immediate (default: false) */
  immediate?: boolean
}

/**
 * Convenience composable that combines watch with auto-save
 *
 * @param source - Reactive source to watch
 * @param saveFn - The async function to call when saving
 * @param options - Configuration options
 *
 * @example
 * ```typescript
 * const customization = ref<WeaponConfiguration>(...)
 *
 * const { status } = useWatchAutoSave(
 *   () => customization.value,
 *   async (data) => {
 *     await $fetch('/api/items/weapons/save', { method: 'POST', body: data })
 *   },
 *   {
 *     shouldSave: (data) => data.paintindex > 0,
 *     debounceMs: 1500
 *   }
 * )
 * ```
 */
export function useWatchAutoSave<T>(
  source: WatchSource<T>,
  saveFn: (data: T) => Promise<void>,
  options: WatchAutoSaveOptions<T> = {}
): AutoSaveReturn<T> {
  const { shouldSave = () => true, deep = true, immediate = false, ...autoSaveOptions } = options

  const autoSave = useAutoSave(saveFn, autoSaveOptions)

  watch(
    source,
    (newValue) => {
      if (shouldSave(newValue)) {
        autoSave.triggerSave(newValue)
      }
    },
    { deep, immediate }
  )

  return autoSave
}
