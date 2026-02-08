<script setup lang="ts">
import {
  LucideLanguages as LanguagesIcon,
  LucideLogOut as LogOutIcon,
  LucideSettings as SettingsIcon
} from 'lucide-vue-next'
import { NIcon } from 'naive-ui'

type DropdownTrigger = 'click' | 'hover'
type DropdownPlacement =
  | 'top'
  | 'top-start'
  | 'top-end'
  | 'bottom'
  | 'bottom-start'
  | 'bottom-end'
  | 'left'
  | 'left-start'
  | 'left-end'
  | 'right'
  | 'right-start'
  | 'right-end'

type ButtonVariant = 'icon' | 'full'

type ButtonSize = 'small' | 'medium' | 'large'

interface Props {
  trigger?: DropdownTrigger
  placement?: DropdownPlacement
  variant?: ButtonVariant
  size?: ButtonSize
  showLogout?: boolean
  ariaLabel?: string
}

const props = withDefaults(defineProps<Props>(), {
  trigger: 'click',
  placement: 'bottom-start',
  variant: 'icon',
  size: 'small',
  showLogout: true,
  ariaLabel: 'Settings'
})

const emit = defineEmits<{
  (e: 'logout'): void
}>()

const { t, getLocale, switchLocale, getLocales } = useI18n()

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

const currentLocaleDisplay = computed(() => {
  const locale = getLocale()
  const loc = getLocales().find(l => l.code === locale)
  return loc?.displayName || locale
})

const languageOptions = computed(() => {
  const current = getLocale()
  return getLocales().map(loc => {
    const isActive = loc.code === current
    const text = `${getFlag(loc.code)} ${loc.displayName || loc.code}`
    return {
      label: isActive
        ? () => h('span', { style: 'color: var(--primary-color); font-weight: 600' }, text)
        : text,
      key: `lang:${loc.code}`,
      props: isActive ? { class: 'lang-option-active' } : undefined,
    }
  })
})

const dropdownOptions = computed(() => {
  const options: Array<Record<string, any>> = [
    {
      label: String(t('navigation.language') || 'Language'),
      key: 'language',
      icon: () => h(NIcon, { size: 16 }, { default: () => h(LanguagesIcon) }),
      children: languageOptions.value,
    }
  ]

  if (props.showLogout) {
    options.push({ type: 'divider', key: 'divider' })
    options.push({
      label: () => h('span', { style: 'color: #e88080' }, String(t('auth.logoutButton') || 'Logout')),
      key: 'logout',
      icon: () => h(NIcon, { color: '#e88080' }, { default: () => h(LogOutIcon) })
    })
  }

  return options
})

const buttonLabel = computed(() => `${getFlag(getLocale())} ${currentLocaleDisplay.value}`)

function handleLanguageSelect(key: string) {
  const langCookie = useCookie('i18n_locale', {
    maxAge: 60 * 60 * 24 * 365,
    path: '/',
  })
  langCookie.value = key
  switchLocale(key)

  const currentPath = window.location.pathname
  const localePrefix = /^\/(en|de|ru|fr|es|nl)/
  if (localePrefix.test(currentPath)) {
    const newPath = currentPath.replace(localePrefix, '')
    if (newPath !== currentPath) {
      window.location.replace(newPath || '/')
    }
  }
}

function handleSelect(key: string) {
  if (key.startsWith('lang:')) {
    handleLanguageSelect(key.slice(5))
  } else if (key === 'logout') {
    emit('logout')
  }
}
</script>

<template>
  <NDropdown
    :options="dropdownOptions"
    :trigger="trigger"
    :placement="placement"
    :menu-props="() => ({ class: 'glassmorphism-dropdown' })"
    @select="handleSelect"
  >
    <NButton
      v-if="variant === 'icon'"
      quaternary
      circle
      :size="size"
      :aria-label="ariaLabel"
    >
      <template #icon>
        <NIcon :size="18">
          <SettingsIcon />
        </NIcon>
      </template>
    </NButton>

    <NButton
      v-else
      quaternary
      class="w-full justify-start"
      :size="size"
      :aria-label="ariaLabel"
    >
      <template #icon>
        <NIcon :size="18">
          <SettingsIcon />
        </NIcon>
      </template>
      {{ buttonLabel }}
    </NButton>
  </NDropdown>
</template>
