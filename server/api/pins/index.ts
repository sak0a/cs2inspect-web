import { defineEventHandler, createError, getQuery } from 'h3'
import { eq, and } from 'drizzle-orm'
import { db } from '~/server/database/client'
import { loadouts } from '~/server/database/schema'
import { APIRequestLogger as Logger } from '~/server/utils/logger'
import { validateRequiredRequestData } from '~/server/utils/helpers'
import { toLoadoutId } from '~/types/core/common'
import {
    createCollectionResponse,
    createResponseMeta,
    withErrorHandling
} from '~/server/utils/apiResponseHelpers'

export default defineEventHandler(withErrorHandling(async (event) => {
    const startTime = Date.now()
    const query = getQuery(event)

    Logger.header(`Pins API request: ${event.method} ${event.req.url}`)

    const steamId = query.steamId as string
    validateRequiredRequestData(steamId, 'Steam ID')

    const loadoutId = query.loadoutId as string
    validateRequiredRequestData(loadoutId, 'Loadout ID')

    // Fetch the selected pin from the loadout table using Drizzle
    const loadoutsData = await db.select({ selected_pin: loadouts.selected_pin })
        .from(loadouts)
        .where(and(
            eq(loadouts.id, toLoadoutId(loadoutId)),
            eq(loadouts.steamid, steamId)
        ))
        .limit(1)

    if (loadoutsData.length === 0) {
        throw createError({
            statusCode: 404,
            message: 'Loadout not found'
        })
    }

    const selectedPin = loadoutsData[0]!.selected_pin

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
