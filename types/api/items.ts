/**
 * CS2 item interfaces from external APIs
 * 
 * @description This file contains interfaces for CS2 items as received from
 * external APIs (CS2 API, Steam API, etc.). These interfaces represent the
 * raw data structure before any application-specific processing.
 * 
 * @version 2.0.0
 * @since 2.0.0
 */

import type { EntityId, ItemRarity } from '../core/common'

// ============================================================================
// BASE ITEM INTERFACES
// ============================================================================

/**
 * Team information for CS2 items
 * 
 * @description Represents team-specific information for items like agents
 */
export interface APIItemTeam {
  /** Unique identifier for the team */
  id: string
  /** Display name of the team */
  name: string
}

/**
 * Base interface for all CS2 API items
 * 
 * @description Contains common fields shared across all item types from the CS2 API
 */
export interface APIBaseItem {
  /** Unique identifier for the item */
  id: EntityId
  /** Display name of the item */
  name: string
  /** Optional description text */
  description?: string
  /** Rarity information for this item */
  rarity: ItemRarity
  /** URL to the item's image */
  image: string
  /** Steam market hash name for trading */
  market_hash_name?: string
}

// ============================================================================
// WEAPON SKIN INTERFACES
// ============================================================================

/**
 * Weapon information from CS2 API
 * 
 * @description Represents weapon metadata from the CS2 API
 */
export interface APIWeaponInfo {
  /** Weapon identifier */
  id: string
  /** Weapon display name */
  name: string
  /** Internal weapon identifier */
  weapon_id: string
}

/**
 * Weapon category information
 * 
 * @description Represents weapon category (rifles, pistols, etc.)
 */
export interface APIWeaponCategory {
  /** Category identifier */
  id: string
  /** Category display name */
  name: string
}

/**
 * Skin pattern information
 * 
 * @description Represents skin pattern/finish information
 */
export interface APISkinPattern {
  /** Pattern identifier */
  id: string
  /** Pattern display name */
  name: string
}

/**
 * Weapon skin from CS2 API
 * 
 * @description Represents a weapon skin as received from the CS2 API
 * 
 * @example
 * ```typescript
 * const skin: APIWeaponSkin = {
 *   id: "skin_123",
 *   name: "AK-47 | Redline",
 *   description: "A classic red and black design",
 *   weapon: {
 *     id: "weapon_ak47",
 *     name: "AK-47",
 *     weapon_id: "ak47"
 *   },
 *   category: {
 *     id: "rifles",
 *     name: "Rifles"
 *   },
 *   pattern: {
 *     id: "pattern_redline",
 *     name: "Redline"
 *   },
 *   min_float: 0.10,
 *   max_float: 0.70,
 *   rarity: {
 *     id: "classified",
 *     name: "Classified",
 *     color: "#d32ce6"
 *   },
 *   stattrak: true,
 *   paint_index: "282",
 *   image: "https://...",
 *   market_hash_name: "AK-47 | Redline (Field-Tested)"
 * }
 * ```
 */
export interface APIWeaponSkin extends APIBaseItem {
  /** Weapon information */
  weapon: APIWeaponInfo
  /** Weapon category */
  category: APIWeaponCategory
  /** Skin pattern information */
  pattern: APISkinPattern
  /** Minimum float value for wear */
  min_float: number
  /** Maximum float value for wear */
  max_float: number
  /** Whether StatTrak variant is available */
  stattrak?: boolean
  /** Whether Souvenir variant is available */
  souvenir?: boolean
  /** Paint index for the skin */
  paint_index: string
  /** Available wear conditions */
  wears?: APIWearCondition[]
  /** Collections this skin belongs to */
  collections?: APICollection[]
  /** Cases/crates this skin can be found in */
  crates?: APICrate[]
  /** Team association (for team-specific skins) */
  team?: APIItemTeam
}

/**
 * Wear condition information
 * 
 * @description Represents different wear conditions for skins
 */
export interface APIWearCondition {
  /** Wear condition identifier */
  id: string
  /** Wear condition name (e.g., "Factory New", "Field-Tested") */
  name: string
  /** Minimum float value for this condition */
  min_float: number
  /** Maximum float value for this condition */
  max_float: number
}

/**
 * Collection information
 * 
 * @description Represents skin collections
 */
export interface APICollection {
  /** Collection identifier */
  id: string
  /** Collection name */
  name: string
  /** Collection image */
  image?: string
}

/**
 * Crate/case information
 * 
 * @description Represents cases or crates that contain skins
 */
export interface APICrate {
  /** Crate identifier */
  id: string
  /** Crate name */
  name: string
  /** Crate image */
  image?: string
}

// ============================================================================
// STICKER INTERFACES
// ============================================================================

