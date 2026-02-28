import { getQuery } from 'h3'
import { eq, and } from 'drizzle-orm'
import { db } from '~/server/database/client'
import { knives } from '~/server/database/schema'
import type { APISkin, IDefaultItem, IEnhancedKnife } from '~/server/types'
import { getSkinsDataAsync } from '~/server/utils/csgoAPI'
import {
    findMatchingSkin,
    findSkinByPaintIndex,
    createDefaultItem,
} from '~/server/utils/data/skinUtils'
import { validateRequiredRequestData } from '~/server/utils/helpers'
import { DEFAULT_KNIVES } from '~/server/utils/constants'
import { toLoadoutId } from '~/types/core/common'
import { createCollectionResponse, createResponseMeta } from '~/server/utils/api/responseHelpers'
import { useErrorHandling, ErrorCodes } from '~/server/utils/errorHandler'

export default useErrorHandling(async (event) => {
    const startTime = Date.now()
    const query = getQuery(event)

    //LOG:Logger.header(`Knife API request: ${event.method} ${event.req.url}`);

    const steamId = query.steamId as string
    validateRequiredRequestData(steamId, 'Steam ID')

    const loadoutId = query.loadoutId as string
    validateRequiredRequestData(loadoutId, 'Loadout ID')

    const skinData = await getSkinsDataAsync()

    //LOG: Logger.info(`Fetching knives for Steam ID: ${steamId}`);
    // Fetch all knives from the database for the given loadout using Drizzle
    const knivesData = await db
        .select()
        .from(knives)
        .where(and(eq(knives.steamid, steamId), eq(knives.loadoutid, toLoadoutId(loadoutId))))

    // Fetch all knife skins from the skin data
    const knifeSkins: APISkin[] = skinData.filter(
        (skin) => skin.weapon?.id.includes('knife') || skin.weapon?.id === 'weapon_bayonet'
    )

    // Map through default knives and enhance them with skin data
    const enhancedKnives = DEFAULT_KNIVES.map((baseKnife: IDefaultItem) => {
        // Find the database entries for this knife defindex if they exist
        //LOG: Logger.info(`Base knife: ${baseKnife.weapon_name}`)
        const matchingDatabaseResults = knivesData.filter(
            (knife) => knife.defindex === baseKnife.weapon_defindex
        )

        // If no custom skins found, return the default knife
        if (matchingDatabaseResults.length === 0) {
            //LOG:Logger.info(`No matching database results for ${baseKnife.weapon_name}`)
            return createDefaultItem<IEnhancedKnife>(baseKnife)
        }

        //LOG: Logger.info(`Found ${matchingDatabaseResults.length} matching database results for ${baseKnife.weapon_name}`)
        const data: IEnhancedKnife[] = []
        // Get for each matching database result the API Skin info
        for (const databaseResult of matchingDatabaseResults) {
            // Create a compatible object for findMatchingSkin
            const dbResultForSkin = {
                ...databaseResult,
                id: String(databaseResult.id),
                active: !!databaseResult.active,
                stattrak_enabled: !!databaseResult.stattrak_enabled,
            }

            const skinInfo = findMatchingSkin(baseKnife, dbResultForSkin, knifeSkins)

            // Check if we have a custom paint index but no matching skin (invalid paint index for this knife)
            const hasCustomPaintIndex = databaseResult.paintindex && databaseResult.paintindex > 0
            const isInvalidPaintIndex = hasCustomPaintIndex && !skinInfo

            let displayName: string
            let displayImage: string
            let paintIndexToUse: string | number
            let rarityToUse: { id: string; name: string; color: string } | undefined

            if (isInvalidPaintIndex) {
                // Invalid paint index: show default knife image but custom name
                displayImage = baseKnife.defaultImage
                paintIndexToUse = databaseResult.paintindex

                // Try to find the skin name by paint index from any weapon/knife (search all skins, not just knives)
                const paintIndexSkin = findSkinByPaintIndex(databaseResult.paintindex, skinData)
                if (paintIndexSkin) {
                    // Format: "Knife Name | Skin Name" (e.g., "★ Karambit | Dragon Lore")
                    const skinNameOnly = paintIndexSkin.name.replace(/^★?\s*.*?\|\s*/, '')
                    displayName = `★ ${baseKnife.defaultName} | ${skinNameOnly}`
                    // Use the rarity from the original weapon/knife that has this paint index
                    rarityToUse = paintIndexSkin.rarity
                } else {
                    // Fallback if we can't find the skin name
                    displayName = `★ ${baseKnife.defaultName} | Unknown Skin (${databaseResult.paintindex})`
                    rarityToUse = undefined
                }
            } else if (skinInfo) {
                // Valid skin found
                displayImage = skinInfo.image
                displayName = skinInfo.name
                paintIndexToUse = skinInfo.paint_index
                rarityToUse = skinInfo.rarity
            } else {
                // Default knife (paint index 0 or no custom skin)
                displayImage = baseKnife.defaultImage
                displayName = `★ ${baseKnife.defaultName} | Default`
                paintIndexToUse = baseKnife.paintindex
                rarityToUse = { id: 'default', name: 'Default', color: '#B0C3D9' }
            }

            data.push({
                weapon_defindex: baseKnife.weapon_defindex,
                weapon_name: baseKnife.weapon_name,
                name: displayName,
                defaultName: baseKnife.defaultName,
                image: displayImage,
                defaultImage: baseKnife.defaultImage,
                category: 'knife',
                minFloat: skinInfo?.min_float || 0,
                maxFloat: skinInfo?.max_float || 1,
                paintindex: paintIndexToUse,
                rarity: rarityToUse,
                availableTeams: 'both',
                team: null,
                databaseInfo: {
                    ...databaseResult,
                    active: !!databaseResult.active,
                    stattrak_enabled: !!databaseResult.stattrak_enabled,
                },
            } as IEnhancedKnife)
        }

        // Directly return the data array because there must be at least one entry after line 46
        //LOG: Logger.info(`Data for ${baseKnife.weapon_name}: ${JSON.stringify(data)}`)
        return data
    })

    //LOG: Logger.success(`Fetched ${knivesData.length} knives for Steam ID: ${steamId}`);

    const meta = createResponseMeta(startTime, {
        steamId,
        loadoutId,
        databaseRows: knivesData.length,
        knivesReturned: enhancedKnives.length,
    })

    return createCollectionResponse(
        enhancedKnives,
        enhancedKnives.length,
        meta,
        ['knives'],
        undefined,
        `Successfully fetched ${enhancedKnives.length} knives`
    )
}, ErrorCodes.KNIFE_FETCH_ERROR)
