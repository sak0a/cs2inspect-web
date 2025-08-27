import { defineEventHandler, createError } from 'h3'
import { executeQuery } from '~/server/database/database'
import { APIRequestLogger as Logger } from '~/server/utils/logger'
import { DBPin } from '~/server/utils/interfaces'
import { validateRequiredRequestData } from '~/server/utils/helpers'
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

    const pins = await executeQuery<DBPin[]>(
        'SELECT * FROM wp_player_pins WHERE steamid = ? AND loadoutid = ?',
        [steamId, loadoutId],
        'Failed to fetch pins'
    )

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
        `Successfully fetched ${pins.length} pins`
    )
}, 'PINS_FETCH_ERROR'))
