
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
computed((): UserProfile | null => {
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

/**
 * Auto-save handler for automatic saving without closing modal
 * Triggered by the auto-save composable in WeaponSkinModal
 */
const handleAutoSave = async (skin: IEnhancedWeapon, customization: WeaponConfiguration) => {
  if (!loadoutStore.selectedLoadoutId || !user.value?.steamId) {
    throw new Error('No loadout or user selected')
  }
  if (customization.paintindex === null || customization.paintindex === 0) {
    return // Don't auto-save without a paint selected
  }
  const test = {
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
      team: customization.team,
      reset: customization.reset
    }
  await $fetch<{ success: boolean; message: string }>(`/api/items/weapons/save?steamId=${user.value.steamId}&loadoutId=${loadoutStore.selectedLoadoutId}&type=${WEAPON_TYPE}`, {
    method: 'POST',
    body: { ...test }
  }).then(async (data) => {
    if (data.success) {
      // Silently refresh data without closing modal or showing message
      await fetchLoadoutSkins()
    } else {
      throw new Error(data.message)
    }
  }).finally(() => {
    console.log(test)
  })
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
  await $fetch<{ success: boolean; message: string }>(`/api/items/weapons/save?steamId=${user.value.steamId}&loadoutId=${loadoutStore.selectedLoadoutId}&type=${WEAPON_TYPE}`, {
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
      team: customization.team,
      reset: customization.reset
    }
  }).then(async (data) => {
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
  <div class="p-4">
    <div class="max-w-7xl mx-auto">
      <SkinPageLayout
          title="Rifles"
          :user="user"
          :error="error || loadoutStore.error || ''"
          :is-loading="isLoading && (!user || !loadoutStore.selectedLoadoutId)"
      />
      <div v-if="!error && user && loadoutStore.selectedLoadoutId">
        <!-- Skeleton Loading State -->
        <div v-if="isLoading" class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-4">
          <div
            v-for="i in 8"
            :key="i"
            class="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-dark)] p-4"
          >
            <NSkeleton height="128px" />
            <div class="mt-3">
              <NSkeleton text :repeat="1" />
              <div class="mt-2">
                <NSkeleton height="4px" />
              </div>
            </div>
          </div>
        </div>

        <!-- Content when loaded -->
        <template v-else>
          <!-- Skins Grid -->
          <TransitionGroup
            name="card-fade"
            tag="div"
            class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-4"
            appear
          >
            <WeaponTabs
              v-for="(weaponData, weaponName, index) in groupedWeapons"
              :key="weaponName"
              :style="{ '--delay': `${index * 50}ms` }"
              :weapon-data="weaponData as any"
              @weapon-click="handleWeaponClickWrapper"
            />
          </TransitionGroup>
          <!-- No Skins State -->
          <div v-if="skins.length === 0" class="text-center py-12">
            <p class="text-gray-400">No skins available for this loadout</p>
          </div>
        </template>
      </div>

      <!-- Skin Selection & Customization Modal -->
      <LazyWeaponSkinModal
          v-if="user"
          v-model:visible="showSkinModal"
          :user="user"
          :weapon="selectedWeapon"
          :other-team-has-skin="otherTeamHasSkin"
          @select="handleSkinSave"
          @auto-save="handleAutoSave"
          @duplicate="handleWeaponDuplicate"
      />
    </div>
  </div>
</template>
<style>
.card-fade-enter-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
  transition-delay: var(--delay, 0ms);
}

.card-fade-enter-from {
  opacity: 0;
  transform: translateY(10px);
}

.card-fade-leave-active {
  transition: opacity 0.2s ease;
}

.card-fade-leave-to {
  opacity: 0;
}
</style>