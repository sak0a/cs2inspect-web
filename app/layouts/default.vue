<script setup lang="ts">
import { LucideX as XIcon, LucideConstruction as ConstructionIcon } from '@lucide/vue'
import { steamAuth, type SteamUser } from '@/services/steamAuth'

const showLogoutModal = ref(false)
const user = ref<SteamUser | null>(null)

// App settings
const { fetchSettings, getSetting, isFeatureEnabled, loaded: settingsLoaded } = useAppSettings()
const announcementDismissed = ref(false)
const dismissedAnnouncementText = ref('')

const siteAnnouncement = computed(() => {
  if (!settingsLoaded.value) return ''
  return getSetting<string>('SITE_ANNOUNCEMENT', '')
})

const showAnnouncement = computed(() => {
  const text = siteAnnouncement.value
  if (!text) return false
  return dismissedAnnouncementText.value === text ? !announcementDismissed.value : true
})

watch(siteAnnouncement, (text) => {
  if (text && dismissedAnnouncementText.value !== text) {
    announcementDismissed.value = false
  }
})

const isMaintenanceMode = computed(() => {
  if (!settingsLoaded.value) return false
  return isFeatureEnabled('MAINTENANCE_MODE')
})

function dismissAnnouncement() {
  announcementDismissed.value = true
  dismissedAnnouncementText.value = siteAnnouncement.value
}

// Cookie-based SSR hint: tells the server which layout branch to render,
// avoiding a layout shift when localStorage user data loads on mount.
const loggedInHint = useCookie('steam_logged_in')
const isLoggedIn = computed(() => !!user.value || !!loggedInHint.value)

const message = useToast()
const { t, getLocale, getLocales } = useI18n()

const currentYear = new Date().getFullYear()

const translatedHomeMenuOptions = computed(() =>
  homeMenuOptions.map((item) => ({
    ...item,
    label: String(t(item.labelKey) ?? item.labelKey),
  }))
)

const translatedWeaponMenuOptions = computed(() =>
  weaponMenuOptions.map((item) => ({
    ...item,
    label: String(t(item.labelKey) ?? item.labelKey),
  }))
)

const translatedEquipmentMenuOptions = computed(() =>
  equipmentMenuOptions.map((item) => ({
    ...item,
    label: String(t(item.labelKey) ?? item.labelKey),
  }))
)

const translatedExtrasMenuOptions = computed(() =>
  extrasMenuOptions.map((item) => ({
    ...item,
    label: String(t(item.labelKey) ?? item.labelKey),
  }))
)

const validateAuth = async () => {
  if (!user.value) return false

  try {
    const data = await $fetch<{ authenticated: boolean }>(
      '/api/auth/validate?steamId=' + user.value?.steamId,
      {
        credentials: 'include',
      }
    )
    return data.authenticated
  } catch (error: unknown) {
    const err = error as { status?: number; statusCode?: number } | undefined
    if (err?.status === 401 || err?.statusCode === 401) {
      message.error(t('auth.automaticallyLoggedOut') as string)
      steamAuth.logout()
      user.value = null
    }
    console.log(error)
    return false
  }
}

function handleLogout() {
  steamAuth.logout()
  user.value = null
  showLogoutModal.value = false
  window.location.href = '/'
}

async function handleLogin() {
  try {
    await steamAuth.login()
  } catch (error) {
    console.error('Login error:', error)
  }
}

const route = useRoute()
const config = useRuntimeConfig()
const isDevPage = computed(
  () => route.path === '/dev' && (import.meta.env.DEV || config.public.devAuthEnabled === true)
)

onMounted(async () => {
  // Fetch public app settings
  fetchSettings()

  try {
    user.value = steamAuth.getSavedUser()
    if (user.value) {
      await validateAuth()
    }
  } catch (error) {
    console.error('Error getting saved user:', error)
  }

  if (window.location.pathname === '/auth/callback') {
    const params = Object.fromEntries(new URLSearchParams(window.location.search))
    const isValid = await steamAuth.validateLogin(params)
    if (isValid) {
      const steamId = steamAuth.extractSteamId(params)
      if (steamId) {
        const userInfo = await steamAuth.getUserInfo(steamId)
        user.value = userInfo
        steamAuth.saveUser(userInfo)
        window.location.href = '/'
      }
    }
  } else {
    user.value = steamAuth.getSavedUser()
  }
})

