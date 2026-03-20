/**
 * Coordinate transformation utilities for the visual customizer
 */

import type { Point, Size, CoordinateTransform, CanvasElement } from '~/types/canvas'

// Check if we're in development mode
const isDevelopment = import.meta.env.DEV

// Debug logging helper
const debugLog = (...args: unknown[]) => {
  if (isDevelopment) {
    console.log(...args)
  }
}

/**
 * Weapon-specific sticker slot positions
 * These are normalized coordinates (0-1) based on a 1328x800 canvas
 * These represent the DEFAULT positions where stickers appear when no offset_x/offset_y is specified
 */
export const WEAPON_STICKER_SLOT_POSITIONS: Record<string, Record<number, Point>> = {
  awp: {
    // Based on image canvas 1328x384 (not 800). X uses 1328, Y uses 384 as per user-provided reference.
    //0: { x: 0.862, y: 0.573 },  // slot 0: x:1145 y:220 -> 1145/1328=0.862, 220/384=0.5729
    0: { x: 0.8575, y: 0.5907 }, // slot 0: x:610 y:165 -> 610/1328=0.459, 165/384=0.4297
    1: { x: 0.6832, y: 0.4627 }, // slot 1  // slot 1: x:610 y:165 -> 610/1328=0.459, 165/384=0.4297
    2: { x: 0.6218, y: 0.5239 }, // slot 2  // slot 2: x:825 y:200 -> 825/1328=0.621, 200/384=0.5208
    3: { x: 0.558, y: 0.1636 }, // slot 3: x:740 y:100 -> 740/1328=0.557, 100/384=0.2604
    4: { x: 0.8575, y: 0.5907 }, // slot 4: x:915 y:185 -> 915/1328=0.689, 185/384=0.4818
  },
  'ak-47': {
    0: { x: 750 / 1110, y: 80 / 320 }, // slot 0: x:850 y:180 -> 850/1328=0.640, 180/384=0.469
    1: { x: 620 / 1110, y: 62 / 320 }, // slot 1: x:720 y:200 -> 720/1328=0.542, 200/384=0.521
    2: { x: 514 / 1110, y: 55 / 320 }, // slot 2: x:600 y:195 -> 600/1328=0.452, 195/384=0.508
    3: { x: 371 / 1110, y: 50 / 320 }, // slot 3: x:480 y:210 -> 480/1328=0.361, 210/384=0.547
    4: { x: 725 / 1110, y: 57 / 320 }, // slot 4: x:360 y:225 -> 360/1328=0.271, 225/384=0.586
  },
}

/**
 * Weapon-specific keychain positions
 * These are normalized coordinates (0-1)
 */
export const WEAPON_KEYCHAIN_SLOT_POSITIONS: Record<string, Point> = {
  awp: { x: 0.7786, y: 1.076 }, // slot 0 // slot ? // slot ?, // slot ?, // slot 1
  'ak-47': { x: 0.5, y: 0.5 }, // TODO: Calibrate this
}

export function getDefaultKeychainPosition(weaponName?: string): Point {
  if (weaponName) {
    const clean = weaponName
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
    if (WEAPON_KEYCHAIN_SLOT_POSITIONS[clean]) {
      return WEAPON_KEYCHAIN_SLOT_POSITIONS[clean]
    }
  }
  return DEFAULT_KEYCHAIN_POSITION
}

// Reference pixel sizes per weapon for offset conversion
export function getWeaponReferenceSize(weaponName?: string): { width: number; height: number } {
  if (weaponName) {
    const clean = weaponName
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
    if (clean === 'awp') return { width: 1328, height: 384 }
    if (clean === 'ak-47') return { width: 1110, height: 320 }
  }
  // Fallback reference based on earlier default assumption
  return { width: 1120, height: 500 }
}

// External normalization reference denominators per weapon (approximate; tune as needed)
export const EXTERNAL_NORMALIZATION_REFS: Record<string, { x: number; y: number }> = {
  // Calibrated from user samples for AWP
  awp: { x: 1328, y: 384 },
}

export function getExternalNormalizationRefs(weaponName?: string): { x: number; y: number } {
  if (weaponName) {
    const clean = weaponName
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
    const found = EXTERNAL_NORMALIZATION_REFS[clean]
    if (found) return found
  }
  // Generic fallback (can be tuned per project needs)
  return { x: 1328, y: 384 }
}

