// New type system imports
import type {
  ItemConfiguration,
  WeaponConfiguration,
  KnifeConfiguration,
  GloveConfiguration,
  ItemType,
  AsyncResult
} from '~/types'

import {
  LoadingState,
  isWeaponConfiguration,
  isKnifeConfiguration
} from '~/types'

// Legacy imports for backward compatibility
import type { IEnhancedItem } from '~/server/utils/interfaces'

import { ref, computed } from 'vue'

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
    state: isLoading.value ? LoadingState.Loading :
           error.value ? LoadingState.Error :
           inspectedItem.value ? LoadingState.Success : LoadingState.Idle,
    data: inspectedItem.value,
    error: error.value ? { code: 'INSPECT_ERROR', message: error.value } : undefined,
    isLoading: isLoading.value,
    isSuccess: !!inspectedItem.value && !error.value,
    isError: !!error.value
  }))

  /**
   * Determine item type based on defindex with enhanced type safety
   *
   * @param defindex - Item definition index
   * @returns Item type or null if invalid
   */
  const detectItemType = (defindex: number): ItemType | null => {
    try {
      if (!Number.isInteger(defindex) || defindex < 0) {
        console.warn('Invalid defindex provided:', defindex)
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

      console.warn('Unknown defindex range:', defindex)
      return 'weapon' // Default fallback
    } catch (error) {
      console.error('Error detecting item type:', error)
      return null
    }
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
  ): Promise<any> => {
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
        pin: 'pins'
      }

      const endpoint = endpointMap[type]
      if (!endpoint) {
        throw new Error(`Unsupported item type: ${type}`)
      }

      // Fetch item data from the API
      const response = await fetch(`/api/data/${endpoint}?defindex=${defindex}&paintindex=${paintindex}`)

      if (!response.ok) {
        throw new Error(`API returned status ${response.status} when fetching ${type} data`)
      }

      const data = await response.json()

      // Check if the API returned success: false
      if (data.success === false) {
        throw new Error(`API returned success: false when fetching ${type} data: ${data.message || 'No error message'}`)
      }

      return data
    } catch (err) {
      console.error(`Error fetching item data for ${type}:`, err)
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
      const response = await fetch(`/api/weapons/inspect?action=inspect-item&steamId=${steamId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'credentials': 'include'
        },
        body: JSON.stringify({ inspectUrl })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `Failed to decode inspect link (${response.status})`)
      }

      const responseData = await response.json()
      const data = responseData.item

      console.log('Inspect link decoded data:', data)

      // Validate essential data
      if (!data || typeof data !== 'object') {
        throw new Error('Invalid response data from inspect API')
      }

      if (!data.defindex || !Number.isInteger(Number(data.defindex))) {
        throw new Error('Invalid item data: missing or invalid defindex')
      }

      // Normalize and validate numeric data with proper error handling
      const normalizeNumber = (value: any, fieldName: string, defaultValue: number = 0): number => {
        if (value === undefined || value === null) {
          console.warn(`No ${fieldName} found in inspect data, defaulting to ${defaultValue}`)
          return defaultValue
        }

        const numValue = Number(value)
        if (isNaN(numValue)) {
          console.warn(`Invalid ${fieldName} value: ${value}, defaulting to ${defaultValue}`)
          return defaultValue
        }

        return numValue
      }

      // Normalize data fields
      data.defindex = normalizeNumber(data.defindex, 'defindex')
      data.paintindex = normalizeNumber(data.paintindex, 'paintindex', 0)
      data.paintseed = normalizeNumber(data.paintseed, 'paintseed', 0)
      data.paintwear = normalizeNumber(data.paintwear, 'paintwear', 0)

      // Ensure paintwear is within valid range (0-1)
      if (data.paintwear < 0 || data.paintwear > 1) {
        console.warn(`Invalid paintwear value: ${data.paintwear}, clamping to valid range`)
        data.paintwear = Math.max(0, Math.min(1, data.paintwear))
      }

      // Handle StatTrak information with proper validation
      try {
        // Initialize StatTrak data
        data.stattrak_count = normalizeNumber(data.killeatervalue, 'killeatervalue', 0)
        data.stattrak_enabled = false

        console.log(`StatTrak count: ${data.stattrak_count}`)

        // Determine item type first for proper StatTrak handling
        const detectedType = detectItemType(data.defindex)
        if (!detectedType) {
          throw new Error(`Unable to determine item type for defindex: ${data.defindex}`)
        }

        // StatTrak logic varies by item type
        if (detectedType === 'knife') {
          // For knives, killeaterscoretype must be 1 for StatTrak
          const killeaterscoretype = normalizeNumber(data.killeaterscoretype, 'killeaterscoretype', 0)
          data.stattrak_enabled = killeaterscoretype === 1
        } else if (detectedType === 'weapon') {
          // For weapons, having a StatTrak count > 0 indicates StatTrak
          data.stattrak_enabled = data.stattrak_count > 0
        }
        // Gloves and other items don't support StatTrak

        console.log(`StatTrak enabled: ${data.stattrak_enabled} for ${detectedType}`)

        // Set item type
        itemType.value = detectedType
        console.log(`Detected item type: ${detectedType} for defindex ${data.defindex}`)

        // Save item type to storage
        if (import.meta.client) {
          try {
            localStorage.setItem(STORAGE_KEY_ITEM_TYPE, detectedType)
          } catch (storageError) {
            console.warn('Failed to save item type to localStorage:', storageError)
          }
        }
      } catch (statTrakError) {
        console.error('Error processing StatTrak information:', statTrakError)
        // Set safe defaults
        data.stattrak_count = 0
        data.stattrak_enabled = false

        // Still try to detect item type
        const fallbackType = detectItemType(data.defindex) || 'weapon'
        itemType.value = fallbackType
      }

      // Fetch additional item data with error handling
      let itemData = null
      try {
        if (itemType.value) {
          itemData = await fetchItemData(data.defindex, data.paintindex, itemType.value)
          console.log('Additional item data:', itemData)
        }
      } catch (fetchError) {
        console.warn('Failed to fetch additional item data:', fetchError)
        // Continue with basic data
      }

      // Create enhanced item from response with proper fallbacks
      const fallbackName = `${itemType.value?.charAt(0).toUpperCase()}${itemType.value?.slice(1)} #${data.defindex}`

      inspectedItem.value = {
        weapon_defindex: data.defindex,
        defaultName: itemData?.name || fallbackName,
        paintIndex: data.paintindex || 0,
        defaultImage: itemData?.image || '',
        weapon_name: itemData?.name || fallbackName,
        category: itemData?.category || itemType.value || 'unknown',
        availableTeams: 'both',
        name: itemData?.name || fallbackName,
        image: itemData?.image || '',
        minFloat: itemData?.min_float || 0,
        maxFloat: itemData?.max_float || 1,
        rarity: itemData?.rarity || { id: '0', name: 'Unknown', color: '#666666' },
        team: null
      }

      // Create appropriate customization based on item type using new interfaces
      try {
        if (itemType.value === 'weapon') {
          customization.value = {
            active: true,
            team: 1, // Default to Terrorist team
            defindex: data.defindex,
            paintIndex: data.paintindex || 0,
            paintIndexOverride: false,
            pattern: data.paintseed || 0,
            wear: data.paintwear || 0,
            statTrak: data.stattrak_enabled || false,
            statTrakCount: data.stattrak_count || 0,
            nameTag: data.customname || '',
            stickers: data.stickers || [null, null, null, null, null],
            keychain: data.keychain || null
          } as WeaponConfiguration
        } else if (itemType.value === 'knife') {
          customization.value = {
            active: true,
            team: 1, // Default to Terrorist team
            defindex: data.defindex,
            paintIndex: data.paintindex || 0,
            paintIndexOverride: false,
            pattern: data.paintseed || 0,
            wear: data.paintwear || 0,
            statTrak: data.stattrak_enabled || false,
            statTrakCount: data.stattrak_count || 0,
            nameTag: data.customname || ''
          } as KnifeConfiguration
        } else if (itemType.value === 'glove') {
          customization.value = {
            active: true,
            team: 1, // Default to Terrorist team
            defindex: data.defindex,
            paintIndex: data.paintindex || 0,
            paintIndexOverride: false,
            pattern: data.paintseed || 0,
            wear: data.paintwear || 0
          } as GloveConfiguration
        } else {
          // For other item types, create a basic configuration
          customization.value = {
            active: true,
            team: 1,
            defindex: data.defindex,
            paintIndex: data.paintindex || 0,
            paintIndexOverride: false,
            pattern: data.paintseed || 0,
            wear: data.paintwear || 0
          }
        }

        console.log('Created customization for', itemType.value, ':', customization.value)

        // Save to localStorage
        saveToStorage()

      } catch (configError) {
        console.error('Error creating item configuration:', configError)
        error.value = 'Failed to create item configuration'
        clearItem()
      }

    } catch (err: any) {
      console.error('Error analyzing inspect link:', err)
      error.value = err.message || 'Failed to analyze inspect link'
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
        console.log('Item saved to localStorage')
      }
    } catch (storageError) {
      console.error('Error saving to localStorage:', storageError)
      // Don't throw error, just log it
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
          console.warn('Invalid stored item type:', storedItemType)
          clearStorage()
          return
        }

        // Parse stored data
        const parsedItem = JSON.parse(storedItem)
        const parsedCustomization = JSON.parse(storedCustomization)

        // Basic validation
        if (!parsedItem || !parsedCustomization) {
          console.warn('Invalid stored data structure')
          clearStorage()
          return
        }

        // Set values
        inspectedItem.value = parsedItem
        customization.value = parsedCustomization
        itemType.value = storedItemType as ItemType

        console.log('Item loaded from localStorage:', storedItemType)
      }
    } catch (err) {
      console.error('Error loading from localStorage:', err)
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
      console.log('Storage cleared')
    } catch (storageError) {
      console.error('Error clearing storage:', storageError)
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
      console.log('Customization updated')
    } catch (updateError) {
      console.error('Error updating customization:', updateError)
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
      console.log('Item updated')
    } catch (updateError) {
      console.error('Error updating item:', updateError)
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
        paintindex: customization.value.paintIndex,
        paintseed: customization.value.pattern,
        paintwear: customization.value.wear,
        rarity: 0
      }

      // Add type-specific properties with proper type guards
      let typeSpecificPayload = {}

      if (isWeaponConfiguration(customization.value)) {
        typeSpecificPayload = {
          statTrak: customization.value.statTrak,
          statTrakCount: customization.value.statTrakCount,
          nameTag: customization.value.nameTag,
          stickers: customization.value.stickers?.map((sticker, index) => {
            if (!sticker) return null
            return {
              slot: index,
              sticker_id: sticker.id,
              wear: sticker.wear || 0,
              scale: sticker.scale || 1,
              rotation: sticker.rotation || 0,
              offset_x: sticker.x || 0,
              offset_y: sticker.y || 0
            }
          }).filter(Boolean) || [],
          keychain: customization.value.keychain ? {
            slot: 0,
            sticker_id: customization.value.keychain.id,
            offset_x: customization.value.keychain.x || 0,
            offset_y: customization.value.keychain.y || 0,
            offset_z: customization.value.keychain.z || 0,
            pattern: customization.value.keychain.seed || 0
          } : null
        }
      } else if (isKnifeConfiguration(customization.value)) {
        typeSpecificPayload = {
          statTrak: customization.value.statTrak,
          statTrakCount: customization.value.statTrakCount,
          nameTag: customization.value.nameTag
        }
      }
      // Gloves don't need additional properties

      const response = await fetch(`/api/inspect?action=create-url&steamId=${steamId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'credentials': 'include'
        },
        body: JSON.stringify({
          ...basePayload,
          ...typeSpecificPayload
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `Failed to generate inspect link (${response.status})`)
      }

      const data = await response.json()

      if (!data.inspectUrl) {
        throw new Error('Invalid response: missing inspect URL')
      }

      console.log('Inspect link generated successfully')
      return data.inspectUrl

    } catch (err: any) {
      console.error('Error generating inspect link:', err)
      error.value = err.message || 'Failed to generate inspect link'
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
