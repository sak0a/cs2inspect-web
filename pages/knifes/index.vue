<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { NAlert, NButton, NSpin, useMessage, NSwitch, NCard } from 'naive-ui'
import { useLoadoutStore } from '~/stores/loadoutStore'
import type { SteamUser } from "~/services/steamAuth"
import { steamAuth } from "~/services/steamAuth"
import KnifeSkinModal from '~/components/KnifeSkinModal.vue'
import {IEnhancedWeapon, KnifeCustomization} from "~/server/utils/interfaces"
import { hexToRgba } from "~/utilities/helpers"

const user = ref<SteamUser | null>(null)
const skins = ref<any[]>([])
const isLoading = ref<boolean>(true)
const error = ref<string | null>(null)
const loadoutStore = useLoadoutStore()
const message = useMessage()

const showSkinModal = ref<boolean>(false)
const selectedKnife = ref<IEnhancedWeapon | null>(null)

// Currently selected knives for each team at the top
const selectedTeamKnives = ref({
  terrorists: null as IEnhancedWeapon | null,
  counterTerrorists: null as IEnhancedWeapon | null
})

// Group knives by their type
const groupedKnives = computed(() => {
  return skins.value.reduce((acc, knife) => {
    const knifeType = knife[0].defaultName // Using the first knife in group for the type name
    if (!acc[knifeType]) {
      acc[knifeType] = {
        knives: knife,
        defaultName: knifeType,
        defaultImage: knife[0].defaultImage
      }
    }
    return acc
  }, {})
})

const fetchLoadoutKnifes = async () => {
  if (!loadoutStore.selectedLoadoutId || !user.value?.steamId) {
    return
  }
  isLoading.value = true
  await loadoutStore.fetchLoadoutKnifes(user.value.steamId)
      .then(() => {
        skins.value = loadoutStore.loadoutSkins;

        selectedTeamKnives.value.terrorists = skins.value.find(
            (k: any) => k.databaseInfo?.team === 1 && k.databaseInfo?.active
        )
        selectedTeamKnives.value.counterTerrorists = skins.value.find(
            (k: any) => k.databaseInfo?.team === 2 && k.databaseInfo?.active
        )
      })
      .catch((e) => {
        message.error("Failed to load knifes")
        error.value = 'Failed to load knifes. Please try again later.'
      })
      .finally(() => isLoading.value = false)
}

const handleKnifeClick = (knife: IEnhancedWeapon) => {
  selectedKnife.value = knife
  showSkinModal.value = true
}

const handleSkinSelect = async (knife: IEnhancedWeapon, customization: KnifeCustomization) => {
  if (!loadoutStore.selectedLoadoutId || !user.value?.steamId) {
    message.error('Please select a loadout first')
    return
  }
  try {
    const response = await fetch(`/api/knifes/save?steamId=${user.value.steamId}&loadoutId=${loadoutStore.selectedLoadoutId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'credentials': 'include'
      },
      body: JSON.stringify({
        defindex: knife.weapon_defindex,
        active: customization.active,
        paintIndex: customization.paintIndex,
        wear: customization.wear,
        pattern: customization.pattern,
        statTrak: customization.statTrak,
        statTrakCount: customization.statTrakCount,
        nameTag: customization.nameTag,
        team: knife.databaseInfo?.team || customization.team
      } as KnifeCustomization)
    })

    const data = await response.json()
    if (data.success) {
      message.success(data.message)
      await fetchLoadoutKnifes()
      showSkinModal.value = false
    } else {
      throw new Error(data.message)
    }
  } catch (error) {
    console.error('Error saving knife:', error)
    message.error('Failed to save knife configuration')
  }
}

onMounted(async () => {
  user.value = steamAuth.getSavedUser()
  if (user.value?.steamId) {
    await loadoutStore.fetchLoadouts(user.value.steamId).catch(() => {
      message.error('Failed to load loadouts')
    })
    if (skins.value.length === 0) {
      await fetchLoadoutKnifes()
    }
  }
})

watch(() => loadoutStore.selectedLoadoutId, async (newLoadoutId) => {
  if (newLoadoutId || skins.value.length === 0) {
    await fetchLoadoutKnifes()
  }
}, { immediate: true })
</script>

<template>
  <div class="p-4 bg-[#181818]">
    <div class="max-w-7xl mx-auto">
      <SkinPageLayout
          title="Knifes"
          :user="user"
          :error="error || ''"
          :isLoading="isLoading"
      />
      <!-- Knife Type Groups -->
      <div v-if="!error && !isLoading && user && loadoutStore.selectedLoadoutId">
        <div class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-2 pt-4">
          <div v-for="(knifeData, knifeName) in groupedKnives" :key="knifeName" class="mb-4">
            <!-- Default knife if no skin selected -->
            <NCard
                v-if="!knifeData.knives.some((k: IEnhancedWeapon) => k.databaseInfo?.team)"
                :style="{
                borderColor: '#313030',
                background: '#242424'
              }"
                class="hover:shadow-lg transition-all cursor-pointer bg-[#242424]"
                @click="handleKnifeClick({ ...knifeData.knives[0], databaseInfo: { team: 1 } })"
            >
              <div class="flex flex-col items-center">
                <img
                    :src="knifeData.defaultImage"
                    :alt="knifeData.defaultName"
                    class="w-full h-32 object-contain mb-2"
                    loading="lazy"
                >
                <div class="w-full">
                  <p class="text-sm text-white truncate">{{ knifeData.defaultName }}</p>
                  <div class="h-1 mt-2" style="background: #313030" />
                </div>
              </div>
            </NCard>

            <!-- Knife skins -->
            <NCard
                v-for="knife in knifeData.knives.filter((k: IEnhancedWeapon) => k.databaseInfo?.team)"
                :key="knife.paintIndex"
                :style="{
                  borderColor: knife.rarity?.color || '#313030',
                  background: knife.rarity?.color ?
                  `linear-gradient(135deg, #101010, ${hexToRgba(knife.rarity?.color, '0.15')})` :
                  '#242424'
                }"
                class="hover:shadow-lg transition-all cursor-pointer bg-[#242424]"
                @click="handleKnifeClick(knife)"
            >
              <div class="flex flex-col items-center">
                <img
                    :src="knife.image"
                    :alt="knife.name"
                    class="w-full h-32 object-contain mb-2"
                    loading="lazy"
                >
                <div class="w-full">
                  <p class="text-sm text-white truncate">{{ knife.name }}</p>
                  <div class="h-1 mt-2" :style="{ background: knife.rarity?.color || '#313030' }" />
                </div>
              </div>
            </NCard>
          </div>
        </div>
        <!-- No Skins State -->
        <div v-if="skins.length === 0" class="text-center py-12">
          <p class="text-gray-400">No skins available for this loadout</p>
        </div>
      </div>

      <!-- Knife Skin Selection Modal -->
      <KnifeSkinModal
          v-if="user"
          v-model:visible="showSkinModal"
          :weapon="selectedKnife"
          :user="user"
          @select="handleSkinSelect"
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