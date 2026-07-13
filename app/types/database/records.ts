/**
 * Database record interfaces for the CS2Inspect application
 *
 * @description This file contains interfaces that represent database table
 * structures and records. These interfaces match the actual database schema
 * and are used for type-safe database operations.
 *
 * ## Branded Types Usage
 *
 * This module uses branded types for type-safe database operations:
 * - `LoadoutId`, `SteamId` - Entity identifiers
 * - `Defindex`, `PaintIndex` - Item identifiers
 * - `ISOTimestamp` - Timestamp fields
 *
 * Note: Some fields like `paintwear` and `stattrak_count` are stored as strings
 * or plain numbers in the database but should be converted to branded types
 * (FloatValue, StatTrakCount) when used in business logic.
 *
 * @version 2.0.0
 * @since 2.0.0
 */

import type {
  EntityId,
  Timestamp,
  TeamSide,
  SteamId,
  LoadoutId,
  Defindex,
  PaintIndex,
  // ISOTimestamp available for future use when migrating Timestamp fields
} from '../core/common'

// ============================================================================
// BASE DATABASE INTERFACES
// ============================================================================

/**
 * Base interface for all database records
 *
 * @description Contains common fields present in all database tables
 */
export interface DBBaseRecord {
  /** Primary key identifier */
  id: EntityId
  /** Record creation timestamp */
  created_at: Timestamp
  /** Record last update timestamp */
  updated_at: Timestamp
}

/**
 * Base interface for user-owned database records
 *
 * @description Extends base record with Steam ID for user association
 */
export interface DBUserRecord extends DBBaseRecord {
  /** Steam ID of the record owner */
  steamid: SteamId
}

/**
 * Base interface for loadout-associated database records
 *
 * @description Extends user record with loadout association
 */
export interface DBLoadoutRecord extends DBUserRecord {
  /** ID of the associated loadout */
  loadoutid: LoadoutId
  /** Whether this item is currently active */
  active: boolean
  /** Team this item belongs to */
  team: TeamSide
}

// ============================================================================
// LOADOUT INTERFACES
// ============================================================================

/**
 * User loadout database record
 *
 * @description Represents a user's loadout configuration in the database
 *
 * @example
 * ```typescript
 * const loadout: DBLoadout = {
 *   id: "loadout_123",
 *   steamid: "76561198000000000",
 *   name: "My Main Loadout",
 *   selected_knife_t: 500,
 *   selected_knife_ct: 500,
 *   selected_glove_t: 5000,
 *   selected_glove_ct: 5000,
 *   selected_agent_t: 5400,
 *   selected_agent_ct: 5401,
 *   selected_music: 1,
 *   created_at: "2024-01-15T10:30:00.000Z",
 *   updated_at: "2024-01-15T10:30:00.000Z"
 * }
 * ```
 */
export interface DBLoadout extends DBUserRecord {
  /** Loadout display name */
  name: string
  /** Whether this loadout is currently active for the player */
  active: boolean
  /** Whether this loadout is the default loadout for the player */
  is_default: boolean | number
  /** Selected knife defindex for Terrorist team */
  selected_knife_t: number | null
  /** Selected knife defindex for Counter-Terrorist team */
  selected_knife_ct: number | null
  /** Selected glove defindex for Terrorist team */
  selected_glove_t: number | null
  /** Selected glove defindex for Counter-Terrorist team */
  selected_glove_ct: number | null
  /** Selected agent defindex for Terrorist team */
  selected_agent_t: number | null
  /** Selected agent defindex for Counter-Terrorist team */
  selected_agent_ct: number | null
  /** Selected music kit ID */
  selected_music: number | null
  /** Selected pin ID */
  selected_pin: number | null
  /** Share code for sharing this loadout with others */
  share_code: string | null
}

// ============================================================================
// WEAPON INTERFACES
// ============================================================================

/**
 * Base weapon database record
 *
 * @description Common fields for all weapon types (rifles, pistols, SMGs, etc.)
 *
 * ## Branded Types Conversion
 *
 * When using values from this record in business logic, convert to branded types:
 * - `paintseed` → `toPaintSeed(parseInt(paintseed))` for PaintSeed
 * - `paintwear` → `toFloatValue(parseFloat(paintwear))` for FloatValue (0-1)
 * - `stattrak_count` → `toStatTrakCount(stattrak_count)` for StatTrakCount
 * - `nametag` → `toNameTag(nametag)` for NameTag (max 32 chars)
 * - Sticker IDs → `toStickerId(id)` for StickerId
 * - Sticker x/y → `toNormalizedCoordinate(value)` for NormalizedCoordinate (0-1)
 */
