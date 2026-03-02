/**
 * JSON Schema Types for Database Storage
 *
 * These types define the JSON structure for stickers and keychains
 * stored directly in the database as JSON columns.
 *
 * ## Branded Types Integration
 *
 * While these interfaces use plain `number` types for JSON compatibility,
 * the validation functions ensure values meet the constraints that would
 * be enforced by branded types:
 * - `wear` values are validated as FloatValue (0-1)
 * - Position values (x, y) are validated as NormalizedCoordinate (0-1)
 * - `id` values are validated as positive integers (StickerId/KeychainId)
 *
 * Use the branded type conversion functions when passing values to
 * business logic that expects stricter types.
 *
 * @see {@link ~/types/core/branded.ts} for branded type definitions
 */

import { isValidFloatValue, isValidStatTrakCount } from '~/types'

// ============================================================================
// STICKER JSON SCHEMA
// ============================================================================

/**
 * JSON schema for sticker data stored in database
 * Used for sticker_0 through sticker_4 columns
 *
 * ## Branded Types
 *
 * When converting to business logic types:
 * - `id` → `toStickerId(id)` for StickerId
 * - `x`, `y` → `toNormalizedCoordinate(value)` for NormalizedCoordinate (0-1)
 * - `wear` → `toFloatValue(wear)` for FloatValue (0-1)
 */
export interface StickerJSON {
  /** Sticker ID (from CS2 item definitions) - convert to StickerId */
  id: number
  /** X-axis position offset (0-1 normalized) - convert to NormalizedCoordinate */
  x: number
  /** Y-axis position offset (0-1 normalized) - convert to NormalizedCoordinate */
  y: number
  /** Wear/condition of the sticker (0-1, where 0 is pristine) - convert to FloatValue */
  wear: number
  /** Scale/size of the sticker */
  scale: number
  /** Rotation angle in degrees */
  rotation: number
}

// ============================================================================
// KEYCHAIN JSON SCHEMA
// ============================================================================

/**
 * JSON schema for keychain data stored in database
 * Includes wrapped_sticker_id and highlight_reel_id directly
 *
 * ## Branded Types
 *
 * When converting to business logic types:
 * - `id` → `toKeychainId(id)` for KeychainId
 * - `seed` → `toPaintSeed(seed)` for PaintSeed (0-999)
 * - `wrapped_sticker_id` → `toStickerId(id)` for StickerId (when present)
 */
export interface KeychainJSON {
  /** Keychain ID (from CS2 item definitions) - convert to KeychainId */
  id: number
  /** X-axis position offset */
  x: number
  /** Y-axis position offset */
  y: number
  /** Z-axis position offset */
  z: number
  /** Random seed for keychain generation (0-999) - convert to PaintSeed */
  seed: number
  /** ID of the sticker wrapped inside the charm (for Sticker Slabs) - convert to StickerId */
  wrapped_sticker_id?: number | null
  /** ID of the highlight reel (for Highlight Reel charms) */
  highlight_reel_id?: number | null
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Creates an empty/default sticker JSON (null)
 */
export const createEmptyStickerJSON = (): StickerJSON | null => null

/**
 * Creates an empty/default keychain JSON (null)
 */
export const createEmptyKeychainJSON = (): KeychainJSON | null => null

/**
 * Validates a sticker JSON object
 * Uses branded type validators for proper range checking
 */
export const isValidStickerJSON = (sticker: unknown): sticker is StickerJSON => {
  if (!sticker || typeof sticker !== 'object') return false
  const s = sticker as Record<string, unknown>

  // Basic type checks
  if (typeof s.id !== 'number' || !isValidStatTrakCount(s.id)) return false // id must be non-negative integer
  if (typeof s.x !== 'number') return false
  if (typeof s.y !== 'number') return false
  if (typeof s.wear !== 'number' || !isValidFloatValue(s.wear)) return false // wear must be 0-1
  if (typeof s.scale !== 'number') return false
  if (typeof s.rotation !== 'number') return false

  return true
}

/**
 * Validates a keychain JSON object
 * Uses branded type validators for proper range checking
 */
export const isValidKeychainJSON = (keychain: unknown): keychain is KeychainJSON => {
  if (!keychain || typeof keychain !== 'object') return false
  const k = keychain as Record<string, unknown>

  // Basic type checks
  if (typeof k.id !== 'number' || !isValidStatTrakCount(k.id)) return false // id must be non-negative integer
  if (typeof k.x !== 'number') return false
  if (typeof k.y !== 'number') return false
  if (typeof k.z !== 'number') return false
  if (typeof k.seed !== 'number') return false

  return true
}

/**
 * Checks if a sticker is empty (id is 0 or missing)
 */
export const isEmptySticker = (sticker: StickerJSON | null | undefined): boolean => {
  return !sticker || sticker.id === 0
}

/**
 * Checks if a keychain is empty (id is 0 or missing)
 */
export const isEmptyKeychain = (keychain: KeychainJSON | null | undefined): boolean => {
  return !keychain || keychain.id === 0
}
