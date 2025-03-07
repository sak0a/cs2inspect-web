import { defineEventHandler, createError } from 'h3'
import { APIRequestLogger as Logger } from '~/server/utils/logger'

export default defineEventHandler(async (event) => {
    const query = getQuery(event)
    Logger.header(`Auth validation request: ${event.method} ${event.req.url}`)

    const steamId = query.steamId as string
    validateRequiredRequestData(steamId, 'Steam ID')

    try {
        verifyUserAccess(steamId, event)

        return {
            authenticated: true,
            steamId: steamId
        }
    } catch (error: any) {
        Logger.error(`Auth validation failed: ${error.message}`)
        throw createError({
            statusCode: error.statusCode || 500,
            message: error.message || 'Authentication validation failed'
        })
    }
})