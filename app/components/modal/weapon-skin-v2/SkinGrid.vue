<script setup lang="ts">
import type { IEnhancedWeapon } from '~/types'
import { useInfiniteScroll } from '~/composables/useInfiniteScroll'

interface Props {
  skins: IEnhancedWeapon[]
  isLoading: boolean
  isLoadingMore: boolean
  hasMore: boolean
  selectedPaintIndex: number
  sortBy: string
  sortDir: 'asc' | 'desc'
  searchQuery: string
  availableRarities: Array<{ id: number; name: string; color: string }>
  activeRarityIds: Set<number>
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'select-skin': [skin: IEnhancedWeapon]
  'load-more': []
  'toggle-sort-dir': []
  'update:sort-by': [value: string]
  'update:search-query': [value: string]
  'toggle-rarity': [id: number]
}>()

const { t } = useI18n()

const { sentinelRef } = useInfiniteScroll({
  onLoadMore: () => emit('load-more'),
  rootMargin: '400px',
  enabled: computed(() => props.hasMore && !props.isLoading),
})
</script>

<template>
  <div>
    <div class="flex items-center gap-8 px-4 py-3 text-xs text-gray-500 border-b border-white/5">
      <!-- Search (left, fills space) -->
      <NInput
        :value="searchQuery"
        :placeholder="String(t('modals.weaponSkin.inputs.searchPlaceholder'))"
        size="small"
        class="flex-1"
        data-tutorial="skin-search"
        @update:value="emit('update:search-query', $event)"
      />

      <div class="flex items-center gap-2 shrink-0">
        <span>Sort:</span>
        <NSelect
          :value="sortBy"
          :options="[
            { label: String(t('modals.weaponSkin.sort.name')), value: 'name' },
            { label: String(t('modals.weaponSkin.sort.rarity')), value: 'rarity' },
          ]"
          size="tiny"
          class="w-24"
          @update:value="emit('update:sort-by', $event)"
        />
        <button class="hover:text-white transition-colors" @click="emit('toggle-sort-dir')">
          {{ sortDir === 'asc' ? '↑' : '↓' }}
        </button>
      </div>

      <div class="flex items-center gap-3 shrink-0">
        <span>Rarity</span>
        <button
          v-for="rarity in availableRarities"
          :key="rarity.id"
          class="flex items-center gap-1 transition-opacity"
          :class="activeRarityIds.has(rarity.id) ? 'opacity-100' : 'opacity-30'"
          @click="emit('toggle-rarity', rarity.id)"
        >
          <span class="w-2 h-2 rounded-full" :style="{ background: rarity.color }" />
          <span :style="{ color: rarity.color }">{{ rarity.name }}</span>
        </button>
      </div>
    </div>
    <div v-if="isLoading" class="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 p-3">
      <div v-for="i in 10" :key="i" class="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-dark)] p-3">
        <NSkeleton height="96px" />
        <div class="mt-2"><NSkeleton text :repeat="1" /><div class="mt-1"><NSkeleton height="3px" /></div></div>
      </div>
    </div>
    <div v-else class="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 p-3">
      <NCard
        v-for="skin in skins"
        :key="skin.name"
        :style="{
          borderColor: skin.rarity?.color || '#313030',
          background: 'linear-gradient(135deg, #101010, ' + (skin.rarity?.color ? hexToRgba(skin.rarity.color, '0.15') : '#313030') + ')',
        }"
        :class="[
          'hover:shadow-lg cursor-pointer transition-all rounded-xl',
          selectedPaintIndex === Number(skin.paintindex) ? 'ring-2 ring-[var(--selection-ring)] border-0 opacity-85' : '',
        ]"
        @click="emit('select-skin', skin)"
      >
        <div class="flex flex-col items-center">
          <img :src="skin.image" :alt="skin.name" class="w-full h-24 object-contain mb-1.5" loading="lazy" />
          <div class="w-full">
            <p class="text-xs text-white truncate">{{ skin.name }}</p>
            <div class="h-0.5 mt-1.5 rounded-full" :style="{ background: skin.rarity?.color || '#313030' }" />
          </div>
        </div>
      </NCard>
    </div>
    <div v-if="isLoadingMore" class="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 px-3 pb-3">
      <div v-for="i in 5" :key="'skel-' + i" class="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-dark)] p-3 animate-pulse">
        <div class="h-24 bg-[var(--bg-secondary)] rounded" />
        <div class="mt-2 h-3 bg-[var(--bg-secondary)] rounded w-3/4" />
      </div>
    </div>
    <div ref="sentinelRef" class="h-1" />
    <div v-if="!isLoading && skins.length === 0" class="flex justify-center items-center h-48">
      <NEmpty :description="String(t('modals.weaponSkin.noSearchResults'))" />
    </div>
  </div>
</template>
