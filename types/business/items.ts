/**
 * Business logic interfaces for CS2 items
 * 
 * @description This file contains interfaces for item customization,
 * configuration, and business logic operations. These interfaces represent
 * the application's domain model for CS2 items.
 * 
 * @version 2.0.0
 * @since 2.0.0
 */

import type { 
  EntityId, 
  TeamSide, 
  TeamAvailability, 
  ItemRarity 
} from '../core/common'

import type { 
  APIWeaponSkin, 
  APISticker, 
  APIKeychain 
} from '../api/items'

import type { 
  DBWeapon, 
  DBKnife, 
  DBGlove 
} from '../database/records'

// ============================================================================
// ITEM TYPE DEFINITIONS
// ============================================================================

/**
 * Supported item types in the application
 */
export type ItemType = 'weapon' | 'knife' | 'glove' | 'agent' | 'musickit' | 'pin'

/**
 * Weapon categories
 */
export type WeaponCategory = 'rifles' | 'pistols' | 'smgs' | 'heavys'

// ============================================================================
// BASE ITEM INTERFACES
// ============================================================================

/**
 * Base item configuration interface
 * 
 * @description Common properties for all item configurations
 */
export interface BaseItemConfiguration {
  /** Whether this item is currently active/equipped */
  active: boolean
  /** Team this item belongs to */
  team: TeamSide
  /** Item definition index */
  defindex: number
  /** Paint index for the skin/pattern */
  paintIndex: number
  /** Whether paint index is manually overridden */
  paintIndexOverride: boolean
  /** Pattern seed for randomization */
  pattern: number
  /** Wear value (float between 0 and 1) */
  wear: number
  /** Whether to reset this item to defaults */
  reset?: boolean
}

/**
 * Base item data interface
 * 
 * @description Common properties for all item data structures
 */
export interface BaseItemData {
  /** Item type discriminator */
  type: ItemType
  /** Unique identifier */
  id: EntityId
  /** Display name */
  name: string
  /** Default/fallback name */
  defaultName: string
  /** Current image URL */
  image: string
  /** Default/fallback image URL */
  defaultImage: string
  /** Internal item name identifier */
  itemName: string
  /** Item category */
  category: string
  /** Teams that can use this item */
  availableTeams: TeamAvailability
}

// ============================================================================
// STICKER AND KEYCHAIN INTERFACES
// ============================================================================

/**
 * Sticker configuration for weapons
 * 
 * @description Represents a sticker applied to a weapon
 * 
 * @example
 * ```typescript
 * const sticker: StickerConfiguration = {
 *   id: "sticker_123",
 *   name: "Natus Vincere | Katowice 2014",
 *   image: "https://...",
 *   position: 0,
 *   x: 0.5,
 *   y: 0.5,
 *   wear: 0.0,
 *   scale: 1.0,
 *   rotation: 0.0
 * }
 * ```
 */
export interface StickerConfiguration {
  /** Sticker identifier */
  id: EntityId
  /** Sticker name */
  name: string
  /** Sticker image URL */
  image: string
  /** Position on weapon (0-4) */
  position: number
  /** X coordinate (0-1) */
  x: number
  /** Y coordinate (0-1) */
  y: number
  /** Wear value (0-1) */
  wear: number
  /** Scale factor */
  scale: number
  /** Rotation in degrees */
  rotation: number
}

/**
 * Keychain configuration for weapons
 * 
 * @description Represents a keychain attached to a weapon
 * 
 * @example
 * ```typescript
 * const keychain: KeychainConfiguration = {
 *   id: "keychain_123",
 *   name: "Dust II Pin",
 *   image: "https://...",
 *   x: 0.0,
 *   y: 0.0,
 *   z: 0.0,
 *   seed: 123
 * }
 * ```
 */
