import { defineEventHandler, createError } from 'h3'
import { APIRequestLogger as Logger } from '~/server/utils/logger'

export default defineEventHandler(async (event) => {
    const query = getQuery(event)

    Logger.header(`Save knife request: ${event.method} ${event.req.url}`)

    const steamId = query.steamId as string
    validateRequiredRequestData(steamId, 'Steam ID')

    const loadoutId = query.loadoutId as string
    validateRequiredRequestData(loadoutId, 'Loadout ID')

    const body = await readBody(event)
    validateRequiredRequestData(body, 'Body')



    try {
        // Validate fields
        validateCommonFields(body)
        validateKnifeFields(body)

        // Map the body to match the expected format for the saveKnife function
        const knifeData = {
            ...body,
            // Ensure we have consistent property names
        }

        // Save the knife
        return await saveKnife(steamId, loadoutId, knifeData)
    } catch (error: any) {
        Logger.error(`Failed to save knifes: ${error.message}`)
        throw createError({
            statusCode: 500,
            message: 'Failed to save knifes'
        })
    }
});