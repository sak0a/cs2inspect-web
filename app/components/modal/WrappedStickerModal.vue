<script setup lang="ts">
import { ArrowUp, ArrowDown } from '@lucide/vue'
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
      <ModalToolbar
        v-model:search="state.searchQuery"
        :search-placeholder="t('modals.sticker.searchPlaceholder') as string"
      />
    </template>

    <div class="flex flex-col gap-3 -mt-2">
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
        :skeleton-count="PAGE_SIZE"
        :sibling-count="2"
        image-height="sm"
        :empty-text="t('modals.sticker.noSearchResults') as string"
        :item-label="(item: APISticker) => item.name.replace('Sticker |', '')"
        :item-image="(item: APISticker) => getStickerSlabImage(item.id)"
        @select="handleSelect"
      />
    </div>
  </AppModal>
</template>
