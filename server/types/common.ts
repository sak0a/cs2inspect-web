/**
 * Common type definitions used across the CS2Inspect web application
 * These types are shared between frontend and backend components
 */

// ============================================================================
// STEAM TYPES
// ============================================================================

/**
 * Steam user information
 */
export interface SteamUser {
  steamId: string
  displayName: string
  avatar: string
  profileUrl: string
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

/**
 * Standard API response wrapper
 */
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
  statusCode?: number
}

/**
 * Paginated API response
 */
export interface PaginatedResponse<T = any> extends ApiResponse<T[]> {
  pagination?: {
    currentPage: number
    totalPages: number
    totalItems: number
    limit: number
    hasNext: boolean
    hasPrevious: boolean
  }
}

// ============================================================================
// ITEM TYPES
// ============================================================================

/**
 * Base item interface
 */
export interface BaseItem {
  id: string
  name: string
  image: string
  rarity?: {
    id: string
    name: string
    color: string
  }
}

/**
 * Enhanced item with additional properties
 */
export interface EnhancedItem extends BaseItem {
  weapon_defindex: number
  defaultName: string
  defaultImage: string
  minFloat?: number
  maxFloat?: number
  paintIndex?: number
  availableTeams?: string | number
}

// ============================================================================
// CUSTOMIZATION TYPES
// ============================================================================

/**
 * Base customization interface
 */
export interface BaseCustomization {
  active: boolean
  paintIndex: number
  paintIndexOverride: boolean
  pattern: number
  wear: number
  team: number
}

/**
 * Sticker customization
 */
export interface StickerCustomization {
  id: number
  wear: number
  scale: number
  rotation: number
  x: number
  y: number
}

/**
 * Keychain customization
 */
export interface KeychainCustomization {
  id: number
  x: number
  y: number
  z: number
  seed: number
}

/**
 * Weapon customization with stickers and keychains
 */
export interface WeaponCustomization extends BaseCustomization {
  statTrak: boolean
  statTrakCount: number
  nameTag: string
  stickers: (StickerCustomization | null)[]
  keychain: KeychainCustomization | null
}

/**
 * Knife customization
 */
export interface KnifeCustomization extends BaseCustomization {
  statTrak: boolean
  statTrakCount: number
  nameTag: string
}

/**
 * Glove customization
 */
export interface GloveCustomization extends BaseCustomization {
  // Gloves don't have additional customization options
}

// ============================================================================
// LOADOUT TYPES
// ============================================================================

/**
 * Loadout information
 */
export interface Loadout {
  id: number
  name: string
  steamId: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

/**
 * Team types
 */
export type Team = 'T' | 'CT' | 'both'

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Generic ID type
 */
export type ID = string | number

/**
 * Generic callback function
 */
export type Callback<T = void> = (data: T) => void

/**
 * Generic async callback function
 */
export type AsyncCallback<T = void> = (data: T) => Promise<void>

/**
 * Optional properties helper
 */
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>

/**
 * Required properties helper
 */
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>
