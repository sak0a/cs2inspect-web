<script setup lang="ts">
import { LucideLogOut as LogOutIcon, LucidePanelLeft as PanelLeftIcon, LucidePanelTop as PanelTopIcon, LucideLanguages as LanguagesIcon, LucideSettings as SettingsIcon } from 'lucide-vue-next'
import { NIcon } from 'naive-ui'
import { steamAuth, type SteamUser } from '@/services/steamAuth'

const selectedKey = ref<string>('')
const showLogoutModal = ref(false)
const user = ref<SteamUser | null>(null)

const {
  sidebarCollapsed,
  sidebarMode,
  hoverExpanded,
  isEffectivelyExpanded,
  isReady,
  toggleMode,
  onMouseEnter,
  onMouseLeave,
} = useSidebarMode()

// Cookie-based SSR hint: tells the server which layout branch to render,
// avoiding a layout shift when localStorage user data loads on mount.
const loggedInHint = useCookie('steam_logged_in')
const isLoggedIn = computed(() => !!user.value || !!loggedInHint.value)

const message = useMessage()
const { t, getLocale, switchLocale, getLocales } = useI18n()

const translatedHomeMenuOptions = computed(() =>
    homeMenuOptions.map(item => ({
      ...item,
      label: t(item.labelKey)
    }))
)

const translatedWeaponMenuOptions = computed(() =>
    weaponMenuOptions.map(item => ({
      ...item,
      label: t(item.labelKey)
    }))
)

const translatedEquipmentMenuOptions = computed(() =>
    equipmentMenuOptions.map(item => ({
      ...item,
      label: t(item.labelKey)
    }))
)

const translatedExtrasMenuOptions = computed(() =>
    extrasMenuOptions.map(item => ({
      ...item,
      label: t(item.labelKey)
    }))
)

