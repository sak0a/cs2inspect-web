<script setup lang="ts">
import { Search, ChevronLeft, ChevronRight } from '@lucide/vue'
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
  sortedItems,
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
      <div class="flex items-center gap-2">
        <Button
          variant="elevated"
          rounded="full"
          intent="error"
          tinted
          :disabled="!currentSticker && !state.selectedItem"
          class="whitespace-nowrap px-5 py-1.5 overflow-visible!"
          @click="handleResetConfig"
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
          {{ t('modals.weaponSkin.buttons.reset') }}
        </Button>
        <Separator orientation="vertical" class="mx-2 bg-white/10 data-[orientation=vertical]:h-4" />
        <div class="relative w-64">
          <Search
            class="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400"
          />
          <Input
            v-model="state.searchQuery"
            :placeholder="String(t('modals.sticker.searchPlaceholder'))"
            class="w-full pl-9"
          />
        </div>
      </div>
    </template>

    <div class="flex flex-col gap-3 -mt-2">
      <!-- Selected Sticker Preview -->
      <div v-if="state.selectedItem" class="bg-[var(--bg-secondary)] p-4 md:p-6 rounded-lg">
        <div class="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-6">
          <!-- Left side - Image -->
          <div class="flex flex-col items-center justify-center">
            <img
              :src="
                generateStickerImageUrl(
                  state.selectedItem.id.replace('sticker-', ''),
                  state.customization.wear
                )
              "
              :alt="state.selectedItem.name"
              class="h-40 w-full object-contain"
              @error="(e) => ((e.target as HTMLImageElement).src = state.selectedItem?.image || '')"
            />
          </div>

          <!-- Right side - Customization -->
          <div class="flex flex-col gap-4">
            <!-- Main Controls Grid -->
            <div>
              <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                <!-- X Position -->
                <div>
                  <h4 class="text-xs font-medium mb-1 text-gray-400">
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
                  <h4 class="text-xs font-medium mb-1 text-gray-400">
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
                  <h4 class="text-xs font-medium mb-1 text-gray-400">
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
                  <h4 class="text-xs font-medium mb-1 text-gray-400">
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
                  <h4 class="text-xs font-medium mb-1 text-gray-400">
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
                class="text-[10px] text-gray-500 whitespace-nowrap mt-2"
              >
                <span class="opacity-70">Ext normalized</span>: X {{ extNormXStr }} | Y
                {{ extNormYStr }}
              </div>
            </div>

            <!-- Bottom Section: Title and Buttons -->
            <div
              class="border-t border-[var(--border-subtle)] pt-4 flex flex-col lg:flex-row items-center justify-between gap-4"
            >
              <!-- Sticker Name -->
              <h3 class="text-lg font-bold text-white">
                {{ state.selectedItem.name.replace(/^Sticker \| /, '') }}
              </h3>

              <!-- Action Buttons -->
              <div class="flex gap-3 w-full lg:w-auto justify-end">
                <Button
                  intent="primary"
                  variant="elevated"
                  rounded="full"
                  tinted
                  class="flex-1 lg:flex-none lg:w-32 px-5 py-1.5"
                  @click="handleSave"
                >
                  {{
                    currentSticker
                      ? t('modals.sticker.buttons.update')
                      : t('modals.sticker.buttons.create')
                  }}
                </Button>
                <Button
                  v-if="currentSticker"
                  intent="error"
                  variant="elevated"
                  rounded="full"
                  tinted
                  class="flex-1 lg:flex-none lg:w-32 px-5 py-1.5"
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
          <span class="text-sm text-gray-300">{{ t('modals.sticker.sort.label') }}</span>
          <Select
            :model-value="sortBy"
            @update:model-value="(v) => (sortBy = String(v ?? sortBy))"
          >
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
            size="xs"
            icon-only
            variant="light"
            rounded="md"
            :aria-label="`Sort ${sortDir === 'asc' ? 'ascending' : 'descending'}`"
            @click="toggleSortDir"
          >
            {{ sortDir === 'asc' ? '↑' : '↓' }}
          </Button>
        </div>

        <div v-if="availableRarities.length > 0" class="flex flex-wrap items-center gap-2">
          <span class="text-sm text-gray-300">{{ t('modals.sticker.filters.rarity') }}</span>
          <Button
            v-for="rarity in availableRarities"
            :key="rarity.id"
            size="xs"
            variant="light"
            rounded="md"
            :intent="rarityFilterIds.includes(rarity.id) ? 'primary' : 'default'"
            :style="rarityFilterIds.includes(rarity.id) ? { borderColor: rarity.color } : undefined"
            :aria-label="`Filter by ${rarity.name} rarity`"
            :aria-pressed="rarityFilterIds.includes(rarity.id)"
            @click="toggleRarityFilter(rarity.id)"
          >
            <span class="flex items-center gap-2">
              <span class="h-2 w-2 rounded-full" :style="{ background: rarity.color }" />
              {{ rarity.name }}
            </span>
          </Button>
        </div>
      </div>

      <div v-if="availableEffects.length > 0" class="flex flex-wrap items-center gap-2 -mt-2">
        <span class="text-sm text-gray-300">{{ t('modals.sticker.filters.effect') }}</span>
        <Button
          v-for="effect in availableEffects"
          :key="effect.id"
          size="xs"
          variant="light"
          rounded="md"
          :intent="effectFilterIds.includes(effect.id) ? 'primary' : 'default'"
          :aria-label="`Filter by ${effect.label} effect`"
          :aria-pressed="effectFilterIds.includes(effect.id)"
          @click="toggleEffectFilter(effect.id)"
        >
          {{ effect.label }}
        </Button>
      </div>

      <!-- Stickers Grid -->
      <div
        v-if="!state.isLoading"
        class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4"
      >
        <div
          v-for="item in paginatedItems"
          :key="item.id"
          :class="[
            'cursor-pointer transition-all hover:shadow-lg h-full rounded-sm border border-[#313030] bg-[#242424] px-6 pt-5 pb-5',
            state.selectedItem?.id === item.id
              ? 'ring-2 ring-[var(--selection-ring)] border-0 opacity-85'
              : '',
          ]"
          :style="{
            borderColor: item.rarity?.color || '#313030',
            background: `linear-gradient(135deg, #101010, ${hexToRgba(
              item.rarity?.color || '#313030',
              '0.15'
            )})`,
          }"
          @click="handleSelect(item)"
        >
          <div class="flex flex-col items-center">
            <img
              :src="item.image"
              :alt="item.name"
              class="w-full h-24 object-contain mb-2"
              loading="lazy"
            />
            <p class="text-sm text-center break-words">
              {{ item.name.replace('Sticker |', '') }}
            </p>
            <div class="h-1 w-full mt-2" :style="{ background: item.rarity?.color || '#313030' }" />
          </div>
        </div>
      </div>

      <!-- Skeleton Loading State -->
      <div
        v-if="state.isLoading"
        class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4"
      >
        <div
          v-for="i in PAGE_SIZE"
          :key="i"
          class="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-dark)] p-4"
        >
          <Skeleton class="h-24 w-full" />
          <div class="mt-3">
            <Skeleton class="h-4 w-full" />
            <div class="mt-2">
              <Skeleton class="h-1 w-full" />
            </div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div
        v-if="!state.isLoading && sortedItems.length === 0"
        class="flex justify-center items-center h-64 text-gray-400"
      >
        {{ t('modals.sticker.noSearchResults') }}
      </div>

      <!-- Pagination -->
      <div v-if="totalPages > 1" class="flex justify-center">
        <Pagination
          v-model:page="state.currentPage"
          :total="totalPages"
          :items-per-page="1"
          :sibling-count="2"
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
  </AppModal>
</template>
