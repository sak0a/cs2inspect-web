// @saka-ui/registry v0.1.0 — composable:useTheme
// Source: saka-ui@0.1.0
// Do not remove this header if you want `saka-ui diff` to work.
import { ref, watch, onMounted, onBeforeUnmount } from 'vue'

export type Theme = 'light' | 'dark' | 'system'

const THEME_KEY = 'saka-ui-theme'

// Cookie helpers
function getCookie(name: string): string | null {
  const v = document.cookie.match('(^|;) ?' + name + '=([^;]*)(;|$)')
  return v ? (v[2] ?? null) : null
}

function setCookie(name: string, value: string, days: number = 365) {
  const d = new Date()
  d.setTime(d.getTime() + 24 * 60 * 60 * 1000 * days)
  document.cookie = name + '=' + value + ';path=/;SameSite=Strict;expires=' + d.toUTCString()
}

// Standalone function to apply theme (can be used outside component context)
export function applyTheme(t: Theme) {
  if (typeof window === 'undefined') return

  const root = document.documentElement
  let isDark = false

  if (t === 'system') {
    isDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  } else {
    isDark = t === 'dark'
  }

  if (isDark) {
    root.classList.add('dark')
  } else {
    root.classList.remove('dark')
  }
}

// Global state to share theme across composable usages
const globalTheme = ref<Theme>((getCookie(THEME_KEY) as Theme) || 'system')

// Watch for changes deeply to ensure consistency
watch(globalTheme, (newTheme) => {
  setCookie(THEME_KEY, newTheme)
  applyTheme(newTheme)
})

export function useTheme() {
  const toggleTheme = () => {
    if (globalTheme.value === 'light') globalTheme.value = 'dark'
    else if (globalTheme.value === 'dark') globalTheme.value = 'system'
    else globalTheme.value = 'light'
  }

  onMounted(() => {
    // Ensure theme is applied on mount (safeguard)
    applyTheme(globalTheme.value)

    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = () => {
      if (globalTheme.value === 'system') {
        applyTheme('system')
      }
    }

    mediaQuery.addEventListener('change', handler)

    onBeforeUnmount(() => {
      mediaQuery.removeEventListener('change', handler)
    })
  })

  return {
    theme: globalTheme,
    toggleTheme,
    setTheme: (t: Theme) => {
      globalTheme.value = t
    },
  }
}

// Initialize theme immediately
export function initTheme() {
  if (typeof window !== 'undefined') {
    applyTheme(globalTheme.value)
  }
}
