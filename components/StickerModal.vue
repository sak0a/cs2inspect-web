<script setup lang="ts">
import type { APISticker, IEnhancedWeaponSticker } from "~/server/types";
import { generateStickerImageUrl } from "~/utils/canvasCoordinates";

const props = defineProps<{
// ... (rest of props)
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
}>()

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

const teamLabel = computed((): string | null => {
  if (props.team === 1) return t('modals.weaponSkin.team.terrorist') as string
  if (props.team === 2) return t('modals.weaponSkin.team.counterTerrorist') as string
  return null
})

const teamBadgeClasses = computed(() => {
  if (props.team === 1) return 'border-orange-500/30 bg-orange-500/15 text-orange-300'
  if (props.team === 2) return 'border-blue-500/30 bg-blue-500/15 text-blue-300'
  return ''
})

const digitOnlyInputProps = {
  inputmode: 'numeric' as const, 
  pattern: '\\d*',
  onKeydown: (e: KeyboardEvent) => { const allow=['Backspace','Delete','Tab','ArrowLeft','ArrowRight','Home','End','Enter']; const meta=e.ctrlKey||e.metaKey; if (allow.includes(e.key)||(meta&&/[acvxy]/i.test(e.key))) return; if (!/^[0-9]$/.test(e.key)) e.preventDefault() },
  onPaste: (e: ClipboardEvent) => { const t=e.clipboardData?.getData('text')||''; if (/[^0-9]/.test(t)) e.preventDefault() }
}

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

type StickerSortBy = 'name' | 'rarity' | 'effect'
type SortDir = 'asc' | 'desc'

const ui = ref({
  sortBy: 'name' as StickerSortBy,
  sortDir: 'asc' as SortDir,
  rarityFilterIds: [] as string[],
  effectFilterIds: [] as string[],
})

const rarityRank = (rarityId: string | undefined) => {
  // Sticker dataset uses ids like "rarity_rare", "rarity_mythical", ...
  const raw = (rarityId || '').toLowerCase()
  const id = raw.replace(/^rarity_/, '')
  const rankMap: Record<string, number> = {
    default: 1,
    rare: 2,
    mythical: 3,
    legendary: 4,
    ancient: 5,
    contraband: 6,
  }
  return rankMap[id] ?? 0
}

// Map UI-facing effect labels to actual dataset values.
// In the dataset, "Other" is effectively the "Paper" / non-special category.
const EFFECT_VALUE_MAP: Record<string, string[]> = {
  Paper: ['Paper', 'Other'],
  Holo: ['Holo'],
  Foil: ['Foil'],
  Glitter: ['Glitter'],
  Gold: ['Gold'],
  Lenticular: ['Lenticular'],
}

const EFFECT_ORDER = ['Paper', 'Holo', 'Foil', 'Glitter', 'Gold', 'Lenticular'] as const

const effectLabelForSticker = (effect: string | undefined) => {
  const v = (effect || 'Other')
  return v === 'Other' ? 'Paper' : v
}

const availableRarities = computed(() => {
  const map = new Map<string, { id: string; name: string; color: string }>()
  for (const sticker of state.value.items) {
    const id = sticker.rarity?.id
    if (!id) continue
    if (!map.has(id)) {
      map.set(id, { id, name: sticker.rarity.name, color: sticker.rarity.color })
    }
  }
  return Array.from(map.values()).sort((a, b) => rarityRank(a.id) - rarityRank(b.id))
})

type EffectOption = { id: string; label: string }
const availableEffects = computed<EffectOption[]>(() => {
  const present = new Set<string>()
  for (const sticker of state.value.items) {
    present.add(sticker.effect || 'Other')
  }

  const opts: EffectOption[] = []
  const mappedValues = new Set<string>()
  for (const id of EFFECT_ORDER) {
    const values = EFFECT_VALUE_MAP[id] || [id]
    for (const v of values) mappedValues.add(v)
  }

  for (const id of EFFECT_ORDER) {
    const values = EFFECT_VALUE_MAP[id] || [id]
    if (values.some(v => present.has(v))) {
      opts.push({ id, label: id })
    }
  }

  // Include any additional effect values present in the dataset (e.g., "Embroidered")
  const extras = Array.from(present)
    .filter(v => !mappedValues.has(v))
    .sort((a, b) => a.localeCompare(b))
  for (const effect of extras) {
    opts.push({ id: effect, label: effect })
  }

  return opts
})

const stickerSortOptions = computed(() => [
  { label: t('modals.sticker.sort.name') as string, value: 'name' },
  { label: t('modals.sticker.sort.rarity') as string, value: 'rarity' },
  { label: t('modals.sticker.sort.effect') as string, value: 'effect' },
])

const toggleSortDir = () => {
  ui.value.sortDir = ui.value.sortDir === 'asc' ? 'desc' : 'asc'
  state.value.currentPage = 1
}

const toggleRarityFilter = (rarityId: string) => {
  const set = new Set(ui.value.rarityFilterIds)
  if (set.has(rarityId)) set.delete(rarityId)
  else set.add(rarityId)
  ui.value.rarityFilterIds = Array.from(set)
  state.value.currentPage = 1
}

