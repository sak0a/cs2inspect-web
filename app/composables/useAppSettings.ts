/**
 * Client-side composable for app settings awareness.
 * Fetches public settings from the server and provides typed accessors.
 */

type AppSettings = Record<string, boolean | number | string>

const _settings = ref<AppSettings>({})
const _loaded = ref(false)

export function useAppSettings() {
  async function fetchSettings() {
    try {
      const data = await $fetch<{ settings: AppSettings }>('/api/public/settings')
      _settings.value = data.settings
      _loaded.value = true
    } catch (error) {
      console.error('Failed to fetch app settings:', error)
    }
  }

  function isFeatureEnabled(key: string): boolean {
    const val = _settings.value[key]
    if (val === undefined) return true // default to enabled
    return Boolean(val)
  }

  function getSetting<T = string | number | boolean>(key: string, defaultValue?: T): T {
    const val = _settings.value[key]
    if (val === undefined) return (defaultValue ?? val) as T
    return val as T
  }

  return {
    settings: readonly(_settings),
    loaded: readonly(_loaded),
    fetchSettings,
    isFeatureEnabled,
    getSetting,
  }
}
