import { defineEventHandler, createError, setResponseHeader, setResponseStatus } from 'h3'
import { db } from '~/server/database/client'
import { syncNotifications } from '~/server/database/schema/syncNotifications'
import { gt, eq, and } from 'drizzle-orm'
import { Logger } from '~/server/utils/logger'

export default defineEventHandler(async (event) => {
    const auth = (event.context as { auth?: { steamId?: string } })?.auth
    if (!auth?.steamId) {
        throw createError({ statusCode: 401, message: 'Authentication required' })
    }

    const steamId = auth.steamId

    setResponseHeader(event, 'Content-Type', 'text/event-stream')
    setResponseHeader(event, 'Cache-Control', 'no-cache')
    setResponseHeader(event, 'Connection', 'keep-alive')
    setResponseHeader(event, 'X-Accel-Buffering', 'no')
    setResponseStatus(event, 200)

    const writer = event.node.res
    let lastId = 0
    let isAlive = true

    writer.write(`data: ${JSON.stringify({ type: 'connected', steamId })}\n\n`)

    const pollInterval = setInterval(async () => {
        if (!isAlive) {
            clearInterval(pollInterval)
            return
        }

        try {
            const notifications = await db.select()
                .from(syncNotifications)
                .where(
                    and(
                        eq(syncNotifications.source, 'plugin'),
                        eq(syncNotifications.steamid, steamId),
                        gt(syncNotifications.id, lastId)
                    )
                )
                .orderBy(syncNotifications.id)
                .limit(50)

            for (const notification of notifications) {
                const payload = {
                    type: 'item_changed',
                    itemType: notification.item_type,
                    itemCategory: notification.item_category,
                    loadoutId: notification.loadoutid,
                    id: notification.id,
                }
                writer.write(`data: ${JSON.stringify(payload)}\n\n`)
                lastId = notification.id
            }
        } catch (error) {
            Logger.error(`SSE poll error for ${steamId}: ${error instanceof Error ? error.message : error}`)
        }
    }, 3000)

    const heartbeat = setInterval(() => {
        if (!isAlive) {
            clearInterval(heartbeat)
            return
        }
        try {
            writer.write(`: heartbeat\n\n`)
        } catch {
            isAlive = false
        }
    }, 30000)

    event.node.req.on('close', () => {
        isAlive = false
        clearInterval(pollInterval)
        clearInterval(heartbeat)
    })

    // Keep the handler alive - connection stays open until client disconnects
    await new Promise(() => {})
})
