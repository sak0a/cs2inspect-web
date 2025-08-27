import {
    BaseAPIResponse,
    PaginatedAPIResponse,
    CollectionAPIResponse,
    PaginationMeta,
    ResponseMeta,
    ErrorInfo
} from './interfaces';
import { API_VERSION, PAGINATION_DEFAULTS } from './constants';

/**
 * Creates standardized response metadata
 * @param startTime Optional start time for processing time calculation
 * @param additionalMeta Additional metadata to include
 */
export function createResponseMeta(
    startTime?: number,
    additionalMeta: Record<string, any> = {}
): ResponseMeta {
    const meta: ResponseMeta = {
        timestamp: new Date().toISOString(),
        apiVersion: API_VERSION,
        ...additionalMeta
    };

    if (startTime) {
        meta.processingTime = Date.now() - startTime;
    }

    return meta;
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
    const totalPages = Math.ceil(totalItems / limit);
    
    return {
        currentPage,
        totalPages,
        totalItems,
        limit,
        count,
        hasNext: currentPage < totalPages,
        hasPrevious: currentPage > 1
    };
}

/**
 * Creates a successful API response
 * @param data The response data
 * @param meta Response metadata
 * @param message Optional success message
 */
export function createSuccessResponse<T>(
    data: T,
    meta: ResponseMeta,
    message?: string
): BaseAPIResponse<T> {
    return {
        success: true,
        data,
        meta,
        ...(message && { message })
    };
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
    meta: ResponseMeta,
    appliedFilters?: Record<string, any>,
    availableFilters?: Record<string, any[]>,
    message?: string
): PaginatedAPIResponse<T> {
    return {
        success: true,
        data,
        meta,
        pagination,
        ...(appliedFilters && { appliedFilters }),
        ...(availableFilters && { availableFilters }),
        ...(message && { message })
    };
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
    meta: ResponseMeta,
    categories?: string[],
    filters?: Record<string, any[]>,
    message?: string
): CollectionAPIResponse<T> {
    return {
        success: true,
        data,
        meta,
        collection: {
            totalCount,
            ...(categories && { categories }),
            ...(filters && { filters })
        },
        ...(message && { message })
    };
}

/**
 * Creates an error API response
 * @param error Error information
 * @param meta Response metadata
 * @param statusCode HTTP status code (for throwing createError)
 */
export function createErrorResponse(
    error: ErrorInfo,
    meta: ResponseMeta,
    statusCode: number = 500
): never {
    const errorResponse: BaseAPIResponse<null> = {
        success: false,
        data: null,
        meta,
        error,
        message: error.message
    };

    throw createError({
        statusCode,
        data: errorResponse
    });
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
    details?: any,
    fieldErrors?: Record<string, string[]>
): ErrorInfo {
    return {
        code,
        message,
        ...(details && { details }),
        ...(fieldErrors && { fieldErrors })
    };
}

/**
 * Wraps an async function with standardized error handling
 * @param fn The async function to wrap
 * @param errorCode Default error code for unhandled errors
 */
export function withErrorHandling<T extends any[], R>(
    fn: (...args: T) => Promise<R>,
    errorCode: string = 'INTERNAL_ERROR'
) {
    return async (...args: T): Promise<R> => {
        const startTime = Date.now();
        
        try {
            return await fn(...args);
        } catch (error: any) {
            const meta = createResponseMeta(startTime);
            
            // If it's already a structured error, re-throw it
            if (error.statusCode && error.data) {
                throw error;
            }
            
            // Create standardized error response
            const errorInfo = createErrorInfo(
                errorCode,
                error.message || 'An unexpected error occurred',
                error
            );
            
            createErrorResponse(errorInfo, meta, error.statusCode || 500);
        }
    };
}

/**
 * Calculates pagination parameters from query
 * @param query Query parameters
 * @param defaultLimit Default items per page
 * @param maxLimit Maximum items per page
 */
export function calculatePagination(
    query: Record<string, any>,
    defaultLimit: number = PAGINATION_DEFAULTS.DEFAULT_LIMIT,
    maxLimit: number = PAGINATION_DEFAULTS.MAX_LIMIT
) {
    const page = Math.max(PAGINATION_DEFAULTS.DEFAULT_PAGE, Number(query.page) || PAGINATION_DEFAULTS.DEFAULT_PAGE);
    const limit = Math.min(
        Math.max(PAGINATION_DEFAULTS.MIN_LIMIT, Number(query.limit) || defaultLimit),
        maxLimit
    );
    const offset = (page - 1) * limit;

    return { page, limit, offset };
}

/**
 * Extracts available filter options from data array
 * @param data Data array to analyze
 * @param filterFields Fields to extract filter options from
 */
export function extractFilterOptions<T>(
    data: T[],
    filterFields: Record<string, string>
): Record<string, any[]> {
    const filters: Record<string, any[]> = {};
    
    Object.entries(filterFields).forEach(([filterKey, fieldPath]) => {
        const values = new Set<any>();
        
        data.forEach(item => {
            const value = getNestedValue(item, fieldPath);
            if (value !== null && value !== undefined) {
                values.add(value);
            }
        });
        
        filters[filterKey] = Array.from(values).sort();
    });
    
    return filters;
}

/**
 * Gets nested value from object using dot notation
 * @param obj Object to get value from
 * @param path Dot-separated path (e.g., 'rarity.name')
 */
function getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
}
