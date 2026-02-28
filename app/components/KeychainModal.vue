<script setup lang="ts">
import type { APIKeychain, IEnhancedWeaponKeychain, APISticker } from '~/server/types'
import { generateFlatKeychainUrl } from '~/utils/canvasCoordinates'
import WrappedStickerModal from './WrappedStickerModal.vue'
import { digitOnlyInputProps } from '~/utils/inputProps'

interface Props {
    visible: boolean
    weaponName?: string
    team?: number
    currentKeychain?: {
        id?: number | string
        x?: number
        y?: number
        z?: number
        seed?: number
        wrapped_sticker_id?: number | null
        highlight_reel_id?: number | null
    } | null
}

const props = defineProps<Props>()

const emit = defineEmits<{
    (e: 'update:visible', value: boolean): void
    (e: 'select', keychain: IEnhancedWeaponKeychain | null): void
}>()

const { t } = useI18n()
const message = useMessage()

const state = ref({
    searchQuery: '',
    currentPage: 1,
    items: [] as APIKeychain[],
    isLoading: false,
    selectedItem: null as APIKeychain | null | undefined,
    customization: {
        x: 0,
        y: 0,
        z: 0,
        seed: 0,
        wrapped_sticker_id: null as number | null,
        highlight_reel_id: null as number | null,
    },
    wrappedStickerModalVisible: false,
    selectedWrappedSticker: null as APISticker | null,
})

const PAGE_SIZE = 10

const keychainSortOptions = computed(() => [
    { label: t('modals.keychain.sort.name') as string, value: 'name' },
    { label: t('modals.keychain.sort.rarity') as string, value: 'rarity' },
])

const {
    sortBy,
    sortDir,
    rarityFilterIds,
    availableRarities,
    sortedItems,
    paginatedItems,
    totalPages,
    toggleSortDir,
    toggleRarityFilter,
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
    sortKeys: ['name', 'rarity'],
})

// Check if seed input should be disabled for Austin 2025 Highlight charms
const isSeedDisabled = computed(() => {
    return (
        state.value.selectedItem?.name?.includes('Souvenir Charm | Austin 2025 Highlight') || false
    )
})

const { teamLabel, teamBadgeClasses } = useTeamBadge(() => props.team)

const isStickerSlab = computed(() => {
    const name = state.value.selectedItem?.name?.toLowerCase() || ''
    return name.includes('sticker slab')
})

const isHighlightReel = computed(() => {
    const name = state.value.selectedItem?.name?.toLowerCase() || ''
    return name.includes('highlight')
})

const handleSelectWrappedSticker = (sticker: APISticker) => {
    state.value.selectedWrappedSticker = sticker
    state.value.customization.wrapped_sticker_id = Number(sticker.id.replace('sticker-', ''))
}

const clearWrappedSticker = () => {
    state.value.selectedWrappedSticker = null
    state.value.customization.wrapped_sticker_id = null
}

const fetchItems = async () => {
    try {
        state.value.isLoading = true
        const response = await $fetch<{ data: APIKeychain[] }>('/api/data/keychains')
        state.value.items = response.data ?? []
    } catch (error) {
        message.error(t('modals.keychain.errorFetching') as string)
        console.error('Error fetching keychains:', error)
    } finally {
        state.value.isLoading = false
    }
}

const handleSelect = (item: APIKeychain) => {
    state.value.selectedItem = item

    // Always reset customization when selecting a new keychain to prevent stale data
    state.value.customization = {
        x: props.currentKeychain?.x ?? 0,
        y: props.currentKeychain?.y ?? 0,
        z: props.currentKeychain?.z ?? 0,
        seed: 0,
        wrapped_sticker_id: null,
        highlight_reel_id: null,
    }

    // Clear selected wrapped sticker preview
    state.value.selectedWrappedSticker = null
}

const handleSave = () => {
    if (!state.value.selectedItem) return

    const emitData: IEnhancedWeaponKeychain = {
        id: Number(state.value.selectedItem.id.replace('keychain-', '')),
        x: state.value.customization.x,
        y: state.value.customization.y,
        z: state.value.customization.z,
        seed: state.value.customization.seed,
        wrapped_sticker_id: state.value.customization.wrapped_sticker_id || undefined,
        highlight_reel_id: state.value.customization.highlight_reel_id || undefined,
        api: {
            name: state.value.selectedItem.name,
            image: state.value.selectedItem.image,
            rarity: state.value.selectedItem.rarity,
        },
    }
    emit('select', emitData)
    handleClose()
}

