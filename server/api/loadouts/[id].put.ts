// server/api/loadouts/[id].put.ts
import { getQuery, readBody } from 'h3'
import { validateRequiredRequestData } from '~/server/utils/helpers'
import { Logger } from '~/server/utils/logger'
import { updateLoadout, getLoadout } from "~/server/database/loadoutHelpers"
import {
    createSuccessResponse,
    createResponseMeta,
} from '~/server/utils/api/responseHelpers'
import { useErrorHandling, ErrorCodes } from '~/server/utils/errorHandler'

/**
 * PUT /api/loadouts/:id
 * Updates a loadout's name
 */
export default useErrorHandling(async (event) => {
    const startTime = Date.now()
    const query = getQuery(event)

    const id = event.context.params?.id as string
    validateRequiredRequestData(id, 'Loadout ID')

    Logger.header(`Loadouts PUT request: ${event.req.url}`)

    const body = await readBody(event)
    const steamId = query.steamId as string || body.steamId
    validateRequiredRequestData(steamId, 'Steam ID')
    validateRequiredRequestData(body.name, 'Loadout name')

    await updateLoadout(id, steamId, body.name)
    Logger.success(`Loadout ${id} updated successfully!`)

    const data = await getLoadout(id, steamId)
    Logger.success(`Loadout ${id} retrieved successfully for response`)

    const meta = createResponseMeta(startTime, { steamId, method: 'PUT', loadoutId: id })
    return createSuccessResponse({ loadout: data }, meta, 'Loadout updated successfully')
}, ErrorCodes.LOADOUT_ERROR)
