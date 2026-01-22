import { defineEventHandler, H3Event } from 'h3'
import { Logger } from '~/server/utils/logger'
import { importLoadoutFromShareCode } from "~/server/database/loadoutHelpers";
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

    Logger.header(`Import Loadout API request: ${method} ${event.req.url}`)

    if (method !== 'POST') {
        Logger.error('Method not allowed')
        throw createError({
            statusCode: 405,
            message: 'Method not allowed'
        })
    }

    const body = await readBody(event)
    const steamId = query.steamId as string || body.steamId;
    const shareCode = body.shareCode;

    validateRequiredRequestData(steamId, 'Steam ID');
    validateRequiredRequestData(shareCode, 'Share Code');

    const newLoadout = await importLoadoutFromShareCode(steamId, shareCode)

    Logger.success(`Loadout imported successfully! New ID: ${newLoadout.id}`)

    const meta = createResponseMeta(startTime, { steamId, method, shareCode });
    return createSuccessResponse(newLoadout, meta, 'Loadout imported successfully');

}, 'IMPORT_LOADOUT_ERROR'))
