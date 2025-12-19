import { defineEventHandler, createError } from 'h3'
import { executeQuery } from '~/server/database/database'
import { APIRequestLogger as Logger } from '~/server/utils/logger'
import { validateRequiredRequestData } from '~/server/utils/helpers'
import {
    createCollectionResponse,
    createResponseMeta,
    withErrorHandling
} from '~/server/utils/apiResponseHelpers'
import type { DBLoadout } from '~/types/database/records'

export default defineEventHandler(withErrorHandling(async (event) => {
    const startTime = Date.now()
    const query = getQuery(event)

    Logger.header(`Pins API request: ${event.method} ${event.req.url}`)

    const steamId = query.steamId as string
    validateRequiredRequestData(steamId, 'Steam ID')

    const loadoutId = query.loadoutId as string
    validateRequiredRequestData(loadoutId, 'Loadout ID')

    // Fetch the selected pin from the loadout table (similar to music kits)
    const loadouts = await executeQuery<DBLoadout[]>(
        'SELECT selected_pin FROM wp_player_loadouts WHERE id = ? AND steamid = ?',
        [loadoutId, steamId],
        'Failed to fetch loadout'
    )

    if (loadouts.length === 0) {
        throw createError({
            statusCode: 404,
            message: 'Loadout not found'
        })
    }

    const selectedPin = loadouts[0].selected_pin

    // Return the selected pin as an array for backward compatibility
    // If no pin is selected, return empty array
    const pins = selectedPin ? [{ pinid: selectedPin }] : []

    const meta = createResponseMeta(startTime, {
        steamId,
        loadoutId,
        databaseRows: pins.length
    })

    return createCollectionResponse(
        pins,
        pins.length,
        meta,
        ['pins'],
        undefined,
        `Successfully fetched ${pins.length} pin(s)`
    )
}, 'PINS_FETCH_ERROR'))
