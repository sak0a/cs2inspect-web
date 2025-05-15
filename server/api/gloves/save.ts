import { defineEventHandler, createError } from 'h3'
import { APIRequestLogger as Logger } from '~/server/utils/logger'

export default defineEventHandler(async (event) => {
    const query = getQuery(event)

    Logger.header(`Save glove request: ${event.method} ${event.req.url}`)

    const steamId = query.steamId as string
    validateRequiredRequestData(steamId, 'Steam ID')

    const loadoutId = query.loadoutId as string
    validateRequiredRequestData(loadoutId, 'Loadout ID')

    const body = await readBody(event)
    validateRequiredRequestData(body, 'Body')

    try {
        // Validate fields
        validateCommonFields(body)
        validateGloveFields(body)

        // Map the body to match the expected format for the saveGlove function
        const gloveData = {
            ...body,
        }

        // Save the glove
        return await saveGlove(steamId, loadoutId, gloveData)
    } catch (error: any) {
        Logger.error(`Failed to save gloves: ${error.message}`)
        throw createError({
            statusCode: 500,
            message: 'Failed to save gloves'
        })
    }
});
