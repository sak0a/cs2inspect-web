// server/api/loadouts/index.get.ts
import { getQuery } from 'h3'
import { validateRequiredRequestData } from '~/server/utils/helpers'
import { Logger } from '~/server/utils/logger'
import type { DBLoadout } from '~/server/types'
import { getLoadoutsBySteamId } from "~/server/database/loadoutHelpers"
import {
    createCollectionResponse,
    createResponseMeta,
} from '~/server/utils/api/responseHelpers'
import { useErrorHandling, ErrorCodes } from '~/server/utils/errorHandler'

/**
 * GET /api/loadouts
 * Fetches all loadouts for a user by Steam ID
 */
export default useErrorHandling(async (event) => {
    const startTime = Date.now()
    const query = getQuery(event)

    Logger.header(`Loadouts GET request: ${event.req.url}`)

    const steamId = query.steamId as string
    validateRequiredRequestData(steamId, 'Steam ID')

    const data: DBLoadout[] = await getLoadoutsBySteamId(steamId)
    Logger.success(`Loadouts fetched successfully.`)

    const meta = createResponseMeta(startTime, { steamId, method: 'GET' })
    return createCollectionResponse(
        data,
        data.length,
        meta,
        undefined,
        undefined,
        'Loadouts fetched successfully!'
    )
}, ErrorCodes.LOADOUT_ERROR)
