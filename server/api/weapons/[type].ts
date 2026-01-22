import { DEFAULT_WEAPONS } from "~/server/utils/constants"
import { eq, and } from 'drizzle-orm'
import { db } from '~/server/database/client'
import { pistols, rifles, smgs, heavys } from '~/server/database/schema'
import type {
    APISkin,
    IDefaultItem,
    APISticker,
    APIKeychain,
    IMappedDBWeapon,
    IEnhancedWeapon,
    StickerJSON,
    KeychainJSON
} from "~/server/types";
import { EnhancedWeaponKeychain, EnhancedWeaponSticker } from '~/server/types/classes';
import { getSkinsDataAsync, getStickerDataAsync, getKeychainDataAsync } from '~/server/utils/csgoAPI';
import { findMatchingSkin, findSkinByPaintIndex, createDefaultItem } from '~/server/utils/data/skinUtils';
import { validateRequiredRequestData } from '~/server/utils/helpers';
import { Logger } from "~/server/utils/logger";
import { defineEventHandler, createError, getQuery } from "h3";
import { toLoadoutId } from '~/types/core/common';
import {
    createCollectionResponse,
    createResponseMeta,
    withErrorHandling
} from '~/server/utils/api/responseHelpers';

// Type for enhanced weapon sticker
type IEnhancedWeaponSticker = ReturnType<EnhancedWeaponSticker['toInterface']>;

// Map weapon types to Drizzle tables
const weaponTypeToTable = {
    'pistols': pistols,
    'rifles': rifles,
    'smgs': smgs,
    'heavys': heavys,
} as const;

type WeaponType = keyof typeof weaponTypeToTable;

/**
 * Parses sticker JSON data from database and enriches with API data
 * Note: MySQL may return JSON as a string, so we need to parse it
 */
function parseStickers(databaseResult: Record<string, unknown>, stickerData: APISticker[]): (IEnhancedWeaponSticker | null)[] {
    const stickers: (IEnhancedWeaponSticker | null)[] = [];
    for (let i = 0; i < 5; i++) {
        const stickerField = `sticker_${i}` as string;
        let stickerJSON = databaseResult[stickerField] as StickerJSON | string | null;

        // MySQL may return JSON as string, parse if needed
        if (typeof stickerJSON === 'string') {
            try {
                stickerJSON = JSON.parse(stickerJSON) as StickerJSON;
            } catch {
                stickerJSON = null;
            }
        }

        if (!stickerJSON || stickerJSON.id === 0) {
            stickers.push(null);
            continue;
        }

        const enhanced = EnhancedWeaponSticker.fromJSON(stickerJSON, stickerData, i);
        stickers.push(enhanced?.toInterface() ?? null);
    }
    return stickers;
}

/**
 * Parses keychain JSON data from database and enriches with API data
 * Note: MySQL may return JSON as a string, so we need to parse it
 */
function parseKeychain(databaseResult: Record<string, unknown>, keychainData: APIKeychain[]): ReturnType<typeof EnhancedWeaponKeychain.prototype.toInterface> | null {
    let keychainJSON = databaseResult.keychain as KeychainJSON | string | null;

    // MySQL may return JSON as string, parse if needed
    if (typeof keychainJSON === 'string') {
        try {
            keychainJSON = JSON.parse(keychainJSON) as KeychainJSON;
        } catch {
            keychainJSON = null;
        }
    }

    if (!keychainJSON || keychainJSON.id === 0) {
        return null;
    }

    return EnhancedWeaponKeychain.fromJSON(keychainJSON, keychainData)?.toInterface() ?? null;
}

