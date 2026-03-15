import type {
  ItemConfiguration,
  WeaponConfiguration,
  KnifeConfiguration,
  GloveConfiguration,
  ItemType,
  AsyncResult,
  APISkin,
  IEnhancedItem,
} from '~/types'

import {
  LoadingState,
  isWeaponConfiguration,
  isKnifeConfiguration,
  toFloatValueClamped,
  isValidFloatValue,
} from '~/types'

/**
 * Raw inspect item data returned from the inspect API
 */
interface InspectItemData {
  defindex: number
  paintindex: number
  paintseed: number
  paintwear: number
  killeatervalue?: number
  killeaterscoretype?: number
  customname?: string
  stattrak_count: number
  stattrak_enabled: boolean
  stickers?: Array<unknown> | null
  keychain?: unknown | null
  [key: string]: unknown
}

/**
 * Storage keys for browser storage
 */
const STORAGE_KEY_ITEM = 'cs2inspect-item'
const STORAGE_KEY_CUSTOMIZATION = 'cs2inspect-customization'
const STORAGE_KEY_ITEM_TYPE = 'cs2inspect-item-type'

/**
 * Composable for handling inspect item functionality
 *
 * @description Provides functionality for analyzing inspect links,
 * fetching item data, and managing item state with proper type safety
 *
 * @returns Object containing reactive state and methods for inspect functionality
 */
