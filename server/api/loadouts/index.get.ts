// server/api/loadouts/index.get.ts
import { Logger } from '~/server/utils/logger'
import type { DBLoadout } from '~/server/types'
import { getLoadoutsBySteamId } from '~/server/database/loadoutHelpers'
import { createCollectionResponse, createResponseMeta } from '~/server/utils/api/responseHelpers'
import { useErrorHandling, ErrorCodes } from '~/server/utils/errorHandler'
import { parseQueryWithSchema } from '~/server/utils/validation/zodHelpers'
import { steamIdQuerySchema } from '~/server/utils/validation/querySchemas'

/**
 * GET /api/loadouts
 * Fetches all loadouts for a user by Steam ID
 */
export default useErrorHandling(async (event) => {
    const startTime = Date.now()

    Logger.header(`Loadouts GET request: ${event.req.url}`)

    const { steamId } = parseQueryWithSchema(steamIdQuerySchema, event)

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
