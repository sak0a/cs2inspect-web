import { db } from '~/server/database/client'
import { syncNotifications } from '~/server/database/schema/syncNotifications'
import { lt, sql } from 'drizzle-orm'
import { Logger } from '~/server/utils/logger'

let cleanupInterval: ReturnType<typeof setInterval> | null = null

export default defineNitroPlugin(() => {
  if (process.env.E2E_DISABLE_BACKGROUND_JOBS === 'true') {
    return
  }

  cleanupInterval = setInterval(
    async () => {
      try {
        await db
          .delete(syncNotifications)
          .where(lt(syncNotifications.created_at, sql`NOW() - INTERVAL 5 MINUTE`))
      } catch (error) {
        Logger.error(
          `Notification cleanup failed error=${error instanceof Error ? error.message : String(error)}`,
          'sync-cleanup'
        )
      }
    },
    5 * 60 * 1000
  )

  Logger.info('Notification cleanup schedule interval=5m', 'sync-cleanup')
})

// Nitro calls this on shutdown
export function cleanup() {
  if (cleanupInterval) {
    clearInterval(cleanupInterval)
    cleanupInterval = null
  }
}
