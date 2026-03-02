<script setup lang="ts">
import {
  LucideLanguages as LanguagesIcon,
  LucideLogOut as LogOutIcon,
  LucideSettings as SettingsIcon,
  LucideBookOpen as TutorialIcon,
  LucideShield as AdminIcon,
} from 'lucide-vue-next'
import { NIcon } from 'naive-ui'
import { getAllTutorials } from '~/utils/tutorialDefinitions'

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
  ariaLabel: 'Settings',
})

const emit = defineEmits<{
  (e: 'logout'): void
}>()

const { t, getLocale, switchLocale, getLocales } = useI18n()
const tutorialStore = useTutorialStore()
const adminStore = useAdminStore()
const { isFeatureEnabled, loaded: settingsLoaded } = useAppSettings()

// Check admin status once on mount
onMounted(() => {
  adminStore.checkAdminStatus()
})

// Map tutorial id (kebab-case) to settings key (SCREAMING_SNAKE_CASE)
function tutorialSettingKey(id: string): string {
  return 'TUTORIAL_' + id.toUpperCase().replace(/-/g, '_')
}

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
  const loc = getLocales().find((l) => l.code === locale)
  return loc?.displayName || locale
})

const languageOptions = computed(() => {
  const current = getLocale()
  return getLocales().map((loc) => {
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

const tutorialOptions = computed(() => {
  return getAllTutorials()
    .filter((tutorial) => {
      // Filter out tutorials whose individual setting is disabled
      if (!settingsLoaded.value) return true
      return isFeatureEnabled(tutorialSettingKey(tutorial.id))
    })
    .map((tutorial) => {
      const completed = tutorialStore.isTutorialCompleted(tutorial.id)
      const label = String(t(tutorial.nameKey) || tutorial.id)
      const displayLabel = completed ? `✓ ${label}` : label
      return {
        label: completed
          ? () => h('span', { style: 'color: #22c55e' }, displayLabel)
          : displayLabel,
        key: `tutorial:${tutorial.id}`,
        disabled: tutorialStore.isActive,
      }
    })
})

const dropdownOptions = computed(() => {
  const options: Array<Record<string, unknown>> = [
    {
      label: String(t('navigation.language') || 'Language'),
      key: 'language',
      icon: () => h(NIcon, { size: 16 }, { default: () => h(LanguagesIcon) }),
      children: languageOptions.value,
    },
  ]

  // Only show tutorials submenu when the feature is enabled and there are tutorials
  const tutorialsEnabled = !settingsLoaded.value || isFeatureEnabled('FEATURE_TUTORIALS')
  if (tutorialsEnabled && tutorialOptions.value.length > 0) {
    options.push({
      label: String(t('tutorial.menuTitle') || 'Tutorials'),
      key: 'tutorials',
      icon: () => h(NIcon, { size: 16 }, { default: () => h(TutorialIcon) }),
      children: tutorialOptions.value,
    })
  }

  if (adminStore.isAdmin) {
    options.push({
      label: String(t('admin.panelTitle') || 'Admin Panel'),
      key: 'admin',
      icon: () => h(NIcon, { size: 16 }, { default: () => h(AdminIcon) }),
    })
  }

  if (props.showLogout) {
    options.push({ type: 'divider', key: 'divider' })
    options.push({
      label: () =>
        h('span', { style: 'color: #e88080' }, String(t('auth.logoutButton') || 'Logout')),
      key: 'logout',
      icon: () => h(NIcon, { color: '#e88080' }, { default: () => h(LogOutIcon) }),
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
  } else if (key.startsWith('tutorial:')) {
    tutorialStore.startTutorial(key.slice(9))
  } else if (key === 'admin') {
    navigateTo('/admin')
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
    <NButton v-if="variant === 'icon'" quaternary circle :size="size" :aria-label="ariaLabel">
      <template #icon>
        <NIcon :size="18">
          <SettingsIcon />
        </NIcon>
      </template>
    </NButton>

    <NButton v-else quaternary class="w-full justify-start" :size="size" :aria-label="ariaLabel">
      <template #icon>
        <NIcon :size="18">
          <SettingsIcon />
        </NIcon>
      </template>
      {{ buttonLabel }}
    </NButton>
  </NDropdown>
</template>

<style lang="sass">
.glassmorphism-dropdown
  background-color: var(--glass-bg-primary, rgba(16, 16, 16, 0.6)) !important
  backdrop-filter: blur(16px) !important
  -webkit-backdrop-filter: blur(16px) !important
  border: 1px solid var(--glass-border, rgba(255, 255, 255, 0.08)) !important
  border-radius: 12px !important
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5) !important

.glassmorphism-dropdown .n-dropdown-option
  color: white !important
  border-radius: 8px !important
  margin: 0 4px !important

.glassmorphism-dropdown .n-dropdown-option .n-dropdown-option-body::before
  background-color: transparent !important

.glassmorphism-dropdown .n-dropdown-option:hover
  background-color: rgba(255, 255, 255, 0.1) !important

.lang-option-active .n-dropdown-option-body::before
  background-color: rgba(99, 226, 183, 0.1) !important
</style>
