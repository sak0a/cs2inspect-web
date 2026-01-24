import { createError, getQuery } from 'h3'
import { Logger } from '~/server/utils/logger'
import { setActiveLoadout, getLoadout } from '~/server/database/loadoutHelpers'
import { validateRequiredRequestData } from '~/server/utils/helpers'
import {
    createSuccessResponse,
    createResponseMeta,
} from '~/server/utils/api/responseHelpers'
import { useErrorHandling, ErrorCodes } from '~/server/middleware/errorHandler'

/**
 * API endpoint to activate a loadout
 * Sets the specified loadout as active and deactivates all other loadouts for the user
 */
export default useErrorHandling(async (event) => {
    const startTime = Date.now();
    const method = event.method
    const query = getQuery(event)

    Logger.header(`Activate Loadout API request: ${method} ${event.req.url}`)

    if (method !== 'POST') {
        Logger.error('Method not allowed')
        throw createError({
            statusCode: 405,
            message: 'Method not allowed'
        })
    }

    const steamId = query.steamId as string
    validateRequiredRequestData(steamId, 'Steam ID')

    const loadoutId = query.loadoutId as string
    validateRequiredRequestData(loadoutId, 'Loadout ID')

    await setActiveLoadout(loadoutId, steamId)
    Logger.success(`Loadout ${loadoutId} activated successfully!`)

    const data = await getLoadout(loadoutId, steamId)
    Logger.success(`Loadout ${loadoutId} retrieved successfully for response`)

    const meta = createResponseMeta(startTime, { steamId, method, loadoutId });
    return createSuccessResponse(data, meta, 'Loadout activated successfully');
}, ErrorCodes.LOADOUT_ERROR)
