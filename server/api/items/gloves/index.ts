import { getQuery } from 'h3'
import { eq, and } from 'drizzle-orm'
import { db } from '~/server/database/client'
import { gloves } from '~/server/database/schema'
import { Logger } from '~/server/utils/logger'
import type { APISkin, IDefaultItem, IEnhancedGlove } from "~/server/types"
import { getSkinsDataAsync } from '~/server/utils/csgoAPI'
import { DEFAULT_GLOVES } from '~/server/utils/constants'
import { validateRequiredRequestData } from "~/server/utils/helpers";
import { createDefaultItem, findMatchingSkin } from '~/server/utils/data/skinUtils';
import { toLoadoutId } from '~/types/core/common';
import {
    createCollectionResponse,
    createResponseMeta,
} from '~/server/utils/api/responseHelpers';
import { useErrorHandling, ErrorCodes } from '~/server/utils/errorHandler'


export default useErrorHandling(async (event) => {
    const startTime = Date.now();
    const query = getQuery(event);

    Logger.header(`Gloves API request: ${event.method} ${event.req.url}`);

    const steamId = query.steamId as string;
    validateRequiredRequestData(steamId, 'Steam ID');

    const loadoutId = query.loadoutId as string;
    validateRequiredRequestData(loadoutId, 'Loadout ID');

    const skinData = await getSkinsDataAsync();

    Logger.info(`Fetching gloves for Steam ID: ${steamId}`);
    // Fetch all gloves from the database for the given loadout using Drizzle
    const glovesData = await db.select()
        .from(gloves)
        .where(and(
            eq(gloves.steamid, steamId),
            eq(gloves.loadoutid, toLoadoutId(loadoutId))
        ));

    Logger.info(`Found ${glovesData.length} glove entries in database:` + JSON.stringify(glovesData, null, 2));

    // Fetch all glove skins from the skin data
    // Include all glove types: those with 'glove' in the name AND handwraps
    const gloveSkins: APISkin[] = skinData.filter(skin => {
        const weaponId = skin.weapon?.id || '';
        return weaponId.includes('glove') || weaponId === 'leather_handwraps';
    });

    Logger.info(`Found ${gloveSkins.length} glove skins in API data`);

    // Log handwraps specifically
    const handwrapsSkins = gloveSkins.filter(skin => skin.weapon?.id === 'leather_handwraps');
    Logger.info(`Found ${handwrapsSkins.length} handwraps skins:` + handwrapsSkins.map(s => ({ name: s.name, paint_index: s.paint_index })));

    // Map through default gloves and enhance them with skin data
    const enhancedGloves = DEFAULT_GLOVES.map((baseGlove: IDefaultItem) => {
        Logger.info(`Processing glove: ${baseGlove.defaultName} (defindex: ${baseGlove.weapon_defindex}, weapon_name: ${baseGlove.weapon_name})`);

        // Find the database entries for this glove defindex if they exist
        const matchingDatabaseResults = glovesData.filter(
            (glove) => glove.defindex === baseGlove.weapon_defindex
        );

        Logger.info(`Found ${matchingDatabaseResults.length} database entries for ${baseGlove.defaultName}:` + matchingDatabaseResults);

        // If no custom skins found, return the default glove
        if (matchingDatabaseResults.length === 0) {
            Logger.info(`No custom skins for ${baseGlove.defaultName}, returning default`);
            return createDefaultItem<IEnhancedGlove>(baseGlove);
        }

        const data: IEnhancedGlove[] = [];
        // Get for each matching database result the API Skin info
        for (const databaseResult of matchingDatabaseResults) {
            Logger.info(`Processing database result for ${baseGlove.defaultName}:` + databaseResult);

            // Create a compatible object for findMatchingSkin
            const dbResultForSkin = {
                ...databaseResult,
                id: String(databaseResult.id),
                active: !!databaseResult.active
            };

            const skinInfo = findMatchingSkin(baseGlove, dbResultForSkin, gloveSkins);

            if (skinInfo) {
                Logger.info(`Found matching skin for ${baseGlove.defaultName}:` + { name: skinInfo.name, image: skinInfo.image, paint_index: skinInfo.paint_index });
            } else {
                Logger.info(`No matching skin found for ${baseGlove.defaultName} with paintindex ${databaseResult.paintindex}`);
            }

            const enhancedGlove = {
                weapon_defindex: baseGlove.weapon_defindex,
                weapon_name: baseGlove.weapon_name,
                name: skinInfo?.name || baseGlove.defaultName,
                defaultName: baseGlove.defaultName,
                image: skinInfo?.image || baseGlove.defaultImage,
                defaultImage: baseGlove.defaultImage,
                category: 'glove',
                minFloat: skinInfo?.min_float || 0,
                maxFloat: skinInfo?.max_float || 1,
                paintindex: skinInfo?.paint_index || baseGlove.paintindex,
                rarity: skinInfo?.rarity,
                availableTeams: 'both',
                team: null,
                databaseInfo: {
                    ...databaseResult,
                    active: !!databaseResult.active
                }
            } as IEnhancedGlove;

            Logger.info(`Created enhanced glove for ${baseGlove.defaultName}:` + {
                name: enhancedGlove.name,
                image: enhancedGlove.image,
                paintindex: enhancedGlove.paintindex,
                usingSkinImage: !!skinInfo?.image
            });

            data.push(enhancedGlove);
        }

        // Directly return the data array because there must be at least one entry
        return data;
    });

    Logger.success(`Fetched ${glovesData.length} gloves for Steam ID: ${steamId}`);

    const meta = createResponseMeta(startTime, {
        steamId,
        loadoutId,
        databaseRows: glovesData.length,
        glovesReturned: enhancedGloves.length
    });

    return createCollectionResponse(
        enhancedGloves,
        enhancedGloves.length,
        meta,
        ['gloves'],
        undefined,
        `Successfully fetched ${enhancedGloves.length} gloves`
    );
}, ErrorCodes.GLOVE_FETCH_ERROR);
