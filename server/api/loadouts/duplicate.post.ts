
import { defineEventHandler, H3Event } from 'h3'
import { Logger } from '~/server/utils/logger'
import { duplicateLoadout } from "~/server/database/loadoutHelpers";
import { validateRequiredRequestData } from "~/server/utils/helpers";
import {
    createSuccessResponse,
    createResponseMeta,
    withErrorHandling
} from '~/server/utils/api/responseHelpers';

export default defineEventHandler(withErrorHandling(async (event: H3Event) => {
    const startTime = Date.now();
    const method = event.method
    const query = getQuery(event)

    Logger.header(`Duplicate Loadout API request: ${method} ${event.req.url}`)

    if (method !== 'POST') {
        Logger.error('Method not allowed')
        throw createError({
            statusCode: 405,
            message: 'Method not allowed'
        })
    }

    const body = await readBody(event)
    const steamId = query.steamId as string || body.steamId;
    const loadoutId = body.loadoutId;

    validateRequiredRequestData(steamId, 'Steam ID');
    validateRequiredRequestData(loadoutId, 'Loadout ID');

    const newLoadout = await duplicateLoadout(steamId, loadoutId)
    Logger.success(`Loadout ${loadoutId} duplicated successfully! New ID: ${newLoadout.id}`)

    const meta = createResponseMeta(startTime, { steamId, method, originalLoadoutId: loadoutId });
    return createSuccessResponse(newLoadout, meta, 'Loadout duplicated successfully');

}, 'DUPLICATE_LOADOUT_ERROR'))
