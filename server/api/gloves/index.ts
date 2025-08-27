import { defineEventHandler, createError } from 'h3'
import { APIRequestLogger as Logger } from '~/server/utils/logger'
import {DBGlove, IEnhancedItem, APISkin, IDefaultItem, IEnhancedGlove} from "~/server/utils/interfaces"
import { getSkinsData } from '~/server/utils/csgoAPI'
import { executeQuery } from '~/server/database/database'
import { DEFAULT_GLOVES, VALID_GLOVE_DEFINDEXES } from '~/server/utils/constants'
import { findMatchingSkin, validateRequiredRequestData } from "~/server/utils/helpers";
import {
    createCollectionResponse,
    createResponseMeta,
    withErrorHandling
} from '~/server/utils/apiResponseHelpers';


export default defineEventHandler(withErrorHandling(async (event) => {
    const startTime = Date.now();
    const query = getQuery(event);

    Logger.header(`Gloves API request: ${event.method} ${event.req.url}`);

    const steamId = query.steamId as string;
    validateRequiredRequestData(steamId, 'Steam ID');

    const loadoutId = query.loadoutId as string;
    validateRequiredRequestData(loadoutId, 'Loadout ID');

    const skinData = getSkinsData();

    Logger.info(`Fetching gloves for Steam ID: ${steamId}`);
    // Fetch all gloves from the database for the given loadout
    const gloves = await executeQuery<DBGlove[]>(
        'SELECT * FROM wp_player_gloves WHERE steamid = ? AND loadoutid = ?',
        [steamId, loadoutId],
        'Failed to fetch gloves'
    );

    // Fetch all glove skins from the skin data
    const gloveSkins: APISkin[] = skinData.filter(skin =>
        skin.weapon?.id.includes('glove')
    );

    // Map through default gloves and enhance them with skin data
    const enhancedGloves = DEFAULT_GLOVES.map((baseGlove: IDefaultItem) => {
        // Find the database entries for this glove defindex if they exist
        const matchingDatabaseResults: DBGlove[] = gloves.filter(
            (glove: DBGlove) => glove.defindex === baseGlove.weapon_defindex
        );

        // If no custom skins found, return the default glove
        if (matchingDatabaseResults.length === 0) {
            return createDefaultItem<IEnhancedGlove>(baseGlove);
        }

        let data: IEnhancedGlove[] = [];
        // Get for each matching database result the API Skin info
        for (const databaseResult of matchingDatabaseResults) {
            const skinInfo = findMatchingSkin(baseGlove, databaseResult, gloveSkins);
            databaseResult.active = !!databaseResult.active

            data.push({
                weapon_defindex: baseGlove.weapon_defindex,
                weapon_name: baseGlove.weapon_name,
                name: skinInfo?.name || baseGlove.defaultName,
                defaultName: baseGlove.defaultName,
                image: skinInfo?.image || baseGlove.defaultImage,
                defaultImage: baseGlove.defaultImage,
                category: 'glove',
                minFloat: skinInfo?.min_float || 0,
                maxFloat: skinInfo?.max_float || 1,
                paintIndex: skinInfo?.paint_index || baseGlove.paintIndex,
                rarity: skinInfo?.rarity,
                availableTeams: 'both',
                databaseInfo: databaseResult
            } as IEnhancedGlove);
        }

        // Directly return the data array because there must be at least one entry
        return data;
    });

    Logger.success(`Fetched ${gloves.length} gloves for Steam ID: ${steamId}`);

    const meta = createResponseMeta(startTime, {
        steamId,
        loadoutId,
        databaseRows: gloves.length,
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
}, 'GLOVES_FETCH_ERROR'));