/**
 * Sticker from CS2 API
 * 
 * @description Represents a sticker as received from the CS2 API
 * 
 * @example
 * ```typescript
 * const sticker: APISticker = {
 *   id: "sticker_123",
 *   name: "Natus Vincere | Katowice 2014",
 *   description: "Team sticker from Katowice 2014",
 *   rarity: {
 *     id: "legendary",
 *     name: "Legendary",
 *     color: "#eb4b4b"
 *   },
 *   image: "https://...",
 *   market_hash_name: "Sticker | Natus Vincere | Katowice 2014",
 *   tournament: {
 *     id: "katowice2014",
 *     name: "ESL One Katowice 2014"
 *   },
 *   team: {
 *     id: "navi",
 *     name: "Natus Vincere"
 *   }
 * }
 * ```
 */
export interface APISticker extends APIBaseItem {
  /** Tournament information (if applicable) */
  tournament?: APITournament
  /** Team information (if applicable) */
  team?: APIItemTeam
  /** Sticker category */
  category?: string
  /** Whether this is a holographic sticker */
  holographic?: boolean
  /** Whether this is a foil sticker */
  foil?: boolean
}

/**
 * Tournament information
 * 
 * @description Represents tournament metadata for stickers
 */
export interface APITournament {
  /** Tournament identifier */
  id: string
  /** Tournament name */
  name: string
  /** Tournament year */
  year?: number
  /** Tournament location */
  location?: string
}

// ============================================================================
// AGENT INTERFACES
// ============================================================================

/**
 * Agent from CS2 API
 * 
 * @description Represents a player agent/model as received from the CS2 API
 * 
 * @example
 * ```typescript
 * const agent: APIAgent = {
 *   id: "agent_123",
 *   name: "Phoenix",
 *   description: "Elite Crew | Phoenix",
 *   rarity: {
 *     id: "master",
 *     name: "Master",
 *     color: "#8847ff"
 *   },
 *   image: "https://...",
 *   team: {
 *     id: "terrorists",
 *     name: "Terrorists"
 *   },
 *   faction: {
 *     id: "elite_crew",
 *     name: "Elite Crew"
 *   }
 * }
 * ```
 */
export interface APIAgent extends APIBaseItem {
  /** Team this agent belongs to */
  team: APIItemTeam
  /** Agent faction/group */
  faction?: APIAgentFaction
  /** Agent biography/background */
  biography?: string
  /** Voice lines or quotes */
  quotes?: string[]
}

/**
 * Agent faction information
 * 
 * @description Represents agent factions or groups
 */
export interface APIAgentFaction {
  /** Faction identifier */
  id: string
  /** Faction name */
  name: string
  /** Faction description */
  description?: string
}

// ============================================================================
// MUSIC KIT INTERFACES
// ============================================================================

/**
 * Music kit from CS2 API
 * 
 * @description Represents a music kit as received from the CS2 API
 * 
 * @example
 * ```typescript
 * const musicKit: APIMusicKit = {
 *   id: "music_123",
 *   name: "Hotline Miami",
 *   description: "Music Kit | Hotline Miami",
 *   rarity: {
 *     id: "high_grade",
 *     name: "High Grade",
 *     color: "#4b69ff"
 *   },
 *   image: "https://...",
 *   artist: "Various Artists",
 *   duration: 180,
 *   preview_url: "https://..."
 * }
 * ```
 */
export interface APIMusicKit extends APIBaseItem {
  /** Music artist or composer */
  artist?: string
  /** Duration in seconds */
  duration?: number
  /** Preview audio URL */
  preview_url?: string
  /** Music genre */
  genre?: string
  /** Release year */
  year?: number
}

// ============================================================================
// KEYCHAIN INTERFACES
// ============================================================================

/**
 * Keychain from CS2 API
 * 
 * @description Represents a keychain as received from the CS2 API
 */
export interface APIKeychain extends APIBaseItem {
  /** Keychain category */
  category?: string
  /** Whether this keychain has special effects */
  hasEffects?: boolean
}

// ============================================================================
// COLLECTIBLE INTERFACES
// ============================================================================

/**
 * Collectible item from CS2 API
 * 
 * @description Represents collectible items like pins, patches, etc.
 */
export interface APICollectible extends APIBaseItem {
  /** Collectible type (pin, patch, etc.) */
  type: string
  /** Series or collection this belongs to */
  series?: string
  /** Whether this is a limited edition item */
  limitedEdition?: boolean
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Union type of all API item types
 */
export type APIItem = 
  | APIWeaponSkin
  | APISticker
  | APIAgent
  | APIMusicKit
  | APIKeychain
  | APICollectible

/**
 * Type guard to check if an item is a weapon skin
 */
export function isAPIWeaponSkin(item: APIItem): item is APIWeaponSkin {
  return 'weapon' in item && 'paint_index' in item
}

/**
 * Type guard to check if an item is a sticker
 */
export function isAPISticker(item: APIItem): item is APISticker {
  return 'tournament' in item || 'holographic' in item
}

/**
 * Type guard to check if an item is an agent
 */
export function isAPIAgent(item: APIItem): item is APIAgent {
  return 'team' in item && 'faction' in item
}

/**
 * Type guard to check if an item is a music kit
 */
export function isAPIMusicKit(item: APIItem): item is APIMusicKit {
  return 'artist' in item && 'duration' in item
}
