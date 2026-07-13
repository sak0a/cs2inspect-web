import { withErrorHandling } from '~/server/utils/api'
import { defineEventHandler } from 'h3'
import type { H3Event } from 'h3'

/**
 * Creates an event handler with consistent error handling.
 * This is a convenience wrapper around withErrorHandling that also wraps
 * the handler in defineEventHandler for cleaner API route definitions.
 *
 * @param handler - The async handler function to wrap
 * @param errorCode - Optional error code for unhandled errors (default: 'INTERNAL_ERROR')
 * @returns A defineEventHandler with error handling applied
 *
 * @example
 * // Instead of:
 * export default defineEventHandler(withErrorHandling(async (event) => {
 *     // Handler code
 * }, 'SAVE_WEAPON_ERROR'))
 *
 * // Use:
 * export default useErrorHandling(async (event) => {
 *     // Handler code
 * }, 'SAVE_WEAPON_ERROR')
 */
export function useErrorHandling<R>(
  handler: (event: H3Event) => Promise<R>,
  errorCode: string = 'INTERNAL_ERROR'
) {
  return defineEventHandler(withErrorHandling(handler, errorCode))
}

/**
 * Common error codes used across the API.
 * Use these constants for consistent error tracking and logging.
 */
export const ErrorCodes = {
  // Authentication errors
  AUTH_ERROR: 'AUTH_ERROR',
  AUTH_VALIDATION_ERROR: 'AUTH_VALIDATION_ERROR',

  // Loadout errors
  LOADOUT_ERROR: 'LOADOUT_ERROR',
  LOADOUT_SELECT_ERROR: 'LOADOUT_SELECT_ERROR',
  LOADOUT_IMPORT_ERROR: 'LOADOUT_IMPORT_ERROR',
  LOADOUT_SHARE_ERROR: 'LOADOUT_SHARE_ERROR',
  LOADOUT_DUPLICATE_ERROR: 'LOADOUT_DUPLICATE_ERROR',
  LOADOUT_CLEAR_ERROR: 'LOADOUT_CLEAR_ERROR',

  // Item errors
  ITEM_FETCH_ERROR: 'ITEM_FETCH_ERROR',
  WEAPON_FETCH_ERROR: 'WEAPON_FETCH_ERROR',
  KNIFE_FETCH_ERROR: 'KNIFE_FETCH_ERROR',
  GLOVE_FETCH_ERROR: 'GLOVE_FETCH_ERROR',
  PIN_FETCH_ERROR: 'PIN_FETCH_ERROR',

  // Inspect errors
  INSPECT_ERROR: 'INSPECT_ERROR',
  INSPECT_URL_ERROR: 'INSPECT_URL_ERROR',
  INSPECT_DECODE_ERROR: 'INSPECT_DECODE_ERROR',

  // Proxy errors
  PROXY_ERROR: 'PROXY_ERROR',
  IMAGE_PROXY_ERROR: 'IMAGE_PROXY_ERROR',

  // Health errors
  HEALTH_CHECK_ERROR: 'HEALTH_CHECK_ERROR',

  // Data errors
  DATA_FETCH_ERROR: 'DATA_FETCH_ERROR',
  SAVE_ERROR: 'SAVE_ERROR',

  // Generic errors
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NOT_FOUND_ERROR: 'NOT_FOUND_ERROR',
} as const

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes]
