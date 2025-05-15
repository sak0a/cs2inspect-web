<script setup lang="ts">
import { NIcon, useMessage } from 'naive-ui'
import { LogOut as LogOutIcon, LogoSteam as SteamLogoIcon } from '@vicons/ionicons5'
import { steamAuth, type SteamUser } from '@/services/steamAuth'

const selectedKey = ref<string>('')
const showLogoutModal = ref(false)
const user = ref<SteamUser | null>(null)

const message = useMessage()
const { t } = useI18n()

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

  await fetch('/api/auth/validate?steamId=' + user.value?.steamId, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    }
  }).then(async (response) => {
    if (!response.ok) {
      if (response.status === 401) {
        message.error(t('auth.automaticallyLoggedOut') as string)
        steamAuth.logout();
        user.value = null;
      }
      return false;
    }
    const data = await response.json();
    return data.authenticated;
  }).catch((error) => {
    console.log(error)
    return false
  })
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
            <div class="flex items-center flex-col">
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
                <span class="text-xs font-bold text-gray-500">{{ t('navigation.weapons') }}</span>
              </div>
              <NMenu
                  :icon-size="45"
                  :indent="24"
                  :options="translatedWeaponMenuOptions"
                  :value="selectedKey"
                  @update:value="handleSelect"
                  class="text-[15px]"
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
                  @update:value="handleSelect"
                  class="text-[15px]"
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
                  @update:value="handleSelect"
                  class="text-[15px]"
              />
            </div>
          </div>

          <!-- Bottom: Actions Section -->
          <div class="p-4">
            <div class="mb-2">
              <span class="text-xs font-bold text-gray-500">{{ t('navigation.actions') }}</span>
            </div>
            <div class="space-y-2">
              <!-- Language Switcher -->
              <div class="mb-2 flex justify-center">
                <LanguageSwitcher />
              </div>

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
              <NModal :show="showLogoutModal">
                <NCard
                    :title="t('modals.logout.title') as string"
                    :bordered="false"
                    size="small"
                    aria-modal="true"
                    :closable="false"
                    :mask-closable="false"
                    style="width: 400px"
                >
                  <div class="mb-3">
                    <p>{{ t('modals.logout.question') }}</p>
                  </div>
                  <div class="flex justify-end gap-2">
                    <NButton @click="showLogoutModal = false" secondary type="default">
                      {{ t('modals.logout.cancel') }}
                    </NButton>
                    <NButton type="error" @click="handleLogout" secondary>
                      {{ t('modals.logout.confirm') }}
                    </NButton>
                  </div>
                </NCard>
              </NModal>
            </div>
          </div>
        </div>
      </NLayoutSider>
      <NLayoutContent class="h-screen overflow-auto">

        <div v-if="!user" class="flex items-center justify-center flex-col text-xl h-full relative">
          <!-- Language Switcher in top-right corner for login screen -->
          <div class="absolute top-4 right-4">
            <LanguageSwitcher />
          </div>

          {{ t('auth.loginRequired') }}
          <NButton size="large" @click="handleLogin" class="mt-4 login-button px-10 py-6 bg-[#18181c] rounded-md">
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