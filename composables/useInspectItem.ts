import { ref, computed } from 'vue'
import { IEnhancedItem, WeaponCustomization, KnifeCustomization, GloveCustomization } from '~/server/utils/interfaces'

// Storage keys
const STORAGE_KEY_ITEM = 'cs2inspect-item'
const STORAGE_KEY_CUSTOMIZATION = 'cs2inspect-customization'
const STORAGE_KEY_ITEM_TYPE = 'cs2inspect-item-type'

export function useInspectItem() {
  const inspectedItem = ref<IEnhancedItem | null>(null)
  const itemType = ref<'weapon' | 'knife' | 'glove' | null>(null)
  const customization = ref<WeaponCustomization | KnifeCustomization | GloveCustomization | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Determine if the item is a weapon, knife, or glove based on defindex
  const detectItemType = (defindex: number): 'weapon' | 'knife' | 'glove' => {
    // Knife defindex ranges
    if ((defindex >= 500 && defindex <= 525) || defindex === 42 || defindex === 59) {
      return 'knife'
    }
    // Glove defindex ranges
    else if (defindex >= 5000 && defindex <= 5035) {
      return 'glove'
    }
    // Default to weapon
    return 'weapon'
  }

  // Fetch additional item data (name, image, etc.) based on defindex and paintindex
  const fetchItemData = async (defindex: number, paintindex: number, type: 'weapon' | 'knife' | 'glove'): Promise<any> => {
    try {
      // Determine the endpoint based on item type
      const endpoint = type === 'glove' ? 'gloves' : type === 'knife' ? 'knives' : 'weapons';

      // Fetch item data from the API
      const response = await fetch(`/api/data/${endpoint}?defindex=${defindex}&paintindex=${paintindex}`)

      if (!response.ok) {
        console.warn(`API returned status ${response.status} when fetching ${type} data`)
        return null
      }

      const data = await response.json()

      // Check if the API returned success: false
      if (data.success === false) {
        console.warn(`API returned success: false when fetching ${type} data: ${data.message || 'No error message'}`)
        return null
      }

      return data
    } catch (err) {
      console.error(`Error fetching item data:`, err)
      return null
    }
  }

  // Analyze inspect link to determine item type
  const analyzeInspectLink = async (inspectUrl: string, steamId: string): Promise<void> => {
    isLoading.value = true
    error.value = null

    try {
      // First try as weapon
      const response = await fetch(`/api/weapons/inspect?url=decode-link&steamId=${steamId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'credentials': 'include'
        },
        body: JSON.stringify({ inspectUrl })
      })

      if (!response.ok) {
        throw new Error('Failed to decode inspect link')
      }

      const data = await response.json()

      console.log('Inspect link decoded data:', data)

      if (!data.defindex) {
        throw new Error('Invalid item data: missing defindex')
      }

      // Ensure paintindex is a number
      if (data.paintindex === undefined || data.paintindex === null) {
        data.paintindex = 0
        console.warn('No paintindex found in inspect data, defaulting to 0')
      } else {
        data.paintindex = Number(data.paintindex)
      }

      // Ensure paintseed is a number
      if (data.paintseed === undefined || data.paintseed === null) {
        data.paintseed = 0
        console.warn('No paintseed found in inspect data, defaulting to 0')
      } else {
        data.paintseed = Number(data.paintseed)
      }

      // Ensure paintwear is a number
      if (data.paintwear === undefined || data.paintwear === null) {
        data.paintwear = 0
        console.warn('No paintwear found in inspect data, defaulting to 0')
      } else {
        data.paintwear = Number(data.paintwear)
      }

      // Handle StatTrak information
      // For weapons, killeaterscoretype 0 can still have a StatTrak count
      // For knives, killeaterscoretype 1 indicates StatTrak

      // Check for killeatervalue (StatTrak count) first
      if (data.killeatervalue !== undefined && data.killeatervalue !== null) {
        data.stattrak_count = Number(data.killeatervalue)
        console.log(`StatTrak count: ${data.stattrak_count}`)

        // If there's a StatTrak count > 0, consider it as StatTrak enabled
        if (data.stattrak_count > 0) {
          data.stattrak_enabled = true
        }
      } else {
        data.stattrak_count = 0
      }

      // Check for killeaterscoretype (1 = StatTrak for knives)
      if (data.killeaterscoretype !== undefined && data.killeaterscoretype !== null) {
        // For knives, we need killeaterscoretype to be 1
        const type = detectItemType(data.defindex)
        if (type === 'knife') {
          data.stattrak_enabled = Number(data.killeaterscoretype) === 1
        } else {
          // For weapons, having a killeatervalue > 0 is enough
          data.stattrak_enabled = data.stattrak_enabled || Number(data.killeaterscoretype) > 0
        }
        console.log(`StatTrak enabled: ${data.stattrak_enabled} (killeaterscoretype: ${data.killeaterscoretype})`)
      } else if (data.stattrak_enabled === undefined) {
        data.stattrak_enabled = false
      }

      // Determine item type based on defindex
      const type = detectItemType(data.defindex)
      itemType.value = type

      console.log(`Detected item type: ${type} for defindex ${data.defindex}`)

      // Save item type to storage
      if (process.client) {
        localStorage.setItem(STORAGE_KEY_ITEM_TYPE, type)
      }

      // Fetch additional item data
      const itemData = await fetchItemData(data.defindex, data.paintindex, type)
      console.log('Additional item data:', itemData)

      // Create enhanced item from response
      inspectedItem.value = {
        weapon_defindex: data.defindex,
        defaultName: itemData?.name || `${type.charAt(0).toUpperCase() + type.slice(1)} #${data.defindex}`,
        paintIndex: data.paintindex || 0,
        defaultImage: itemData?.image || '',
        weapon_name: itemData?.name || `${type.charAt(0).toUpperCase() + type.slice(1)} #${data.defindex}`,
        category: itemData?.category || type,
        availableTeams: 'both',
        name: itemData?.name || `${type.charAt(0).toUpperCase() + type.slice(1)} #${data.defindex}`,
        image: itemData?.image || '',
        minFloat: itemData?.min_float || 0,
        maxFloat: itemData?.max_float || 1,
        rarity: itemData?.rarity || { id: '0', name: 'Unknown', color: '#666666' },
        team: null
      }

      // Create appropriate customization based on item type
      if (type === 'weapon') {
        customization.value = {
          active: true,
          statTrak: data.stattrak_enabled || false,
          statTrakCount: data.stattrak_count || 0,
          defindex: data.defindex,
          paintIndex: data.paintindex || 0,
          paintIndexOverride: false,
          pattern: data.paintseed || 0,
          wear: data.paintwear || 0,
          nameTag: data.customname || '',
          stickers: data.stickers || [null, null, null, null, null],
          keychain: data.keychain || null,
          team: 0
        } as WeaponCustomization
      } else if (type === 'knife') {
        customization.value = {
          active: true,
          statTrak: data.stattrak_enabled || false,
          statTrakCount: data.stattrak_count || 0,
          defindex: data.defindex,
          paintIndex: data.paintindex || 0,
          paintIndexOverride: false,
          pattern: data.paintseed || 0,
          wear: data.paintwear || 0,
          nameTag: data.customname || '',
          team: 0
        } as KnifeCustomization
      } else if (type === 'glove') {
        customization.value = {
          active: true,
          defindex: data.defindex,
          paintIndex: data.paintindex || 0,
          paintIndexOverride: false,
          pattern: data.paintseed || 0,
          wear: data.paintwear || 0,
          team: 0
        } as GloveCustomization
      }

      // Save to localStorage
      saveToStorage()

    } catch (err: any) {
      console.error('Error analyzing inspect link:', err)
      error.value = err.message || 'Failed to analyze inspect link'
      clearItem()
    } finally {
      isLoading.value = false
    }
  }

  // Save current item to localStorage
  const saveToStorage = () => {
    if (process.client && inspectedItem.value && customization.value) {
      localStorage.setItem(STORAGE_KEY_ITEM, JSON.stringify(inspectedItem.value))
      localStorage.setItem(STORAGE_KEY_CUSTOMIZATION, JSON.stringify(customization.value))
      localStorage.setItem(STORAGE_KEY_ITEM_TYPE, itemType.value || '')
    }
  }

  // Load item from localStorage
  const loadFromStorage = () => {
    if (process.client) {
      const storedItem = localStorage.getItem(STORAGE_KEY_ITEM)
      const storedCustomization = localStorage.getItem(STORAGE_KEY_CUSTOMIZATION)
      const storedItemType = localStorage.getItem(STORAGE_KEY_ITEM_TYPE)

      if (storedItem && storedCustomization && storedItemType) {
        try {
          inspectedItem.value = JSON.parse(storedItem)
          customization.value = JSON.parse(storedCustomization)
          itemType.value = storedItemType as 'weapon' | 'knife' | 'glove'
        } catch (err) {
          console.error('Error parsing stored item:', err)
          clearItem()
        }
      }
    }
  }

  // Clear current item
  const clearItem = () => {
    inspectedItem.value = null
    customization.value = null
    itemType.value = null

    if (process.client) {
      localStorage.removeItem(STORAGE_KEY_ITEM)
      localStorage.removeItem(STORAGE_KEY_CUSTOMIZATION)
      localStorage.removeItem(STORAGE_KEY_ITEM_TYPE)
    }
  }

  // Update customization and save to storage
  const updateCustomization = (newCustomization: WeaponCustomization | KnifeCustomization | GloveCustomization) => {
    customization.value = newCustomization
    saveToStorage()
  }

  // Update item and save to storage
  const updateItem = (newItem: IEnhancedItem) => {
    inspectedItem.value = newItem
    saveToStorage()
  }

  // Generate inspect link for current item
  const generateInspectLink = async (steamId: string): Promise<string | null> => {
    if (!inspectedItem.value || !customization.value || !itemType.value) {
      return null
    }

    isLoading.value = true

    try {
      const endpoint = itemType.value === 'weapon'
        ? '/api/weapons/inspect'
        : itemType.value === 'knife'
          ? '/api/knifes/inspect'
          : '/api/gloves/inspect'

      const response = await fetch(`${endpoint}?url=create-link&steamId=${steamId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'credentials': 'include'
        },
        body: JSON.stringify({
          defindex: inspectedItem.value.weapon_defindex,
          paintIndex: customization.value.paintIndex,
          pattern: customization.value.pattern,
          wear: customization.value.wear,
          rarity: 0,
          // Add type-specific properties
          ...(itemType.value === 'weapon' || itemType.value === 'knife' ? {
            statTrak: (customization.value as WeaponCustomization | KnifeCustomization).statTrak,
            statTrakCount: (customization.value as WeaponCustomization | KnifeCustomization).statTrakCount,
            nameTag: (customization.value as WeaponCustomization | KnifeCustomization).nameTag
          } : {}),
          // Add stickers and keychain for weapons
          ...(itemType.value === 'weapon' ? {
            stickers: (customization.value as WeaponCustomization).stickers?.map((sticker, index) => {
              if (!sticker) return null;
              return {
                slot: index,
                sticker_id: sticker.id,
                wear: sticker.wear || 0,
                scale: sticker.scale || 1,
                rotation: sticker.rotation || 0,
                offset_x: sticker.x || 0,
                offset_y: sticker.y || 0
              };
            }).filter(Boolean),
            keychain: (customization.value as WeaponCustomization).keychain ? {
              slot: 0,
              sticker_id: (customization.value as WeaponCustomization).keychain?.id,
              offset_x: (customization.value as WeaponCustomization).keychain?.x || 0,
              offset_y: (customization.value as WeaponCustomization).keychain?.y || 0,
              offset_z: (customization.value as WeaponCustomization).keychain?.z || 0,
              pattern: (customization.value as WeaponCustomization).keychain?.seed || 0
            } : null
          } : {})
        })
      })

      if (!response.ok) {
        throw new Error('Failed to generate inspect link')
      }

      const data = await response.json()
      return data.inspectUrl

    } catch (err) {
      console.error('Error generating inspect link:', err)
      return null
    } finally {
      isLoading.value = false
    }
  }

  // Check if we have a valid item
  const hasItem = computed(() => {
    return !!inspectedItem.value && !!customization.value && !!itemType.value
  })

  return {
    inspectedItem,
    itemType,
    customization,
    isLoading,
    error,
    analyzeInspectLink,
    saveToStorage,
    loadFromStorage,
    clearItem,
    updateCustomization,
    updateItem,
    generateInspectLink,
    hasItem
  }
}
