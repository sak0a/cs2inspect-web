
<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { NAlert, NButton, NSpin, useMessage } from 'naive-ui'
import { useLoadoutStore } from '~/stores/loadoutStore'
import type { SteamUser } from "~/services/steamAuth"
import { steamAuth } from "~/services/steamAuth"
import LoadoutSelector from '~/components/LoadoutSelector.vue'
import { IEnhancedWeapon, WeaponCustomization } from "~/server/utils/interfaces";

definePageMeta({
  middleware: 'validate-weapon-url'
})

const route = useRoute()
const WEAPON_TYPE = route.params.type as string ?? 'rifles'

const user = ref<SteamUser | null>(null)
const skins = ref<any[]>([])
const isLoading = ref<boolean>(true)
const error = ref<string | null>(null)
const loadoutStore = useLoadoutStore()
const message = useMessage()

const showSkinModal = ref<boolean>(false)
const selectedWeapon = ref<IEnhancedWeapon | null>(null)

const otherTeamHasSkin = computed(() => {
  if (!selectedWeapon.value || selectedWeapon.value.availableTeams !== 'both') return false

  const currentTeam = selectedWeapon.value.databaseInfo?.team
  const otherTeam = currentTeam === 1 ? 2 : 1

  return skins.value.some(weaponGroup =>
      weaponGroup.some((weapon: IEnhancedWeapon) =>
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

const handleWeaponClick = (weapon: IEnhancedWeapon) => {
  selectedWeapon.value = weapon
  showSkinModal.value = true
}
const handleSkinSelect = async (skin: IEnhancedWeapon, customization: WeaponCustomization) => {
  if (!loadoutStore.selectedLoadoutId || !user.value?.steamId) {
    message.error('Please select a loadout first')
    return
  }
  if (customization.paintIndex === null || customization.paintIndex === 0) {
    message.error('Please select a paint to save the weapon')
    return
  }
  try {
    const response = await fetch(`/api/weapons/save?steamId=${user.value.steamId}&loadoutId=${loadoutStore.selectedLoadoutId}&type=${WEAPON_TYPE}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'credentials': 'include'
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
const handleWeaponDuplicate = async (skin: IEnhancedWeapon, customization: WeaponCustomization) => {
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

    const response = await fetch(`/api/weapons/save?steamId=${user.value.steamId}&loadoutId=${loadoutStore.selectedLoadoutId}&type=${WEAPON_TYPE}`, {
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

const fetchLoadoutSkins = async () => {
  if (!loadoutStore.selectedLoadoutId || !user.value?.steamId) {
    message.error('Please select a loadout first / login')
    return;
  }
  isLoading.value = true;
  await loadoutStore.fetchLoadoutWeaponSkins(WEAPON_TYPE, user.value.steamId).then(() => {
    skins.value = loadoutStore.loadoutSkins;
  }).catch((e) => {
    error.value = 'Failed to load skins. Please try again later.';
    message.error('Failed to load skins');
  }).finally(() => isLoading.value = false);
}

onMounted(async () => {
  user.value = steamAuth.getSavedUser();
  if (user.value?.steamId) {
    await loadoutStore.fetchLoadouts(user.value.steamId)
    if (loadoutStore.selectedLoadoutId) {
      await fetchLoadoutSkins();
    }
  }
})

watch(() => showSkinModal.value, (isVisible) => {
  if (!isVisible && selectedWeapon.value) {
    selectedWeapon.value = {...selectedWeapon.value}
  }
})

watch(() => loadoutStore.selectedLoadoutId, async (newLoadoutId) => {
  if (newLoadoutId && skins.value.length > 0) {
    await fetchLoadoutSkins()
  }
}, { immediate: true })
</script>

<template>
  <div class="p-4 bg-[#181818]">
    <div class="max-w-7xl mx-auto">
      <SkinPageLayout
          title="Rifles"
          :user="user"
          :error="error || loadoutStore.error || ''"
          :isLoading="isLoading"
          />
      <div v-if="!error && !isLoading && user && loadoutStore.selectedLoadoutId">
        <!-- Skins Grid -->
        <div class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-2">
          <WeaponTabs class=""
                      v-for="(weaponData, weaponName) in groupedWeapons"
                      :key="weaponName"
                      :weapon-data="weaponData"
                      @weapon-click="handleWeaponClick"
          />
        </div>
        <!-- No Skins State -->
        <div v-if="skins.length === 0" class="text-center py-12">
          <p class="text-gray-400">No skins available for this loadout</p>
        </div>
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