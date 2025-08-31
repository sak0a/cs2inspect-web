import { defineEventHandler, createError } from 'h3'
import { APIRequestLogger as Logger } from '~/server/utils/logger'
import { validateRequiredRequestData } from '~/server/utils/helpers'

export default defineEventHandler(async (event) => {
    const query = getQuery(event)

    Logger.header(`Save weapon request: ${event.method} ${event.req.url}`)

    const steamId = query.steamId as string
    validateRequiredRequestData(steamId, 'Steam ID')

    const type = query.type as string
    validateRequiredRequestData(type, 'Type')

    const loadoutId = query.loadoutId as string
    validateRequiredRequestData(loadoutId, 'Loadout ID')

    const table = validateWeaponDatabaseTable(type)

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

            // Map the body and save (reset will be handled in saveWeapon)
            const weaponData = { ...body }
            return await saveWeapon(table, steamId, loadoutId, weaponData)
        }

        // For non-reset cases, validate all fields
        validateCommonFields(body)
        validateWeaponFields(body)

        // Map the body to match the expected format for the saveWeapon function
        const weaponData = {
            ...body
        }

        // Save the weapon
        return await saveWeapon(table, steamId, loadoutId, weaponData)
    } catch (error: any) {
        Logger.error(`Failed to save weapon: ${error.message}`)
        throw createError({
            statusCode: 500,
            message: `Failed to save weapon: ${error.message}`
        })
    }
})