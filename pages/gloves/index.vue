<script setup lang="ts">
import type { SteamUser } from "~/services/steamAuth"
import { steamAuth } from "~/services/steamAuth"
import type { IEnhancedGlove, GloveConfiguration, GloveItemData, UserProfile } from "~/types"
import { toSteamId } from "~/types/core/branded"

const user = ref<SteamUser | null>(null)
const skins = ref<IEnhancedGlove[]>([])
const isLoading = ref<boolean>(true)
const error = ref<string | null>(null)
const showSkinModal = ref<boolean>(false)
const selectedGlove = ref<IEnhancedGlove | null>(null)
const tGloveType = ref<number | null>(null)
const ctGloveType = ref<number | null>(null)
const selectedTeamGloves = ref({
  terrorists: null as IEnhancedGlove | null,
  counterTerrorists: null as IEnhancedGlove | null
})

const loadoutStore = useLoadoutStore()
const message = useMessage()
const { t } = useI18n()
const otherTeamHasSkin = useOtherTeamSkin(selectedGlove, skins)
const groupedGloves = useGroupedWeapons(skins)

const gloveOptions = computed(() => {
  return [
    { label: 'Player Inventory', value: -1 },
    { label: 'Default', value: 0 },
    ...Object.entries(groupedGloves.value).map(([gloveName, gloveData]) => ({
      label: gloveName,
      value: gloveData.weapons[0]?.weapon_defindex
    }))
  ]
})

const handleGloveTypeChange = async (team: 't' | 'ct', gloveDefindex: number) => {
  if (!loadoutStore.selectedLoadoutId || !loadoutStore.selectedLoadout || !user.value?.steamId) {
    message.error('Please select a loadout first')
    return
  }

  console.log('Glove Type Change', team, gloveDefindex)
  await $fetch(`/api/loadouts/select?steamId=${user.value.steamId}&loadoutId=${loadoutStore.selectedLoadoutId}&type=glove`,
      {
        method: 'POST',
        body: {
          team: team === 't' ? 1 : 2,
          defindex: gloveDefindex === -1 ? null : gloveDefindex
        }
      }
  ).then(async () => {
    if (!loadoutStore.selectedLoadout) {
      return
    }
    if (team === 't') {
      loadoutStore.selectedLoadout.selected_glove_t = gloveDefindex === -1 ? null : gloveDefindex
    } else {
      loadoutStore.selectedLoadout.selected_glove_ct = gloveDefindex === -1 ? null : gloveDefindex
    }
    updateSelectedGloves()
  }).catch((error) => {
    console.error(error)
    message.error("Failed to update Glove Type")
  })
}

const fetchLoadoutGloves = async () => {
  if (!loadoutStore.selectedLoadoutId || !user.value?.steamId) {
    return
  }
  isLoading.value = true;
  await loadoutStore.fetchLoadoutGloves(toSteamId(user.value.steamId))
      .then(() => {
        skins.value = loadoutStore.loadoutSkins as IEnhancedGlove[];
        updateSelectedGloves();
      })
      .catch(() => {
        message.error("Failed to load gloves")
        error.value = 'Failed to load gloves. Please try again later.'
      })
      .finally(() => isLoading.value = false);
}

const findGloveInGroups = (defindex: number | null) => {
  if (!defindex) return null;
  // Flatten the nested arrays and find the matching glove
  return skins.value
      .flat()
      .find(glove => glove.weapon_defindex === defindex);
};

/**
 * Set the selected gloves for each team at the top
 * Need to search through all weapon groups to find matching gloves
 */
const updateSelectedGloves = () => {
  if (!loadoutStore.selectedLoadout) return;
  selectedTeamGloves.value.terrorists = findGloveInGroups(loadoutStore.selectedLoadout.selected_glove_t) ?? null
  selectedTeamGloves.value.counterTerrorists = findGloveInGroups(loadoutStore.selectedLoadout.selected_glove_ct) ?? null

  // Set dropdown values: null→-1 (Player Inventory), 0→0 (Default), positive→defindex
  const selectedT = loadoutStore.selectedLoadout.selected_glove_t
  tGloveType.value = selectedT ?? -1
  const selectedCT = loadoutStore.selectedLoadout.selected_glove_ct
  ctGloveType.value = selectedCT ?? -1
}

