import { readBody } from 'h3'
import type { H3Event } from 'h3'
import { Logger } from '~/server/utils/logger'
import { clearLoadoutItems } from '~/server/database/loadoutHelpers'
import { validateRequiredRequestData, getAuthenticatedSteamId } from '~/server/utils/helpers'
import { createSuccessResponse, createResponseMeta } from '~/server/utils/api/responseHelpers'
import { useErrorHandling, ErrorCodes } from '~/server/utils/errorHandler'

/**
 * POST /api/loadouts/clear
 * Clears items from a loadout by category
 */
export default useErrorHandling(async (event: H3Event) => {
  const startTime = Date.now()

  Logger.header(`Clear Loadout API request: ${event.req.url}`)

  const steamId = getAuthenticatedSteamId(event)
  const body = await readBody(event)
  const loadoutId = body.loadoutId
  const categories = body.categories || []

  validateRequiredRequestData(loadoutId, 'Loadout ID')

  await clearLoadoutItems(loadoutId, steamId, categories)
  Logger.success(`Loadout ${loadoutId} cleared successfully!`)

  const meta = createResponseMeta(startTime, { steamId, method: 'POST', loadoutId })
  return createSuccessResponse({ success: true }, meta, 'Loadout cleared successfully')
}, ErrorCodes.LOADOUT_CLEAR_ERROR)
