<script setup lang="ts">
import { APISkin, WeaponCustomization } from '~/server/utils/interfaces'
import { ref, computed } from 'vue'
import { useMessage, NModal, NInput, NPagination, NCard, NSpin, NSpace, NEmpty, NInputNumber, NSwitch, NButton } from 'naive-ui'
import { hexToRgba } from "~/utilities/helpers";
import { EnhancedWeaponResponse } from "~/server/api/weapons/[type]";
import { SteamUser } from "~/services/steamAuth";

interface Props {
  visible: boolean
  weapon: EnhancedWeaponResponse | null
  isLoading?: boolean
  otherTeamHasSkin: boolean
  pageSize?: number
  user: SteamUser
}
const props = defineProps<Props>()
const message = useMessage()
const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
  (e: 'select', skin: EnhancedWeaponResponse, customization: WeaponCustomization): void
  (e: 'duplicate', skin: EnhancedWeaponResponse, customization: WeaponCustomization): void
}>()
// Basic state
// APISkin because we are only fetching from the API with the same structure (images/name/rarity)
const state = ref({
  searchQuery: '',
  currentPage: 1,
  skins: [] as APISkin[],
  isLoadingSkins: false,
  showStickerModal: false,
  showKeychainModal: false,
  showImportModal: false,
  showDetails: false,
  currentStickerPosition: 0,
  showDuplicateConfirm: false,
  isImporting: false,
  isLoadingInspect: false,
  isDuplicating: false
})

const inheritedWeapon = ref<EnhancedWeaponResponse | null>()
const selectedSkin = ref<EnhancedWeaponResponse | null>()

const defaultCustomization: WeaponCustomization = {
  active: false,
  statTrak: false,
  statTrakCount: 0,
  paintIndex: 0,
  paintIndexOverride: false,
  pattern: 0,
  wear: 0,
  nameTag: '',
  stickers: [null, null, null, null, null],
  keychain: null,
  team: 0
}
const customization = ref<WeaponCustomization>({ ...defaultCustomization })

const PAGE_SIZE = ref(props.pageSize || 10);

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

const fetchSkinsForWeapon = async () => {
  if (!props.weapon) return
  try {
    state.value.isLoadingSkins = true
    const response = await fetch(`/api/data/skins?weapon=${props.weapon.weapon_name}`)
    const data = await response.json()
    state.value.skins = data.skins
  } catch (error) {
    console.error('Error fetching skins:', error)
  } finally {
    state.value.isLoadingSkins = false
  }
}

const handleDuplicate = async () => {
  if (!selectedSkin.value) return

  state.value.isDuplicating = true
  try {
    // Calculate the other team number (if current is 1, other is 2 and vice versa)
    const otherTeam = props.weapon?.databaseInfo?.team === 1 ? 2 : 1

    // Create copy of current customization for other team
    const duplicateData = {
      ...customization.value,
      team: otherTeam
    }

    // Emit duplicate event to parent
    emit('duplicate', selectedSkin.value, duplicateData)

    state.value.showDuplicateConfirm = false
  } catch (error) {
    console.error('Error duplicating weapon:', error)
  } finally {
    state.value.isDuplicating = false
  }
}

const mapCustomizationToRepresentation = (customization: WeaponCustomization) => {
  const stickers = customization.stickers.map((sticker, index) => {
    if (!sticker) return null;
    return {
      slot: index || 0,
      sticker_id: sticker.id,
      wear: sticker.wear,
      scale: sticker.scale,
      rotation: sticker.rotation,
      offset_x: sticker.x,
      offset_y: sticker.y,
    };
  }).filter(sticker => sticker !== null);

  const keychain = customization.keychain ? {
    slot: 0,
    sticker_id: customization.keychain.id,
    offset_x: customization.keychain.x,
    offset_y: customization.keychain.y,
    offset_z: customization.keychain.z,
    pattern: customization.keychain.seed
  } : null;
  console.log('WeaponSkinModal - Mapping customization to representation:', { stickers, keychain });
  return {
    stickers,
    keychain
  };
};

