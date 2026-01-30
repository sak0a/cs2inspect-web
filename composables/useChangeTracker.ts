/**
 * useChangeTracker - Composable for detecting changes between item configurations
 *
 * @description Compares two item configuration states and identifies what changed.
 * Used for generating descriptive change logs for the version history feature.
 *
 * @version 1.0.0
 * @since 2.0.0
 */

import type {
  WeaponConfiguration,
  KnifeConfiguration,
  GloveConfiguration,
  StickerConfiguration,
  KeychainConfiguration
} from '~/types'
import type { ChangeType, ItemHistorySnapshot } from '~/server/database/schema/itemHistory'

// ============================================================================
// TYPES
// ============================================================================

/**
 * A detected change between two states
 */
export interface DetectedChange {
  type: ChangeType
  description: string
}

/**
 * Configuration types we can compare
 */
export type TrackedConfiguration = WeaponConfiguration | KnifeConfiguration | GloveConfiguration

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Check if two values are deeply equal
 */
function _deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true
  if (a === null || b === null) return a === b
  if (typeof a !== 'object' || typeof b !== 'object') return false

  const keysA = Object.keys(a as object)
  const keysB = Object.keys(b as object)

  if (keysA.length !== keysB.length) return false

  for (const key of keysA) {
    if (!keysB.includes(key)) return false
    if (!_deepEqual((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key])) {
      return false
    }
  }

  return true
}

/**
 * Check if a configuration has stickers (is a weapon configuration)
 */
function hasStickers(config: TrackedConfiguration): config is WeaponConfiguration {
  return 'stickers' in config && Array.isArray((config as WeaponConfiguration).stickers)
}

/**
 * Check if a configuration has keychain (is a weapon configuration)
 */
function hasKeychain(config: TrackedConfiguration): config is WeaponConfiguration {
  return 'keychain' in config
}

/**
 * Check if a configuration has StatTrak (weapon or knife)
 */
function hasStatTrak(config: TrackedConfiguration): config is WeaponConfiguration | KnifeConfiguration {
  return 'stattrak_enabled' in config
}

/**
 * Check if a configuration has nametag (weapon or knife)
 */
function hasNameTag(config: TrackedConfiguration): config is WeaponConfiguration | KnifeConfiguration {
  return 'nametag' in config
}

// ============================================================================
// CHANGE DETECTION
// ============================================================================

/**
 * Compare two sticker configurations
 */
function compareStickerConfigs(
  oldSticker: StickerConfiguration | null,
  newSticker: StickerConfiguration | null,
  slotIndex: number
): DetectedChange | null {
  // Sticker added
  if (!oldSticker && newSticker) {
    return {
      type: 'sticker_added',
      description: `Added sticker to slot ${slotIndex + 1}`
    }
  }

  // Sticker removed
  if (oldSticker && !newSticker) {
    return {
      type: 'sticker_removed',
      description: `Removed sticker from slot ${slotIndex + 1}`
    }
  }

  // Sticker modified
  if (oldSticker && newSticker) {
    if (oldSticker.id !== newSticker.id) {
      return {
        type: 'sticker_modified',
        description: `Changed sticker in slot ${slotIndex + 1}`
      }
    }

    // Check for position/attribute changes
    const positionChanged = oldSticker.x !== newSticker.x ||
      oldSticker.y !== newSticker.y ||
      oldSticker.scale !== newSticker.scale ||
      oldSticker.rotation !== newSticker.rotation ||
      oldSticker.wear !== newSticker.wear

    if (positionChanged) {
      return {
        type: 'sticker_modified',
        description: `Modified sticker attributes in slot ${slotIndex + 1}`
      }
    }
  }

  return null
}

/**
 * Compare two keychain configurations
 */
function compareKeychainConfigs(
  oldKeychain: KeychainConfiguration | null | undefined,
  newKeychain: KeychainConfiguration | null | undefined
): DetectedChange | null {
  // Keychain added
  if (!oldKeychain && newKeychain) {
    return {
      type: 'keychain_added',
      description: 'Added keychain'
    }
  }

  // Keychain removed
  if (oldKeychain && !newKeychain) {
    return {
      type: 'keychain_removed',
      description: 'Removed keychain'
    }
  }

  // Keychain modified
  if (oldKeychain && newKeychain) {
    if (oldKeychain.id !== newKeychain.id) {
      return {
        type: 'keychain_modified',
        description: 'Changed keychain'
      }
    }

    // Check for position changes
    const positionChanged = oldKeychain.x !== newKeychain.x ||
      oldKeychain.y !== newKeychain.y ||
      oldKeychain.z !== newKeychain.z ||
      oldKeychain.seed !== newKeychain.seed

    if (positionChanged) {
      return {
        type: 'keychain_modified',
        description: 'Modified keychain position'
      }
    }
  }

  return null
}

// ============================================================================
// MAIN COMPOSABLE
// ============================================================================

/**
 * Create a change tracker instance
 */
