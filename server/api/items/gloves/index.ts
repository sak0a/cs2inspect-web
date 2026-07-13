import { getQuery } from 'h3'
import { eq, and } from 'drizzle-orm'
import { db } from '~/server/database/client'
import { gloves } from '~/server/database/schema'
import { Logger } from '~/server/utils/logger'
import type { APISkin, IDefaultItem, IEnhancedGlove } from '~/server/types'
import { getSkinsDataAsync } from '~/server/utils/csgoAPI'
import { DEFAULT_GLOVES } from '~/server/utils/constants'
import { validateRequiredRequestData, getAuthenticatedSteamId } from '~/server/utils/helpers'
import { createDefaultItem, findMatchingSkin } from '~/server/utils/data/skinUtils'
import { toLoadoutId } from '~/types/core/common'
import { createCollectionResponse, createResponseMeta } from '~/server/utils/api/responseHelpers'
import { useErrorHandling, ErrorCodes } from '~/server/utils/errorHandler'

export default useErrorHandling(async (event) => {
  const startTime = Date.now()
  const query = getQuery(event)

  Logger.debug(`Request start method=${event.method} path=${event.req.url}`, 'gloves-api')

  const steamId = getAuthenticatedSteamId(event)

  const loadoutId = query.loadoutId as string
  validateRequiredRequestData(loadoutId, 'Loadout ID')

  const skinData = await getSkinsDataAsync()

  Logger.debug(`Fetch start steamId=${steamId} loadoutId=${loadoutId}`, 'gloves-api')
  // Fetch all gloves from the database for the given loadout using Drizzle
  const glovesData = await db
    .select()
    .from(gloves)
    .where(and(eq(gloves.steamid, steamId), eq(gloves.loadoutid, toLoadoutId(loadoutId))))

  Logger.debug(`Found ${glovesData.length} glove entries in database`, 'gloves-api')

  // Fetch all glove skins from the skin data
  // Include all glove types: those with 'glove' in the name AND handwraps
  const gloveSkins: APISkin[] = skinData.filter((skin) => {
    const weaponId = skin.weapon?.id || ''
    return weaponId.includes('glove') || weaponId === 'leather_handwraps'
  })

  Logger.debug(`Found ${gloveSkins.length} glove skins in API data`, 'gloves-api')

  // Log handwraps specifically
  const handwrapsSkins = gloveSkins.filter((skin) => skin.weapon?.id === 'leather_handwraps')
  Logger.debug(`Found ${handwrapsSkins.length} handwraps skins`, 'gloves-api')

  // Map through default gloves and enhance them with skin data
  const enhancedGloves = DEFAULT_GLOVES.map((baseGlove: IDefaultItem) => {
    Logger.debug(
      `Processing glove: ${baseGlove.defaultName} (defindex: ${baseGlove.weapon_defindex})`,
      'gloves-api'
    )

    // Find the database entries for this glove defindex if they exist
    const matchingDatabaseResults = glovesData.filter(
      (glove) => glove.defindex === baseGlove.weapon_defindex
    )

    Logger.debug(
      `Found ${matchingDatabaseResults.length} database entries for ${baseGlove.defaultName}`,
      'gloves-api'
    )

    // If no custom skins found, return the default glove
    if (matchingDatabaseResults.length === 0) {
      Logger.debug(`No custom skins for ${baseGlove.defaultName}, returning default`, 'gloves-api')
      return createDefaultItem<IEnhancedGlove>(baseGlove)
    }

    const data: IEnhancedGlove[] = []
    // Get for each matching database result the API Skin info
    for (const databaseResult of matchingDatabaseResults) {
      Logger.debug(`Processing database result for ${baseGlove.defaultName}`, 'gloves-api')

      // Create a compatible object for findMatchingSkin
      const dbResultForSkin = {
        ...databaseResult,
        id: String(databaseResult.id),
        active: !!databaseResult.active,
      }

      const skinInfo = findMatchingSkin(baseGlove, dbResultForSkin, gloveSkins)

      if (skinInfo) {
        Logger.debug(
          `Found matching skin for ${baseGlove.defaultName}: ${skinInfo.name}`,
          'gloves-api'
        )
      } else {
        Logger.debug(
          `No matching skin found for ${baseGlove.defaultName} with paintindex ${databaseResult.paintindex}`,
          'gloves-api'
        )
      }

      const isDefaultSkin = !skinInfo
      const enhancedGlove = {
        weapon_defindex: baseGlove.weapon_defindex,
        weapon_name: baseGlove.weapon_name,
        name: skinInfo?.name || `${baseGlove.defaultName} | Default`,
        defaultName: baseGlove.defaultName,
        image: skinInfo?.image || baseGlove.defaultImage,
        defaultImage: baseGlove.defaultImage,
        category: 'glove',
        minFloat: skinInfo?.min_float || 0,
        maxFloat: skinInfo?.max_float || 1,
        paintindex: skinInfo?.paint_index || baseGlove.paintindex,
        rarity:
          skinInfo?.rarity ||
          (isDefaultSkin ? { id: 'default', name: 'Default', color: '#B0C3D9' } : undefined),
        availableTeams: 'both',
        team: null,
        databaseInfo: {
          ...databaseResult,
          active: !!databaseResult.active,
        },
      } as IEnhancedGlove

      Logger.debug(
        `Created enhanced glove for ${baseGlove.defaultName}: ${enhancedGlove.name}`,
        'gloves-api'
      )

      data.push(enhancedGlove)
    }

    // Directly return the data array because there must be at least one entry
    return data
  })

  Logger.debug(`Fetch done rows=${glovesData.length} steamId=${steamId}`, 'gloves-api')

  const meta = createResponseMeta(startTime, {
    steamId,
    loadoutId,
    databaseRows: glovesData.length,
    glovesReturned: enhancedGloves.length,
  })

  return createCollectionResponse(
    enhancedGloves,
    enhancedGloves.length,
    meta,
    ['gloves'],
    undefined,
    `Successfully fetched ${enhancedGloves.length} gloves`
  )
}, ErrorCodes.GLOVE_FETCH_ERROR)