const validateAuth = async () => {
  if (!user.value) return false

  try {
    const data = await $fetch<{ authenticated: boolean }>('/api/auth/validate?steamId=' + user.value?.steamId, {
      credentials: 'include'
    })
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

// Computed: use expanded state for menu collapsed prop
const menuCollapsed = computed(() => !isEffectivelyExpanded.value)

// Language dropdown for top bar (compact globe icon button)
const getFlag = (code: string) => {
  switch (code) {
    case 'en': return '🇬🇧'
    case 'de': return '🇩🇪'
    case 'ru': return '🇷🇺'
    case 'fr': return '🇫🇷'
    case 'es': return '🇪🇸'
    case 'nl': return '🇳🇱'
    default: return '🌐'
  }
}

const languageDropdownOptions = computed(() => {
  const current = getLocale()
  return getLocales().map(loc => {
    const isActive = loc.code === current
    const text = `${getFlag(loc.code)} ${loc.displayName || loc.code}`
    return {
      label: isActive
        ? () => h('span', { style: 'color: var(--n-option-text-color-active, #63e2b7); font-weight: 600' }, text)
        : text,
      key: loc.code,
      props: isActive ? { class: 'lang-option-active' } : undefined,
    }
  })
})

const currentLocaleDisplay = computed(() => {
  const locale = getLocale()
  const loc = getLocales().find(l => l.code === locale)
  return loc?.displayName || locale
})

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

// Settings dropdown for top bar (combines language + logout + future settings)
const settingsDropdownOptions = computed(() => {
  const current = getLocale()
  const langChildren = getLocales().map(loc => {
    const isActive = loc.code === current
    const text = `${getFlag(loc.code)} ${loc.displayName || loc.code}`
    return {
      label: isActive
        ? () => h('span', { style: 'color: var(--n-option-text-color-active, #63e2b7); font-weight: 600' }, text)
        : text,
      key: `lang:${loc.code}`,
      props: isActive ? { class: 'lang-option-active' } : undefined,
    }
  })

  return [
    {
      label: String(t('navigation.language') || 'Language'),
      key: 'language',
      icon: () => h(NIcon, { size: 16 }, { default: () => h(LanguagesIcon) }),
      children: langChildren,
    },
    { type: 'divider' as const, key: 'd1' },
    {
      label: () => h('span', { style: 'color: #e88080' }, String(t('auth.logoutButton'))),
      key: 'logout',
      icon: () => h(NIcon, { color: '#e88080' }, { default: () => h(LogOutIcon) }),
    },
  ]
})

function handleSettingsSelect(key: string) {
  if (key.startsWith('lang:')) {
    handleLanguageSelect(key.slice(5))
  } else if (key === 'logout') {
    showLogoutModal.value = true
  }
}
</script>
<template>
  <SLayout :has-sider="sidebarMode === 'left'" :sider-position="sidebarMode">
      <SLayoutSider
          v-if="isLoggedIn"
          v-model:collapsed="sidebarCollapsed"
          :collapsed-width="64"
          :width="200"
          show-trigger
          :mode="sidebarMode"
          
          :hover-expanded="hoverExpanded"
          :enable-transitions="isReady"
          @mouseenter="onMouseEnter"
          @mouseleave="onMouseLeave"
      >
        <!-- LEFT MODE -->
        <template v-if="sidebarMode === 'left'">
          <div class="grid grid-rows-[auto_1fr_auto] h-full">
            <!-- Steam Account Menu Section -->
            <div :class="menuCollapsed ? 'p-2' : 'p-4'" class="flex flex-col items-center">
              <div v-if="user" class="flex items-center flex-col">
                <a
                    :href="user.profileUrl"
                    target="_blank"
                    rel="noopener noreferrer"
                    :aria-label="t('auth.openSteamProfile') as string"
                    :title="t('auth.openSteamProfile') as string"
                    class="avatar-link"
                >
                  <img
                      class="rounded-full"
                      :class="isReady ? 'transition-all duration-200' : ''"
                      alt="Steam Avatar"
                      :src="user.avatarFull"
                      :style="{ width: menuCollapsed ? '40px' : '100px', height: menuCollapsed ? '40px' : '100px' }"
                  >
                </a>
                <div v-if="!menuCollapsed" class="mt-3 text-center">
                  <span class="font-bold text-[15px]">{{ user.personaName }}</span>
                </div>
              </div>
              <div v-else class="flex items-center flex-col">
                <div
                    :style="{ width: menuCollapsed ? '40px' : '100px', height: menuCollapsed ? '40px' : '100px', borderRadius: '50%' }"
                    class="bg-gray-800 animate-pulse"
                    :class="isReady ? 'transition-all duration-200' : ''"
                />
                <div v-if="!menuCollapsed" class="mt-3">
                  <div class="h-4 w-20 bg-gray-800 rounded animate-pulse" />
                </div>
              </div>
            </div>

            <!-- Middle: Menu Sections with equal spacing -->
            <div class="flex flex-col justify-between flex-1">
              <!-- Home Menu Section -->
              <div class="flex flex-col">
                <NMenu
                    :collapsed="menuCollapsed"
                    :collapsed-icon-size="26"
                    :icon-size="26"
                    :indent="28"
                    :options="translatedHomeMenuOptions"
                    :value="selectedKey"
                    class="text-[15px]"
                    @update:value="handleSelect"
                />
              </div>

              <!-- Weapon Menu Section -->
              <div class="flex flex-col">
                <div v-if="!menuCollapsed" class="px-4">
                  <span class="text-xs font-bold text-gray-400">{{ t('navigation.weapons') }}</span>
                </div>
                <div v-else class="mx-3 my-1 border-t border-gray-700" />
                <NMenu
                    :collapsed="menuCollapsed"
                    :collapsed-icon-size="36"
                    :icon-size="45"
                    :indent="24"
                    :options="translatedWeaponMenuOptions"
                    :value="selectedKey"
                    class="text-[15px]"
                    @update:value="handleSelect"
                />
              </div>

              <!-- Melee Menu Section -->
              <div class="flex flex-col">
                <div v-if="!menuCollapsed" class="px-4">
                  <span class="text-xs font-bold text-gray-400">{{ t('navigation.melee') }}</span>
                </div>
                <div v-else class="mx-3 my-1 border-t border-gray-700" />
                <NMenu
                    :collapsed="menuCollapsed"
                    :collapsed-icon-size="36"
                    :icon-size="45"
                    :indent="24"
                    :options="translatedEquipmentMenuOptions"
                    :value="selectedKey"
                    class="text-[15px]"
                    @update:value="handleSelect"
                />
              </div>

              <!-- Extras Menu Section -->
              <div class="flex flex-col">
                <div v-if="!menuCollapsed" class="px-4">
                  <span class="text-xs font-bold text-gray-400">{{ t('navigation.extras') }}</span>
                </div>
                <div v-else class="mx-3 my-1 border-t border-gray-700" />
                <NMenu
                    :collapsed="menuCollapsed"
                    :collapsed-icon-size="26"
                    :icon-size="30"
                    :indent="24"
                    :options="translatedExtrasMenuOptions"
                    :value="selectedKey"
                    class="text-[15px]"
                    @update:value="handleSelect"
                />
              </div>
            </div>

            <!-- Bottom: Actions Section -->
            <div :class="menuCollapsed ? 'px-2 py-2' : 'p-4'">
              <div v-if="!menuCollapsed" class="mb-2">
                <span class="text-xs font-bold text-gray-400">{{ t('navigation.actions') }}</span>
              </div>
              <div v-else class="mx-1 mb-2 border-t border-gray-700" />
              <div class="flex flex-col gap-2 items-center">
                <!-- Logout button -->
                <NTooltip v-if="menuCollapsed" placement="right">
                  <template #trigger>
                    <NButton
                        secondary
                        type="error"
                        circle
                        @click="showLogoutModal = true"
                    >
                      <template #icon>
                        <NIcon><LogOutIcon/></NIcon>
                      </template>
                    </NButton>
                  </template>
                  {{ t('auth.logoutButton') }}
                </NTooltip>
                <NButton
                    v-else
                    secondary
                    type="error"
                    class="w-full"
                    @click="showLogoutModal = true"
                >
                  <template #icon>
                    <NIcon><LogOutIcon/></NIcon>
                  </template>
                  {{ t('auth.logoutButton') }}
                </NButton>

                <!-- Language switcher + Mode toggle row -->
                <div v-if="menuCollapsed" class="flex flex-col gap-2 items-center">
                  <NDropdown
                      :options="languageDropdownOptions"
                      trigger="click"
                      :menu-props="() => ({ class: 'glassmorphism-dropdown' })"
                      placement="right-start"
                      @select="handleLanguageSelect"
                  >
                    <NTooltip placement="right">
                      <template #trigger>
                        <NButton
                            quaternary
                            circle
                            size="small"
                        >
                          <template #icon>
                            <NIcon size="18"><LanguagesIcon/></NIcon>
                          </template>
                        </NButton>
                      </template>
                      {{ currentLocaleDisplay }}
                    </NTooltip>
                  </NDropdown>

                  <NTooltip placement="right">
                    <template #trigger>
                      <NButton
                          quaternary
                          circle
                          size="small"
                          @click="toggleMode"
                      >
                        <template #icon>
                          <NIcon size="18"><PanelTopIcon/></NIcon>
                        </template>
                      </NButton>
                    </template>
                    Switch to top bar
                  </NTooltip>
                </div>
                <div v-else class="flex gap-2 w-full">
                  <NDropdown
                      :options="languageDropdownOptions"
                      trigger="click"
                      :menu-props="() => ({ class: 'glassmorphism-dropdown' })"
                      placement="right-start"
                      @select="handleLanguageSelect"
                  >
                    <NButton
                        quaternary
                        class="flex-1"
                        size="small"
                    >
                      <template #icon>
                        <NIcon size="18"><LanguagesIcon/></NIcon>
                      </template>
                      {{ currentLocaleDisplay }}
                    </NButton>
                  </NDropdown>

                  <NTooltip placement="right">
                    <template #trigger>
                      <NButton
                          quaternary
                          circle
                          size="small"
                          @click="toggleMode"
                      >
                        <template #icon>
                          <NIcon size="18"><PanelTopIcon/></NIcon>
                        </template>
                      </NButton>
                    </template>
                    Switch to top bar
                  </NTooltip>
                </div>
              </div>
            </div>
          </div>
        </template>

        <!-- TOP MODE -->
        <template v-else>
          <nav class="flex items-center w-full px-3 gap-2 py-1.5 min-h-[52px]" role="navigation" :aria-label="String(t('navigation.mainNav')) || 'Main navigation'">
            <!-- Left side: Avatar + Settings -->
            <div class="flex items-center gap-2 flex-shrink-0 flex-1 min-w-0">
              <!-- Avatar -->
              <NTooltip v-if="user" placement="bottom">
                <template #trigger>
                  <a
                      :href="user.profileUrl"
                      target="_blank"
                      rel="noopener noreferrer"
                      :aria-label="String(t('auth.openSteamProfile'))"
                      class="avatar-link flex-shrink-0"
                  >
                    <img
                        class="rounded-full"
                        alt="Steam Avatar"
                        :src="user.avatarFull"
                        style="width: 34px; height: 34px"
                    >
                  </a>
                </template>
                {{ user.personaName }}
              </NTooltip>

              <!-- Settings (language, logout, future settings) -->
              <NDropdown
                  :options="settingsDropdownOptions"
                  trigger="hover"
                  :menu-props="() => ({ class: 'glassmorphism-dropdown' })"
                  @select="handleSettingsSelect"
              >
                <NButton
                    quaternary
                    circle
                    size="medium"
                    :aria-label="t('navigation.settings') || 'Settings'"
                >
                  <template #icon>
                    <NIcon size="20"><SettingsIcon/></NIcon>
                  </template>
                </NButton>
              </NDropdown>
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

            <!-- Right side: Loadout, Mode toggle -->
            <div class="flex items-center gap-2 flex-shrink-0 flex-1 min-w-0 justify-end">
              <LoadoutSelector v-if="user" />

              <!-- Mode toggle -->
              <NTooltip placement="bottom">
                <template #trigger>
                  <NButton
                      quaternary
                      circle
                      size="medium"
                      :aria-label="t('navigation.switchToSidebar') || 'Switch to sidebar'"
                      @click="toggleMode"
                  >
                    <template #icon>
                      <NIcon size="20"><PanelLeftIcon/></NIcon>
                    </template>
                  </NButton>
                </template>
                Switch to sidebar
              </NTooltip>
            </div>
          </nav>
        </template>
      </SLayoutSider>
      <SLayoutContent :sider-position="sidebarMode" class="min-w-0 min-h-0 flex-1">

        <div v-if="!isLoggedIn && !isDevPage" class="flex items-center justify-center flex-col text-xl h-full relative">
          <!-- Language Switcher in top-right corner for login screen -->
          <div class="absolute top-4 right-4">
            <LanguageSwitcher />
          </div>

          {{ t('auth.loginRequired') }}
          <NButton size="large" class="mt-4 login-button px-10 py-6 bg-[#18181c] rounded-md" @click="handleLogin">
            <template #icon>
              <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 0 0-9.96 9.04l5.37 2.22a2.82 2.82 0 0 1 1.62-.51l2.54-3.69v-.05a3.78 3.78 0 1 1 3.78 3.78h-.09l-3.62 2.58a2.84 2.84 0 0 1-5.65.28L1.2 13.4A10 10 0 1 0 12 2zm-4.89 14.5a2.13 2.13 0 0 0 2.54.89l1.49-.6a2.13 2.13 0 1 0-2.2-3.58l-1.53.63a2.13 2.13 0 0 0-.3 2.66zm10.52-7.47a2.52 2.52 0 1 0-2.52-2.52 2.52 2.52 0 0 0 2.52 2.52z"/></svg>
            </template>
            {{ t('auth.loginButton') }}
          </NButton>

          <!-- Copyright footer -->
          <div class="absolute bottom-4 text-gray-500 text-sm">
            &copy; saka 2025
          </div>
        </div>
        <div v-else class="h-full flex flex-col">
          <div class="flex-1 relative" :class="sidebarMode === 'left' ? 'overflow-auto' : ''" style="contain: layout style">
            <!-- Secondary Menu — absolutely positioned so content flows underneath -->
            <div v-if="sidebarMode === 'left'" class="p-2 sticky top-0 z-10 pointer-events-none" style="background: rgba(0, 0, 0, 0.15); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px)">
              <div class="flex justify-end items-end">
                <div class="flex items-center gap-6">
                  <div v-if="user" class="menu-item group pointer-events-auto">
                    <LoadoutSelector />
                  </div>
                </div>
              </div>
            </div>
            <!-- Secondary Menu End -->
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
            <NButton secondary type="default" @click="showLogoutModal = false">
              {{ t('modals.logout.cancel') }}
            </NButton>
            <NButton secondary type="error" @click="handleLogout" >
              {{ t('modals.logout.confirm') }}
            </NButton>
          </div>
        </template>
      </NModal>
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

  &.n-menu--collapsed .n-menu-item .n-menu-item-content
    padding-left: 0 !important
    padding-right: 0 !important
    display: flex !important
    justify-content: center !important

    .n-menu-item-content__icon
      margin-right: 0 !important

    .n-menu-item-content-header
      display: none !important
      width: 0 !important
      overflow: hidden !important

    .n-menu-item-content__arrow
      display: none !important

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

.avatar-link
  cursor: pointer
  transition: opacity 0.2s ease, transform 0.2s ease
  display: block
  &:hover
    opacity: 0.8
    transform: scale(1.2)

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

// Active language option highlight in dropdown
.lang-option-active .n-dropdown-option-body::before
  background-color: rgba(99, 226, 183, 0.1) !important
</style>
