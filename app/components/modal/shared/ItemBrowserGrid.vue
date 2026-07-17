<script setup lang="ts" generic="T extends BrowserGridItem">
/**
 * ItemBrowserGrid — shared paginated browsing grid for the item-selection
 * modals (weapon/knife/glove skins, stickers, keychains).
 *
 * Renders one of three states:
 * - loading  → skeleton grid (`skeletonCount` cells)
 * - empty    → shadcn Empty + lucide Inbox + `emptyText`
 * - items    → grid of SkinGridCard (overridable via the `item` slot)
 * plus shadcn Pagination that preserves the existing
 * `:total="totalPages"` / `:items-per-page="1"` semantics EXACTLY
 * (pagination is shown whenever `totalPages > 1`, matching the old markup).
 *
 * Pure presentational + v-model friendly: the parent keeps computing
 * `items` (already paginated), `totalPages`, and owns `currentPage`
 * (bound with `v-model:current-page`). Selection is emitted upward as
 * `select(item)` — no filtering/sorting/pagination logic lives here.
 *
 * Slots:
 * - `item` (scoped: `{ item, selected }`) — replaces the default
 *   SkinGridCard cell. The slot content must call its own click handler;
 *   the built-in `select` emit only fires for the default cell.
 */
import { Inbox, ChevronLeft, ChevronRight } from '@lucide/vue'

/** Minimal shape every browsable item shares (APIWeaponSkin/APISticker/APIKeychain all satisfy it). */
export interface BrowserGridItem {
  id: string | number
  name: string
  image?: string
  rarity?: { id?: string; name?: string; color?: string }
}

interface Props {
  /** Items for the CURRENT page (the parent paginates, e.g. `paginatedSkins`). */
  items: T[]
  /**
   * Id of the currently selected item (compared against `item.id`).
   * For modals that select by a different key (e.g. WeaponSkinModal compares
   * `paintindex`), pass an `isSelected` predicate instead.
   */
  selectedId?: string | number | null
  /** Optional predicate overriding `selectedId` comparison. */
  isSelected?: (item: T) => boolean
  /** Show the skeleton grid instead of items. */
  loading?: boolean
  /** Grid columns at desktop width (responsive ramp below). Default 5. */
  columns?: 3 | 4 | 5 | 6
  /** Total number of pages (drives Pagination with items-per-page=1). */
  totalPages: number
  /** Number of skeleton cells while loading. Default 10 (= old PAGE_SIZE). */
  skeletonCount?: number
  /** Empty-state description (pass the modal's existing i18n string). */
  emptyText?: string
  /** Pagination sibling count (weapon/knife/glove use 1, sticker/keychain use 2). */
  siblingCount?: number
  /** Art height forwarded to SkinGridCard ('md' = h-32 skins, 'sm' = h-24 stickers/keychains). */
  imageHeight?: 'sm' | 'md'
  /** Display-name mapper (strip "Sticker |", "Charm |", "★ X |" prefixes). Defaults to `item.name`. */
  itemLabel?: (item: T) => string
  /** Image-URL mapper (e.g. `generateFlatKeychainUrl(item.name)`). Defaults to `item.image`. */
  itemImage?: (item: T) => string
  /** Optional `data-tutorial` id for the grid (e.g. "skin-grid"). */
  gridTutorialId?: string
  /** Optional `data-tutorial` id for the pagination wrapper (e.g. "skin-pagination"). */
  paginationTutorialId?: string
}

const props = withDefaults(defineProps<Props>(), {
  selectedId: null,
  isSelected: undefined,
  loading: false,
  columns: 5,
  skeletonCount: 10,
  emptyText: '',
  siblingCount: 1,
  imageHeight: 'md',
  itemLabel: undefined,
  itemImage: undefined,
  gridTutorialId: undefined,
  paginationTutorialId: undefined,
})

/**
 * Current page, bound with `v-model:current-page` on the parent
 * (emits `update:currentPage`).
 */
const currentPage = defineModel<number>('currentPage', { default: 1 })

const emit = defineEmits<{
  /** Fired when a grid cell is clicked (the ORIGINAL item object is passed through untouched). */
  (e: 'select', item: T): void
}>()

/** Responsive column ramps keyed by the desktop column count. */
const gridClassMap: Record<number, string> = {
  3: 'grid-cols-2 md:grid-cols-3',
  4: 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4',
  5: 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5',
  6: 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6',
}

const gridClass = computed(() => `grid gap-4 ${gridClassMap[props.columns] ?? gridClassMap[5]}`)

const labelFor = (item: T) => (props.itemLabel ? props.itemLabel(item) : item.name)
const imageFor = (item: T) => (props.itemImage ? props.itemImage(item) : item.image || '')
const isItemSelected = (item: T) =>
  props.isSelected
    ? props.isSelected(item)
    : props.selectedId !== null && props.selectedId !== undefined && item.id === props.selectedId
</script>

<template>
  <div class="flex flex-col">
    <!-- Skeleton state -->
    <div v-if="loading" :class="gridClass">
      <ItemCardSkeleton
        v-for="i in skeletonCount"
        :key="i"
        :stage-class="imageHeight === 'sm' ? 'h-24' : 'h-32'"
      />
    </div>

    <!-- Item grid -->
    <div
      v-else-if="items.length > 0"
      :class="gridClass"
      :data-tutorial="gridTutorialId || undefined"
    >
      <template v-for="item in items" :key="item.id">
        <slot name="item" :item="item" :selected="isItemSelected(item)">
          <SkinGridCard
            :name="labelFor(item)"
            :image-url="imageFor(item)"
            :rarity-color="item.rarity?.color"
            :selected="isItemSelected(item)"
            :image-height="imageHeight"
            @click="emit('select', item)"
          />
        </slot>
      </template>
    </div>

    <!-- Empty state -->
    <div v-else class="flex h-64 items-center justify-center">
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Inbox />
          </EmptyMedia>
          <EmptyDescription>{{ emptyText }}</EmptyDescription>
        </EmptyHeader>
      </Empty>
    </div>

    <!-- Pagination (total=totalPages, items-per-page=1 semantics preserved EXACTLY) -->
    <div
      v-if="totalPages > 1"
      class="mt-4 flex justify-center"
      :data-tutorial="paginationTutorialId || undefined"
    >
      <Pagination
        v-model:page="currentPage"
        :total="totalPages"
        :items-per-page="1"
        :sibling-count="siblingCount"
        show-edges
      >
        <PaginationContent v-slot="{ items: pageItems }">
          <PaginationPrevious>
            <ChevronLeft class="size-4" />
          </PaginationPrevious>
          <template v-for="(page, index) in pageItems" :key="index">
            <PaginationItem
              v-if="page.type === 'page'"
              :value="page.value"
              :is-active="page.value === currentPage"
            >
              {{ page.value }}
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
</template>
