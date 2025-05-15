import { defineEventHandler, createError } from 'h3'
import { APIRequestLogger as Logger } from '~/server/utils/logger'
import {DBKnife, IEnhancedItem, APISkin, IDefaultItem, IEnhancedKnife} from "~/server/utils/interfaces"
import { getSkinsData } from '~/server/utils/csgoAPI'
import { executeQuery } from '~/server/database/database'
import { DEFAULT_KNIFES } from '~/server/utils/constants'
import {createDefaultEnhancedKnife} from "~/server/utils/helpers";


export default defineEventHandler(async (event) => {
    const query = getQuery(event);

    //LOG:Logger.header(`Knife API request: ${event.method} ${event.req.url}`);

    const steamId = query.steamId as string;
    validateRequiredRequestData(steamId, 'Steam ID');

    const loadoutId = query.loadoutId as string;
    validateRequiredRequestData(loadoutId, 'Loadout ID');


    try {
        const skinData = getSkinsData();

        //LOG: Logger.info(`Fetching knifes for Steam ID: ${steamId}`);
        // Fetch all knifes from the database for the given loadout
        const knifes = await executeQuery<DBKnife[]>(
            'SELECT * FROM wp_player_knifes WHERE steamid = ? AND loadoutid = ?',
            [steamId, loadoutId],
            'Failed to fetch knifes'
        );

        // Fetch all knife skins from the skin data
        const knifeSkins: APISkin[] = skinData.filter(skin =>
            skin.weapon?.id.includes('knife') ||
            skin.weapon?.id === 'weapon_bayonet'
        );

        // Map through default knives and enhance them with skin data
        const enhancedKnifes = DEFAULT_KNIFES.map((baseKnife: IDefaultItem) => {
            // Find the database entries for this knife defindex if they exist
            //LOG: Logger.info(`Base knife: ${baseKnife.weapon_name}`)
            const matchingDatabaseResults: DBKnife[] = knifes.filter(
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
                //LOG: Logger.info(`Found Skin info for DBResult ${databaseResult.defindex} (${baseKnife.weapon_name}): ${skinInfo?.name}`)
                //LOG: Logger.info(`Team: ${databaseResult.team === 1 ? 'T' : 'CT'}`)
                /**
                 * Example of a database result:
                 * {
                 *      weapon_defindex: 523,
                 *      weapon_name: 'weapon_knife_widowmaker',
                 *      name: '★ Talon Knife | Doppler (Sapphire)',
                 *      defaultName: 'Talon Knife',
                 *      image:
                 *              'https://raw.githubusercontent.com/ByMykel/counter-strike-image-tracker/main/static/panorama/images/econ/default_generated/weapon_knife_widowmaker_am_sapphire_marbleized_light_png.png',
                 *      defaultImage:
                 *              'https://raw.githubusercontent.com/ByMykel/counter-strike-image-tracker/main/static/panorama/images/econ/weapons/base_weapons/weapon_knife_widowmaker_png.png',
                 *      category: 'knife',
                 *      minFloat: 0,
                 *      maxFloat: 0.08,
                 *      paintIndex: '416',
                 *      rarity: {
                 *          id: 'rarity_ancient_weapon',
                 *          name: 'Covert',
                 *          color: '#eb4b4b'
             *          },
                 *      availableTeams: 'both',
                 *      databaseInfo: {
                 *          id: 7,
                 *          steamid: '76561198117084164',
                 *          loadoutid: 1,
                 *          active: 1,
                 *          team: 2,
                 *          defindex: 523,
                 *          paintindex: 416,
                 *          paintseed: 0,
                 *          paintwear: 0,
                 *          stattrak_enabled: 0,
                 *          stattrak_count: 0,
                 *          nametag: '',
                 *          created_at: 2025-02-24T23:52:37.000Z,
                 *          updated_at: 2025-02-24T23:52:37.000Z
                 *       }
                 *  }
                 *
                 */
                data.push({
                    weapon_defindex: baseKnife.weapon_defindex,
                    weapon_name: baseKnife.weapon_name,
                    name: skinInfo?.name || baseKnife.defaultName,
                    defaultName: baseKnife.defaultName,
                    image: skinInfo?.image || baseKnife.defaultImage,
                    defaultImage: baseKnife.defaultImage,
                    category: 'knife',
                    minFloat: skinInfo?.min_float || 0,
                    maxFloat: skinInfo?.max_float || 1,
                    paintIndex: skinInfo?.paint_index || baseKnife.paintIndex,
                    rarity: skinInfo?.rarity,
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

        //LOG: Logger.success(`Fetched ${knifes.length} knifes for Steam ID: ${steamId}`);
        return {
            knifes: enhancedKnifes,
            meta: {
                rows: knifes.length,
                steamId,
                loadoutId
            }
        };

    } catch (error: any) {
        Logger.error('Failed to fetch knifes: ' + error.message);
        throw createError({
            statusCode: 500,
            message: error.message || 'Failed to fetch knifes'
        });
    }
});