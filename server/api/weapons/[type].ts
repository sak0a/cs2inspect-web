import { DEFAULT_WEAPONS } from "~/server/utils/constants"
import { APIRequestLogger as Logger } from "~/server/utils/logger";
import { executeQuery } from "~/server/database/database";
import { defineEventHandler } from "h3";

const createMappedDBWeapon = (databaseResult: DBWeapon): IMappedDBWeapon => {
    return {
        active: databaseResult.active,
        team: databaseResult.team,
        defindex: databaseResult.defindex,
        statTrak: databaseResult.stattrak_enabled,
        statTrakCount: databaseResult.stattrak_count,
        paintIndex: databaseResult.paintindex,
        paintWear: parseFloat(databaseResult.paintwear),
        pattern: parseInt(databaseResult.paintseed),
        nameTag: databaseResult.nametag,
        stickers: [
            EnhancedWeaponSticker.fromString(databaseResult.sticker_0).toInterface() || null,
            EnhancedWeaponSticker.fromString(databaseResult.sticker_1).toInterface() || null,
            EnhancedWeaponSticker.fromString(databaseResult.sticker_2).toInterface() || null,
            EnhancedWeaponSticker.fromString(databaseResult.sticker_3).toInterface() || null,
            EnhancedWeaponSticker.fromString(databaseResult.sticker_4).toInterface() || null,
        ],
        keychain: EnhancedWeaponKeychain.fromString(databaseResult.keychain).toInterface() || null
    }
}

const createEnhancedWeapon = (defaultWeapon: IDefaultItem, databaseWeapon: DBWeapon, skin: APISkin): IEnhancedItem => {
    return {
        defaultName: defaultWeapon.defaultName,
        weapon_name: defaultWeapon.weapon_name,
        weapon_defindex: defaultWeapon.weapon_defindex,
        defaultImage: defaultWeapon.defaultImage,
        category: defaultWeapon.category,

        image: skin.image || undefined,
        name: skin.name || undefined,
        minFloat: skin.min_float || 0.0,
        maxFloat: skin.max_float || 1.0,
        paintIndex: skin.paint_index || 0,
        rarity: skin.rarity,
        databaseInfo: createMappedDBWeapon(databaseWeapon)
    } as IEnhancedItem;
}

export default defineEventHandler(async (event) => {
    const query = getQuery(event);

    Logger.header(`Weapons API request: ${event.method} ${event.req.url}`);

    const steamId = query.steamId as string;
    validateRequiredRequestData(steamId, 'Steam ID');

    const type = event.context.params?.type as string;
    validateRequiredRequestData(type, 'Type');

    const loadoutId = query.loadoutId as string;
    validateRequiredRequestData(loadoutId, 'Loadout ID');

    const table = validateWeaponDatabaseTable(type);

    try {
        // Get all available skins data
        const skinData = getSkinsData();
        const stickerData = getStickerData();
        const keychainData = getKeychainData();

        const rows = await executeQuery<DBWeapon[]>(
            `SELECT * FROM ${table} WHERE steamid = ? AND loadoutid = ?`,
            [steamId, loadoutId],
            'Failed to fetch weapons'
        );

        const defaultWeapons: IDefaultItem[] = DEFAULT_WEAPONS.filter(weapon => weapon.category === type);

        const fetchedWeapons: IEnhancedItem[][] = defaultWeapons.map(defaultWeapon => {
            let weaponSkins: IEnhancedItem[] = []

            const databaseResults: DBWeapon[] = rows.filter(
                weapon => weapon.defindex === defaultWeapon.weapon_defindex
            );

            for (const databaseWeapon of databaseResults) {
                const matchingSkin = findMatchingSkin(
                    defaultWeapon,
                    databaseWeapon,
                    skinData
                )
                weaponSkins.push(
                    createEnhancedWeapon(
                        defaultWeapon,
                        databaseWeapon,
                        matchingSkin
                    )
                )
            }

            if (weaponSkins.length > 0) return weaponSkins;

            return createDefaultEnhancedWeapon(defaultWeapon);
        });

        Logger.success(`Fetched ${fetchedWeapons.length} weapons for Steam ID: ${steamId}`);
        return {
            skins: fetchedWeapons,
            meta: {
                rows: fetchedWeapons.length,
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