import { getQuery, readBody } from 'h3'
import type { H3Event } from 'h3'
import { Logger } from '~/server/utils/logger'
import { setLoadoutAsDefault } from '~/server/database/loadoutHelpers'
import { validateRequiredRequestData } from '~/server/utils/helpers'
import { createSuccessResponse, createResponseMeta } from '~/server/utils/api/responseHelpers'
import { useErrorHandling, ErrorCodes } from '~/server/utils/errorHandler'

/**
 * POST /api/loadouts/default
 * Sets a loadout as the default loadout for the user
 */
export default useErrorHandling(async (event: H3Event) => {
  const startTime = Date.now()
  const query = getQuery(event)

  Logger.header(`Set Default Loadout API request: ${event.req.url}`)

  const body = await readBody(event)
  const steamId = (query.steamId as string) || body.steamId
  const loadoutId = body.loadoutId

  validateRequiredRequestData(steamId, 'Steam ID')
  validateRequiredRequestData(loadoutId, 'Loadout ID')

  await setLoadoutAsDefault(loadoutId, steamId)
  Logger.success(`Loadout ${loadoutId} set as default!`)

  const meta = createResponseMeta(startTime, { steamId, method: 'POST', loadoutId })
  return createSuccessResponse({ success: true }, meta, 'Default loadout set successfully')
}, ErrorCodes.LOADOUT_ERROR)
