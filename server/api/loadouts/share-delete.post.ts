import { readBody, createError } from 'h3'
import type { H3Event } from 'h3'
import { Logger } from '~/server/utils/logger'
import { getLoadout, clearShareCode } from '~/server/database/loadoutHelpers'
import { validateRequiredRequestData } from '~/server/utils/helpers'
import { createSuccessResponse, createResponseMeta } from '~/server/utils/api/responseHelpers'
import { useErrorHandling, ErrorCodes } from '~/server/utils/errorHandler'

/**
 * POST /api/loadouts/share-delete
 * Deletes (revokes) a share code for a loadout
 */
export default useErrorHandling(async (event: H3Event) => {
    const startTime = Date.now()

    Logger.header(`Share DELETE request: ${event.req.url}`)

    const body = await readBody(event)
    const loadoutId = body.loadoutId
    const steamId = body.steamId

    validateRequiredRequestData(loadoutId, 'Loadout ID')
    validateRequiredRequestData(steamId, 'Steam ID')

    // Verify ownership
    const loadout = await getLoadout(loadoutId, steamId)
    if (!loadout) {
        throw createError({ statusCode: 404, message: 'Loadout not found' })
    }

    await clearShareCode(loadoutId, steamId)
    Logger.success(`Share code cleared for loadout ${loadoutId}`)

    const meta = createResponseMeta(startTime, { steamId, method: 'POST', loadoutId })
    return createSuccessResponse(null, meta, 'Share code deleted successfully')
}, ErrorCodes.LOADOUT_SHARE_ERROR)
