/**
 * Common utility types and interfaces used throughout the CS2Inspect application
 * 
 * @description This file contains fundamental types that are shared across
 * multiple modules and components. These types provide the foundation for
 * type safety throughout the application.
 * 
 * @version 2.0.0
 * @since 2.0.0
 */

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Unique identifier type for database records and API entities
 * 
 * @description Used consistently across the application for entity identification
 * @example "user_123", "loadout_456", "weapon_789"
 */
export type EntityId = string

/**
 * Timestamp string in ISO 8601 format
 * 
 * @description Used for created_at, updated_at, and other timestamp fields
 * @example "2024-01-15T10:30:00.000Z"
 */
export type Timestamp = string

/**
 * Generic callback function type
 * 
 * @template T - The type of data passed to the callback
 */
export type Callback<T = void> = (data: T) => void

/**
 * Generic async callback function type
 * 
 * @template T - The type of data passed to the callback
 */
export type AsyncCallback<T = void> = (data: T) => Promise<void>

/**
 * Make specific properties of an interface optional
 * 
 * @template T - The base interface
 * @template K - Keys to make optional
 */
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>

/**
 * Make specific properties of an interface required
 * 
 * @template T - The base interface
 * @template K - Keys to make required
 */
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>

// ============================================================================
// TEAM AND SIDE DEFINITIONS
// ============================================================================

/**
 * Counter-Strike team sides
 * 
 * @description Represents the two main teams in Counter-Strike
 */
export enum TeamSide {
  /** Terrorist team */
  Terrorist = 1,
  /** Counter-Terrorist team */
  CounterTerrorist = 2
}

/**
 * Team availability for items
 * 
 * @description Indicates which teams can use a particular item
 */
export type TeamAvailability = 'both' | 'terrorists' | 'counter-terrorists'

// ============================================================================
// RARITY AND QUALITY DEFINITIONS
// ============================================================================

/**
 * Item rarity information
 * 
 * @description Represents the rarity tier of CS2 items with associated color
 */
export interface ItemRarity {
  /** Unique identifier for the rarity */
  id: string
  /** Display name of the rarity (e.g., "Covert", "Classified") */
  name: string
  /** Hex color code associated with this rarity */
  color: string
}

/**
 * Item quality levels
 * 
 * @description Represents different quality tiers for items
 */
export enum ItemQuality {
  /** Normal quality */
  Normal = 0,
  /** Genuine quality */
  Genuine = 1,
  /** Vintage quality */
  Vintage = 2,
  /** Unusual quality */
  Unusual = 5,
  /** Unique quality */
  Unique = 6,
  /** Community quality */
  Community = 7,
  /** Valve quality */
  Valve = 8,
  /** Self-Made quality */
  SelfMade = 9,
  /** Strange quality */
  Strange = 11
}

// ============================================================================
// ERROR HANDLING
// ============================================================================

/**
 * Standard error information structure
 * 
 * @description Used consistently across API responses and error handling
 */
export interface ErrorInfo {
  /** Error code for programmatic handling */
  code: string
  /** Human-readable error message */
  message: string
  /** Additional error details */
  details?: Record<string, any>
  /** Stack trace (development only) */
  stack?: string
}

/**
 * Validation error for form fields
 * 
 * @description Used in form validation and user input handling
 */
export interface ValidationError {
  /** Field name that failed validation */
  field: string
  /** Validation error message */
  message: string
  /** Validation rule that was violated */
  rule: string
  /** Current field value that failed validation */
  value: any
}

// ============================================================================
// PAGINATION AND FILTERING
// ============================================================================

/**
 * Pagination parameters for API requests
 * 
 * @description Standard pagination interface used across all paginated endpoints
 */
export interface PaginationOptions {
  /** Current page number (1-based) */
  page: number
  /** Number of items per page */
  limit: number
  /** Total number of items available */
  total?: number
}

/**
 * Pagination metadata for API responses
 * 
 * @description Provides pagination context in API responses
 */
export interface PaginationMeta extends PaginationOptions {
  /** Total number of pages available */
  totalPages: number
  /** Whether there is a next page */
  hasNext: boolean
  /** Whether there is a previous page */
  hasPrevious: boolean
}

/**
 * Generic filter options for data queries
 * 
 * @description Used for filtering lists and search functionality
 */
export interface FilterOptions {
  /** Search query string */
  search?: string
  /** Sort field */
  sortBy?: string
  /** Sort direction */
  sortOrder?: 'asc' | 'desc'
  /** Additional filter criteria */
  filters?: Record<string, any>
}

// ============================================================================
// LOADING AND STATE MANAGEMENT
// ============================================================================

/**
 * Loading state for async operations
 * 
 * @description Represents different states of async operations
 */
export enum LoadingState {
  /** Operation not started */
  Idle = 'idle',
  /** Operation in progress */
  Loading = 'loading',
  /** Operation completed successfully */
  Success = 'success',
  /** Operation failed with error */
  Error = 'error'
}

/**
 * Async operation result
 * 
 * @template T - Type of successful result data
 * @template E - Type of error data
 */
export interface AsyncResult<T = any, E = ErrorInfo> {
  /** Current state of the operation */
  state: LoadingState
  /** Result data (available when state is Success) */
  data?: T
  /** Error information (available when state is Error) */
  error?: E
  /** Whether the operation is currently loading */
  isLoading: boolean
  /** Whether the operation completed successfully */
  isSuccess: boolean
  /** Whether the operation failed */
  isError: boolean
}

// ============================================================================
// USER AND AUTHENTICATION
// ============================================================================

/**
 * Steam user profile information
 * 
 * @description Basic Steam user data used throughout the application
 */
export interface UserProfile {
  /** Steam ID (64-bit) */
  steamId: string
  /** Display name */
  displayName: string
  /** Avatar image URL */
  avatar: string
  /** Steam profile URL */
  profileUrl: string
}

/**
 * User session information
 * 
 * @description Extended user data including session details
 */
export interface UserSession extends UserProfile {
  /** Session token */
  token: string
  /** Session expiration timestamp */
  expiresAt: Timestamp
  /** User permissions */
  permissions: string[]
}
