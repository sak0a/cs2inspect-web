<script setup lang="ts">
import { ArrowUp, ArrowDown } from '@lucide/vue'
import type { APIKeychain, IEnhancedWeaponKeychain, APISticker } from '~/server/types'
import { generateFlatKeychainUrl } from '~/utils/canvasCoordinates'
import WrappedStickerModal from './WrappedStickerModal.vue'

interface Props {
  visible: boolean
  weaponName?: string
  team?: number
  currentKeychain?: {
    id?: number | string
    x?: number
    y?: number
    z?: number
    seed?: number
    wrapped_sticker_id?: number | null
    highlight_reel_id?: number | null
  } | null
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
  (e: 'select', keychain: IEnhancedWeaponKeychain | null): void
}>()

const { t } = useI18n()
const message = useToast()

const state = ref({
  searchQuery: '',
  currentPage: 1,
  items: [] as APIKeychain[],
  isLoading: false,
  selectedItem: null as APIKeychain | null | undefined,
  customization: {
    x: 0,
    y: 0,
    z: 0,
    seed: 0,
    wrapped_sticker_id: null as number | null,
    highlight_reel_id: null as number | null,
  },
  wrappedStickerModalVisible: false,
  selectedWrappedSticker: null as APISticker | null,
})

const PAGE_SIZE = 10

const keychainSortOptions = computed(() => [
  { label: t('modals.keychain.sort.name') as string, value: 'name' },
  { label: t('modals.keychain.sort.rarity') as string, value: 'rarity' },
])

const {
  sortBy,
  sortDir,
  rarityFilterIds,
  availableRarities,
  paginatedItems,
  totalPages,
  toggleSortDir,
  toggleRarityFilter,
} = useFilterSort({
  items: computed(() => state.value.items),
  searchQuery: computed(() => state.value.searchQuery),
  currentPage: computed({
    get: () => state.value.currentPage,
    set: (v) => {
      state.value.currentPage = v
    },
  }),
  pageSize: PAGE_SIZE,
  sortKeys: ['name', 'rarity'],
})

// Check if seed input should be disabled for Austin 2025 Highlight charms
const isSeedDisabled = computed(() => {
  return state.value.selectedItem?.name?.includes('Souvenir Charm | Austin 2025 Highlight') || false
})

const { teamLabel, teamBadgeClasses } = useTeamBadge(() => props.team)

const isStickerSlab = computed(() => {
  const name = state.value.selectedItem?.name?.toLowerCase() || ''
  return name.includes('sticker slab')
})

const isHighlightReel = computed(() => {
  const name = state.value.selectedItem?.name?.toLowerCase() || ''
  return name.includes('highlight')
})

const handleSelectWrappedSticker = (sticker: APISticker) => {
  state.value.selectedWrappedSticker = sticker
  state.value.customization.wrapped_sticker_id = Number(sticker.id.replace('sticker-', ''))
}

const clearWrappedSticker = () => {
  state.value.selectedWrappedSticker = null
  state.value.customization.wrapped_sticker_id = null
}

const fetchItems = async () => {
  try {
    state.value.isLoading = true
    const response = await $fetch<{ data: APIKeychain[] }>('/api/data/keychains')
    state.value.items = response.data ?? []
  } catch (error) {
    message.error(t('modals.keychain.errorFetching') as string)
    console.error('Error fetching keychains:', error)
  } finally {
    state.value.isLoading = false
  }
}

const handleSelect = (item: APIKeychain) => {
  state.value.selectedItem = item

  // Always reset customization when selecting a new keychain to prevent stale data
  state.value.customization = {
    x: props.currentKeychain?.x ?? 0,
    y: props.currentKeychain?.y ?? 0,
    z: props.currentKeychain?.z ?? 0,
    seed: 0,
    wrapped_sticker_id: null,
    highlight_reel_id: null,
  }

  // Clear selected wrapped sticker preview
  state.value.selectedWrappedSticker = null
}

const handleSave = () => {
  if (!state.value.selectedItem) return

  const emitData: IEnhancedWeaponKeychain = {
    id: Number(state.value.selectedItem.id.replace('keychain-', '')),
    x: state.value.customization.x,
    y: state.value.customization.y,
    z: state.value.customization.z,
    seed: state.value.customization.seed,
    wrapped_sticker_id: state.value.customization.wrapped_sticker_id || undefined,
    highlight_reel_id: state.value.customization.highlight_reel_id || undefined,
    api: {
      name: state.value.selectedItem.name,
      image: state.value.selectedItem.image,
      rarity: state.value.selectedItem.rarity,
    },
  }
  emit('select', emitData)
  handleClose()
}

const handleRemove = () => {
  if (!props.currentKeychain) return
  emit('select', null)
  handleClose()
}

