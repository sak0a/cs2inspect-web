<script setup lang="ts">
import type { APISticker } from "~/server/types"
import type { IEnhancedWeaponSticker } from '~/types'
import { generateStickerImageUrl } from "~/utils/canvasCoordinates";
import { digitOnlyInputProps } from '~/utils/inputProps'

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
const message = useMessage()

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
    rotation: 0
  }
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
    set: (v) => { state.value.currentPage = v },
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
      rotation: 0
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
    }
  };
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
      rotation: 0
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
      rotation: 0
    }
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
    state.value.selectedItem = state.value.items.find(item => item.id === ("sticker-" + props.currentSticker?.id))
    state.value.customization = {
      x: props.currentSticker.x ?? 0,
      y: props.currentSticker.y ?? 0,
      wear: props.currentSticker.wear ?? 0,
      scale: props.currentSticker.scale ?? 1,
      rotation: props.currentSticker.rotation ?? 0
    }
  }
})
watch(() => props.currentSticker, (newSticker) => {
  if (newSticker) {
    state.value.customization = {
      x: newSticker.x ?? 0,
      y: newSticker.y ?? 0,
      wear: newSticker.wear ?? 0,
      scale: newSticker.scale ?? 1,
      rotation: newSticker.rotation ?? 0
    }
  }
}, { immediate: true })

// Fetch stickers when modal becomes visible and reset state when closed
watch(() => props.visible, (newValue) => {
  if (newValue) {
    fetchItems()
  } else {
    // Reset state when modal is closed
    resetAllState()
  }
})

</script>

<template>
  <NModal
      :show="visible"
      style="max-width: 1200px; width: 95vw"
      preset="card"
      :bordered="false"
      size="huge"
      :auto-focus="false"
      :theme-overrides="weaponAttachmentModalThemeOverrides"
      @update:show="handleClose"
  >
    <template #header>
      <div class="flex items-center gap-3">
        <span class="leading-none">{{ currentSticker ? t('modals.sticker.titleEdit') + (weaponName ? ` ${t('common.for')} ${weaponName}` : '') : t('modals.sticker.titleAdd') + (weaponName ? ` ${t('common.for')} ${weaponName}` : '') }}</span>
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
        <NButton
            secondary
            type="error"
            :disabled="!currentSticker && !state.selectedItem"
            @click="handleResetConfig"
        >
          <template #icon>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-refresh">
              <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
              <path d="M20 11a8.1 8.1 0 0 0 -15.5 -2m-.5 -4v4h4" />
              <path d="M4 13a8.1 8.1 0 0 0 15.5 2m.5 4v-4h-4" />
            </svg>
          </template>
          {{ t('modals.weaponSkin.buttons.reset') }}
        </NButton>
        <NDivider vertical />
        <NInput
            v-model:value="state.searchQuery"
            :placeholder="String(t('modals.sticker.searchPlaceholder'))"
            class="w-96"
        />
      </div>
    </template>

    <NSpace vertical size="large" class="-mt-2">
      <!-- Selected Sticker Preview -->
      <div v-if="state.selectedItem" class="bg-[var(--bg-secondary)] p-4 md:p-6 rounded-lg bg-opacity-50">
        <div class="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-6">
          <!-- Left side - Image -->
          <div class="flex flex-col items-center justify-center">
            <img
                :src="generateStickerImageUrl(state.selectedItem.id.replace('sticker-', ''), state.customization.wear)"
                :alt="state.selectedItem.name"
                class="h-40 w-full object-contain"
                @error="(e) => (e.target as HTMLImageElement).src = state.selectedItem?.image || ''"
            >
          </div>

          <!-- Right side - Customization -->
          <div class="flex flex-col gap-4">
            <!-- Main Controls Grid -->
            <div>
              <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                <!-- X Position -->
                <div>
                  <h4 class="text-xs font-medium mb-1 text-gray-400">X {{ t('modals.sticker.labels.position') }}</h4>
                  <NInputNumber
                      v-model:value="state.customization.x"
                      :min="-100"
                      :max="100"
                      :step="0.01"
                      size="small"
                      class="w-full"
                      :input-props="digitOnlyInputProps"
                  />
                </div>
                <!-- Y Position -->
                <div>
                  <h4 class="text-xs font-medium mb-1 text-gray-400">Y {{ t('modals.sticker.labels.position') }}</h4>
                  <NInputNumber
                      v-model:value="state.customization.y"
                      :min="-100"
                      :max="100"
                      :step="0.01"
                      size="small"
                      class="w-full"
                      :input-props="digitOnlyInputProps"
                  />
                </div>
                <!-- Scale -->
                <div>
                  <h4 class="text-xs font-medium mb-1 text-gray-400">{{ t('modals.sticker.labels.scale') }}</h4>
                  <NInputNumber
                      v-model:value="state.customization.scale"
                      :min="0.01"
                      :max="1"
                      :step="0.01"
                      size="small"
                      class="w-full"
                      :input-props="digitOnlyInputProps"
                  />
                </div>
                <!-- Rotation -->
                <div>
                  <h4 class="text-xs font-medium mb-1 text-gray-400">{{ t('modals.sticker.labels.rotation') }}</h4>
                  <NInputNumber
                      v-model:value="state.customization.rotation"
                      :min="-360"
                      :max="360"
                      :step="1"
                      size="small"
                      class="w-full"
                      :input-props="digitOnlyInputProps"
                  />
                </div>
                <!-- Wear -->
                <div>
                  <h4 class="text-xs font-medium mb-1 text-gray-400">{{ t('modals.sticker.labels.wear') }}</h4>
                  <NInputNumber
                      v-model:value="state.customization.wear"
                      :min="0"
                      :max="1"
                      :step="0.01"
                      size="small"
                      class="w-full"
                  />
                </div>
              </div>

               <!-- External normalized offsets (read-only, if available) -->
              <div v-if="currentSticker && (extNormX !== null || extNormY !== null)" class="text-[10px] text-gray-500 whitespace-nowrap mt-2">
                <span class="opacity-70">Ext normalized</span>: X {{ extNormXStr }} | Y {{ extNormYStr }}
              </div>
            </div>

            <!-- Bottom Section: Title and Buttons -->
            <div class="border-t border-[var(--border-subtle)] pt-4 flex flex-col lg:flex-row items-center justify-between gap-4">
              <!-- Sticker Name -->
              <h3 class="text-lg font-bold text-white">{{ state.selectedItem.name.replace(/^Sticker \| /, '') }}</h3>

               <!-- Action Buttons -->
              <div class="flex gap-3 w-full lg:w-auto justify-end">
                <NButton
                    type="primary"
                    class="flex-1 lg:flex-none lg:w-32"
                    secondary
                    @click="handleSave"
                >
                  {{ currentSticker ? t('modals.sticker.buttons.update') : t('modals.sticker.buttons.create') }}
                </NButton>
                <NButton
