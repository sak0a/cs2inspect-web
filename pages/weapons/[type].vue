
<script setup lang="ts">
import type { SteamUser } from "~/services/steamAuth"
import { steamAuth } from "~/services/steamAuth"
import type { IEnhancedWeapon, WeaponConfiguration, UserProfile, WeaponItemData } from "~/types";
import { toSteamId } from "~/types/core/common";

definePageMeta({
  middleware: ['validate-weapon-url']
})

const { t } = useI18n()
const route = useRoute()
const WEAPON_TYPE = ((route.params as Record<string, string | string[]>).type as string) ?? 'rifles'

const user = ref<SteamUser | null>(null)
const skins = ref<IEnhancedWeapon[]>([])
const isLoading = ref<boolean>(true)
const error = ref<string | null>(null)
const loadoutStore = useLoadoutStore()
const message = useMessage()

const showSkinModal = ref<boolean>(false)
const selectedWeapon = ref<IEnhancedWeapon | null>(null)

const otherTeamHasSkin = useOtherTeamSkin(selectedWeapon, skins)
const groupedWeapons = useGroupedWeapons(skins)

// Convert SteamUser to UserProfile for components that expect branded types
const userAsProfile = computed((): UserProfile | null => {
  if (!user.value) return null
  return {
    steamId: toSteamId(user.value.steamId),
    personaName: user.value.personaName,
    avatar: user.value.avatar,
    profileUrl: user.value.profileUrl
  }
})

const handleWeaponClick = (weapon: IEnhancedWeapon) => {
  selectedWeapon.value = weapon
  showSkinModal.value = true
}

const handleSkinSave = async (skin: IEnhancedWeapon, customization: WeaponConfiguration) => {
  if (!loadoutStore.selectedLoadoutId || !user.value?.steamId) {
    message.error(t('loadout.selectLoadoutFirst') as string)
    return
  }
  if (customization.paintindex === null || customization.paintindex === 0) {
    message.error('Please select a paint to save the weapon')
    return
  }
  await $fetch(`/api/items/weapons/save?steamId=${user.value.steamId}&loadoutId=${loadoutStore.selectedLoadoutId}&type=${WEAPON_TYPE}`, {
    method: 'POST',
    body: {
      defindex: skin.weapon_defindex,
      active: customization.active,
      paintindex: customization.paintindex,
      paintwear: customization.paintwear,
      paintseed: customization.paintseed,
      stattrak_enabled: customization.stattrak_enabled,
      stattrak_count: customization.stattrak_count,
      nametag: customization.nametag,
      stickers: customization.stickers,
      keychain: customization.keychain,
      team: customization.team || 0,
      reset: customization.reset
    }
  }).then(async (data: { success: boolean; message: string }) => {
    if (data.success) {
      message.success(data.message)
      await fetchLoadoutSkins()
      showSkinModal.value = false
    } else {
      throw new Error(data.message)
    }
  }).catch((error) => {
    console.error('Error saving weapon:', error)
    message.error('Failed to save weapon configuration')
  })
}

const handleWeaponDuplicate = async (skin: IEnhancedWeapon, customization: WeaponConfiguration) => {
  if (!loadoutStore.selectedLoadoutId) {
    message.error(t('loadout.selectLoadoutFirst') as string)
    return
  }
  console.log('Duplicating weapon: ', skin, customization)
  try {
    // Format stickers data
    const formattedStickers = customization.stickers.map((sticker: { id: number | string; x?: number; y?: number; wear?: number; scale?: number; rotation?: number } | null) => {
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
    console.log("DUPLICATE CUSTOM TEAM: ", customization.team)
    const result = await $fetch<{ success: boolean; message: string }>(`/api/items/weapons/save?steamId=${user.value?.steamId}&loadoutId=${loadoutStore.selectedLoadoutId}&type=${WEAPON_TYPE}`, {
      method: 'POST',
      body: {
        defindex: skin.weapon_defindex,
        active: true,
        paintindex: customization.paintindex || 0,
        paintwear: customization.paintwear || 0,
        paintseed: customization.paintseed || 0,
        stattrak_enabled: customization.stattrak_enabled || false,
        stattrak_count: customization.stattrak_count || 0,
        nametag: customization.nametag || '',
        stickers: formattedStickers,
        keychain: formattedKeychain,
        team: customization.team // This will be the opposite team number
      }
    })

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
    message.error(t('loadout.selectLoadoutFirst') as string)
    return;
  }
  isLoading.value = true;
  await loadoutStore.fetchLoadoutWeaponSkins(WEAPON_TYPE, toSteamId(user.value.steamId)).then(() => {
    skins.value = loadoutStore.loadoutSkins as IEnhancedWeapon[];
  }).catch(() => {
    error.value = 'Failed to load skins. Please try again later.';
    message.error('Failed to load skins');
  }).finally(() => isLoading.value = false);
}

// Wrapper handlers that handle type conversion for WeaponTabs events
const handleWeaponClickWrapper = (weapon: WeaponItemData) => {
  handleWeaponClick(weapon as unknown as IEnhancedWeapon)
}

// No animation code

onMounted(async () => {
  user.value = steamAuth.getSavedUser();
  if (user.value?.steamId) {
    try {
      await loadoutStore.fetchLoadouts(toSteamId(user.value.steamId))
      if (loadoutStore.selectedLoadoutId) {
        await fetchLoadoutSkins();
      } else {
        isLoading.value = false;
      }
    } catch (e) {
      console.error(e);
      isLoading.value = false;
    }
  } else {
    isLoading.value = false;
  }
})



watch(() => showSkinModal.value, (isVisible) => {
  if (!isVisible) {
    // When modal is closed, completely reset the selected weapon
    // This ensures no state persists between modal sessions
    setTimeout(() => {
      selectedWeapon.value = null
    }, 500) // Delay to ensure modal is fully closed
  }
}, { immediate: true })

watch(() => loadoutStore.selectedLoadoutId, async (newLoadoutId) => {
  if (newLoadoutId && skins.value.length > 0) {
    await fetchLoadoutSkins()
  }
}, { immediate: true })
</script>

<template>
  <div class="px-4 pb-4 bg-black">
    <div class="max-w-7xl mx-auto">
      <SkinPageLayout
          title="Rifles"
          :user="user"
          :error="error || loadoutStore.error || ''"
          :is-loading="isLoading"
      />
      <div v-if="!error && !isLoading && user && loadoutStore.selectedLoadoutId">
        <!-- Skins Grid -->
        <div class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-2">
          <WeaponTabs
v-for="(weaponData, weaponName) in groupedWeapons"
                      :key="weaponName"
                      class=""
                      :weapon-data="weaponData as any"
                      @weapon-click="handleWeaponClickWrapper"
          />
        </div>
        <!-- No Skins State -->
        <div v-if="skins.length === 0" class="text-center py-12">
          <p class="text-gray-400">No skins available for this loadout</p>
        </div>
      </div>

      <!-- Skin Selection & Customization Modal -->
      <WeaponSkinModal
          v-if="user"
          v-model:visible="showSkinModal"
          :user="user"
          :weapon="selectedWeapon"
          :other-team-has-skin="otherTeamHasSkin"
          @select="handleSkinSave"
          @duplicate="handleWeaponDuplicate"
      />
    </div>
  </div>
</template>
<style>
</style>