const handleGloveClick = (glove: IEnhancedGlove) => {
  selectedGlove.value = glove
  showSkinModal.value = true
}

/**
 * Auto-save handler for automatic saving without closing modal
 */
const handleAutoSave = async (glove: IEnhancedGlove, customization: GloveConfiguration) => {
  if (!loadoutStore.selectedLoadoutId || !user.value?.steamId) {
    throw new Error('No loadout or user selected')
  }
  if (customization.paintindex === null || customization.paintindex === 0) {
    return // Don't auto-save without a paint selected
  }
  await $fetch<{ success: boolean; message: string }>(`/api/items/gloves/save?steamId=${user.value.steamId}&loadoutId=${loadoutStore.selectedLoadoutId}`, {
    method: 'POST',
    body: {
      defindex: glove.weapon_defindex,
      active: customization.active,
      paintindex: customization.paintindex,
      paintIndexOverride: customization.paintIndexOverride,
      paintwear: customization.paintwear,
      paintseed: customization.paintseed,
      team: glove.databaseInfo?.team || customization.team,
      reset: customization.reset
    }
  }).then(async (data) => {
    if (data.success) {
      // Silently refresh data without closing modal
      await fetchLoadoutGloves()
    }
  })
}

const handleSkinSelect = async (glove: IEnhancedGlove, customization: GloveConfiguration) => {
  if (!loadoutStore.selectedLoadoutId || !user.value?.steamId) {
    message.error('Please select a loadout first')
    return
  }
  try {
    const data = await $fetch<{ success: boolean; message: string }>(`/api/items/gloves/save?steamId=${user.value.steamId}&loadoutId=${loadoutStore.selectedLoadoutId}`, {
      method: 'POST',
      body: {
        defindex: glove.weapon_defindex,
        active: customization.active,
        paintindex: customization.paintindex,
        paintIndexOverride: customization.paintIndexOverride,
        paintwear: customization.paintwear,
        paintseed: customization.paintseed,
        team: glove.databaseInfo?.team || customization.team,
        reset: customization.reset
      }
    })

    if (data.success) {
      message.success(data.message)
      await fetchLoadoutGloves()
      showSkinModal.value = false
    } else {
      throw new Error(data.message)
    }
  } catch (error) {
    console.error('Error saving glove:', error)
    message.error('Failed to save glove configuration')
  }
}

const handleGloveDuplicate = async (glove: IEnhancedGlove, customization: GloveConfiguration) => {
  if (!loadoutStore.selectedLoadoutId || !user.value?.steamId) {
    message.error('Please select a loadout first')
    return
  }

  try {
    console.log('Duplicating glove: ', glove.databaseInfo?.team, customization.team)
    const result = await $fetch<{ success: boolean; message: string }>(`/api/items/gloves/save?steamId=${user.value.steamId}&loadoutId=${loadoutStore.selectedLoadoutId}`, {
      method: 'POST',
      body: {
        defindex: glove.weapon_defindex,
        active: true,
        paintindex: customization.paintindex,
        paintwear: customization.paintwear || 0,
        paintseed: customization.paintseed || 0,
        team: customization.team, // This will be the opposite team number
        reset: false
      }
    })

    if (result.success) {
      message.success('Glove duplicated successfully')
      await fetchLoadoutGloves()
    } else {
      throw new Error(result.message)
    }
  } catch (error) {
    console.error('Error duplicating glove:', error)
    message.error('Failed to duplicate glove')
  }
}

// No animation code

// Real-time sync: listen for plugin-originated changes
const { connect: connectSync, onSyncEvent } = useSyncEvents()

