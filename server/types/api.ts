/**
 * API item type definitions
 * Moved from server/utils/interfaces.ts for better organization
 */

import type { ItemRarity } from '~/types/core/common'

// ============================================================================
// SHARED TYPES - RE-EXPORTED FROM ~/types
// ============================================================================

// Re-export ItemRarity from unified type system
export type { ItemRarity }

// Re-export team enum
export { CsTeam } from '~/types/core/common'

/**
 * Represents team information for CS2 items
 * Used for agents and some skins that are team-specific
 */
export interface ItemTeam {
    /** Unique identifier for the team */
    id: string
    /** Display name of the team */
    name: string
}

/**
 * Base interface for all CS2 API items
 * Contains common fields shared across all item types
 */
export interface BaseAPIItem {
    /** Unique identifier for the item */
    id: string
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
// SPECIFIC API ITEM INTERFACES
// ============================================================================

/**
 * Represents a weapon skin from the CS2 API
 * Extends BaseAPIItem with weapon-specific properties
 */
export interface APISkin extends BaseAPIItem {
    /** Weapon information this skin belongs to */
    weapon: {
        id: string
        name: string
        weapon_id: string
    }
    /** Category information (e.g., "Pistol", "Rifle") */
    category: {
        id: string
        name: string
    }
    /** Pattern information for the skin */
    pattern: {
        id: string
        name: string
    }
    /** Minimum float value for wear */
    min_float: number
    /** Maximum float value for wear */
    max_float: number
    /** Whether StatTrak version is available */
    stattrak?: boolean
    /** Whether souvenir version is available */
    souvenir?: boolean
    /** Paint index identifier */
    paint_index: string
    /** Available wear conditions */
    wears?: Array<{ name: string; min: number; max: number }>
    /** Collections this skin belongs to */
    collections?: Array<{ id: string; name: string }>
    /** Crates this skin can be found in */
    crates?: Array<{ id: string; name: string }>
    /** Team association if applicable */
    team?: ItemTeam
}

/**
 * Represents a sticker from the CS2 API
 * Extends BaseAPIItem with sticker-specific properties
 */
export interface APISticker extends BaseAPIItem {
    /** Crates this sticker can be found in */
    crates?: Array<{ id: string; name: string }>
    /** Tournament event this sticker is associated with */
    tournament_event: string
    /** Tournament team this sticker represents */
    tournament_team: string
    /** Type of sticker (e.g., "Team", "Player") */
    type: string
    /** Visual effect applied to the sticker */
    effect?: string
}

/**
 * Represents an agent from the CS2 API
 * Extends BaseAPIItem with agent-specific properties
 */
export interface APIAgent extends BaseAPIItem {
    /** Collections this agent belongs to */
    collections?: Array<{ id: string; name: string }>
    /** Team this agent belongs to */
    team: ItemTeam
}

/**
 * Represents a music kit from the CS2 API
 * Extends BaseAPIItem with music kit-specific properties
 */
export interface APIMusicKit extends BaseAPIItem {
    /** Whether this music kit is exclusive/limited */
    exclusive?: boolean
}

/**
 * Represents a keychain from the CS2 API
 * Extends BaseAPIItem with keychain-specific properties
 */
export type APIKeychain = BaseAPIItem

/**
 * Represents a collectible item from the CS2 API
 * Extends BaseAPIItem with collectible-specific properties
 */
export interface APICollectible extends BaseAPIItem {
    /** Type of collectible item */
    type?: string
    /** Whether this is a genuine item */
    genuine?: boolean
}

/**
 * Represents a highlight from the CS2 API
 * Extends BaseAPIItem with highlight-specific properties
 */
export interface APIHighlight extends BaseAPIItem {
    /** Definition index */
    def_index: string
    /** Item description */
    description: string
    /** Tournament event name */
    tournament_event: string
    /** First team name */
    team0: string
    /** Second team name */
    team1: string
    /** Tournament stage */
    stage: string
    /** Tournament player name */
    tournament_player: string
    /** Map name */
    map: string
    /** Market hash name */
    market_hash_name: string
    /** Video URL */
    video: string
    /** Thumbnail image URL */
    thumbnail: string
    /** Original item data */
    original: Record<string, unknown>
}

// Note: CsTeam is now re-exported from ~/types/core/common at the top of this file
