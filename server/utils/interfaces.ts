/**
 * @deprecated This file is deprecated. Import types from ~/server/types instead.
 * This file now re-exports types from the centralized types directory for backward compatibility.
 *
 * Please update your imports to use:
 * import type { ... } from '~/server/types'
 */

// Re-export all types from the centralized types directory for backward compatibility
export type {
  // API types
  PaginationMeta,
  ResponseMeta,
  ErrorInfo,
  BaseAPIResponse,
  PaginatedAPIResponse,
  CollectionAPIResponse,
  ItemRarity,
  ItemTeam,
  BaseAPIItem,
  APISkin,
  APISticker,
  APIAgent,
  APIMusicKit,
  APIKeychain,
  APICollectible,
  CsTeam,

  // Item types
  WeaponStickerCustomization,
  WeaponKeychainCustomization,
  WeaponCustomization,
  KnifeCustomization,
  GloveCustomization,
  IDefaultItem,
  IEnhancedItem,
  IEnhancedWeapon,
  IEnhancedKnife,
  IEnhancedGlove,
  IMappedDBWeapon,
  IEnhancedWeaponSticker,
  IEnhancedWeaponKeychain,

  // Database types
  BaseDBRecord,
  BaseDBItem,
  DBLoadout,
  DBWeapon,
  DBKnife,
  DBGlove,
  DBPin,
  DBMusicKit,
  DBAgent
} from '~/server/types'

// Re-export classes
export {
  EnhancedWeaponSticker,
  EnhancedWeaponKeychain
} from '~/server/types'

// Keep the BaseCustomization interface here temporarily for backward compatibility
// TODO: Remove this after updating all imports
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

// All other interfaces have been moved to ~/server/types
// This file now serves as a backward compatibility layer
