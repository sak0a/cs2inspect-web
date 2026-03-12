<script setup lang="ts">
import {
  LucideLanguages as LanguagesIcon,
  LucideLogOut as LogOutIcon,
  LucideSettings as SettingsIcon,
  LucideBookOpen as TutorialIcon,
  LucideShield as AdminIcon,
  LucideChevronRight as ChevronRightIcon,
} from 'lucide-vue-next'
import type { DropdownTrigger, DropdownPlacement } from '~/components/sui/dropdown/context'
import { getAllTutorials } from '~/utils/tutorialDefinitions'

type ButtonVariant = 'icon' | 'full'

type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

interface Props {
  trigger?: DropdownTrigger
  placement?: DropdownPlacement
  variant?: ButtonVariant
  size?: ButtonSize
  showLogout?: boolean
  showTutorials?: boolean
  showAdminLink?: boolean
  ariaLabel?: string
}

withDefaults(defineProps<Props>(), {
  trigger: 'click',
  placement: 'bottom-start',
  variant: 'icon',
  size: 'sm',
  showLogout: true,
  showTutorials: true,
  showAdminLink: true,
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

// Commented out — replaced by SDropdown with SDropdownGroup + SDropdownItem components
// const languageOptions = computed(() => { ... })
// const tutorialOptions = computed(() => { ... })
// const dropdownOptions = computed(() => { ... })

const tutorialsEnabled = computed(() => {
  return !settingsLoaded.value || isFeatureEnabled('FEATURE_TUTORIALS')
})

const filteredTutorials = computed(() => {
  return getAllTutorials().filter((tutorial) => {
    if (!settingsLoaded.value) return true
    return isFeatureEnabled(tutorialSettingKey(tutorial.id))
  })
})

const getTutorialLabel = (tutorial: { id: string; nameKey: string }) => {
  const completed = tutorialStore.isTutorialCompleted(tutorial.id)
  const label = String(t(tutorial.nameKey) || tutorial.id)
  return completed ? `✓ ${label}` : label
}

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
  <SDropdown :trigger="trigger" :placement="placement" variant="glass" @select="handleSelect">
    <template #trigger>
      <SButton
        v-if="variant === 'icon'"
        variant="ghost"
        icon-only
        rounded="full"
        :size="size"
        :aria-label="ariaLabel"
      >
        <template #icon-left>
          <SettingsIcon :size="18" />
        </template>
      </SButton>

      <SButton
        v-else
        variant="ghost"
        class="w-full justify-start"
        :size="size"
        :aria-label="ariaLabel"
      >
        <template #icon-left>
          <SettingsIcon :size="18" />
        </template>
        {{ buttonLabel }}
      </SButton>
    </template>

    <!-- Language submenu (nested SDropdown) -->
    <SDropdown
      class="block"
      trigger="hover"
      placement="right-start"
      variant="glass"
      :close-on-select="false"
      @select="handleSelect"
    >
      <template #trigger>
        <div
          class="s-dropdown-item relative flex items-center cursor-pointer transition-all duration-150 select-none rounded-lg px-2.5 py-1.5 text-sm text-foreground hover:bg-accent"
        >
          <LanguagesIcon :size="14" class="mr-2.5 shrink-0 text-muted-foreground" />
          <div class="flex-1 min-w-0 truncate">
            {{ String(t('navigation.language') || 'Language') }}
          </div>
          <ChevronRightIcon :size="14" class="ml-4 shrink-0 text-muted-foreground" />
        </div>
      </template>
      <SDropdownItem
        v-for="loc in getLocales()"
        :key="`lang:${loc.code}`"
        :item-key="`lang:${loc.code}`"
        :label="`${getFlag(loc.code)} ${loc.displayName || loc.code}`"
      />
    </SDropdown>

    <!-- Tutorials submenu (nested SDropdown) -->
    <SDropdown
      v-if="showTutorials && tutorialsEnabled && filteredTutorials.length > 0"
      class="block"
      trigger="hover"
      placement="right-start"
      variant="glass"
      :close-on-select="false"
      @select="handleSelect"
    >
      <template #trigger>
        <div
          class="s-dropdown-item relative flex items-center cursor-pointer transition-all duration-150 select-none rounded-lg px-2.5 py-1.5 text-sm text-foreground hover:bg-accent"
        >
          <TutorialIcon :size="14" class="mr-2.5 shrink-0 text-muted-foreground" />
          <div class="flex-1 min-w-0 truncate">
            {{ String(t('tutorial.menuTitle') || 'Tutorials') }}
          </div>
          <ChevronRightIcon :size="14" class="ml-4 shrink-0 text-muted-foreground" />
        </div>
      </template>
      <SDropdownItem
        v-for="tutorial in filteredTutorials"
        :key="`tutorial:${tutorial.id}`"
        :item-key="`tutorial:${tutorial.id}`"
        :label="getTutorialLabel(tutorial)"
        :disabled="tutorialStore.isActive"
      />
    </SDropdown>

    <!-- Admin Panel -->
    <SDropdownItem
      v-if="showAdminLink && adminStore.isAdmin"
      item-key="admin"
      :label="String(t('admin.panelTitle') || 'Admin Panel')"
      :icon="AdminIcon"
    />

    <!-- Logout -->
    <template v-if="showLogout">
      <SDropdownDivider class="bg-gray-500/20" />
      <SDropdownItem
        item-key="logout"
        :label="String(t('auth.logoutButton') || 'Logout')"
        :icon="LogOutIcon"
        danger
      />
    </template>
  </SDropdown>
</template>

<!-- glassmorphism-dropdown CSS removed — SDropdown variant="glass" handles this -->
