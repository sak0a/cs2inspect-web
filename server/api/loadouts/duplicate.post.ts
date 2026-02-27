
import { getQuery, readBody, createError } from 'h3'
import type { H3Event } from 'h3'
import { Logger } from '~/server/utils/logger'
import { duplicateLoadout, getLoadoutsBySteamId } from "~/server/database/loadoutHelpers";
import { validateRequiredRequestData } from "~/server/utils/helpers";
import {
    createSuccessResponse,
    createResponseMeta,
} from '~/server/utils/api/responseHelpers';
import { useErrorHandling, ErrorCodes } from '~/server/utils/errorHandler'
import { getCachedSetting } from '~/server/utils/settingsCache'

/**
 * POST /api/loadouts/duplicate
 * Duplicates an existing loadout
 */
export default useErrorHandling(async (event: H3Event) => {
    const startTime = Date.now()
    const query = getQuery(event)

    Logger.header(`Duplicate Loadout API request: ${event.req.url}`)

    const body = await readBody(event)
    const steamId = query.steamId as string || body.steamId;
    const loadoutId = body.loadoutId;

    validateRequiredRequestData(steamId, 'Steam ID');
    validateRequiredRequestData(loadoutId, 'Loadout ID');

    // Enforce MAX_LOADOUTS_PER_USER
    const maxLoadouts = await getCachedSetting<number>('MAX_LOADOUTS_PER_USER', 10)
    const existing = await getLoadoutsBySteamId(steamId)
    if (existing.length >= maxLoadouts) {
        throw createError({
            statusCode: 403,
            message: `Maximum number of loadouts (${maxLoadouts}) reached`,
        })
    }

    const newLoadout = await duplicateLoadout(steamId, loadoutId)
    Logger.success(`Loadout ${loadoutId} duplicated successfully! New ID: ${newLoadout.id}`)

    const meta = createResponseMeta(startTime, { steamId, method: 'POST', originalLoadoutId: loadoutId })
    return createSuccessResponse(newLoadout, meta, 'Loadout duplicated successfully')

}, ErrorCodes.LOADOUT_DUPLICATE_ERROR)
