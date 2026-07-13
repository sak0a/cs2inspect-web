import { readBody } from 'h3'
import type { H3Event } from 'h3'
import { Logger } from '~/server/utils/logger'
import { setLoadoutAsDefault } from '~/server/database/loadoutHelpers'
import { validateRequiredRequestData, getAuthenticatedSteamId } from '~/server/utils/helpers'
import { createSuccessResponse, createResponseMeta } from '~/server/utils/api/responseHelpers'
import { useErrorHandling, ErrorCodes } from '~/server/utils/errorHandler'

/**
 * POST /api/loadouts/default
 * Sets a loadout as the default loadout for the user
 */
export default useErrorHandling(async (event: H3Event) => {
  const startTime = Date.now()

  Logger.header(`Set Default Loadout API request: ${event.req.url}`)

  const steamId = getAuthenticatedSteamId(event)
  const body = await readBody(event)
  const loadoutId = body.loadoutId

  validateRequiredRequestData(loadoutId, 'Loadout ID')

  await setLoadoutAsDefault(loadoutId, steamId)
  Logger.success(`Loadout ${loadoutId} set as default!`)

  const meta = createResponseMeta(startTime, { steamId, method: 'POST', loadoutId })
  return createSuccessResponse({ success: true }, meta, 'Default loadout set successfully')
}, ErrorCodes.LOADOUT_ERROR)
