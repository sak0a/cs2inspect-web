/**
 * Coordinate transformation utilities for the visual customizer
 */

import type { Point, Size, CoordinateTransform } from '~/types/canvas'

/**
 * Weapon-specific sticker slot positions
 * These are normalized coordinates (0-1) based on a 1328x800 canvas
 * These represent the DEFAULT positions where stickers appear when no offset_x/offset_y is specified
 */
export const WEAPON_STICKER_SLOT_POSITIONS: Record<string, Record<number, Point>> = {
  'awp': {
    // Based on image canvas 1328x384 (not 800). X uses 1328, Y uses 384 as per user-provided reference.
    0: { x: 0.862, y: 0.573 },  // slot 0: x:1145 y:220 -> 1145/1328=0.862, 220/384=0.5729
    1: { x: 0.459, y: 0.430 },  // slot 1: x:610 y:165 -> 610/1328=0.459, 165/384=0.4297
    2: { x: 0.621, y: 0.521 },  // slot 2: x:825 y:200 -> 825/1328=0.621, 200/384=0.5208
    3: { x: 0.557, y: 0.260 },  // slot 3: x:740 y:100 -> 740/1328=0.557, 100/384=0.2604
    4: { x: 0.689, y: 0.482 }   // slot 4: x:915 y:185 -> 915/1328=0.689, 185/384=0.4818
  }
}

// Reference pixel sizes per weapon for offset conversion
export function getWeaponReferenceSize(weaponName?: string): { width: number; height: number } {
  if (weaponName) {
    const clean = weaponName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
    if (clean === 'awp') return { width: 1328, height: 384 }
  }
  // Fallback reference based on earlier default assumption
  return { width: 1328, height: 800 }
}

// External normalization reference denominators per weapon (approximate; tune as needed)
export const EXTERNAL_NORMALIZATION_REFS: Record<string, { x: number; y: number }> = {
  // Calibrated from user samples for AWP
  awp: { x: 1363, y: 1725 }
}

export function getExternalNormalizationRefs(weaponName?: string): { x: number; y: number } {
  if (weaponName) {
    const clean = weaponName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
    const found = EXTERNAL_NORMALIZATION_REFS[clean]
    if (found) return found
  }
  // Generic fallback (can be tuned per project needs)
  return { x: 1363, y: 1161 }
}

/**
 * Default sticker slot positions for weapons not specifically configured
 * These are normalized coordinates (0-1) that represent typical sticker placement areas
 */
export const DEFAULT_STICKER_SLOT_POSITIONS: Record<number, Point> = {
  0: { x: 0.5, y: 0.4 },   // Slightly above center
  1: { x: 0.4, y: 0.5 },   // Left of center
  2: { x: 0.6, y: 0.5 },   // Right of center
  3: { x: 0.5, y: 0.3 },   // Upper center
  4: { x: 0.5, y: 0.6 }    // Lower center
}

/**
 * Default keychain position
 */
export const DEFAULT_KEYCHAIN_POSITION: Point = { x: 0.5, y: 0.5 }

/**
 * Get default position for a sticker slot based on weapon type
 */
export function getDefaultStickerPosition(slotIndex: number, weaponName?: string): Point {
  // If weapon name is provided, check for weapon-specific positions
  if (weaponName) {
    const cleanWeaponName = weaponName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
    const weaponPositions = WEAPON_STICKER_SLOT_POSITIONS[cleanWeaponName]

    if (weaponPositions && weaponPositions[slotIndex]) {
      console.log(`🎯 Using weapon-specific position for ${cleanWeaponName} slot ${slotIndex}:`, weaponPositions[slotIndex])
      return weaponPositions[slotIndex]
    }
  }

  // Fallback to default positions
  return DEFAULT_STICKER_SLOT_POSITIONS[slotIndex] || DEFAULT_STICKER_SLOT_POSITIONS[0]
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
        y: Math.max(0, Math.min(1, canvasCoords.y / canvasSize.height))
      }
    },

    /**
     * Convert normalized coordinates (0-1) to canvas pixel coordinates
     */
    normalizedToCanvas(normalizedCoords: Point, canvasSize: Size): Point {
      return {
        x: normalizedCoords.x * canvasSize.width,
        y: normalizedCoords.y * canvasSize.height
      }
    },

    /**
     * Validate that coordinates are within valid bounds
     */
    validateCoordinates(coords: Point): boolean {
      return coords.x >= 0 && coords.x <= 1 && coords.y >= 0 && coords.y <= 1
    }
  }
}

/**
 * Convert existing sticker data to canvas element
 */
