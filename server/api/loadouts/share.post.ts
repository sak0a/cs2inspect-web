import { readBody, createError } from 'h3'
import type { H3Event } from 'h3'
import { Logger } from '~/server/utils/logger'
import { getLoadout, setShareCode, getLoadoutByShareCode } from '~/server/database/loadoutHelpers'
import { validateRequiredRequestData } from '~/server/utils/helpers'
import { createSuccessResponse, createResponseMeta } from '~/server/utils/api/responseHelpers'
import { useErrorHandling, ErrorCodes } from '~/server/utils/errorHandler'
import { getCachedSetting } from '~/server/utils/settingsCache'

// Helper to generate random code
const generateShareCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // No I, O, 0, 1
    let code = 'LO-'
    for (let i = 0; i < 10; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return code
}

/**
 * POST /api/loadouts/share
 * Generates or retrieves a share code for a loadout
 */
export default useErrorHandling(async (event: H3Event) => {
    const startTime = Date.now()

    Logger.header(`Share Loadout API request: ${event.req.url}`)

    const body = await readBody(event)
    const loadoutId = body.loadoutId
    const steamId = body.steamId // needed to verify ownership

    validateRequiredRequestData(loadoutId, 'Loadout ID')
    validateRequiredRequestData(steamId, 'Steam ID')

    // Enforce FEATURE_SHARE_CODES
    const shareCodesEnabled = await getCachedSetting<boolean>('FEATURE_SHARE_CODES', true)
    if (!shareCodesEnabled) {
        throw createError({
            statusCode: 403,
            message: 'Share codes feature is currently disabled',
        })
    }

    const loadout = await getLoadout(loadoutId, steamId)
    if (!loadout) {
        throw createError({ statusCode: 404, message: 'Loadout not found' })
    }

    let shareCode = loadout.share_code

    if (!shareCode) {
        // Generate unique code
        shareCode = generateShareCode()

        // Check collision (unlikely but possible)
        const existing = await getLoadoutByShareCode(shareCode)
        if (existing) {
            shareCode = generateShareCode() // Retry once
        }

        await setShareCode(loadoutId, steamId, shareCode)
    }

    Logger.success(`Loadout ${loadoutId} share code: ${shareCode}`)

    const meta = createResponseMeta(startTime, { steamId, method: 'POST', loadoutId })
    return createSuccessResponse({ shareCode }, meta, 'Share code retrieved successfully')
}, ErrorCodes.LOADOUT_SHARE_ERROR)
