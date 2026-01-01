/**
 * @deprecated This file is deprecated. Import types from ~/server/types instead.
 * This file now re-exports types from the centralized types directory for backward compatibility.
 *
 * Please update your imports to use:
 * import type { ... } from '~/server/types'
 */

// Re-export type definitions only for backward compatibility
// Note: Classes (EnhancedWeaponSticker, EnhancedWeaponKeychain) should be imported
// directly from ~/server/types to avoid duplicate export errors with Nuxt auto-imports
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
    APIHighlight,
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
} from '../types'
