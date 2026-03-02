/**
 * Canvas-specific interfaces for the visual sticker/keychain customizer
 */

import type { StickerConfiguration, KeychainConfiguration } from './business/items'

export interface Point {
  x: number
  y: number
}

export interface Size {
  width: number
  height: number
}

/**
 * Canvas element representing a sticker or keychain on the weapon
 */
export interface CanvasElement {
  /** Unique identifier for this element */
  id: string
  /** Type of element */
  type: 'sticker' | 'keychain'
  /** Asset ID from the API */
  assetId: string
  /** Position on canvas (normalized 0-1) */
  position: Point
  /** Scale factor */
  scale: number
  /** Rotation in degrees */
  rotation: number
  /** Wear value for stickers (0-1) */
  wear?: number
  /** Z-index for layering */
  zIndex: number
  /** Whether this element is currently selected */
  selected: boolean
  /** Sticker slot index (0-4) for stickers, null for keychain */
  slotIndex?: number | null
  /** Optional Z coordinate (for keychains) */
  z?: number
  /** Optional seed (for keychains) */
  seed?: number
  /** Optional wrapped sticker ID (for sticker slabs) */
  wrapped_sticker_id?: number | null
  /** Optional highlight reel ID (for highlight reels) */
  highlight_reel_id?: number | null
  /** API data for display */
  apiData: {
    name: string
    image: string
    rarity?: {
      color: string
      name: string
    }
  }
}

/**
 * Canvas state management
 */
export interface CanvasState {
  /** All elements on the canvas */
  elements: CanvasElement[]
  /** Currently selected element ID */
  selectedElementId: string | null
  /** Canvas dimensions */
  canvasSize: Size
  /** Weapon skin background image URL */
  weaponImage: string
  /** Whether user is currently dragging */
  isDragging: boolean
  /** Whether canvas is in edit mode */
  isEditing: boolean
}

/**
 * Coordinate transformation utilities
 */
export interface CoordinateTransform {
  /** Convert canvas pixel coordinates to normalized game coordinates */
  canvasToNormalized: (canvasCoords: Point, canvasSize: Size) => Point
  /** Convert normalized game coordinates to canvas pixel coordinates */
  normalizedToCanvas: (normalizedCoords: Point, canvasSize: Size) => Point
  /** Validate coordinates are within bounds */
  validateCoordinates: (coords: Point) => boolean
}

/**
 * Asset browser item for stickers and keychains
 */
export interface AssetBrowserItem {
  id: string
  name: string
  image: string
  type: 'sticker' | 'keychain'
  rarity?: {
    color: string
    name: string
  }
  searchTerms: string[]
}

/**
 * Visual customizer modal props
 */
export interface VisualCustomizerProps {
  /** Whether the modal is visible */
  visible: boolean
  /** Weapon skin data */
  weaponSkin: {
    name: string
    image: string
    defindex: number
    paintindex?: number
  }
  /** Current sticker customizations */
  stickers: (StickerConfiguration | null)[]
  /** Current keychain customization */
  keychain: KeychainConfiguration | null
  /** Current weapon wear value */
  weaponWear: number
  /** Minimum wear value for this weapon */
  minWear: number
  /** Maximum wear value for this weapon */
  maxWear: number
}

/**
 * Visual customizer modal events
 */
export interface VisualCustomizerEvents {
  /** Update modal visibility */
  'update:visible': [value: boolean]
  /** Save customizations */
  save: [
    data: {
      stickers: (StickerConfiguration | null)[]
      keychain: KeychainConfiguration | null
      weaponWear?: number
    },
  ]
  /** Update weapon wear value */
  'update-wear': [wearValue: number]
}

/**
 * Canvas manipulation result for returning to parent component
 */
export interface CustomizationResult {
  stickers: (StickerConfiguration | null)[]
  keychain: KeychainConfiguration | null
}