export function useChangeTracker() {
  /**
   * Detect all changes between two configuration states
   */
  function detectChanges(
    oldState: TrackedConfiguration | ItemHistorySnapshot | null,
    newState: TrackedConfiguration
  ): DetectedChange[] {
    const changes: DetectedChange[] = []

    // If no old state, this is an initial save
    if (!oldState) {
      return [{
        type: 'initial_save',
        description: 'Initial configuration saved'
      }]
    }

    // Check paint index change
    if (oldState.paintindex !== newState.paintindex) {
      changes.push({
        type: 'paint_changed',
        description: `Changed skin from paint ${oldState.paintindex} to ${newState.paintindex}`
      })
    }

    // Check wear change
    if (oldState.paintwear !== newState.paintwear) {
      const oldWear = Number(oldState.paintwear).toFixed(4)
      const newWear = Number(newState.paintwear).toFixed(4)
      changes.push({
        type: 'wear_changed',
        description: `Changed wear from ${oldWear} to ${newWear}`
      })
    }

    // Check pattern/seed change
    if (oldState.paintseed !== newState.paintseed) {
      changes.push({
        type: 'pattern_changed',
        description: `Changed pattern seed from ${oldState.paintseed} to ${newState.paintseed}`
      })
    }

    // Check active toggle
    if ('active' in oldState && 'active' in newState && oldState.active !== newState.active) {
      changes.push({
        type: 'active_toggled',
        description: newState.active ? 'Activated item' : 'Deactivated item'
      })
    }

    // Check StatTrak changes (for weapons and knives)
    if (hasStatTrak(newState)) {
      const oldStatTrak = oldState as { stattrak_enabled?: boolean; stattrak_count?: number }

      if (oldStatTrak.stattrak_enabled !== newState.stattrak_enabled) {
        changes.push({
          type: 'stattrak_toggled',
          description: newState.stattrak_enabled ? 'Enabled StatTrak' : 'Disabled StatTrak'
        })
      }

      if (oldStatTrak.stattrak_count !== newState.stattrak_count) {
        changes.push({
          type: 'stattrak_count_changed',
          description: `Changed StatTrak count to ${newState.stattrak_count}`
        })
      }
    }

    // Check nametag changes (for weapons and knives)
    if (hasNameTag(newState)) {
      const oldNameTag = (oldState as { nametag?: string }).nametag || ''
      const newNameTag = newState.nametag || ''

      if (oldNameTag !== newNameTag) {
        if (!oldNameTag && newNameTag) {
          changes.push({
            type: 'nametag_changed',
            description: `Added name tag: "${newNameTag}"`
          })
        } else if (oldNameTag && !newNameTag) {
          changes.push({
            type: 'nametag_changed',
            description: 'Removed name tag'
          })
        } else {
          changes.push({
            type: 'nametag_changed',
            description: `Changed name tag to "${newNameTag}"`
          })
        }
      }
    }

    // Check sticker changes (for weapons only)
    if (hasStickers(newState)) {
      const oldStickers = (oldState as { stickers?: Array<StickerConfiguration | null> }).stickers || []

      for (let i = 0; i < 5; i++) {
        const stickerChange = compareStickerConfigs(
          oldStickers[i] || null,
          newState.stickers[i] || null,
          i
        )
        if (stickerChange) {
          changes.push(stickerChange)
        }
      }
    }

    // Check keychain changes (for weapons only)
    if (hasKeychain(newState)) {
      const oldKeychain = (oldState as { keychain?: KeychainConfiguration | null }).keychain
      const keychainChange = compareKeychainConfigs(oldKeychain, newState.keychain)
      if (keychainChange) {
        changes.push(keychainChange)
      }
    }

    return changes
  }

  /**
   * Get the primary change type when there are multiple changes
   */
  function getPrimaryChangeType(changes: DetectedChange[]): ChangeType {
    if (changes.length === 0) return 'multiple_changes'
    const firstChange = changes[0]
    if (changes.length === 1 && firstChange) return firstChange.type

    // If there are multiple changes, return 'multiple_changes'
    return 'multiple_changes'
  }

  /**
   * Create a combined description of all changes
   */
  function getCombinedDescription(changes: DetectedChange[]): string {
    if (changes.length === 0) return 'No changes detected'
    const firstChange = changes[0]
    if (changes.length === 1 && firstChange) return firstChange.description

    // Combine up to 3 changes
    const descriptions = changes.slice(0, 3).map(c => c.description)
    if (changes.length > 3) {
      descriptions.push(`and ${changes.length - 3} more changes`)
    }
    return descriptions.join('; ')
  }

  /**
   * Convert a configuration to a snapshot for storage
   */
  function configToSnapshot(config: TrackedConfiguration): ItemHistorySnapshot {
    const snapshot: ItemHistorySnapshot = {
      paintindex: config.paintindex,
      paintseed: config.paintseed,
      paintwear: config.paintwear,
      active: config.active
    }

    if (hasStatTrak(config)) {
      snapshot.stattrak_enabled = config.stattrak_enabled
      snapshot.stattrak_count = config.stattrak_count
    }

    if (hasNameTag(config)) {
      snapshot.nametag = config.nametag
    }

    if (hasStickers(config)) {
      snapshot.stickers = config.stickers.map(s => {
        if (!s) return null
        return {
          id: Number(s.id),
          x: s.x,
          y: s.y,
          wear: s.wear,
          scale: s.scale,
          rotation: s.rotation
        }
      })
    }

    if (hasKeychain(config) && config.keychain) {
      snapshot.keychain = {
        id: Number(config.keychain.id),
        x: config.keychain.x,
        y: config.keychain.y,
        z: config.keychain.z,
        seed: config.keychain.seed,
        wrapped_sticker_id: config.keychain.wrapped_sticker_id,
        highlight_reel_id: config.keychain.highlight_reel_id
      }
    }

    return snapshot
  }

  return {
    detectChanges,
    getPrimaryChangeType,
    getCombinedDescription,
    configToSnapshot
  }
}

// ============================================================================
// STANDALONE FUNCTIONS (for server-side use)
// ============================================================================

export const detectChanges = useChangeTracker().detectChanges
export const getPrimaryChangeType = useChangeTracker().getPrimaryChangeType
export const getCombinedDescription = useChangeTracker().getCombinedDescription
export const configToSnapshot = useChangeTracker().configToSnapshot
