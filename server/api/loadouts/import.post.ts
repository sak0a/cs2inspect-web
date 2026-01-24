import { getQuery, readBody } from 'h3'
import type { H3Event } from 'h3'
import { Logger } from '~/server/utils/logger'
import { importLoadoutFromShareCode } from "~/server/database/loadoutHelpers";
import { validateRequiredRequestData } from "~/server/utils/helpers";
import {
    createSuccessResponse,
    createResponseMeta,
} from '~/server/utils/api/responseHelpers';
import { useErrorHandling, ErrorCodes } from '~/server/utils/errorHandler'

/**
 * POST /api/loadouts/import
 * Imports a loadout from a share code
 */
export default useErrorHandling(async (event: H3Event) => {
    const startTime = Date.now()
    const query = getQuery(event)

    Logger.header(`Import Loadout API request: ${event.req.url}`)

    const body = await readBody(event)
    const steamId = query.steamId as string || body.steamId;
    const shareCode = body.shareCode;

    validateRequiredRequestData(steamId, 'Steam ID');
    validateRequiredRequestData(shareCode, 'Share Code');

    const newLoadout = await importLoadoutFromShareCode(steamId, shareCode)

    Logger.success(`Loadout imported successfully! New ID: ${newLoadout.id}`)

    const meta = createResponseMeta(startTime, { steamId, method: 'POST', shareCode })
    return createSuccessResponse(newLoadout, meta, 'Loadout imported successfully')

}, ErrorCodes.LOADOUT_IMPORT_ERROR)
