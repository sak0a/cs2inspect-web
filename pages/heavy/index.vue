
<script setup lang="ts">
import {onMounted, ref, watch} from 'vue'
import {NAlert, NButton, NSpin, useMessage} from 'naive-ui'
import {useLoadoutStore} from '~/stores/loadoutStore'
import type {SteamUser} from "~/services/steamAuth"
import {steamAuth} from "~/services/steamAuth"
import LoadoutSelector from '~/components/LoadoutSelector.vue'
import {WeaponCustomization} from "~/server/utils/interfaces";
import {EnhancedWeaponResponse} from "~/server/api/weapons/[type]";

const user = ref<SteamUser | null>(null)
const skins = ref<any[]>([])
const isLoading = ref<boolean>(true)
const error = ref<string | null>(null)
const loadoutStore = useLoadoutStore()
const message = useMessage()

const showSkinModal = ref<boolean>(false)
const selectedWeapon = ref<EnhancedWeaponResponse | null>(null)

const otherTeamHasSkin = computed(() => {
  if (!selectedWeapon.value || selectedWeapon.value.availableTeams !== 'both') return false

  const currentTeam = selectedWeapon.value.databaseInfo?.team
  const otherTeam = currentTeam === 1 ? 2 : 1

  return skins.value.some(weaponGroup =>
      weaponGroup.some((weapon: EnhancedWeaponResponse) =>
          weapon.weapon_defindex === selectedWeapon.value?.weapon_defindex &&
          weapon.databaseInfo?.team === otherTeam
      )
  )
})
const groupedWeapons = computed(() => {
  return skins.value.reduce((acc, weaponGroup) => {
    const weapon = weaponGroup[0];
    if (!acc[weapon.defaultName]) {
      acc[weapon.defaultName] = {
        weapons: weaponGroup,
        availableTeams: weapon.availableTeams,
        defaultName: weapon.defaultName
      };
    }
    return acc;
  }, {});
})

const handleWeaponClick = (weapon: EnhancedWeaponResponse) => {
  selectedWeapon.value = weapon
  showSkinModal.value = true
}
const handleSkinSelect = async (skin: EnhancedWeaponResponse, customization: WeaponCustomization) => {
  if (!loadoutStore.selectedLoadoutId || !user.value?.steamId) {
    message.error('Please select a loadout first')
    return
  }
  try {
    const response = await fetch(`/api/weapons/save?steamId=${user.value.steamId}&loadoutId=${loadoutStore.selectedLoadoutId}&type=heavys`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        defindex: skin.weapon_defindex,
        active: customization.active,
        paintIndex: customization.paintIndex,
        paintWear: customization.wear,
        pattern: customization.pattern,
        statTrak: customization.statTrak,
        statTrakCount: customization.statTrakCount,
        nameTag: customization.nameTag,
        stickers: customization.stickers,
        keychain: customization.keychain,
        team: selectedWeapon.value?.databaseInfo?.team || customization.team || 0
      })
    })

    const data = await response.json()
    if (data.success) {
      message.success(data.message)
      await fetchLoadoutSkins()
      showSkinModal.value = false
    } else {
      throw new Error(data.message)
    }
  } catch (error) {
    console.error('Error saving weapon:', error)
    message.error('Failed to save weapon configuration')
  }
}
const handleWeaponDuplicate = async (skin: EnhancedWeaponResponse, customization: WeaponCustomization) => {
  if (!loadoutStore.selectedLoadoutId || !user.value?.steamId) {
    message.error('Please select a loadout first')
    return
  }

  try {
    // Format stickers data
    const formattedStickers = customization.stickers.map((sticker: any) => {
      if (!sticker) return null
      return {
        id: sticker.id,
        x: sticker.x || 0,
        y: sticker.y || 0,
        wear: sticker.wear || 0,
        scale: sticker.scale || 1,
        rotation: sticker.rotation || 0
      }
    })

    // Format keychain data
    const formattedKeychain = customization.keychain ? {
      id: customization.keychain.id,
      x: customization.keychain.x || 0,
      y: customization.keychain.y || 0,
      z: customization.keychain.z || 0,
      seed: customization.keychain.seed || 0
    } : null

    const response = await fetch(`/api/weapons/save?steamId=${user.value.steamId}&loadoutId=${loadoutStore.selectedLoadoutId}&type=heavys`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        defindex: skin.weapon_defindex,
        active: true,
        paintIndex: customization.paintIndex || 0,
        paintWear: customization.wear || 0,
        pattern: customization.pattern || 0,
        statTrak: customization.statTrak || false,
        statTrakCount: customization.statTrakCount || 0,
        nameTag: customization.nameTag || '',
        stickers: formattedStickers,
        keychain: formattedKeychain,
        team: customization.team // This will be the opposite team number
      })
    })

    const result = await response.json()
    if (result.success) {
      message.success('Weapon duplicated successfully')
      await fetchLoadoutSkins() // Refresh the skins
    } else {
      throw new Error(result.message)
    }
  } catch (error) {
    console.error('Error duplicating weapon:', error)
    message.error('Failed to duplicate weapon')
  }
}

