<script setup lang="ts">
import { Search, ChevronLeft, ChevronRight, Inbox } from '@lucide/vue'
import type {
  GloveModalProps,
  GloveConfiguration,
  APIWeaponSkin,
  UserProfile,
  IEnhancedGlove,
  IEnhancedItem,
} from '~/types'
import { useItemModal } from '~/composables/useItemModal'
import { useAutoSave } from '~/composables/useAutoSave'
import { useLoadoutStore } from '~/stores/loadoutStore'
import type { ItemHistoryRecord } from '~/server/database/schema/itemHistory'
import type { EconItem } from 'cs2-inspect-lib'

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

/**
 * Events interface using new type system with backward compatibility
 */
const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
  (
    e: 'select' | 'duplicate' | 'auto-save',
    skin: IEnhancedItem,
    customization: GloveConfiguration
  ): void
  (e: 'error', error: string): void
}>()

const message = useToast()
const { t } = useI18n()
const loadoutStore = useLoadoutStore()

// History panel state
const showHistoryPanel = ref(false)

/**
 * Use shared item modal composable for state, pagination, and skin fetching
 */
const { state, apiState, filteredSkins, paginatedSkins, totalPages, fetchSkins, clearState } =
  useItemModal({
    itemType: 'glove',
    pageSize: props.pageSize || 10,
  })

const inheritedWeapon = ref<IEnhancedItem | null>()
const selectedSkin = ref<IEnhancedItem | null>()

/**
 * Default glove configuration using new GloveConfiguration interface
 * Field names match database columns for consistency
 */
const defaultCustomization: GloveConfiguration = {
  active: false,
  team: 1, // Default to Terrorist team
  defindex: 0,
  paintindex: 0,
  paintIndexOverride: false,
  paintseed: 0,
  paintwear: 0,
}

const customization = ref<GloveConfiguration>({ ...defaultCustomization })

/**
 * Auto-save functionality
 */
