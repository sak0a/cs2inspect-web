import { defineEventHandler, createError } from 'h3'
import { APIRequestLogger as Logger } from '~/server/utils/logger'
import { validateRequiredRequestData } from '~/server/utils/helpers'

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
        Logger.info(`Save glove request - steamId: ${steamId}, loadoutId: ${loadoutId}`)
        Logger.info(`Save glove body:`, JSON.stringify(body, null, 2))

        // Handle reset case first, before validation
        if (body.reset) {
            Logger.info('Processing glove reset request')
            // For reset, we only need defindex and team, skip other validations
            validateRequiredRequestData(body.defindex, 'Defindex')
            validateRequiredRequestData(body.team, 'Team')
            if (body.team !== 1 && body.team !== 2) {
                Logger.error('Invalid team')
                throw createError({
                    statusCode: 400,
                    message: `Invalid team: ${body.team}`
                })
            }

            // Map the body and save (reset will be handled in saveGlove)
            const gloveData = { ...body }
            const result = await saveGlove(steamId, loadoutId, gloveData)
            Logger.info('Glove reset completed successfully')
            return result
        }

        // For non-reset cases, validate all fields
        Logger.info('Processing glove save request (non-reset)')
        validateCommonFields(body)
        validateGloveFields(body)

        // Map the body to match the expected format for the saveGlove function
        const gloveData = {
            ...body,
        }

        Logger.info(`Mapped glove data:`, JSON.stringify(gloveData, null, 2))

        // Save the glove
        const result = await saveGlove(steamId, loadoutId, gloveData)
        Logger.info('Glove save completed successfully')
        return result
    } catch (error: any) {
        Logger.error(`Failed to save gloves: ${error.message}`)
        throw createError({
            statusCode: 500,
            message: 'Failed to save gloves'
        })
    }
});
