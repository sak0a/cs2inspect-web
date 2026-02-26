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

// ============================================================================
// TIER 1: CRITICAL SAFETY TYPES
// ============================================================================

/**
 * Branded type for CS2 inspect URLs
 * 
 * @description Steam protocol URL for inspecting CS2 items in-game.
 * Format: steam://rungame/730/76561202255233023/+csgo_econ_action_preview%20...
 * 
 * @example "steam://rungame/730/76561202255233023/+csgo_econ_action_preview%20S76561198000000000A123456D789"
 */
export type InspectUrl = string & { readonly __brand: 'InspectUrl' }

/**
 * Branded type for hex-encoded item data
 * 
 * @description Hexadecimal string representing encoded item data for masked inspect URLs.
 * Used in the gen command encoding/decoding process.
 */
export type HexData = string & { readonly __brand: 'HexData' }

/**
 * Branded type for item wear/float value
 * 
 * @description Float value representing item wear condition.
 * Range: 0.0 (Factory New) to 1.0 (Battle-Scarred)
 * 
 * @example 0.0001 (Factory New), 0.999 (Battle-Scarred)
 */
export type FloatValue = number & { readonly __brand: 'FloatValue' }

/**
 * Branded type for sticker slot index
 * 
 * @description Index position for sticker slots on weapons (0-4).
 * Most weapons have 4-5 sticker slots.
 */
export type StickerSlotIndex = number & { readonly __brand: 'StickerSlotIndex' }

/**
 * Branded type for team ID
 * 
 * @description Team identifier: 1 = Terrorist, 2 = Counter-Terrorist
 */
export type TeamId = (1 | 2) & { readonly __brand: 'TeamId' }

// ============================================================================
// TIER 2: DOMAIN SAFETY TYPES
// ============================================================================

/**
 * Branded type for StatTrak kill count
 * 
 * @description Non-negative integer representing StatTrak kill count.
 */
export type StatTrakCount = number & { readonly __brand: 'StatTrakCount' }

/**
 * Branded type for weapon name tags
 * 
 * @description Custom name applied to weapons. Max 32 characters.
 */
export type NameTag = string & { readonly __brand: 'NameTag' }

/**
 * Branded type for ISO 8601 timestamps
 * 
 * @description Timestamp string in ISO 8601 format.
 * @example "2024-01-15T10:30:00.000Z"
 */
export type ISOTimestamp = string & { readonly __brand: 'ISOTimestamp' }

// ============================================================================
// TIER 3: VISUAL AND UX TYPES
// ============================================================================

/**
 * Branded type for normalized coordinates
 *
 * @description Value between 0.0 and 1.0 representing a normalized position.
 * Used for sticker/keychain positioning on weapons.
 */
export type NormalizedCoordinate = number & { readonly __brand: 'NormalizedCoordinate' }

// ============================================================================
// TIER 1: CONVERSION HELPERS
// ============================================================================

/**
 * Convert a string to an InspectUrl with validation
 * 
 * @param value - URL string to convert
 * @returns Branded InspectUrl
 * @throws Error if the URL format is invalid
 */
export function toInspectUrl(value: string): InspectUrl {
    if (!isValidInspectUrl(value)) {
        throw new Error('Invalid inspect URL format. Must start with steam://rungame/730/')
    }
    return value as InspectUrl
}

/**
 * Safely convert a string to an InspectUrl without throwing
 * 
 * @param value - URL string to convert
 * @returns Branded InspectUrl or null if invalid
 */
export function tryToInspectUrl(value: string): InspectUrl | null {
    return isValidInspectUrl(value) ? (value as InspectUrl) : null
}

/**
 * Convert a string to HexData with validation
 * 
 * @param value - Hex string to convert
 * @returns Branded HexData
 * @throws Error if the format is invalid
 */
export function toHexData(value: string): HexData {
    if (!isValidHexData(value)) {
        throw new Error('Invalid hex data format. Must contain only hexadecimal characters.')
    }
    return value as HexData
}

/**
 * Convert a number to a FloatValue with validation
 * 
 * @param value - Wear value to convert
 * @returns Branded FloatValue
 * @throws Error if the value is out of range
 */