/**
 * Weapon-specific sticker and keychain display sizes
 * Calculated based on proportional scaling from external reference site
 *
 * Formula: asset_width = weapon_display_width × (external_asset_width / external_weapon_width)
 * External reference:
 * AWP 1385px wide, stickers 96×72, keychains 75×75
 * AK-47 1333,5px wide, 382,5px high, stickers 128x96, keychains 100x100
 * Our canvas: AWP 1110px wide
 */
/**
 * Default (fallback) asset sizes per weapon when no resolution-specific override exists
 */
export const WEAPON_ASSET_SIZES: Record<string, { sticker: Size; keychain: Size }> = {
  awp: {
    sticker: { width: 50, height: 50 }, // 4:3 ratio (1110 × 0.0693 = 77)
    keychain: { width: 60, height: 60 }, // 1:1 ratio ^(1110 × 0.0542 = 60)
  },
  'ak-47': {
    sticker: { width: 120, height: 72 }, // Calculated: 128 * 0.8324
    keychain: { width: 72, height: 72 }, // Calculated: 100 * 0.8324
  },
}

/**
 * Resolution-specific asset size overrides
 * Format: weapon -> 'widthxheight' -> { sticker, keychain }
 * Takes priority over WEAPON_ASSET_SIZES when the video resolution matches
 */
export const WEAPON_ASSET_SIZES_BY_RESOLUTION: Record<
  string,
  Record<string, { sticker: Size; keychain: Size }>
> = {
  // Example: M4A1-S has two resolutions with different framing
  'm4a1-s': {
     '3884x972': { sticker: { width: 80*0.98, height: 60*0.98 }, keychain: { width: 65, height: 65 } },
     '3784x978': { sticker: { width: 80*1.05, height: 60*1.05 }, keychain: { width: 60, height: 60 } },
   },
}

/**
 * Default asset sizes when weapon-specific sizes are not defined
 */
export const DEFAULT_ASSET_SIZES = {
  sticker: { width: 77, height: 58 },
  keychain: { width: 60, height: 60 },
}

/**
 * Get sticker and keychain display sizes for a weapon
 * @param weaponName - weapon name (e.g. 'AWP', 'M4A1-S')
 * @param videoWidth - optional video width for resolution-specific lookup
 * @param videoHeight - optional video height for resolution-specific lookup
 */
export function getWeaponAssetSizes(
  weaponName?: string,
  videoWidth?: number,
  videoHeight?: number
): { sticker: Size; keychain: Size } {
  if (weaponName) {
    const clean = weaponName
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')

    // Check resolution-specific override first
    if (videoWidth && videoHeight) {
      const resKey = `${videoWidth}x${videoHeight}`
      const resOverrides = WEAPON_ASSET_SIZES_BY_RESOLUTION[clean]
      if (resOverrides && resOverrides[resKey]) {
        return resOverrides[resKey]
      }
    }

    // Fall back to weapon-level default
    const found = WEAPON_ASSET_SIZES[clean]
    if (found) return found
  }
  return DEFAULT_ASSET_SIZES
}

/**
 * Default sticker slot positions for weapons not specifically configured
 * These are normalized coordinates (0-1) that represent typical sticker placement areas
 */
export const DEFAULT_STICKER_SLOT_POSITIONS: Record<number, Point> = {
  0: { x: 0.5, y: 0.4 }, // Slightly above center
  1: { x: 0.4, y: 0.5 }, // Left of center
  2: { x: 0.6, y: 0.5 }, // Right of center
  3: { x: 0.5, y: 0.3 }, // Upper center
  4: { x: 0.5, y: 0.6 }, // Lower center
}

/**
 * Default keychain position
 */
export const DEFAULT_KEYCHAIN_POSITION: Point = { x: 0.5, y: 0.5 }

/**
 * Reference resolutions for resolution-aware sticker positioning
 * Used to calculate scaling factors when loaded video differs from standard
 */
export const WEAPON_RESOLUTION_REFS: Record<string, { width: number; height: number }> = {
  awp: { width: 3840, height: 744 },
  'ak-47': { width: 3814, height: 1118 },
}

/**
 * Configurable overrides for specific resolutions
 * Format: weapon -> 'widthxheight' -> adjustment params
 * Used for manual calibration of odd resolutions
 */
export const RESOLUTION_OVERRIDES: Record<
  string,
  Record<string, { scaleX: number; scaleY: number; offsetX: number; offsetY: number }>
