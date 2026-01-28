/**
 * Business logic interfaces for CS2 items
 * 
 * @description This file contains interfaces for item customization,
 * configuration, and business logic operations. These interfaces represent
 * the application's domain model for CS2 items.
 * 
 * ## Type Safety Strategy
 * 
 * This module uses plain `number` types for component compatibility, while the
 * database layer (records.ts) uses branded types (e.g., `FloatValue`, `StickerId`)
 * for type safety at persistence boundaries.
 * 
 * When interacting with the database, use conversion helpers like:
 * - `toFloatValue(wear)` - Convert wear values
 * - `toStickerSlotIndex(position)` - Convert sticker positions
 * - `toStatTrakCount(count)` - Convert StatTrak counts
 * - `toNameTag(name)` - Convert name tags with validation
 * 
 * @see {@link ../core/branded.ts} for branded type definitions
 * 
 * @version 2.0.0
 * @since 2.0.0
 */

import type {
  EntityId,
  TeamSide,
  TeamAvailability,
  ItemRarity,
  // Branded types imported for JSDoc documentation references
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  Defindex as _Defindex,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  PaintIndex as _PaintIndex,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  PaintSeed as _PaintSeed,
  FloatValue,
  StickerSlotIndex,
  StatTrakCount,
  NameTag,
  NormalizedCoordinate
} from '../core/common'

import type {
  DBWeapon,
  DBKnife,
  DBGlove
} from '../database/records'

// Re-export branded types for convenience
export type {
  FloatValue,
  StickerSlotIndex,
  StatTrakCount,
  NameTag,
  NormalizedCoordinate
}

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
 * @description Common properties for all item configurations.
 * Uses database column names for consistency across the application.
 * Uses plain number types for component compatibility.
 * Branded types are used at the database layer (records.ts) for type safety.
 */
export interface BaseItemConfiguration {
  /** Whether this item is currently active/equipped */
  active: boolean
  /** Team this item belongs to */
  team: TeamSide
  /** Item definition index */
  defindex: number
  /** Paint index for the skin/pattern (matches DB column: paintindex) */
  paintindex: number
  /** Whether paint index is manually overridden (UI-specific, not in DB) */
  paintIndexOverride: boolean
  /** Pattern seed for randomization (matches DB column: paintseed) */
  paintseed: number
  /** Wear value (float between 0 and 1) (matches DB column: paintwear) */
  paintwear: number
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
  /** Internal weapon name identifier used for API calls */
  weapon_name: string
  /** Weapon definition index */
  weapon_defindex: number
  /** Team association (null if available to both teams) - for IEnhanced* compatibility */
  team?: number | null
  /** Paint index for the skin/pattern - for IEnhanced* compatibility */
  paintindex?: number
}

// ============================================================================
// STICKER AND KEYCHAIN INTERFACES
// ============================================================================

/**
 * Sticker configuration for weapons
 *
 * @description Represents a sticker applied to a weapon
 *
 * ## Branded Types
 *
 * When converting to/from database or validating:
 * - `id` → use `toStickerId(Number(id))` for StickerId
 * - `position` → use `toStickerSlotIndex(position)` for StickerSlotIndex (0-4)
 * - `x`, `y` → use `toNormalizedCoordinate(value)` for NormalizedCoordinate (0-1)
 * - `wear` → use `toFloatValue(wear)` for FloatValue (0-1)
 *
 * @example
 * ```typescript
 * const sticker: StickerConfiguration = {
 *   id: 1234, // StickerId from CS2 item definitions
 *   name: "Natus Vincere | Katowice 2014",
 *   image: "https://...",
 *   position: 0, // StickerSlotIndex (0-4)
 *   x: 0.5,      // NormalizedCoordinate
 *   y: 0.5,      // NormalizedCoordinate
 *   wear: 0.0,   // FloatValue
 *   scale: 1.0,
 *   rotation: 0.0
 * }
 * ```
 */
export interface StickerConfiguration {
  /** Sticker identifier - convert to StickerId for type safety */
  id: EntityId | number | string
  /** Sticker name (optional for IEnhancedWeaponSticker compatibility) */
  name?: string
  /** Sticker image URL (optional for IEnhancedWeaponSticker compatibility) */
  image?: string
  /** Position on weapon (0-4) - convert to StickerSlotIndex */
  position: number
  /** X coordinate (0-1) - convert to NormalizedCoordinate */
  x: number
  /** Y coordinate (0-1) - convert to NormalizedCoordinate */
  y: number
  /** Wear value (0-1) - convert to FloatValue */
  wear: number
  /** Scale factor */
  scale: number
  /** Rotation in degrees */
  rotation: number
  /** API Data (optional) */
  api?: {
    name?: string
    image?: string
    rarity?: {
      color?: string
      name?: string
    }
  }
}