export function toFloatValue(value: number): FloatValue {
    if (!isValidFloatValue(value)) {
        throw new Error('Float value must be between 0 and 1')
    }
    return value as FloatValue
}

/**
 * Safely convert a number to a FloatValue, clamping to valid range
 * 
 * @param value - Wear value to convert
 * @returns Branded FloatValue clamped to [0, 1]
 */
export function toFloatValueClamped(value: number): FloatValue {
    return Math.max(0, Math.min(1, value)) as FloatValue
}

/**
 * Convert a number to a StickerSlotIndex with validation
 * 
 * @param value - Slot index to convert
 * @returns Branded StickerSlotIndex
 * @throws Error if the value is out of range
 */
export function toStickerSlotIndex(value: number): StickerSlotIndex {
    if (!isValidStickerSlotIndex(value)) {
        throw new Error('Sticker slot index must be an integer between 0 and 4')
    }
    return value as StickerSlotIndex
}

/**
 * Convert a number to a TeamId with validation
 * 
 * @param value - Team ID to convert
 * @returns Branded TeamId
 * @throws Error if the value is not 1 or 2
 */
export function toTeamId(value: number): TeamId {
    if (!isValidTeamId(value)) {
        throw new Error('Team ID must be 1 (Terrorist) or 2 (Counter-Terrorist)')
    }
    return value as TeamId
}

// ============================================================================
// TIER 2: CONVERSION HELPERS
// ============================================================================

/**
 * Convert a number to a StatTrakCount with validation
 * 
 * @param value - Kill count to convert
 * @returns Branded StatTrakCount
 * @throws Error if the value is negative
 */
export function toStatTrakCount(value: number): StatTrakCount {
    if (!isValidStatTrakCount(value)) {
        throw new Error('StatTrak count must be a non-negative integer')
    }
    return value as StatTrakCount
}

/**
 * Convert a string to a NameTag with validation
 * 
 * @param value - Name tag string to convert
 * @returns Branded NameTag
 * @throws Error if the string is too long
 */
export function toNameTag(value: string): NameTag {
    if (!isValidNameTag(value)) {
        throw new Error('Name tag must be max 32 characters')
    }
    return value as NameTag
}

/**
 * Convert a Date or string to an ISOTimestamp
 * 
 * @param value - Date object or ISO string to convert
 * @returns Branded ISOTimestamp
 */
export function toISOTimestamp(value: Date | string): ISOTimestamp {
    const dateStr = value instanceof Date ? value.toISOString() : value
    if (!isValidISOTimestamp(dateStr)) {
        throw new Error('Invalid ISO 8601 timestamp format')
    }
    return dateStr as ISOTimestamp
}

/**
 * Convert a number to a NormalizedCoordinate with validation
 * 
 * @param value - Coordinate value to convert
 * @returns Branded NormalizedCoordinate
 * @throws Error if the value is out of range
 */
export function toNormalizedCoordinate(value: number): NormalizedCoordinate {
    if (!isValidNormalizedCoordinate(value)) {
        throw new Error('Normalized coordinate must be between 0 and 1')
    }
    return value as NormalizedCoordinate
}

/**
 * Safely convert a number to a NormalizedCoordinate, clamping to valid range
 * 
 * @param value - Coordinate value to convert
 * @returns Branded NormalizedCoordinate clamped to [0, 1]
 */
export function toNormalizedCoordinateClamped(value: number): NormalizedCoordinate {
    return Math.max(0, Math.min(1, value)) as NormalizedCoordinate
}

// ============================================================================
// TIER 1: TYPE GUARDS
// ============================================================================

/**
 * Check if a value is a valid InspectUrl
 */
export function isValidInspectUrl(value: unknown): value is InspectUrl {
    return typeof value === 'string' &&
        value.startsWith('steam://rungame/730/') &&
        value.includes('+csgo_econ_action_preview')
}

/**
 * Check if a value is valid HexData
 */
export function isValidHexData(value: unknown): value is HexData {
    return typeof value === 'string' && /^[0-9A-Fa-f]+$/.test(value)
}

/**
 * Check if a value is a valid FloatValue (0-1 range)
 */
export function isValidFloatValue(value: unknown): value is FloatValue {
    return typeof value === 'number' && value >= 0 && value <= 1
}

