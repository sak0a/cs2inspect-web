import { db } from '~/server/database/client'

export function useDatabase() {
  return db
}
