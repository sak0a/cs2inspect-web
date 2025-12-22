
import { defineEventHandler, H3Event } from 'h3'
import { APIRequestLogger as Logger } from '~/server/utils/logger'
import { setLoadoutAsDefault } from "~/server/database/loadoutHelpers";
import { validateRequiredRequestData } from "~/server/utils/helpers";
import {
    createSuccessResponse,
    createResponseMeta,
    withErrorHandling
} from '~/server/utils/apiResponseHelpers';

export default defineEventHandler(withErrorHandling(async (event: H3Event) => {
    const startTime = Date.now();
    const method = event.method
    const query = getQuery(event)

    Logger.header(`Set Default Loadout API request: ${method} ${event.req.url}`)

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

    await setLoadoutAsDefault(loadoutId, steamId)
    Logger.success(`Loadout ${loadoutId} set as default!`)

    const meta = createResponseMeta(startTime, { steamId, method, loadoutId });
    return createSuccessResponse({ success: true }, meta, 'Default loadout set successfully');

}, 'SET_DEFAULT_LOADOUT_ERROR'))
