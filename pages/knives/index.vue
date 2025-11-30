<script setup lang="ts">
import { onMounted, ref, computed, watch } from 'vue'
import { useMessage } from 'naive-ui'
import { useLoadoutStore } from '~/stores/loadoutStore'
import type { SteamUser } from "~/services/steamAuth"
import { steamAuth } from "~/services/steamAuth"
import KnifeSkinModal from '~/components/KnifeSkinModal.vue'
import type { IEnhancedKnife, KnifeConfiguration } from "~/types"
import KnifeTabs from "~/components/KnifeTabs.vue";

const user = ref<SteamUser | null>(null)
const skins = ref<any[]>([])
const isLoading = ref<boolean>(true)
const error = ref<string | null>(null)
const showSkinModal = ref<boolean>(false)
const selectedKnife = ref<IEnhancedKnife | null>(null)
const tKnifeType = ref<number | null>(null)
const ctKnifeType = ref<number | null>(null)
const selectedTeamKnives = ref({
  terrorists: null as IEnhancedKnife | null,
  counterTerrorists: null as IEnhancedKnife | null
})

const loadoutStore = useLoadoutStore()
const message = useMessage()
const { t } = useI18n()
const otherTeamHasSkin = useOtherTeamSkin(selectedKnife, skins)
const groupedKnives = useGroupedWeapons(skins)

const knifeOptions = computed(() => {
  return [
    { label: 'Default Knife', value: -1 },
    ...Object.entries(groupedKnives.value).map(([knifeName, knifeData]) => ({
      label: knifeName,
      value: knifeData.weapons[0].weapon_defindex
    }))
  ]
})

const handleKnifeTypeChange = async (team: 't' | 'ct', knifeDefindex: number) => {
  if (!loadoutStore.selectedLoadoutId || !loadoutStore.selectedLoadout || !user.value?.steamId) {
    message.error('Please select a loadout first')
    return
  }

  await fetch(`/api/loadouts/select?steamId=${user.value.steamId}&loadoutId=${loadoutStore.selectedLoadoutId}&type=knife`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'credentials': 'include'
        },
        body: JSON.stringify({
          team: team === 't' ? 1 : 2,
          defindex: knifeDefindex === -1 ? null : knifeDefindex
        })
      }
  ).then(async () => {
    if (!loadoutStore.selectedLoadout) {
      return
    }
    if (team === 't') {
      loadoutStore.selectedLoadout.selected_knife_t = knifeDefindex === -1 ? null : knifeDefindex
    } else {
      loadoutStore.selectedLoadout.selected_knife_ct = knifeDefindex === -1 ? null : knifeDefindex
    }
    updateSelectedKnives()
  }).catch((error) => {
    console.error(error)
    message.error("Failed to update Knife Type")
  })
}

const fetchLoadoutKnives = async () => {
  if (!loadoutStore.selectedLoadoutId || !user.value?.steamId) {
    return
  }
  isLoading.value = true;
  await loadoutStore.fetchLoadoutKnives(user.value.steamId)
      .then(() => {
        skins.value = loadoutStore.loadoutSkins;
        console.log("Fetched loadout knives: ", skins.value)
        updateSelectedKnives();
      })
      .catch(() => {
        message.error("Failed to load knives")
        error.value = 'Failed to load knives. Please try again later.'
      })
      .finally(() => isLoading.value = false);
}

const findKnifeInGroups = (defindex: number | null) => {
  if (!defindex) return null;
  // Flatten the nested arrays and find the matching knife
  return skins.value
      .flat()
      .find(knife => knife.weapon_defindex === defindex);
};

/**
 * Set the selected knives for each team at the top
 * Need to search through all weapon groups to find matching knives
 */
const updateSelectedKnives = () => {
  if (!loadoutStore.selectedLoadout) return;
  selectedTeamKnives.value.terrorists = findKnifeInGroups(loadoutStore.selectedLoadout.selected_knife_t)
  selectedTeamKnives.value.counterTerrorists = findKnifeInGroups(loadoutStore.selectedLoadout.selected_knife_ct)

  // Set initial knife types based on selected knives
  tKnifeType.value = selectedTeamKnives.value.terrorists?.weapon_defindex || -1;
  ctKnifeType.value = selectedTeamKnives.value.counterTerrorists?.weapon_defindex || -1;
}

const handleKnifeClick = (knife: IEnhancedKnife) => {
  console.log('Knife clicked: ', knife)
  selectedKnife.value = knife
  showSkinModal.value = true
}