/**
 * Keychain configuration for weapons
 *
 * @description Represents a keychain attached to a weapon
 *
 * ## Branded Types
 *
 * When converting to/from database or validating:
 * - `id` → use `toKeychainId(Number(id))` for KeychainId
 * - `wrapped_sticker_id` → use `toStickerId(id)` for StickerId (when present)
 * - `seed` → use `toPaintSeed(seed)` for PaintSeed (same range 0-999)
 *
 * @example
 * ```typescript
 * const keychain: KeychainConfiguration = {
 *   id: 5678,  // KeychainId from CS2 item definitions
 *   name: "Dust II Pin",
 *   image: "https://...",
 *   x: 0.0,
 *   y: 0.0,
 *   z: 0.0,
 *   seed: 123  // PaintSeed (0-999)
 * }
 * ```
 */
export interface KeychainConfiguration {
  /** Keychain identifier - convert to KeychainId for type safety */
  id: EntityId | number | string
  /** Keychain name (optional for IEnhancedWeaponKeychain compatibility) */
  name?: string
  /** Keychain image URL (optional for IEnhancedWeaponKeychain compatibility) */
  image?: string
  /** X coordinate */
  x: number
  /** Y coordinate */
  y: number
  /** Z coordinate */
  z: number
  /** External offset X from Steam (optional) */
  offset_x?: number
  /** External offset Y from Steam (optional) */
  offset_y?: number
  /** External offset Z from Steam (optional) */
  offset_z?: number
  /** Random seed for positioning - convert to PaintSeed (0-999) */
  seed: number
  /** ID of the sticker wrapped inside the charm (for Sticker Slabs) - convert to StickerId */
  wrapped_sticker_id?: number | null
  /** ID of the highlight reel (for Highlight Reel charms) */
  highlight_reel_id?: number | null
  /** API Data (optional) */
  api?: {
    name?: string
    image?: string
    rarity?: {
      color?: string
      name?: string
    }
  }
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
 *   paintindex: 12,
 *   paintIndexOverride: false,
 *   paintseed: 123,
 *   paintwear: 0.15,
 *   stattrak_enabled: true,
 *   stattrak_count: 1337,
 *   nametag: "My AK-47",
 *   stickers: [null, null, null, null, null],
 *   keychain: null
 * }
 * ```
 */
export interface WeaponConfiguration extends BaseItemConfiguration {
  /** Whether StatTrak is enabled (matches DB column: stattrak_enabled) */
  stattrak_enabled: boolean
  /** StatTrak kill count (matches DB column: stattrak_count) */
  stattrak_count: number
  /** Custom name tag (matches DB column: nametag) */
  nametag: string
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
 *   paintindex: 12,
 *   paintIndexOverride: false,
 *   paintseed: 123,
 *   paintwear: 0.15,
 *   stattrak_enabled: true,
 *   stattrak_count: 1337,
 *   nametag: "My Karambit"
 * }
 * ```
 */
export interface KnifeConfiguration extends BaseItemConfiguration {
  /** Whether StatTrak is enabled (matches DB column: stattrak_enabled) */
  stattrak_enabled: boolean
  /** StatTrak kill count (matches DB column: stattrak_count) */
  stattrak_count: number
  /** Custom name tag (matches DB column: nametag) */
  nametag: string
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
 *   paintindex: 10006,
 *   paintIndexOverride: false,
 *   paintseed: 456,
 *   paintwear: 0.25
 * }
 * ```
 */
export type GloveConfiguration = BaseItemConfiguration

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
  return 'stattrak_enabled' in config && 'stickers' in config
}

/**
 * Type guard to check if configuration is for a knife
 */
export function isKnifeConfiguration(config: ItemConfiguration): config is KnifeConfiguration {
  return 'stattrak_enabled' in config && !('stickers' in config)
}

/**
 * Type guard to check if configuration is for gloves
 */
export function isGloveConfiguration(config: ItemConfiguration): config is GloveConfiguration {
  return !('stattrak_enabled' in config)
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

// ============================================================================
// BACKWARD COMPATIBILITY ALIASES (for server/types migration)
// ============================================================================

/**
 * @deprecated Use BaseItemConfiguration instead
 */
export type BaseCustomization = BaseItemConfiguration

/**
 * @deprecated Use StickerConfiguration instead
 */
export type WeaponStickerCustomization = StickerConfiguration

/**
 * @deprecated Use KeychainConfiguration instead
 */
export type WeaponKeychainCustomization = KeychainConfiguration

/**
 * @deprecated Use StickerConfiguration instead
 */
export type StickerCustomization = StickerConfiguration

/**
 * @deprecated Use KeychainConfiguration instead
 */
export type KeychainCustomization = KeychainConfiguration

// Note: IEnhancedWeapon, IEnhancedKnife, IEnhancedGlove, IEnhancedItem are 
// NOT compatible aliases and should be imported from server/types/items.ts
