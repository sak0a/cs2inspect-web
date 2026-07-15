<script setup lang="ts">
const { t, getLocale, switchLocale, getLocales } = useI18n()

// Create dropdown options from locales
const options = computed(() =>
  getLocales().map((loc) => ({
    label: `${getFlag(loc.code)} ${loc.displayName || loc.code}`,
    value: loc.code,
  }))
)

// Current locale
const currentLocale = computed(() => getLocale())

// Label shown in the closed trigger (rendered explicitly so it is correct on
// first paint, before the select content has ever been mounted)
const currentLabel = computed(
  () => options.value.find((opt) => opt.value === currentLocale.value)?.label || currentLocale.value
)

// Function to get flag emoji based on locale code
const getFlag = (code: string) => {
  switch (code) {
    case 'en':
      return '🇬🇧'
    case 'de':
      return '🇩🇪'
    case 'ru':
      return '🇷🇺'
    case 'fr':
      return '🇫🇷'
    case 'es':
      return '🇪🇸'
    case 'nl':
      return '🇳🇱'
    default:
      return '🌐'
  }
}

// Handle locale selection without changing URL
const handleSelect = (key: string) => {
  // Save language preference in a cookie
  const langCookie = useCookie('i18n_locale', {
    maxAge: 60 * 60 * 24 * 365, // 1 year
    path: '/',
  })
  langCookie.value = key

  // Switch locale without changing URL
  switchLocale(key)

  // If we're on a localized URL, we need to reload the current page without the language prefix
  const currentPath = window.location.pathname
  const localePrefix = /^\/(en|de|ru|fr|es|nl)/

  if (localePrefix.test(currentPath)) {
    const newPath = currentPath.replace(localePrefix, '')

    // Only navigate if we need to change paths
    if (newPath !== currentPath) {
      // Use replace to avoid adding to browser history
      window.location.replace(newPath || '/')
    }
  }
}

// Reka Select emits AcceptableValue — narrow to the string locale codes we render
function onUpdateLocale(value: unknown) {
  if (typeof value === 'string' && value) {
    handleSelect(value)
  }
}
</script>

<template>
  <div class="flex items-center">
    <Select :model-value="currentLocale" @update:model-value="onUpdateLocale">
      <SelectTrigger class="w-[150px]" :aria-label="String(t('navigation.language'))">
        <SelectValue>{{ currentLabel }}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectItem v-for="opt in options" :key="opt.value" :value="opt.value">
          {{ opt.label }}
        </SelectItem>
      </SelectContent>
    </Select>
  </div>
</template>
