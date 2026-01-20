<script setup lang="ts">
// New type system imports
import type {
  GloveModalProps,
  GloveConfiguration,
  APIWeaponSkin,
  UserProfile
} from '~/types'
import { useItemModal } from '~/composables/useItemModal'
import { api } from '~/utils/api'

// Legacy imports for backward compatibility
import type { IEnhancedGlove, IEnhancedItem, IMappedDBGlove } from '~/server/types'

/**
 * Props interface using new type system with backward compatibility
 */
interface Props extends Omit<GloveModalProps, 'weapon' | 'user'> {
  // Maintain backward compatibility with existing prop names
  weapon: IEnhancedGlove | null
  isLoading?: boolean
  pageSize?: number
  user: UserProfile
}

const props = defineProps<Props>()

const digitOnlyInputProps = {
  inputmode: 'numeric' as const, pattern: '\\d*',
  onKeydown: (e: KeyboardEvent) => { const allow=['Backspace','Delete','Tab','ArrowLeft','ArrowRight','Home','End','Enter']; const meta=e.ctrlKey||e.metaKey; if (allow.includes(e.key)||(meta&&/[acvxy]/i.test(e.key))) return; if (!/^[0-9]$/.test(e.key)) e.preventDefault() },
  onPaste: (e: ClipboardEvent) => { const t=e.clipboardData?.getData('text')||''; if (/[^0-9]/.test(t)) e.preventDefault() }
}

/**
 * Events interface using new type system with backward compatibility
 */
const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
  (e: 'select' | 'duplicate', skin: IEnhancedItem, customization: GloveConfiguration): void
  (e: 'error', error: string): void
}>()

const message = useMessage()
const { t } = useI18n()

/**
 * Use shared item modal composable for state, pagination, and skin fetching
 */
const { 
  state, 
  apiState, 
  filteredSkins, 
  paginatedSkins, 
  totalPages, 
  fetchSkins,
  clearState 
} = useItemModal({ 
  itemType: 'glove', 
  pageSize: props.pageSize || 10 
})

const inheritedWeapon = ref<IEnhancedItem | null>()
const selectedSkin = ref<IEnhancedItem | null>()

/**
 * Default glove configuration using new GloveConfiguration interface
 */
const defaultCustomization: GloveConfiguration = {
  active: false,
  team: 1, // Default to Terrorist team
  defindex: 0,
  paintIndex: 0,
  paintIndexOverride: false,
  pattern: 0,
  wear: 0
}

const customization = ref<GloveConfiguration>({ ...defaultCustomization })

/**
 * Fetch available skins for the current glove using composable
 */
const fetchSkinsForGlove = async () => {
  if (!props.weapon) {
    console.warn('GloveSkinModal: No weapon provided for skin fetching')
    return
  }
  await fetchSkins(props.weapon.weapon_name, (error) => emit('error', error))
}

/**
 * Handle glove reset with improved error handling
 */
const handleReset = () => {
  if (!props.weapon || !props.user) {
    state.value.error = 'Missing weapon or user data for reset'
    emit('error', state.value.error)
    return
  }

  state.value.isResetting = true
  try {
    state.value.error = null

    // Create reset customization with default values using new GloveConfiguration interface
    const resetCustomization: GloveConfiguration = {
      active: true,
      team: customization.value.team,
      defindex: props.weapon.weapon_defindex,
      paintIndex: 0, // Default paint index
      paintIndexOverride: false,
      pattern: 0,
      wear: 0,
      reset: true // Signal to the server this is a reset operation
    }

    // Emit the select event with reset values
    emit('select', props.weapon, resetCustomization)
    state.value.showResetConfirm = false
    handleClose()
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to reset glove'
    state.value.error = errorMessage
    emit('error', errorMessage)
    console.error('Error resetting glove:', error)
  } finally {
    state.value.isResetting = false
  }
}

/**
 * Handle glove duplication with improved error handling
 */
const handleDuplicate = async () => {
  if (!selectedSkin.value) {
    state.value.error = 'No glove selected for duplication'
    emit('error', state.value.error)
    return
  }

  state.value.isDuplicating = true
  try {
    state.value.error = null

    // Calculate the other team number (if current is 1 (T), other is 2 (CT) and vice versa)
    const otherTeam = props.weapon?.databaseInfo?.team === 1 ? 2 : 1

    // Create copy of current customization for other team
    const duplicateData: GloveConfiguration = {
      ...customization.value,
      team: otherTeam
    }

    // Emit duplicate event to parent
    emit('duplicate', selectedSkin.value, duplicateData)

    state.value.showDuplicateConfirm = false
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to duplicate glove'
    state.value.error = errorMessage
    emit('error', errorMessage)
    console.error('Error duplicating glove:', error)
  } finally {
    state.value.isDuplicating = false
  }
}

