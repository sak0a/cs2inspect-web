/**
 * Database types and interfaces for the CS2Inspect application
 * 
 * @description This module exports all database-related types and interfaces,
 * providing a single import point for database record structures and query parameters.
 * 
 * @version 2.0.0
 * @since 2.0.0
 */

// ============================================================================
// RECORD INTERFACES
// ============================================================================

export type {
  // Base record types
  DBBaseRecord,
  DBUserRecord,
  DBLoadoutRecord,
  
  // Loadout types
  DBLoadout,
  
  // Weapon types
  DBBaseWeapon,
  DBRifle,
  DBPistol,
  DBSMG,
  DBHeavy,
  DBWeapon,
  
  // Item types
  DBKnife,
  DBGlove,
  DBAgent,
  DBMusicKit,
  DBPin,
  
  // Union types
  DBAnyRecord,
  DBItemRecord,
  
  // Utility types
  DBTableName
} from './records'

// ============================================================================
// QUERY INTERFACES
// ============================================================================

export type {
  // Base query types
  DBBaseQuery,
  DBFindByIdQuery,
  DBFindManyQuery,
  DBCreateQuery,
  DBUpdateQuery,
  DBDeleteQuery,
  
  // Loadout query types
  DBLoadoutQuery,
  DBCreateLoadoutQuery,
  DBUpdateLoadoutSelectionsQuery,
  
  // Item query types
  DBItemQuery,
  DBWeaponQuery,
  DBKnifeQuery,
  DBGloveQuery,
  DBAgentQuery,
  
  // Bulk operation types
  DBBulkCreateQuery,
  DBBulkUpdateQuery,
  DBBulkDeleteQuery,
  
  // Transaction types
  DBTransaction,
  DBTransactionalQuery,
  
  // Search and filtering types
  DBSearchQuery,
  DBAggregationQuery,
  
  // Result types
  DBQueryResult,
  DBPaginatedResult,
  DBAggregatedResult,
  
  // Utility types
  QueryForRecord,
  DBOperation,
  DBQueryOptions
} from './queries'

// ============================================================================
// RE-EXPORTS FROM COMMON
// ============================================================================

export type {
  // Common types used in database contexts
  EntityId,
  Timestamp,
  TeamSide,
  PaginationOptions,
  FilterOptions
} from '../core/common'