export function stickerToCanvasElement(
  sticker: any,
  slotIndex: number,
  zIndex: number = 10,
  weaponName?: string
): any {
  if (!sticker) return null

  // ALWAYS start with the default slot position for this weapon/slot
  const defaultPos = getDefaultStickerPosition(slotIndex, weaponName)
  let x = defaultPos.x
  let y = defaultPos.y

  console.log(`🎯 Starting with default slot position for slot ${slotIndex} on ${weaponName || 'unknown weapon'}:`, { x, y })

  // Then apply any offsets on top of the default position
  // 1) Prefer external-normalized offsets if present (saved by VisualCustomizer)
  let applied = false
  const hasExtNormX = typeof sticker.ext_norm_x === 'number' && !isNaN(sticker.ext_norm_x)
  const hasExtNormY = typeof sticker.ext_norm_y === 'number' && !isNaN(sticker.ext_norm_y)
  if (hasExtNormX || hasExtNormY) {
    const { x: defaultExtRefX, y: defaultExtRefY } = getExternalNormalizationRefs(weaponName)
    const extRefX = typeof sticker.ext_ref_x === 'number' && !isNaN(sticker.ext_ref_x) ? sticker.ext_ref_x : defaultExtRefX
    const extRefY = typeof sticker.ext_ref_y === 'number' && !isNaN(sticker.ext_ref_y) ? sticker.ext_ref_y : defaultExtRefY
    const REF_WIDTH = 1328
    const REF_HEIGHT = 384
    const dxNorm = (hasExtNormX ? sticker.ext_norm_x : 0) * (extRefX / REF_WIDTH)
    const dyNorm = (hasExtNormY ? sticker.ext_norm_y : 0) * (extRefY / REF_HEIGHT)
    x += dxNorm
    y += dyNorm
    applied = true
    console.log(`📐 Applied ext-normalized offsets for slot ${slotIndex}:`, { dxNorm, dyNorm, final_x: x, final_y: y })
  }

  // 2) Otherwise, assume DB x/y are ext-normalized (new format). If values look large, fall back to pixel offsets (legacy).
  if (!applied) {
    const hasXY = (typeof sticker.x === 'number' && !isNaN(sticker.x)) || (typeof sticker.y === 'number' && !isNaN(sticker.y))
    const looksLikeExt = hasXY && (
      (typeof sticker.x === 'number' && Math.abs(sticker.x) <= 2) ||
      (typeof sticker.y === 'number' && Math.abs(sticker.y) <= 2)
    )

    if (looksLikeExt) {
      const { x: extRefX, y: extRefY } = getExternalNormalizationRefs(weaponName)
      const REF_WIDTH = 1328
      const REF_HEIGHT = 384
      const dxNorm = (typeof sticker.x === 'number' ? sticker.x : 0) * (extRefX / REF_WIDTH)
      const dyNorm = (typeof sticker.y === 'number' ? sticker.y : 0) * (extRefY / REF_HEIGHT)
      x += dxNorm
      y += dyNorm
      applied = true
      console.log(`📐 Applied DB ext-normalized x/y for slot ${slotIndex}:`, { dxNorm, dyNorm, final_x: x, final_y: y })
    }
  }

  // 3) Legacy pixel offsets fallthrough
  if (!applied) {
    const hasExplicitOffsets = typeof sticker.offset_x === 'number' && !isNaN(sticker.offset_x) &&
                               typeof sticker.offset_y === 'number' && !isNaN(sticker.offset_y)
    const ref = getWeaponReferenceSize(weaponName)
    const pxOffsetX = hasExplicitOffsets ? sticker.offset_x : (typeof sticker.x === 'number' ? sticker.x : 0)
    const pxOffsetY = hasExplicitOffsets ? sticker.offset_y : (typeof sticker.y === 'number' ? sticker.y : 0)
    if (pxOffsetX || pxOffsetY) {
      x += (pxOffsetX / ref.width)
      y += (pxOffsetY / ref.height)
      console.log(`📍 Applied pixel offsets to default for slot ${slotIndex}:`, {
        pxOffsetX,
        pxOffsetY,
        final_x: x,
        final_y: y
      })
    }
  }


  const scale = typeof sticker.scale === 'number' && !isNaN(sticker.scale) ? sticker.scale : 1.0
  const rotation = typeof sticker.rotation === 'number' && !isNaN(sticker.rotation) ? sticker.rotation : 0
  const wear = typeof sticker.wear === 'number' && !isNaN(sticker.wear) ? sticker.wear : 0

  return {
    id: `sticker-${slotIndex}-${Date.now()}`,
    type: 'sticker' as const,
    assetId: sticker.id.toString(),
    position: {
      x: Math.max(0, Math.min(1, x)),
      y: Math.max(0, Math.min(1, y))
    },
    scale: Math.max(0.1, Math.min(3, scale)),
    rotation: rotation % 360,
    wear: Math.max(0, Math.min(1, wear)),
    zIndex,
    selected: false,
    slotIndex,
    apiData: {
      name: sticker.api?.name || 'Unknown Sticker',
      image: sticker.api?.image || '',
      rarity: sticker.api?.rarity
    }
  }
}

/**
 * Convert existing keychain data to canvas element
 */
