<script setup lang="ts">
const { getLocale, switchLocale, getLocales } = useI18n()

// Create dropdown options from locales
const options = computed(() =>
  getLocales().map((loc) => ({
    label: `${getFlag(loc.code)} ${loc.displayName || loc.code}`,
    value: loc.code,
  }))
)

// Current locale
const currentLocale = computed(() => getLocale())

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
</script>

<template>
  <div class="language-switcher">
    <NSelect
      v-model:value="currentLocale"
      :options="options"
      size="medium"
      class="language-select"
      @update:value="handleSelect"
    />
  </div>
</template>

<style scoped>
.language-switcher {
  display: flex;
  align-items: center;
}

.language-select {
  width: 140px;
}

:deep(.n-base-selection-label) {
  display: flex;
  align-items: center;
  gap: 6px;
}

:deep(.n-base-selection-placeholder) {
  display: flex;
  align-items: center;
}
</style>
