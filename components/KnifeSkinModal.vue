<script setup lang="ts">
import { ref, computed } from 'vue'
import { NModal, NInput, NPagination, NCard, NSpin, NSpace, NInputNumber, NSwitch, NButton, useMessage } from 'naive-ui'
import {APISkin, IEnhancedItem, IMappedDBWeapon, KnifeCustomization} from "~/server/utils/interfaces"
import { SteamUser } from "~/services/steamAuth"
import DuplicateItemConfirmModal from "~/components/DuplicateItemModal.vue";
import ResetModal from "~/components/ResetModal.vue";
import {def} from "@vue/shared";

const props = defineProps<{
  visible: boolean
  weapon: IEnhancedKnife | null
  isLoading?: boolean
  otherTeamHasSkin: boolean
  pageSize?: number
  user: SteamUser
}>()

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
  (e: 'save', skin: IEnhancedItem, customization: KnifeCustomization): void
  (e: 'duplicate', skin: IEnhancedItem, customization: KnifeCustomization): void
}>()

const message = useMessage()
const { t } = useI18n()

const state = ref({
  searchQuery: '',
  currentPage: 1,
  skins: [] as APISkin[],
  isLoadingSkins: false,
  showImportModal: false,
  showDetails: false,
  showDuplicateConfirm: false,
  showResetConfirm: false,
  isImporting: false,
  isLoadingInspect: false,
  isDuplicating: false,
  isResetting: false
})

const inheritedWeapon = ref<IEnhancedItem | null>()
const selectedSkin = ref<IEnhancedItem | null>()

const defaultCustomization: KnifeCustomization = {
  active: false,
  statTrak: false,
  statTrakCount: 0,
  paintIndex: 0,
  paintIndexOverride: false,
  pattern: 0,
  wear: 0,
  nameTag: '',
  team: 0,
  reset: false
}
const customization = ref<KnifeCustomization>({ ...defaultCustomization })

const PAGE_SIZE = ref(props.pageSize || 10)

const filteredSkins = computed(() => {
  return state.value.skins.filter(skin =>
      skin.name.toLowerCase().includes(state.value.searchQuery.toLowerCase())
  )
})
const paginatedSkins = computed(() => {
  const start = (state.value.currentPage - 1) * PAGE_SIZE.value
  const end = start + PAGE_SIZE.value
  return filteredSkins.value.slice(start, end)
})
const totalPages = computed(() => Math.ceil(filteredSkins.value.length / PAGE_SIZE.value))

const fetchAvailableSkinsForKnife = async () => {
  if (!props.weapon) return
  state.value.isLoadingSkins = true
  await fetch(`/api/data/skins?weapon=${props.weapon.weapon_name}`)
      .then(async (response) => {
        const data = await response.json()
        state.value.skins = data.skins

        // Check if current page is above available pages and adjust if needed
        const newTotalPages = Math.ceil(data.skins.filter(skin =>
          skin.name.toLowerCase().includes(state.value.searchQuery.toLowerCase())
        ).length / PAGE_SIZE.value)

        if (state.value.currentPage > newTotalPages && newTotalPages > 0) {
          state.value.currentPage = newTotalPages
        }
      }).catch((error) => {
        console.error('Error fetching skins:', error)
      })
      .finally(() => state.value.isLoadingSkins = false)
}

const handleReset = () => {
  if (!props.weapon || !props.user) return

  customization.value.reset = true
  emit('save', props.weapon, customization.value)
  state.value.showResetConfirm = false
}

