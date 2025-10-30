import { defineEventHandler, createError, getQuery } from 'h3'
import {DBKnife, IEnhancedItem, APISkin, IDefaultItem, IEnhancedKnife} from "~/server/utils/interfaces"
import { getSkinsData } from '~/server/utils/csgoAPI'
import { findMatchingSkin, findSkinByPaintIndex, createDefaultItem } from '~/server/utils/skinUtils'
import { validateRequiredRequestData } from '~/server/utils/helpers'
import { executeQuery } from '~/server/database/database'
import { DEFAULT_KNIVES } from '~/server/utils/constants'
import {
    createCollectionResponse,
    createResponseMeta,
    withErrorHandling
} from '~/server/utils/apiResponseHelpers';


export default defineEventHandler(withErrorHandling(async (event) => {
    const startTime = Date.now();
    const query = getQuery(event);

    //LOG:Logger.header(`Knife API request: ${event.method} ${event.req.url}`);

    const steamId = query.steamId as string;
    validateRequiredRequestData(steamId, 'Steam ID');

    const loadoutId = query.loadoutId as string;
    validateRequiredRequestData(loadoutId, 'Loadout ID');

    const skinData = getSkinsData();

    //LOG: Logger.info(`Fetching knives for Steam ID: ${steamId}`);
    // Fetch all knives from the database for the given loadout
    const knives = await executeQuery<DBKnife[]>(
        'SELECT * FROM wp_player_knifes WHERE steamid = ? AND loadoutid = ?',
        [steamId, loadoutId],
        'Failed to fetch knives'
    );

    // Fetch all knife skins from the skin data
    const knifeSkins: APISkin[] = skinData.filter(skin =>
        skin.weapon?.id.includes('knife') ||
        skin.weapon?.id === 'weapon_bayonet'
    );

    // Map through default knives and enhance them with skin data
    const enhancedKnives = DEFAULT_KNIVES.map((baseKnife: IDefaultItem) => {
        // Find the database entries for this knife defindex if they exist
        //LOG: Logger.info(`Base knife: ${baseKnife.weapon_name}`)
        const matchingDatabaseResults: DBKnife[] = knives.filter(
            (knife: DBKnife) => knife.defindex === baseKnife.weapon_defindex
        );

        // If no custom skins found, return the default knife
        if (matchingDatabaseResults.length === 0) {
            /**
             * [ { weapon_defindex: 526,
             *     weapon_name: 'weapon_knife_kukri',
             *     name: 'Kukri Knife',
             *     defaultName: 'Kukri Knife',
             *     image:
             *      'https://raw.githubusercontent.com/ByMykel/counter-strike-image-tracker/main/static/panorama/images/econ/weapons/base_weapons/weapon_knife_kukri_png.png',
             *     defaultImage:
             *      'https://raw.githubusercontent.com/ByMykel/counter-strike-image-tracker/main/static/panorama/images/econ/weapons/base_weapons/weapon_knife_kukri_png.png',
             *     category: 'knife',
             *     minFloat: 0,
             *     maxFloat: 1,
             *     paintIndex: 0,
             *     availableTeams: 'both'
             *     }
             * ]
             */
            //LOG:Logger.info(`No matching database results for ${baseKnife.weapon_name}`)
            return createDefaultItem<IEnhancedKnife>(baseKnife);
        }

        //LOG: Logger.info(`Found ${matchingDatabaseResults.length} matching database results for ${baseKnife.weapon_name}`)
        let data: IEnhancedKnife[] = [];
        // Get for each matching database result the API Skin info
        for (const databaseResult of matchingDatabaseResults) {
            const skinInfo = findMatchingSkin(baseKnife, databaseResult, knifeSkins);
            databaseResult.active = !!databaseResult.active
            databaseResult.stattrak_enabled = !!databaseResult.stattrak_enabled

            // Check if we have a custom paint index but no matching skin (invalid paint index for this knife)
            const hasCustomPaintIndex = databaseResult.paintindex && databaseResult.paintindex > 0;
            const isInvalidPaintIndex = hasCustomPaintIndex && !skinInfo;

            let displayName: string;
            let displayImage: string;
            let paintIndexToUse: string | number;
            let rarityToUse: any;

            if (isInvalidPaintIndex) {
                // Invalid paint index: show default knife image but custom name
                displayImage = baseKnife.defaultImage;
                paintIndexToUse = databaseResult.paintindex;

                // Try to find the skin name by paint index from any weapon/knife (search all skins, not just knives)
                const paintIndexSkin = findSkinByPaintIndex(databaseResult.paintindex, skinData);
                if (paintIndexSkin) {
                    // Format: "Knife Name | Skin Name" (e.g., "★ Karambit | Dragon Lore")
                    const skinNameOnly = paintIndexSkin.name.replace(/^★?\s*.*?\|\s*/, '');
                    displayName = `★ ${baseKnife.defaultName} | ${skinNameOnly}`;
                    // Use the rarity from the original weapon/knife that has this paint index
                    rarityToUse = paintIndexSkin.rarity;
                } else {
                    // Fallback if we can't find the skin name
                    displayName = `★ ${baseKnife.defaultName} | Unknown Skin (${databaseResult.paintindex})`;
                    rarityToUse = undefined;
                }
            } else if (skinInfo) {
                // Valid skin found
                displayImage = skinInfo.image;
                displayName = skinInfo.name;
                paintIndexToUse = skinInfo.paint_index;
                rarityToUse = skinInfo.rarity;
            } else {
                // Default knife (paint index 0 or no custom skin)
                displayImage = baseKnife.defaultImage;
                displayName = baseKnife.defaultName;
                paintIndexToUse = baseKnife.paintIndex;
                rarityToUse = undefined;
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
                paintIndex: paintIndexToUse,
                rarity: rarityToUse,
                availableTeams: 'both',
                databaseInfo: databaseResult
            } as IEnhancedKnife);
        }

        // Directly return the data array because there must be at least one entry after line 46
        //LOG: Logger.info(`Data for ${baseKnife.weapon_name}: ${JSON.stringify(data)}`)
        return data
        /*
        If there are any custom skins for this knife, return them
        if (data.length > 0) {
            return data;
        }
        */
    });

    //LOG: Logger.success(`Fetched ${knives.length} knives for Steam ID: ${steamId}`);

    const meta = createResponseMeta(startTime, {
        steamId,
        loadoutId,
        databaseRows: knives.length,
        knivesReturned: enhancedKnives.length
    });

    return createCollectionResponse(
        enhancedKnives,
        enhancedKnives.length,
        meta,
        ['knives'],
        undefined,
        `Successfully fetched ${enhancedKnives.length} knives`
    );
}, 'KNIVES_FETCH_ERROR'));