onSyncEvent((event) => {
  if (event.type !== 'item_changed') return
  if (event.itemType === 'glove' || event.itemType === 'loadout') {
    fetchLoadoutGloves()
  }
})

onMounted(async () => {
  user.value = steamAuth.getSavedUser()
  if (user.value?.steamId) {
    connectSync()
    try {
      await loadoutStore.fetchLoadouts(toSteamId(user.value.steamId))
      if (loadoutStore.selectedLoadoutId) {
        if (skins.value.length === 0) {
          await fetchLoadoutGloves()
        }
      } else {
        isLoading.value = false
      }
    } catch (e) {
      console.error(e)
      isLoading.value = false
    }
  } else {
    isLoading.value = false
  }
})



watch(() => showSkinModal.value, (isVisible) => {
  if (!isVisible && selectedGlove.value) {
    selectedGlove.value = {...selectedGlove.value}
  }
})
</script>

<template>
  <div class="p-4 ">
    <div class="max-w-7xl mx-auto">
      <SkinPageLayout
          title="Gloves"
          :user="user"
          :error="error || ''"
          :is-loading="isLoading && (!user || !loadoutStore.selectedLoadoutId)"
      />
      <!-- Glove Type Groups -->
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
          <div class="flex gap-x-10 justify-start">
            <div class="flex items-center justify-end space-x-2 ">
              <span class="font-bold  whitespace-nowrap">
                {{ t('teams.counterTerrorists') }}
              </span>
              <NSelect
                  v-model:value="ctGloveType"
                  :options="gloveOptions"
                  placeholder="Select glove type"
                  class="w-72"
                  @update:value="handleGloveTypeChange('ct', $event)"
              />
            </div>
            <div class="flex items-center space-x-2">
              <span class=" font-bold">
                {{ t('teams.terrorists') }}
              </span>
              <NSelect
                  v-model:value="tGloveType"
                  :options="gloveOptions"
                  placeholder="Select glove type"
                  class="w-72"
                  @update:value="handleGloveTypeChange('t', $event)"
              />
            </div>
          </div>
          <!-- Skins Grid -->
          <TransitionGroup
            name="card-fade"
            tag="div"
            class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-4 pt-4"
            appear
          >
            <GloveTabs
                v-for="(gloveData, gloveName, index) in groupedGloves"
                :key="gloveName"
                :style="{ '--delay': `${index * 50}ms` }"
                :weapon-data="{
                weapons: gloveData.weapons as unknown as GloveItemData[],
                defaultName: gloveData.defaultName,
                availableTeams: 'both'
              }"
                @weapon-click="(glove: GloveItemData) => handleGloveClick(glove as unknown as IEnhancedGlove)"
            />
          </TransitionGroup>
          <!-- No Skins State -->
          <div v-if="skins.length === 0" class="text-center py-12">
            <p class="text-gray-400">No skins available for this loadout</p>
          </div>
        </template>
      </div>

      <!-- Glove Skin Selection & Customization Modal -->
      <LazyGloveSkinModal
          v-if="user"
          v-model:visible="showSkinModal"
          :user="user as unknown as UserProfile"
          :weapon="selectedGlove"
          :other-team-has-skin="otherTeamHasSkin"
          @select="(glove: any, customization: GloveConfiguration) => handleSkinSelect(glove as IEnhancedGlove, customization)"
          @auto-save="(glove: any, customization: GloveConfiguration) => handleAutoSave(glove as IEnhancedGlove, customization)"
          @duplicate="(glove: any, customization: GloveConfiguration) => handleGloveDuplicate(glove as IEnhancedGlove, customization)"
      />
    </div>
  </div>
</template>

<style scoped>
.selected-slot {
  border: 2px dashed #666;
  transition: all 0.2s ease;
}

.selected-slot:hover {
  border-color: #888;
  background-color: rgba(26, 26, 26, 0.5);
}

.n-card {
  background: #242424;
  border: 1px solid #313030;
}

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