/**
 * Check if a value is a valid StickerSlotIndex (0-4)
 */
export function isValidStickerSlotIndex(value: unknown): value is StickerSlotIndex {
    return typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= 4
}

/**
 * Check if a value is a valid TeamId (1 or 2)
 */
export function isValidTeamId(value: unknown): value is TeamId {
    return value === 1 || value === 2
}

// ============================================================================
// TIER 2: TYPE GUARDS
// ============================================================================

/**
 * Check if a value is a valid StatTrakCount
 */
export function isValidStatTrakCount(value: unknown): value is StatTrakCount {
    return typeof value === 'number' && Number.isInteger(value) && value >= 0
}

/**
 * Check if a value is a valid NameTag
 */
export function isValidNameTag(value: unknown): value is NameTag {
    return typeof value === 'string' && value.length <= 32
}

/**
 * Check if a value is a valid ISOTimestamp
 */
export function isValidISOTimestamp(value: unknown): value is ISOTimestamp {
    if (typeof value !== 'string') return false
    const date = new Date(value)
    return !isNaN(date.getTime()) && value === date.toISOString()
}

/**
 * Check if a value is a valid NormalizedCoordinate
 */
export function isValidNormalizedCoordinate(value: unknown): value is NormalizedCoordinate {
    return typeof value === 'number' && value >= 0 && value <= 1
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Convert FloatValue to wear condition name
 * 
 * @param value - Float value representing wear
 * @returns Wear condition name
 */
export function floatValueToCondition(value: FloatValue): string {
    if (value < 0.07) return 'Factory New'
    if (value < 0.15) return 'Minimal Wear'
    if (value < 0.38) return 'Field-Tested'
    if (value < 0.45) return 'Well-Worn'
    return 'Battle-Scarred'
}

/**
 * Convert FloatValue to wear condition abbreviation
 * 
 * @param value - Float value representing wear
 * @returns Wear condition abbreviation (FN, MW, FT, WW, BS)
 */
export function floatValueToConditionAbbr(value: FloatValue): string {
    if (value < 0.07) return 'FN'
    if (value < 0.15) return 'MW'
    if (value < 0.38) return 'FT'
    if (value < 0.45) return 'WW'
    return 'BS'
}

/**
 * Get team name from TeamId
 * 
 * @param teamId - Team identifier
 * @returns Team name string
 */
export function teamIdToName(teamId: TeamId): 'Terrorist' | 'Counter-Terrorist' {
    return teamId === 1 ? 'Terrorist' : 'Counter-Terrorist'
}

/**
 * Get team abbreviation from TeamId
 *
 * @param teamId - Team identifier
 * @returns Team abbreviation (T or CT)
 */
export function teamIdToAbbr(teamId: TeamId): 'T' | 'CT' {
    return teamId === 1 ? 'T' : 'CT'
}

// ============================================================================
// ADMIN TYPES
// ============================================================================

/**
 * Branded type for admin user ID
 */
export type AdminId = number & { readonly __brand: 'AdminId' }

/**
 * Branded type for ban record ID
 */
export type BanId = number & { readonly __brand: 'BanId' }

/**
 * Branded type for setting key
 */
export type SettingKey = string & { readonly __brand: 'SettingKey' }

/**
 * Convert a number to an AdminId
 */
export function toAdminId(value: number): AdminId {
    return value as AdminId
}

/**
 * Convert a number to a BanId
 */
export function toBanId(value: number): BanId {
    return value as BanId
}

/**
 * Convert a string to a SettingKey
 */
export function toSettingKey(value: string): SettingKey {
    return value as SettingKey
}

/**
 * Check if a value is a valid AdminId
 */
export function isValidAdminId(value: unknown): value is AdminId {
    return typeof value === 'number' && Number.isInteger(value) && value > 0
}

/**
 * Check if a value is a valid BanId
 */
export function isValidBanId(value: unknown): value is BanId {
    return typeof value === 'number' && Number.isInteger(value) && value > 0
}

/**
 * Check if a value is a valid SettingKey
 */
export function isValidSettingKey(value: unknown): value is SettingKey {
    return typeof value === 'string' && value.length > 0 && value.length <= 64
}
