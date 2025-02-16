import { DEFAULT_WEAPONS } from "~/server/utils/constants"
import { DBWeapon, APISkin, DefaultWeapon, EnhancedWeaponResponse } from "~/server/utils/interfaces";
import { getSkinsData, getStickerData } from '~/server/utils/csgoAPI';
import { verifyUserAccess, validateWeaponDatabaseTable } from "~/server/utils/helpers";
import { APIRequestLogger as Logger } from "~/server/utils/logger";
import { executeQuery } from "~/server/database/database";

function findMatchingSkin(baseWeapon: DefaultWeapon, databaseWeapon: DBWeapon | undefined, skinsData: APISkin[]): APISkin | undefined {
    if (!databaseWeapon) return undefined;

    return skinsData.find(skin =>
        skin.weapon?.id === baseWeapon.weapon_name &&
        skin.paint_index === databaseWeapon?.paintindex.toString()
    );
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

        const databaseResponse = rows.map((row: DBWeapon) => {
            return {
                id: row.id,
                steamid: row.steamid,
                loadoutid: row.loadoutid,
                active: row.active,
                team: row.team,
                defindex: row.defindex,
                paintindex: row.paintindex.toString(),
                paintseed: row.paintseed,
                paintwear: row.paintwear,
                stattrak_enabled: row.stattrak_enabled,
                stattrak_count: row.stattrak_count,
                nametag: row.nametag,
                sticker_0: row.sticker_0,
                sticker_1: row.sticker_1,
                sticker_2: row.sticker_2,
                sticker_3: row.sticker_3,
                sticker_4: row.sticker_4,
                keychain: row.keychain,
                created_at: row.created_at,
                updated_at: row.updated_at
            };
        })

        // Filter and type-guard the weapons first
        const baseWeaponsWithCategory: any = DEFAULT_WEAPONS.filter(weapon => weapon.category === type);
        // Map through weapons and enhance them with skin data
        const enhancedWeapons = baseWeaponsWithCategory.map((baseWeapon: EnhancedWeaponResponse) => {
            // Find the database entry for this weapon if it exists
            // Find matching skin from skin api using both weapon ID and paint index
            let data: EnhancedWeaponResponse[] = [];
            const matchingDatabaseResults: any[] = databaseResponse.filter(
                (weapon: any) => weapon.defindex === baseWeapon.weapon_defindex
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
                 * Stickers are stored in the database as a string with the following format:
                 * "0;0;0;0;0;0",
                 * We need to split this string into an array of numbers to represent the DBSticker interface
                 */
                const stickers: any[] = [];
                for (let i = 0; i < 5; i++) {
                    if (databaseResult[`sticker_${i}`].split(';')[0] === '0' || databaseResult[`sticker_${i}`] === null) {
                        stickers.push(null);
                        continue;
                    }
                    const stickerInfo: any  = stickerData?.find(sticker => sticker.id.toString() === ("sticker-" + databaseResult[`sticker_${i}`].split(';')[0]));
                    stickers.push({
                        id: parseInt(databaseResult[`sticker_${i}`].split(';')[0]),
                        x: parseInt(databaseResult[`sticker_${i}`].split(';')[1]),
                        y: parseInt(databaseResult[`sticker_${i}`].split(';')[2]),
                        wear: parseFloat(databaseResult[`sticker_${i}`].split(';')[3]),
                        scale: parseFloat(databaseResult[`sticker_${i}`].split(';')[4]),
                        rotation: parseInt(databaseResult[`sticker_${i}`].split(';')[5]),
                        api: {
                            name: stickerInfo?.name || '',
                            image: stickerInfo?.image || '',
                            type: stickerInfo?.type || '',
                            effect: stickerInfo?.effect || '',
                            tournament_event: stickerInfo?.tournament_event || '',
                            tournament_team: stickerInfo?.tournament_team || '',
                            rarity: stickerInfo?.rarity || {
                                id: 'default',
                                name: 'Default',
                                color: '#000000'
                            }
                        }
                    });
                }

                /**
                 * Keychain is stored in the database as a string with the following format:
                 * "0;0;0;0;0",
                 * We need to split this string into an array of numbers to represent the DBKeychain interface
                 */
                let keychain: any = databaseResult.keychain === null ? null : databaseResult.keychain;
                const keychainInfo = keychainData?.find((keychain: any) => keychain.id === ("keychain-" + databaseResult.keychain.split(';')[0]));
                keychain = keychain.split(';')[0] === '0' ? null : {
                    id: parseInt(keychain.split(';')[0]),
                    x: parseInt(keychain.split(';')[1]),
                    y: parseInt(keychain.split(';')[2]),
                    z: parseInt(keychain.split(';')[3]),
                    seed: parseInt(keychain.split(';')[4]),
                    api: {
                        name: keychainInfo?.name || '',
                        image: keychainInfo?.image || '',
                        rarity: keychainInfo?.rarity || {
                            id: 'default',
                            name: 'Default',
                            color: '#000000'
                        }
                    }
                };

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
                        stickers,
                        keychain
                    }
                } as EnhancedWeaponResponse);
            }

            // If there are any custom skins for this, return them
            if (data.length > 0) {
                return data;
            }

            // If there are no custom skins for this weapon, return the default skin
            const defaultSkinInfo = skinData.find(skin =>
                skin.weapon?.id === baseWeapon.weapon_name
            )
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
                availableTeams: defaultSkinInfo?.team?.id || 'both',
            } as EnhancedWeaponResponse];
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