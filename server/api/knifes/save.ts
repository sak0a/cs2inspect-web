import { defineEventHandler, createError } from 'h3'
import { APIRequestLogger as Logger } from '~/server/utils/logger'
import { validateRequiredRequestData } from '~/server/utils/helpers'

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
        // Handle reset case first, before validation
        if (body.reset) {
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

            // Map the body and save (reset will be handled in saveKnife)
            const knifeData = { ...body }
            return await saveKnife(steamId, loadoutId, knifeData)
        }

        // For non-reset cases, validate all fields
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