export interface KeychainConfiguration {
  /** Keychain identifier */
  id: EntityId
  /** Keychain name */
  name: string
  /** Keychain image URL */
  image: string
  /** X coordinate */
  x: number
  /** Y coordinate */
  y: number
  /** Z coordinate */
  z: number
  /** Random seed for positioning */
  seed: number
}

// ============================================================================
// WEAPON INTERFACES
// ============================================================================

/**
 * Weapon item data
 * 
 * @description Represents weapon data with API and database information
 */
export interface WeaponItemData extends BaseItemData {
  type: 'weapon'
  /** Weapon category */
  category: WeaponCategory
  /** Minimum float value for wear */
  minFloat: number
  /** Maximum float value for wear */
  maxFloat: number
  /** Rarity information if available */
  rarity?: ItemRarity
  /** Database information if item is saved */
  databaseInfo?: DBWeapon
}

/**
 * Weapon configuration
 * 
 * @description Complete weapon customization configuration
 * 
 * @example
 * ```typescript
 * const config: WeaponConfiguration = {
 *   active: true,
 *   team: TeamSide.Terrorist,
 *   defindex: 7,
 *   paintIndex: 12,
 *   paintIndexOverride: false,
 *   pattern: 123,
 *   wear: 0.15,
 *   statTrak: true,
 *   statTrakCount: 1337,
 *   nameTag: "My AK-47",
 *   stickers: [null, null, null, null, null],
 *   keychain: null
 * }
 * ```
 */
export interface WeaponConfiguration extends BaseItemConfiguration {
  /** Whether StatTrak is enabled */
  statTrak: boolean
  /** StatTrak kill count */
  statTrakCount: number
  /** Custom name tag */
  nameTag: string
  /** Sticker configurations (5 positions, null if empty) */
  stickers: Array<StickerConfiguration | null>
  /** Keychain configuration (null if none) */
  keychain: KeychainConfiguration | null
}

// ============================================================================
// KNIFE INTERFACES
// ============================================================================

/**
 * Knife item data
 * 
 * @description Represents knife data with API and database information
 */
export interface KnifeItemData extends BaseItemData {
  type: 'knife'
  /** Minimum float value for wear */
  minFloat: number
  /** Maximum float value for wear */
  maxFloat: number
  /** Rarity information if available */
  rarity?: ItemRarity
  /** Database information if item is saved */
  databaseInfo?: DBKnife
}

/**
 * Knife configuration
 * 
 * @description Complete knife customization configuration
 * 
 * @example
 * ```typescript
 * const config: KnifeConfiguration = {
 *   active: true,
 *   team: TeamSide.Terrorist,
 *   defindex: 500,
 *   paintIndex: 12,
 *   paintIndexOverride: false,
 *   pattern: 123,
 *   wear: 0.15,
 *   statTrak: true,
 *   statTrakCount: 1337,
 *   nameTag: "My Karambit"
 * }
 * ```
 */
export interface KnifeConfiguration extends BaseItemConfiguration {
  /** Whether StatTrak is enabled */
  statTrak: boolean
  /** StatTrak kill count */
  statTrakCount: number
  /** Custom name tag */
  nameTag: string
}

// ============================================================================
// GLOVE INTERFACES
// ============================================================================

/**
 * Glove item data
 * 
 * @description Represents glove data with API and database information
 */
export interface GloveItemData extends BaseItemData {
  type: 'glove'
  /** Minimum float value for wear */
  minFloat: number
  /** Maximum float value for wear */
  maxFloat: number
  /** Rarity information if available */
  rarity?: ItemRarity
  /** Database information if item is saved */
  databaseInfo?: DBGlove
}

/**
 * Glove configuration
 * 
 * @description Complete glove customization configuration
 * 
 * @example
 * ```typescript
 * const config: GloveConfiguration = {
 *   active: true,
 *   team: TeamSide.Terrorist,
 *   defindex: 5000,
 *   paintIndex: 10006,
 *   paintIndexOverride: false,
 *   pattern: 456,
 *   wear: 0.25
 * }
 * ```
 */