const autoSave = useAutoSave<GloveConfiguration>(
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
 * Fetch available skins for the current glove using composable
 */
const fetchSkinsForGlove = async () => {
  if (!props.weapon) {
    console.warn('GloveSkinModal: No weapon provided for skin fetching')
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
      paintindex: 0, // Default paint index
      paintIndexOverride: false,
      paintseed: 0,
      paintwear: 0,
      reset: true, // Signal to the server this is a reset operation
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
      team: otherTeam,
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

const handleImportInspectLink = async (inspectUrl: string) => {
  if (!props.weapon || !props.user) return

  try {
    state.value.isImporting = true
    const data = await $fetch<{ item: EconItem; message?: string }>(
      `/api/inspect?action=inspect-item&steamId=${props.user.steamId}`,
      {
        method: 'POST',
        body: { inspectUrl, itemType: 'glove' },
      }
    )

    if (data.item.defindex !== props.weapon.weapon_defindex) {
      throw new Error(t('modals.gloveSkin.invalidInspectLink') as string)
    }

    customization.value = {
      active: true,
      paintindex: data.item.paintindex,
      paintIndexOverride: false,
      paintseed: data.item.paintseed,
      paintwear: data.item.paintwear,
      team: props.weapon.databaseInfo?.team || 1,
    } as GloveConfiguration

    const matchingSkin = apiState.value.skins.find(
      (skin) => Number(skin.paint_index) === data.item.paintindex
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
        paintindex: Number(matchingSkin.paint_index),
        rarity: matchingSkin.rarity,
        availableTeams: matchingSkin.team?.id ?? 'both',
      }
    }

    message.success(t('modals.gloveSkin.importSuccess') as string, { duration: 3000 })
    state.value.showImportModal = false
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : (t('modals.gloveSkin.importFailed') as string)
    message.error(errorMessage, { duration: 3000 })
  } finally {
    state.value.isImporting = false
  }
}
const handleCreateInspectLink = async () => {
  if (!props.weapon || !selectedSkin.value || !props.user) return

  try {
    state.value.isLoadingInspect = true
    const data = await $fetch<{ inspectUrl: string; message?: string }>(
      `/api/inspect?action=create-url&steamId=${props.user.steamId}`,
      {
        method: 'POST',
        body: {
          itemType: 'glove',
          defindex: props.weapon.weapon_defindex,
          paintindex: customization.value.paintindex,
          paintseed: customization.value.paintseed,
          paintwear: customization.value.paintwear,
          rarity: 0,
        },
      }
    )
    const link: string = data.inspectUrl
    await navigator.clipboard.writeText(link)
    message.success(t('modals.gloveSkin.generateInspectUrlSuccess') as string, {
      duration: 3000,
    })
  } catch (error) {
    message.error(t('modals.gloveSkin.generateInspectUrlFailed') as string, { duration: 3000 })
    console.log('Error generating inspect link:', error)
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
 * Watch for changes to props.weapon to initialize state when a glove is selected
 * Updated to use new GloveConfiguration interface
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
        fetchSkinsForGlove()

        // databaseInfo is already typed as IMappedDBGlove | undefined from IEnhancedGlove
        const dbInfo = props.weapon.databaseInfo
        if (dbInfo) {
          customization.value = {
            active: Boolean(dbInfo.active),
            team: dbInfo.team || 1,
            defindex: props.weapon.weapon_defindex,
            paintindex: dbInfo.paintindex || 0,
            paintIndexOverride: false,
            paintseed:
              typeof dbInfo.paintseed === 'string'
                ? parseInt(dbInfo.paintseed) || 0
                : dbInfo.paintseed || 0,
            paintwear:
              typeof dbInfo.paintwear === 'string'
                ? parseFloat(dbInfo.paintwear) || 0
                : dbInfo.paintwear || 0,
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
          error instanceof Error ? error.message : 'Failed to initialize glove data'
        state.value.error = errorMessage
        emit('error', errorMessage)
        console.error('Error initializing glove:', error)
      }
    }
  }
)
</script>

<template>
  <AppModal
    :visible="visible"
    size="huge"
    @update:visible="
      (show: boolean) => {
        if (!show) handleClose()
      }
    "
  >
    <template #header>
      <div class="flex items-center gap-3">
        <span class="leading-none">{{
          weapon
            ? String(t('modals.gloveSkin.title', { weaponName: weapon?.defaultName }))
            : String(t('modals.gloveSkin.defaultTitle'))
        }}</span>
        <!-- Auto-save status indicator (fixed position like toast messages) -->
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
        <Button
          variant="elevated"
          rounded="full"
          intent="error"
          tinted
          :disabled="!selectedSkin"
          class="whitespace-nowrap px-5 py-1.5 overflow-visible!"
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
              class="size-5"
            >
              <path stroke="none" d="M0 0h24v24H0z" fill="none" />
              <path d="M20 11a8.1 8.1 0 0 0 -15.5 -2m-.5 -4v4h4" />
              <path d="M4 13a8.1 8.1 0 0 0 15.5 2m.5 4v-4h-4" />
            </svg>
          </template>
          {{ t('modals.gloveSkin.buttons.reset') }}
        </Button>
        <Separator orientation="vertical" class="mx-2 bg-white/10 data-[orientation=vertical]:h-4" />

        <!-- Import Glove by Inspect Link -->
        <Button
          :loading="state.isImporting"
          variant="elevated"
          rounded="full"
          :disabled="!selectedSkin"
          class="whitespace-nowrap px-5 py-1.5 overflow-visible!"
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
              class="size-5"
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
          {{ t('modals.gloveSkin.buttons.importFromLink') }}
        </Button>
        <Separator orientation="vertical" class="mx-2 bg-white/10 data-[orientation=vertical]:h-4" />

        <!-- Generate Glove Inspect Link -->
        <Button
          :loading="state.isLoadingInspect"
          variant="elevated"
          rounded="full"
          :disabled="!selectedSkin"
          class="whitespace-nowrap px-5 py-1.5 overflow-visible!"
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
              class="size-5"
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
          {{ t('modals.gloveSkin.buttons.generateLink') }}
        </Button>
        <Separator orientation="vertical" class="mx-2 bg-white/10 data-[orientation=vertical]:h-4" />

        <!-- History Button -->
        <Button
          variant="elevated"
          rounded="full"
          :disabled="!selectedSkin"
          class="whitespace-nowrap px-5 py-1.5 overflow-visible!"
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
              class="size-5"
            >
              <path stroke="none" d="M0 0h24v24H0z" fill="none" />
              <path d="M12 8l0 4l2 2" />
              <path d="M3.05 11a9 9 0 1 1 .5 4m-.5 5v-5h5" />
            </svg>
          </template>
          {{ t('history.title') }}
        </Button>
        <Separator orientation="vertical" class="mx-2 bg-white/10 data-[orientation=vertical]:h-4" />

        <!-- Glove Search -->
        <div class="relative ml-1 w-64 max-w-64">
          <Search
            class="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400"
          />
          <Input
            v-model="state.searchQuery"
            :placeholder="String(t('modals.gloveSkin.inputs.searchPlaceholder'))"
            class="w-full pl-9"
          />
        </div>
      </div>
    </template>

    <div class="flex flex-col gap-3 -mt-2">
      <!-- Selected Skin Preview -->
      <div v-if="inheritedWeapon" class="bg-[var(--bg-secondary)] p-4 rounded-lg">
        <div class="grid grid-cols-2 gap-6">
          <!-- Left side - Image -->
          <div class="relative">
            <img
              :src="selectedSkin?.image"
              :alt="selectedSkin?.name"
              class="w-full h-64 object-contain"
            />
            <h3
              class="absolute bottom-0 left-0 right-0 text-lg font-bold px-2 py-1 bg-linear-to-t from-black/60 to-transparent"
            >
              {{ selectedSkin?.name }}
            </h3>
          </div>

          <!-- Right side - Customization -->
          <div class="space-y-4 flex flex-col items-center">
            <!-- Paint Settings -->
            <div class="grid grid-cols-2 gap-4 w-full">
              <div class="space-y-2">
                <div class="flex items-center justify-between">
                  <h4 class="font-bold">
                    {{ t('modals.gloveSkin.labels.paintIndex') }}
                  </h4>
                  <div class="flex items-center space-x-2">
                    <Switch v-model="customization.paintIndexOverride" />
                    <span class="text-sm">{{
                      t('modals.gloveSkin.labels.paintIndexOverride')
                    }}</span>
                  </div>
                </div>
                <NumberField
                  v-model="customization.paintindex"
                  :min="0"
                  :max="10100"
                  :disabled="!customization.paintIndexOverride"
                  :format-options="{ useGrouping: false, maximumFractionDigits: 0 }"
                >
                  <NumberFieldContent>
                    <NumberFieldDecrement />
                    <NumberFieldInput />
                    <NumberFieldIncrement />
                  </NumberFieldContent>
                </NumberField>
              </div>

              <div class="space-y-2">
                <h4 class="font-bold">
                  {{ t('modals.gloveSkin.labels.pattern') }}
                </h4>
                <NumberField
                  v-model="customization.paintseed"
                  :min="0"
                  :max="10100"
                  :format-options="{ useGrouping: false, maximumFractionDigits: 0 }"
                >
                  <NumberFieldContent>
                    <NumberFieldDecrement />
                    <NumberFieldInput />
                    <NumberFieldIncrement />
                  </NumberFieldContent>
                </NumberField>
              </div>
            </div>

            <!-- Wear Slider -->
            <div class="w-full">
              <div class="flex items-start justify-between">
                <h4 class="font-bold">{{ t('modals.gloveSkin.labels.wear') }}</h4>
              </div>
              <WearSlider
                v-model="customization.paintwear"
                :max="selectedSkin?.maxFloat ?? 1"
                :min="selectedSkin?.minFloat ?? 0"
              />
            </div>

            <!-- Duplicate & Active Switch -->
            <div class="flex items-center justify-between w-full">
              <Button
                :disabled="!selectedSkin"
                variant="light"
                rounded="md"
                @click="state.showDuplicateConfirm = true"
              >
                {{ t('modals.gloveSkin.buttons.duplicate') }}
              </Button>

              <div class="flex items-center gap-2">
                <Switch v-model="customization.active" />
                <span
                  class="text-sm font-medium"
                  :class="customization.active ? 'text-primary' : 'text-gray-400'"
                >
                  {{
                    customization.active
                      ? t('modals.gloveSkin.labels.itemActive')
                      : t('modals.gloveSkin.labels.itemInactive')
                  }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Skins Grid -->
      <div
        v-if="!state.isLoadingSkins"
        class="grid grid-cols-5 lg:grid-cols-5 md:grid-cols-3 sm:grid-cols-2 gap-4"
      >
        <div
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
            'hover:shadow-lg cursor-pointer transition-all rounded-xl border border-[#313030] bg-[#242424] px-6 pt-5 pb-5',
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
        </div>
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
          <Skeleton class="h-32 w-full" />
          <div class="mt-3">
            <Skeleton class="h-4 w-full" />
            <div class="mt-2">
              <Skeleton class="h-1 w-full" />
            </div>
          </div>
        </div>
      </div>

      <!-- No Results -->
      <div
        v-if="!state.isLoadingSkins && filteredSkins.length === 0"
        class="flex justify-center items-center h-64"
      >
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Inbox />
            </EmptyMedia>
            <EmptyDescription>{{
              String(t('modals.gloveSkin.noSearchResults'))
            }}</EmptyDescription>
          </EmptyHeader>
        </Empty>
      </div>

      <!-- Pagination -->
      <div v-if="totalPages > 1" class="flex justify-center mt-4">
        <Pagination
          v-model:page="state.currentPage"
          :total="totalPages"
          :items-per-page="1"
          :sibling-count="1"
          show-edges
        >
          <PaginationContent v-slot="{ items }">
            <PaginationPrevious>
              <ChevronLeft class="size-4" />
            </PaginationPrevious>
            <template v-for="(item, index) in items" :key="index">
              <PaginationItem
                v-if="item.type === 'page'"
                :value="item.value"
                :is-active="item.value === state.currentPage"
              >
                {{ item.value }}
              </PaginationItem>
              <PaginationEllipsis v-else />
            </template>
            <PaginationNext>
              <ChevronRight class="size-4" />
            </PaginationNext>
          </PaginationContent>
        </Pagination>
      </div>
    </div>

    <!-- Import via InspectURL Modal -->
    <InspectURLModal
      v-model:visible="state.showImportModal"
      :loading="state.isImporting"
      @submit="handleImportInspectLink"
    />

    <!-- Duplicate Modal -->
    <DuplicateItemModal
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

    <!-- Item History Panel -->
    <LazyItemHistoryPanel
      v-model:visible="showHistoryPanel"
      item-type="glove"
      :defindex="props.weapon?.weapon_defindex || 0"
      :team="customization.team"
      :steam-id="props.user?.steamId || ''"
      :loadout-id="loadoutStore.selectedLoadoutId || 0"
      @restore="handleHistoryRestore"
    />
  </AppModal>
</template>
