<script setup lang="ts">
import type { APISticker } from "~/server/types";

interface Props {
  visible: boolean
}

const props = defineProps<Props>()

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

watch(() => props.visible, (newValue) => {
  if (newValue) {
    if (state.value.items.length === 0) fetchItems()
  } else {
    handleClose()
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
        <span class="leading-none">Select Sticker to Wrap</span>
      </div>
    </template>
    <template #header-extra>
      <div class="flex items-center gap-2">
        <NInput
            v-model:value="state.searchQuery"
            :placeholder="t('modals.sticker.searchPlaceholder') as string"
            class="w-96"
        />
      </div>
    </template>

    <NSpace vertical size="large" class="-mt-2">
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
            class="cursor-pointer transition-all hover:shadow-lg h-full hover:opacity-80"
            :style="{
            border: `1px solid ${item.rarity?.color || '#313030'}`,
            background: `linear-gradient(135deg, #101010, ${
              hexToRgba(item.rarity?.color || '#313030', '0.15')
            })`
          }"
            @click="handleSelect(item)"
        >
          <div class="flex flex-col items-center">
            <img
                :src="getStickerSlabImage(item.id)"
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

/* Ensure no selection ring appears by default */
.n-card:not(:hover) {
  --n-border-color: #313030 !important;
}
</style>