const handleRemove = () => {
    if (!props.currentKeychain) return
    emit('select', null)
    handleClose()
}

const handleResetConfig = () => {
    state.value.customization = {
        x: 0,
        y: 0,
        z: 0,
        seed: 0,
        wrapped_sticker_id: null,
        highlight_reel_id: null,
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
            z: 0,
            seed: 0,
            wrapped_sticker_id: null,
            highlight_reel_id: null,
        },
        wrappedStickerModalVisible: false,
        selectedWrappedSticker: null,
    }
}

const handleClose = () => {
    emit('update:visible', false)
    resetAllState()
}

onMounted(() => {
    fetchItems()
})

watchEffect(() => {
    if (props.currentKeychain) {
        state.value.selectedItem = state.value.items.find(
            (item) => item.id === 'keychain-' + props.currentKeychain?.id
        )
        state.value.customization = {
            x: props.currentKeychain.x ?? 0,
            y: props.currentKeychain.y ?? 0,
            z: props.currentKeychain.z ?? 0,
            seed: props.currentKeychain.seed ?? 0,
            wrapped_sticker_id: props.currentKeychain.wrapped_sticker_id ?? null,
            highlight_reel_id: props.currentKeychain.highlight_reel_id ?? null,
        }
        // Fetch wrapped sticker details if exists (optional optimisation: fetch only if not present)
        if (props.currentKeychain.wrapped_sticker_id) {
            // We'll rely on the parent or canvas to handle visual, but for UI preview we might want to fetch.
            // For simplicity, we won't fetch the full sticker object here unless creating a new one.
            // If we really need the preview of the EXISTING sticker, we might need an API call or assume data is sufficient.
        }
    }
})

const fetchWrappedStickerDetails = async (id: number) => {
    if (!id) return
    try {
        // Check if we already have it to avoid refetching
        if (
            state.value.selectedWrappedSticker &&
            Number(state.value.selectedWrappedSticker.id.replace('sticker-', '')) === id
        )
            return

        const response = await $fetch<{ data: APISticker[] }>(`/api/data/stickers?id=sticker-${id}`)

        if (response.data.length > 0 && response.data[0]) {
            state.value.selectedWrappedSticker = response.data[0]
        }
    } catch (error) {
        console.error('Error fetching wrapped sticker details:', error)
    }
}

// Initialize with current keychain if editing
watch(
    () => props.currentKeychain,
    (newKeychain) => {
        if (newKeychain) {
            state.value.customization = {
                x: newKeychain.x ?? 0,
                y: newKeychain.y ?? 0,
                z: newKeychain.z ?? 0,
                seed: newKeychain.seed ?? 0,
                wrapped_sticker_id: newKeychain.wrapped_sticker_id ?? null,
                highlight_reel_id: newKeychain.highlight_reel_id ?? null,
            }

            // Fetch wrapped sticker details if exists and not already loaded or mismatch
            if (newKeychain.wrapped_sticker_id) {
                fetchWrappedStickerDetails(newKeychain.wrapped_sticker_id)
            }
        }
    },
    { immediate: true }
)

// Fetch keychains when modal becomes visible and reset state when closed
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

