// server/api/loadouts/[id].delete.ts
import { validateRequiredRequestData, getAuthenticatedSteamId } from '~/server/utils/helpers'
import { Logger } from '~/server/utils/logger'
import { deleteLoadout } from '~/server/database/loadoutHelpers'
import { createSuccessResponse, createResponseMeta } from '~/server/utils/api/responseHelpers'
import { useErrorHandling, ErrorCodes } from '~/server/utils/errorHandler'

/**
 * DELETE /api/loadouts/:id
 * Deletes a loadout
 */
export default useErrorHandling(async (event) => {
  const startTime = Date.now()

  const id = event.context.params?.id as string
  validateRequiredRequestData(id, 'Loadout ID')

  Logger.header(`Loadouts DELETE request: ${event.req.url}`)

  const steamId = getAuthenticatedSteamId(event)

  await deleteLoadout(id, steamId)
  Logger.success(`Loadout ${id} deleted successfully!`)

  const meta = createResponseMeta(startTime, { steamId, method: 'DELETE', loadoutId: id })
  return createSuccessResponse(null, meta, 'Loadout deleted successfully')
}, ErrorCodes.LOADOUT_ERROR)