const handleResetConfig = () => {
  state.value.customization = {
    x: 0,
    y: 0,
    z: 0,
    seed: 0,
    wrapped_sticker_id: null,
    highlight_reel_id: null,
  }
}

// Function to completely reset all state
const resetAllState = () => {
  state.value = {
    ...state.value,
    searchQuery: '',
    currentPage: 1,
    selectedItem: null,
    customization: {
      x: 0,
      y: 0,
      z: 0,
      seed: 0,
      wrapped_sticker_id: null,
      highlight_reel_id: null,
    },
    wrappedStickerModalVisible: false,
    selectedWrappedSticker: null,
  }
}

const handleClose = () => {
  emit('update:visible', false)
  resetAllState()
}

onMounted(() => {
  fetchItems()
})

watchEffect(() => {
  if (props.currentKeychain) {
    state.value.selectedItem = state.value.items.find(
      (item) => item.id === 'keychain-' + props.currentKeychain?.id
    )
    state.value.customization = {
      x: props.currentKeychain.x ?? 0,
      y: props.currentKeychain.y ?? 0,
      z: props.currentKeychain.z ?? 0,
      seed: props.currentKeychain.seed ?? 0,
      wrapped_sticker_id: props.currentKeychain.wrapped_sticker_id ?? null,
      highlight_reel_id: props.currentKeychain.highlight_reel_id ?? null,
    }
    // Fetch wrapped sticker details if exists (optional optimisation: fetch only if not present)
    if (props.currentKeychain.wrapped_sticker_id) {
      // We'll rely on the parent or canvas to handle visual, but for UI preview we might want to fetch.
      // For simplicity, we won't fetch the full sticker object here unless creating a new one.
      // If we really need the preview of the EXISTING sticker, we might need an API call or assume data is sufficient.
    }
  }
})

const fetchWrappedStickerDetails = async (id: number) => {
  if (!id) return
  try {
    // Check if we already have it to avoid refetching
    if (
      state.value.selectedWrappedSticker &&
      Number(state.value.selectedWrappedSticker.id.replace('sticker-', '')) === id
    )
      return

    const response = await $fetch<{ data: APISticker[] }>(`/api/data/stickers?id=sticker-${id}`)

    if (response.data.length > 0 && response.data[0]) {
      state.value.selectedWrappedSticker = response.data[0]
    }
  } catch (error) {
    console.error('Error fetching wrapped sticker details:', error)
  }
}

// Initialize with current keychain if editing
watch(
  () => props.currentKeychain,
  (newKeychain) => {
    if (newKeychain) {
      state.value.customization = {
        x: newKeychain.x ?? 0,
        y: newKeychain.y ?? 0,
        z: newKeychain.z ?? 0,
        seed: newKeychain.seed ?? 0,
        wrapped_sticker_id: newKeychain.wrapped_sticker_id ?? null,
        highlight_reel_id: newKeychain.highlight_reel_id ?? null,
      }

      // Fetch wrapped sticker details if exists and not already loaded or mismatch
      if (newKeychain.wrapped_sticker_id) {
        fetchWrappedStickerDetails(newKeychain.wrapped_sticker_id)
      }
    }
  },
  { immediate: true }
)

// Fetch keychains when modal becomes visible and reset state when closed
watch(
  () => props.visible,
  (newValue) => {
    if (newValue) {
      fetchItems()
    } else {
      // Reset state when modal is closed
      resetAllState()
    }
  }
)

