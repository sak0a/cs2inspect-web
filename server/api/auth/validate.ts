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
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Authentication validation failed'
        const statusCode = (error && typeof error === 'object' && 'statusCode' in error && typeof error.statusCode === 'number') ? error.statusCode : 500
        Logger.error(`Auth validation failed: ${errorMessage}`)
        throw createError({
            statusCode,
            message: errorMessage
        })
    }
})