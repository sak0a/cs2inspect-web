/**
 * Database query interfaces for the CS2Inspect application
 * 
 * @description This file contains interfaces for database query parameters,
 * filters, and operations. These interfaces ensure type-safe database
 * interactions and consistent query structures.
 * 
 * @version 2.0.0
 * @since 2.0.0
 */

import type { 
  EntityId, 
  TeamSide, 
  PaginationOptions, 
  FilterOptions 
} from '../core/common'

import type { 
  DBAnyRecord, 
  DBItemRecord, 
  DBLoadout 
} from './records'

// ============================================================================
// BASE QUERY INTERFACES
// ============================================================================

/**
 * Base query parameters for database operations
 * 
 * @description Common parameters used across all database queries
 */
export interface DBBaseQuery {
  /** Steam ID for user-specific queries */
  steamId?: string
  /** Loadout ID for loadout-specific queries */
  loadoutId?: EntityId
  /** Include soft-deleted records */
  includeSoftDeleted?: boolean
}

/**
 * Query parameters for fetching records by ID
 * 
 * @template T - Type of database record
 */
export interface DBFindByIdQuery<T extends DBAnyRecord = DBAnyRecord> extends DBBaseQuery {
  /** Record ID to fetch */
  id: EntityId
  /** Include related records */
  include?: Array<keyof T>
}

/**
 * Query parameters for fetching multiple records
 * 
 * @template T - Type of database record
 */
export interface DBFindManyQuery<T extends DBAnyRecord = DBAnyRecord> extends DBBaseQuery {
  /** Filter conditions */
  where?: Partial<T>
  /** Fields to include in results */
  select?: Array<keyof T>
  /** Sorting options */
  orderBy?: Array<{
    field: keyof T
    direction: 'asc' | 'desc'
  }>
  /** Pagination options */
  pagination?: PaginationOptions
  /** Include related records */
  include?: Array<keyof T>
}

/**
 * Query parameters for creating records
 * 
 * @template T - Type of database record
 */
export interface DBCreateQuery<T extends DBAnyRecord = DBAnyRecord> extends DBBaseQuery {
  /** Data for the new record */
  data: Omit<T, 'id' | 'created_at' | 'updated_at'>
  /** Return the created record */
  returnRecord?: boolean
}

/**
 * Query parameters for updating records
 * 
 * @template T - Type of database record
 */
export interface DBUpdateQuery<T extends DBAnyRecord = DBAnyRecord> extends DBBaseQuery {
  /** Record ID to update */
  id: EntityId
  /** Data to update */
  data: Partial<Omit<T, 'id' | 'created_at' | 'updated_at'>>
  /** Return the updated record */
  returnRecord?: boolean
}

/**
 * Query parameters for deleting records
 */
export interface DBDeleteQuery extends DBBaseQuery {
  /** Record ID to delete */
  id: EntityId
  /** Perform soft delete instead of hard delete */
  softDelete?: boolean
}

// ============================================================================
// LOADOUT-SPECIFIC QUERIES
// ============================================================================

/**
 * Query parameters for loadout operations
 */
export interface DBLoadoutQuery extends DBBaseQuery {
  /** Include associated items */
  includeItems?: boolean
  /** Include item counts */
  includeStats?: boolean
}

/**
 * Query parameters for creating a new loadout
 */
export interface DBCreateLoadoutQuery extends DBBaseQuery {
  /** Loadout name */
  name: string
  /** Copy items from another loadout */
  copyFromLoadoutId?: EntityId
}

/**
 * Query parameters for updating loadout selections
 */
export interface DBUpdateLoadoutSelectionsQuery extends DBBaseQuery {
  /** Loadout ID to update */
  loadoutId: EntityId
  /** Selected knife for Terrorist team */
  selected_knife_t?: number | null
  /** Selected knife for Counter-Terrorist team */
  selected_knife_ct?: number | null
  /** Selected glove for Terrorist team */
  selected_glove_t?: number | null
  /** Selected glove for Counter-Terrorist team */
  selected_glove_ct?: number | null
  /** Selected agent for Terrorist team */
  selected_agent_t?: number | null
  /** Selected agent for Counter-Terrorist team */
  selected_agent_ct?: number | null
  /** Selected music kit */
  selected_music?: number | null
}

// ============================================================================
// ITEM-SPECIFIC QUERIES
// ============================================================================

/**
 * Query parameters for item operations
 * 
 * @template T - Type of item record
 */
export interface DBItemQuery<T extends DBItemRecord = DBItemRecord> extends DBBaseQuery {
  /** Filter by team */
  team?: TeamSide
  /** Filter by active status */
  active?: boolean
  /** Filter by definition index */
  defindex?: number
  /** Include item statistics */
  includeStats?: boolean
}

/**
 * Query parameters for weapon operations
 */
export interface DBWeaponQuery extends DBItemQuery {
  /** Filter by weapon category */
  category?: 'rifles' | 'pistols' | 'smgs' | 'heavys'
  /** Filter by StatTrak status */
  hasStatTrak?: boolean
  /** Filter by name tag presence */
  hasNameTag?: boolean
  /** Filter by sticker presence */
  hasStickers?: boolean
  /** Filter by keychain presence */
  hasKeychain?: boolean
}