/**
 * Handle skin selection with type safety
 */
const handleSkinSelect = (skin: APIWeaponSkin) => {
  if (!props.weapon) {
    state.value.error = 'No weapon available for skin selection'
    emit('error', state.value.error)
    return
  }

  try {
    state.value.error = null

    selectedSkin.value = {
      ...props.weapon,
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
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to select skin'
    state.value.error = errorMessage
    emit('error', errorMessage)
    console.error('Error selecting skin:', error)
  }
}

const handleImportInspectLink = async (inspectUrl: string) => {
  if (!props.weapon || !props.user) return

  try {
    state.value.isImporting = true
    const response = await fetch(`/api/inspect?action=inspect-item&steamId=${props.user.steamId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'credentials': 'include'
      },
      body: JSON.stringify({ inspectUrl, itemType: 'glove' })
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message)
    }

    if (data.item.defindex !== props.weapon.weapon_defindex) {
      throw new Error(t('modals.gloveSkin.invalidInspectLink') as string)
    }

    customization.value = {
      active: true,
      paintIndex: data.item.paintindex,
      paintIndexOverride: false,
      pattern: data.item.paintseed,
      wear: data.item.paintwear,
      team: props.weapon.databaseInfo?.team || 1
    } as GloveConfiguration

    const matchingSkin = apiState.value.skins.find(skin =>
        Number(skin.paint_index) === data.item.paintindex
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

    message.success(t('modals.gloveSkin.importSuccess') as string, { duration: 3000 })
    state.value.showImportModal = false
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : (t('modals.gloveSkin.importFailed') as string)
    message.error(errorMessage, { duration: 3000 })
  } finally {
    state.value.isImporting = false
  }
}
const handleCreateInspectLink = async () => {
  if (!props.weapon || !selectedSkin.value || !props.user) return

  try {
    state.value.isLoadingInspect = true
    const response = await fetch(`/api/inspect?action=create-url&steamId=${props.user.steamId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'credentials': 'include'},
      body: JSON.stringify({
        itemType: 'glove',
        defindex: props.weapon.weapon_defindex,
        paintindex: customization.value.paintIndex,
        paintseed: customization.value.pattern,
        paintwear: customization.value.wear,
        rarity: 0
      })
    })
    const data = await response.json()
    if (!response.ok) {
      throw new Error(data.message)
    }
    const link: string = data.inspectUrl
    await navigator.clipboard.writeText(link)
    message.success(t('modals.gloveSkin.generateInspectUrlSuccess') as string, { duration: 3000 })
  } catch (error) {
    message.error(t('modals.gloveSkin.generateInspectUrlFailed') as string, { duration: 3000 })
    console.log('Error generating inspect link:', error)
  } finally {
    state.value.isLoadingInspect = false
  }
}

