<script setup lang="ts">
import { buttonColor } from '~/lib/buttonColors'
import type {
  KnifeModalProps,
  KnifeConfiguration,
  APIWeaponSkin,
  UserProfile,
  IEnhancedKnife,
  IEnhancedItem,
} from '~/types'
import type { EconItem } from 'cs2-inspect-lib'
import { useItemModal } from '~/composables/useItemModal'
import { digitOnlyInputProps } from '~/utils/inputProps'
import { useAutoSave } from '~/composables/useAutoSave'
import { useLoadoutStore } from '~/stores/loadoutStore'
import type { ItemHistoryRecord } from '~/server/database/schema/itemHistory'

/**
 * Props interface using new type system with backward compatibility
 */
interface Props extends Omit<KnifeModalProps, 'weapon' | 'user'> {
  // Maintain backward compatibility with existing prop names
  weapon: IEnhancedKnife | null
  isLoading?: boolean
  pageSize?: number
  user: UserProfile
}

const props = defineProps<Props>()

/**
 * Events interface using new type system with backward compatibility
 */
const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
  (
    e: 'save' | 'duplicate' | 'auto-save',
    skin: IEnhancedItem,
    customization: KnifeConfiguration
  ): void
  (e: 'error', error: string): void
}>()

const message = useMessage()
const { t } = useI18n()
const loadoutStore = useLoadoutStore()

// History panel state
const showHistoryPanel = ref(false)

/**
 * Use shared item modal composable for state, pagination, and skin fetching
 */
const { state, apiState, filteredSkins, paginatedSkins, totalPages, fetchSkins, clearState } =
  useItemModal({
    itemType: 'knife',
    pageSize: props.pageSize || 10,
  })

const inheritedWeapon = ref<IEnhancedItem | null>()
const selectedSkin = ref<IEnhancedItem | null>()

/**
 * Default knife configuration using new KnifeConfiguration interface
 * Field names match database columns for consistency
 */
const defaultCustomization: KnifeConfiguration = {
  active: false,
  team: 1, // Default to Terrorist team
  defindex: 0,
  paintindex: 0,
  paintIndexOverride: false,
  paintseed: 0,
  paintwear: 0,
  stattrak_enabled: false,
  stattrak_count: 0,
  nametag: '',
}

const customization = ref<KnifeConfiguration>({ ...defaultCustomization })

/**
 * Auto-save functionality
 */
const autoSave = useAutoSave<KnifeConfiguration>(
  async (data) => {
    if (!selectedSkin.value) return
    emit('auto-save', selectedSkin.value, data)
  },
  {
    debounceMs: 1500,
    retryAttempts: 3,
    onSaveError: (error) => {
      console.error('Auto-save failed:', error)
    },
  }
)

// Track if we should trigger auto-save (only when user makes intentional changes)
const isInitializing = ref(false)

// Watch customization changes for auto-save
watch(
  () => customization.value,
  (newVal) => {
    if (
      !isInitializing.value &&
      selectedSkin.value &&
      newVal.paintindex !== null &&
      props.visible
    ) {
      autoSave.triggerSave({ ...newVal })
    }
  },
  { deep: true }
)

/**
 * Fetch available skins for the current knife using composable
 */
const fetchAvailableSkinsForKnife = async () => {
  if (!props.weapon) {
    console.warn('KnifeSkinModal: No weapon provided for skin fetching')
    return
  }
  const displayName = props.weapon.name.split(' | ')[0] || props.weapon.weapon_name
  await fetchSkins(
    props.weapon.weapon_name,
    (error) => emit('error', error),
    props.weapon.defaultImage,
    displayName
  )
}

/**
 * Handle knife reset with improved error handling
 */
const handleReset = () => {
  if (!props.weapon || !props.user) {
    state.value.error = 'Missing weapon or user data for reset'
    emit('error', state.value.error)
    return
  }

  try {
    state.value.error = null
    state.value.isResetting = true

    // Create reset configuration
    const resetConfig: KnifeConfiguration = {
      ...customization.value,
      reset: true,
    }

    emit('save', props.weapon, resetConfig)
    state.value.showResetConfirm = false
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to reset knife'
    state.value.error = errorMessage
    emit('error', errorMessage)
    console.error('Error resetting knife:', error)
  } finally {
    state.value.isResetting = false
  }
}

/**
 * Handle knife duplication with improved error handling
 */