> = {
  awp: {
    '3824x770': { scaleX: 1, scaleY: 1, offsetX: -75, offsetY: 10 },
  },
}

/**
 * Get default position for a sticker slot based on weapon type
 */
export function getDefaultStickerPosition(slotIndex: number, weaponName?: string): Point {
  // If weapon name is provided, check for weapon-specific positions
  if (weaponName) {
    const cleanWeaponName = weaponName
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
    const weaponPositions = WEAPON_STICKER_SLOT_POSITIONS[cleanWeaponName]

    if (weaponPositions && weaponPositions[slotIndex]) {
      const position = weaponPositions[slotIndex]
      if (position) {
        debugLog(
          `🎯 Using weapon-specific position for ${cleanWeaponName} slot ${slotIndex}:`,
          position
        )
        return position
      }
    }
  }

  // Fallback to default positions
  const slotPosition = DEFAULT_STICKER_SLOT_POSITIONS[slotIndex]
  if (slotPosition) {
    return slotPosition
  }
  const fallbackPosition = DEFAULT_STICKER_SLOT_POSITIONS[0]
  if (fallbackPosition) {
    return fallbackPosition
  }
  // Ultimate fallback (should never happen, but TypeScript needs it)
  return { x: 0.5, y: 0.5 }
}

/**
 * Create coordinate transformation utilities for a canvas
 */
export function createCoordinateTransform(): CoordinateTransform {
  return {
    /**
     * Convert canvas pixel coordinates to normalized coordinates (0-1)
     */
    canvasToNormalized(canvasCoords: Point, canvasSize: Size): Point {
      return {
        x: Math.max(0, Math.min(1, canvasCoords.x / canvasSize.width)),
        y: Math.max(0, Math.min(1, canvasCoords.y / canvasSize.height)),
      }
    },

    /**
     * Convert normalized coordinates (0-1) to canvas pixel coordinates
     */
    normalizedToCanvas(normalizedCoords: Point, canvasSize: Size): Point {
      return {
        x: normalizedCoords.x * canvasSize.width,
        y: normalizedCoords.y * canvasSize.height,
      }
    },

    /**
     * Validate that coordinates are within valid bounds
     */
    validateCoordinates(coords: Point): boolean {
      return coords.x >= 0 && coords.x <= 1 && coords.y >= 0 && coords.y <= 1
    },
  }
}

/**
 * Sticker input data type with all possible properties
 */
