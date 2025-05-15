<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { useMessage } from 'naive-ui'
import { useLoadoutStore } from '~/stores/loadoutStore'
import type { SteamUser } from "~/services/steamAuth"
import { steamAuth } from "~/services/steamAuth"
import GloveSkinModal from '~/components/GloveSkinModal.vue'
import { IEnhancedItem, GloveCustomization } from "~/server/utils/interfaces"

const user = ref<SteamUser | null>(null)
const skins = ref<any[]>([])
const isLoading = ref<boolean>(true)
const error = ref<string | null>(null)
const showSkinModal = ref<boolean>(false)
const selectedGlove = ref<IEnhancedItem | null>(null)
const tGloveType = ref<number | null>(null)
const ctGloveType = ref<number | null>(null)
const selectedTeamGloves = ref({
  terrorists: null as IEnhancedItem | null,
  counterTerrorists: null as IEnhancedItem | null
})

const loadoutStore = useLoadoutStore()
const message = useMessage()
const { t } = useI18n()
const otherTeamHasSkin = useOtherTeamSkin(selectedGlove, skins)
const groupedGloves = useGroupedWeapons(skins)

const gloveOptions = computed(() => {
  return [
    { label: 'Default Gloves', value: -1 },
    ...Object.entries(groupedGloves.value).map(([gloveName, gloveData]) => ({
      label: gloveName,
      value: gloveData.weapons[0].weapon_defindex
    }))
  ]
})

const handleGloveTypeChange = async (team: 't' | 'ct', gloveDefindex: number) => {
  if (!loadoutStore.selectedLoadoutId || !loadoutStore.selectedLoadout || !user.value?.steamId) {
    message.error('Please select a loadout first')
    return
  }

  console.log('Glove Type Change', team, gloveDefindex)
  await fetch(`/api/loadouts/select?steamId=${user.value.steamId}&loadoutId=${loadoutStore.selectedLoadoutId}&type=glove`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'credentials': 'include'
        },
        body: JSON.stringify({
          team: team === 't' ? 1 : 2,
          defindex: gloveDefindex === -1 ? null : gloveDefindex
        })
      }
  ).then(async (response) => {
    const data = await response.json()
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
  await loadoutStore.fetchLoadoutGloves(user.value.steamId)
      .then(() => {
        skins.value = loadoutStore.loadoutSkins;
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
  selectedTeamGloves.value.terrorists = findGloveInGroups(loadoutStore.selectedLoadout.selected_glove_t)
  selectedTeamGloves.value.counterTerrorists = findGloveInGroups(loadoutStore.selectedLoadout.selected_glove_ct)

  // Set initial glove types based on selected gloves
  tGloveType.value = selectedTeamGloves.value.terrorists?.weapon_defindex || -1;
  ctGloveType.value = selectedTeamGloves.value.counterTerrorists?.weapon_defindex || -1;
}

const handleGloveClick = (glove: IEnhancedItem) => {
  selectedGlove.value = glove
  showSkinModal.value = true
}

const handleSkinSelect = async (glove: IEnhancedItem, customization: GloveCustomization) => {
  if (!loadoutStore.selectedLoadoutId || !user.value?.steamId) {
    message.error('Please select a loadout first')
    return
  }
  try {
    const response = await fetch(`/api/gloves/save?steamId=${user.value.steamId}&loadoutId=${loadoutStore.selectedLoadoutId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'credentials': 'include'
      },
      body: JSON.stringify({
        defindex: glove.weapon_defindex,
        active: customization.active,
        paintIndex: customization.paintIndex,
        paintIndexOverride: customization.paintIndexOverride,
        wear: customization.wear,
        pattern: customization.pattern,
        team: glove.databaseInfo?.team || customization.team || 0,
        reset: customization.reset
      })
    })

    const data = await response.json()
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

const handleGloveDuplicate = async (glove: IEnhancedItem, customization: GloveCustomization) => {
  if (!loadoutStore.selectedLoadoutId || !user.value?.steamId) {
    message.error('Please select a loadout first')
    return
  }

  try {
    console.log('Duplicating glove: ', glove.databaseInfo?.team, customization.team)
    const response = await fetch(`/api/gloves/save?steamId=${user.value.steamId}&loadoutId=${loadoutStore.selectedLoadoutId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        defindex: glove.weapon_defindex,
        active: true,
        paintIndex: customization.paintIndex,
        wear: customization.wear || 0,
        pattern: customization.pattern || 0,
        team: customization.team, // This will be the opposite team number
        reset: false
      })
    })

    const result = await response.json()
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

onMounted(async () => {
  user.value = steamAuth.getSavedUser()
  if (user.value?.steamId) {
    await loadoutStore.fetchLoadouts(user.value.steamId)
        .catch(() => message.error('Failed to load loadouts'))
    if (skins.value.length === 0) {
      await fetchLoadoutGloves()
    }
  }
})

watch(() => showSkinModal.value, (isVisible) => {
  if (!isVisible && selectedGlove.value) {
    selectedGlove.value = {...selectedGlove.value}
  }
})
</script>

<template>
  <div class="p-4 bg-[#181818] ">
    <div class="max-w-7xl mx-auto">
      <SkinPageLayout
          title="Gloves"
          :user="user"
          :error="error || ''"
          :isLoading="isLoading"
      />
      <!-- Glove Type Groups -->
      <div v-if="!error && !isLoading && user && loadoutStore.selectedLoadoutId">
        <div class="flex gap-x-10 justify-start">
          <div class="flex items-center justify-end space-x-2 ">
            <span class="font-bold  whitespace-nowrap">
              {{ t('teams.counterTerrorists') }}
            </span>
            <NSelect
                v-model:value="ctGloveType"
                :options="gloveOptions"
                placeholder="Select glove type"
                class="w-48"
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
                class="w-48"
                @update:value="handleGloveTypeChange('t', $event)"
            />
          </div>
        </div>
        <!-- Skins Grid -->
        <div class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-2 pt-4">
          <WeaponTabs
              v-for="(gloveData, gloveName) in groupedGloves"
              :key="gloveName"
              :weapon-data="{
              weapons: gloveData.weapons,
              defaultName: gloveData.defaultName,
              defaultImage: gloveData.defaultImage,
              availableTeams: 'both'
            }"
              @weapon-click="handleGloveClick"
          />
        </div>
        <!-- No Skins State -->
        <div v-if="skins.length === 0" class="text-center py-12">
          <p class="text-gray-400">No skins available for this loadout</p>
        </div>
      </div>

      <!-- Glove Skin Selection & Customization Modal -->
      <GloveSkinModal
          v-if="user"
          v-model:visible="showSkinModal"
          :user="user"
          :weapon="selectedGlove"
          :other-team-has-skin="otherTeamHasSkin"
          @select="handleSkinSelect"
          @duplicate="handleGloveDuplicate"
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