v-if="currentSticker"
                    type="error"
                    class="flex-1 lg:flex-none lg:w-32"
                    secondary
                    @click="handleRemove"
                >
                  {{ t('modals.sticker.buttons.delete') }}
                </NButton>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Sticker list controls (Sort + Filters) -->
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div class="flex items-center gap-2">
          <span class="text-sm text-gray-300">{{ t('modals.sticker.sort.label') }}</span>
          <NSelect
            v-model:value="sortBy"
            size="small"
            class="w-44"
            :options="stickerSortOptions"
          />
          <NButton
            size="small"
            secondary
            type="default"
            :aria-label="`Sort ${sortDir === 'asc' ? 'ascending' : 'descending'}`"
            @click="toggleSortDir"
          >
            {{ sortDir === 'asc' ? '↑' : '↓' }}
          </NButton>
        </div>

        <div v-if="availableRarities.length > 0" class="flex flex-wrap items-center gap-2">
          <span class="text-sm text-gray-300">{{ t('modals.sticker.filters.rarity') }}</span>
          <NButton
            v-for="rarity in availableRarities"
            :key="rarity.id"
            size="small"
            secondary
            :type="rarityFilterIds.includes(rarity.id) ? 'primary' : 'default'"
            :style="rarityFilterIds.includes(rarity.id) ? { borderColor: rarity.color } : undefined"
            :aria-label="`Filter by ${rarity.name} rarity`"
            :aria-pressed="rarityFilterIds.includes(rarity.id)"
            @click="toggleRarityFilter(rarity.id)"
          >
            <span class="flex items-center gap-2">
              <span class="h-2 w-2 rounded-full" :style="{ background: rarity.color }" />
              {{ rarity.name }}
            </span>
          </NButton>
        </div>
      </div>

      <div v-if="availableEffects.length > 0" class="flex flex-wrap items-center gap-2 -mt-2">
        <span class="text-sm text-gray-300">{{ t('modals.sticker.filters.effect') }}</span>
        <NButton
          v-for="effect in availableEffects"
          :key="effect.id"
          size="small"
          secondary
          :type="effectFilterIds.includes(effect.id) ? 'primary' : 'default'"
          :aria-label="`Filter by ${effect.label} effect`"
          :aria-pressed="effectFilterIds.includes(effect.id)"
          @click="toggleEffectFilter(effect.id)"
        >
          {{ effect.label }}
        </NButton>
      </div>

      <!-- Stickers Grid -->
      <div v-if="!state.isLoading" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        <NCard
            v-for="item in paginatedItems"
            :key="item.id"
            :class="[
            'cursor-pointer transition-all hover:shadow-lg h-full',
            state.selectedItem?.id === item.id ? 'ring-2 ring-[var(--selection-ring)] border-0 opacity-85' : ''
          ]"
            :style="{
            borderColor: item.rarity?.color || '#313030',
            background: `linear-gradient(135deg, #101010, ${
              hexToRgba(item.rarity?.color || '#313030', '0.15')
            })`
          }"
            @click="handleSelect(item)"
        >
          <div class="flex flex-col items-center">
            <img
                :src="item.image"
                :alt="item.name"
                class="w-full h-24 object-contain mb-2"
                loading="lazy"
            >
            <p class="text-sm text-center break-words">{{ item.name.replace('Sticker |', '') }}</p>
            <div
                class="h-1 w-full mt-2"
                :style="{ background: item.rarity?.color || '#313030' }"
            />
          </div>
        </NCard>
      </div>

      <!-- Skeleton Loading State -->
      <div v-if="state.isLoading" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        <div
          v-for="i in PAGE_SIZE"
          :key="i"
          class="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-dark)] p-4"
        >
          <NSkeleton height="96px" />
          <div class="mt-3">
            <NSkeleton text :repeat="1" />
            <div class="mt-2">
              <NSkeleton height="4px" />
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
        <NPagination
            v-model:page="state.currentPage"
            :page-count="totalPages"
            :page-slot="7"
        />
      </div>
    </NSpace>
  </NModal>
</template>

<style scoped>
.n-card {
  background: #242424;
  border: 1px solid #313030;
}
</style>