const toggleEffectFilter = (effectId: string) => {
  const set = new Set(ui.value.effectFilterIds)
  if (set.has(effectId)) set.delete(effectId)
  else set.add(effectId)
  ui.value.effectFilterIds = Array.from(set)
  state.value.currentPage = 1
}

const filteredItems = computed(() => {
  const q = state.value.searchQuery.toLowerCase()
  const raritySet = new Set(ui.value.rarityFilterIds)
  const useRarityFilter = raritySet.size > 0

  const effectSet = new Set(ui.value.effectFilterIds)
  const useEffectFilter = effectSet.size > 0

  const allowedEffects = new Set<string>()
  if (useEffectFilter) {
    for (const id of effectSet) {
      const values = EFFECT_VALUE_MAP[id] || [id]
      for (const v of values) allowedEffects.add(v)
    }
  }

  return state.value.items.filter((sticker) => {
    if (q && !sticker.name.toLowerCase().includes(q)) return false
    if (useRarityFilter && !raritySet.has(sticker.rarity?.id)) return false
    if (useEffectFilter && !allowedEffects.has(sticker.effect || 'Other')) return false
    return true
  })
})

const sortedItems = computed(() => {
  const dir = ui.value.sortDir === 'asc' ? 1 : -1
  const sortBy = ui.value.sortBy

  return [...filteredItems.value].sort((a, b) => {
    if (sortBy === 'rarity') {
      const diff = rarityRank(a.rarity?.id) - rarityRank(b.rarity?.id)
      if (diff !== 0) return diff * dir
    } else if (sortBy === 'effect') {
      const effectA = effectLabelForSticker(a.effect)
      const effectB = effectLabelForSticker(b.effect)
      const diff = effectA.localeCompare(effectB)
      if (diff !== 0) return diff * dir
    }
    return a.name.localeCompare(b.name) * dir
  })
})

const paginatedItems = computed(() => {
  const start = (state.value.currentPage - 1) * PAGE_SIZE
  const end = start + PAGE_SIZE
  return sortedItems.value.slice(start, end)
})

const totalPages = computed(() => Math.ceil(sortedItems.value.length / PAGE_SIZE))

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

  ui.value = {
    sortBy: 'name',
    sortDir: 'asc',
    rarityFilterIds: [],
    effectFilterIds: [],
  }
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

// Reset pagination to page 1 whenever filters/sort/search change
watch(() => state.value.searchQuery, () => {
  state.value.currentPage = 1
})
watch(() => ui.value.sortBy, () => {
  state.value.currentPage = 1
})
watch(() => ui.value.sortDir, () => {
  state.value.currentPage = 1
})
watch(() => ui.value.rarityFilterIds, () => {
  state.value.currentPage = 1
}, { deep: true })
watch(() => ui.value.effectFilterIds, () => {
  state.value.currentPage = 1
}, { deep: true })
</script>

<template>
  <NModal
      :show="visible"
      style="max-width: 1200px; width: 95vw"
      preset="card"
      :bordered="false"
      size="huge"
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
            class="w-64"
        />
      </div>
    </template>

    <NSpace vertical size="large" class="-mt-2">
      <!-- Selected Sticker Preview -->
      <div v-if="state.selectedItem" class="bg-[#1a1a1a] p-4 md:p-6 rounded-lg">
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
            <div class="border-t border-[#313030] pt-4 flex flex-col lg:flex-row items-center justify-between gap-4">
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
            v-model:value="ui.sortBy"
            size="small"
            class="w-44"
            :options="stickerSortOptions"
          />
          <NButton
            size="small"
            secondary
            type="default"
            :aria-label="`Sort ${ui.sortDir === 'asc' ? 'ascending' : 'descending'}`"
            @click="toggleSortDir"
          >
            {{ ui.sortDir === 'asc' ? '↑' : '↓' }}
          </NButton>
        </div>

        <div v-if="availableRarities.length > 0" class="flex flex-wrap items-center gap-2">
          <span class="text-sm text-gray-300">{{ t('modals.sticker.filters.rarity') }}</span>
          <NButton
            v-for="rarity in availableRarities"
            :key="rarity.id"
            size="small"
            secondary
            :type="ui.rarityFilterIds.includes(rarity.id) ? 'primary' : 'default'"
            :style="ui.rarityFilterIds.includes(rarity.id) ? { borderColor: rarity.color } : undefined"
            :aria-label="`Filter by ${rarity.name} rarity`"
            :aria-pressed="ui.rarityFilterIds.includes(rarity.id)"
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
          :type="ui.effectFilterIds.includes(effect.id) ? 'primary' : 'default'"
          :aria-label="`Filter by ${effect.label} effect`"
          :aria-pressed="ui.effectFilterIds.includes(effect.id)"
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
            state.selectedItem?.id === item.id ? 'ring-2 ring-[var(--selection-ring)] border-0 opacity-65' : ''
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
            ></div>
          </div>
        </NCard>
      </div>

      <!-- Loading State -->
      <div v-if="state.isLoading" class="flex justify-center items-center h-64">
        <NSpin size="large" />
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