<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { locale, locales } = useI18n()
const localeCodes = computed(() => {
  return (locales.value as any[]).map(l => l.code)
})

const changeLocale = (code: string) => {
  locale.value = code
}
</script>

<template>
  <NDropdown trigger="hover" :options="localeCodes.map(code => ({
      label: (locales.find(l => l.code === code) as any).name,
      key: code
    }))" @select="changeLocale">
    <NButton text>
      {{ (locales.find(l => l.code === locale) as any).name }}
      <template #icon>
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
          <path d="M2 12h20"/>
        </svg>
      </template>
    </NButton>
  </NDropdown>
</template>