interface StickerInputData {
  id: number | string
  slot?: number
  x?: number
  y?: number
  offset_x?: number
  offset_y?: number
  ext_norm_x?: number
  ext_norm_y?: number
  ext_ref_x?: number
  ext_ref_y?: number
  scale?: number
  rotation?: number
  wear?: number
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
 * Convert existing sticker data to canvas element
 */
/**
 * Generate local sticker image URL based on wear
 * @param stickerId The ID of the sticker
 * @param wear The wear value (0-1)
 * @returns The URL to the sticker image
 */
export function generateStickerImageUrl(stickerId: number | string, wear: number = 0): string {
  const id = stickerId.toString().replace('sticker-', '')

  // Valid wear intervals are 0, 5, 10 ... 100
  // Map the 0-1 float to the closest 0-100 integer step of 5
  const percentage = Math.round(wear * 100)
  const step = Math.round(percentage / 5) * 5
  const clampedStep = Math.max(0, Math.min(100, step))

  try {
    const config = useRuntimeConfig()
    const baseUrl = config.public.assetsUrl
    const stickersPath = config.public.assetsStickerPath

    if (baseUrl && stickersPath) {
      return `${baseUrl}${stickersPath}/${id}/${clampedStep}.webp`
    }
  } catch {
    // Fallback if runtime config is not available (e.g. tests)
  }
  return `/img/stickers/${id}/${clampedStep}.webp`
}

/**
 * Convert existing sticker data to canvas element
 */
export function stickerToCanvasElement(
  sticker: StickerInputData | null | undefined,
  slotIndex: number,
  zIndex: number = 10,
  weaponName?: string
): CanvasElement | null {
  if (!sticker) return null

  // ALWAYS start with the default slot position for this weapon/slot
  const defaultPos = getDefaultStickerPosition(slotIndex, weaponName)
  let x = defaultPos.x
  let y = defaultPos.y

  debugLog(
    `🎯 Starting with default slot position for slot ${slotIndex} on ${weaponName || 'unknown weapon'}:`,
    { x, y }
  )

  // Then apply any offsets on top of the default position
  // 1) Prefer external-normalized offsets if present (saved by VisualCustomizer)
  let applied = false
  const hasExtNormX = typeof sticker.ext_norm_x === 'number' && !isNaN(sticker.ext_norm_x)
  const hasExtNormY = typeof sticker.ext_norm_y === 'number' && !isNaN(sticker.ext_norm_y)
  if (hasExtNormX || hasExtNormY) {
    const { x: defaultExtRefX, y: defaultExtRefY } = getExternalNormalizationRefs(weaponName)
    const extRefX =
      typeof sticker.ext_ref_x === 'number' && !isNaN(sticker.ext_ref_x)
        ? sticker.ext_ref_x
        : defaultExtRefX
    const extRefY =
      typeof sticker.ext_ref_y === 'number' && !isNaN(sticker.ext_ref_y)
        ? sticker.ext_ref_y
        : defaultExtRefY
    const REF_WIDTH = 1328
    const REF_HEIGHT = 384
    const dxNorm =
      (hasExtNormX && sticker.ext_norm_x !== undefined ? sticker.ext_norm_x : 0) *
      (extRefX / REF_WIDTH)
    const dyNorm =
      (hasExtNormY && sticker.ext_norm_y !== undefined ? sticker.ext_norm_y : 0) *
      (extRefY / REF_HEIGHT)
    x += dxNorm
    y += dyNorm
    applied = true
    debugLog(`📐 Applied ext-normalized offsets for slot ${slotIndex}:`, {
      dxNorm,
      dyNorm,
      final_x: x,
      final_y: y,
    })
  }

  // 2) Otherwise, assume DB x/y are ext-normalized (new format). If values look large, fall back to pixel offsets (legacy).
  if (!applied) {
    const hasXY =
      (typeof sticker.x === 'number' && !isNaN(sticker.x)) ||
      (typeof sticker.y === 'number' && !isNaN(sticker.y))
    const looksLikeExt =
      hasXY &&
      ((typeof sticker.x === 'number' && Math.abs(sticker.x) <= 2) ||
        (typeof sticker.y === 'number' && Math.abs(sticker.y) <= 2))

    if (looksLikeExt) {
      const { x: extRefX, y: extRefY } = getExternalNormalizationRefs(weaponName)
      const REF_WIDTH = 1328
      const REF_HEIGHT = 384
      const dxNorm = (typeof sticker.x === 'number' ? sticker.x : 0) * (extRefX / REF_WIDTH)
      const dyNorm = (typeof sticker.y === 'number' ? sticker.y : 0) * (extRefY / REF_HEIGHT)
      x += dxNorm
      y += dyNorm
      applied = true
      debugLog(`📐 Applied DB ext-normalized x/y for slot ${slotIndex}:`, {
        dxNorm,
        dyNorm,
        final_x: x,
        final_y: y,
      })
    }
  }

  // 3) Legacy pixel offsets fallthrough
  if (!applied) {
    const hasExplicitOffsets =
      typeof sticker.offset_x === 'number' &&
      !isNaN(sticker.offset_x) &&
      typeof sticker.offset_y === 'number' &&
      !isNaN(sticker.offset_y)
    const ref = getWeaponReferenceSize(weaponName)
    const pxOffsetX = hasExplicitOffsets
      ? (sticker.offset_x ?? 0)
      : typeof sticker.x === 'number'
        ? sticker.x
        : 0
    const pxOffsetY = hasExplicitOffsets
      ? (sticker.offset_y ?? 0)
      : typeof sticker.y === 'number'
        ? sticker.y
        : 0
    if (pxOffsetX || pxOffsetY) {
      x += pxOffsetX / ref.width
      y += pxOffsetY / ref.height
      debugLog(`📍 Applied pixel offsets to default for slot ${slotIndex}:`, {
        pxOffsetX,
        pxOffsetY,
        final_x: x,
        final_y: y,
      })
    }
  }

  const scale = typeof sticker.scale === 'number' && !isNaN(sticker.scale) ? sticker.scale : 1.0
  const rotation =
    typeof sticker.rotation === 'number' && !isNaN(sticker.rotation) ? sticker.rotation : 0
  const wear = typeof sticker.wear === 'number' && !isNaN(sticker.wear) ? sticker.wear : 0

  // Use generated URL for the image
  const imageUrl = generateStickerImageUrl(sticker.id, wear)

  return {
    id: `sticker-${slotIndex}-${Date.now()}`,
    type: 'sticker' as const,
    assetId: sticker.id.toString(),
    position: {
      x: Math.max(0, Math.min(1, x)),
      y: Math.max(0, Math.min(1, y)),
    },
    scale: Math.max(0.1, Math.min(3, scale)),
    rotation: rotation % 360,
    wear: Math.max(0, Math.min(1, wear)),
    zIndex,
    selected: false,
    slotIndex,
    apiData: {
      name: sticker.api?.name || 'Unknown Sticker',
      image: imageUrl,
      rarity:
        sticker.api?.rarity && sticker.api.rarity.color && sticker.api.rarity.name
          ? {
              color: sticker.api.rarity.color,
              name: sticker.api.rarity.name,
            }
          : undefined,
    },
  }
}

/**
 * Sanitize charm name to match scraper's file naming convention
 * Replaces non-alphanumeric characters with underscores and lowercases
 */
export function sanitizeCharmName(name: string): string {
  // Remove "Charm | " or "Souvenir Charm | " prefix if present (case insensitive)
  const cleanName = name.replace(/^(souvenir\s+)?charm\s*\|\s*/i, '').trim()
  return cleanName.replace(/[^a-z0-9]/gi, '_').toLowerCase()
}

/**
 * Generate local flat image URL for a keychain/charm
 * Matches the file structure from the charm scraper service
 * @param name The name of the keychain
 * @param seed The seed (optional, defaults to 0)
 * @param stickerRarityId The rarity ID of the wrapped sticker (optional, for sticker slabs)
 * @param wrappedStickerId The ID of the wrapped sticker (optional, for sticker slabs)
 */
export function generateFlatKeychainUrl(
  name: string,
  seed: number = 0,
  stickerRarityId?: string,
  wrappedStickerId?: number
): string {
  const safeName = sanitizeCharmName(name)
  let baseUrl = ''
  let charmsPath = ''

  try {
    const config = useRuntimeConfig()
    baseUrl = (config.public.assetsUrl as string) || ''
    charmsPath = (config.public.assetsCharmsPath as string) || ''
  } catch {
    // Fallback
    baseUrl = ''
    charmsPath = '/img/charms'
  }

  // Special handling for Sticker Slabs in grid view (based on name)
  // If we have a stickerRarityId passed (from the modal), use that to select the correct slab image
  if (safeName.includes('sticker_slab')) {
    // If we have a specific wrapped sticker ID, use the pre-generated image
    if (wrappedStickerId) {
      if (baseUrl) {
        // Remote: assets.cu.sakoa.xyz/cs2inspect/charms / sticker_slab / sticker_slab_sticker_ {id} .webp
        return `${baseUrl}${charmsPath}/sticker_slab/sticker_slab_sticker_${wrappedStickerId}.webp`
      }
      return `/img/charms/sticker_slab/sticker_slab_sticker_${wrappedStickerId}.webp`
    }

    if (baseUrl) {
      return `${baseUrl}${charmsPath}/sticker_slab/sticker_slab_default_empty.webp`
    }
    return `/img/charms/sticker_slab/sticker_slab_default_empty.webp`
  }
  // Seeds supported by the scraper
  const SUPPORTED_SEEDS = [1, 10000, 20000, 30000, 40000, 50000, 60000, 70000, 80000, 90000]

  // If seed matches one of the downloaded variants, use it
  if (SUPPORTED_SEEDS.includes(seed)) {
    if (baseUrl) {
      return `${baseUrl}${charmsPath}/${safeName}/${safeName}_seed_${seed}.webp`
    }
    return `/img/charms/${safeName}/${safeName}_seed_${seed}.webp`
  }

  // Otherwise use the default image (usually seed 100)
  if (baseUrl) {
    return `${baseUrl}${charmsPath}/${safeName}/${safeName}_default.webp`
  }
  return `/img/charms/${safeName}/${safeName}_default.webp`
}

/**
 * Keychain input data type with all possible properties
 */
interface KeychainInputData {
  id: number | string
  x?: number
  y?: number
  z?: number
  offset_x?: number // External offset from Steam
  offset_y?: number // External offset from Steam
  offset_z?: number // External offset from Steam
  seed?: number
  scale?: number
  rotation?: number
  api?: {
    name?: string
    image?: string
    rarity?: {
      color?: string
      name?: string
    }
  }
  wrapped_sticker_id?: number | null
  highlight_reel_id?: number | null
  // Optional: Pass full wrapped sticker object to determine rarity for the slab image
  wrapped_sticker?: {
    rarity?: {
      id?: string
      name?: string
      color?: string
    }
  }
}

/**
 * Convert existing keychain data to canvas element
 *
 * Keychains can have coordinates in three formats:
 * 1. Steam Percentage Offsets (offset_x, offset_y): 0-100 range from imports
 * 2. Raw decimal offsets: x, y values that are small (e.g. 0.07)
 * 3. Absolute normalized positions: 0-1 range (our internal format)
 */
export function keychainToCanvasElement(
  keychain: KeychainInputData | null | undefined,
  zIndex: number = 5,
  weaponName?: string
): CanvasElement | null {
  if (!keychain) return null

  // Start with default keychain position (based on weapon or center)
  const defaultPos = getDefaultKeychainPosition(weaponName)
  let x = defaultPos.x
  let y = defaultPos.y

  // Robustly extract the raw coordinate values
  const rawX =
    typeof keychain.offset_x === 'number'
      ? keychain.offset_x
      : typeof keychain.x === 'number'
        ? keychain.x
        : null
  const rawY =
    typeof keychain.offset_y === 'number'
      ? keychain.offset_y
      : typeof keychain.y === 'number'
        ? keychain.y
        : null

  if (rawX !== null || rawY !== null) {
    const vx = rawX || 0
    const vy = rawY || 0

    // Determine type of input: percentage (0-100) or decimal
    // High values or presence of 'offset_x' indicate Steam-style percentages
    const isPercentage =
      typeof keychain.offset_x === 'number' || Math.abs(vx) > 1.5 || Math.abs(vy) > 1.5

    // Check if it's an absolute position (0-1 range) or an offset
    // If it's EXTREMELY close to the default center (0.5), treat as offset 0
    // But basic heuristic: if it looks like a normalized coord, use it.
    const isAbsolute =
      !isPercentage &&
      vx > 0 &&
      vx < 1 &&
      vy > 0 &&
      vy < 1 &&
      (Math.abs(vx - 0.5) > 0.001 || Math.abs(vy - 0.5) > 0.001)

    if (isAbsolute) {
      x = vx
      y = vy
      debugLog(`📍 Keychain using absolute normalized position:`, { x, y })
    } else {
      // It's an offset (percentage). Convert to decimal and add to default position.
      // Keychain offsets are simple: divide by 100 to get normalized offset
      const dxNorm = isPercentage ? vx / 100 : vx
      const dyNorm = isPercentage ? vy / 100 : vy

      // Add to weapon-specific default position
      x += dxNorm
      y += dyNorm

      debugLog(
        `📐 Keychain offsets applied [${isPercentage ? 'percentage' : 'decimal'}] to base [${defaultPos.x}, ${defaultPos.y}]:`,
        { vx, vy, dxNorm, dyNorm, final_x: x, final_y: y }
      )
    }
  }

  // Clamp to valid range - REMOVED to allow out of bounds
  // x = Math.max(0, Math.min(1, x))
  // y = Math.max(0, Math.min(1, y))

  const scale = typeof keychain.scale === 'number' && !isNaN(keychain.scale) ? keychain.scale : 1.0
  const rotation =
    typeof keychain.rotation === 'number' && !isNaN(keychain.rotation) ? keychain.rotation : 0

  // Optimize image URL: prefer local flat image if available
  const keychainName = keychain.api?.name || 'Unknown Keychain'
  let flatImageUrl = ''

  // Optimize image URL: prefer local flat image if available
  const seed = typeof keychain.seed === 'number' && !isNaN(keychain.seed) ? keychain.seed : 0
  flatImageUrl = generateFlatKeychainUrl(
    keychainName,
    seed,
    keychain.wrapped_sticker?.rarity?.id,
    keychain.wrapped_sticker_id || undefined
  )

  return {
    id: `keychain-${Date.now()}`,
    type: 'keychain' as const,
    assetId: keychain.id.toString(),
    position: { x, y },
    scale: Math.max(0.1, Math.min(3, scale)),
    rotation: rotation % 360,
    zIndex,
    selected: false,
    slotIndex: null,
    z:
      typeof keychain.offset_z === 'number'
        ? keychain.offset_z
        : typeof keychain.z === 'number'
          ? keychain.z
          : 0,
    seed,
    wrapped_sticker_id:
      typeof keychain.wrapped_sticker_id === 'number' ? keychain.wrapped_sticker_id : undefined,
    highlight_reel_id:
      typeof keychain.highlight_reel_id === 'number' ? keychain.highlight_reel_id : undefined,
    apiData: {
      name: keychainName,
      image: flatImageUrl, // Use the flat image URL
      rarity:
        keychain.api?.rarity && keychain.api.rarity.color && keychain.api.rarity.name
          ? {
              color: keychain.api.rarity.color,
              name: keychain.api.rarity.name,
            }
          : undefined,
    },
  }
}

/**
 * Sticker output data format
 */
interface StickerOutputData {
  id: string
  slot: number | null | undefined
  name: string
  image: string
  position: number
  x: number
  y: number
  wear: number
  scale: number
  rotation: number
  api: {
    name: string
    image: string
    rarity?: {
      color: string
      name: string
    }
  }
}

/**
 * Convert canvas element back to sticker data format
 *
 * @param element - The canvas element to convert
 * @param weaponName - The weapon name, used to calculate offset from default slot position
 */
export function canvasElementToSticker(
  element: CanvasElement | null | undefined,
  weaponName?: string
): StickerOutputData | null {
  if (!element || element.type !== 'sticker') return null

  // Calculate offset from default slot position
  // The offset must be saved in the same format that stickerToCanvasElement() expects
  // stickerToCanvasElement() applies: x += sticker.x * (extRefX / REF_WIDTH)
  // So we need to divide by that factor when saving to get symmetrical behavior
  const slotIndex = typeof element.slotIndex === 'number' ? element.slotIndex : 0
  const defaultPos = getDefaultStickerPosition(slotIndex, weaponName)

  const REF_WIDTH = 1328
  const REF_HEIGHT = 384
  const { x: extRefX, y: extRefY } = getExternalNormalizationRefs(weaponName)

  // Raw normalized offset
  const rawOffsetX = element.position.x - defaultPos.x
  const rawOffsetY = element.position.y - defaultPos.y

  // Convert to ext-normalized format (inverse of loading transformation)
  const offsetX = rawOffsetX / (extRefX / REF_WIDTH)
  const offsetY = rawOffsetY / (extRefY / REF_HEIGHT)

  return {
    id: element.assetId,
    slot: element.slotIndex,
    name: element.apiData?.name || 'Unknown Sticker',
    image: element.apiData?.image || '',
    position: typeof element.slotIndex === 'number' ? element.slotIndex : 0,
    x: offsetX, // Save as ext-normalized offset
    y: offsetY, // Save as ext-normalized offset
    wear: element.wear || 0,
    scale: element.scale,
    rotation: element.rotation,
    api: element.apiData,
  }
}

/**
 * Keychain output data format
 */
interface KeychainOutputData {
  id: string
  name: string
  image: string
  x: number
  y: number
  z: number
  seed: number
  wrapped_sticker_id?: number
  highlight_reel_id?: number
  api: {
    name: string
    image: string
    rarity?: {
      color: string
      name: string
    }
  }
}

/**
 * Convert canvas element back to keychain data format
 *
 * @param element - The canvas element to convert
 * @param weaponName - The weapon name, used to calculate offset from default position
 */
export function canvasElementToKeychain(
  element: CanvasElement | null | undefined,
  weaponName?: string
): KeychainOutputData | null {
  if (!element || element.type !== 'keychain') return null

  // Calculate offset from default keychain position
  const defaultPos = getDefaultKeychainPosition(weaponName)

  // Raw normalized offset from default position
  const rawOffsetX = element.position.x - defaultPos.x
  const rawOffsetY = element.position.y - defaultPos.y

  // Convert back to Steam offset format (inverse of loading)
  // Loading was: x = default_x + (offset / 100)
  // Inverse: offset = (x - default_x) * 100
  const offsetX = rawOffsetX * 100
  const offsetY = rawOffsetY * 100

  return {
    id: element.assetId,
    name: element.apiData?.name || 'Unknown Keychain',
    image: element.apiData?.image || '',
    x: offsetX, // Save in percentage format for symmetry with Steam
    y: offsetY, // Save in percentage format for symmetry with Steam
    z: element.z || 0,
    seed: element.seed || 0,
    wrapped_sticker_id: element.wrapped_sticker_id || undefined,
    highlight_reel_id: element.highlight_reel_id || undefined,
    api: element.apiData,
  }
}

/**
 * Generate flat weapon skin image URL
 * This assumes flat images are stored in a specific directory structure
 */
export function generateFlatImageUrl(weaponName: string, skinName: string): string {
  // Convert weapon and skin names to URL-friendly format
  const cleanWeaponName = weaponName
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
  const cleanSkinName = skinName
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')

  let baseUrl = ''
  let weaponsPath = ''

  try {
    const config = useRuntimeConfig()
    baseUrl = (config.public.assetsUrl as string) || ''
    weaponsPath = (config.public.assetsWeaponsPath as string) || ''
  } catch {
    baseUrl = ''
    weaponsPath = '/img/weapons'
  }

  // Try flat image first, fallback to default weapon image
  if (baseUrl) {
    return `${baseUrl}${weaponsPath}/${cleanWeaponName}-${cleanSkinName}.png`
  }
  const flatImageUrl = `/img/weapons/${cleanWeaponName}-${cleanSkinName}.png`

  return flatImageUrl
}

/**
 * Generate fallback weapon image URL for when flat image is not available
 */
export function generateFallbackWeaponImageUrl(weaponName: string): string {
  // Map common weapon names to default image names
  const weaponMapping: Record<string, string> = {
    'ak-47': 'weapon_ak47',
    ak47: 'weapon_ak47',
    m4a4: 'weapon_m4a1',
    'm4a1-s': 'weapon_m4a1_silencer',
    awp: 'weapon_awp',
    'glock-18': 'weapon_glock',
    'usp-s': 'weapon_hkp2000',
    deagle: 'weapon_deagle',
    'desert-eagle': 'weapon_deagle',
    p250: 'weapon_p250',
    'five-seven': 'weapon_fiveseven',
    'tec-9': 'weapon_tec9',
    'cz75-auto': 'weapon_cz75a',
    'r8-revolver': 'weapon_revolver',
    'dual-berettas': 'weapon_elite',
    p90: 'weapon_p90',
    mp7: 'weapon_mp7',
    mp9: 'weapon_mp9',
    'mp5-sd': 'weapon_mp5sd',
    'ump-45': 'weapon_ump45',
    'pp-bizon': 'weapon_bizon',
    'mac-10': 'weapon_mac10',
    famas: 'weapon_famas',
    'galil-ar': 'weapon_galilar',
    aug: 'weapon_aug',
    'sg-553': 'weapon_sg553',
    'ssg-08': 'weapon_ssg08',
    'scar-20': 'weapon_scar20',
    g3sg1: 'weapon_g3sg1',
    nova: 'weapon_nova',
    xm1014: 'weapon_xm1014',
    'mag-7': 'weapon_mag7',
    'sawed-off': 'weapon_sawedoff',
    m249: 'weapon_m249',
    negev: 'weapon_negev',
  }

  const cleanWeaponName = weaponName
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
  const defaultImageName = weaponMapping[cleanWeaponName] || 'weapon_ak47' // fallback to AK-47

  return `/img/defaults/${defaultImageName}.webp`
}

/**
 * Generate flat image URL for default weapon skin (paintindex=0)
 * Uses the new flat PNG files in public/img/defaults/
 */
export function generateDefaultFlatImageUrl(weaponDisplayName: string): string {
  const cleanName = weaponDisplayName
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')

  let baseUrl = ''
  let weaponsPath = ''

  try {
    const config = useRuntimeConfig()
    baseUrl = (config.public.assetsUrl as string) || ''
    weaponsPath = (config.public.assetsWeaponsPath as string) || ''
  } catch {
    baseUrl = ''
    weaponsPath = ''
  }

  if (baseUrl) {
    return `${baseUrl}${weaponsPath}/${cleanName}-default.png`
  }

  return `/img/defaults/${cleanName}-default.png`
}

/**
 * Calculate distance between two points
 */
export function distance(p1: Point, p2: Point): number {
  const dx = p2.x - p1.x
  const dy = p2.y - p1.y
  return Math.sqrt(dx * dx + dy * dy)
}

/**
 * Check if a point is within a rectangular bounds
 */
export function isPointInBounds(
  point: Point,
  bounds: { x: number; y: number; width: number; height: number }
): boolean {
  return (
    point.x >= bounds.x &&
    point.x <= bounds.x + bounds.width &&
    point.y >= bounds.y &&
    point.y <= bounds.y + bounds.height
  )
}
