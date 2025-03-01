<script setup lang="ts">
import { NIcon } from 'naive-ui'
import { LogOut as LogOutIcon, LogoSteam as SteamLogoIcon } from '@vicons/ionicons5'
import { steamAuth, type SteamUser } from '@/services/steamAuth'

const selectedKey = ref<string>('')
const showLogoutModal = ref(false)
const user = ref<SteamUser | null>(null)

const validateAuth = async () => {
  if (!user.value) return false

  const response = await fetch('/api/auth/validate?steamId=' + user.value?.steamId, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    }
  })

  if (!response.ok) {
    if (response.status === 401) {
      steamAuth.logout();
      user.value = null;
    }
    return false;
  }

  const data = await response.json();
  return data.authenticated;
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
          :width="200"
          bordered
          class="flex flex-col"
          v-if="user"
      >
        <div class="grid grid-rows-[auto_1fr_auto] h-full">
          <!-- Steam Account Menu Section -->
          <div class="p-4 flex flex-col items-center">
            <div v-if="!user">
              <button @click="handleLogin" class="login-button">
                <img
                    src="https://steamcommunity-a.akamaihd.net/public/images/signinthroughsteam/sits_02.png"
                    alt="Sign in through Steam"
                    class="w-full"
                >
              </button>
            </div>
            <div v-else class="flex items-center flex-col">
              <NAvatar
                  round
                  size="large"
                  :src="user.avatarFull"
                  :style="{ width: '100px', height: '100px' }"
              />
              <div class="mt-3 text-center">
                <span class="font-bold text-[15px]">{{ user.personaName }}</span>
              </div>
            </div>
          </div>

          <!-- Middle: Menu Sections with equal spacing -->
          <div class="flex flex-col justify-between flex-1 py-4">
            <!-- Weapon Menu Section -->
            <div class="flex flex-col">
              <div class="px-4">
                <span class="text-xs font-bold text-gray-500">WEAPONS</span>
              </div>
              <NMenu
                  :icon-size="45"
                  :indent="14"
                  :options="weaponMenuOptions"
                  :value="selectedKey"
                  @update:value="handleSelect"
                  class="text-[15px]"
              />
            </div>

            <!-- Melee Menu Section -->
            <div class="flex flex-col">
              <div class="px-4">
                <span class="text-xs font-bold text-gray-500">MELEE</span>
              </div>
              <NMenu
                  :icon-size="45"
                  :indent="14"
                  :options="equipmentMenuOptions"
                  :value="selectedKey"
                  @update:value="handleSelect"
                  class="text-[15px]"
              />
            </div>

            <div class="flex flex-col">
              <div class="px-4">
                <span class="text-xs font-bold text-gray-500">EXTRAS</span>
              </div>
              <NMenu
                  :icon-size="30"
                  :indent="14"
                  :options="extrasMenuOptions"
                  :value="selectedKey"
                  @update:value="handleSelect"
                  class="text-[15px]"
              />
            </div>
          </div>

          <!-- Bottom: Actions Section -->
          <div class="p-4">
            <div class="mb-2">
              <span class="text-xs font-bold text-gray-500">ACTIONS</span>
            </div>
            <div class="">
              <NTooltip placement="right" trigger="hover">
                <template #trigger>
                  <NButton
                      secondary
                      type="error"
                      class="w-full"
                      @click="showLogoutModal = true"
                  >
                    <template #icon>
                      <NIcon><LogOutIcon/></NIcon>
                    </template>
                    Logout
                  </NButton>
                </template>
                Logout
              </NTooltip>
              <NModal :show="showLogoutModal">
                <NCard
                    title="Confirm Logout"
                    :bordered="false"
                    size="small"
                    aria-modal="true"
                    style="width: 300px"
                >
                  <div class="mb-3">
                    <p>Are you sure you want to logout?</p>
                  </div>
                  <div class="flex justify-end gap-2">
                    <NButton @click="showLogoutModal = false">
                      Cancel
                    </NButton>
                    <NButton type="error" @click="handleLogout">
                      Logout
                    </NButton>
                  </div>
                </NCard>
              </NModal>
            </div>
          </div>
        </div>
      </NLayoutSider>
      <NLayoutContent class="h-screen overflow-auto">

        <div v-if="!user" class="flex items-center justify-center flex-col text-xl h-full">
          To access this website, please login with your Steam Account.
          <NButton size="large" @click="handleLogin" class="mt-4 login-button px-10 py-6 bg-[#18181c] rounded-md">
            <template #icon >
              <SteamLogoIcon/>
            </template>
            Sign in
          </NButton>
        </div>
        <div v-else class="h-full bg-[#181818]">
          <NuxtPage />
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
</style>