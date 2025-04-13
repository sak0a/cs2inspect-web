<script setup>
import { NDropdown } from 'naive-ui'
import { useNuxtApp, computed, useCookie } from '#imports'

const { getLocale, switchLocale, getLocales, t } = useI18n()

// Create dropdown options from locales
const options = computed(() =>
    getLocales().map(loc => ({
      key: loc.code,
      label: loc.displayName || loc.code
    }))
)

// Function to get flag emoji based on locale code
const getFlag = (code) => {
  switch (code) {
    case 'en':
      return '🇬🇧'
    case 'de':
      return '🇩🇪'
    case 'ru':
      return '🇷🇺'
    default:
      return '🌐'
  }
}

// Handle locale selection without changing URL
const handleSelect = (key) => {
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
  const localePrefix = /^\/(en|de|ru)/

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
  <NDropdown
      trigger="hover"
      :options="options"
      @select="handleSelect"
  >
    <div class="flex items-center space-x-1 cursor-pointer px-2 py-1 rounded hover:bg-gray-700">
      <span class="flag-icon">
        {{ getFlag(getLocale()) }}
      </span>
      <span>
        {{ getLocales().find(loc => loc.code === getLocale())?.displayName || getLocale() }}
      </span>
    </div>
  </NDropdown>
</template>

<style scoped>
.flag-icon {
  font-size: 1.2em;
}
</style>