export function keychainToCanvasElement(
  keychain: any,
  zIndex: number = 5
): any {
  if (!keychain) return null

  // Ensure coordinates are valid numbers
  let x = typeof keychain.x === 'number' && !isNaN(keychain.x) ? keychain.x : null
  let y = typeof keychain.y === 'number' && !isNaN(keychain.y) ? keychain.y : null

  // If coordinates are invalid or at origin, use default keychain position
  if (x === null || y === null || (x === 0 && y === 0) ||
      x < 0.05 || x > 0.95 || y < 0.05 || y > 0.95) {
    x = DEFAULT_KEYCHAIN_POSITION.x
    y = DEFAULT_KEYCHAIN_POSITION.y
  }

  const scale = typeof keychain.scale === 'number' && !isNaN(keychain.scale) ? keychain.scale : 1.0
  const rotation = typeof keychain.rotation === 'number' && !isNaN(keychain.rotation) ? keychain.rotation : 0

  return {
    id: `keychain-${Date.now()}`,
    type: 'keychain' as const,
    assetId: keychain.id.toString(),
    position: {
      x: Math.max(0, Math.min(1, x)),
      y: Math.max(0, Math.min(1, y))
    },
    scale: Math.max(0.1, Math.min(3, scale)),
    rotation: rotation % 360,
    zIndex,
    selected: false,
    slotIndex: null,
    apiData: {
      name: keychain.api?.name || 'Unknown Keychain',
      image: keychain.api?.image || '',
      rarity: keychain.api?.rarity
    }
  }
}

/**
 * Convert canvas element back to sticker data format
 */
export function canvasElementToSticker(element: any): any {
  if (!element || element.type !== 'sticker') return null

  return {
    id: parseInt(element.assetId),
    slot: element.slotIndex,
    x: element.position.x,
    y: element.position.y,
    wear: element.wear || 0,
    scale: element.scale,
    rotation: element.rotation,
    api: element.apiData
  }
}

/**
 * Convert canvas element back to keychain data format
 */
export function canvasElementToKeychain(element: any): any {
  if (!element || element.type !== 'keychain') return null

  return {
    id: parseInt(element.assetId),
    x: element.position.x,
    y: element.position.y,
    z: 0, // Default Z value
    seed: 0, // Default seed value
    api: element.apiData
  }
}

/**
 * Generate flat weapon skin image URL
 * This assumes flat images are stored in a specific directory structure
 */
export function generateFlatImageUrl(weaponName: string, skinName: string): string {
  // Convert weapon and skin names to URL-friendly format
  const cleanWeaponName = weaponName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
  const cleanSkinName = skinName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')

  // Try flat image first, fallback to default weapon image
  const flatImageUrl = `/img/weapons/flat/${cleanWeaponName}-${cleanSkinName}.png`

  return flatImageUrl
}

/**
 * Generate fallback weapon image URL for when flat image is not available
 */
export function generateFallbackWeaponImageUrl(weaponName: string): string {
  // Map common weapon names to default image names
  const weaponMapping: Record<string, string> = {
    'ak-47': 'weapon_ak47',
    'ak47': 'weapon_ak47',
    'm4a4': 'weapon_m4a1',
    'm4a1-s': 'weapon_m4a1_silencer',
    'awp': 'weapon_awp',
    'glock-18': 'weapon_glock',
    'usp-s': 'weapon_hkp2000',
    'deagle': 'weapon_deagle',
    'desert-eagle': 'weapon_deagle',
    'p250': 'weapon_p250',
    'five-seven': 'weapon_fiveseven',
    'tec-9': 'weapon_tec9',
    'cz75-auto': 'weapon_cz75a',
    'r8-revolver': 'weapon_revolver',
    'dual-berettas': 'weapon_elite',
    'p90': 'weapon_p90',
    'mp7': 'weapon_mp7',
    'mp9': 'weapon_mp9',
    'mp5-sd': 'weapon_mp5sd',
    'ump-45': 'weapon_ump45',
    'pp-bizon': 'weapon_bizon',
    'mac-10': 'weapon_mac10',
    'famas': 'weapon_famas',
    'galil-ar': 'weapon_galilar',
    'aug': 'weapon_aug',
    'sg-553': 'weapon_sg556',
    'ssg-08': 'weapon_ssg08',
    'scar-20': 'weapon_scar20',
    'g3sg1': 'weapon_g3sg1',
    'nova': 'weapon_nova',
    'xm1014': 'weapon_xm1014',
    'mag-7': 'weapon_mag7',
    'sawed-off': 'weapon_sawedoff',
    'm249': 'weapon_m249',
    'negev': 'weapon_negev'
  }

  const cleanWeaponName = weaponName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
  const defaultImageName = weaponMapping[cleanWeaponName] || 'weapon_ak47' // fallback to AK-47

  return `/img/defaults/${defaultImageName}.png`
}

/**
 * Clamp a value between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
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
export function isPointInBounds(point: Point, bounds: { x: number, y: number, width: number, height: number }): boolean {
  return point.x >= bounds.x && 
         point.x <= bounds.x + bounds.width && 
         point.y >= bounds.y && 
         point.y <= bounds.y + bounds.height
}
