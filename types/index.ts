/**
 * Centralized type definitions for the CS2Inspect web application
 * 
 * @description This is the main entry point for all type definitions in the
 * CS2Inspect application. Import types from this file to ensure consistency
 * and maintainability across the codebase.
 * 
 * @version 2.0.0
 * @since 2.0.0
 * 
 * @example
 * ```typescript
 * // Import specific types
 * import type { WeaponConfiguration, APIWeaponSkin, DBWeapon } from '~/types'
 * 
 * // Import all types from a category
 * import type * as API from '~/types/api'
 * import type * as DB from '~/types/database'
 * ```
 */

// ============================================================================
// CORE TYPES
// ============================================================================

export type {
  // Utility types
  EntityId,
  Timestamp,
  Callback,
  AsyncCallback,
  Optional,
  RequiredFields,
  
  // Team and side definitions
  TeamAvailability,

  // Rarity and quality
  ItemRarity,

  // Error handling
  ErrorInfo,
  ValidationError,

  // Pagination and filtering
  PaginationOptions,
  PaginationMeta,
  FilterOptions,

  // Loading and state management
  AsyncResult,

  // User and authentication
  UserProfile,
  UserSession
} from './core/common'

export {
  // Enums
  TeamSide,
  ItemQuality,
  LoadingState
} from './core/common'

// ============================================================================
// API TYPES
// ============================================================================

export type {
  // Response interfaces
  APIResponseMeta,
  APIResponse,
  APIPaginatedResponse,
  APICollectionResponse,
  APICreateResponse,
  APIUpdateResponse,
  APIDeleteResponse,
  APIBatchResponse,
  APIValidationErrorResponse,
  APIAuthErrorResponse,
  APIRateLimitErrorResponse,
  AnyAPIResponse,
  ExtractAPIResponseData,
  
  // Item interfaces
  APIItemTeam,
  APIBaseItem,
  APIWeaponInfo,
  APIWeaponCategory,
  APISkinPattern,
  APIWeaponSkin,
  APIWearCondition,
  APICollection,
  APICrate,
  APISticker,
  APITournament,
  APIAgent,
  APIAgentFaction,
  APIMusicKit,
  APIKeychain,
  APICollectible,
  APIItem
} from './api'

export {
  // Response utility functions
  isSuccessfulResponse,
  isErrorResponse,
  
  // Item type guards
  isAPIWeaponSkin,
  isAPISticker,
  isAPIAgent,
  isAPIMusicKit
} from './api'

// ============================================================================
// DATABASE TYPES
// ============================================================================

export type {
  // Record interfaces
  DBBaseRecord,
  DBUserRecord,
  DBLoadoutRecord,
  DBLoadout,
  DBBaseWeapon,
  DBRifle,
  DBPistol,
  DBSMG,
  DBHeavy,
  DBWeapon,
  DBKnife,
  DBGlove,
  DBAgent,
  DBMusicKit,
  DBPin,
  DBAnyRecord,
  DBItemRecord,
  DBTableName,
  
  // Query interfaces
  DBBaseQuery,
  DBFindByIdQuery,
  DBFindManyQuery,
  DBCreateQuery,
  DBUpdateQuery,
  DBDeleteQuery,
  DBLoadoutQuery,
  DBCreateLoadoutQuery,
  DBUpdateLoadoutSelectionsQuery,
  DBItemQuery,
  DBWeaponQuery,
  DBKnifeQuery,
  DBGloveQuery,
  DBAgentQuery,
  DBBulkCreateQuery,
  DBBulkUpdateQuery,
  DBBulkDeleteQuery,
  DBTransaction,
  DBTransactionalQuery,
  DBSearchQuery,
  DBAggregationQuery,
  DBQueryResult,
  DBPaginatedResult,
  DBAggregatedResult,
  QueryForRecord,
  DBOperation,
  DBQueryOptions
} from './database'

// ============================================================================
// BUSINESS LOGIC TYPES
// ============================================================================

export type {
  // Item type definitions
  ItemType,
  WeaponCategory,
  
  // Base interfaces
  BaseItemConfiguration,
  BaseItemData,
  
  // Sticker and keychain
  StickerConfiguration,
  KeychainConfiguration,
  
  // Item data interfaces
  WeaponItemData,
  KnifeItemData,
  GloveItemData,
  ItemData,
  
  // Configuration interfaces
  WeaponConfiguration,
  KnifeConfiguration,
  GloveConfiguration,
  ItemConfiguration,
  
  // Type maps
  ItemDataMap,
  ItemConfigurationMap,
  
  // Utility interfaces
  ItemTypeConfiguration
} from './business/items'

export {
  // Type guards
  isWeaponItemData,
  isKnifeItemData,
  isGloveItemData,
  isWeaponConfiguration,
  isKnifeConfiguration,
  isGloveConfiguration,
  
  // Configuration constants
  ITEM_TYPE_CONFIG
} from './business/items'

// ============================================================================
// COMPONENT TYPES
// ============================================================================