export interface GloveConfiguration extends BaseItemConfiguration {
  // Gloves only use base configuration properties
  // No StatTrak, name tags, stickers, or keychains
}

// ============================================================================
// UNION TYPES AND TYPE MAPS
// ============================================================================

/**
 * Union type of all item data types
 */
export type ItemData = WeaponItemData | KnifeItemData | GloveItemData

/**
 * Union type of all item configuration types
 */
export type ItemConfiguration = WeaponConfiguration | KnifeConfiguration | GloveConfiguration

/**
 * Type-safe mapping of item types to their data interfaces
 */
export type ItemDataMap = {
  weapon: WeaponItemData
  knife: KnifeItemData
  glove: GloveItemData
}

/**
 * Type-safe mapping of item types to their configuration interfaces
 */
export type ItemConfigurationMap = {
  weapon: WeaponConfiguration
  knife: KnifeConfiguration
  glove: GloveConfiguration
}

// ============================================================================
// TYPE GUARDS
// ============================================================================

/**
 * Type guard to check if item data is for a weapon
 */
export function isWeaponItemData(item: ItemData): item is WeaponItemData {
  return item.type === 'weapon'
}

/**
 * Type guard to check if item data is for a knife
 */
export function isKnifeItemData(item: ItemData): item is KnifeItemData {
  return item.type === 'knife'
}

/**
 * Type guard to check if item data is for gloves
 */
export function isGloveItemData(item: ItemData): item is GloveItemData {
  return item.type === 'glove'
}

/**
 * Type guard to check if configuration is for a weapon
 */
export function isWeaponConfiguration(config: ItemConfiguration): config is WeaponConfiguration {
  return 'statTrak' in config && 'stickers' in config
}

/**
 * Type guard to check if configuration is for a knife
 */
export function isKnifeConfiguration(config: ItemConfiguration): config is KnifeConfiguration {
  return 'statTrak' in config && !('stickers' in config)
}

/**
 * Type guard to check if configuration is for gloves
 */
export function isGloveConfiguration(config: ItemConfiguration): config is GloveConfiguration {
  return !('statTrak' in config)
}

// ============================================================================
// UTILITY INTERFACES
// ============================================================================

/**
 * Item type configuration
 * 
 * @description Defines what features are available for each item type
 */
export interface ItemTypeConfiguration {
  /** Whether this item type supports StatTrak */
  hasStatTrak: boolean
  /** Whether this item type supports name tags */
  hasNameTag: boolean
  /** Whether this item type supports stickers */
  hasStickers: boolean
  /** Whether this item type supports keychains */
  hasKeychain: boolean
  /** Maximum number of sticker positions */
  maxStickers: number
}

/**
 * Item type configuration mapping
 */
export const ITEM_TYPE_CONFIG: Record<ItemType, ItemTypeConfiguration> = {
  weapon: {
    hasStatTrak: true,
    hasNameTag: true,
    hasStickers: true,
    hasKeychain: true,
    maxStickers: 5
  },
  knife: {
    hasStatTrak: true,
    hasNameTag: true,
    hasStickers: false,
    hasKeychain: false,
    maxStickers: 0
  },
  glove: {
    hasStatTrak: false,
    hasNameTag: false,
    hasStickers: false,
    hasKeychain: false,
    maxStickers: 0
  },
  agent: {
    hasStatTrak: false,
    hasNameTag: false,
    hasStickers: false,
    hasKeychain: false,
    maxStickers: 0
  },
  musickit: {
    hasStatTrak: false,
    hasNameTag: false,
    hasStickers: false,
    hasKeychain: false,
    maxStickers: 0
  },
  pin: {
    hasStatTrak: false,
    hasNameTag: false,
    hasStickers: false,
    hasKeychain: false,
    maxStickers: 0
  }
}
