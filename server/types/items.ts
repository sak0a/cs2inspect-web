/**
 * Item and customization type definitions for CS2Inspect server
 * 
 * This file now re-exports shared customization types from ~/types,
 * while keeping server-specific enhanced item interfaces.
 */

import type { ItemRarity } from './api'

// ============================================================================
// CUSTOMIZATION INTERFACES - RE-EXPORTED FROM ~/types
// ============================================================================

// Re-export customization types from the unified type system
export type {
    BaseItemConfiguration as BaseCustomization,
    StickerConfiguration as WeaponStickerCustomization,
    KeychainConfiguration as WeaponKeychainCustomization,
    WeaponConfiguration,
    KnifeConfiguration,
    GloveConfiguration
} from '~/types/business/items'

// ============================================================================
// DEFAULT AND ENHANCED ITEM INTERFACES (Server-specific)
// ============================================================================

/**
 * Represents a default item configuration
 * Used for weapons, knives, and gloves that have default states
 */
export interface IDefaultItem {
    /** Weapon definition index */
    weapon_defindex: number;
    /** Default display name */
    defaultName: string;
    /** Default paint index (usually 0 for vanilla items) */
    paintIndex: number;
    /** URL to default item image */
    defaultImage: string;
    /** Internal weapon name identifier */
    weapon_name: string;
    /** Item category (e.g., "pistols", "rifles", "knives") */
    category: string;
    /** Teams that can use this item ("both", "t", "ct") */
    availableTeams: string;
}

/**
 * Enhanced item interface that combines default item data with API data
 * Base interface for all enhanced item types
 */
export interface IEnhancedItem extends IDefaultItem {
    /** Current display name (may differ from defaultName if customized) */
    name: string;
    /** Current image URL (may differ from defaultImage if customized) */
    image: string;
    /** Minimum float value for wear */
    minFloat: number;
    /** Maximum float value for wear */
    maxFloat: number;
    /** Rarity information if available */
    rarity?: ItemRarity;
    /** Team association (null if available to both teams) */
    team: number | null | undefined;
    /** Database information if item is saved */
    databaseInfo?: unknown;
}

/**
 * Enhanced weapon interface with weapon-specific database info
 * Used for weapons that can have stickers, keychains, and StatTrak
 */
export interface IEnhancedWeapon extends IEnhancedItem {
    /** Weapon-specific database information */
    databaseInfo?: IMappedDBWeapon;
}

/**
 * Enhanced knife interface with knife-specific database info
 * Used for knives that can have StatTrak but no stickers/keychains
 */
export interface IEnhancedKnife extends IEnhancedItem {
    /** Knife-specific database information (uses plain numbers for API serialization) */
    databaseInfo?: IMappedDBKnife;
}

/**
 * Enhanced glove interface with glove-specific database info
 * Used for gloves that have no StatTrak or attachments
 */
export interface IEnhancedGlove extends IEnhancedItem {
    /** Glove-specific database information (uses plain numbers for API serialization) */
    databaseInfo?: IMappedDBGlove;
}

/**
 * Mapped database weapon interface
 * Represents weapon data as stored in and retrieved from the database
 * Uses plain number types for API serialization compatibility
 */
export interface IMappedDBWeapon {
    /** Whether this weapon is active/equipped */
    active: boolean;
    /** Team this weapon belongs to */
    team: number;
    /** Weapon definition index */
    defindex: number;
    /** Whether StatTrak is enabled */
    statTrak: boolean;
    /** StatTrak kill count */
    statTrakCount: number;
    /** Paint index for the skin */
    paintIndex: number;
    /** Wear value (float) */
    paintWear: number;
    /** Pattern seed */
    pattern: number;
    /** Custom name tag */
    nameTag: string;
    /** Array of stickers (up to 5 slots, null for empty slots) */
    stickers: (IEnhancedWeaponSticker | null)[];
    /** Keychain attachment */
    keychain: IEnhancedWeaponKeychain | null;
}

/**
 * Mapped database knife interface
 * Represents knife data for API responses (uses plain numbers, not branded types)
 */
export interface IMappedDBKnife {
    /** Record ID */
    id: number;
    /** Whether this knife is active/equipped */
    active: boolean;
    /** Team this knife belongs to (1 = T, 2 = CT) */
    team: number;
    /** Knife definition index */
    defindex: number;
    /** Paint index for the skin */
    paintindex: number;
    /** Pattern seed for randomization */
    paintseed: number | string;
    /** Wear value (float or string) */
    paintwear: number | string;
    /** Whether StatTrak is enabled */
    stattrak_enabled: boolean;
    /** StatTrak kill count */
    stattrak_count: number;
    /** Custom name tag */
    nametag: string | null;
}

/**
 * Mapped database glove interface
 * Represents glove data for API responses (uses plain numbers, not branded types)
 */
export interface IMappedDBGlove {
    /** Record ID */
    id: number;
    /** Whether this glove is active/equipped */
    active: boolean;
    /** Team this glove belongs to (1 = T, 2 = CT) */
    team: number;
    /** Glove definition index */
    defindex: number;
    /** Paint index for the skin */
    paintindex: number;
    /** Pattern seed for randomization */
    paintseed: number | string;
    /** Wear value (float or string) */
    paintwear: number | string;
}

/**
 * Enhanced weapon sticker interface
 * Represents a sticker applied to a weapon with positioning and API data
 */
export interface IEnhancedWeaponSticker {
    /** Sticker ID */
    id: number | string;
    /** Slot index (0-4) where this sticker is placed */
    slot: number;
    /** X-axis position offset */
    x: number;
    /** Y-axis position offset */
    y: number;
    /** Wear/condition of the sticker */
    wear: number;
    /** Scale/size of the sticker */
    scale: number;
    /** Rotation angle in degrees */
    rotation: number;
    /** Optional name for compatibility */
    name?: string;
    /** Optional image for compatibility */
    image?: string;
    /** Position index (0-4) - for StickerConfiguration compatibility */
    position: number;
    /** API data for this sticker */
    api?: {
        name: string;
        image: string;
        type: string;
        effect: string;
        tournament_event: string;
        tournament_team: string;
        rarity?: ItemRarity;
    };
}

/**
 * Enhanced weapon keychain interface
 * Represents a keychain attached to a weapon with positioning and API data
 */
export interface IEnhancedWeaponKeychain {
    /** Keychain ID */
    id: number | string;
    /** X-axis position offset */
    x: number;
    /** Y-axis position offset */
    y: number;
    /** Z-axis position offset */
    z: number;
    /** Random seed for keychain generation */
    seed: number;
    /** Optional name for compatibility */
    name?: string;
    /** Optional image for compatibility */
    image?: string;
    /** ID of the sticker wrapped inside the charm (for Sticker Slabs) */
    wrapped_sticker_id?: number | null;
    /** ID of the highlight reel (for Highlight Reel charms) */
    highlight_reel_id?: number | null;
    /** API data for this keychain */
    api?: {
        name: string;
        image: string;
        rarity?: ItemRarity;
    };
}
