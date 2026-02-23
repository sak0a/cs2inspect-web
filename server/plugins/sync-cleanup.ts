import { db } from '~/server/database/client'
import { syncNotifications } from '~/server/database/schema/syncNotifications'
import { lt, sql } from 'drizzle-orm'

let cleanupInterval: ReturnType<typeof setInterval> | null = null

export default defineNitroPlugin(() => {
    // Run cleanup every 5 minutes
    cleanupInterval = setInterval(async () => {
        try {
            await db.delete(syncNotifications)
                .where(lt(syncNotifications.created_at, sql`NOW() - INTERVAL 5 MINUTE`))
        } catch (error) {
            console.error('[Sync Cleanup] Failed to clean up old notifications:', error)
        }
    }, 5 * 60 * 1000)

    console.log('[Sync Cleanup] Notification cleanup scheduled (every 5 minutes)')
})

// Nitro calls this on shutdown
export function cleanup() {
    if (cleanupInterval) {
        clearInterval(cleanupInterval)
        cleanupInterval = null
    }
}
