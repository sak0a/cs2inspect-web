import { getQuery, readBody, createError } from 'h3'
import type { H3Event } from 'h3'
import { Logger } from '~/server/utils/logger'
import { importLoadoutFromShareCode, getLoadoutsBySteamId } from '~/server/database/loadoutHelpers'
import { validateRequiredRequestData } from '~/server/utils/helpers'
import { createSuccessResponse, createResponseMeta } from '~/server/utils/api/responseHelpers'
import { useErrorHandling, ErrorCodes } from '~/server/utils/errorHandler'
import { getCachedSetting } from '~/server/utils/settingsCache'

/**
 * POST /api/loadouts/import
 * Imports a loadout from a share code
 */
export default useErrorHandling(async (event: H3Event) => {
  const startTime = Date.now()
  const query = getQuery(event)

  Logger.header(`Import Loadout API request: ${event.req.url}`)

  const body = await readBody(event)
  const steamId = (query.steamId as string) || body.steamId
  const shareCode = body.shareCode

  validateRequiredRequestData(steamId, 'Steam ID')
  validateRequiredRequestData(shareCode, 'Share Code')

  // Enforce FEATURE_SHARE_CODES
  const shareCodesEnabled = await getCachedSetting<boolean>('FEATURE_SHARE_CODES', true)
  if (!shareCodesEnabled) {
    throw createError({
      statusCode: 403,
      message: 'Share codes feature is currently disabled',
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

  const newLoadout = await importLoadoutFromShareCode(steamId, shareCode)

  Logger.success(`Loadout imported successfully! New ID: ${newLoadout.id}`)

  const meta = createResponseMeta(startTime, { steamId, method: 'POST', shareCode })
  return createSuccessResponse(newLoadout, meta, 'Loadout imported successfully')
}, ErrorCodes.LOADOUT_IMPORT_ERROR)
