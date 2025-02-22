import { DEFAULT_WEAPONS } from "~/server/utils/constants"
import {
    DBWeapon,
    APISkin,
    IEnhancedWeapon,
    IDefaultItem,
    APISticker,
    EnhancedWeaponSticker,
    EnhancedWeaponKeychain
} from "~/server/utils/interfaces";
import { getSkinsData, getStickerData } from '~/server/utils/csgoAPI';
import { verifyUserAccess, validateWeaponDatabaseTable } from "~/server/utils/helpers";
import { APIRequestLogger as Logger } from "~/server/utils/logger";
import { executeQuery } from "~/server/database/database";
import { defineEventHandler } from "h3";

/**
 * Find matching skin from the skin data using the weapon ID and paint index
 * @param baseWeapon
 * @param databaseWeapon
 * @param skinsData
 */
function findMatchingSkin(baseWeapon: IDefaultItem, databaseWeapon: DBWeapon | undefined, skinsData: APISkin[]): APISkin | undefined {
    if (!databaseWeapon) return undefined;
    return skinsData.find(skin =>
        skin.weapon?.id === baseWeapon.weapon_name &&
        skin.paint_index === databaseWeapon?.paintindex.toString()
    );
}

function parseStickers(databaseResult: DBWeapon, stickerData: APISticker[]): (IEnhancedWeaponSticker | null)[] {
    const stickers: (IEnhancedWeaponSticker | null)[] = [];
    for (let i = 0; i < 5; i++) {
        const stickerField = `sticker_${i}` as keyof DBWeapon;
        const stickerDatabaseData: string = databaseResult[stickerField]?.toString();

        if (!stickerDatabaseData) {
            stickers.push(null);
            continue;
        }

        stickers.push(EnhancedWeaponSticker.fromStringAndAPI(stickerDatabaseData, stickerData).toInterface());
    }
    return stickers;
}

export default defineEventHandler(async (event) => {
    const query = getQuery(event);

    Logger.header(`Weapons API request: ${event.method} ${event.req.url}`);

    const steamId = query.steamId as string;
    validateQueryParam(steamId, 'Steam ID');
    verifyUserAccess(steamId, event)

    const type: any = event.context.params?.type;
    validateQueryParam(type, 'Type');

    const loadoutId = query.loadoutId as string;
    validateQueryParam(loadoutId, 'Loadout ID');

    const table = validateWeaponDatabaseTable(type);

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

        const stickerData = getStickerData();
        if (!stickerData) {
            Logger.error('Failed to load stickers data');
            throw createError({
                statusCode: 500,
                message: 'Failed to load stickers data'
            });
        }

        const keychainData = getKeychainData();
        if (!keychainData) {
            Logger.error('Failed to load keychain data');
            throw createError({
                statusCode: 500,
                message: 'Failed to load keychain data'
            });
        }

        const rows = await executeQuery<DBWeapon[]>(
            `SELECT * FROM ${table} WHERE steamid = ? AND loadoutid = ?`,
            [steamId, loadoutId],
            'Failed to fetch weapons'
        );

        // Filter and type-guard the weapons first
        const baseWeaponsWithCategory: IDefaultItem[] = DEFAULT_WEAPONS.filter(weapon => weapon.category === type);
        // Map through weapons and enhance them with skin data
        const enhancedWeapons = baseWeaponsWithCategory.map((baseWeapon: IDefaultItem) => {
            // Find the database entry for this weapon if it exists
            // Find matching skin from skin api using both weapon ID and paint index
            let data: IEnhancedWeapon[] = [];
            const matchingDatabaseResults: DBWeapon[] = rows.filter(
                (weapon: DBWeapon) => weapon.defindex === baseWeapon.weapon_defindex
            );

            /**
             * Iterate through all matching database results for this weapon_defindex
             */
            for (const databaseResult of matchingDatabaseResults) {
                /**
                 * Find matching skin from the skin data using the weapon ID and paint index
                 */
                const skinInfo: APISkin | undefined = findMatchingSkin(baseWeapon, databaseResult, skinData);

                /**
                 * Push the enhanced weapon to the returned data array
                 */
                data.push({
                    name: skinInfo?.name || undefined,
                    defaultName: baseWeapon.defaultName,
                    weapon_name: baseWeapon.weapon_name,
                    weapon_defindex: baseWeapon.weapon_defindex,

                    defaultImage: baseWeapon.defaultImage,
                    image: skinInfo?.image || undefined,

                    minFloat: skinInfo?.min_float || 0.0,
                    maxFloat: skinInfo?.max_float || 1.0,
                    paintIndex: skinInfo?.paint_index || 0,

                    rarity: skinInfo?.rarity || {
                        id: 'default',
                        name: 'Default',
                        color: '#000000'
                    },
                    availableTeams: skinInfo?.team?.id || 'both',
                    category: baseWeapon.category,

                    databaseInfo: {
                        active: databaseResult.active,
                        team: databaseResult.team,
                        defindex: databaseResult.defindex,
                        statTrak: databaseResult.stattrak_enabled || false,
                        statTrakCount: databaseResult.stattrak_count || 0,
                        paintIndex: databaseResult.paintindex || 0,
                        paintWear: databaseResult.paintwear || 0.01,
                        pattern: databaseResult.paintseed || 0,
                        nameTag: databaseResult.nametag || '',
                        stickers: parseStickers(databaseResult, stickerData),
                        keychain: EnhancedWeaponKeychain.fromStringAndAPI(databaseResult.keychain, keychainData)?.toInterface()
                    }
                } as IEnhancedWeapon);
            }

            // If there are any custom skins for this, return them
            if (data.length > 0) {
                return data;
            }

            // If there are no custom skins for this weapon, return the default skin
            return [{
                weapon_defindex: baseWeapon.weapon_defindex,
                weapon_name: baseWeapon.weapon_name,
                category: baseWeapon.category,
                name: baseWeapon.defaultName,
                defaultName: baseWeapon.defaultName,
                image: baseWeapon.defaultImage,
                defaultImage: baseWeapon.defaultImage,
                minFloat: 0,
                maxFloat: 1,
                paintIndex: 0,
                availableTeams: baseWeapon.availableTeams || 'both',
            } as IEnhancedWeapon];
        });

        /**
         * Return the data with additional meta information
         */
        Logger.success(`Fetched ${rows.length} weapons for Steam ID: ${steamId}`);
        return {
            skins: enhancedWeapons,
            meta: {
                rows: rows.length,
                steamId,
                loadoutId,
                type
            }
        };
    } catch (error: any) {
        Logger.error('Failed to fetch weapons: ' + error.message);
        throw createError({
            statusCode: 500,
            message: error.message || 'Failed to fetch weapons'
        });
    }
});