const handleDuplicate = async () => {
  if (!selectedSkin.value) return

  state.value.isDuplicating = true
  const duplicateData = {
    ...customization.value,
    team: oppositeTeam(props.weapon?.databaseInfo?.team || 1)
  }

  emit('duplicate', selectedSkin.value, duplicateData)

  state.value.showDuplicateConfirm = false
  state.value.isDuplicating = false
}
const handleSkinSelect = (skin: APISkin) => {
  selectedSkin.value = {
    ...props.weapon!,
    name: skin.name,
    defaultName: skin.name,
    image: skin.image,
    defaultImage: skin.image,
    minFloat: skin.min_float ?? 0,
    maxFloat: skin.max_float ?? 1,
    paintIndex: Number(skin.paint_index),
    rarity: skin.rarity,
    availableTeams: 'both',
  }
  customization.value = {
    ...customization.value,
    paintIndex: Number(skin.paint_index),
    wear: Number(skin.min_float ?? 0),
  }
}

const handleImportInspectLink = async (inspectUrl: string) => {
  if (!props.weapon || !props.user) return

  try {
    state.value.isImporting = true
    const response = await fetch(`/api/knifes/inspect?url=decode-link&steamId=${props.user.steamId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'credentials': 'include'
      },
      body: JSON.stringify({ inspectUrl })
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message)
    }

    if (data.defindex !== props.weapon.weapon_defindex) {
      throw new Error(t('modals.knifeSkin.invalidInspectLink') as string)
    }

    customization.value = {
      active: true,
      statTrak: data.killeaterscoretype !== null,
      statTrakCount: data.killeatervalue || 0,
      paintIndex: data.paintindex,
      paintIndexOverride: false,
      pattern: data.paintseed,
      wear: data.paintwear,
      nameTag: data.customname || '',
      team: props.weapon.databaseInfo?.team || 0
    }

    const matchingSkin = state.value.skins.find(skin =>
        Number(skin.paint_index) === data.paintindex
    )

    if (matchingSkin) {
      selectedSkin.value = {
        ...props.weapon!,
        name: matchingSkin.name,
        defaultName: matchingSkin.name,
        image: matchingSkin.image,
        defaultImage: matchingSkin.image,
        minFloat: matchingSkin.min_float ?? 0,
        maxFloat: matchingSkin.max_float ?? 1,
        paintIndex: Number(matchingSkin.paint_index),
        rarity: matchingSkin.rarity,
        availableTeams: matchingSkin.team?.id ?? 'both',
      }
    }

    message.success(t('modals.knifeSkin.importSuccess') as string, { duration: 3000 })
    state.value.showImportModal = false
  } catch (error: any) {
    message.error(error.message || t('modals.knifeSkin.importFailed') as string, { duration: 3000 })
  } finally {
    state.value.isImporting = false
  }
}
const handleCreateInspectLink = async () => {
  if (!props.weapon || !selectedSkin || !props.user) return

  try {
    state.value.isLoadingInspect = true
    const response = await fetch(`/api/knifes/inspect?url=create-link&steamId=${props.user.steamId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'credentials': 'include'},
      body: JSON.stringify({
        defindex: props.weapon.weapon_defindex,
        paintIndex: customization.value.paintIndex,
        pattern: customization.value.pattern,
        wear: customization.value.wear,
        rarity: 0,
        statTrak: customization.value.statTrak,
        statTrakCount: customization.value.statTrakCount,
        nameTag: customization.value.nameTag
      })
    })
    const data = await response.json()
    if (!response.ok) {
      throw new Error(data.message)
    }
    const link: string = data.inspectUrl
    await navigator.clipboard.writeText(link)
    message.success(t('modals.knifeSkin.generateInspectUrlSuccess') as string, { duration: 3000 })
  } catch (error) {
    message.error(t('modals.knifeSkin.generateInspectUrlFailed') as string, { duration: 3000 })
    console.log('Error generating inspect link:', error)
  } finally {
    state.value.isLoadingInspect = false
  }
}

const handleSave = () => {
  if (!selectedSkin.value) return
  console.log('Saving knife: ', selectedSkin.value, customization.value)
  emit('save', selectedSkin.value, customization.value)
  handleClose()
}

const handleClose = () => {
  emit('update:visible', false)
  setTimeout(() => {
    state.value.searchQuery = ''
    selectedSkin.value = null
    inheritedWeapon.value = null
    customization.value = { ...defaultCustomization }
  }, 300)
}

