
import { getQuery, readBody, createError, H3Event } from 'h3'
import { Logger } from '~/server/utils/logger'
import { getLoadout, setShareCode, getLoadoutByShareCode } from "~/server/database/loadoutHelpers";
import { validateRequiredRequestData } from "~/server/utils/helpers";
import {
    createSuccessResponse,
    createResponseMeta,
} from '~/server/utils/api/responseHelpers';
import { useErrorHandling, ErrorCodes } from '~/server/middleware/errorHandler'

// Helper to generate random code
const generateShareCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // No I, O, 0, 1
    let code = 'LO-';
    for (let i = 0; i < 10; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

export default useErrorHandling(async (event: H3Event) => {
    const startTime = Date.now();
    const method = event.method

    Logger.header(`Share Loadout API request: ${method} ${event.req.url}`)

    // Handle POST to generate/get share code
    if (method === 'POST') {
        const body = await readBody(event)
        const loadoutId = body.loadoutId;
        const steamId = body.steamId; // needed to verify ownership

        validateRequiredRequestData(loadoutId, 'Loadout ID');
        validateRequiredRequestData(steamId, 'Steam ID');

        const loadout = await getLoadout(loadoutId, steamId);
        if (!loadout) {
            throw createError({ statusCode: 404, message: 'Loadout not found' });
        }

        let shareCode = loadout.share_code;

        if (!shareCode) {
            // Generate unique code
            // Simple retry logic used in production would be better, but for now single try
            shareCode = generateShareCode();

            // Check collision (unlikely but possible)
            const existing = await getLoadoutByShareCode(shareCode);
            if (existing) {
                shareCode = generateShareCode(); // Retry once
            }

            await setShareCode(loadoutId, steamId, shareCode);
        }

        Logger.success(`Loadout ${loadoutId} share code: ${shareCode}`)

        const meta = createResponseMeta(startTime, { steamId, method, loadoutId });
        return createSuccessResponse({ shareCode }, meta, 'Share code retrieved successfully');
    }

    Logger.error('Method not allowed')
    throw createError({
        statusCode: 405,
        message: 'Method not allowed'
    })

}, ErrorCodes.LOADOUT_SHARE_ERROR)
