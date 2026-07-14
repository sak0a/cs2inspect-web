<script setup lang="ts">
import { Search, ChevronLeft, ChevronRight } from '@lucide/vue'
import type { APISticker } from '~/server/types'

interface Props {
  visible: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
  (e: 'select', sticker: APISticker): void
}>()

const { t } = useI18n()
const message = useToast()

const state = ref({
  searchQuery: '',
  currentPage: 1,
  items: [] as APISticker[],
  isLoading: false,
})

const PAGE_SIZE = 15

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
  emit('select', item)
  handleClose()
}

const handleClose = () => {
  emit('update:visible', false)
  state.value.searchQuery = ''
  state.value.currentPage = 1
  resetFilters()
}

const getStickerSlabImage = (id: string) => {
  const cleanId = id.replace('sticker-', '')
  try {
    const config = useRuntimeConfig()
    const assetsUrl = config.public.assetsUrl as string
    const charmsPath = config.public.assetsCharmsPath as string

    if (assetsUrl) {
      return `${assetsUrl}${charmsPath}/sticker_slab/sticker_slab_sticker_${cleanId}.webp`
    }
  } catch {
    // ignore
  }
  return `/img/charms/sticker_slab/sticker_slab_sticker_${cleanId}.webp`
}

onMounted(() => {
  fetchItems()
})

watch(
  () => props.visible,
  (newValue) => {
    if (newValue) {
      if (state.value.items.length === 0) fetchItems()
    } else {
      handleClose()
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
        <span class="leading-none">Select Sticker to Wrap</span>
      </div>
    </template>
    <template #header-extra>
      <div class="flex items-center gap-2">
        <div class="relative w-64">
          <Search
            class="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400"
          />
          <Input
            v-model="state.searchQuery"
            :placeholder="t('modals.sticker.searchPlaceholder') as string"
            class="w-full pl-9"
          />
        </div>
      </div>
    </template>

    <div class="flex flex-col gap-3 -mt-2">
      <!-- Sticker list controls (Sort + Filters) -->
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div class="flex items-center gap-2">
          <span class="text-sm text-gray-300">{{ t('modals.sticker.sort.label') }}</span>
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
            {{ sortDir === 'asc' ? '↑' : '↓' }}
          </Button>
        </div>

        <div v-if="availableRarities.length > 0" class="flex flex-wrap items-center gap-2">
          <span class="text-sm text-gray-300">{{ t('modals.sticker.filters.rarity') }}</span>
          <Button
            v-for="rarity in availableRarities"
            :key="rarity.id"
            size="xs"
            :variant="rarityFilterIds.includes(rarity.id) ? 'default' : 'secondary'"
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
          :variant="effectFilterIds.includes(effect.id) ? 'default' : 'secondary'"
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
          class="cursor-pointer transition-all hover:shadow-lg h-full hover:opacity-80 rounded-sm border border-[#313030] bg-[#242424] px-6 pt-5 pb-5"
          :style="{
            border: `1px solid ${item.rarity?.color || '#313030'}`,
            background: `linear-gradient(135deg, #101010, ${hexToRgba(
              item.rarity?.color || '#313030',
              '0.15'
            )})`,
          }"
          @click="handleSelect(item)"
        >
          <div class="flex flex-col items-center">
            <img
              :src="getStickerSlabImage(item.id)"
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
