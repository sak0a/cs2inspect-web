<script setup lang="ts">
import {
  LucideLanguages as LanguagesIcon,
  LucideLogOut as LogOutIcon,
  LucideSettings as SettingsIcon,
  LucideBookOpen as TutorialIcon,
  LucideShield as AdminIcon,
} from '@lucide/vue'
import { getAllTutorials } from '~/utils/tutorialDefinitions'

type ButtonVariant = 'icon' | 'full'

type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

// Former sui dropdown types, kept locally so existing call sites still type-check
type DropdownTrigger = 'click' | 'hover' | 'context' | 'manual'
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

interface Props {
  /** Accepted for backward compatibility — the menu is always click-triggered now */
  trigger?: DropdownTrigger
  placement?: DropdownPlacement
  variant?: ButtonVariant
  size?: ButtonSize
  showLogout?: boolean
  showTutorials?: boolean
  showAdminLink?: boolean
  ariaLabel?: string
}

const props = withDefaults(defineProps<Props>(), {
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

// Map the legacy placement prop onto reka side/align
const menuSide = computed(() => props.placement.split('-')[0] as 'top' | 'bottom' | 'left' | 'right')
const menuAlign = computed(() => {
  const suffix = props.placement.split('-')[1]
  return suffix === 'start' ? 'start' : suffix === 'end' ? 'end' : 'center'
})

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

// Language/tutorial items keep the menu open (former :close-on-select="false")
function handleSelectKeepOpen(event: Event, key: string) {
  event.preventDefault()
  handleSelect(key)
}
</script>

<template>
  <DropdownMenu>
    <DropdownMenuTrigger as-child>
      <Button
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
      </Button>

      <Button
        v-else
        variant="ghost"
        rounded="md"
        class="w-full justify-start"
        :size="size"
        :aria-label="ariaLabel"
      >
        <template #icon-left>
          <SettingsIcon :size="18" />
        </template>
        {{ buttonLabel }}
      </Button>
    </DropdownMenuTrigger>

    <DropdownMenuContent
      :side="menuSide"
      :align="menuAlign"
      class="min-w-[180px] rounded-xl border-border/50 bg-background/80 shadow-2xl backdrop-blur-xl"
    >
      <!-- Language submenu -->
      <DropdownMenuSub>
        <DropdownMenuSubTrigger class="cursor-pointer rounded-lg">
          <LanguagesIcon class="size-3.5" />
          <span class="min-w-0 flex-1 truncate">
            {{ String(t('navigation.language') || 'Language') }}
          </span>
        </DropdownMenuSubTrigger>
        <DropdownMenuSubContent
          class="min-w-[180px] rounded-xl border-border/50 bg-background/80 shadow-2xl backdrop-blur-xl"
        >
          <DropdownMenuItem
            v-for="loc in getLocales()"
            :key="`lang:${loc.code}`"
            class="cursor-pointer rounded-lg"
            @select="(e: Event) => handleSelectKeepOpen(e, `lang:${loc.code}`)"
          >
            {{ `${getFlag(loc.code)} ${loc.displayName || loc.code}` }}
          </DropdownMenuItem>
        </DropdownMenuSubContent>
      </DropdownMenuSub>

      <!-- Tutorials submenu -->
      <DropdownMenuSub v-if="showTutorials && tutorialsEnabled && filteredTutorials.length > 0">
        <DropdownMenuSubTrigger class="cursor-pointer rounded-lg">
          <TutorialIcon class="size-3.5" />
          <span class="min-w-0 flex-1 truncate">
            {{ String(t('tutorial.menuTitle') || 'Tutorials') }}
          </span>
        </DropdownMenuSubTrigger>
        <DropdownMenuSubContent
          class="min-w-[180px] rounded-xl border-border/50 bg-background/80 shadow-2xl backdrop-blur-xl"
        >
          <DropdownMenuItem
            v-for="tutorial in filteredTutorials"
            :key="`tutorial:${tutorial.id}`"
            class="cursor-pointer rounded-lg"
            :disabled="tutorialStore.isActive"
            @select="(e: Event) => handleSelectKeepOpen(e, `tutorial:${tutorial.id}`)"
          >
            {{ getTutorialLabel(tutorial) }}
          </DropdownMenuItem>
        </DropdownMenuSubContent>
      </DropdownMenuSub>

      <!-- Admin Panel -->
      <DropdownMenuItem
        v-if="showAdminLink && adminStore.isAdmin"
        class="cursor-pointer rounded-lg"
        @select="handleSelect('admin')"
      >
        <AdminIcon class="size-4" />
        <span>{{ String(t('admin.panelTitle') || 'Admin Panel') }}</span>
      </DropdownMenuItem>

      <!-- Logout -->
      <template v-if="showLogout">
        <DropdownMenuSeparator class="bg-gray-500/20" />
        <DropdownMenuItem
          variant="destructive"
          class="cursor-pointer rounded-lg"
          @select="handleSelect('logout')"
        >
          <LogOutIcon class="size-4" />
          <span>{{ String(t('auth.logoutButton') || 'Logout') }}</span>
        </DropdownMenuItem>
      </template>
    </DropdownMenuContent>
  </DropdownMenu>
</template>