export type {
  // Base modal interfaces
  BaseModalProps,
  BaseModalState,
  BaseModalEvents,
  BaseItemModalProps,
  BaseItemModalState,
  BaseItemModalEvents,
  
  // Specific modal interfaces
  WeaponModalProps,
  WeaponModalState,
  WeaponModalEvents,
  KnifeModalProps,
  KnifeModalState,
  KnifeModalEvents,
  GloveModalProps,
  GloveModalState,
  GloveModalEvents,
  
  // Specialized modal interfaces
  StickerModalProps,
  StickerModalEvents,
  KeychainModalProps,
  KeychainModalEvents,
  InspectURLModalProps,
  InspectURLModalEvents,
  DuplicateConfirmModalProps,
  DuplicateConfirmModalEvents,
  ResetConfirmModalProps,
  ResetConfirmModalEvents,
  
  // Composable interfaces
  ItemModalComposableReturn,
  ItemModalComposableConfig,
  
  // Utility types
  ModalPropsForItemType,
  ModalStateForItemType,
  ModalEventsForItemType
} from './components/modals'

// ============================================================================
// LEGACY COMPATIBILITY
// ============================================================================

// Import the types we need for legacy compatibility
import type {
  WeaponItemData,
  KnifeItemData,
  GloveItemData,
  ItemData,
  WeaponConfiguration,
  KnifeConfiguration,
  GloveConfiguration,
  ItemConfiguration,
  ItemConfigurationMap
} from './business/items'

import type { APIWeaponSkin } from './api/items'
import type { DBWeapon, DBKnife, DBGlove } from './database/records'
import type { UserProfile } from './core/common'
import {
  isWeaponConfiguration,
  isKnifeConfiguration,
  isGloveConfiguration
} from './business/items'

/**
 * @deprecated Use WeaponItemData instead
 */
export type IEnhancedWeapon = WeaponItemData

/**
 * @deprecated Use KnifeItemData instead
 */
export type IEnhancedKnife = KnifeItemData

/**
 * @deprecated Use GloveItemData instead
 */
export type IEnhancedGlove = GloveItemData

/**
 * @deprecated Use ItemData instead
 */
export type IEnhancedItem = ItemData

/**
 * @deprecated Use APIWeaponSkin instead
 */
export type APISkin = APIWeaponSkin

/**
 * @deprecated Use UserProfile instead
 */
export type SteamUser = UserProfile

// ============================================================================
// TYPE UTILITIES
// ============================================================================

/**
 * Extract the configuration type for a given item data type
 *
 * @template T - Item data type
 */
export type ConfigurationForItem<T extends ItemData> =
  T extends WeaponItemData ? WeaponConfiguration :
  T extends KnifeItemData ? KnifeConfiguration :
  T extends GloveItemData ? GloveConfiguration :
  never

/**
 * Extract the item data type for a given configuration type
 *
 * @template T - Configuration type
 */
export type ItemForConfiguration<T extends ItemConfiguration> =
  T extends WeaponConfiguration ? WeaponItemData :
  T extends KnifeConfiguration ? KnifeItemData :
  T extends GloveConfiguration ? GloveItemData :
  never

/**
 * Extract the database record type for a given item data type
 *
 * @template T - Item data type
 */
export type DBRecordForItem<T extends ItemData> =
  T extends WeaponItemData ? DBWeapon :
  T extends KnifeItemData ? DBKnife :
  T extends GloveItemData ? DBGlove :
  never

/**
 * Type-safe item type checker
 *
 * @template T - Expected item type
 * @param item - Item to check
 * @param type - Expected type
 * @returns True if item matches the expected type
 */
export function isItemOfType<T extends ItemData['type']>(
  item: ItemData,
  type: T
): item is Extract<ItemData, { type: T }> {
  return item.type === type
}

/**
 * Type-safe configuration type checker
 *
 * @template T - Expected configuration type
 * @param config - Configuration to check
 * @param type - Expected type (inferred from item data)
 * @returns True if configuration matches the expected type
 */
export function isConfigurationOfType<T extends ItemData['type']>(
  config: ItemConfiguration,
  type: T
): config is ItemConfigurationMap[T] {
  switch (type) {
    case 'weapon':
      return isWeaponConfiguration(config)
    case 'knife':
      return isKnifeConfiguration(config)
    case 'glove':
      return isGloveConfiguration(config)
    default:
      return false
  }
}

// ============================================================================
// CANVAS TYPES
// ============================================================================

export type {
  Point,
  Size,
  CanvasElement,
  CanvasState,
  CoordinateTransform,
  AssetBrowserItem,
  VisualCustomizerProps,
  VisualCustomizerEvents,
  CustomizationResult
} from './canvas'

// ============================================================================
// VERSION INFORMATION
// ============================================================================

/**
 * Type system version information
 */
export const TYPE_SYSTEM_VERSION = {
  major: 2,
  minor: 0,
  patch: 0,
  version: '2.0.0',
  releaseDate: '2024-01-15'
} as const
