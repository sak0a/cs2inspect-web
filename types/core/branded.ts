/**
 * Branded types for compile-time type safety of IDs
 * 
 * @description This file contains branded type definitions that add compile-time
 * safety for different ID types, preventing common mistakes like:
 * - Passing a string where a number is expected (LoadoutId)
 * - Mixing up different ID types (SteamId vs EntityId)
 * - Confusing numeric identifiers (Defindex vs PaintIndex)
 * 
 * @version 2.0.0
 * @since 2.0.0
 */

// ============================================================================
// ENTITY ID TYPES
// ============================================================================

/**
 * Branded type for loadout identifiers
 * 
 * @description LoadoutId is a number in the database but often passed as string
 * from URL params. Use toLoadoutId() for safe conversion.
 * 
 * @example
 * ```typescript
 * const loadoutId = toLoadoutId(params.id) // Converts string to LoadoutId
 * eq(table.loadoutid, loadoutId) // Type-safe database query
 * ```
 */
export type LoadoutId = number & { readonly __brand: 'LoadoutId' }

/**
 * Branded type for Steam identifiers (64-bit SteamID)
 * 
 * @description Used for Steam user identification throughout the application.
 * 
 * @example "76561198000000000"
 */
export type SteamId = string & { readonly __brand: 'SteamId' }

// ============================================================================
// NUMERIC IDENTIFIER TYPES
// ============================================================================

/**
 * Branded type for weapon/item definition index
 * 
 * @description Unique numeric identifier for each weapon/item type in CS2.
 * Not to be confused with PaintIndex which identifies skins.
 * 
 * @example 7 (AK-47), 500 (Bayonet)
 */
export type Defindex = number & { readonly __brand: 'Defindex' }

/**
 * Branded type for paint/skin index
 * 
 * @description Unique numeric identifier for each skin/pattern type.
 * Not to be confused with Defindex which identifies weapons.
 * 
 * @example 12 (Crimson Web), 44 (Asiimov)
 */
export type PaintIndex = number & { readonly __brand: 'PaintIndex' }

/**
 * Branded type for pattern seed
 * 
 * @description Random seed that determines the pattern variation of a skin.
 * Values range from 0 to 999.
 * 
 * @example 661 (Blue Gem Case Hardened seed)
 */
export type PaintSeed = number & { readonly __brand: 'PaintSeed' }

/**
 * Branded type for sticker identifiers
 * 
 * @description Unique numeric identifier for stickers.
 */
export type StickerId = number & { readonly __brand: 'StickerId' }

/**
 * Branded type for keychain/charm identifiers
 * 
 * @description Unique numeric identifier for keychains/charms.
 */
export type KeychainId = number & { readonly __brand: 'KeychainId' }

/**
 * Branded type for music kit identifiers
 * 
 * @description Unique numeric identifier for music kits.
 */
export type MusicKitDefindex = number & { readonly __brand: 'MusicKitDefindex' }

/**
 * Branded type for pin/collectible identifiers
 * 
 * @description Unique numeric identifier for pins and collectibles.
 */
export type PinDefindex = number & { readonly __brand: 'PinDefindex' }

// ============================================================================
// CONVERSION HELPERS
// ============================================================================

/**
 * Convert a string or number to a LoadoutId
 * 
 * @description Safely converts URL params or other string/number values to LoadoutId.
 * This replaces all `Number(loadoutId)` calls throughout the codebase.
 * 
 * @param value - String or number value to convert
 * @returns Branded LoadoutId
 * 
 * @example
 * ```typescript
 * const loadoutId = toLoadoutId(params.id)
 * await db.select().from(loadouts).where(eq(loadouts.id, loadoutId))
 * ```
 */
export function toLoadoutId(value: string | number): LoadoutId {
    return Number(value) as LoadoutId
}

/**
 * Convert a string to a SteamId
 * 
 * @param value - Steam ID string
 * @returns Branded SteamId
 */
export function toSteamId(value: string): SteamId {
    return value as SteamId
}

/**
 * Convert a number to a Defindex
 * 
 * @param value - Weapon/item definition index
 * @returns Branded Defindex
 */
export function toDefindex(value: number): Defindex {
    return value as Defindex
}

/**
 * Convert a number to a PaintIndex
 * 
 * @param value - Paint/skin index
 * @returns Branded PaintIndex
 */
export function toPaintIndex(value: number): PaintIndex {
    return value as PaintIndex
}

/**
 * Convert a number to a PaintSeed
 * 
 * @param value - Pattern seed
 * @returns Branded PaintSeed
 */
export function toPaintSeed(value: number): PaintSeed {
    return value as PaintSeed
}

/**
 * Convert a number to a StickerId
 * 
 * @param value - Sticker identifier
 * @returns Branded StickerId
 */
export function toStickerId(value: number): StickerId {
    return value as StickerId
}

/**
 * Convert a number to a KeychainId
 * 
 * @param value - Keychain identifier
 * @returns Branded KeychainId
 */
export function toKeychainId(value: number): KeychainId {
    return value as KeychainId
}

/**
 * Convert a number to a MusicKitDefindex
 * 
 * @param value - Music kit identifier
 * @returns Branded MusicKitDefindex
 */
export function toMusicKitDefindex(value: number): MusicKitDefindex {
    return value as MusicKitDefindex
}

/**
 * Convert a number to a PinDefindex
 * 
 * @param value - Pin identifier
 * @returns Branded PinDefindex
 */
export function toPinDefindex(value: number): PinDefindex {
    return value as PinDefindex
}

// ============================================================================
// TYPE GUARDS
// ============================================================================

/**
 * Check if a value is a valid LoadoutId (positive integer)
 */
export function isValidLoadoutId(value: unknown): value is LoadoutId {
    return typeof value === 'number' && Number.isInteger(value) && value > 0
}

/**
 * Check if a value is a valid SteamId (17-digit string)
 */
export function isValidSteamId(value: unknown): value is SteamId {
    return typeof value === 'string' && /^\d{17}$/.test(value)
}

/**
 * Check if a value is a valid Defindex (non-negative integer)
 */
export function isValidDefindex(value: unknown): value is Defindex {
    return typeof value === 'number' && Number.isInteger(value) && value >= 0
}