const handleSave = () => {
  if (!selectedSkin.value) return
  emit('select', selectedSkin.value, customization.value)
  handleClose()
}
const handleClose = () => {
  emit('update:visible', false)
  setTimeout(() => {
    clearState()
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

// Watch for changes to props.visible to check pagination when modal is opened
watch(() => props.visible, (isVisible) => {
  if (isVisible && filteredSkins.value.length > 0) {
    // Pagination is handled by the composable
  }
})

/**
 * Watch for changes to props.weapon to initialize state when a glove is selected
 * Updated to use new GloveConfiguration interface
 */
watch(() => props.weapon, () => {
  if (props.visible && props.weapon) {
    try {
      state.value.error = null

      inheritedWeapon.value = props.weapon
      fetchSkinsForGlove()

      // databaseInfo is already typed as IMappedDBGlove | undefined from IEnhancedGlove
      const dbInfo = props.weapon.databaseInfo
      if (dbInfo) {
        customization.value = {
          active: Boolean(dbInfo.active),
          team: dbInfo.team || 1,
          defindex: props.weapon.weapon_defindex,
          paintIndex: dbInfo.paintindex || 0, // Note: database uses 'paintindex', not 'paintIndex'
          paintIndexOverride: false,
          pattern: typeof dbInfo.paintseed === 'string' ? parseInt(dbInfo.paintseed) || 0 : dbInfo.paintseed || 0,
          wear: typeof dbInfo.paintwear === 'string' ? parseFloat(dbInfo.paintwear) || 0 : dbInfo.paintwear || 0
        }
      } else {
        customization.value = {
          ...defaultCustomization,
          team: props.weapon.team || 1,
          defindex: props.weapon.weapon_defindex
        }
      }

      selectedSkin.value = inheritedWeapon.value
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to initialize glove data'
      state.value.error = errorMessage
      emit('error', errorMessage)
      console.error('Error initializing glove:', error)
    }
  }
})
</script>

<template>
  <NModal
      :show="visible"
      style="width: 1200px"
      preset="card"
      :title="weapon ? String(t('modals.gloveSkin.title', { weaponName: weapon?.defaultName })) : String(t('modals.gloveSkin.defaultTitle'))"
      :bordered="false"
      size="huge"
      :theme-overrides="skinModalThemeOverrides"
      @update:show="handleClose"
  >
    <template #header-extra>
      <!-- Reset Button -->
      <NButton secondary type="error" :disabled="!selectedSkin" @click="state.showResetConfirm = true">
        <template #icon>
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-refresh">
            <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
            <path d="M20 11a8.1 8.1 0 0 0 -15.5 -2m-.5 -4v4h4" />
            <path d="M4 13a8.1 8.1 0 0 0 15.5 2m.5 4v-4h-4" />
          </svg>
        </template>
        {{ t('modals.gloveSkin.buttons.reset') }}
      </NButton>
      <NDivider vertical />

      <!-- Import Glove by Inspect Link -->
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
        {{ t('modals.gloveSkin.buttons.importFromLink') }}
      </NButton>
      <NDivider vertical />

      <!-- Generate Glove Inspect Link -->
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
        {{ t('modals.gloveSkin.buttons.generateLink') }}
      </NButton>
      <NDivider vertical />

      <!-- Glove Search -->
      <NInput
          v-model:value="state.searchQuery"
          :placeholder="String(t('modals.gloveSkin.inputs.searchPlaceholder'))"
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
            >
            <h3 class="text-lg font-bold mt-2">{{ selectedSkin?.name }}</h3>
          </div>

          <!-- Right side - Customization -->
          <div class="space-y-6 flex flex-col items-center">

            <!-- Paint Settings -->
            <div class="grid grid-cols-2 gap-4 w-full">
              <div class="space-y-2">
                <div class="flex items-center justify-between">
                  <h4 class="font-bold">{{ t('modals.gloveSkin.labels.paintIndex') }}</h4>
                  <div class="flex items-center space-x-2">
                    <NSwitch v-model:value="customization.paintIndexOverride" />
                    <span class="text-sm">{{ t('modals.gloveSkin.labels.paintIndexOverride') }}</span>
                  </div>
                </div>
                <NInputNumber
                    v-model:value="customization.paintIndex"
                    :min="0"
                    :max="10100"
                    :disabled="!customization.paintIndexOverride"
                    :input-props="digitOnlyInputProps"
                />
                
              </div>

              <div class="space-y-2">
                <h4 class="font-bold">{{ t('modals.gloveSkin.labels.pattern') }}</h4>
                <NInputNumber
                    v-model:value="customization.pattern"
                    :min="0"
                    :max="10100"
                    :input-props="digitOnlyInputProps"
                />
              </div>
            </div>

            <!-- Wear Slider -->
            <div class="w-full">
              <div class="flex items-start justify-between">
                <h4 class="font-bold">{{ t('modals.gloveSkin.labels.wear') }}</h4>
              </div>
              <WearSlider
                  v-model="customization.wear"
                  :max="selectedSkin?.maxFloat ?? 1"
                  :min="selectedSkin?.minFloat ?? 0"
              />
            </div>

            <!-- Save Button & Active Switch -->
            <div class="flex items-center justify-center w-full mt-0 gap-2">
              <!-- Save Glove -->
              <NButton type="success" secondary class="w-40" @click="handleSave">
                {{ t('modals.gloveSkin.buttons.save') }}
              </NButton>

              <!-- Duplicate Glove -->
              <div>
                <NButton
                    :disabled="!selectedSkin"
                    type="default"
                    secondary
                    class="w-full"
                    @click="state.showDuplicateConfirm = true"
                >
                  {{ t('modals.gloveSkin.buttons.duplicate') }}
                </NButton>
              </div>

              <NSpace justify="center" align="center" class="w-full h-full">
                <NSwitch v-model:value="customization.active" size="large" class="col-span-1">
                  <template #checked>
                    {{ t('modals.gloveSkin.labels.itemActive') }}
                  </template>
                  <template #unchecked>
                    {{ t('modals.gloveSkin.labels.itemInactive') }}
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
            selectedSkin?.name === skin.name ? 'ring-2 ring-[var(--selection-ring)] border-0 opacity-85' : ''
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
              <p class="text-sm text-white truncate">{{ skin.name.replace('★ ' + skin.weapon.name + ' | ', '') }}</p>
              <div
                  class="h-1 mt-2"
                  :style="{ background: skin.rarity?.color || '#313030' }"
              ></div>
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
        <NEmpty :description="String(t('modals.gloveSkin.noSearchResults'))" />
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
        :item-type="String(t('modals.duplicateItem.type.glove'))"
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