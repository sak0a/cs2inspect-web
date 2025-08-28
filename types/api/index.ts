/**
 * API types and interfaces for the CS2Inspect application
 * 
 * @description This module exports all API-related types and interfaces,
 * providing a single import point for API data structures and response formats.
 * 
 * @version 2.0.0
 * @since 2.0.0
 */

// ============================================================================
// RESPONSE INTERFACES
// ============================================================================

export type {
  // Base response types
  APIResponseMeta,
  APIResponse,
  APIPaginatedResponse,
  APICollectionResponse,
  
  // Specialized response types
  APICreateResponse,
  APIUpdateResponse,
  APIDeleteResponse,
  APIBatchResponse,
  
  // Error response types
  APIValidationErrorResponse,
  APIAuthErrorResponse,
  APIRateLimitErrorResponse,
  
  // Utility types
  AnyAPIResponse,
  ExtractAPIResponseData
} from './responses'

export {
  // Response utility functions
  isSuccessfulResponse,
  isErrorResponse
} from './responses'

// ============================================================================
// ITEM INTERFACES
// ============================================================================

export type {
  // Base item types
  APIItemTeam,
  APIBaseItem,
  
  // Weapon skin types
  APIWeaponInfo,
  APIWeaponCategory,
  APISkinPattern,
  APIWeaponSkin,
  APIWearCondition,
  APICollection,
  APICrate,
  
  // Sticker types
  APISticker,
  APITournament,
  
  // Agent types
  APIAgent,
  APIAgentFaction,
  
  // Music kit types
  APIMusicKit,
  
  // Keychain types
  APIKeychain,
  
  // Collectible types
  APICollectible,
  
  // Union types
  APIItem
} from './items'

export {
  // Item type guards
  isAPIWeaponSkin,
  isAPISticker,
  isAPIAgent,
  isAPIMusicKit
} from './items'

// ============================================================================
// RE-EXPORTS FROM COMMON
// ============================================================================

export type {
  // Common types used in API contexts
  EntityId,
  Timestamp,
  ErrorInfo,
  PaginationMeta,
  PaginationOptions,
  FilterOptions,
  ItemRarity,
  UserProfile
} from '../core/common'