const initializeLoadouts = async () => {
  if (!user.value?.steamId) {
    error.value = 'Please login with Steam to continue'
    return;
  }
  try {
    await loadoutStore.fetchLoadouts(user.value.steamId)
  } catch (err) {
    console.error('Error initializing loadouts:', err)
    message.error('Failed to load loadouts')
    error.value = 'Failed to load loadouts. Please try again later.'
  }
}
const fetchLoadoutSkins = async () => {
  if (!loadoutStore.selectedLoadoutId || !user.value?.steamId) {
    return;
  }
  try {
    isLoading.value = true
    await loadoutStore.fetchLoadoutWeaponSkins("heavys", user.value.steamId)
    skins.value = loadoutStore.loadoutSkins
  } catch (e) {
    message.error('Failed to load skins')
    error.value = 'Failed to load skins. Please try again later.'
  } finally {
    isLoading.value = false
  }
}

onMounted(async () => {
  user.value = steamAuth.getSavedUser()
  if (user.value?.steamId) {
    await initializeLoadouts()
    if (skins.value.length === 0) {
      await fetchLoadoutSkins()
    }
  }
})

watch(() => showSkinModal.value, (isVisible) => {
  //console.log('Rifles - Skin Modal visibility changed:', isVisible, 'Selected weapon:', selectedWeapon.value)
  if (!isVisible && selectedWeapon.value) {
    selectedWeapon.value = {...selectedWeapon.value}
    //console.log('Riflex - Last selected weapon:', selectedWeapon.value)
  }
})

watch(() => loadoutStore.selectedLoadoutId, async (newLoadoutId) => {
  if (newLoadoutId) {
    await fetchLoadoutSkins()
  } else {
    skins.value = []
  }
}, { immediate: true })
</script>

<template>
  <div class="p-4 bg-[#181818]">
    <div class="max-w-7xl mx-auto">
      <!-- Header with Loadout Selector -->
      <div class="flex justify-between mb-2">
        <h1 class="text-2xl font-bold text-white">Heavys</h1>
        <LoadoutSelector v-if="user" />
      </div>

      <!-- Error State -->
      <NAlert
          v-if="error"
          type="error"
          :title="error"
          class="mb-6 z-10"
      />

      <!-- Loading State -->
      <div v-else-if="isLoading" class="flex justify-center items-center h-64">
        <NSpin size="large" />
      </div>

      <!-- No Steam Login State -->
      <div v-else-if="!user" class="text-center py-12">
        <p class="text-gray-400 mb-4">Please login with Steam to view and select skins</p>
        <NButton type="primary" @click="steamAuth.login()">
          Login with Steam
        </NButton>
      </div>

      <!-- No Loadout Selected State -->
      <div v-else-if="!loadoutStore.selectedLoadoutId" class="text-center py-12">
        <p class="text-gray-400 mb-4">Please select or create a loadout to view heavy</p>
        <NButton type="primary" @click="loadoutStore.createLoadout(user.steamId, 'Default Loadout')">
          Create Default Loadout
        </NButton>
      </div>

      <!-- Skins Grid -->
      <div v-else class=" grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-3 gap-2">
        <WeaponTabs class=""
                    v-for="(weaponData, weaponName) in groupedWeapons"
                    :key="weaponName"
                    :weapon-data="weaponData"
                    @weapon-click="handleWeaponClick"
        />
      </div>

      <!-- No Skins State -->
      <div v-if="!isLoading && loadoutStore.selectedLoadoutId && skins.length === 0" class="text-center py-12">
        <p class="text-gray-400">No skins available for this loadout</p>
      </div>

      <!-- Skin Selection Modal -->
      <WeaponSkinModal
          v-model:visible="showSkinModal"
          :weapon="selectedWeapon"
          :other-team-has-skin="otherTeamHasSkin"
          @select="handleSkinSelect"
          @duplicate="handleWeaponDuplicate"
      />
    </div>
  </div>
</template>
<style>
</style>