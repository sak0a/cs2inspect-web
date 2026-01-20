/**
 * useItemModal - Shared composable for item skin modal functionality
 * 
 * Extracts common logic from WeaponSkinModal, GloveSkinModal, and KnifeSkinModal
 * to reduce code duplication and improve maintainability.
 */

import type { APIWeaponSkin } from '~/types'
import { api } from '~/utils/api'

/**
 * Base modal state shared across all item modals
 */
export interface ItemModalState {
    // Loading states
    isLoadingSkins: boolean
    isImporting: boolean
    isLoadingInspect: boolean
    isResetting: boolean
    isDuplicating: boolean

    // UI states
    searchQuery: string
    currentPage: number
    error: string | null

    // Sub-modal visibility
    showImportModal: boolean
    showResetConfirm: boolean
    showDuplicateConfirm: boolean
}

/**
 * API state for skin data
 */
export interface ItemModalApiState {
    skins: APIWeaponSkin[]
    showDetails: boolean
}

/**
 * Options for configuring the useItemModal composable
 */
export interface UseItemModalOptions {
    itemType: 'weapon' | 'knife' | 'glove'
    pageSize?: number
}

/**
 * Create a reusable item modal composable
 * 
 * @param options - Configuration options
 * @returns Reactive state and utility functions for item modals
 */
export function useItemModal(options: UseItemModalOptions) {
    const { itemType, pageSize = 10 } = options

    // Base modal state
    const state = ref<ItemModalState>({
        isLoadingSkins: false,
        isImporting: false,
        isLoadingInspect: false,
        isResetting: false,
        isDuplicating: false,
        searchQuery: '',
        currentPage: 1,
        error: null,
        showImportModal: false,
        showResetConfirm: false,
        showDuplicateConfirm: false
    })

    // API state for skin data
    const apiState = ref<ItemModalApiState>({
        skins: [],
        showDetails: false
    })

    const PAGE_SIZE = ref(pageSize)

    // ============================================================================
    // Computed Properties - Filtering and Pagination
    // ============================================================================

    /**
     * Filter skins by search query
     */
    const filteredSkins = computed(() => {
        const query = state.value.searchQuery.toLowerCase()
        if (!query) return apiState.value.skins

        return apiState.value.skins.filter(skin =>
            skin.name.toLowerCase().includes(query)
        )
    })

    /**
     * Paginated skins for current page
     */
    const paginatedSkins = computed(() => {
        const start = (state.value.currentPage - 1) * PAGE_SIZE.value
        const end = start + PAGE_SIZE.value
        return filteredSkins.value.slice(start, end)
    })

    /**
     * Total number of pages based on filtered results
     */
    const totalPages = computed(() =>
        Math.ceil(filteredSkins.value.length / PAGE_SIZE.value)
    )

    // ============================================================================
    // Methods - Core Functionality
    // ============================================================================

    /**
     * Fetch available skins for the given item
     * 
     * @param itemName - Name of the item (weapon_name from props)
     * @param onError - Optional error callback
     */
    async function fetchSkins(itemName: string, onError?: (error: string) => void) {
        if (!itemName) {
            console.warn(`useItemModal(${itemType}): No item name provided for skin fetching`)
            return
        }

        try {
            state.value.isLoadingSkins = true
            state.value.error = null

            console.log(`useItemModal(${itemType}): Fetching skins for:`, itemName)

            const response = await api.get<{ skins: APIWeaponSkin[] }>('/api/data/skins', {
                weapon: itemName
            })

            // Handle both old and new API response formats
            const skins = response.data?.skins || (Array.isArray(response.data) ? response.data : [])
            apiState.value.skins = skins

            if (skins.length === 0) {
                console.warn(`useItemModal(${itemType}): No skins found for:`, itemName)
                state.value.error = `No skins available for ${itemName}`
            } else {
                console.log(`useItemModal(${itemType}): Successfully loaded ${skins.length} skins`)
            }

            // Adjust current page if needed
            adjustCurrentPage()
        } catch (error) {
            console.error(`useItemModal(${itemType}): Error fetching skins:`, error)
            const errorMessage = error instanceof Error ? error.message : 'Failed to fetch skins'
            state.value.error = errorMessage
            onError?.(errorMessage)
        } finally {
            state.value.isLoadingSkins = false
        }
    }

    /**
     * Adjust current page if it exceeds available pages
     */
    function adjustCurrentPage() {
        const newTotalPages = totalPages.value
        if (state.value.currentPage > newTotalPages && newTotalPages > 0) {
            state.value.currentPage = newTotalPages
        }
    }

    /**
     * Reset search and pagination state
     */
    function resetSearchState() {
        state.value.searchQuery = ''
        state.value.currentPage = 1
    }

    /**
     * Clear all modal state (useful when closing modal)
     */
    function clearState() {
        state.value = {
            isLoadingSkins: false,
            isImporting: false,
            isLoadingInspect: false,
            isResetting: false,
            isDuplicating: false,
            searchQuery: '',
            currentPage: 1,
            error: null,
            showImportModal: false,
            showResetConfirm: false,
            showDuplicateConfirm: false
        }
        apiState.value.skins = []
    }

    // ============================================================================
    // Watchers
    // ============================================================================

    /**
     * Watch search query to reset pagination
     */
    watch(() => state.value.searchQuery, () => {
        const newTotalPages = totalPages.value
        if (state.value.currentPage > newTotalPages && newTotalPages > 0) {
            state.value.currentPage = newTotalPages
        } else if (newTotalPages > 0) {
            state.value.currentPage = 1
        }
    })

    // ============================================================================
    // Return Public API
    // ============================================================================

    return {
        // State
        state,
        apiState,
        PAGE_SIZE,

        // Computed
        filteredSkins,
        paginatedSkins,
        totalPages,

        // Methods
        fetchSkins,
        adjustCurrentPage,
        resetSearchState,
        clearState
    }
}