export interface DBBaseWeapon extends DBLoadoutRecord {
  /** Weapon definition index */
  defindex: Defindex
  /** Paint index for the skin */
  paintindex: PaintIndex
  /** Pattern seed (0-999) - convert to PaintSeed for business logic */
  paintseed: string
  /** Wear value as string (0-1) - convert to FloatValue for business logic */
  paintwear: string
  /** Whether StatTrak is enabled */
  stattrak_enabled: boolean
  /** StatTrak kill count - convert to StatTrakCount for validation */
  stattrak_count: number
  /** Custom name tag (max 32 chars) - convert to NameTag for validation */
  nametag: string
  /** Sticker data for position 0 (JSON with id, x, y, wear, scale, rotation) */
  sticker_0: string
  /** Sticker data for position 1 */
  sticker_1: string
  /** Sticker data for position 2 */
  sticker_2: string
  /** Sticker data for position 3 */
  sticker_3: string
  /** Sticker data for position 4 */
  sticker_4: string
  /** Keychain data (JSON with id, x, y, z, seed) */
  keychain: string
}

/**
 * Rifle database record
 *
 * @description Represents rifle configurations in the wp_player_rifles table
 */
export type DBRifle = DBBaseWeapon

/**
 * Pistol database record
 *
 * @description Represents pistol configurations in the wp_player_pistols table
 */
export type DBPistol = DBBaseWeapon

/**
 * SMG database record
 *
 * @description Represents SMG configurations in the wp_player_smgs table
 */
export type DBSMG = DBBaseWeapon

/**
 * Heavy weapon database record
 *
 * @description Represents heavy weapon configurations in the wp_player_heavys table
 */
export type DBHeavy = DBBaseWeapon

/**
 * Union type for all weapon database records
 */
export type DBWeapon = DBRifle | DBPistol | DBSMG | DBHeavy

// ============================================================================
// KNIFE INTERFACES
// ============================================================================

/**
 * Knife database record
 *
 * @description Represents knife configurations in the wp_player_knifes table
 *
 * ## Branded Types Conversion
 *
 * When using values from this record in business logic, convert to branded types:
 * - `paintseed` → `toPaintSeed(parseInt(paintseed))` for PaintSeed
 * - `paintwear` → `toFloatValue(parseFloat(paintwear))` for FloatValue (0-1)
 * - `stattrak_count` → `toStatTrakCount(stattrak_count)` for StatTrakCount
 * - `nametag` → `toNameTag(nametag)` for NameTag (max 32 chars)
 *
 * @example
 * ```typescript
 * const knife: DBKnife = {
 *   id: "knife_123",
 *   steamid: "76561198000000000",
 *   loadoutid: "loadout_123",
 *   active: true,
 *   team: TeamSide.Terrorist,
 *   defindex: 500,
 *   paintindex: 12,
 *   paintseed: "123",
 *   paintwear: "0.15",
 *   stattrak_enabled: true,
 *   stattrak_count: 1337,
 *   nametag: "My Karambit",
 *   created_at: "2024-01-15T10:30:00.000Z",
 *   updated_at: "2024-01-15T10:30:00.000Z"
 * }
 * ```
 */
export interface DBKnife extends DBLoadoutRecord {
  /** Knife definition index */
  defindex: Defindex
  /** Paint index for the skin */
  paintindex: PaintIndex
  /** Pattern seed (0-999) - convert to PaintSeed for business logic */
  paintseed: string
  /** Wear value as string (0-1) - convert to FloatValue for business logic */
  paintwear: string
  /** Whether StatTrak is enabled */
  stattrak_enabled: boolean
  /** StatTrak kill count - convert to StatTrakCount for validation */
  stattrak_count: number
  /** Custom name tag (max 32 chars) - convert to NameTag for validation */
  nametag: string
}

// ============================================================================
// GLOVE INTERFACES
// ============================================================================

