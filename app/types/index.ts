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
  ItemConfigurationMap,
} from './business/items'

import type { DBWeapon, DBKnife, DBGlove } from './database/records'
import { isWeaponConfiguration, isKnifeConfiguration, isGloveConfiguration } from './business/items'

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

  // Branded types - Entity IDs
  LoadoutId,
  SteamId,
  Defindex,
  PaintIndex,
  PaintSeed,
  StickerId,
  KeychainId,
  MusicKitDefindex,
  PinDefindex,

  // Branded types - Tier 1: Critical safety
  InspectUrl,
  HexData,
  FloatValue,
  StickerSlotIndex,
  TeamId,

  // Branded types - Tier 2: Domain safety
  StatTrakCount,
  NameTag,
  ISOTimestamp,

  // Branded types - Tier 3: Visual and UX
  NormalizedCoordinate,

  // Branded types - Admin
  AdminId,
  BanId,
  SettingKey,

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
  UserSession,
} from './core/common'

export {
  // Enums
  TeamSide,
  ItemQuality,
  LoadingState,
  CsTeam,

  // Branded type conversion helpers - Original
  toLoadoutId,
  toSteamId,
  toDefindex,
  toPaintIndex,
  toPaintSeed,
  toStickerId,
  toKeychainId,
  toMusicKitDefindex,
  toPinDefindex,

  // Branded type conversion helpers - Tier 1
  toInspectUrl,
  tryToInspectUrl,
  toHexData,
  toFloatValue,
  toFloatValueClamped,
  toStickerSlotIndex,
  toTeamId,

  // Branded type conversion helpers - Tier 2
  toStatTrakCount,
  toNameTag,
  toISOTimestamp,

  // Branded type conversion helpers - Tier 3
  toNormalizedCoordinate,
  toNormalizedCoordinateClamped,

  // Branded type conversion helpers - Admin
  toAdminId,
  toBanId,
  toSettingKey,

  // Type guards - Original
  isValidLoadoutId,
  isValidSteamId,
  isValidDefindex,

  // Type guards - Tier 1
  isValidInspectUrl,
  isValidHexData,
  isValidFloatValue,
  isValidStickerSlotIndex,
  isValidTeamId,

  // Type guards - Tier 2
  isValidStatTrakCount,
  isValidNameTag,
  isValidISOTimestamp,

  // Type guards - Tier 3
  isValidNormalizedCoordinate,

  // Type guards - Admin
  isValidAdminId,
  isValidBanId,
  isValidSettingKey,

  // Utility functions
  floatValueToCondition,
  floatValueToConditionAbbr,
  teamIdToName,
  teamIdToAbbr,
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
  APIItem,
} from './api'

export {
  // Response utility functions
  isSuccessfulResponse,
  isErrorResponse,

  // Item type guards
  isAPIWeaponSkin,
  isAPISticker,
  isAPIAgent,
  isAPIMusicKit,
} from './api'

// Admin types
export type {
  AdminOverviewStats,
  AdminUserDetails,
  AdminUserSummary,
  AdminActivityData,
  AdminHeatmapData,
  AdminTopUser,
  AdminSetting,
  AdminInfo,
  AdminActivityLogEntry,
  AdminBanUserRequest,
  AdminUpdateSettingRequest,
  AdminAddAdminRequest,
  AdminUserSearchParams,
  AdminActivityParams,
  PluginSetting,
  PluginSettingCategory,
  PluginSettingUpdateRequest,
} from './api/admin'

// Re-export APISkin from api/items for backward compatibility
export type { APISkin } from './api/items'

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
  DBQueryOptions,
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
  ItemTypeConfiguration,

  // Backward compatibility (deprecated) - customization aliases
  BaseCustomization,
  WeaponStickerCustomization,
  WeaponKeychainCustomization,
  StickerCustomization,
  KeychainCustomization,
  // Note: IEnhancedWeapon, IEnhancedKnife, IEnhancedGlove are server-specific
  // and should be imported from '~/server/types' instead
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
  ITEM_TYPE_CONFIG,
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
  ModalEventsForItemType,
} from './components/modals'

// ============================================================================
// LEGACY COMPATIBILITY - SERVER TYPES RE-EXPORT
// ============================================================================

// Re-export IEnhanced* types from server/types for backward compatibility
// Pages and components can import these from ~/types instead of ~/server/types
export type {
  IEnhancedItem,
  IEnhancedWeapon,
  IEnhancedKnife,
  IEnhancedGlove,
  IEnhancedWeaponSticker,
  IEnhancedWeaponKeychain,
  IMappedDBWeapon,
  IDefaultItem,
} from '~/server/types/items'

// Re-export KeychainJSON from server/types for use in component code
export type { KeychainJSON } from '~/server/types/jsonSchemas'

// ============================================================================
// TYPE UTILITIES
// ============================================================================

/**
 * Extract the configuration type for a given item data type
 *
 * @template T - Item data type
 */
export type ConfigurationForItem<T extends ItemData> = T extends WeaponItemData
  ? WeaponConfiguration
  : T extends KnifeItemData
    ? KnifeConfiguration
    : T extends GloveItemData
      ? GloveConfiguration
      : never

/**
 * Extract the item data type for a given configuration type
 *
 * @template T - Configuration type
 */
export type ItemForConfiguration<T extends ItemConfiguration> = T extends WeaponConfiguration
  ? WeaponItemData
  : T extends KnifeConfiguration
    ? KnifeItemData
    : T extends GloveConfiguration
      ? GloveItemData
      : never

/**
 * Extract the database record type for a given item data type
 *
 * @template T - Item data type
 */
export type DBRecordForItem<T extends ItemData> = T extends WeaponItemData
  ? DBWeapon
  : T extends KnifeItemData
    ? DBKnife
    : T extends GloveItemData
      ? DBGlove
      : never

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
  CustomizationResult,
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
  releaseDate: '2024-01-15',
} as const
