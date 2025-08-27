/**
 * Item and customization type definitions
 * Moved from server/utils/interfaces.ts for better organization
 */

import type { ItemRarity, ItemTeam } from './api'

// ============================================================================
// CUSTOMIZATION INTERFACES
// ============================================================================

/**
 * Base interface for item customization
 * Contains common properties shared across all customizable items
 */
export interface BaseCustomization {
    /** Whether this item is active/equipped */
    active: boolean;
    /** Item definition index */
    defindex?: number;
    /** Paint index for the skin/pattern */
    paintIndex: number;
    /** Whether paint index is manually overridden */
    paintIndexOverride: boolean;
    /** Pattern seed for randomization */
    pattern: number;
    /** Wear value (float) */
    wear: number;
    /** Team this item belongs to */
    team: number;
    /** Whether to reset this item to defaults */
    reset?: boolean;
}

/**
 * Represents sticker customization data
 * Used for positioning and styling stickers on weapons
 */
export interface WeaponStickerCustomization {
    /** Sticker ID */
    id: number;
    /** Wear/condition of the sticker */
    wear: number;
    /** Scale/size of the sticker */
    scale: number;
    /** Rotation angle in degrees */
    rotation: number;
    /** X-axis position offset */
    x: number;
    /** Y-axis position offset */
    y: number;
}

/**
 * Represents keychain customization data
 * Used for positioning and configuring keychains on weapons
 */
export interface WeaponKeychainCustomization {
    /** Keychain ID */
    id: number;
    /** X-axis position offset */
    x: number;
    /** Y-axis position offset */
    y: number;
    /** Z-axis position offset */
    z: number;
    /** Random seed for keychain generation */
    seed: number;
    /** Optional API data for the keychain */
    api?: {
        id: string;
        name: string;
        color: string;
    };
}

/**
 * Represents weapon customization data
 * Extends BaseCustomization with weapon-specific properties
 */
export interface WeaponCustomization extends BaseCustomization {
    /** Whether StatTrak is enabled */
    statTrak: boolean;
    /** StatTrak kill count */
    statTrakCount: number;
    /** Custom name tag */
    nameTag: string;
    /** Array of sticker customizations (up to 5 slots) */
    stickers: WeaponStickerCustomization[] | null[];
    /** Keychain customization */
    keychain: WeaponKeychainCustomization | null;
}

/**
 * Represents knife customization data
 * Extends BaseCustomization with knife-specific properties
 */
export interface KnifeCustomization extends BaseCustomization {
    /** Whether StatTrak is enabled */
    statTrak: boolean;
    /** StatTrak kill count */
    statTrakCount: number;
    /** Custom name tag */
    nameTag: string;
}

/**
 * Represents glove customization data
 * Extends BaseCustomization (gloves don't support StatTrak or name tags)
 */
export interface GloveCustomization extends BaseCustomization {
    // No additional properties beyond BaseCustomization
}

// ============================================================================
// DEFAULT AND ENHANCED ITEM INTERFACES
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
    team: number | null;
    /** Database information if item is saved */
    databaseInfo?: any;
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
    /** Knife-specific database information */
    databaseInfo?: import('./database').DBKnife;
}

/**
 * Enhanced glove interface with glove-specific database info
 * Used for gloves that have no StatTrak or attachments
 */
export interface IEnhancedGlove extends IEnhancedItem {
    /** Glove-specific database information */
    databaseInfo?: import('./database').DBGlove;
}

/**
 * Mapped database weapon interface
 * Represents weapon data as stored in and retrieved from the database
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
 * Enhanced weapon sticker interface
 * Represents a sticker applied to a weapon with positioning and API data
 */
export interface IEnhancedWeaponSticker {
    /** Sticker ID */
    id: number;
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
    /** API data for this sticker */
    api: {
        name: string;
        image: string;
        type: string;
        effect: string;
        tournament_event: string;
        tournament_team: string;
        rarity: ItemRarity;
    };
}

/**
 * Enhanced weapon keychain interface
 * Represents a keychain attached to a weapon with positioning and API data
 */
export interface IEnhancedWeaponKeychain {
    /** Keychain ID */
    id: number;
    /** X-axis position offset */
    x: number;
    /** Y-axis position offset */
    y: number;
    /** Z-axis position offset */
    z: number;
    /** Random seed for keychain generation */
    seed: number;
    /** API data for this keychain */
    api: {
        name: string;
        image: string;
        rarity: ItemRarity;
    };
}