/**
 * Glove database record
 *
 * @description Represents glove configurations in the wp_player_gloves table
 *
 * ## Branded Types Conversion
 *
 * When using values from this record in business logic, convert to branded types:
 * - `paintseed` → `toPaintSeed(parseInt(paintseed))` for PaintSeed
 * - `paintwear` → `toFloatValue(parseFloat(paintwear))` for FloatValue (0-1)
 *
 * @example
 * ```typescript
 * const glove: DBGlove = {
 *   id: "glove_123",
 *   steamid: "76561198000000000",
 *   loadoutid: "loadout_123",
 *   active: true,
 *   team: TeamSide.Terrorist,
 *   defindex: 5000,
 *   paintindex: 10006,
 *   paintseed: "456",
 *   paintwear: "0.25",
 *   created_at: "2024-01-15T10:30:00.000Z",
 *   updated_at: "2024-01-15T10:30:00.000Z"
 * }
 * ```
 */
export interface DBGlove extends DBLoadoutRecord {
  /** Glove definition index */
  defindex: Defindex
  /** Paint index for the skin */
  paintindex: PaintIndex
  /** Pattern seed (0-999) - convert to PaintSeed for business logic */
  paintseed: string
  /** Wear value as string (0-1) - convert to FloatValue for business logic */
  paintwear: string
}

// ============================================================================
// AGENT INTERFACES
// ============================================================================

/**
 * Agent database record
 *
 * @description Represents agent configurations in the wp_player_agents table
 *
 * @example
 * ```typescript
 * const agent: DBAgent = {
 *   id: "agent_123",
 *   steamid: "76561198000000000",
 *   loadoutid: "loadout_123",
 *   active: true,
 *   team: TeamSide.Terrorist,
 *   defindex: 5400,
 *   agent_name: "Phoenix",
 *   created_at: "2024-01-15T10:30:00.000Z",
 *   updated_at: "2024-01-15T10:30:00.000Z"
 * }
 * ```
 */
export interface DBAgent extends DBLoadoutRecord {
  /** Agent definition index */
  defindex: Defindex
  /** Agent display name */
  agent_name: string
}

// ============================================================================
// MUSIC KIT INTERFACES
// ============================================================================

/**
 * Music kit database record
 *
 * @description Represents music kit configurations in the wp_player_music table
 *
 * @example
 * ```typescript
 * const musicKit: DBMusicKit = {
 *   id: "music_123",
 *   steamid: "76561198000000000",
 *   loadoutid: "loadout_123",
 *   active: true,
 *   team: TeamSide.Terrorist, // Note: Music kits are not team-specific in practice
 *   musicid: 1,
 *   created_at: "2024-01-15T10:30:00.000Z",
 *   updated_at: "2024-01-15T10:30:00.000Z"
 * }
 * ```
 */
export interface DBMusicKit extends DBLoadoutRecord {
  /** Music kit identifier */
  musicid: number
}

// ============================================================================
// PIN INTERFACES
// ============================================================================

/**
 * Pin database record
 *
 * @description Represents pin configurations in the wp_player_pins table
 *
 * @example
 * ```typescript
 * const pin: DBPin = {
 *   id: "pin_123",
 *   steamid: "76561198000000000",
 *   loadoutid: "loadout_123",
 *   active: true,
 *   team: TeamSide.Terrorist, // Note: Pins are not team-specific in practice
 *   pinid: 1,
 *   created_at: "2024-01-15T10:30:00.000Z",
 *   updated_at: "2024-01-15T10:30:00.000Z"
 * }
 * ```
 */
export interface DBPin extends DBLoadoutRecord {
  /** Pin identifier */
  pinid: number
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Union type of all database record types
 */
export type DBAnyRecord = DBLoadout | DBWeapon | DBKnife | DBGlove | DBAgent | DBMusicKit | DBPin

/**
 * Union type of all item-related database records
 */
export type DBItemRecord = DBWeapon | DBKnife | DBGlove | DBAgent | DBMusicKit | DBPin

/**
 * Extract the table name for a database record type
 */
export type DBTableName<T extends DBAnyRecord> = T extends DBLoadout
  ? 'wp_player_loadouts'
  : T extends DBRifle
    ? 'wp_player_rifles'
    : T extends DBPistol
      ? 'wp_player_pistols'
      : T extends DBSMG
        ? 'wp_player_smgs'
        : T extends DBHeavy
          ? 'wp_player_heavys'
          : T extends DBKnife
            ? 'wp_player_knifes'
            : T extends DBGlove
              ? 'wp_player_gloves'
              : T extends DBAgent
                ? 'wp_player_agents'
                : T extends DBMusicKit
                  ? 'wp_player_music'
                  : T extends DBPin
                    ? 'wp_player_pins'
                    : never