watch(() => customization.value.wear, (newWear) => {
  if (typeof newWear === 'number' && !isNaN(newWear)) {
    customization.value.wear = Number(newWear.toFixed(3))
  }
}, { immediate: true })

// Watch for changes to searchQuery to adjust current page if needed
watch(() => state.value.searchQuery, () => {
  // When search query changes, check if we need to adjust the current page
  const newTotalPages = Math.ceil(filteredSkins.value.length / PAGE_SIZE.value)
  if (state.value.currentPage > newTotalPages && newTotalPages > 0) {
    state.value.currentPage = newTotalPages
  } else if (newTotalPages > 0) {
    // Reset to page 1 when search query changes
    state.value.currentPage = 1
  }
})

// Watch for changes to props.visible to check pagination when modal is opened
watch(() => props.visible, (isVisible) => {
  if (isVisible && filteredSkins.value.length > 0) {
    // Check if current page is above available pages and adjust if needed
    const newTotalPages = Math.ceil(filteredSkins.value.length / PAGE_SIZE.value)
    if (state.value.currentPage > newTotalPages && newTotalPages > 0) {
      state.value.currentPage = newTotalPages
    }
  }
})

watch(() => props.weapon, () => {
  if (props.visible && props.weapon) {
    console.log('KnifeSkinModal - watch props.weapon:', props.weapon)
    inheritedWeapon.value = props.weapon
    customization.value.team = props.weapon.team || 1
    fetchAvailableSkinsForKnife()

    const dbInfo = props.weapon.databaseInfo as DBKnife
    if (dbInfo) {
      customization.value = {
        active: dbInfo.active || false,
        statTrak: dbInfo.stattrak_enabled || false,
        statTrakCount: dbInfo.stattrak_count | 0,
        defindex: dbInfo.defindex | 0,
        paintIndex: dbInfo.paintindex | 0,
        paintIndexOverride: false,
        pattern: parseInt(dbInfo.paintseed) | 0,
        wear: parseFloat(dbInfo.paintwear),
        nameTag: dbInfo.nametag || '',
        team: dbInfo.team || 0
      }
    }
    selectedSkin.value = inheritedWeapon.value
  }
})
</script>

