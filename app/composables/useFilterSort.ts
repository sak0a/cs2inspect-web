/**
 * useFilterSort – shared filter, sort, and pagination logic for
 * item-selection modals (StickerModal, KeychainModal, WrappedStickerModal).
 *
 * Complements `useItemModal` which handles skin-specific modals
 * (Weapon, Knife, Glove).
 */

import { stickerRarityRank, toggleFilterId } from '~/utils/rarity'
import {
  effectLabelForSticker,
  buildAvailableEffects,
  buildAllowedEffectSet,
  type EffectOption,
} from '~/utils/stickerEffects'

type SortDir = 'asc' | 'desc'

interface RarityInfo {
  id: string
  name: string
  color: string
}

interface FilterableItem {
  name: string
  rarity?: { id: string; name: string; color: string }
  effect?: string
}

export interface UseFilterSortOptions<T extends FilterableItem> {
  /** Reactive array of all loaded items */
  items: Ref<T[]> | ComputedRef<T[]>
  /** Reactive search query string */
  searchQuery: Ref<string> | ComputedRef<string>
  /** Reactive current page number – will be mutated on filter/sort changes */
  currentPage: Ref<number> | WritableComputedRef<number>
  /** Items per page */
  pageSize: number
  /** Available sort-by keys (e.g. ['name', 'rarity'] or ['name', 'rarity', 'effect']) */
  sortKeys: string[]
  /** Whether effect filtering/sorting is enabled */
  hasEffects?: boolean
}

export function useFilterSort<T extends FilterableItem>(options: UseFilterSortOptions<T>) {
  const { items, searchQuery, currentPage, pageSize, hasEffects = false } = options

  // UI state
  const sortBy = ref(options.sortKeys[0] || 'name')
  const sortDir = ref<SortDir>('asc')
  const rarityFilterIds = ref<string[]>([])
  const effectFilterIds = ref<string[]>([])

  // --- Available filter options ---

  const availableRarities = computed<RarityInfo[]>(() => {
    const map = new Map<string, RarityInfo>()
    for (const item of items.value) {
      const id = item.rarity?.id
      if (!id) continue
      if (!map.has(id)) {
        map.set(id, { id, name: item.rarity!.name, color: item.rarity!.color })
      }
    }
    return Array.from(map.values()).sort(
      (a, b) => stickerRarityRank(a.id) - stickerRarityRank(b.id)
    )
  })

  const availableEffects = computed<EffectOption[]>(() => {
    if (!hasEffects) return []
    return buildAvailableEffects(items.value)
  })

  // --- Toggle helpers ---

  function toggleSortDir() {
    sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc'
    currentPage.value = 1
  }

  function toggleRarityFilter(rarityId: string) {
    rarityFilterIds.value = toggleFilterId(rarityFilterIds.value, rarityId)
    currentPage.value = 1
  }

  function toggleEffectFilter(effectId: string) {
    effectFilterIds.value = toggleFilterId(effectFilterIds.value, effectId)
    currentPage.value = 1
  }

  // --- Computed item lists ---

  const filteredItems = computed<T[]>(() => {
    const q = searchQuery.value.toLowerCase()
    const raritySet = new Set(rarityFilterIds.value)
    const useRarityFilter = raritySet.size > 0

    const effectSet = new Set(effectFilterIds.value)
    const useEffectFilter = hasEffects && effectSet.size > 0

    let allowedEffects: Set<string> | null = null
    if (useEffectFilter) {
      allowedEffects = buildAllowedEffectSet(effectFilterIds.value)
    }

    return items.value.filter((item) => {
      if (q && !item.name.toLowerCase().includes(q)) return false
      if (useRarityFilter && !raritySet.has(item.rarity?.id ?? '')) return false
      if (useEffectFilter && allowedEffects && !allowedEffects.has(item.effect || 'Other'))
        return false
      return true
    })
  })

  const sortedItems = computed<T[]>(() => {
    const dir = sortDir.value === 'asc' ? 1 : -1
    const key = sortBy.value

    return [...filteredItems.value].sort((a, b) => {
      if (key === 'rarity') {
        const diff = stickerRarityRank(a.rarity?.id) - stickerRarityRank(b.rarity?.id)
        if (diff !== 0) return diff * dir
      } else if (key === 'effect' && hasEffects) {
        const effectA = effectLabelForSticker(a.effect)
        const effectB = effectLabelForSticker(b.effect)
        const diff = effectA.localeCompare(effectB)
        if (diff !== 0) return diff * dir
      }
      return a.name.localeCompare(b.name) * dir
    })
  })

  const paginatedItems = computed<T[]>(() => {
    const start = (currentPage.value - 1) * pageSize
    const end = start + pageSize
    return sortedItems.value.slice(start, end)
  })

  const totalPages = computed(() => Math.ceil(sortedItems.value.length / pageSize))

  // Reset page when search query changes
  watch(searchQuery, () => {
    currentPage.value = 1
  })

  function resetFilters() {
    sortBy.value = options.sortKeys[0] || 'name'
    sortDir.value = 'asc'
    rarityFilterIds.value = []
    effectFilterIds.value = []
    currentPage.value = 1
  }

  return {
    // State
    sortBy,
    sortDir,
    rarityFilterIds,
    effectFilterIds,

    // Computed
    availableRarities,
    availableEffects,
    filteredItems,
    sortedItems,
    paginatedItems,
    totalPages,

    // Methods
    toggleSortDir,
    toggleRarityFilter,
    toggleEffectFilter,
    resetFilters,
  }
}