// Watch for seed changes and reset to 0 for Austin 2025 Highlight charms
watch(
    () => state.value.customization.seed,
    (newSeed) => {
        if (isSeedDisabled.value && newSeed !== 0) {
            state.value.customization.seed = 0
        }
    }
)
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
                <span class="leading-none">{{
                    currentKeychain
                        ? t('modals.keychain.titleEdit') +
                          (weaponName ? ` ${t('common.for')} ${weaponName}` : '')
                        : t('modals.keychain.titleAdd') +
                          (weaponName ? ` ${t('common.for')} ${weaponName}` : '')
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
                <NButton
                    secondary
                    type="error"
                    :disabled="!currentKeychain && !state.selectedItem"
                    @click="handleResetConfig"
                >
                    <template #icon>
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            class="icon icon-tabler icons-tabler-outline icon-tabler-refresh"
                        >
                            <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                            <path d="M20 11a8.1 8.1 0 0 0 -15.5 -2m-.5 -4v4h4" />
                            <path d="M4 13a8.1 8.1 0 0 0 15.5 2m.5 4v-4h-4" />
                        </svg>
                    </template>
                    {{ t('modals.weaponSkin.buttons.reset') }}
                </NButton>
                <NDivider vertical />
                <NInput
                    v-model:value="state.searchQuery"
                    :placeholder="t('modals.keychain.searchPlaceholder') as string"
                    class="w-96"
                />
            </div>
        </template>

        <NSpace vertical size="large" class="-mt-2">
            <!-- Selected Keychain Preview -->
            <div
                v-if="state.selectedItem"
                class="bg-[var(--bg-secondary)] p-4 md:p-6 rounded-lg bg-opacity-50"
            >
                <div class="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-6">
                    <!-- Left side - Image -->
                    <div class="flex flex-col items-center justify-center">
                        <img
                            :src="
                                generateFlatKeychainUrl(
                                    state.selectedItem.name,
                                    state.customization.seed,
                                    state.selectedWrappedSticker?.rarity?.id,
                                    state.customization.wrapped_sticker_id || undefined
                                )
                            "
                            :alt="state.selectedItem.name"
                            class="scale-125 h-40 object-top object-cover"
                        />
                    </div>

                    <!-- Right side - Customization -->
                    <div class="flex flex-col gap-4">
                        <!-- Position Controls -->
                        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            <div>
                                <h4 class="text-xs font-medium mb-1 text-gray-400">
                                    X {{ t('modals.keychain.labels.position') }}
                                </h4>
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
                            <div>
                                <h4 class="text-xs font-medium mb-1 text-gray-400">
                                    Y {{ t('modals.keychain.labels.position') }}
                                </h4>
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
                            <div>
                                <h4 class="text-xs font-medium mb-1 text-gray-400">
                                    Z {{ t('modals.keychain.labels.position') }}
                                </h4>
                                <NInputNumber
                                    v-model:value="state.customization.z"
                                    :min="-100"
                                    :max="100"
                                    :step="0.01"
                                    size="small"
                                    class="w-full"
                                    :input-props="digitOnlyInputProps"
                                />
                            </div>
                            <div v-if="!isStickerSlab && !isHighlightReel">
                                <h4 class="text-xs font-medium mb-1 text-gray-400">
                                    {{ t('modals.keychain.labels.seed') }}
                                </h4>
                                <NInputNumber
                                    v-model:value="state.customization.seed"
                                    :min="0"
                                    :max="100000"
                                    :step="1"
                                    :disabled="isSeedDisabled"
                                    size="small"
                                    class="w-full"
                                    :input-props="digitOnlyInputProps"
                                />
                            </div>

                            <!-- Highlight Reel ID Input -->
                            <div v-if="isHighlightReel">
                                <h4 class="text-xs font-medium mb-1 text-gray-400">Highlight ID</h4>
                                <NInputNumber
                                    v-model:value="state.customization.highlight_reel_id"
                                    :min="0"
                                    size="small"
                                    class="w-full"
                                    :input-props="digitOnlyInputProps"
                                    placeholder="Enter Highlight ID"
                                />
                            </div>

                            <!-- Sticker Slab Controls -->
                            <div
                                v-if="isStickerSlab"
                                class="col-span-2 sm:col-span-4 border-t border-[var(--border-subtle)] pt-3 mt-1"
                            >
                                <h4 class="text-xs font-medium mb-2 text-gray-400">
                                    Wrapped Sticker
                                </h4>

                                <div
                                    v-if="
                                        state.selectedWrappedSticker ||
                                        state.customization.wrapped_sticker_id
                                    "
                                    class="flex items-center gap-3 bg-[var(--bg-dark)] p-2 rounded border border-[var(--border-subtle)]"
                                >
                                    <!-- If we have the object, show image. If only ID (legacy/edit), just show ID/placeholder -->
                                    <!-- Tiny preview removed as per request -->
                                    <div class="flex-1 min-w-0">
                                        <div class="text-sm font-medium truncate text-gray-200">
                                            {{
                                                state.selectedWrappedSticker
                                                    ? state.selectedWrappedSticker.name
                                                    : `Sticker ID: ${state.customization.wrapped_sticker_id}`
                                            }}
                                        </div>
                                    </div>
                                    <NButton
                                        size="tiny"
                                        type="error"
                                        ghost
                                        @click="clearWrappedSticker"
                                        >×</NButton
                                    >
                                </div>

                                <NButton
                                    v-else
                                    block
                                    dashed
                                    size="small"
                                    @click="state.wrappedStickerModalVisible = true"
                                >
                                    + Select Sticker to Wrap
                                </NButton>
                            </div>
                        </div>

                        <!-- Bottom Section: Title and Buttons -->
                        <div
                            class="border-t border-[var(--border-subtle)] pt-4 flex flex-col lg:flex-row items-center justify-between gap-4"
                        >
                            <h3 class="text-lg font-bold text-white">
                                {{ state.selectedItem.name.replace(/^Charm \| /, '') }}
                            </h3>

                            <div class="flex gap-3 w-full lg:w-auto justify-end">
                                <NButton
                                    type="primary"
                                    class="flex-1 lg:flex-none lg:w-40"
                                    secondary
                                    @click="handleSave"
                                >
                                    {{
                                        currentKeychain
                                            ? t('modals.keychain.buttons.update')
                                            : t('modals.keychain.buttons.create')
                                    }}
                                </NButton>
                                <NButton
                                    v-if="currentKeychain"
                                    type="error"
                                    class="flex-1 lg:flex-none lg:w-40"
                                    secondary
                                    @click="handleRemove"
                                >
                                    {{ t('modals.keychain.delete') }}
                                </NButton>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Keychain list controls (Sort + Filters) -->
            <div class="flex flex-wrap items-center justify-between gap-3">
                <div class="flex items-center gap-2">
                    <span class="text-sm text-gray-300">{{ t('modals.sticker.sort.label') }}</span>
                    <NSelect
                        v-model:value="sortBy"
                        size="small"
                        class="w-44"
                        :options="keychainSortOptions"
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
                    <span class="text-sm text-gray-300">{{
                        t('modals.sticker.filters.rarity')
                    }}</span>
                    <NButton
                        v-for="rarity in availableRarities"
                        :key="rarity.id"
                        size="small"
                        secondary
                        :type="rarityFilterIds.includes(rarity.id) ? 'primary' : 'default'"
                        :style="
                            rarityFilterIds.includes(rarity.id)
                                ? { borderColor: rarity.color }
                                : undefined
                        "
                        :aria-label="`Filter by ${rarity.name} rarity`"
                        :aria-pressed="rarityFilterIds.includes(rarity.id)"
                        @click="toggleRarityFilter(rarity.id)"
                    >
                        <span class="flex items-center gap-2">
                            <span
                                class="h-2 w-2 rounded-full"
                                :style="{ background: rarity.color }"
                            />
                            {{ rarity.name }}
                        </span>
                    </NButton>
                </div>
            </div>

            <!-- Keychains Grid -->
            <div
                v-if="!state.isLoading"
                class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4"
            >
                <NCard
                    v-for="item in paginatedItems"
                    :key="item.id"
                    :class="[
                        'cursor-pointer transition-all hover:shadow-lg h-full',
                        state.selectedItem?.id === item.id.replace('keychain-', '')
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
                            :src="generateFlatKeychainUrl(item.name)"
                            :alt="item.name"
                            class="w-full h-24 object-contain mb-2"
                            loading="lazy"
                        />
                        <p class="text-sm text-center break-words">
                            {{ item.name.replace(/^Charm \| /, '') }}
                        </p>
                        <div
                            class="h-1 w-full mt-2"
                            :style="{ background: item.rarity?.color || '#313030' }"
                        />
                    </div>
                </NCard>
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
                {{ t('modals.keychain.noSearchResults') }}
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

    <WrappedStickerModal
        v-model:visible="state.wrappedStickerModalVisible"
        @select="handleSelectWrappedSticker"
    />
</template>

<style scoped>
.n-card {
    background: #242424;
    border: 1px solid #313030;
}
</style>