const handleImportInspectLink = async (inspectUrl: string) => {
  if (!props.weapon || !props.user) return

  try {
    state.value.isImporting = true
    const response = await fetch(`/api/weapons/inspect?url=decode-link&steamId=${props.user.steamId}`, {
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
      throw new Error('Inspect URL does not match selected weapon')
    }

    // Fetch sticker data in parallel
    const stickerPromises = data.stickers?.map(async (sticker: any, index: number) => {
      if (!sticker) return null
      const response = await fetch(`/api/data/stickers?id=sticker-${sticker.sticker_id}`)
      const data = await response.json()
      const stickerData = data.stickers[0]

      if (!stickerData) return null

      return {
        id: sticker.sticker_id,
        x: sticker.offset_x || 0,
        y: sticker.offset_y || 0,
        wear: sticker.wear || 0,
        scale: sticker.scale || 1,
        rotation: sticker.rotation || 0,
        index,
        api: {
          name: stickerData.name,
          image: stickerData.image,
          type: stickerData.type,
          effect: stickerData.effect,
          tournament_event: stickerData.tournament_event,
          tournament_team: stickerData.tournament_team,
          rarity: stickerData.rarity,
        }
      }
    }) || []

    // Fetch keychain data if exists
    let keychainPromise
    if (data.keychains?.[0]) {
      keychainPromise = await fetch(`/api/data/keychains?id=keychain-${data.keychains[0].sticker_id}`)
          .then(res => res.json())
          .then(keychainData => {
            const keychain = keychainData.keychains[0]
            if (!keychain) return null

            return {
              id: data.keychains[0].sticker_id,
              x: data.keychains[0].offset_x || 0,
              y: data.keychains[0].offset_y || 0,
              z: data.keychains[0].offset_z || 0,
              seed: data.keychains[0].pattern || 0,
              api: {
                name: keychain.name,
                image: keychain.image,
                rarity: keychain.rarity
              }
            }
          })
    }

    // Wait for all data to be fetched
    const [stickerResults, keychainData] = await Promise.all([
      Promise.all(stickerPromises),
      keychainPromise
    ])

    // Initialize array with nulls
    const stickers = Array(5).fill(null)

    // Sort sticker results by their original index and place them in order
    stickerResults
        .filter(Boolean) // Remove any null results
        .sort((a, b) => a.index - b.index) // Sort by original index
        .forEach((stickerData, index) => {
          if (stickerData && index < 5) {
            // Remove the temporary index property before assigning
            const { index: _, ...stickerWithoutIndex } = stickerData
            stickers[index] = stickerWithoutIndex
          }
        })

    // Update customization with complete data
    customization.value = {
      active: true,
      statTrak: data.killeaterscoretype !== null,
      statTrakCount: data.killeatervalue || 0,
      paintIndex: data.paintindex,
      paintIndexOverride: false,
      pattern: data.paintseed,
      wear: data.paintwear,
      nameTag: data.customname || '',
      stickers,
      keychain: keychainData,
      team: props.weapon.databaseInfo?.team || 0
    }

    // Update selected skin based on paint index
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

    message.success('Successfully imported weapon configuration', { duration: 3000 })
    state.value.showImportModal = false
  } catch (error: any) {
    message.error(error.message || 'Failed to import weapon configuration', { duration: 3000 })
  } finally {
    state.value.isImporting = false
  }
}
const handleCreateInspectLink = async () => {
  if (!props.weapon || !selectedSkin || !props.user) return

  try {
    state.value.isLoadingInspect = true
    const customizationRepresentation = mapCustomizationToRepresentation(customization.value);
    const response = await fetch(`/api/weapons/inspect?url=create-link&steamId=${props.user.steamId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'credentials': 'include'
      },
      body: JSON.stringify({
        defindex: props.weapon.weapon_defindex,
        paintIndex: customization.value.paintIndex,
        pattern: customization.value.pattern,
        wear: customization.value.wear,
        rarity: 0,
        statTrak: customization.value.statTrak,
        statTrakCount: customization.value.statTrakCount,
        nameTag: customization.value.nameTag,
        stickers: customizationRepresentation.stickers,
        keychain: customizationRepresentation.keychain
      })
    })
    const data = await response.json()
    if (!response.ok) {
      throw new Error(data.message)
    }
    const link: string = data.inspectUrl
    await navigator.clipboard.writeText(link)
    message.success('Inspect link copied to clipboard' , { duration: 3000 })
  } catch (error) {
    console.error('Error creating inspect link:', error)
  } finally {
    state.value.isLoadingInspect = false
  }
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
    availableTeams: skin.team?.id ?? 'both',
  }
  customization.value = {
    ...customization.value,
    paintIndex: Number(skin.paint_index),
    wear: Number(skin.min_float ?? 0),
  }
}
// Deactivating this skin will remain it's configuration but will no longer be used on the server

const handleStickerDragStart = (e: DragEvent, fromIndex: number) => {
  if (!e.dataTransfer) return
  e.dataTransfer.effectAllowed = 'move'
  e.dataTransfer.setData('text/plain', fromIndex.toString())

  // Add dragging class to source element
  const el = e.target as HTMLElement
  el.classList.add('dragging')
}
const handleStickerDragEnd = (e: DragEvent) => {
  const el = e.target as HTMLElement
  el.classList.remove('dragging')
}
const handleStickerDragOver = (e: DragEvent) => {
  e.preventDefault()
  e.stopPropagation()

  const el = e.target as HTMLElement
  el.classList.add('drag-over')
}
const handleStickerDragLeave = (e: DragEvent) => {
  const el = e.target as HTMLElement
  el.classList.remove('drag-over')
}
const handleStickerDrop = (e: DragEvent, toIndex: number) => {
  e.preventDefault()
  const el = e.target as HTMLElement
  el.classList.remove('drag-over')

  const fromIndex = parseInt(e.dataTransfer?.getData('text/plain') || '-1')
  if (fromIndex === -1 || fromIndex === toIndex) return

  // Swap stickers in the customization object
  const stickers = [...customization.value.stickers]
  const temp = stickers[fromIndex]
  stickers[fromIndex] = stickers[toIndex]
  stickers[toIndex] = temp
  customization.value.stickers = stickers
}
const handleAddSticker = (position: number) => {
  state.value.currentStickerPosition = position
  state.value.showStickerModal = true
}
const handleStickerSelect = (stickerData: any) => {
  if (!selectedSkin.value) {
    message.error('Please select a weapon first')
    return
  }
  customization.value.stickers[state.value.currentStickerPosition] = stickerData
}

const handleAddKeychain = () => {
  state.value.showKeychainModal = true
}
const handleKeychainSelect = (keychainData: any) => {
  if (!selectedSkin.value) {
    message.error('Please select a weapon first')
    return
  }
  customization.value.keychain = keychainData
}

const handleSave = () => {
  if (!selectedSkin.value) return
  emit('select', selectedSkin.value, customization.value)
  emit('update:visible', false)
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
        customization.value.wear = Number(newWear.toFixed(3));
      }
    }, { immediate: true }
);

watch(() => props.weapon, () => {
  if (props.visible && props.weapon) {
    inheritedWeapon.value = props.weapon
    fetchSkinsForWeapon()

    const dbInfo = props.weapon.databaseInfo
    if (dbInfo) {
      customization.value = {
        active: Boolean(dbInfo.active) || false,
        statTrak: Boolean(dbInfo.statTrak) || false,
        statTrakCount: Number(dbInfo.statTrakCount) | 0,
        paintIndex: Number(dbInfo.paintIndex) | 0,
        paintIndexOverride: false,
        pattern: Number(dbInfo.pattern) | 0,
        wear: Number(dbInfo.paintWear),
        nameTag: dbInfo.nameTag || '',
        stickers: dbInfo.stickers || [null, null, null, null, null],
        keychain: dbInfo.keychain ?? null,
        team: Number(dbInfo.team)
      }
    } else if (props.weapon.databaseInfo?.team !== undefined) {
      customization.value.team = Number(props.weapon.databaseInfo.team)
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
      :title="weapon ? `Select Skin for ${weapon.defaultName}` : 'Select Skin'"
      :bordered="false"
      size="huge"
      @update:show="handleClose"
  >
    <template #header-extra>
      <!-- Import Weapon by Inspect Link -->
      <NButton :loading="state.isImporting" secondary type="default" :disabled="!selectedSkin"  @click="state.showImportModal = true">
        <template #icon>
          <svg  xmlns="http://www.w3.org/2000/svg"  width="24"  height="24"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-zoom-scan"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M4 8v-2a2 2 0 0 1 2 -2h2" /><path d="M4 16v2a2 2 0 0 0 2 2h2" /><path d="M16 4h2a2 2 0 0 1 2 2v2" /><path d="M16 20h2a2 2 0 0 0 2 -2v-2" /><path d="M8 11a3 3 0 1 0 6 0a3 3 0 0 0 -6 0" /><path d="M16 16l-2.5 -2.5" /></svg>
        </template>
        Import from Link
      </NButton>
      <NDivider vertical />

      <!-- Generate Weapon Inspect Link by Data -->
      <NButton :loading="state.isLoadingInspect" secondary type="default" :disabled="!selectedSkin" @click="handleCreateInspectLink">
        <template #icon>
          <svg  xmlns="http://www.w3.org/2000/svg"  width="24"  height="24"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-zoom-scan"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M4 8v-2a2 2 0 0 1 2 -2h2" /><path d="M4 16v2a2 2 0 0 0 2 2h2" /><path d="M16 4h2a2 2 0 0 1 2 2v2" /><path d="M16 20h2a2 2 0 0 0 2 -2v-2" /><path d="M8 11a3 3 0 1 0 6 0a3 3 0 0 0 -6 0" /><path d="M16 16l-2.5 -2.5" /></svg>
        </template>
        Generate Link
      </NButton>
      <NDivider vertical />

      <!-- Weapon Search -->
      <NInput
          v-model:value="state.searchQuery"
          placeholder="Search skins..."
          class="pl-1 w-96"
      />
    </template>

    <NSpace vertical size="large" class="-mt-2">
      <!-- Selected Skin Preview -->
      <div v-if="inheritedWeapon" class="bg-[#1a1a1a] p-6  rounded-lg">
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
                <span>StatTrak™</span>
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
                  placeholder="Name Tag"
                  class="pl-1"
              />
            </div>

            <!-- Paint Settings -->
            <div class="grid grid-cols-2 gap-4 w-full">
              <div class="space-y-2">
                <div class="flex items-center justify-between">
                  <h4 class="font-bold">Paint Index</h4>
                  <div class="flex items-center space-x-2">
                    <NSwitch v-model:value="customization.paintIndexOverride" />
                    <span class="text-sm">Override</span>
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
                <h4 class="font-bold">Paint Pattern (Seed) </h4>
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
                <h4 class="font-bold">Wear (Float)</h4>
              </div>
              <WearSlider
                  v-model="customization.wear"
                  :max="selectedSkin?.maxFloat ?? 1"
                  :min="selectedSkin?.minFloat ?? 0"
              />
            </div>

            <!-- Save Button & Active Switch-->
            <div class="flex items-center justify-center w-full mt-0 gap-2">
              <!-- Save Weapon -->
              <NButton type="success" secondary :class="[
                selectedSkin?.availableTeams !== 'both' ? 'w-96' : 'w-40']" @click="handleSave">
                Save Changes
              </NButton>
              <!-- Duplicate Weapon -->
              <div v-if="selectedSkin?.availableTeams === 'both'" class="">
                <NButton
                    :disabled="!selectedSkin"
                    type="default"
                    secondary
                    class="w-full"
                    @click="state.showDuplicateConfirm = true"
                >
                  Duplicate to Other Team
                </NButton>
              </div>

              <NSpace justify="center" align="center" class="w-full h-full">
                <NSwitch v-model:value="customization.active" size="large" class="col-span-1">
                  <template #checked>
                    Active
                  </template>
                  <template #unchecked>
                    Inactive
                  </template>
                </NSwitch>
              </NSpace>
            </div>

            <!-- Stickers & Keychain Toggle and Duplicate Weapon Buttons -->
            <!--<div class="flex flex-row w-max items-center justify-center gap-4">
              <NButton
                  text
                  class="text-gray-400 hover:text-gray-200"
                  @click="state.showDetails = !state.showDetails"
                  icon-placement="right"
              >
                <template #icon>
                  <NIcon v-if="state.showDetails"><ChevronUpIcon/></NIcon>

                  <NIcon v-else><ChevronDownIcon/></NIcon>
                </template>
                {{ state.showDetails ? 'Hide' : 'Show' }} Stickers & Keychain
              </NButton>
            </div>-->
          </div>
        </div>
        <!-- Sticker and Keychain customization-->
        <div class="grid grid-cols-6 gap-4 auto-rows-fr" :class="{ 'h-[0px]': state.showDetails }">
          <!-- Stickers -->
          <div class="col-span-5 mt-4">
            <h4 class="font-bold mb-1">Stickers</h4>
            <div class="grid grid-cols-5 gap-x-2 min-h-36 max-h-36">
              <div
                  v-for="(sticker, index) in customization.stickers"
                  :key="index"
                  class="sticker-slot flex items-center justify-center bg-[#242424] p-2 rounded cursor-move transition-all relative hover:bg-[#2a2a2a]"
                  :class="{ 'inactive-item': !sticker, 'active-item': sticker }"
                  draggable="true"
                  @dragstart="handleStickerDragStart($event, index)"
                  @dragend="handleStickerDragEnd"
                  @dragover="handleStickerDragOver"
                  @dragleave="handleStickerDragLeave"
                  @drop="handleStickerDrop($event, index)"
                  @click.stop="handleAddSticker(index)"
              >
                <div v-if="sticker" class="h-28 relative group">
                  <img
                      :src="sticker.api.image"
                      :alt="sticker.api.name"
                      class="w-full h-full object-contain"
                  />
                  <div class="absolute inset-0 bg-white rounded-lg bg-opacity-10 backdrop-blur-sm opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <span class="text-white text-xs">Drag to reposition</span>
                  </div>
                </div>
                <div v-else class="h-28 flex items-center justify-center">
                  <span class="text-gray-400 text-sm">Add Sticker</span>
                </div>
                <div class="mt-1 absolute top-0 left-1 text-xs text-gray-400">
                  #{{ index + 1 }}
                </div>
              </div>
            </div>
          </div>
          <!-- Keychain -->
          <div class="col-span-1 mt-4">
            <h4 class="font-bold mb-1">Keychain</h4>
            <div
                class="items-center flex justify-center bg-[#242424] p-2 rounded cursor-pointer hover:bg-[#2a2a2a] transition-all min-h-36 max-h-36"
                :class="{ 'inactive-item': !customization.keychain, 'active-item': customization.keychain }"
                @click="handleAddKeychain"
            >
              <div v-if="customization.keychain" class=" relative group h-30">
                <img
                    :src="customization.keychain.api.image"
                    :alt="customization.keychain.api.name"
                    class="w-full h-full object-contain"
                />
                <p class="text-sm text-center text-gray-400 mt-1">{{ customization.keychain.api.name.replace('Charm | ', '') }}</p>
              </div>
              <div v-else class="h-30 flex items-center justify-center">
                <span class="text-gray-400 text-sm">Add Keychain</span>
              </div>

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
              background: 'linear-gradient(135deg, ' + ('#101010') +
              ', ' + (hexToRgba(skin.rarity?.color, '0.15') || '#313030') + ')'}"
            :class="[
            'hover:shadow-lg cursor-pointer bg-[#242424]',
            selectedSkin?.name === skin.name ? 'active-item opacity-65' : ''
          ]"
            @click="handleSkinSelect(skin)"
        >
          <div class="flex flex-col items-center">
            <img
                :src="skin.image"
                :alt="skin.name"
                class="w-full h-32 object-contain mb-2"
                loading="lazy"
            >
            <div class="w-full">
              <p class="text-sm text-white truncate">{{ skin.name }}</p>
              <div class="h-1 mt-2" :style="{ background: skin.rarity?.color || '#313030' }" />
            </div>
          </div>
        </NCard>
      </div>

      <!-- Loading State -->
      <div v-else class="flex justify-center items-center h-64">
        <NSpin size="large" />
      </div>

      <!-- No Results -->
      <div v-if="!state.isLoadingSkins && filteredSkins.length === 0" class="flex justify-center items-center h-64">
        <NEmpty description="No skins found" />
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

    <!-- Sticker Modal -->
    <StickerModal
        v-model:visible="state.showStickerModal"
        :position="state.currentStickerPosition"
        :currentSticker="customization.stickers[state.currentStickerPosition]"
        @select="handleStickerSelect"
    />

    <!-- Keychain Modal -->
    <KeychainModal
        v-model:visible="state.showKeychainModal"
        :currentKeychain="customization.keychain"
        @select="handleKeychainSelect"
    />

    <!-- Import via InspectURL Modal -->
    <InspectURLModal
        v-model:visible="state.showImportModal"
        :loading="state.isImporting"
        @submit="handleImportInspectLink"
    />

    <!-- Duplicate Modal -->
    <NModal v-model:show="state.showDuplicateConfirm">
      <NCard
          style="width: 600px"
          :bordered="true"
          size="medium"
          role="dialog"
          aria-modal="true"
      >
        <template #header>
          <div class="text-lg font-semibold">Duplicate Weapon</div>
        </template>

        <div class="py-2">
          <p v-if="otherTeamHasSkin" class="text-warning mb-4">
            Warning: The other team already has a skin configured for this weapon.
            This action will overwrite it.
          </p>
          <p>Are you sure you want to duplicate this weapon configuration to the other team?</p>
        </div>

        <template #footer>
          <div class="flex justify-end gap-4">
            <NButton
                @click="state.showDuplicateConfirm = false"
                :disabled="state.isDuplicating"
                type="error"
                secondary
            >
              Cancel
            </NButton>
            <NButton
                type="success"
                secondary
                :loading="state.isDuplicating"
                @click="handleDuplicate"
            >
              Confirm Duplicate
            </NButton>
          </div>
        </template>
      </NCard>
    </NModal>
  </NModal>
</template>
<style scoped lang="sass">
.active-item
  @apply border-2 border-solid border-[#80E6C4]
.inactive-item
  @apply border-2 border-dashed border-gray-600
.sticker-slot
  touch-action: none
  transition: all 0.15s ease-in-out

  &.dragging
    opacity: 0.5
    transform: scale(0.95)

  &.drag-over
    background-color: #2a2a2a
    transform: scale(1.05)

  &:empty
    cursor: default

  &:not(:empty)
    cursor: grab

    &:active
      cursor: grabbing
</style>