const handleDuplicate = async () => {
  if (!selectedSkin.value) {
    state.value.error = 'No knife selected for duplication'
    emit('error', state.value.error)
    return
  }

  state.value.isDuplicating = true
  try {
    state.value.error = null

    // Calculate the other team number (if current is 1, other is 2 and vice versa)
    const otherTeam = props.weapon?.databaseInfo?.team === 1 ? 2 : 1

    const duplicateData: KnifeConfiguration = {
      ...customization.value,
      team: otherTeam,
    }

    emit('duplicate', selectedSkin.value, duplicateData)
    state.value.showDuplicateConfirm = false
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to duplicate knife'
    state.value.error = errorMessage
    emit('error', errorMessage)
    console.error('Error duplicating knife:', error)
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
      paintindex: Number(skin.paint_index),
      rarity: skin.rarity,
      availableTeams: 'both',
    }

    // Preserve current float value, only clamp if outside new skin's valid range
    const newMinFloat = skin.min_float ?? 0
    const newMaxFloat = skin.max_float ?? 1
    const currentFloat = customization.value.paintwear
    const clampedFloat = Math.max(newMinFloat, Math.min(newMaxFloat, currentFloat))

    customization.value = {
      ...customization.value,
      paintindex: Number(skin.paint_index),
      paintwear: clampedFloat,
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to select skin'
    state.value.error = errorMessage
    emit('error', errorMessage)
    console.error('Error selecting skin:', error)
  }
}

/**
 * Handle inspect link import with improved error handling and type safety
 */
const handleImportInspectLink = async (inspectUrl: string) => {
  if (!props.weapon || !props.user) {
    state.value.error = 'Missing weapon or user data'
    emit('error', state.value.error)
    return
  }

  try {
    state.value.isImporting = true
    state.value.error = null

    const data = await $fetch<{ item: EconItem; message?: string }>(
      `/api/inspect?action=inspect-item&steamId=${props.user.steamId}`,
      {
        method: 'POST',
        body: { inspectUrl, itemType: 'knife' },
      }
    )

    if (data.item.defindex !== props.weapon.weapon_defindex) {
      throw new Error(t('modals.knifeSkin.invalidInspectLink') as string)
    }

    // Update customization with complete data using new KnifeConfiguration interface
    customization.value = {
      active: true,
      team: props.weapon.databaseInfo?.team || 1, // Default to Terrorist team
      defindex: data.item.defindex,
      paintindex: data.item.paintindex,
      paintIndexOverride: false,
      paintseed: data.item.paintseed,
      paintwear: data.item.paintwear,
      stattrak_enabled: data.item.killeaterscoretype !== null,
      stattrak_count: data.item.killeatervalue || 0,
      nametag: data.item.customname || '',
    }

    // Update selected skin based on paint index
    const matchingSkin = apiState.value.skins.find(
      (skin) => Number(skin.paint_index) === data.item.paintindex
    )

    if (matchingSkin) {
      selectedSkin.value = {
        ...props.weapon,
        name: matchingSkin.name,
        defaultName: matchingSkin.name,
        image: matchingSkin.image,
        defaultImage: matchingSkin.image,
        minFloat: matchingSkin.min_float ?? 0,
        maxFloat: matchingSkin.max_float ?? 1,
        paintindex: Number(matchingSkin.paint_index),
        rarity: matchingSkin.rarity,
        availableTeams: matchingSkin.team?.id ?? 'both',
      }
    }

    message.success(t('modals.knifeSkin.importSuccess') as string, { duration: 3000 })
    state.value.showImportModal = false
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : (t('modals.knifeSkin.importFailed') as string)
    state.value.error = errorMessage
    message.error(errorMessage, { duration: 3000 })
    emit('error', errorMessage)
  } finally {
    state.value.isImporting = false
  }
}
/**
 * Handle inspect link creation with improved error handling
 */
const handleCreateInspectLink = async () => {
  if (!props.weapon || !selectedSkin.value || !props.user) {
    state.value.error = 'Missing required data for inspect link creation'
    emit('error', state.value.error)
    return
  }

  try {
    state.value.isLoadingInspect = true
    state.value.error = null

    const data = await $fetch<{ inspectUrl: string; message?: string }>(
      `/api/inspect?action=create-url&steamId=${props.user.steamId}`,
      {
        method: 'POST',
        body: {
          itemType: 'knife',
          defindex: props.weapon.weapon_defindex,
          paintindex: customization.value.paintindex,
          paintseed: customization.value.paintseed,
          paintwear: customization.value.paintwear,
          rarity: 0,
          stattrak_enabled: customization.value.stattrak_enabled,
          stattrak_count: customization.value.stattrak_count,
          nametag: customization.value.nametag,
        },
      }
    )

    const link: string = data.inspectUrl
    await navigator.clipboard.writeText(link)
    message.success(t('modals.knifeSkin.generateInspectUrlSuccess') as string, {
      duration: 3000,
    })
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : (t('modals.knifeSkin.generateInspectUrlFailed') as string)
    state.value.error = errorMessage
    message.error(errorMessage, { duration: 3000 })
    emit('error', errorMessage)
    console.error('Error generating inspect link:', error)
  } finally {
    state.value.isLoadingInspect = false
  }
}

