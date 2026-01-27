<script setup lang="ts">
import { NIcon } from 'naive-ui'
import { LogOut as LogOutIcon, LogoSteam as SteamLogoIcon } from '@vicons/ionicons5'
import { steamAuth, type SteamUser } from '@/services/steamAuth'

const selectedKey = ref<string>('')
const showLogoutModal = ref(false)
const user = ref<SteamUser | null>(null)

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
  } catch (error: any) {
    if (error?.status === 401 || error?.statusCode === 401) {
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

const backgroundStyle = {
  background: '#000000',
  backgroundImage: `
    linear-gradient(to right, rgba(255,255,255,0.06) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(255,255,255,0.06) 1px, transparent 1px),
    radial-gradient(circle, rgba(255,255,255,0.6) 1px, transparent 1px)
  `,
  backgroundSize: '20px 20px, 20px 20px, 20px 20px',
  backgroundPosition: '0 0, 0 0, 0 0',
}

const backgroundStyleFade = {
      backgroundImage: `
        linear-gradient(45deg, transparent 49%, #242424 49%, #e5e7eb 51%, transparent 51%),
        linear-gradient(-45deg, transparent 49%, #242424 49%, #e5e7eb 51%, transparent 51%)
      `,
      backgroundSize: "40px 40px",
         WebkitMaskImage:
            "radial-gradient(ellipse 80% 80% at 0% 0%, #000 50%, transparent 90%)",
          maskImage:
            "radial-gradient(ellipse 80% 80% at 0% 0%, #000 50%, transparent 90%)"
    }

</script>
<template>
      <!-- <div class="min-h-screen w-full bg-black relative" style="z-index: -5;">
      <div class="absolute inset-0" :style="backgroundStyleFade"></div>
    </div>-->
  <NSpace vertical>  
    <NLayout has-sider >
   
      <NLayoutSider
          v-if="user"
          :width="200"
          bordered
          class="flex flex-col"
          :theme-overrides="layoutThemeOverrides"
      >
        <div class="grid grid-rows-[auto_1fr_auto] h-full">
          <!-- Steam Account Menu Section -->
          <div class="p-4 flex flex-col items-center">
            <div class="flex items-center flex-col">
              <a
                  :href="user.profileUrl"
                  target="_blank"
                  rel="noopener noreferrer"
                  :aria-label="t('auth.openSteamProfile') as string"
                  :title="t('auth.openSteamProfile') as string"
                  class="avatar-link"
              >
                <NAvatar
                    round
                    size="large"
                    :src="user.avatarFull"
                    :style="{ width: '100px', height: '100px' }"
                />
              </a>
              <div class="mt-3 text-center">
                <span class="font-bold text-[15px]">{{ user.personaName }}</span>
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
                <span class="text-xs font-bold text-gray-500">{{ t('navigation.weapons') }}</span>
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
                <span class="text-xs font-bold text-gray-500">{{ t('navigation.melee') }}</span>
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
                <span class="text-xs font-bold text-gray-500">{{ t('navigation.extras') }}</span>
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
              <span class="text-xs font-bold text-gray-500">{{ t('navigation.actions') }}</span>
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
                :theme-overrides="skinModalThemeOverrides"
                style="width: 400px"
                :title="t('modals.logout.title') as string"
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

        <div v-if="!user && !isDevPage" class="flex items-center justify-center flex-col text-xl h-full relative">
          <!-- Language Switcher in top-right corner for login screen -->
          <div class="absolute top-4 right-4">
            <LanguageSwitcher />
          </div>

          {{ t('auth.loginRequired') }}
          <NButton size="large" class="mt-4 login-button px-10 py-6 bg-[#18181c] rounded-md" @click="handleLogin">
            <template #icon >
              <SteamLogoIcon/>
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