const handleSkinSave = async (knife: IEnhancedKnife, customization: KnifeConfiguration) => {
  if (!loadoutStore.selectedLoadoutId || !user.value?.steamId) {
    return
  }
  console.log('Saving knife: ', knife, customization)
  await fetch(`/api/knives/save?steamId=${user.value.steamId}&loadoutId=${loadoutStore.selectedLoadoutId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'credentials': 'include'
    },
    body: JSON.stringify({
      defindex: knife.weapon_defindex,
      team: customization.team,
      paintIndex: customization.paintIndex,
      pattern: customization.pattern,
      wear: customization.wear,
      statTrak: customization.statTrak,
      statTrakCount: customization.statTrakCount,
      nameTag: customization.nameTag,
      active: customization.active,
      reset: customization.reset
    })

  }).then(async (response) => {
    const data = await response.json()
    message.success(data.message)
    await fetchLoadoutKnives()
    showSkinModal.value = false
  }).catch((error) => {
    console.error('Error saving knife:', error)
    message.error('Failed to save knife configuration')
  })
}

const handleKnifeDuplicate = async (knife: IEnhancedKnife, customization: KnifeConfiguration) => {
  if (!loadoutStore.selectedLoadoutId || !user.value?.steamId) {
    return
  }

  try {
    console.log('Duplicating knife: ', knife.databaseInfo?.team, customization.team)

    const response = await fetch(`/api/knives/save?steamId=${user.value.steamId}&loadoutId=${loadoutStore.selectedLoadoutId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        defindex: knife.weapon_defindex,
        team: customization.team,
        paintIndex: customization.paintIndex,
        pattern: customization.pattern,
        wear: customization.wear,
        statTrak: customization.statTrak,
        statTrakCount: customization.statTrakCount,
        nameTag: customization.nameTag,
        active: customization.active,
        reset: customization.reset
      })
    })

    const result = await response.json()
    if (result.success) {
      message.success('Knife duplicated successfully')
      await fetchLoadoutKnives()
    } else {
      throw new Error(result.message)
    }
  } catch (error) {
    console.error('Error duplicating knife:', error)
    message.error('Failed to duplicate knife')
  }
}

// No animation code

onMounted(async () => {
  user.value = steamAuth.getSavedUser()
  if (user.value?.steamId) {
    await loadoutStore.fetchLoadouts(user.value.steamId)
        .catch(() => message.error('Failed to load loadouts'))
    if (skins.value.length === 0) {
      await fetchLoadoutKnives()
    }
  }
})



watch(() => showSkinModal.value, (isVisible) => {
  if (!isVisible && selectedKnife.value) {
    console.log('Updating selectedKnife:', selectedKnife.value)
    selectedKnife.value = {...selectedKnife.value}
  }
})

watch(() => loadoutStore.selectedLoadoutId, async (newLoadoutId) => {
  if ((newLoadoutId || skins.value.length === 0) && newLoadoutId !== null) {
    console.log('Fetching knives for new loadout:', newLoadoutId)
    await fetchLoadoutKnives()
  }
}, { immediate: true })
</script>

<template>
  <div class="p-4 bg-[#181818] ">
    <div class="max-w-7xl mx-auto">
      <SkinPageLayout
          title="Knives"
          :user="user"
          :error="error || ''"
          :isLoading="isLoading"
      />
      <!-- Knife Type Groups -->
      <div v-if="!error && !isLoading && user && loadoutStore.selectedLoadoutId">
        <div class="flex gap-x-10 justify-start">
          <div class="flex items-center justify-end space-x-2 ">
            <span class="font-bold  whitespace-nowrap">
              {{ t('teams.counterTerrorists') }}
            </span>
            <NSelect
                v-model:value="ctKnifeType"
                :options="knifeOptions"
                placeholder="Select knife type"
                class="w-48"
                @update:value="handleKnifeTypeChange('ct', $event)"
            />
          </div>
          <div class="flex items-center space-x-2">
            <span class=" font-bold">
              {{ t('teams.terrorists') }}
            </span>
            <NSelect
                v-model:value="tKnifeType"
                :options="knifeOptions"
                placeholder="Select knife type"
                class="w-48"
                @update:value="handleKnifeTypeChange('t', $event)"
            />
          </div>
        </div>
        <!-- Skins Grid -->
        <div class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-2 pt-4">
          <KnifeTabs
              v-for="(knifeData, knifeName) in groupedKnives"
              :key="knifeName"
              :weapon-data="{
              weapons: knifeData.weapons,
              defaultName: knifeData.defaultName,
              defaultImage: knifeData.defaultImage,
              availableTeams: 'both'
            }"
              @weapon-click="handleKnifeClick"
          />
        </div>
        <!-- No Skins State -->
        <div v-if="skins.length === 0" class="text-center py-12">
          <p class="text-gray-400">No skins available for this loadout</p>
        </div>
      </div>

      <!-- Knife Skin Selection & Customization Modal -->
      <KnifeSkinModal
          v-if="user"
          v-model:visible="showSkinModal"
          :user="user"
          :weapon="selectedKnife"
          :other-team-has-skin="otherTeamHasSkin"
          @save="handleSkinSave"
          @duplicate="handleKnifeDuplicate"
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
</style>