export function useInspectItem() {
  // Reactive state with new type system
  const inspectedItem = ref<IEnhancedItem | null>(null)
  const itemType = ref<ItemType | null>(null)
  const customization = ref<ItemConfiguration | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  /**
   * Async result state for better error handling
   */
  const asyncState = computed<AsyncResult>(() => ({
    state: isLoading.value
      ? LoadingState.Loading
      : error.value
        ? LoadingState.Error
        : inspectedItem.value
          ? LoadingState.Success
          : LoadingState.Idle,
    data: inspectedItem.value,
    error: error.value ? { code: 'INSPECT_ERROR', message: error.value } : undefined,
    isLoading: isLoading.value,
    isSuccess: !!inspectedItem.value && !error.value,
    isError: !!error.value,
  }))

  /**
   * Determine item type based on defindex with enhanced type safety
   *
   * @param defindex - Item definition index
   * @returns Item type or null if invalid
   */
  const detectItemType = (defindex: number): ItemType | null => {
    if (!Number.isInteger(defindex) || defindex < 0) {
      return null
    }

    // Knife defindex ranges
    if ((defindex >= 500 && defindex <= 525) || defindex === 42 || defindex === 59) {
      return 'knife'
    }
    // Glove defindex ranges
    else if (defindex >= 5000 && defindex <= 5035) {
      return 'glove'
    }
    // Agent defindex ranges
    else if (defindex >= 5400 && defindex <= 5500) {
      return 'agent'
    }
    // Music kit defindex ranges
    else if (defindex >= 1 && defindex <= 50 && defindex !== 42) {
      return 'musickit'
    }
    // Pin defindex ranges
    else if (defindex >= 6000 && defindex <= 6100) {
      return 'pin'
    }
    // Default to weapon for standard weapon defindex ranges
    else if (defindex >= 1 && defindex <= 500) {
      return 'weapon'
    }

    return 'weapon' // Default fallback
  }

  /**
   * Fetch additional item data based on defindex and paintindex
   *
   * @param defindex - Item definition index
   * @param paintindex - Paint index for skin
   * @param type - Item type for endpoint selection
   * @returns Promise resolving to item data or null if failed
   */
  const fetchItemData = async (
    defindex: number,
    paintindex: number,
    type: ItemType
  ): Promise<unknown> => {
    try {
      // Validate input parameters
      if (!Number.isInteger(defindex) || defindex < 0) {
        throw new Error(`Invalid defindex: ${defindex}`)
      }

      if (!Number.isInteger(paintindex) || paintindex < 0) {
        throw new Error(`Invalid paintindex: ${paintindex}`)
      }

      // Determine the endpoint based on item type
      const endpointMap: Record<ItemType, string> = {
        weapon: 'weapons',
        knife: 'knives',
        glove: 'gloves',
        agent: 'agents',
        musickit: 'musickits',
        pin: 'pins',
      }

      const endpoint = endpointMap[type]
      if (!endpoint) {
        throw new Error(`Unsupported item type: ${type}`)
      }

      // Fetch item data from the API
      const data = await $fetch(
        `/api/data/${endpoint}?defindex=${defindex}&paintindex=${paintindex}`
      )

      // Check if the API returned success: false
      if (data && typeof data === 'object' && 'success' in data && data.success === false) {
        throw new Error(
          `API returned success: false when fetching ${type} data: ${(data as Record<string, unknown>).message || 'No error message'}`
        )
      }

      return data
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch item data'
      return null
    }
  }

  /**
   * Analyze inspect link to determine item type and extract data
   *
   * @param inspectUrl - CS2 inspect link URL
   * @param steamId - User's Steam ID
   * @returns Promise that resolves when analysis is complete
   */
  const analyzeInspectLink = async (inspectUrl: string, steamId: string): Promise<void> => {
    isLoading.value = true
    error.value = null
    inspectedItem.value = null
    customization.value = null
    itemType.value = null

    try {
      // Validate input parameters
      if (!inspectUrl || typeof inspectUrl !== 'string') {
        throw new Error('Invalid inspect URL provided')
      }

      if (!steamId || typeof steamId !== 'string') {
        throw new Error('Invalid Steam ID provided')
      }

      // Try to decode the inspect link
      const responseData = await $fetch<{ item: InspectItemData; message?: string }>(
        `/api/inspect?action=inspect-item&steamId=${steamId}`,
        {
          method: 'POST',
          body: { inspectUrl },
        }
      )

      const data = responseData.item

      // Validate essential data
      if (!data || typeof data !== 'object') {
        throw new Error('Invalid response data from inspect API')
      }

      if (!data.defindex || !Number.isInteger(Number(data.defindex))) {
        throw new Error('Invalid item data: missing or invalid defindex')
      }

      // Normalize and validate numeric data with proper error handling
      const normalizeNumber = (value: unknown, defaultValue: number = 0): number => {
        if (value === undefined || value === null) {
          return defaultValue
        }

        const numValue = Number(value)
        if (isNaN(numValue)) {
          return defaultValue
        }

        return numValue
      }

      // Normalize data fields
      data.defindex = normalizeNumber(data.defindex)
      data.paintindex = normalizeNumber(data.paintindex, 0)
      data.paintseed = normalizeNumber(data.paintseed, 0)
      data.paintwear = normalizeNumber(data.paintwear, 0)

      // Ensure paintwear is within valid range (0-1) using branded type helper
      if (!isValidFloatValue(data.paintwear)) {
        data.paintwear = toFloatValueClamped(data.paintwear)
      }

      // Handle StatTrak information with proper validation
      try {
        data.stattrak_count = normalizeNumber(data.killeatervalue, 0)
        data.stattrak_enabled = false

        // Determine item type first for proper StatTrak handling
        const detectedType = detectItemType(data.defindex)
        if (!detectedType) {
          throw new Error(`Unable to determine item type for defindex: ${data.defindex}`)
        }

        // StatTrak logic varies by item type
        if (detectedType === 'knife') {
          // For knives, killeaterscoretype must be 1 for StatTrak
          const killeaterscoretype = normalizeNumber(data.killeaterscoretype, 0)
          data.stattrak_enabled = killeaterscoretype === 1
        } else if (detectedType === 'weapon') {
          // For weapons, having a StatTrak count > 0 indicates StatTrak
          data.stattrak_enabled = data.stattrak_count > 0
        }
        // Gloves and other items don't support StatTrak

        itemType.value = detectedType

        // Save item type to storage
        if (import.meta.client) {
          try {
            localStorage.setItem(STORAGE_KEY_ITEM_TYPE, detectedType)
          } catch {
            // Storage errors are non-critical
          }
        }
      } catch {
        // Set safe defaults
        data.stattrak_count = 0
        data.stattrak_enabled = false

        // Still try to detect item type
        const fallbackType = detectItemType(data.defindex) || 'weapon'
        itemType.value = fallbackType
      }

      // Fetch additional item data with error handling
      let itemData: APISkin | null = null
      try {
        if (itemType.value) {
          itemData = (await fetchItemData(
            data.defindex,
            data.paintindex,
            itemType.value
          )) as APISkin
        }
      } catch {
        // Continue with basic data
      }

      // Create enhanced item from response with proper fallbacks
      const fallbackName = `${itemType.value?.charAt(0).toUpperCase()}${itemType.value?.slice(1)} #${data.defindex}`

      inspectedItem.value = {
        weapon_defindex: data.defindex,
        defaultName: itemData?.name || fallbackName,
        paintindex: data.paintindex || 0,
        defaultImage: itemData?.image || '',
        weapon_name: itemData?.name || fallbackName,
        category: (itemData?.category || itemType.value || 'unknown') as string,
        availableTeams: 'both',
        name: itemData?.name || fallbackName,
        image: itemData?.image || '',
        minFloat: itemData?.min_float || 0,
        maxFloat: itemData?.max_float || 1,
        rarity: itemData?.rarity || { id: '0', name: 'Unknown', color: '#666666' },
        team: null,
      }

      // Create appropriate customization based on item type using new interfaces
      try {
        if (itemType.value === 'weapon') {
          customization.value = {
            active: true,
            team: 1, // Default to Terrorist team
            defindex: data.defindex,
            paintindex: data.paintindex || 0,
            paintIndexOverride: false,
            paintseed: data.paintseed || 0,
            paintwear: data.paintwear || 0,
            stattrak_enabled: data.stattrak_enabled || false,
            stattrak_count: data.stattrak_count || 0,
            nametag: data.customname || '',
            stickers: data.stickers || [null, null, null, null, null],
            keychain: data.keychain || null,
          } as WeaponConfiguration
        } else if (itemType.value === 'knife') {
          customization.value = {
            active: true,
            team: 1, // Default to Terrorist team
            defindex: data.defindex,
            paintindex: data.paintindex || 0,
            paintIndexOverride: false,
            paintseed: data.paintseed || 0,
            paintwear: data.paintwear || 0,
            stattrak_enabled: data.stattrak_enabled || false,
            stattrak_count: data.stattrak_count || 0,
            nametag: data.customname || '',
          } as KnifeConfiguration
        } else if (itemType.value === 'glove') {
          customization.value = {
            active: true,
            team: 1, // Default to Terrorist team
            defindex: data.defindex,
            paintindex: data.paintindex || 0,
            paintIndexOverride: false,
            paintseed: data.paintseed || 0,
            paintwear: data.paintwear || 0,
          } as GloveConfiguration
        } else {
          // For other item types, create a basic configuration
          customization.value = {
            active: true,
            team: 1,
            defindex: data.defindex,
            paintindex: data.paintindex || 0,
            paintIndexOverride: false,
            paintseed: data.paintseed || 0,
            paintwear: data.paintwear || 0,
          }
        }

        // Save to localStorage
        saveToStorage()
      } catch {
        error.value = 'Failed to create item configuration'
        clearItem()
      }
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Failed to analyze inspect link'
      clearItem()
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Save current item to localStorage with error handling
   */
  const saveToStorage = (): void => {
    if (!import.meta.client) return

    try {
      if (inspectedItem.value && customization.value && itemType.value) {
        localStorage.setItem(STORAGE_KEY_ITEM, JSON.stringify(inspectedItem.value))
        localStorage.setItem(STORAGE_KEY_CUSTOMIZATION, JSON.stringify(customization.value))
        localStorage.setItem(STORAGE_KEY_ITEM_TYPE, itemType.value)
      }
    } catch {
      // Storage errors are non-critical
    }
  }

  /**
   * Load item from localStorage with proper type validation
   */
  const loadFromStorage = (): void => {
    if (!import.meta.client) return

    try {
      const storedItem = localStorage.getItem(STORAGE_KEY_ITEM)
      const storedCustomization = localStorage.getItem(STORAGE_KEY_CUSTOMIZATION)
      const storedItemType = localStorage.getItem(STORAGE_KEY_ITEM_TYPE)

      if (storedItem && storedCustomization && storedItemType) {
        // Validate item type
        const validItemTypes: ItemType[] = ['weapon', 'knife', 'glove', 'agent', 'musickit', 'pin']
        if (!validItemTypes.includes(storedItemType as ItemType)) {
          clearStorage()
          return
        }

        // Parse stored data
        const parsedItem = JSON.parse(storedItem)
        const parsedCustomization = JSON.parse(storedCustomization)

        // Basic validation
        if (!parsedItem || !parsedCustomization) {
          clearStorage()
          return
        }

        // Set values
        inspectedItem.value = parsedItem
        customization.value = parsedCustomization
        itemType.value = storedItemType as ItemType
      }
    } catch {
      clearStorage()
    }
  }

  /**
   * Clear storage data
   */
  const clearStorage = (): void => {
    if (!import.meta.client) return

    try {
      localStorage.removeItem(STORAGE_KEY_ITEM)
      localStorage.removeItem(STORAGE_KEY_CUSTOMIZATION)
      localStorage.removeItem(STORAGE_KEY_ITEM_TYPE)
    } catch {
      // Storage errors are non-critical
    }
  }

  /**
   * Clear current item and reset state
   */
  const clearItem = (): void => {
    inspectedItem.value = null
    customization.value = null
    itemType.value = null
    error.value = null
    clearStorage()
  }

  /**
   * Update customization and save to storage with type safety
   */
  const updateCustomization = (newCustomization: ItemConfiguration): void => {
    try {
      if (!newCustomization) {
        throw new Error('Invalid customization provided')
      }

      customization.value = newCustomization
      saveToStorage()
    } catch {
      error.value = 'Failed to update customization'
    }
  }

  /**
   * Update item and save to storage with validation
   */
  const updateItem = (newItem: IEnhancedItem): void => {
    try {
      if (!newItem || !newItem.weapon_defindex) {
        throw new Error('Invalid item provided')
      }

      inspectedItem.value = newItem
      saveToStorage()
    } catch {
      error.value = 'Failed to update item'
    }
  }

  /**
   * Generate inspect link for current item with enhanced type safety
   */
  const generateInspectLink = async (steamId: string): Promise<string | null> => {
    // Validate prerequisites
    if (!inspectedItem.value || !customization.value || !itemType.value) {
      error.value = 'Missing required data for inspect link generation'
      return null
    }

    if (!steamId || typeof steamId !== 'string') {
      error.value = 'Invalid Steam ID provided'
      return null
    }

    isLoading.value = true
    error.value = null

    try {
      // Build request payload with type-safe property access
      const basePayload = {
        itemType: itemType.value,
        defindex: inspectedItem.value.weapon_defindex,
        paintindex: customization.value.paintindex,
        paintseed: customization.value.paintseed,
        paintwear: customization.value.paintwear,
        rarity: 0,
      }

      // Add type-specific properties with proper type guards
      let typeSpecificPayload = {}

      if (isWeaponConfiguration(customization.value)) {
        typeSpecificPayload = {
          stattrak_enabled: customization.value.stattrak_enabled,
          stattrak_count: customization.value.stattrak_count,
          nametag: customization.value.nametag,
          stickers:
            customization.value.stickers
              ?.map((sticker, index) => {
                if (!sticker) return null
                return {
                  slot: index,
                  sticker_id: sticker.id,
                  wear: sticker.wear || 0,
                  scale: sticker.scale || 1,
                  rotation: sticker.rotation || 0,
                  offset_x: sticker.x || 0,
                  offset_y: sticker.y || 0,
                }
              })
              .filter(Boolean) || [],
          keychain: customization.value.keychain
            ? {
                slot: 0,
                sticker_id: customization.value.keychain.id,
                offset_x: customization.value.keychain.x || 0,
                offset_y: customization.value.keychain.y || 0,
                offset_z: customization.value.keychain.z || 0,
                pattern: customization.value.keychain.seed || 0,
              }
            : null,
        }
      } else if (isKnifeConfiguration(customization.value)) {
        typeSpecificPayload = {
          stattrak_enabled: customization.value.stattrak_enabled,
          stattrak_count: customization.value.stattrak_count,
          nametag: customization.value.nametag,
        }
      }
      // Gloves don't need additional properties

      const data = await $fetch<{ inspectUrl: string; message?: string }>(
        `/api/inspect?action=create-url&steamId=${steamId}`,
        {
          method: 'POST',
          body: {
            ...basePayload,
            ...typeSpecificPayload,
          },
        }
      )

      if (!data.inspectUrl) {
        throw new Error('Invalid response: missing inspect URL')
      }

      return data.inspectUrl
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Failed to generate inspect link'
      return null
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Check if we have a valid item loaded
   */
  const hasItem = computed(() => {
    return !!inspectedItem.value && !!customization.value && !!itemType.value
  })

  /**
   * Check if the current item is of a specific type
   */
  const isItemType = (type: ItemType): boolean => {
    return itemType.value === type
  }

  // Load from storage on initialization
  loadFromStorage()

  return {
    // Reactive state
    inspectedItem,
    itemType,
    customization,
    isLoading,
    error,
    asyncState,

    // Computed properties
    hasItem,

    // Methods
    analyzeInspectLink,
    saveToStorage,
    loadFromStorage,
    clearItem,
    updateCustomization,
    updateItem,
    generateInspectLink,
    isItemType,

    // Type guards are available via direct import from ~/types
  }
}
