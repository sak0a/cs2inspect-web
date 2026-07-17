<script setup lang="ts">
import { ArrowUp, ArrowDown } from '@lucide/vue'
import type { APISticker, IEnhancedWeaponSticker } from '~/server/types'
import { generateStickerImageUrl } from '~/utils/canvasCoordinates'

interface Props {
  visible: boolean
  position: number
  weaponName?: string
  team?: number
  currentSticker?: {
    id?: number | string
    x?: number
    y?: number
    wear?: number
    scale?: number
    rotation?: number
    ext_norm_x?: number
    ext_norm_y?: number
  } | null
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
  (e: 'select', sticker: IEnhancedWeaponSticker | null): void
}>()

const { t } = useI18n()
const message = useToast()

const state = ref({
  searchQuery: '',
  currentPage: 1,
  items: [] as APISticker[],
  isLoading: false,
  selectedItem: null as APISticker | null | undefined,
  customization: {
    x: 0,
    y: 0,
    wear: 0,
    scale: 1,
    rotation: 0,
  },
})

const { teamLabel, teamBadgeClasses } = useTeamBadge(() => props.team)

// External normalized offsets from VisualCustomizer (if present)
const extNormX = computed(() => {
  const val = props.currentSticker?.ext_norm_x
  return typeof val === 'number' && !isNaN(val) ? val : null
})
const extNormY = computed(() => {
  const val = props.currentSticker?.ext_norm_y
  return typeof val === 'number' && !isNaN(val) ? val : null
})
const extNormXStr = computed(() => (extNormX.value !== null ? extNormX.value.toFixed(12) : ''))
const extNormYStr = computed(() => (extNormY.value !== null ? extNormY.value.toFixed(12) : ''))

const PAGE_SIZE = 10

const stickerSortOptions = computed(() => [
  { label: t('modals.sticker.sort.name') as string, value: 'name' },
  { label: t('modals.sticker.sort.rarity') as string, value: 'rarity' },
  { label: t('modals.sticker.sort.effect') as string, value: 'effect' },
])

const {
  sortBy,
  sortDir,
  rarityFilterIds,
  effectFilterIds,
  availableRarities,
  availableEffects,
  paginatedItems,
  totalPages,
  toggleSortDir,
  toggleRarityFilter,
  toggleEffectFilter,
  resetFilters,
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
  sortKeys: ['name', 'rarity', 'effect'],
  hasEffects: true,
})

const fetchItems = async () => {
  try {
    state.value.isLoading = true
    const response = await $fetch<{ data: APISticker[] }>('/api/data/stickers')
    state.value.items = response.data ?? []
  } catch (error) {
    message.error(t('modals.sticker.errorFetching') as string)
    console.error('Error fetching stickers:', error)
  } finally {
    state.value.isLoading = false
  }
}

const handleSelect = (item: APISticker) => {
  state.value.selectedItem = item
  // Keep current customization if editing existing sticker
  if (!props.currentSticker) {
    state.value.customization = {
      x: 0,
      y: 0,
      wear: 0,
      scale: 1,
      rotation: 0,
    }
  }
}

const handleSave = () => {
  if (!state.value.selectedItem) return

  const emitData: IEnhancedWeaponSticker = {
    id: Number(state.value.selectedItem.id.replace('sticker-', '')),
    slot: props.position,
    position: props.position,
    x: state.value.customization.x,
    y: state.value.customization.y,
    wear: state.value.customization.wear,
    scale: state.value.customization.scale,
    rotation: state.value.customization.rotation,
    api: {
      name: state.value.selectedItem.name,
      image: state.value.selectedItem.image,
      type: state.value.selectedItem.type,
      effect: state.value.selectedItem.effect ?? '',
      tournament_event: state.value.selectedItem.tournament_event || '',
      tournament_team: state.value.selectedItem.tournament_team || '',
      rarity: state.value.selectedItem.rarity,
    },
  }
  emit('select', emitData)
  handleClose()
}

const handleRemove = () => {
  if (!props.currentSticker) return
  emit('select', null)
  handleClose()
}

const handleResetConfig = () => {
  state.value.customization = {
    x: 0,
    y: 0,
    wear: 0,
    scale: 1,
    rotation: 0,
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
      wear: 0,
      scale: 1,
      rotation: 0,
    },
  }

  resetFilters()
}

const handleClose = () => {
  emit('update:visible', false)
  resetAllState()
}

onMounted(() => {
  fetchItems()
})

// Initialize with current sticker if editing
watchEffect(() => {
  if (props.currentSticker) {
    state.value.selectedItem = state.value.items.find(
      (item) => item.id === 'sticker-' + props.currentSticker?.id
    )
    state.value.customization = {
      x: props.currentSticker.x ?? 0,
      y: props.currentSticker.y ?? 0,
      wear: props.currentSticker.wear ?? 0,
      scale: props.currentSticker.scale ?? 1,
      rotation: props.currentSticker.rotation ?? 0,
    }
  }
})
watch(
  () => props.currentSticker,
  (newSticker) => {
    if (newSticker) {
      state.value.customization = {
        x: newSticker.x ?? 0,
        y: newSticker.y ?? 0,
        wear: newSticker.wear ?? 0,
        scale: newSticker.scale ?? 1,
        rotation: newSticker.rotation ?? 0,
      }
    }
  },
  { immediate: true }
)

