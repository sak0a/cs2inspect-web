import { db } from '~/server/database/client'

export * from './saveHelpers'
export * from './itemSaveHandler'

/**
 * Returns the database instance for use in server utilities and API handlers
 * This provides a consistent way to access the database across the codebase
 */
export function useDatabase() {
  return db
}