const handleClose = async () => {
  // Flush any pending auto-save before closing
  if (selectedSkin.value && customization.value.paintindex !== null) {
    await autoSave.flushPending()
  }

  emit('update:visible', false)
  setTimeout(() => {
    clearState()
    selectedSkin.value = null
    inheritedWeapon.value = null
    customization.value = { ...defaultCustomization }
  }, 300)
}

/**
 * Handle restoring from history
 */
const handleHistoryRestore = (record: ItemHistoryRecord) => {
  if (record.configuration) {
    const config = record.configuration
    customization.value = {
      ...customization.value,
      paintindex: config.paintindex,
      paintseed: config.paintseed,
      paintwear: config.paintwear,
      stattrak_enabled: config.stattrak_enabled ?? false,
      stattrak_count: config.stattrak_count ?? 0,
      nametag: config.nametag ?? '',
    }
    showHistoryPanel.value = false
    // Note: Success message is shown by ItemHistoryPanel, no need to duplicate here
  }
}

watch(
  () => customization.value.paintwear,
  (newWear) => {
    if (typeof newWear === 'number' && !isNaN(newWear)) {
      customization.value.paintwear = Number(newWear.toFixed(3))
    }
  },
  { immediate: true }
)

// Watch for changes to props.visible to check pagination when modal is opened
watch(
  () => props.visible,
  (isVisible) => {
    if (isVisible && filteredSkins.value.length > 0) {
      // Pagination is handled by the composable
    }
  }
)

/**
 * Watch for changes to props.weapon to initialize state when a knife is selected
 * Updated to use new KnifeConfiguration interface
 */
watch(
  () => props.weapon,
  () => {
    if (props.visible && props.weapon) {
      try {
        // Prevent auto-save during initialization
        isInitializing.value = true
        state.value.error = null
        autoSave.resetStatus()

        inheritedWeapon.value = props.weapon
        fetchAvailableSkinsForKnife()

        // Cast to the correct database interface for knives
        const dbInfo = props.weapon.databaseInfo
        if (dbInfo) {
          customization.value = {
            active: dbInfo.active || false,
            team: dbInfo.team || 1,
            defindex: props.weapon.weapon_defindex,
            paintindex: dbInfo.paintindex || 0,
            paintIndexOverride: false,
            paintseed: parseInt(String(dbInfo.paintseed)) || 0,
            paintwear: parseFloat(String(dbInfo.paintwear)) || 0,
            stattrak_enabled: dbInfo.stattrak_enabled || false,
            stattrak_count: dbInfo.stattrak_count || 0,
            nametag: dbInfo.nametag || '',
          }
        } else {
          customization.value = {
            ...defaultCustomization,
            team: props.weapon.team || 1,
            defindex: props.weapon.weapon_defindex,
          }
        }

        selectedSkin.value = inheritedWeapon.value

        // Allow auto-save after initialization completes
        nextTick(() => {
          isInitializing.value = false
        })
      } catch (error: unknown) {
        isInitializing.value = false
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to initialize knife data'
        state.value.error = errorMessage
        emit('error', errorMessage)
      }
    }
  }
)
</script>

