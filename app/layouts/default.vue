<script setup lang="ts">
import { buttonColor } from '~/lib/buttonColors'
import { LucideX as XIcon, LucideConstruction as ConstructionIcon } from 'lucide-vue-next'
import { NIcon } from 'naive-ui'
import { steamAuth, type SteamUser } from '@/services/steamAuth'

const selectedKey = ref<string>('')
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

const message = useMessage()
const { t, getLocale, getLocales } = useI18n()

const translatedHomeMenuOptions = computed(() =>
  homeMenuOptions.map((item) => ({
    ...item,
    label: t(item.labelKey),
  }))
)

const translatedWeaponMenuOptions = computed(() =>
  weaponMenuOptions.map((item) => ({
    ...item,
    label: t(item.labelKey),
  }))
)

const translatedEquipmentMenuOptions = computed(() =>
  equipmentMenuOptions.map((item) => ({
    ...item,
    label: t(item.labelKey),
  }))
)

const translatedExtrasMenuOptions = computed(() =>
  extrasMenuOptions.map((item) => ({
    ...item,
    label: t(item.labelKey),
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

function handleSelect(key: string) {
  selectedKey.value = key
  navigateTo(key)
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
const isDevPage = computed(() => route.path === '/dev' && import.meta.env.DEV)

onMounted(async () => {
  // Fetch public app settings
  fetchSettings()

  if (!selectedKey.value) {
    selectedKey.value = window.location.pathname
  }
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
  <SLayout>
    <SLayoutSider v-if="isLoggedIn" data-tutorial="sidebar-nav">
      <nav
        class="flex items-center w-full px-3 gap-2 py-1.5 min-h-[56px]"
        role="navigation"
        :aria-label="String(t('navigation.mainNav')) || 'Main navigation'"
      >
        <!-- Left side: User capsule + Team Toggle -->
        <div class="flex items-center gap-2 flex-shrink-0 flex-1 min-w-0">
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
                style="width: 34px; height: 34px"
              />
            </a>
            <span class="nav-user-name">{{ user.personaName }}</span>
            <div data-tutorial="settings-dropdown">
              <SettingsDropdown
                trigger="hover"
                variant="icon"
                size="md"
                :aria-label="t('navigation.settings') || 'Settings'"
                @logout="showLogoutModal = true"
              />
            </div>
          </div>

          <!-- Global Team Toggle -->
          <TeamToggle />
        </div>

        <!-- Center: All navigation menus -->
        <div class="flex items-center gap-1 flex-shrink-0">
          <!-- Home menu -->
          <NMenu
            mode="horizontal"
            :icon-size="24"
            :options="translatedHomeMenuOptions"
            :value="selectedKey"
            class="text-[14px] top-bar-menu"
            @update:value="handleSelect"
          />

          <!-- Weapons menu -->
          <NMenu
            mode="horizontal"
            :icon-size="36"
            :options="translatedWeaponMenuOptions"
            :value="selectedKey"
            class="text-[14px] top-bar-menu"
            @update:value="handleSelect"
          />

          <!-- Equipment menu -->
          <NMenu
            mode="horizontal"
            :icon-size="36"
            :options="translatedEquipmentMenuOptions"
            :value="selectedKey"
            class="text-[14px] top-bar-menu"
            @update:value="handleSelect"
          />

          <!-- Extras menu -->
          <NMenu
            mode="horizontal"
            :icon-size="24"
            :options="translatedExtrasMenuOptions"
            :value="selectedKey"
            class="text-[14px] top-bar-menu"
            @update:value="handleSelect"
          />
        </div>

        <!-- Right side: Loadout -->
        <div class="flex items-center gap-2 flex-shrink-0 flex-1 min-w-0 justify-end">
          <div v-if="user" data-tutorial="loadout-area">
            <LoadoutSelector />
          </div>
        </div>
      </nav>
    </SLayoutSider>
    <SLayoutContent class="min-w-0 min-h-0 flex-1">
      <!-- Maintenance Mode Overlay -->
      <div
        v-if="isMaintenanceMode"
        class="flex items-center justify-center flex-col h-full text-center px-4"
      >
        <NIcon :size="64" color="#f59e0b" class="mb-4">
          <ConstructionIcon />
        </NIcon>
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
        <SButton
          variant="filled"
          size="lg"
          class="mt-4 login-button px-10 py-6 bg-[#18181c] rounded-md"
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
        </SButton>

        <!-- Copyright footer -->
        <div class="absolute bottom-4 text-gray-500 text-sm">&copy; saka 2025</div>
      </div>
      <div v-else class="h-full flex flex-col">
        <div class="flex-1 relative" style="contain: layout style">
          <!-- Site Announcement Banner -->
          <div v-if="showAnnouncement" class="announcement-banner">
            <span>{{ siteAnnouncement }}</span>
            <SButton
              variant="ghost"
              icon-only
              rounded="full"
              size="xs"
              class="ml-2 flex-shrink-0"
              @click="dismissAnnouncement"
            >
              <template #icon-left>
                <XIcon :size="14" />
              </template>
            </SButton>
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
    </SLayoutContent>

    <!-- Logout Modal (shared across modes) -->
    <NModal
      :show="showLogoutModal"
      preset="card"
      :bordered="false"
      :closable="false"
      :mask-closable="false"
      style="width: 400px"
      :title="String(t('modals.logout.title'))"
    >
      <div class="mb-3">
        <p>{{ t('modals.logout.question') }}</p>
      </div>
      <template #footer>
        <div class="flex justify-end gap-2">
          <SButton variant="light" @click="showLogoutModal = false">
            {{ t('modals.logout.cancel') }}
          </SButton>
          <SButton variant="light" :color="buttonColor.error" @click="handleLogout">
            {{ t('modals.logout.confirm') }}
          </SButton>
        </div>
      </template>
    </NModal>

    <!-- Tutorial Overlay (rendered globally) -->
    <LazyTutorialOverlay />
  </SLayout>
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

.n-menu
  flex-shrink: 0

.menu-item
  position: relative
  display: flex
  flex-direction: column
  align-items: center


.menu-label
  position: absolute
  bottom: -25px
  font-size: 0.75rem
  color: #a0aec0
  opacity: 0
  transform: translateY(-5px)
  transition: opacity 0.2s ease, transform 0.2s ease
  pointer-events: none
  white-space: nowrap

.group:hover .menu-label
  opacity: 1
  transform: translateY(0)

// User capsule in top nav bar
.nav-user-capsule
  display: flex
  align-items: center
  gap: 8px
  padding: 5px 10px
  border-radius: 12px
  background: rgba(255, 255, 255, 0.04)
  border: 1px solid rgba(255, 255, 255, 0.07)
  backdrop-filter: blur(8px)
  -webkit-backdrop-filter: blur(8px)
  flex-shrink: 0

.nav-user-avatar
  flex-shrink: 0
  cursor: pointer
  display: block
  transition: transform 0.2s ease
  &:hover
    transform: scale(1.05)

.nav-user-name
  font-size: 13px
  font-weight: 600
  color: rgba(255, 255, 255, 0.9)
  white-space: nowrap
  overflow: hidden
  text-overflow: ellipsis
  max-width: 120px

// Top bar menu: prevent NMenu from stretching full width
.top-bar-menu
  flex-shrink: 0
  flex-grow: 0
  width: auto !important

  // NMenu horizontal renders with min-width / full-width by default — override
  &.n-menu--horizontal
    width: auto !important

  .n-menu-item
    flex-shrink: 0

  // Animate label visibility on selection change
  .n-menu-item-content-header
    display: block !important
    white-space: nowrap !important
    overflow: hidden !important
    max-width: 0 !important
    opacity: 0 !important
    transition: max-width 0.3s ease, opacity 0.2s ease, margin 0.3s ease !important
    margin-left: 0 !important

  .n-menu-item-content--selected .n-menu-item-content-header
    max-width: 150px !important
    opacity: 1 !important
    margin-left: 8px !important

  .n-menu-item-content:not(.n-menu-item-content--selected) .n-menu-item-content__icon
    margin-right: 0 !important

  .n-menu-item-content__icon
    display: flex !important
    align-items: center !important
    justify-content: center !important

  .n-menu-item-content__arrow
    display: none !important

  // Center menu item content vertically
  .n-menu-item-content
    display: flex !important
    align-items: center !important
    justify-content: center !important
    padding: 0 8px !important

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
