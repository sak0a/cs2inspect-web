/**
 * Common type definitions used across the CS2Inspect server
 * 
 * This file now re-exports shared types from ~/types for consistency,
 * while maintaining server-specific types.
 */

// ============================================================================
// RE-EXPORTS FROM ~/types (Shared with frontend)
// ============================================================================

// User types
export type { UserProfile as SteamUser } from '~/types'

// Utility types
export type {
  Callback,
  AsyncCallback,
  Optional,
  RequiredFields,
  ID
} from '~/types/core/common'

/**
 * Base item interface (server-specific)
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
 * Enhanced item with additional properties (server-specific)
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
// CUSTOMIZATION TYPES - RE-EXPORTED FROM ~/types
// ============================================================================

export type {
  BaseItemConfiguration as BaseCustomization,
  StickerConfiguration as StickerCustomization,
  KeychainConfiguration as KeychainCustomization,
  WeaponConfiguration as WeaponCustomization,
  KnifeConfiguration as KnifeCustomization,
  GloveConfiguration as GloveCustomization
} from '~/types/business/items'

// ============================================================================
// LOADOUT TYPES
// ============================================================================

/**
 * Loadout information (server-specific format)
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
