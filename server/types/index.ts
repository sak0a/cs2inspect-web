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
  RequiredFields,
} from './common'

// ============================================================================
// API RESPONSE TYPES (from unified ~/types)
// ============================================================================

export type {
  APIResponseMeta,
  APIResponse,
  APIPaginatedResponse,
  APICollectionResponse,
  PaginationMeta,
  ErrorInfo,
} from '~/types'

// ============================================================================
// API ITEM TYPES
// ============================================================================

export type {
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
  APIHighlight,

  // Enums
  CsTeam,
} from './api'

// ============================================================================
// ITEM TYPES
// ============================================================================

export type {
  // Customization interfaces
  BaseCustomization as ItemBaseCustomization,
  WeaponStickerCustomization,
  WeaponKeychainCustomization,
  WeaponConfiguration as ItemWeaponCustomization,
  KnifeConfiguration as ItemKnifeCustomization,
  GloveConfiguration as ItemGloveCustomization,

  // Item interfaces
  IDefaultItem,
  IEnhancedItem,
  IEnhancedWeapon,
  IEnhancedKnife,
  IEnhancedGlove,
  IMappedDBWeapon,
  IMappedDBKnife,
  IMappedDBGlove,
  IEnhancedWeaponSticker,
  IEnhancedWeaponKeychain,
} from './items'

// ============================================================================
// DATABASE TYPES
// ============================================================================

export type {
  // Base database interfaces
  BaseDBRecord,
  BaseDBItem,

  // Specific database interfaces (backward compatible aliases)
  DBLoadout,
  DBWeapon,
  DBKnife,
  DBGlove,
  DBPin,
  DBMusicKit,
  DBAgent,

  // Drizzle inferred types
  LoadoutSelect,
  LoadoutInsert,
  PistolSelect,
  PistolInsert,
  RifleSelect,
  RifleInsert,
  SMGSelect,
  SMGInsert,
  HeavySelect,
  HeavyInsert,
  KnifeSelect,
  KnifeInsert,
  GloveSelect,
  GloveInsert,
  AgentSelect,
  AgentInsert,
  MusicSelect,
  MusicInsert,
  PinSelect,
  PinInsert,
  HealthCheckHistorySelect,
  HealthCheckHistoryInsert,
} from './database'

// ============================================================================
// CLASSES
// ============================================================================

export {
  // Enhanced item classes
  EnhancedWeaponSticker,
  EnhancedWeaponKeychain,
} from './classes'

// ============================================================================
// JSON SCHEMA TYPES
// ============================================================================

export type { StickerJSON, KeychainJSON } from './jsonSchemas'

export {
  createEmptyStickerJSON,
  createEmptyKeychainJSON,
  isValidStickerJSON,
  isValidKeychainJSON,
  isEmptySticker,
  isEmptyKeychain,
} from './jsonSchemas'

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
  ItemTypeConfigMap,
} from './inspect'
