// server/api/loadouts/index.post.ts
import { getQuery, readBody, createError } from 'h3'
import { validateRequiredRequestData } from '~/server/utils/helpers'
import { Logger } from '~/server/utils/logger'
import { createLoadout, getLoadoutByName, getLoadoutsBySteamId } from "~/server/database/loadoutHelpers"
import {
    createSuccessResponse,
    createResponseMeta,
} from '~/server/utils/api/responseHelpers'
import { useErrorHandling, ErrorCodes } from '~/server/utils/errorHandler'
import { parseBodyWithSchema } from '~/server/utils/validation/zodHelpers'
import { loadoutCreateBodySchema } from '~/server/database/schema/zod'
import { getCachedSetting } from '~/server/utils/settingsCache'

/**
 * POST /api/loadouts
 * Creates a new loadout for a user
 */
export default useErrorHandling(async (event) => {
    const startTime = Date.now()
    const query = getQuery(event)

    Logger.header(`Loadouts POST request: ${event.req.url}`)

    const body = await readBody(event)
    const steamId = query.steamId as string || body.steamId
    validateRequiredRequestData(steamId, 'Steam ID')

    const { name } = parseBodyWithSchema(loadoutCreateBodySchema, body)

    // Enforce MAX_LOADOUT_NAME_LENGTH
    const maxNameLength = await getCachedSetting<number>('MAX_LOADOUT_NAME_LENGTH', 25)
    if (name.length > maxNameLength) {
        throw createError({
            statusCode: 400,
            message: `Loadout name must be at most ${maxNameLength} characters`,
        })
    }

    // Enforce MAX_LOADOUTS_PER_USER
    const maxLoadouts = await getCachedSetting<number>('MAX_LOADOUTS_PER_USER', 10)
    const existing = await getLoadoutsBySteamId(steamId)
    if (existing.length >= maxLoadouts) {
        throw createError({
            statusCode: 403,
            message: `Maximum number of loadouts (${maxLoadouts}) reached`,
        })
    }

    await createLoadout(steamId, name)
    Logger.success(`Loadout created successfully!`)

    const data = await getLoadoutByName(steamId, name)
    if (!data) {
        throw createError({
            statusCode: 500,
            message: 'Failed to retrieve created loadout'
        })
    }
    Logger.success(`Loadout ${data.id} retrieved successfully for response`)

    const meta = createResponseMeta(startTime, { steamId, method: 'POST', loadoutName: name })
    return createSuccessResponse({ loadout: data }, meta, 'Loadout created successfully')
}, ErrorCodes.LOADOUT_ERROR)
