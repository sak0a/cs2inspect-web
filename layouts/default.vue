<script setup lang="ts">
import { LucideLogOut as LogOutIcon } from 'lucide-vue-next'
import { steamAuth, type SteamUser } from '@/services/steamAuth'

const selectedKey = ref<string>('')
const showLogoutModal = ref(false)
const user = ref<SteamUser | null>(null)

// Cookie-based SSR hint: tells the server which layout branch to render,
// avoiding a layout shift when localStorage user data loads on mount.
const loggedInHint = useCookie('steam_logged_in')
const isLoggedIn = computed(() => !!user.value || !!loggedInHint.value)

const message = useMessage()
const { t } = useI18n()

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



</script>
<template>
  <NSpace vertical>  
    <NLayout has-sider >
   
      <NLayoutSider
          v-if="isLoggedIn"
          :width="200"
          bordered
          class="flex flex-col"
      >
        <div class="grid grid-rows-[auto_1fr_auto] h-full">
          <!-- Steam Account Menu Section -->
          <div class="p-4 flex flex-col items-center">
            <div v-if="user" class="flex items-center flex-col">
              <a
                  :href="user.profileUrl"
                  target="_blank"
                  rel="noopener noreferrer"
                  :aria-label="t('auth.openSteamProfile') as string"
                  :title="t('auth.openSteamProfile') as string"
                  class="avatar-link"
              >
                <img class="rounded-full" alt="Steam Avatar" :src="user.avatarFull" :style="{ width: '100px', height: '100px' }" />
              </a>
              <div class="mt-3 text-center">
                <span class="font-bold text-[15px]">{{ user.personaName }}</span>
              </div>
            </div>
            <div v-else class="flex items-center flex-col">
              <div :style="{ width: '100px', height: '100px', borderRadius: '50%' }" class="bg-gray-800 animate-pulse" />
              <div class="mt-3">
                <div class="h-4 w-20 bg-gray-800 rounded animate-pulse" />
              </div>
            </div>
          </div>

          <!-- Middle: Menu Sections with equal spacing -->
          <div class="flex flex-col justify-between flex-1">
            <!-- Home Menu Section -->
            <div class="flex flex-col">
              <NMenu
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
              <div class="px-4">
                <span class="text-xs font-bold text-gray-400">{{ t('navigation.weapons') }}</span>
              </div>
              <NMenu
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
              <div class="px-4">
                <span class="text-xs font-bold text-gray-400">{{ t('navigation.melee') }}</span>
              </div>
              <NMenu
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
              <div class="px-4">
                <span class="text-xs font-bold text-gray-400">{{ t('navigation.extras') }}</span>
              </div>
              <NMenu
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
          <div class="p-4">
            <div class="mb-2">
              <span class="text-xs font-bold text-gray-400">{{ t('navigation.actions') }}</span>
            </div>
            <div class="space-y-2">
              <NButton
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
            </div>
          </div>
        </div>
      </NLayoutSider>
      <NLayoutContent class="h-screen overflow-auto bg-transparent">

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
        <div v-else class="h-full p-0">
          <!-- Secondary Menu -->
          <div class="p-2 mb-4 sticky top-0 z-10">
            <div class="flex justify-end items-end">

              <div class="flex items-center gap-6">
                <div class="menu-item group">
                  <LanguageSwitcher />
                  <!--<span class="menu-label">{{ t('navigation.language') }}</span>-->
                </div>
                <div v-if="user" class="menu-item group" >
                  <LoadoutSelector />
                  <!--<span class="menu-label">{{ t('navigation.loadout') }}</span>-->
                </div>
              </div>
            </div>
          </div>
          <!-- Secondary Menu End -->
          <slot />
        </div>
      </NLayoutContent>
    </NLayout>
  </NSpace>
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

.n-layout
  @apply bg-transparent

.n-layout-sider
  &-scroll-container
    display: flex
    flex-direction: column
    height: 100%

.n-menu
  flex-shrink: 0

.n-layout-content
  height: 100vh
  overflow-y: auto

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
    transform: scale(1.05)
</style>