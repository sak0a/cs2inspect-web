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
  () =>
    route.path === '/dev' &&
    (import.meta.env.DEV || config.public.devAuthEnabled === true)
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

// Language dropdown for top bar (compact globe icon button)
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
    <!-- Top nav bar (former SLayoutSider glass strip) -->
    <div v-if="isLoggedIn" class="sticky top-0 z-40 w-full shrink-0" data-tutorial="sidebar-nav">
      <aside class="bg-black/15 text-white backdrop-blur-md">
        <div class="flex w-full flex-row items-center overflow-x-auto overflow-y-hidden">
          <nav
            class="flex items-center w-full min-w-max px-3 gap-2 py-1.5 min-h-[56px]"
            role="navigation"
            :aria-label="String(t('navigation.mainNav')) || 'Main navigation'"
          >
            <!-- Left side: User capsule + Team Toggle -->
            <div class="flex items-center gap-2 shrink-0 flex-1 min-w-fit">
              <!-- User capsule: Avatar + Name + Settings -->
              <div v-if="user" class="nav-user-capsule">
                <a
                  :href="user.profileUrl"
                  target="_blank"
                  rel="noopener noreferrer"
                  :aria-label="String(t('auth.openSteamProfile'))"
                  class="nav-user-avatar"
                >
                  <img
                    class="rounded-full"
                    alt="Steam Avatar"
                    :src="user.avatarFull"
                    style="width: 36px; height: 36px"
                  />
                </a>
                <span class="nav-user-name">{{ user.personaName }}</span>
                <div data-tutorial="settings-dropdown" class="ml-2">
                  <SettingsDropdown
                    variant="icon"
                    size="sm"
                    :aria-label="t('navigation.settings') || 'Settings'"
                    @logout="showLogoutModal = true"
                  />
                </div>
              </div>

              <!-- Global Team Toggle -->
              <TeamToggle />
            </div>

            <!-- Center: All navigation menus -->
            <div class="flex items-center gap-1 shrink-0">
              <!-- Home menu -->
              <MainNav :items="translatedHomeMenuOptions" :icon-size="24" />

              <!-- Weapons menu -->
              <MainNav :items="translatedWeaponMenuOptions" :icon-size="36" />

              <!-- Equipment menu -->
              <MainNav :items="translatedEquipmentMenuOptions" :icon-size="36" />

              <!-- Extras menu -->
              <MainNav :items="translatedExtrasMenuOptions" :icon-size="24" />
            </div>

            <!-- Right side: Loadout -->
            <div class="flex items-center gap-2 shrink-0 flex-1 min-w-fit justify-end ml-6">
              <div v-if="user" data-tutorial="loadout-area">
                <LoadoutSelector />
              </div>
            </div>
          </nav>
        </div>
      </aside>
    </div>

    <main class="flex-1 min-w-0 min-h-0 overflow-visible bg-transparent">
      <!-- Maintenance Mode Overlay -->
      <div
        v-if="isMaintenanceMode"
        class="flex items-center justify-center flex-col h-full text-center px-4"
      >
        <ConstructionIcon :size="64" color="#f59e0b" class="mb-4" />
        <h1 class="text-2xl font-bold mb-2">Under Maintenance</h1>
        <p class="text-gray-400 text-lg">
          The site is currently undergoing maintenance. Please check back later.
        </p>
      </div>

      <div
        v-else-if="!isLoggedIn && !isDevPage"
        class="flex items-center justify-center flex-col text-xl h-full relative"
      >
        <!-- Language Switcher in top-right corner for login screen -->
        <div class="absolute top-4 right-4">
          <LanguageSwitcher />
        </div>

        {{ t('auth.loginRequired') }}
        <Button
          variant="filled"
          size="lg"
          rounded="md"
          class="mt-4 login-button px-10 py-6 bg-[#18181c]"
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

        <!-- Copyright footer -->
        <div class="absolute bottom-4 text-gray-500 text-sm">&copy; saka 2025</div>
      </div>
      <div v-else class="h-full flex flex-col">
        <div class="flex-1 relative" style="contain: layout style">
          <!-- Site Announcement Banner -->
          <div v-if="showAnnouncement" class="announcement-banner">
            <span>{{ siteAnnouncement }}</span>
            <Button
              variant="ghost"
              icon-only
              rounded="full"
              size="xs"
              class="ml-2 shrink-0"
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
            <!-- Footer -->
            <footer class="footer-accent">
              <div class="footer-gradient" />
              <div class="footer-content">
                <span>&copy; saka {{ new Date().getFullYear() }}</span>
                <div class="flex items-center gap-4">
                  <span class="flex items-center gap-1">
                    {{ getFlag(getLocale()) }} {{ currentLocaleDisplay }}
                  </span>
                  <span class="footer-brand">CS2Inspect</span>
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
          <Button variant="light" rounded="md" @click="showLogoutModal = false">
            {{ t('modals.logout.cancel') }}
          </Button>
          <Button variant="light" intent="error" rounded="md" @click="handleLogout">
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
  background: black
  height: 100%
  overflow: hidden

body
  height: 100%
  overflow: hidden

#__nuxt
  height: 100%

// User capsule in top nav bar
.nav-user-capsule
  display: flex
  align-items: center
  gap: 8px
  padding: 3px 4px 3px 3px
  border-radius: 9999px
  height: 40px
  position: relative
  background: linear-gradient(to bottom, rgba(255, 255, 255, 0.12), rgba(255, 255, 255, 0.04))
  border: none !important
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.08), 0 2px 4px rgba(0, 0, 0, 0.25)
  flex-shrink: 0
  transition: box-shadow 200ms ease-in-out

  &::before
    content: ''
    position: absolute
    inset: 0
    border-radius: inherit
    background: linear-gradient(to bottom, rgba(255, 255, 255, 0.10), rgba(255, 255, 255, 0.03))
    opacity: 0
    transition: opacity 200ms ease-in-out
    pointer-events: none

  &:hover
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.1), 0 3px 6px rgba(0, 0, 0, 0.3)

    &::before
      opacity: 1

.nav-user-avatar
  flex-shrink: 0
  cursor: pointer
  display: block
  transition: transform 0.2s ease
  &:hover
    transform: scale(1.05)

.nav-user-name
  font-size: 14px
  font-weight: 600
  color: rgba(255, 255, 255, 0.9)
  white-space: nowrap
  overflow: hidden
  text-overflow: ellipsis
  max-width: 120px

// Announcement banner
.announcement-banner
  display: flex
  align-items: center
  justify-content: center
  padding: 8px 16px
  background: rgba(245, 158, 11, 0.15)
  border-bottom: 1px solid rgba(245, 158, 11, 0.3)
  color: #fbbf24
  font-size: 14px
  text-align: center
  z-index: 5
</style>