// Watch for seed changes and reset to 0 for Austin 2025 Highlight charms
watch(
  () => state.value.customization.seed,
  (newSeed) => {
    if (isSeedDisabled.value && newSeed !== 0) {
      state.value.customization.seed = 0
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
          currentKeychain
            ? t('modals.keychain.titleEdit') +
              (weaponName ? ` ${t('common.for')} ${weaponName}` : '')
            : t('modals.keychain.titleAdd') +
              (weaponName ? ` ${t('common.for')} ${weaponName}` : '')
        }}</span>
        <span
          v-if="teamLabel"
          class="inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold"
          :class="teamBadgeClasses"
        >
          {{ teamLabel }}
        </span>
      </div>
    </template>
    <template #header-extra>
      <ModalToolbar
        v-model:search="state.searchQuery"
        :search-placeholder="t('modals.keychain.searchPlaceholder') as string"
        show-reset
        :reset-label="t('modals.weaponSkin.buttons.reset') as string"
        :reset-disabled="!currentKeychain && !state.selectedItem"
        @reset="handleResetConfig"
      />
    </template>

    <div class="flex flex-col gap-3 -mt-2">
      <!-- Selected Keychain Preview -->
      <div
        v-if="state.selectedItem"
        class="rounded-[var(--radius-card)] border border-border bg-card p-4 md:p-6"
      >
        <div class="grid grid-cols-1 gap-6 md:grid-cols-[200px_1fr]">
          <!-- Left side - Image -->
          <SelectedItemStage
            :rarity-color="state.selectedItem.rarity?.color"
            class="flex flex-col justify-center p-3"
          >
            <template #media>
              <img
                :src="
                  generateFlatKeychainUrl(
                    state.selectedItem.name,
                    state.customization.seed,
                    state.selectedWrappedSticker?.rarity?.id,
                    state.customization.wrapped_sticker_id || undefined
                  )
                "
                :alt="state.selectedItem.name"
                class="scale-125 h-40 object-top object-cover"
              />
            </template>
          </SelectedItemStage>

          <!-- Right side - Customization -->
          <div class="flex flex-col gap-4">
            <!-- Position Controls -->
            <div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div>
                <h4
                  class="mb-1 font-mono text-[10px] uppercase tracking-[0.12em] text-text-tertiary"
                >
                  X {{ t('modals.keychain.labels.position') }}
                </h4>
                <NumberField
                  v-model="state.customization.x"
                  :min="-100"
                  :max="100"
                  :step="0.01"
                  :step-snapping="false"
                  :format-options="{ useGrouping: false, maximumFractionDigits: 6 }"
                  class="w-full"
                >
                  <NumberFieldContent>
                    <NumberFieldDecrement class="p-2" />
                    <NumberFieldInput class="h-8" />
                    <NumberFieldIncrement class="p-2" />
                  </NumberFieldContent>
                </NumberField>
              </div>
              <div>
                <h4
                  class="mb-1 font-mono text-[10px] uppercase tracking-[0.12em] text-text-tertiary"
                >
                  Y {{ t('modals.keychain.labels.position') }}
                </h4>
                <NumberField
                  v-model="state.customization.y"
                  :min="-100"
                  :max="100"
                  :step="0.01"
                  :step-snapping="false"
                  :format-options="{ useGrouping: false, maximumFractionDigits: 6 }"
                  class="w-full"
                >
                  <NumberFieldContent>
                    <NumberFieldDecrement class="p-2" />
                    <NumberFieldInput class="h-8" />
                    <NumberFieldIncrement class="p-2" />
                  </NumberFieldContent>
                </NumberField>
              </div>
              <div>
                <h4
                  class="mb-1 font-mono text-[10px] uppercase tracking-[0.12em] text-text-tertiary"
                >
                  Z {{ t('modals.keychain.labels.position') }}
                </h4>
                <NumberField
                  v-model="state.customization.z"
                  :min="-100"
                  :max="100"
                  :step="0.01"
                  :step-snapping="false"
                  :format-options="{ useGrouping: false, maximumFractionDigits: 6 }"
                  class="w-full"
                >
                  <NumberFieldContent>
                    <NumberFieldDecrement class="p-2" />
                    <NumberFieldInput class="h-8" />
                    <NumberFieldIncrement class="p-2" />
                  </NumberFieldContent>
                </NumberField>
              </div>
              <div v-if="!isStickerSlab && !isHighlightReel">
                <h4
                  class="mb-1 font-mono text-[10px] uppercase tracking-[0.12em] text-text-tertiary"
                >
                  {{ t('modals.keychain.labels.seed') }}
                </h4>
                <NumberField
                  v-model="state.customization.seed"
                  :min="0"
                  :max="100000"
                  :step="1"
                  :disabled="isSeedDisabled"
                  :format-options="{ useGrouping: false, maximumFractionDigits: 0 }"
                  class="w-full"
                >
                  <NumberFieldContent>
                    <NumberFieldDecrement class="p-2" />
                    <NumberFieldInput class="h-8" />
                    <NumberFieldIncrement class="p-2" />
                  </NumberFieldContent>
                </NumberField>
              </div>

              <!-- Highlight Reel ID Input -->
              <div v-if="isHighlightReel">
                <h4
                  class="mb-1 font-mono text-[10px] uppercase tracking-[0.12em] text-text-tertiary"
                >
                  Highlight ID
                </h4>
                <NumberField
                  v-model="state.customization.highlight_reel_id"
                  :min="0"
                  :format-options="{ useGrouping: false, maximumFractionDigits: 0 }"
                  class="w-full"
                >
                  <NumberFieldContent>
                    <NumberFieldDecrement class="p-2" />
                    <NumberFieldInput class="h-8" placeholder="Enter Highlight ID" />
                    <NumberFieldIncrement class="p-2" />
                  </NumberFieldContent>
                </NumberField>
              </div>

              <!-- Sticker Slab Controls -->
              <div
                v-if="isStickerSlab"
                class="col-span-2 mt-1 border-t border-border pt-3 sm:col-span-4"
              >
                <h4
                  class="mb-2 font-mono text-[10px] uppercase tracking-[0.12em] text-text-tertiary"
                >
                  Wrapped Sticker
                </h4>

                <div
                  v-if="state.selectedWrappedSticker || state.customization.wrapped_sticker_id"
                  class="flex items-center gap-3 rounded-[var(--radius-ctl)] border border-border bg-surface-2 p-2"
                >
                  <!-- If we have the object, show image. If only ID (legacy/edit), just show ID/placeholder -->
                  <!-- Tiny preview removed as per request -->
                  <div class="flex-1 min-w-0">
                    <div class="truncate text-sm font-medium text-foreground">
                      {{
                        state.selectedWrappedSticker
                          ? state.selectedWrappedSticker.name
                          : `Sticker ID: ${state.customization.wrapped_sticker_id}`
                      }}
                    </div>
                  </div>
                  <Button size="xs" variant="destructive" @click="clearWrappedSticker">×</Button>
                </div>

                <Button
                  v-else
                  class="w-full"
                  variant="outline"
                  size="sm"
                  @click="state.wrappedStickerModalVisible = true"
                >
                  + Select Sticker to Wrap
                </Button>
              </div>
            </div>

            <!-- Bottom Section: Title and Buttons -->
            <div
              class="flex flex-col items-center justify-between gap-4 border-t border-border pt-4 lg:flex-row"
            >
              <h3 class="font-display text-lg font-medium tracking-[-0.02em] text-foreground">
                {{ state.selectedItem.name.replace(/^Charm \| /, '') }}
              </h3>

              <div class="flex w-full justify-end gap-3 lg:w-auto">
                <Button variant="outline" class="flex-1 lg:w-40 lg:flex-none" @click="handleSave">
                  {{
                    currentKeychain
                      ? t('modals.keychain.buttons.update')
                      : t('modals.keychain.buttons.create')
                  }}
                </Button>
                <Button
                  v-if="currentKeychain"
                  variant="destructive"
                  class="flex-1 lg:w-40 lg:flex-none"
                  @click="handleRemove"
                >
                  {{ t('modals.keychain.delete') }}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Keychain list controls (Sort + Filters) -->
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div class="flex items-center gap-2">
          <span class="font-mono text-[10px] uppercase tracking-[0.12em] text-text-tertiary">{{
            t('modals.sticker.sort.label')
          }}</span>
          <Select :model-value="sortBy" @update:model-value="(v) => (sortBy = String(v ?? sortBy))">
            <SelectTrigger size="sm" class="w-44">
              <SelectValue>
                {{ keychainSortOptions.find((o) => o.value === sortBy)?.label }}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem
                v-for="option in keychainSortOptions"
                :key="option.value"
                :value="option.value"
              >
                {{ option.label }}
              </SelectItem>
            </SelectContent>
          </Select>
          <Button
            size="icon-xs"
            variant="secondary"
            :aria-label="`Sort ${sortDir === 'asc' ? 'ascending' : 'descending'}`"
            @click="toggleSortDir"
          >
            <ArrowUp v-if="sortDir === 'asc'" class="size-3" />
            <ArrowDown v-else class="size-3" />
          </Button>
        </div>

        <div v-if="availableRarities.length > 0" class="flex flex-wrap items-center gap-1.5">
          <span
            class="mr-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-text-tertiary"
            >{{ t('modals.sticker.filters.rarity') }}</span
          >
          <Button
            v-for="rarity in availableRarities"
            :key="rarity.id"
            size="xs"
            :variant="rarityFilterIds.includes(rarity.id) ? 'default' : 'secondary'"
            class="rounded-full"
            :aria-label="`Filter by ${rarity.name} rarity`"
            :aria-pressed="rarityFilterIds.includes(rarity.id)"
            @click="toggleRarityFilter(rarity.id)"
          >
            <span class="flex items-center gap-1.5">
              <span class="size-2 rounded-full" :style="{ background: rarity.color }" />
              {{ rarity.name }}
            </span>
          </Button>
        </div>
      </div>

      <!-- Keychains Grid (skeleton / empty / items + pagination) -->
      <ItemBrowserGrid
        v-model:current-page="state.currentPage"
        :items="paginatedItems"
        :loading="state.isLoading"
        :total-pages="totalPages"
        :selected-id="state.selectedItem?.id ?? null"
        :skeleton-count="PAGE_SIZE"
        :sibling-count="2"
        image-height="sm"
        :empty-text="t('modals.keychain.noSearchResults') as string"
        :item-label="(item: APIKeychain) => item.name.replace(/^Charm \| /, '')"
        :item-image="(item: APIKeychain) => generateFlatKeychainUrl(item.name)"
        @select="handleSelect"
      />
    </div>
  </AppModal>

  <WrappedStickerModal
    v-model:visible="state.wrappedStickerModalVisible"
    @select="handleSelectWrappedSticker"
  />
</template>
