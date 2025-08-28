/**
 * API response interfaces and types for the CS2Inspect application
 * 
 * @description This file contains standardized response structures used
 * across all API endpoints. These interfaces ensure consistent response
 * formats and proper error handling.
 * 
 * @version 2.0.0
 * @since 2.0.0
 */

import type { 
  EntityId, 
  Timestamp, 
  ErrorInfo, 
  PaginationMeta 
} from '../core/common'

// ============================================================================
// BASE RESPONSE INTERFACES
// ============================================================================

/**
 * Standard metadata included in all API responses
 * 
 * @description Provides additional context and information about the response
 */
export interface APIResponseMeta {
  /** Timestamp when the response was generated */
  timestamp: Timestamp
  /** Time taken to process the request (in milliseconds) */
  processingTime?: number
  /** Version of the API that handled the request */
  apiVersion?: string
  /** Request ID for debugging and tracing */
  requestId?: string
  /** Additional metadata specific to the endpoint */
  [key: string]: any
}

/**
 * Base API response interface that all API responses extend
 * 
 * @template TData - Type of the response data payload
 * 
 * @description All API responses follow this structure for consistency
 * 
 * @example
 * ```typescript
 * const response: APIResponse<WeaponSkin[]> = {
 *   success: true,
 *   data: [...weapons],
 *   meta: {
 *     timestamp: "2024-01-15T10:30:00.000Z",
 *     processingTime: 45
 *   }
 * }
 * ```
 */
export interface APIResponse<TData = any> {
  /** Whether the request was successful */
  success: boolean
  /** The main data payload (present when success is true) */
  data?: TData
  /** Response metadata */
  meta: APIResponseMeta
  /** Error information (present when success is false) */
  error?: ErrorInfo
  /** Human-readable message */
  message?: string
}

/**
 * Paginated API response interface for endpoints that return lists
 * 
 * @template TData - Type of individual items in the data array
 * 
 * @description Used for endpoints that return paginated collections of data
 * 
 * @example
 * ```typescript
 * const response: APIPaginatedResponse<WeaponSkin> = {
 *   success: true,
 *   data: [...weapons],
 *   pagination: {
 *     page: 1,
 *     limit: 20,
 *     total: 150,
 *     totalPages: 8,
 *     hasNext: true,
 *     hasPrevious: false
 *   },
 *   meta: { timestamp: "2024-01-15T10:30:00.000Z" }
 * }
 * ```
 */
export interface APIPaginatedResponse<TData = any> extends APIResponse<TData[]> {
  /** Pagination information (required for paginated responses) */
  pagination: PaginationMeta
  /** Applied filters information */
  appliedFilters?: Record<string, any>
  /** Available filter options for the endpoint */
  availableFilters?: Record<string, any[]>
}

/**
 * Collection API response interface for endpoints that return grouped data
 * 
 * @template TData - Type of individual items in the collection
 * 
 * @description Used for endpoints that return collections with additional metadata
 */
export interface APICollectionResponse<TData = any> extends APIResponse<TData[]> {
  /** Collection-specific metadata */
  collection: {
    /** Total count of items in the collection */
    totalCount: number
    /** Available categories/types in the collection */
    categories?: string[]
    /** Available filters and their options */
    filters?: Record<string, any[]>
    /** Collection statistics */
    stats?: Record<string, number>
  }
}

// ============================================================================
// SPECIALIZED RESPONSE TYPES
// ============================================================================

/**
 * Response for create operations
 * 
 * @template TData - Type of the created entity
 * 
 * @description Used when creating new entities via API
 */
export interface APICreateResponse<TData = any> extends APIResponse<TData> {
  /** ID of the created entity */
  createdId: EntityId
  /** Location header for the created resource */
  location?: string
}

/**
 * Response for update operations
 * 
 * @template TData - Type of the updated entity
 * 
 * @description Used when updating existing entities via API
 */
export interface APIUpdateResponse<TData = any> extends APIResponse<TData> {
  /** ID of the updated entity */
  updatedId: EntityId
  /** Fields that were modified */
  modifiedFields?: string[]
}

/**
 * Response for delete operations
 * 
 * @description Used when deleting entities via API
 */
export interface APIDeleteResponse extends APIResponse<void> {
  /** ID of the deleted entity */
  deletedId: EntityId
  /** Whether the deletion was soft or hard */
  deletionType?: 'soft' | 'hard'
}

/**
 * Response for batch operations
 * 
 * @template TData - Type of individual items in the batch
 * 
 * @description Used for operations that affect multiple entities
 */
export interface APIBatchResponse<TData = any> extends APIResponse<TData[]> {
  /** Batch operation statistics */
  batch: {
    /** Total number of items processed */
    totalProcessed: number
    /** Number of successful operations */
    successful: number
    /** Number of failed operations */
    failed: number
    /** Details of failed operations */
    failures?: Array<{
      id: EntityId
      error: ErrorInfo
    }>
  }
}

// ============================================================================
// ERROR RESPONSE TYPES
// ============================================================================

/**
 * Validation error response
 * 
 * @description Used when request validation fails
 */
export interface APIValidationErrorResponse extends APIResponse<never> {
  success: false
  error: ErrorInfo & {
    code: 'VALIDATION_ERROR'
    /** Field-specific validation errors */
    validationErrors: Array<{
      field: string
      message: string
      rule: string
      value: any
    }>
  }
}

/**
 * Authentication error response
 * 
 * @description Used when authentication fails or is required
 */
export interface APIAuthErrorResponse extends APIResponse<never> {
  success: false
  error: ErrorInfo & {
    code: 'AUTH_ERROR' | 'TOKEN_EXPIRED' | 'INSUFFICIENT_PERMISSIONS'
    /** Required permissions for the operation */
    requiredPermissions?: string[]
  }
}

/**
 * Rate limit error response
 * 
 * @description Used when rate limits are exceeded
 */
export interface APIRateLimitErrorResponse extends APIResponse<never> {
  success: false
  error: ErrorInfo & {
    code: 'RATE_LIMIT_EXCEEDED'
    /** When the rate limit resets */
    resetAt: Timestamp
    /** Number of requests remaining */
    remaining: number
    /** Rate limit window in seconds */
    windowSeconds: number
  }
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Union type of all possible API response types
 * 
 * @template TData - Type of successful response data
 */
export type AnyAPIResponse<TData = any> = 
  | APIResponse<TData>
  | APIPaginatedResponse<TData>
  | APICollectionResponse<TData>
  | APICreateResponse<TData>
  | APIUpdateResponse<TData>
  | APIDeleteResponse
  | APIBatchResponse<TData>
  | APIValidationErrorResponse
  | APIAuthErrorResponse
  | APIRateLimitErrorResponse

/**
 * Extract the data type from an API response type
 * 
 * @template T - API response type
 */
export type ExtractAPIResponseData<T> = T extends APIResponse<infer U> ? U : never

/**
 * Type guard to check if a response is successful
 * 
 * @param response - API response to check
 * @returns True if the response indicates success
 */
export function isSuccessfulResponse<T>(
  response: AnyAPIResponse<T>
): response is APIResponse<T> & { success: true; data: T } {
  return response.success === true && response.data !== undefined
}

/**
 * Type guard to check if a response is an error
 * 
 * @param response - API response to check
 * @returns True if the response indicates an error
 */
export function isErrorResponse(
  response: AnyAPIResponse
): response is AnyAPIResponse & { success: false; error: ErrorInfo } {
  return response.success === false && response.error !== undefined
}
