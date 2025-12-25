<script setup lang="ts">
import type { APISticker, IEnhancedWeaponSticker } from "~/server/utils/interfaces";

const props = defineProps<{
  visible: boolean
}>()

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
  (e: 'select', sticker: APISticker): void
}>()

const { t } = useI18n()
const message = useMessage()

const state = ref({
  searchQuery: '',
  currentPage: 1,
  items: [] as APISticker[],
  isLoading: false,
})

const PAGE_SIZE = 15

type StickerSortBy = 'name' | 'rarity' | 'effect'
type SortDir = 'asc' | 'desc'

const ui = ref({
  sortBy: 'name' as StickerSortBy,
  sortDir: 'asc' as SortDir,
  rarityFilterIds: [] as string[],
  effectFilterIds: [] as string[],
})

const rarityRank = (rarityId: string | undefined) => {
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

const availableEffects = computed(() => {
  const present = new Set<string>()
  for (const sticker of state.value.items) {
    present.add(sticker.effect || 'Other')
  }

  const opts = []
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
    const response = await fetch('/api/data/stickers')
    const data = await response.json()
    const stickers = data.data || data.stickers || []
    state.value.items = stickers
  } catch (error) {
    message.error(t('modals.sticker.errorFetching') as string)
    console.error('Error fetching stickers:', error)
  } finally {
    state.value.isLoading = false
  }
}

const handleSelect = (item: APISticker) => {
  emit('select', item)
  handleClose()
}

const handleClose = () => {
  emit('update:visible', false)
  // Reset state
  state.value.searchQuery = ''
  state.value.currentPage = 1
  ui.value.rarityFilterIds = []
  ui.value.effectFilterIds = []
}

onMounted(() => {
  fetchItems()
})

watch(() => props.visible, (newValue) => {
  if (newValue) {
    if (state.value.items.length === 0) fetchItems()
  } else {
    handleClose()
  }
})

// Reset pagination
watch(() => state.value.searchQuery, () => { state.value.currentPage = 1 })
watch(() => ui.value.sortBy, () => { state.value.currentPage = 1 })
watch(() => ui.value.sortDir, () => { state.value.currentPage = 1 })
watch(() => ui.value.rarityFilterIds, () => { state.value.currentPage = 1 }, { deep: true })
watch(() => ui.value.effectFilterIds, () => { state.value.currentPage = 1 }, { deep: true })
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
        <span class="leading-none">Select Sticker to Wrap</span>
      </div>
    </template>
    <template #header-extra>
      <div class="flex items-center gap-2">
        <NInput
            v-model:value="state.searchQuery"
            :placeholder="t('modals.sticker.searchPlaceholder') as string"
            class="w-64"
        />
      </div>
    </template>

    <NSpace vertical size="large" class="-mt-2">
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
            class="cursor-pointer transition-all hover:shadow-lg h-full hover:ring-2 hover:ring-[var(--selection-ring)] hover:border-0"
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
                :src="`/img/charms/sticker_slab/sticker_slab_sticker_${item.id.replace('sticker-', '')}.webp`"
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
