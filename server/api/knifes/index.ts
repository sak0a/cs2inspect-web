import { defineEventHandler, createError } from 'h3'
import { APIRequestLogger as Logger } from '~/server/utils/logger'
import {DBKnife, IEnhancedWeapon, APISkin, IDefaultItem} from "~/server/utils/interfaces"
import { verifyUserAccess, validateQueryParam } from '~/server/utils/helpers'
import { getSkinsData } from '~/server/utils/csgoAPI'
import { executeQuery } from '~/server/database/database'
import { DEFAULT_KNIFES } from '~/server/utils/constants'

/**
 * Find matching skin from the skin data using the weapon ID and paint index
 * @param baseKnife The default knife data
 * @param databaseKnife The knife data from database
 * @param skinsData All available skins data
 */
function findMatchingSkin(baseKnife: any, databaseKnife: DBKnife | undefined, skinsData: APISkin[]): APISkin | undefined {
    if (!databaseKnife) return undefined;

    return skinsData.find(skin =>
        skin.weapon?.id === baseKnife.weapon_name &&
        skin.paint_index === databaseKnife?.paintindex.toString()
    );
}

export default defineEventHandler(async (event) => {
    const query = getQuery(event);

    Logger.header(`Knife API request: ${event.method} ${event.req.url}`);

    const steamId = query.steamId as string;
    validateQueryParam(steamId, 'Steam ID');
    verifyUserAccess(steamId, event)

    const loadoutId = query.loadoutId as string;
    validateQueryParam(loadoutId, 'Loadout ID');

    try {
        // Get all available skins data
        const skinData = getSkinsData();
        if (!skinData) {
            Logger.error('Failed to load skins data');
            throw createError({
                statusCode: 500,
                message: 'Failed to load skins data'
            });
        }

        // Get knives from database
        const knifes = await executeQuery<DBKnife[]>(
            'SELECT * FROM wp_player_knifes WHERE steamid = ? AND loadoutid = ?',
            [steamId, loadoutId],
            'Failed to fetch knives'
        );

        // Filter for knife skins only
        const knifeSkins: APISkin[] = skinData.filter(skin =>
            skin.weapon?.id.includes('knife') ||
            skin.weapon?.id === 'weapon_bayonet'
        );



        // Map through default knives and enhance them with skin data
        const enhancedKnifes = DEFAULT_KNIFES.map((baseKnife: IDefaultItem) => {
            // Find the database entries for this knife if they exist
            const matchingDatabaseResults: DBKnife[] = knifes.filter(
                (knife: DBKnife) => knife.defindex === baseKnife.weapon_defindex
            );

            let data: IEnhancedWeapon[] = [];

            // Process each database result for this knife type
            for (const databaseResult of matchingDatabaseResults) {
                const skinInfo = findMatchingSkin(baseKnife, databaseResult, knifeSkins);

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
                    rarity: skinInfo?.rarity || {
                        id: 'default',
                        name: 'Default',
                        color: '#000000'
                    },
                    availableTeams: 'both',
                    databaseInfo: {
                        active: databaseResult.active,
                        team: databaseResult.team,
                        defindex: databaseResult.defindex,
                        statTrak: databaseResult.stattrak_enabled,
                        statTrakCount: databaseResult.stattrak_count,
                        paintIndex: databaseResult.paintindex,
                        paintWear: Number(databaseResult.paintwear),
                        pattern: Number(databaseResult.paintseed),
                        nameTag: databaseResult.nametag
                    }
                } as IEnhancedWeapon);
            }

            // If there are any custom skins for this knife, return them
            if (data.length > 0) {
                return data;
            }

            // If no custom skins found, return the default knife
            return [{
                weapon_defindex: baseKnife.weapon_defindex,
                weapon_name: baseKnife.weapon_name,
                category: 'knife',
                name: baseKnife.defaultName,
                defaultName: baseKnife.defaultName,
                image: baseKnife.defaultImage,
                defaultImage: baseKnife.defaultImage,
                minFloat: 0,
                maxFloat: 1,
                paintIndex: baseKnife.paintIndex,
                availableTeams: 'both'
            } as IEnhancedWeapon];
        });

        Logger.success(`Fetched ${knifes.length} knives for Steam ID: ${steamId}`);
        return {
            knifes: enhancedKnifes,
            meta: {
                rows: knifes.length,
                steamId,
                loadoutId
            }
        };

    } catch (error: any) {
        Logger.error('Failed to fetch knives: ' + error.message);
        throw createError({
            statusCode: 500,
            message: error.message || 'Failed to fetch knives'
        });
    }
});