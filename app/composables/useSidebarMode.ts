type SidebarMode = 'left' | 'top'

const hoverExpanded = ref(false)

// Track whether initial render is done (suppress transitions until then)
const isReady = ref(false)

let enterTimer: ReturnType<typeof setTimeout> | null = null
let leaveTimer: ReturnType<typeof setTimeout> | null = null

export function useSidebarMode() {
  // Use cookies so SSR renders the correct layout immediately (no CLS)
  const sidebarCollapsedCookie = useCookie<boolean>('sidebar-collapsed', {
    default: () => true,
    maxAge: 60 * 60 * 24 * 365,
    path: '/',
  })
  const sidebarModeCookie = useCookie<SidebarMode>('sidebar-mode', {
    default: () => 'left',
    maxAge: 60 * 60 * 24 * 365,
    path: '/',
  })

  const sidebarCollapsed = ref(sidebarCollapsedCookie.value)
  const sidebarMode = ref<SidebarMode>(sidebarModeCookie.value)

  const isEffectivelyExpanded = computed(() => !sidebarCollapsed.value || hoverExpanded.value)

  function toggleCollapsed() {
    sidebarCollapsed.value = !sidebarCollapsed.value
    hoverExpanded.value = false
  }

  function toggleMode() {
    sidebarMode.value = sidebarMode.value === 'left' ? 'top' : 'left'
    hoverExpanded.value = false
  }

  function onMouseEnter() {
    if (!sidebarCollapsed.value) return
    if (leaveTimer) {
      clearTimeout(leaveTimer)
      leaveTimer = null
    }
    enterTimer = setTimeout(() => {
      hoverExpanded.value = true
    }, 200)
  }

  function onMouseLeave() {
    if (enterTimer) {
      clearTimeout(enterTimer)
      enterTimer = null
    }
    leaveTimer = setTimeout(() => {
      hoverExpanded.value = false
    }, 300)
  }

  // Migrate localStorage values to cookies (one-time), then sync cookies
  if (import.meta.client) {
    onMounted(() => {
      // Migrate legacy localStorage values
      const savedCollapsed = localStorage.getItem('sidebar-collapsed')
      if (savedCollapsed !== null) {
        sidebarCollapsed.value = savedCollapsed !== 'false'
        localStorage.removeItem('sidebar-collapsed')
      }
      const savedMode = localStorage.getItem('sidebar-mode')
      if (savedMode === 'left' || savedMode === 'top') {
        sidebarMode.value = savedMode
        localStorage.removeItem('sidebar-mode')
      }

      // Enable transitions after initial render is painted
      requestAnimationFrame(() => {
        isReady.value = true
      })
    })

    // Sync reactive state back to cookies
    watch(sidebarCollapsed, (val) => {
      sidebarCollapsedCookie.value = val
    })

    watch(sidebarMode, (val) => {
      sidebarModeCookie.value = val
    })
  }

  return {
    sidebarCollapsed,
    sidebarMode,
    hoverExpanded,
    isEffectivelyExpanded,
    isReady,
    toggleCollapsed,
    toggleMode,
    onMouseEnter,
    onMouseLeave,
  }
}