// Fetch stickers when modal becomes visible and reset state when closed
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
          currentSticker
            ? t('modals.sticker.titleEdit') +
              (weaponName ? ` ${t('common.for')} ${weaponName}` : '')
            : t('modals.sticker.titleAdd') + (weaponName ? ` ${t('common.for')} ${weaponName}` : '')
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
        :search-placeholder="String(t('modals.sticker.searchPlaceholder'))"
        show-reset
        :reset-label="t('modals.weaponSkin.buttons.reset') as string"
        :reset-disabled="!currentSticker && !state.selectedItem"
        @reset="handleResetConfig"
      />
    </template>

    <div class="flex flex-col gap-3 -mt-2">
      <!-- Selected Sticker Preview -->
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
                  generateStickerImageUrl(
                    state.selectedItem.id.replace('sticker-', ''),
                    state.customization.wear
                  )
                "
                :alt="state.selectedItem.name"
                class="h-40 w-full object-contain"
                @error="
                  (e) => ((e.target as HTMLImageElement).src = state.selectedItem?.image || '')
                "
              />
            </template>
          </SelectedItemStage>

          <!-- Right side - Customization -->
          <div class="flex flex-col gap-4">
            <!-- Main Controls Grid -->
            <div>
              <div class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                <!-- X Position -->
                <div>
                  <h4
                    class="mb-1 font-mono text-[10px] uppercase tracking-[0.12em] text-text-tertiary"
                  >
                    X {{ t('modals.sticker.labels.position') }}
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
                <!-- Y Position -->
                <div>
                  <h4
                    class="mb-1 font-mono text-[10px] uppercase tracking-[0.12em] text-text-tertiary"
                  >
                    Y {{ t('modals.sticker.labels.position') }}
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
                <!-- Scale -->
                <div>
                  <h4
                    class="mb-1 font-mono text-[10px] uppercase tracking-[0.12em] text-text-tertiary"
                  >
                    {{ t('modals.sticker.labels.scale') }}
                  </h4>
                  <NumberField
                    v-model="state.customization.scale"
                    :min="0.01"
                    :max="1"
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
                <!-- Rotation -->
                <div>
                  <h4
                    class="mb-1 font-mono text-[10px] uppercase tracking-[0.12em] text-text-tertiary"
                  >
                    {{ t('modals.sticker.labels.rotation') }}
                  </h4>
                  <NumberField
                    v-model="state.customization.rotation"
                    :min="-360"
                    :max="360"
                    :step="1"
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
                <!-- Wear -->
                <div>
                  <h4
                    class="mb-1 font-mono text-[10px] uppercase tracking-[0.12em] text-text-tertiary"
                  >
                    {{ t('modals.sticker.labels.wear') }}
                  </h4>
                  <NumberField
                    v-model="state.customization.wear"
                    :min="0"
                    :max="1"
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
              </div>

              <!-- External normalized offsets (read-only, if available) -->
              <div
                v-if="currentSticker && (extNormX !== null || extNormY !== null)"
                class="mt-2 whitespace-nowrap font-mono text-[10px] tabular-nums text-text-tertiary"
              >
                <span class="uppercase tracking-[0.08em] opacity-70">Ext normalized</span>: X
                {{ extNormXStr }} | Y {{ extNormYStr }}
              </div>
            </div>

            <!-- Bottom Section: Title and Buttons -->
            <div
              class="flex flex-col items-center justify-between gap-4 border-t border-border pt-4 lg:flex-row"
            >
              <!-- Sticker Name -->
              <h3 class="font-display text-lg font-medium tracking-[-0.02em] text-foreground">
                {{ state.selectedItem.name.replace(/^Sticker \| /, '') }}
              </h3>

              <!-- Action Buttons -->
              <div class="flex w-full justify-end gap-3 lg:w-auto">
                <Button variant="outline" class="flex-1 lg:w-32 lg:flex-none" @click="handleSave">
                  {{
                    currentSticker
                      ? t('modals.sticker.buttons.update')
                      : t('modals.sticker.buttons.create')
                  }}
                </Button>
                <Button
                  v-if="currentSticker"
                  variant="destructive"
                  class="flex-1 lg:w-32 lg:flex-none"
                  @click="handleRemove"
                >
                  {{ t('modals.sticker.buttons.delete') }}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Sticker list controls (Sort + Filters) -->
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div class="flex items-center gap-2">
          <span class="font-mono text-[10px] uppercase tracking-[0.12em] text-text-tertiary">{{
            t('modals.sticker.sort.label')
          }}</span>
          <Select :model-value="sortBy" @update:model-value="(v) => (sortBy = String(v ?? sortBy))">
            <SelectTrigger size="sm" class="w-44">
              <SelectValue>
                {{ stickerSortOptions.find((o) => o.value === sortBy)?.label }}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem
                v-for="option in stickerSortOptions"
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

      <div v-if="availableEffects.length > 0" class="-mt-2 flex flex-wrap items-center gap-1.5">
        <span class="mr-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-text-tertiary">{{
          t('modals.sticker.filters.effect')
        }}</span>
        <Button
          v-for="effect in availableEffects"
          :key="effect.id"
          size="xs"
          :variant="effectFilterIds.includes(effect.id) ? 'default' : 'secondary'"
          class="rounded-full"
          :aria-label="`Filter by ${effect.label} effect`"
          :aria-pressed="effectFilterIds.includes(effect.id)"
          @click="toggleEffectFilter(effect.id)"
        >
          {{ effect.label }}
        </Button>
      </div>

      <!-- Stickers Grid (skeleton / empty / items + pagination) -->
      <ItemBrowserGrid
        v-model:current-page="state.currentPage"
        :items="paginatedItems"
        :loading="state.isLoading"
        :total-pages="totalPages"
        :selected-id="state.selectedItem?.id ?? null"
        :skeleton-count="PAGE_SIZE"
        :sibling-count="2"
        image-height="sm"
        :empty-text="t('modals.sticker.noSearchResults') as string"
        :item-label="(item: APISticker) => item.name.replace('Sticker |', '')"
        @select="handleSelect"
      />
    </div>
  </AppModal>
</template>
