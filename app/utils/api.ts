/**
 * Centralized API client for CS2Inspect
 *
 * Provides a typed wrapper around Nuxt's $fetch with:
 * - Automatic error handling
 * - Global 401 redirect logic
 * - Consistent response structure
 * - Type safety for requests and responses
 */

import type { APIResponse } from '~/types'

/**
 * Configuration options for the API client
 */
export interface ApiClientOptions {
  onUnauthorized?: () => void
  baseURL?: string
}

/**
 * Create a configured API client instance
 *
 * @param options - Configuration options
 * @returns API client with type-safe methods
 */
export function createApiClient(options: ApiClientOptions = {}) {
  const defaultOptions: RequestInit = {
    credentials: 'include',
  }

  /**
   * Handle API errors globally
   */
  const handleError = (error: unknown): never => {
    if (error && typeof error === 'object' && 'statusCode' in error) {
      const statusCode = (error as { statusCode: number }).statusCode

      // Handle 401 Unauthorized
      if (statusCode === 401) {
        if (options.onUnauthorized) {
          options.onUnauthorized()
        } else {
          // Default behavior: redirect to home
          if (import.meta.client) {
            navigateTo('/')
          }
        }
      }
    }

    throw error
  }

  return {
    /**
     * Perform a GET request
     * @template T - Expected response data type
     * @param url - API endpoint
     * @param query - Query parameters
     */
    async get<T>(
      url: string,
      query?: Record<string, string | number | boolean | null | undefined>
    ) {
      try {
        const cleanQuery: Record<string, string | number | boolean> = {}
        if (query) {
          Object.entries(query).forEach(([key, value]) => {
            if (value !== null && value !== undefined) {
              cleanQuery[key] = value
            }
          })
        }

        return await $fetch<APIResponse<T>>(url, {
          ...defaultOptions,
          method: 'GET',
          query: Object.keys(cleanQuery).length > 0 ? cleanQuery : undefined,
        })
      } catch (error) {
        return handleError(error)
      }
    },

    /**
     * Perform a POST request
     * @template T - Expected response data type
     * @param url - API endpoint
     * @param body - Request body
     */
    async post<T>(url: string, body?: unknown) {
      try {
        return await $fetch<APIResponse<T>>(url, {
          ...defaultOptions,
          method: 'POST',
          body: body as Record<string, unknown>,
        })
      } catch (error) {
        return handleError(error)
      }
    },

    /**
     * Perform a PUT request
     * @template T - Expected response data type
     * @param url - API endpoint
     * @param body - Request body
     */
    async put<T>(url: string, body?: unknown) {
      try {
        return await $fetch<APIResponse<T>>(url, {
          ...defaultOptions,
          method: 'PUT',
          body: body as Record<string, unknown>,
        })
      } catch (error) {
        return handleError(error)
      }
    },

    /**
     * Perform a DELETE request
     * @template T - Expected response data type
     * @param url - API endpoint
     * @param query - Query parameters
     */
    async delete<T>(
      url: string,
      query?: Record<string, string | number | boolean | null | undefined>
    ) {
      try {
        const cleanQuery: Record<string, string | number | boolean> = {}
        if (query) {
          Object.entries(query).forEach(([key, value]) => {
            if (value !== null && value !== undefined) {
              cleanQuery[key] = value
            }
          })
        }

        return await $fetch<APIResponse<T>>(url, {
          ...defaultOptions,
          method: 'DELETE',
          query: Object.keys(cleanQuery).length > 0 ? cleanQuery : undefined,
        })
      } catch (error) {
        return handleError(error)
      }
    },
  }
}

/**
 * Default API client instance
 * Can be used directly throughout the application
 */
export const api = createApiClient()
