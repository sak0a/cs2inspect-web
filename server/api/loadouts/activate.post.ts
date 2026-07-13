import { readBody } from 'h3'
import { Logger } from '~/server/utils/logger'
import { setActiveLoadout, getLoadout } from '~/server/database/loadoutHelpers'
import { validateRequiredRequestData, getAuthenticatedSteamId } from '~/server/utils/helpers'
import { createSuccessResponse, createResponseMeta } from '~/server/utils/api/responseHelpers'
import { useErrorHandling, ErrorCodes } from '~/server/utils/errorHandler'

/**
 * POST /api/loadouts/activate
 * Sets the specified loadout as active and deactivates all other loadouts for the user
 */
export default useErrorHandling(async (event) => {
  const startTime = Date.now()

  Logger.header(`Activate Loadout API request: ${event.req.url}`)

  const steamId = getAuthenticatedSteamId(event)
  const body = await readBody(event)

  const loadoutId = body.loadoutId
  validateRequiredRequestData(loadoutId, 'Loadout ID')

  await setActiveLoadout(loadoutId, steamId)
  Logger.success(`Loadout ${loadoutId} activated successfully!`)

  const data = await getLoadout(loadoutId, steamId)
  Logger.success(`Loadout ${loadoutId} retrieved successfully for response`)

  const meta = createResponseMeta(startTime, { steamId, method: 'POST', loadoutId })
  return createSuccessResponse(data, meta, 'Loadout activated successfully')
}, ErrorCodes.LOADOUT_ERROR)
