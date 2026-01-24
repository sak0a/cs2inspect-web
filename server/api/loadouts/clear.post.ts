
import { H3Event, createError, getQuery, readBody } from 'h3'
import { Logger } from '~/server/utils/logger'
import { clearLoadoutItems } from "~/server/database/loadoutHelpers";
import { validateRequiredRequestData } from "~/server/utils/helpers";
import {
    createSuccessResponse,
    createResponseMeta,
} from '~/server/utils/api/responseHelpers';
import { useErrorHandling, ErrorCodes } from '~/server/middleware/errorHandler'

export default useErrorHandling(async (event: H3Event) => {
    const startTime = Date.now();
    const method = event.method
    const query = getQuery(event)

    Logger.header(`Clear Loadout API request: ${method} ${event.req.url}`)

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
    const categories = body.categories || [];

    validateRequiredRequestData(steamId, 'Steam ID');
    validateRequiredRequestData(loadoutId, 'Loadout ID');

    await clearLoadoutItems(loadoutId, steamId, categories)
    Logger.success(`Loadout ${loadoutId} cleared successfully!`)

    const meta = createResponseMeta(startTime, { steamId, method, loadoutId });
    return createSuccessResponse({ success: true }, meta, 'Loadout cleared successfully');

}, ErrorCodes.LOADOUT_CLEAR_ERROR)
