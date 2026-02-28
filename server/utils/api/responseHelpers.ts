import type { H3Event } from 'h3'
import { createError } from 'h3'
import { useEvent } from 'nitropack/runtime/context'
import type {
    APIResponse,
    APIPaginatedResponse,
    APICollectionResponse,
    PaginationMeta,
    APIResponseMeta,
    ErrorInfo,
} from '~/types'
import { API_VERSION, PAGINATION_DEFAULTS } from '~/server/utils/constants'
import { getRequestLogger } from '~/server/logging/request'

function resolveRequestId(event?: H3Event): string | undefined {
    if (event?.context.requestId) {
        return event.context.requestId
    }

    try {
        const currentEvent = useEvent()
        return currentEvent?.context.requestId
    } catch {
        return undefined
    }
}

/**
 * Creates standardized response metadata
 * @param startTime Optional start time for processing time calculation
 * @param additionalMeta Additional metadata to include
 */
export function createResponseMeta(
    startTime?: number,
    additionalMeta: Record<string, unknown> = {},
    event?: H3Event
): APIResponseMeta {
    const meta: APIResponseMeta = {
        timestamp: new Date().toISOString(),
        apiVersion: API_VERSION,
        ...additionalMeta,
    }

    if (startTime) {
        meta.processingTime = Date.now() - startTime
    }

    const requestId = resolveRequestId(event)
    if (requestId && meta.requestId === undefined) {
        meta.requestId = requestId
    }

    return meta
}

/**
 * Creates standardized pagination metadata
 * @param currentPage Current page number (1-based)
 * @param totalItems Total number of items
 * @param limit Items per page
 * @param count Items in current response
 */
export function createPaginationMeta(
    currentPage: number,
    totalItems: number,
    limit: number,
    count: number
): PaginationMeta {
    const totalPages = Math.ceil(totalItems / limit)

    return {
        currentPage,
        totalPages,
        totalItems,
        limit,
        count,
        hasNext: currentPage < totalPages,
        hasPrevious: currentPage > 1,
    }
}

/**
 * Creates a successful API response
 * @param data The response data
 * @param meta Response metadata
 * @param message Optional success message
 */
export function createSuccessResponse<T>(
    data: T,
    meta: APIResponseMeta,
    message?: string
): APIResponse<T> {
    return {
        success: true,
        data,
        meta,
        ...(message && { message }),
    }
}

/**
 * Creates a successful paginated API response
 * @param data The response data array
 * @param pagination Pagination metadata
 * @param meta Response metadata
 * @param appliedFilters Applied filters
 * @param availableFilters Available filter options
 * @param message Optional success message
 */
export function createPaginatedResponse<T>(
    data: T[],
    pagination: PaginationMeta,
    meta: APIResponseMeta,
    appliedFilters?: Record<string, unknown>,
    availableFilters?: Record<string, unknown[]>,
    message?: string
): APIPaginatedResponse<T> {
    return {
        success: true,
        data,
        meta,
        pagination,
        ...(appliedFilters && { appliedFilters }),
        ...(availableFilters && { availableFilters }),
        ...(message && { message }),
    }
}

/**
 * Creates a successful collection API response
 * @param data The response data array
 * @param totalCount Total count of items in collection
 * @param meta Response metadata
 * @param categories Available categories
 * @param filters Available filters
 * @param message Optional success message
 */
export function createCollectionResponse<T>(
    data: T[],
    totalCount: number,
    meta: APIResponseMeta,
    categories?: string[],
    filters?: Record<string, unknown[]>,
    message?: string
): APICollectionResponse<T> {
    return {
        success: true,
        data,
        meta,
        collection: {
            totalCount,
            ...(categories && { categories }),
            ...(filters && { filters }),
        },
        ...(message && { message }),
    }
}

/**
 * Creates an error API response
 * @param error Error information
 * @param meta Response metadata
 * @param statusCode HTTP status code (for throwing createError)
 */
