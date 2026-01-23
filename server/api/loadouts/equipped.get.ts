import { defineEventHandler, H3Event, getQuery, createError } from 'h3'
import { Logger } from '~/server/utils/logger'
import { getLoadoutsBySteamId } from '~/server/database/loadoutHelpers'
import { validateRequiredRequestData } from '~/server/utils/helpers'
import {
    createSuccessResponse,
    createResponseMeta,
    withErrorHandling
} from '~/server/utils/api/responseHelpers'

/**
 * API endpoint to get the equipped loadout for a user
 * This is designed for CS2 server plugin integration.
 * 
 * Priority:
 * 1. Loadout with is_default = 1
 * 2. Loadout with active = 1
 * 3. First loadout found (fallback)
 */
export default defineEventHandler(withErrorHandling(async (event: H3Event) => {
    const startTime = Date.now()
    const method = event.method
    const query = getQuery(event)

    Logger.header(`Get Equipped Loadout API request: ${method} ${event.req.url}`)

    if (method !== 'GET') {
        Logger.error('Method not allowed')
        throw createError({
            statusCode: 405,
            message: 'Method not allowed'
        })
    }

    const steamId = query.steamId as string
    validateRequiredRequestData(steamId, 'Steam ID')

    const loadouts = await getLoadoutsBySteamId(steamId)

    if (loadouts.length === 0) {
        Logger.info(`No loadouts found for Steam ID ${steamId}`)
        throw createError({
            statusCode: 404,
            message: 'No loadouts found for this user'
        })
    }

    // Priority 1: Find default loadout
    let equippedLoadout = loadouts.find(l => l.is_default === 1)

    // Priority 2: Find active loadout
    if (!equippedLoadout) {
        equippedLoadout = loadouts.find(l => l.active === 1)
    }

    // Priority 3: Fallback to first loadout (guaranteed to exist since loadouts.length > 0)
    if (!equippedLoadout) {
        equippedLoadout = loadouts[0]!
    }

    Logger.success(`Equipped loadout found: ${equippedLoadout.id} (${equippedLoadout.name})`)

    const meta = createResponseMeta(startTime, { steamId, method, loadoutId: equippedLoadout.id })
    return createSuccessResponse({ loadout: equippedLoadout }, meta, 'Equipped loadout retrieved successfully')

}, 'GET_EQUIPPED_LOADOUT_ERROR'))
