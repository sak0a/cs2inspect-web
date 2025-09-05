import { defineEventHandler, createError } from 'h3'
import { APIRequestLogger as Logger } from '~/server/utils/logger'
import {DBGlove, IEnhancedItem, APISkin, IDefaultItem, IEnhancedGlove} from "~/server/utils/interfaces"
import { getSkinsData } from '~/server/utils/csgoAPI'
import { executeQuery } from '~/server/database/database'
import { DEFAULT_GLOVES, VALID_GLOVE_DEFINDEXES } from '~/server/utils/constants'
import { validateRequiredRequestData } from "~/server/utils/helpers";
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

    Logger.info(`Found ${gloves.length} glove entries in database:`, JSON.stringify(gloves, null, 2));

    // Fetch all glove skins from the skin data
    // Include all glove types: those with 'glove' in the name AND handwraps
    const gloveSkins: APISkin[] = skinData.filter(skin => {
        const weaponId = skin.weapon?.id || '';
        return weaponId.includes('glove') || weaponId === 'leather_handwraps';
    });

    Logger.info(`Found ${gloveSkins.length} glove skins in API data`);

    // Log handwraps specifically
    const handwrapsSkins = gloveSkins.filter(skin => skin.weapon?.id === 'leather_handwraps');
    Logger.info(`Found ${handwrapsSkins.length} handwraps skins:`, handwrapsSkins.map(s => ({ name: s.name, paint_index: s.paint_index })));

    // Map through default gloves and enhance them with skin data
    const enhancedGloves = DEFAULT_GLOVES.map((baseGlove: IDefaultItem) => {
        Logger.info(`Processing glove: ${baseGlove.defaultName} (defindex: ${baseGlove.weapon_defindex}, weapon_name: ${baseGlove.weapon_name})`);

        // Find the database entries for this glove defindex if they exist
        const matchingDatabaseResults: DBGlove[] = gloves.filter(
            (glove: DBGlove) => glove.defindex === baseGlove.weapon_defindex
        );

        Logger.info(`Found ${matchingDatabaseResults.length} database entries for ${baseGlove.defaultName}:`, matchingDatabaseResults);

        // If no custom skins found, return the default glove
        if (matchingDatabaseResults.length === 0) {
            Logger.info(`No custom skins for ${baseGlove.defaultName}, returning default`);
            return createDefaultItem<IEnhancedGlove>(baseGlove);
        }

        let data: IEnhancedGlove[] = [];
        // Get for each matching database result the API Skin info
        for (const databaseResult of matchingDatabaseResults) {
            Logger.info(`Processing database result for ${baseGlove.defaultName}:`, databaseResult);

            const skinInfo = findMatchingSkin(baseGlove, databaseResult, gloveSkins);

            if (skinInfo) {
                Logger.info(`Found matching skin for ${baseGlove.defaultName}:`, { name: skinInfo.name, image: skinInfo.image, paint_index: skinInfo.paint_index });
            } else {
                Logger.warn(`No matching skin found for ${baseGlove.defaultName} with paintindex ${databaseResult.paintindex}`);
            }

            databaseResult.active = !!databaseResult.active

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
                paintIndex: skinInfo?.paint_index || baseGlove.paintIndex,
                rarity: skinInfo?.rarity,
                availableTeams: 'both',
                databaseInfo: databaseResult
            } as IEnhancedGlove;

            Logger.info(`Created enhanced glove for ${baseGlove.defaultName}:`, {
                name: enhancedGlove.name,
                image: enhancedGlove.image,
                paintIndex: enhancedGlove.paintIndex,
                usingSkinImage: !!skinInfo?.image
            });

            data.push(enhancedGlove);
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
