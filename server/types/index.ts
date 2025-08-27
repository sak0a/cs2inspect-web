/**
 * Centralized type definitions for the CS2Inspect web application
 *
 * This file re-exports all type definitions to provide a single import point
 * for consuming modules. This follows the pattern used in large-scale projects
 * for better organization and maintainability.
 */

// ============================================================================
// COMMON TYPES
// ============================================================================

export type {
  // Steam types
  SteamUser,

  // API response types
  ApiResponse,
  PaginatedResponse,

  // Item types
  BaseItem,
  EnhancedItem,

  // Customization types
  BaseCustomization,
  StickerCustomization,
  KeychainCustomization,
  WeaponCustomization,
  KnifeCustomization,
  GloveCustomization,

  // Loadout types
  Loadout,
  Team,

  // Utility types
  ID,
  Callback,
  AsyncCallback,
  Optional,
  RequiredFields
} from './common'

// ============================================================================
// API TYPES
// ============================================================================

export type {
  // API Response interfaces
  PaginationMeta,
  ResponseMeta,
  ErrorInfo,
  BaseAPIResponse,
  PaginatedAPIResponse,
  CollectionAPIResponse,

  // Item interfaces
  ItemRarity,
  ItemTeam,
  BaseAPIItem,
  APISkin,
  APISticker,
  APIAgent,
  APIMusicKit,
  APIKeychain,
  APICollectible,

  // Enums
  CsTeam
} from './api'

// ============================================================================
// ITEM TYPES
// ============================================================================

export type {
  // Customization interfaces
  BaseCustomization as ItemBaseCustomization,
  WeaponStickerCustomization,
  WeaponKeychainCustomization,
  WeaponCustomization as ItemWeaponCustomization,
  KnifeCustomization as ItemKnifeCustomization,
  GloveCustomization as ItemGloveCustomization,

  // Item interfaces
  IDefaultItem,
  IEnhancedItem,
  IEnhancedWeapon,
  IEnhancedKnife,
  IEnhancedGlove,
  IMappedDBWeapon,
  IEnhancedWeaponSticker,
  IEnhancedWeaponKeychain
} from './items'

// ============================================================================
// DATABASE TYPES
// ============================================================================

export type {
  // Base database interfaces
  BaseDBRecord,
  BaseDBItem,

  // Specific database interfaces
  DBLoadout,
  DBWeapon,
  DBKnife,
  DBGlove,
  DBPin,
  DBMusicKit,
  DBAgent
} from './database'

// ============================================================================
// CLASSES
// ============================================================================

export {
  // Enhanced item classes
  EnhancedWeaponSticker,
  EnhancedWeaponKeychain
} from './classes'

// ============================================================================
// INSPECT API TYPES
// ============================================================================

export type {
  // Item and action types
  ItemType,
  InspectAction,
  UrlType,

  // Request interfaces
  BaseInspectRequest,
  CreateUrlRequest,
  InspectUrlRequest,
  DecodeHexRequest,
  InspectRequest,

  // Response interfaces
  BaseInspectResponse,
  CreateUrlResponse,
  InspectItemResponse,
  DecodeResponse,
  ValidateUrlResponse,
  AnalyzeUrlResponse,
  ClientStatusResponse,
  InspectResponse,

  // Error interfaces
  InspectErrorResponse,

  // Utility types
  ItemTypeConfig,
  ItemTypeConfigMap
} from './inspect'
