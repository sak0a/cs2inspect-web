// server/api/loadouts/[id].put.ts
import { getQuery, readBody, createError } from 'h3'
import { validateRequiredRequestData } from '~/server/utils/helpers'
import { Logger } from '~/server/utils/logger'
import { updateLoadout, getLoadout } from '~/server/database/loadoutHelpers'
import { createSuccessResponse, createResponseMeta } from '~/server/utils/api/responseHelpers'
import { useErrorHandling, ErrorCodes } from '~/server/utils/errorHandler'
import { parseBodyWithSchema } from '~/server/utils/validation/zodHelpers'
import { loadoutUpdateBodySchema } from '~/server/database/schema/zod'
import { getCachedSetting } from '~/server/utils/settingsCache'

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
    const parsed = parseBodyWithSchema(loadoutUpdateBodySchema, body)
    const steamId: string = (query.steamId as string) || parsed.steamId || ''
    validateRequiredRequestData(steamId, 'Steam ID')

    // Enforce MAX_LOADOUT_NAME_LENGTH
    const maxNameLength = await getCachedSetting<number>('MAX_LOADOUT_NAME_LENGTH', 25)
    if (parsed.name.length > maxNameLength) {
        throw createError({
            statusCode: 400,
            message: `Loadout name must be at most ${maxNameLength} characters`,
        })
    }

    await updateLoadout(id, steamId, parsed.name)
    Logger.success(`Loadout ${id} updated successfully!`)

    const data = await getLoadout(id, steamId)
    Logger.success(`Loadout ${id} retrieved successfully for response`)

    const meta = createResponseMeta(startTime, { steamId, method: 'PUT', loadoutId: id })
    return createSuccessResponse({ loadout: data }, meta, 'Loadout updated successfully')
}, ErrorCodes.LOADOUT_ERROR)
