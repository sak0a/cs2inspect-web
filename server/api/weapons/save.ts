import { defineEventHandler, createError } from 'h3'
import { APIRequestLogger as Logger } from '~/server/utils/logger'

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
        // Validate fields
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