// Locale display for the footer strip
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
</script>
<template>
  <div class="relative flex h-screen flex-col overflow-auto bg-transparent">
    <!-- Top nav strip -->
    <div v-if="isLoggedIn" class="sticky top-0 z-40 w-full shrink-0" data-tutorial="sidebar-nav">
      <header class="border-b border-border bg-background/80 text-foreground backdrop-blur-md">
        <!-- Desktop strip (lg+): user capsule + settings + team | nav | loadout -->
        <nav
          class="hidden min-h-[60px] w-full items-center gap-3 px-4 py-2 lg:flex"
          role="navigation"
          :aria-label="String(t('navigation.mainNav'))"
        >
          <!-- Left: user capsule + settings + team toggle -->
          <div class="flex min-w-0 flex-1 items-center gap-2">
            <div v-if="user" class="flex min-w-0 shrink items-center gap-1">
              <a
                :href="user.profileUrl"
                target="_blank"
                rel="noopener noreferrer"
                class="flex min-w-0 max-w-[180px] items-center gap-2 rounded-full border border-border bg-[var(--surface-2)] py-1 pl-1 pr-3 text-[13px] font-medium text-foreground outline-none transition-colors duration-[var(--dur-fast)] ease-[var(--ease-out)] hover:border-border-strong focus-visible:ring-2 focus-visible:ring-ring/40"
                :aria-label="String(t('auth.openSteamProfile'))"
              >
                <img
                  class="size-6 shrink-0 rounded-full"
                  alt="Steam Avatar"
                  :src="user.avatarFull"
                />
                <span class="truncate">{{ user.personaName }}</span>
              </a>
              <div data-tutorial="settings-dropdown" class="shrink-0">
                <SettingsDropdown variant="icon" size="sm" @logout="showLogoutModal = true" />
              </div>
            </div>

            <!-- Global Team Toggle -->
            <TeamToggle />
          </div>

          <!-- Center: nav clusters (min-w-0 + hidden-scrollbar overflow as a density safety valve) -->
          <div class="flex min-w-0 shrink items-center gap-1 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <MainNav :items="translatedHomeMenuOptions" :icon-size="24" />
            <MainNav :items="translatedWeaponMenuOptions" :icon-size="36" />
            <MainNav :items="translatedEquipmentMenuOptions" :icon-size="36" />
            <MainNav :items="translatedExtrasMenuOptions" :icon-size="24" />
          </div>

          <!-- Right: loadout -->
          <div class="flex min-w-0 flex-1 items-center justify-end gap-2">
            <div v-if="user" data-tutorial="loadout-area">
              <LoadoutSelector />
            </div>
          </div>
        </nav>

        <!-- Mobile strip (below lg): hamburger + brand; loadout lives in the drawer footer -->
        <div class="flex min-h-[60px] items-center gap-2 px-3 lg:hidden">
          <MobileNav :user="user">
            <template #footer>
              <LoadoutSelector v-if="user" />
            </template>
          </MobileNav>
          <NuxtLink
            to="/"
            class="rounded-[var(--radius-ctl)] font-display text-[15px] font-bold tracking-tight text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
          >
            CS<span class="text-primary">2</span>INSPECT
          </NuxtLink>
        </div>
      </header>
    </div>

    <main class="flex-1 min-w-0 min-h-0 overflow-visible bg-transparent">
      <!-- Maintenance Mode Overlay -->
      <div
        v-if="isMaintenanceMode"
        class="relative flex h-full flex-col items-center justify-center px-6 text-center"
      >
        <div class="absolute top-4 right-4">
          <LanguageSwitcher />
        </div>

        <ConstructionIcon :size="48" class="mb-6 text-amber-400" aria-hidden="true" />
        <h1 class="font-display text-3xl font-bold tracking-tight text-foreground">
          {{ t('maintenance.title') }}
        </h1>
        <p class="mt-3 max-w-md text-[15px] leading-relaxed text-muted-foreground">
          {{ t('maintenance.description') }}
        </p>

        <div class="absolute bottom-4 font-mono text-[11px] text-[var(--text-tertiary)]">
          &copy; saka {{ currentYear }}
        </div>
      </div>

      <!-- Login hero (logged-out branch) -->
      <div
        v-else-if="!isLoggedIn && !isDevPage"
        class="relative flex h-full flex-col items-center justify-center px-6 text-center"
      >
        <!-- Language Switcher in top-right corner for login screen -->
        <div class="absolute top-4 right-4">
          <LanguageSwitcher />
        </div>

        <h1
          class="font-display text-[40px] font-bold leading-none tracking-[-0.02em] text-foreground sm:text-[52px]"
        >
          CS<span class="text-primary">2</span>INSPECT
        </h1>
        <p class="mt-4 max-w-md text-[15px] leading-relaxed text-muted-foreground">
          {{ t('auth.heroTagline') }}
        </p>

        <Button
          variant="default"
          size="lg"
          class="mt-8 shadow-[0_0_36px_-6px_rgba(250,204,21,0.4)]"
          @click="handleLogin"
        >
          <template #icon-left>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="1em"
              height="1em"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path
                d="M12 2a10 10 0 0 0-9.96 9.04l5.37 2.22a2.82 2.82 0 0 1 1.62-.51l2.54-3.69v-.05a3.78 3.78 0 1 1 3.78 3.78h-.09l-3.62 2.58a2.84 2.84 0 0 1-5.65.28L1.2 13.4A10 10 0 1 0 12 2zm-4.89 14.5a2.13 2.13 0 0 0 2.54.89l1.49-.6a2.13 2.13 0 1 0-2.2-3.58l-1.53.63a2.13 2.13 0 0 0-.3 2.66zm10.52-7.47a2.52 2.52 0 1 0-2.52-2.52 2.52 2.52 0 0 0 2.52 2.52z"
              />
            </svg>
          </template>
          {{ t('auth.loginButton') }}
        </Button>

        <!-- Copyright line -->
        <div class="absolute bottom-4 font-mono text-[11px] text-[var(--text-tertiary)]">
          &copy; saka {{ currentYear }}
        </div>
      </div>
      <div v-else class="h-full flex flex-col">
        <div class="flex-1 relative" style="contain: layout style">
          <!-- Site Announcement Banner -->
          <div
            v-if="showAnnouncement"
            class="relative z-[5] flex items-center justify-center gap-2 border-b border-amber-500/25 bg-amber-500/10 px-4 py-2 text-center font-mono text-xs text-amber-200"
          >
            <span>{{ siteAnnouncement }}</span>
            <Button
              variant="ghost"
              size="icon-xs"
              class="shrink-0 text-amber-200 hover:text-amber-100"
              :aria-label="String(t('general.dismiss'))"
              @click="dismissAnnouncement"
            >
              <template #icon-left>
                <XIcon :size="14" />
              </template>
            </Button>
          </div>
          <div class="flex flex-col min-h-full">
            <div class="flex-1">
              <slot />
            </div>
            <!-- Footer: quiet hairline strip -->
            <footer class="mt-auto border-t border-border">
              <div
                class="flex items-center justify-between gap-4 px-4 py-2.5 font-mono text-[11px] text-[var(--text-tertiary)]"
              >
                <span>&copy; saka {{ currentYear }}</span>
                <div class="flex items-center gap-4">
                  <span class="flex items-center gap-1">
                    {{ getFlag(getLocale()) }} {{ currentLocaleDisplay }}
                  </span>
                  <span class="uppercase tracking-[0.12em]">CS2INSPECT</span>
                </div>
              </div>
            </footer>
          </div>
        </div>
      </div>
    </main>

    <!-- Logout Modal (shared across modes) -->
    <AppModal
      v-model:visible="showLogoutModal"
      :closable="false"
      :mask-closable="false"
      max-width="400px"
      :title="String(t('modals.logout.title'))"
    >
      <div class="mb-3">
        <p>{{ t('modals.logout.question') }}</p>
      </div>
      <template #footer>
        <div class="flex justify-end gap-2">
          <Button variant="secondary" @click="showLogoutModal = false">
            {{ t('modals.logout.cancel') }}
          </Button>
          <Button variant="destructive" @click="handleLogout">
            {{ t('modals.logout.confirm') }}
          </Button>
        </div>
      </template>
    </AppModal>

    <!-- Tutorial Overlay (rendered globally) -->
    <LazyTutorialOverlay />
  </div>
</template>

<style lang="sass">
html
  background: #070708
  height: 100%
  overflow: hidden

body
  height: 100%
  overflow: hidden

#__nuxt
  height: 100%
</style>