export default defineEventHandler(withErrorHandling(async (event) => {
    const startTime = Date.now();
    const query = getQuery(event);

    Logger.header(`Weapons API request: ${event.method} ${event.req.url}`);

    const steamId = query.steamId as string;
    validateRequiredRequestData(steamId, 'Steam ID');

    const type = event.context.params?.type as string;
    validateRequiredRequestData(type, 'Type');

    const loadoutId = query.loadoutId as string;
    validateRequiredRequestData(loadoutId, 'Loadout ID');

    // Validate weapon type and get corresponding table
    const weaponType = type.toLowerCase() as WeaponType;
    const table = weaponTypeToTable[weaponType];
    if (!table) {
        throw createError({
            statusCode: 400,
            message: `Invalid weapon type: ${type}`
        });
    }

    // Get all available skins data (waits for initialization if needed)
    const skinData = await getSkinsDataAsync();
    if (!skinData) {
        Logger.error('Failed to load skins data');
        throw createError({
            statusCode: 500,
            message: 'Failed to load skins data'
        });
    }

    const stickerData = await getStickerDataAsync();
    if (!stickerData) {
        Logger.error('Failed to load stickers data');
        throw createError({
            statusCode: 500,
            message: 'Failed to load stickers data'
        });
    }

    const keychainData = await getKeychainDataAsync();
    if (!keychainData) {
        Logger.error('Failed to load keychain data');
        throw createError({
            statusCode: 500,
            message: 'Failed to load keychain data'
        });
    }

    // Fetch weapons using Drizzle
    const rows = await db.select()
        .from(table)
        .where(and(
            eq(table.steamid, steamId),
            eq(table.loadoutid, toLoadoutId(loadoutId))
        ));

    // Filter and type-guard the weapons first
    const baseWeaponsWithCategory: IDefaultItem[] = DEFAULT_WEAPONS.filter(weapon => weapon.category === type);

    // Map through weapons and enhance them with skin data
    const enhancedWeapons = baseWeaponsWithCategory.map((baseWeapon: IDefaultItem) => {
        // Find the database entry for this weapon if it exists
        // Find matching skin from skin api using both weapon ID and paint index

        const matchingDatabaseResults = rows.filter(
            (weapon) => weapon.defindex === baseWeapon.weapon_defindex
        );

        if (matchingDatabaseResults.length === 0) {
            return createDefaultItem<IEnhancedWeapon>(baseWeapon);
        }

        const data: IEnhancedWeapon[] = [];
        /**
         * Iterate through all matching database results for this weapon_defindex
         */
        for (const databaseResult of matchingDatabaseResults) {
            // Create a compatible object for findMatchingSkin
            const dbResultForSkin = {
                ...databaseResult,
                id: String(databaseResult.id),
                active: !!databaseResult.active,
                stattrak_enabled: !!databaseResult.stattrak_enabled
            };

            /**
             * Find matching skin from the skin data using the weapon ID and paint index
             */
            const skinInfo: APISkin | undefined = findMatchingSkin(baseWeapon, dbResultForSkin, skinData);

            // Check if we have a custom paint index but no matching skin (invalid paint index for this weapon)
            const hasCustomPaintIndex = databaseResult.paintindex && databaseResult.paintindex > 0;
            const isInvalidPaintIndex = hasCustomPaintIndex && !skinInfo;

            let displayName: string;
            let displayImage: string;
            let paintIndexToUse: string | number;
            let rarityToUse: { id: string; name: string; color: string } | undefined;

            if (isInvalidPaintIndex) {
                // Invalid paint index: show default weapon image but custom name
                displayImage = baseWeapon.defaultImage;
                paintIndexToUse = databaseResult.paintindex;

                // Try to find the skin name by paint index from any weapon
                const paintIndexSkin = findSkinByPaintIndex(databaseResult.paintindex, skinData);
                if (paintIndexSkin) {
                    // Format: "Weapon Name | Skin Name" (e.g., "AK-47 | Dragon Lore")
                    displayName = `${baseWeapon.defaultName} | ${paintIndexSkin.name.replace(/^.*?\|\s*/, '')}`;
                    // Use the rarity from the original weapon that has this paint index
                    rarityToUse = paintIndexSkin.rarity;
                } else {
                    // Fallback if we can't find the skin name
                    displayName = `${baseWeapon.defaultName} | Unknown Skin (${databaseResult.paintindex})`;
                    rarityToUse = undefined;
                }
            } else if (skinInfo) {
                // Valid skin found
                displayImage = skinInfo.image;
                displayName = skinInfo.name;
                paintIndexToUse = skinInfo.paint_index;
                rarityToUse = skinInfo.rarity;
            } else {
                // Default weapon (paint index 0 or no custom skin)
                displayImage = baseWeapon.defaultImage;
                displayName = baseWeapon.defaultName;
                paintIndexToUse = 0;
                rarityToUse = undefined;
            }

            /**
             * Push the enhanced weapon to the returned data array
             */
            data.push({
                defaultName: baseWeapon.defaultName,
                weapon_name: baseWeapon.weapon_name,
                weapon_defindex: baseWeapon.weapon_defindex,
                defaultImage: baseWeapon.defaultImage,
                category: baseWeapon.category,

                image: displayImage,
                name: displayName,
                minFloat: skinInfo?.min_float || 0.0,
                maxFloat: skinInfo?.max_float || 1.0,
                paintIndex: paintIndexToUse,
                rarity: rarityToUse,
                availableTeams: baseWeapon.availableTeams,
                team: databaseResult.team,

                databaseInfo: {
                    active: !!databaseResult.active,
                    team: databaseResult.team,
                    defindex: databaseResult.defindex,
                    statTrak: !!databaseResult.stattrak_enabled,
                    statTrakCount: databaseResult.stattrak_count || 0,
                    paintIndex: databaseResult.paintindex || 0,
                    paintWear: databaseResult.paintwear || 0.01,
                    pattern: databaseResult.paintseed || 0,
                    nameTag: databaseResult.nametag || '',
                    stickers: parseStickers(databaseResult as unknown as Record<string, unknown>, stickerData),
                    keychain: parseKeychain(databaseResult as unknown as Record<string, unknown>, keychainData)
                } as IMappedDBWeapon
            } as IEnhancedWeapon);
        }

        // If there are any custom skins for this, return them
        return data;
    });

    /**
     * Return the data with standardized response format
     */
    Logger.success(`Fetched ${rows.length} weapons for Steam ID: ${steamId}`);

    const meta = createResponseMeta(startTime, {
        steamId,
        loadoutId,
        type,
        databaseRows: rows.length,
        weaponsReturned: enhancedWeapons.length
    });

    return createCollectionResponse(
        enhancedWeapons,
        enhancedWeapons.length,
        meta,
        [type],
        undefined,
        `Successfully fetched ${enhancedWeapons.length} weapons of type '${type}'`
    );
}, 'WEAPONS_FETCH_ERROR'));