export function createErrorResponse(
    error: ErrorInfo,
    meta: APIResponseMeta,
    statusCode: number = 500
): never {
    const errorResponse: APIResponse<null> = {
        success: false,
        data: null,
        meta,
        error,
        message: error.message,
    }

    throw createError({
        statusCode,
        data: errorResponse,
    })
}

/**
 * Creates standardized error information
 * @param code Error code
 * @param message Error message
 * @param details Additional error details
 * @param fieldErrors Field-specific validation errors
 */
export function createErrorInfo(
    code: string,
    message: string,
    details?: unknown,
    fieldErrors?: Record<string, string[]>
): ErrorInfo {
    const result: ErrorInfo = { code, message }
    if (details !== undefined && details !== null) {
        result.details = details
    }
    if (fieldErrors !== undefined) {
        result.fieldErrors = fieldErrors
    }
    return result
}

/**
 * Wraps an async function with standardized error handling
 * @param fn The async function to wrap
 * @param errorCode Default error code for unhandled errors
 */
export function withErrorHandling<R>(
    fn: (event: H3Event) => Promise<R>,
    errorCode: string = 'INTERNAL_ERROR'
) {
    return async (event: H3Event): Promise<R> => {
        const startTime = Date.now()

        try {
            return await fn(event)
        } catch (error: unknown) {
            const meta = createResponseMeta(startTime, {}, event)

            // If it's already a structured error, re-throw it
            if (error && typeof error === 'object' && 'statusCode' in error && 'data' in error) {
                throw error
            }

            const statusCode =
                error &&
                typeof error === 'object' &&
                'statusCode' in error &&
                typeof error.statusCode === 'number'
                    ? error.statusCode
                    : 500

            if (statusCode >= 500) {
                getRequestLogger(event).error(
                    {
                        errorCode,
                        requestId: meta.requestId,
                        err: error,
                    },
                    'Unhandled API error'
                )
            }

            // Create standardized error response
            const errorInfo = createErrorInfo(
                errorCode,
                error instanceof Error ? error.message : 'An unexpected error occurred',
                error
            )

            createErrorResponse(errorInfo, meta, statusCode)
        }
    }
}

/**
 * Calculates pagination parameters from query
 * @param query Query parameters
 * @param defaultLimit Default items per page
 * @param maxLimit Maximum items per page
 */
export function calculatePagination(
    query: Record<string, unknown>,
    defaultLimit: number = PAGINATION_DEFAULTS.DEFAULT_LIMIT,
    maxLimit: number = PAGINATION_DEFAULTS.MAX_LIMIT
) {
    const page = Math.max(
        PAGINATION_DEFAULTS.DEFAULT_PAGE,
        Number(query.page) || PAGINATION_DEFAULTS.DEFAULT_PAGE
    )
    const limit = Math.min(
        Math.max(PAGINATION_DEFAULTS.MIN_LIMIT, Number(query.limit) || defaultLimit),
        maxLimit
    )
    const offset = (page - 1) * limit

    return { page, limit, offset }
}

/**
 * Extracts available filter options from data array
 * @param data Data array to analyze
 * @param filterFields Fields to extract filter options from
 */
export function extractFilterOptions<T>(
    data: T[],
    filterFields: Record<string, string>
): Record<string, unknown[]> {
    const filters: Record<string, unknown[]> = {}

    Object.entries(filterFields).forEach(([filterKey, fieldPath]) => {
        const values = new Set<unknown>()

        data.forEach((item) => {
            const value = getNestedValue(item, fieldPath)
            if (value !== null && value !== undefined) {
                values.add(value)
            }
        })

        filters[filterKey] = Array.from(values).sort()
    })

    return filters
}

/**
 * Gets nested value from object using dot notation
 * @param obj Object to get value from
 * @param path Dot-separated path (e.g., 'rarity.name')
 */
function getNestedValue(obj: unknown, path: string): unknown {
    return path
        .split('.')
        .reduce(
            (current: Record<string, unknown> | undefined, key) =>
                current
                    ? ((current as Record<string, unknown>)[key] as
                          | Record<string, unknown>
                          | undefined)
                    : undefined,
            obj as Record<string, unknown>
        )
}
