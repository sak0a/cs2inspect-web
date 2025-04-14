import { defineEventHandler, createError } from 'h3'
import { APIRequestLogger as Logger } from '~/server/utils/logger'
import { DBKnife, IEnhancedItem, APISkin, IDefaultItem } from "~/server/utils/interfaces"
import { getSkinsData } from '~/server/utils/csgoAPI'
import { executeQuery } from '~/server/database/database'
import { DEFAULT_KNIFES } from '~/server/utils/constants'

const createMappedKnife = (defaultKnife: IDefaultItem, databaseKnife: DBKnife, skinInfo: APISkin): IEnhancedItem => {
    return {
        weapon_defindex: defaultKnife.weapon_defindex,
        weapon_name: defaultKnife.weapon_name,
        name: skinInfo?.name || defaultKnife.defaultName,
        defaultName: defaultKnife.defaultName,

        image: skinInfo?.image || defaultKnife.defaultImage,
        defaultImage: defaultKnife.defaultImage,

        category: 'knife',
        minFloat: skinInfo?.min_float || 0,
        maxFloat: skinInfo?.max_float || 1,
        paintIndex: parseInt(skinInfo?.paint_index) || defaultKnife.paintIndex,
        rarity: skinInfo?.rarity,
        availableTeams: 'both',
        databaseInfo: databaseKnife
    }
}


export default defineEventHandler(async (event) => {
    Logger.header(`Knife API request: ${event.method} ${event.req.url}`);

    const query = getQuery(event);

    const steamId = query.steamId as string;
    validateRequiredRequestData(steamId, 'Steam ID');

    const loadoutId = query.loadoutId as string;
    validateRequiredRequestData(loadoutId, 'Loadout ID');

    try {
        const skinData = getSkinsData();

        Logger.info(`Fetching knifes for Steam ID: ${steamId}`);
        const knifes = await executeQuery<DBKnife[]>(
            'SELECT * FROM wp_player_knifes WHERE steamid = ? AND loadoutid = ?',
            [steamId, loadoutId],
            'Failed to fetch knifes'
        );

        const knifeSkins: APISkin[] = skinData.filter(skin =>
            skin.weapon?.id.includes('knife') ||
            skin.weapon?.id === 'weapon_bayonet'
        );

        // Map through default knives and enhance them with skin data
        const enhancedKnifes = DEFAULT_KNIFES.map((baseKnife: IDefaultItem) => {
            const matchingDatabaseResults: DBKnife[] = knifes.filter(
                knife => knife.defindex === baseKnife.weapon_defindex
            );

            let data: IEnhancedItem[] = [];

            for (const databaseResult of matchingDatabaseResults) {
                const matchingSkin = findMatchingSkin(
                    baseKnife,
                    databaseResult,
                    knifeSkins
                )
                data.push(
                   createMappedKnife(
                       baseKnife,
                       databaseResult,
                       matchingSkin
                   )
                );
            }

            if (data.length > 0) {
                return data;
            }

            return createDefaultEnhancedWeapon(baseKnife, true, false);
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
        Logger.error('Failed to fetch knifes: ' + error.message);
        throw createError({
            statusCode: 500,
            message: error.message || 'Failed to fetch knifes'
        });
    }
});