<template>
  <NModal
    :show="visible"
    style="max-width: 1200px; width: 95vw"
    preset="card"
    :bordered="false"
    size="huge"
    :auto-focus="false"
    header-extra-style="flex-shrink: 0"
    @update:show="handleClose"
  >
    <template #header>
      <div class="flex items-center gap-3">
        <span class="leading-none">{{
          weapon
            ? String(t('modals.knifeSkin.title', { weaponName: weapon?.defaultName }))
            : String(t('modals.knifeSkin.defaultTitle'))
        }}</span>
        <!-- Auto-save status indicator (fixed position like NaiveUI messages) -->
        <SaveStatusIndicator
          :status="autoSave.status.value"
          :show-retry="autoSave.status.value === 'error'"
          fixed
          @retry="autoSave.retry"
        />
      </div>
    </template>
    <template #header-extra>
      <div class="flex items-center shrink-0">
        <!-- Reset Button -->
        <SButton
          variant="elevated"
          rounded="full"
          :color="buttonColor.error"
          tinted
          :disabled="!selectedSkin || customization.paintindex == 0"
          class="whitespace-nowrap px-5 py-1.5 !overflow-visible"
          @click="state.showResetConfirm = true"
        >
          <template #icon-left>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path stroke="none" d="M0 0h24v24H0z" fill="none" />
              <path d="M20 11a8.1 8.1 0 0 0 -15.5 -2m-.5 -4v4h4" />
              <path d="M4 13a8.1 8.1 0 0 0 15.5 2m.5 4v-4h-4" />
            </svg>
          </template>
          {{ t('modals.knifeSkin.buttons.reset') }}
        </SButton>
        <NDivider vertical />

        <!-- Import Knife by Inspect Link -->
        <SButton
          :loading="state.isImporting"
          variant="elevated"
          rounded="full"
          :disabled="!selectedSkin"
          class="whitespace-nowrap px-5 py-1.5 !overflow-visible"
          @click="state.showImportModal = true"
        >
          <template #icon-left>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path stroke="none" d="M0 0h24v24H0z" fill="none" />
              <path d="M4 8v-2a2 2 0 0 1 2 -2h2" />
              <path d="M4 16v2a2 2 0 0 0 2 2h2" />
              <path d="M16 4h2a2 2 0 0 1 2 2v2" />
              <path d="M16 20h2a2 2 0 0 0 2 -2v-2" />
              <path d="M8 11a3 3 0 1 0 6 0a3 3 0 0 0 -6 0" />
              <path d="M16 16l-2.5 -2.5" />
            </svg>
          </template>
          {{ t('modals.knifeSkin.buttons.importFromLink') }}
        </SButton>
        <NDivider vertical />

        <!-- Generate Knife Inspect Link -->
        <SButton
          :loading="state.isLoadingInspect"
          variant="elevated"
          rounded="full"
          :disabled="!selectedSkin"
          class="whitespace-nowrap px-5 py-1.5 !overflow-visible"
          @click="handleCreateInspectLink"
        >
          <template #icon-left>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path stroke="none" d="M0 0h24v24H0z" fill="none" />
              <path d="M4 8v-2a2 2 0 0 1 2 -2h2" />
              <path d="M4 16v2a2 2 0 0 0 2 2h2" />
              <path d="M16 4h2a2 2 0 0 1 2 2v2" />
              <path d="M16 20h2a2 2 0 0 0 2 -2v-2" />
              <path d="M8 11a3 3 0 1 0 6 0a3 3 0 0 0 -6 0" />
              <path d="M16 16l-2.5 -2.5" />
            </svg>
          </template>
          {{ t('modals.knifeSkin.buttons.generateLink') }}
        </SButton>
        <NDivider vertical />

        <!-- History Button -->
        <SButton
          variant="elevated"
          rounded="full"
          :disabled="!selectedSkin"
          class="whitespace-nowrap px-5 py-1.5 !overflow-visible"
          @click="showHistoryPanel = true"
        >
          <template #icon-left>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path stroke="none" d="M0 0h24v24H0z" fill="none" />
              <path d="M12 8l0 4l2 2" />
              <path d="M3.05 11a9 9 0 1 1 .5 4m-.5 5v-5h5" />
            </svg>
          </template>
          {{ t('history.title') }}
        </SButton>
        <NDivider vertical />

        <!-- Knife Search -->
        <NInput
          v-model:value="state.searchQuery"
          :placeholder="String(t('modals.knifeSkin.inputs.searchPlaceholder'))"
          class="pl-1 max-w-64"
        />
      </div>
    </template>

    <NSpace vertical size="large" class="-mt-2">
      <!-- Selected Skin Preview -->
      <div v-if="inheritedWeapon" class="bg-[var(--bg-secondary)] p-6 rounded-lg bg-opacity-50">
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
                <NSwitch v-model:value="customization.stattrak_enabled" />
                <span>{{ t('modals.knifeSkin.labels.stattrak') }}</span>
                <NInputNumber
                  v-model:value="customization.stattrak_count"
                  :disabled="!customization.stattrak_enabled"
                  :min="0"
                  :max="999999"
                  :precision="0"
                  :show-button="false"
                  class="w-28"
                  :input-props="digitOnlyInputProps"
                />
              </div>
              <NInput
                v-model:value="customization.nametag"
                :placeholder="String(t('modals.knifeSkin.inputs.nameTagPlaceholder'))"
                class="pl-1"
              />
            </div>

            <!-- Paint Settings -->
            <div class="grid grid-cols-2 gap-4 w-full">
              <div class="space-y-2">
                <div class="flex items-center justify-between">
                  <h4 class="font-bold">
                    {{ t('modals.knifeSkin.labels.paintIndex') }}
                  </h4>
                  <div class="flex items-center space-x-2">
                    <NSwitch v-model:value="customization.paintIndexOverride" />
                    <span class="text-sm">{{
                      t('modals.knifeSkin.labels.paintIndexOverride')
                    }}</span>
                  </div>
                </div>
                <NInputNumber
                  v-model:value="customization.paintindex"
                  :min="0"
                  :max="9999"
                  :disabled="!customization.paintIndexOverride"
                  :input-props="digitOnlyInputProps"
                />
              </div>

              <div class="space-y-2">
                <h4 class="font-bold">
                  {{ t('modals.knifeSkin.labels.pattern') }}
                </h4>
                <NInputNumber
                  v-model:value="customization.paintseed"
                  :min="0"
                  :max="1000"
                  :input-props="digitOnlyInputProps"
                />
              </div>
            </div>

            <!-- Wear Slider -->
            <div class="w-full">
              <div class="flex items-start justify-between">
                <h4 class="font-bold">{{ t('modals.knifeSkin.labels.wear') }}</h4>
              </div>
              <WearSlider
                v-model="customization.paintwear"
                :max="selectedSkin?.maxFloat ?? 1"
                :min="selectedSkin?.minFloat ?? 0"
              />
            </div>

            <!-- Duplicate & Active Switch -->
            <div class="flex items-center justify-center w-full mt-0 gap-2">
              <!-- Duplicate Knife -->
              <div>
                <SButton
                  :disabled="!selectedSkin || customization.paintindex == 0"
                  variant="light"
                  class="w-full"
                  @click="state.showDuplicateConfirm = true"
                >
                  {{ t('modals.knifeSkin.buttons.duplicate') }}
                </SButton>
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
      <div
        v-if="!state.isLoadingSkins"
        class="grid grid-cols-5 lg:grid-cols-5 md:grid-cols-3 sm:grid-cols-2 gap-4"
      >
        <NCard
          v-for="skin in paginatedSkins"
          :key="skin.id"
          :style="{
            borderColor: skin.rarity?.color || '#313030',
            background: `linear-gradient(135deg, #101010, ${hexToRgba(
              skin.rarity?.color || '#313030',
              '0.15'
            )})`,
          }"
          :class="[
            'hover:shadow-lg cursor-pointer transition-all rounded-xl',
            customization.paintindex === Number(skin.paint_index)
              ? 'ring-2 ring-[var(--selection-ring)] border-0 opacity-85'
              : '',
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
              <p class="text-sm text-white truncate">
                {{ skin.name.replace('★ ' + skin.weapon.name + ' | ', '') }}
              </p>
              <div class="h-1 mt-2" :style="{ background: skin.rarity?.color || '#313030' }" />
            </div>
          </div>
        </NCard>
      </div>

      <!-- Skeleton Loading State -->
      <div
        v-if="state.isLoadingSkins"
        class="grid grid-cols-5 lg:grid-cols-5 md:grid-cols-3 sm:grid-cols-2 gap-4"
      >
        <div
          v-for="i in 10"
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

      <!-- No Results -->
      <div
        v-if="!state.isLoadingSkins && filteredSkins.length === 0"
        class="flex justify-center items-center h-64"
      >
        <NEmpty :description="String(t('modals.knifeSkin.noSearchResults'))" />
      </div>

      <!-- Pagination -->
      <div v-if="totalPages > 1" class="flex justify-center mt-4">
        <NPagination v-model:page="state.currentPage" :page-count="totalPages" :page-slot="5" />
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
      :item-type="String(t('modals.duplicateItem.type.knife'))"
      @confirm="handleDuplicate"
    />

    <!-- Reset Confirmation Modal -->
    <ResetModal
      v-model:visible="state.showResetConfirm"
      :loading="state.isResetting"
      @confirm="handleReset"
    />

    <!-- Item History Panel -->
    <LazyItemHistoryPanel
      v-model:visible="showHistoryPanel"
      item-type="knife"
      :defindex="props.weapon?.weapon_defindex || 0"
      :team="customization.team"
      :steam-id="props.user?.steamId || ''"
      :loadout-id="loadoutStore.selectedLoadoutId || 0"
      @restore="handleHistoryRestore"
    />
  </NModal>
</template>

<style scoped>
.n-card {
  background: #242424;
  border: 1px solid #313030;
}
</style>
