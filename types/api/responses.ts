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
  [key: string]: unknown
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
export interface APIResponse<TData = unknown> {
  /** Whether the request was successful */
  success: boolean
  /** The main data payload (present when success is true) */
  data?: TData
  /** Response metadata */
  meta?: APIResponseMeta
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
export interface APIPaginatedResponse<TData = unknown> extends APIResponse<TData[]> {
  /** Pagination information (required for paginated responses) */
  pagination: PaginationMeta
  /** Applied filters information */
  appliedFilters?: Record<string, unknown>
  /** Available filter options for the endpoint */
  availableFilters?: Record<string, unknown[]>
}

/**
 * Collection API response interface for endpoints that return grouped data
 * 
 * @template TData - Type of individual items in the collection
 * 
 * @description Used for endpoints that return collections with additional metadata
 */
export interface APICollectionResponse<TData = unknown> extends APIResponse<TData[]> {
  /** Collection-specific metadata */
  collection: {
    /** Total count of items in the collection */
    totalCount: number
    /** Available categories/types in the collection */
    categories?: string[]
    /** Available filters and their options */
    filters?: Record<string, unknown[]>
    /** Collection statistics */
    stats?: Record<string, number>
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
export type AnyAPIResponse<TData = unknown> =
  | APIResponse<TData>
  | APIPaginatedResponse<TData>
  | APICollectionResponse<TData>

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