<template>
  <NModal
      :show="visible"
      style="width: 1200px"
      preset="card"
      :title="weapon ? t('modals.knifeSkin.title', { weaponName: weapon?.defaultName }) as string : t('modals.knifeSkin.defaultTitle') as string"
      :bordered="false"
      size="huge"
      @update:show="handleClose"
  >
    <template #header-extra>
      <!-- Reset Button -->
      <NButton secondary type="default" :disabled="!selectedSkin || customization.paintIndex == 0" @click="state.showResetConfirm = true">
        <template #icon>
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-refresh">
            <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
            <path d="M20 11a8.1 8.1 0 0 0 -15.5 -2m-.5 -4v4h4" />
            <path d="M4 13a8.1 8.1 0 0 0 15.5 2m.5 4v-4h-4" />
          </svg>
        </template>
        {{ t('modals.knifeSkin.buttons.reset') }}
      </NButton>
      <NDivider vertical />

      <!-- Import Knife by Inspect Link -->
      <NButton :loading="state.isImporting" secondary type="default" :disabled="!selectedSkin" @click="state.showImportModal = true">
        <template #icon>
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-zoom-scan">
            <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
            <path d="M4 8v-2a2 2 0 0 1 2 -2h2"/>
            <path d="M4 16v2a2 2 0 0 0 2 2h2"/>
            <path d="M16 4h2a2 2 0 0 1 2 2v2"/>
            <path d="M16 20h2a2 2 0 0 0 2 -2v-2"/>
            <path d="M8 11a3 3 0 1 0 6 0a3 3 0 0 0 -6 0"/>
            <path d="M16 16l-2.5 -2.5"/>
          </svg>
        </template>
        {{ t('modals.knifeSkin.buttons.importFromLink') }}
      </NButton>
      <NDivider vertical />

      <!-- Generate Knife Inspect Link -->
      <NButton :loading="state.isLoadingInspect" secondary type="default" :disabled="!selectedSkin" @click="handleCreateInspectLink">
        <template #icon>
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-zoom-scan">
            <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
            <path d="M4 8v-2a2 2 0 0 1 2 -2h2"/>
            <path d="M4 16v2a2 2 0 0 0 2 2h2"/>
            <path d="M16 4h2a2 2 0 0 1 2 2v2"/>
            <path d="M16 20h2a2 2 0 0 0 2 -2v-2"/>
            <path d="M8 11a3 3 0 1 0 6 0a3 3 0 0 0 -6 0"/>
            <path d="M16 16l-2.5 -2.5"/>
          </svg>
        </template>
        {{ t('modals.knifeSkin.buttons.generateLink') }}
      </NButton>
      <NDivider vertical />

      <!-- Knife Search -->
      <NInput
          v-model:value="state.searchQuery"
          :placeholder="t('modals.knifeSkin.inputs.searchPlaceholder') as string"
          class="pl-1 w-96"
      />
    </template>

    <NSpace vertical size="large" class="-mt-2">
      <!-- Selected Skin Preview -->
      <div v-if="inheritedWeapon" class="bg-[#1a1a1a] p-6 rounded-lg">
        <div class="grid grid-cols-2 gap-6">
          <!-- Left side - Image -->
          <div>
            <img
                :src="selectedSkin?.image"
                :alt="selectedSkin?.name"
                class="w-full h-64 object-contain"
            />
            <h3 class="text-lg font-bold mt-2">{{ selectedSkin?.name }}</h3>
          </div>

          <!-- Right side - Customization -->
          <div class="space-y-6 flex flex-col items-center">
            <!-- StatTrak and Name Tag -->
            <div class="grid grid-cols-2 gap-4 w-full">
              <div class="flex items-center space-x-4">
                <NSwitch v-model:value="customization.statTrak" />
                <span>{{ t('modals.knifeSkin.labels.stattrak') }}</span>
                <NInputNumber
                    :disabled="!customization.statTrak"
                    v-model:value="customization.statTrakCount"
                    :min="0"
                    :max="99999"
                    class="w-28"
                />
              </div>
              <NInput
                  v-model:value="customization.nameTag"
                  :placeholder="t('modals.knifeSkin.inputs.nameTagPlaceholder') as string"
                  class="pl-1"
              />
            </div>

            <!-- Paint Settings -->
            <div class="grid grid-cols-2 gap-4 w-full">
              <div class="space-y-2">
                <div class="flex items-center justify-between">
                  <h4 class="font-bold">{{ t('modals.knifeSkin.labels.paintIndex') }}</h4>
                  <div class="flex items-center space-x-2">
                    <NSwitch v-model:value="customization.paintIndexOverride" />
                    <span class="text-sm">{{ t('modals.knifeSkin.labels.paintIndexOverride') }}</span>
                  </div>
                </div>
                <NInputNumber
                    v-model:value="customization.paintIndex"
                    :min="0"
                    :max="9999"
                    :disabled="!customization.paintIndexOverride"
                />
              </div>

              <div class="space-y-2">
                <h4 class="font-bold">{{ t('modals.knifeSkin.labels.pattern') }}</h4>
                <NInputNumber
                    v-model:value="customization.pattern"
                    :min="0"
                    :max="1000"
                />
              </div>
            </div>

            <!-- Wear Slider -->
            <div class="w-full">
              <div class="flex items-start justify-between">
                <h4 class="font-bold">{{ t('modals.knifeSkin.labels.wear') }}</h4>
              </div>
              <WearSlider
                  v-model="customization.wear"
                  :max="selectedSkin?.maxFloat ?? 1"
                  :min="selectedSkin?.minFloat ?? 0"
              />
            </div>

            <!-- Save Button & Active Switch -->
            <div class="flex items-center justify-center w-full mt-0 gap-2">
              <!-- Save Knife -->
              <NButton type="success"  secondary class="w-40" @click="handleSave">
                {{ t('modals.knifeSkin.buttons.save') }}
              </NButton>

              <!-- Duplicate Knife -->
              <div>
                <NButton
                    :disabled="!selectedSkin || customization.paintIndex == 0"
                    type="default"
                    secondary
                    class="w-full"
                    @click="state.showDuplicateConfirm = true"
                >
                  {{ t('modals.knifeSkin.buttons.duplicate') }}
                </NButton>
              </div>

              <NSpace justify="center" align="center" class="w-full h-full">
                <NSwitch v-model:value="customization.active" size="large" class="col-span-1">
                  <template #checked>
                    {{ t('modals.knifeSkin.labels.itemActive') }}
                  </template>
                  <template #unchecked>
                    {{ t('modals.knifeSkin.labels.itemInactive') }}
                  </template>
                </NSwitch>
              </NSpace>
            </div>
          </div>
        </div>
      </div>

      <!-- Skins Grid -->
      <div v-if="!state.isLoadingSkins" class="grid grid-cols-5 gap-4">
        <NCard
            v-for="skin in paginatedSkins"
            :key="skin.id"
            :style="{
            borderColor: skin.rarity?.color || '#313030',
            background: `linear-gradient(135deg, #101010, ${
              hexToRgba(skin.rarity?.color || '#313030', '0.15')
            })`
          }"
            :class="[
            'hover:shadow-lg cursor-pointer transition-all rounded-xl',
            selectedSkin?.name === skin.name ? 'ring-2 ring-[#80E6C4] !border-0 opacity-85' : ''
          ]"
            @click="handleSkinSelect(skin)"
        >
          <div class="flex flex-col items-center">
            <img
                :src="skin.image"
                :alt="skin.name"
                class="w-full h-32 object-contain mb-2"
                loading="lazy"
            />
            <div class="w-full">
              <p class="text-sm text-white truncate">{{ skin.name.replace('★ ' + skin.weapon.name + ' | ', '') }}</p>
              <div
                  class="h-1 mt-2"
                  :style="{ background: skin.rarity?.color || '#313030' }"
              />
            </div>
          </div>
        </NCard>
      </div>

      <!-- Loading State -->
      <div v-if="state.isLoadingSkins" class="flex justify-center items-center h-64">
        <NSpin size="large" />
      </div>

      <!-- No Results -->
      <div v-if="!state.isLoadingSkins && filteredSkins.length === 0" class="flex justify-center items-center h-64">
        <NEmpty :description="t('modals.knifeSkin.noSearchResults') as string" />
      </div>

      <!-- Pagination -->
      <div v-if="totalPages > 1" class="flex justify-center mt-4">
        <NPagination
            v-model:page="state.currentPage"
            :page-count="totalPages"
            :page-slot="5"
        />
      </div>
    </NSpace>

    <!-- Import via InspectURL Modal -->
    <InspectURLModal
        v-model:visible="state.showImportModal"
        :loading="state.isImporting"
        @submit="handleImportInspectLink"
    />

    <!-- Duplicate Modal -->
    <DuplicateItemConfirmModal
        v-model:visible="state.showDuplicateConfirm"
        :loading="state.isDuplicating"
        :other-team-has-skin="otherTeamHasSkin"
        :item-type="t('modals.duplicateItem.type.knife') as string"
        @confirm="handleDuplicate"
    />

    <!-- Reset Confirmation Modal -->
    <ResetModal
        v-model:visible="state.showResetConfirm"
        :loading="state.isResetting"
        @confirm="handleReset"
    />
  </NModal>
</template>

<style scoped>
.n-card {
  background: #242424;
  border: 1px solid #313030;
}
</style>