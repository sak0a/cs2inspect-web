import { createError } from 'h3'
import type { H3Event } from 'h3'
import { Logger } from '~/server/utils/logger'
import { getLoadoutsBySteamId } from '~/server/database/loadoutHelpers'
import { getAuthenticatedSteamId } from '~/server/utils/helpers'
import { createSuccessResponse, createResponseMeta } from '~/server/utils/api/responseHelpers'
import { useErrorHandling, ErrorCodes } from '~/server/utils/errorHandler'

/**
 * GET /api/loadouts/equipped
 * Gets the equipped loadout for a user (for CS2 server plugin integration)
 *
 * Priority:
 * 1. Loadout with is_default = 1
 * 2. Loadout with active = 1
 * 3. First loadout found (fallback)
 */
export default useErrorHandling(async (event: H3Event) => {
  const startTime = Date.now()

  Logger.header(`Get Equipped Loadout API request: ${event.req.url}`)

  const steamId = getAuthenticatedSteamId(event)

  const loadouts = await getLoadoutsBySteamId(steamId)

  if (loadouts.length === 0) {
    Logger.info(`No loadouts found for Steam ID ${steamId}`)
    throw createError({
      statusCode: 404,
      message: 'No loadouts found for this user',
    })
  }

  // Priority 1: Find default loadout
  let equippedLoadout = loadouts.find((l) => l.is_default === 1)

  // Priority 2: Find active loadout
  if (!equippedLoadout) {
    equippedLoadout = loadouts.find((l) => l.active === 1)
  }

  // Priority 3: Fallback to first loadout (guaranteed to exist since loadouts.length > 0)
  if (!equippedLoadout) {
    equippedLoadout = loadouts[0]!
  }

  Logger.success(`Equipped loadout found: ${equippedLoadout.id} (${equippedLoadout.name})`)

  const meta = createResponseMeta(startTime, {
    steamId,
    method: 'GET',
    loadoutId: equippedLoadout.id,
  })
  return createSuccessResponse(
    { loadout: equippedLoadout },
    meta,
    'Equipped loadout retrieved successfully'
  )
}, ErrorCodes.LOADOUT_ERROR)
