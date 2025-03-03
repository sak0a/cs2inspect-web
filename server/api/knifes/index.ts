import { defineEventHandler, createError } from 'h3'
import { APIRequestLogger as Logger } from '~/server/utils/logger'
import { DBKnife, IEnhancedItem, APISkin, IDefaultItem } from "~/server/utils/interfaces"
import { getSkinsData } from '~/server/utils/csgoAPI'
import { executeQuery } from '~/server/database/database'
import { DEFAULT_KNIFES } from '~/server/utils/constants'


export default defineEventHandler(async (event) => {
    const query = getQuery(event);

    Logger.header(`Knife API request: ${event.method} ${event.req.url}`);

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
            // Find the database entries for this knife if they exist
            const matchingDatabaseResults: DBKnife[] = knifes.filter(
                (knife: DBKnife) => knife.defindex === baseKnife.weapon_defindex
            );

            let data: IEnhancedItem[] = [];

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
                    rarity: skinInfo?.rarity,
                    availableTeams: 'both',
                    databaseInfo: databaseResult
                } as IEnhancedItem);
            }

            // If there are any custom skins for this knife, return them
            if (data.length > 0) {
                return data;
            }

            // If no custom skins found, return the default knife
            return createDefaultEnhancedWeapon(baseKnife, true);
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