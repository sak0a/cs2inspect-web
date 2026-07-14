// Theme composable — the app is officially dark-only.
//
// The former saka-ui light/dark/system implementation (cookie persistence,
// prefers-color-scheme listener, class toggling) has been removed with the
// UI-library migration. The exported API surface is kept so remaining consumers
// compile unchanged, but the theme is now always 'dark' and `toggleTheme` /
// `setTheme` are no-ops. `<html class="dark">` is set statically via
// nuxt.config `app.head.htmlAttrs`.
import { ref } from 'vue'

export type Theme = 'light' | 'dark' | 'system'

// Dark-only: shared, immutable-by-convention theme state
const globalTheme = ref<Theme>('dark')

// Standalone function to apply theme (kept for API compatibility).
// Always ensures the `.dark` class is present.
export function applyTheme(_t?: Theme) {
  if (typeof window === 'undefined') return
  document.documentElement.classList.add('dark')
}

export function useTheme() {
  return {
    theme: globalTheme,
    /** No-op — the app no longer supports switching away from dark */
    toggleTheme: () => {},
    /** No-op — the app no longer supports switching away from dark */
    setTheme: (_t: Theme) => {},
  }
}

// Initialize theme immediately (kept for API compatibility)
export function initTheme() {
  if (typeof window !== 'undefined') {
    applyTheme(globalTheme.value)
  }
}