/**
 * Query parameters for knife operations
 */
export interface DBKnifeQuery extends DBItemQuery {
  /** Filter by StatTrak status */
  hasStatTrak?: boolean
  /** Filter by name tag presence */
  hasNameTag?: boolean
}

/**
 * Query parameters for glove operations
 */
export interface DBGloveQuery extends DBItemQuery {
  /** Filter by paint index range */
  paintIndexRange?: {
    min: number
    max: number
  }
}

/**
 * Query parameters for agent operations
 */
export interface DBAgentQuery extends DBItemQuery {
  /** Filter by agent name */
  agentName?: string
  /** Filter by faction */
  faction?: string
}

// ============================================================================
// BULK OPERATIONS
// ============================================================================

/**
 * Query parameters for bulk create operations
 * 
 * @template T - Type of database record
 */
export interface DBBulkCreateQuery<T extends DBAnyRecord = DBAnyRecord> extends DBBaseQuery {
  /** Array of records to create */
  data: Array<Omit<T, 'id' | 'created_at' | 'updated_at'>>
  /** Skip records that would cause conflicts */
  skipConflicts?: boolean
  /** Return created records */
  returnRecords?: boolean
}

/**
 * Query parameters for bulk update operations
 * 
 * @template T - Type of database record
 */
export interface DBBulkUpdateQuery<T extends DBAnyRecord = DBAnyRecord> extends DBBaseQuery {
  /** Filter conditions for records to update */
  where: Partial<T>
  /** Data to update */
  data: Partial<Omit<T, 'id' | 'created_at' | 'updated_at'>>
  /** Maximum number of records to update */
  limit?: number
}

/**
 * Query parameters for bulk delete operations
 */
export interface DBBulkDeleteQuery extends DBBaseQuery {
  /** Record IDs to delete */
  ids: EntityId[]
  /** Perform soft delete instead of hard delete */
  softDelete?: boolean
}

// ============================================================================
// TRANSACTION OPERATIONS
// ============================================================================

/**
 * Database transaction context
 * 
 * @description Represents a database transaction for atomic operations
 */
export interface DBTransaction {
  /** Transaction ID */
  id: string
  /** Transaction start time */
  startedAt: Date
  /** Whether the transaction is read-only */
  readOnly?: boolean
}

/**
 * Query parameters for transactional operations
 * 
 * @template T - Type of database record
 */
export interface DBTransactionalQuery<T extends DBAnyRecord = DBAnyRecord> extends DBBaseQuery {
  /** Transaction context */
  transaction?: DBTransaction
  /** Isolation level for the operation */
  isolationLevel?: 'READ_UNCOMMITTED' | 'READ_COMMITTED' | 'REPEATABLE_READ' | 'SERIALIZABLE'
}

// ============================================================================
// SEARCH AND FILTERING
// ============================================================================

/**
 * Advanced search parameters for database queries
 */
export interface DBSearchQuery extends DBBaseQuery, FilterOptions {
  /** Full-text search query */
  fullTextSearch?: string
  /** Search in specific fields */
  searchFields?: string[]
  /** Fuzzy search tolerance */
  fuzzyTolerance?: number
  /** Highlight search matches */
  highlight?: boolean
}

/**
 * Aggregation query parameters
 */
export interface DBAggregationQuery extends DBBaseQuery {
  /** Group by fields */
  groupBy?: string[]
  /** Aggregation functions to apply */
  aggregations?: Array<{
    field: string
    function: 'count' | 'sum' | 'avg' | 'min' | 'max'
    alias?: string
  }>
  /** Having conditions for grouped results */
  having?: Record<string, any>
}

// ============================================================================
// QUERY RESULT INTERFACES
// ============================================================================

/**
 * Standard database query result
 * 
 * @template T - Type of returned data
 */
export interface DBQueryResult<T = any> {
  /** Query result data */
  data: T
  /** Number of affected rows */
  affectedRows?: number
  /** Query execution time in milliseconds */
  executionTime?: number
  /** Additional metadata */
  metadata?: Record<string, any>
}

/**
 * Paginated database query result
 * 
 * @template T - Type of individual items
 */
export interface DBPaginatedResult<T = any> extends DBQueryResult<T[]> {
  /** Pagination information */
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrevious: boolean
  }
}

/**
 * Aggregated database query result
 */
export interface DBAggregatedResult extends DBQueryResult {
  /** Aggregation results */
  data: Array<{
    /** Grouped field values */
    group: Record<string, any>
    /** Aggregated values */
    aggregations: Record<string, number>
  }>
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Extract query type for a specific database record
 * 
 * @template T - Database record type
 */
export type QueryForRecord<T extends DBAnyRecord> = 
  T extends DBLoadout ? DBLoadoutQuery :
  T extends DBItemRecord ? DBItemQuery<T> :
  DBBaseQuery

/**
 * Database operation types
 */
export type DBOperation = 'create' | 'read' | 'update' | 'delete' | 'bulk'

/**
 * Database query options
 */
export interface DBQueryOptions {
  /** Query timeout in milliseconds */
  timeout?: number
  /** Enable query caching */
  cache?: boolean
  /** Cache TTL in seconds */
  cacheTTL?: number
  /** Enable query logging */
  log?: boolean
}
