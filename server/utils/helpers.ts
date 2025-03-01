import { APIRequestLogger as Logger } from "~/server/utils/logger";
import { createError } from "h3";

export const validateRequiredRequestData = (param: any, paramName: string) => {
    if (!param) {
        Logger.error(`${paramName} is required`)
        throw createError({
            statusCode: 400,
            message: `${paramName} is required`
        })
    }
}

export const verifyUserAccess = (steamId: string, event: any) => {
    const auth = event.context.auth
    if (!auth || auth.steamId !== steamId) {
        Logger.error('Unauthorized access')
        throw createError({
            statusCode: 401,
            message: 'Unauthorized access'
        })
    }
    Logger.info(`User access verified for Steam ID: ${steamId}`)
}

export const validateWeaponDatabaseTable = (type: string) => {
    const tableMap: Record<string, string> = {
        smgs: 'wp_player_smgs',
        rifles: 'wp_player_rifles',
        heavys: 'wp_player_heavys',
        pistols: 'wp_player_pistols',
    };

    if (!tableMap[type]) {
        Logger.error('Invalid weapon type')
        throw createError({
            statusCode: 400,
            message: 'Invalid weapon type'
        })
    }
    return tableMap[type]
}

/**
 * Generic utility function to find a matching skin for either weapon or knife
 * @param baseItem Base weapon or knife item
 * @param databaseItem Database weapon or knife record
 * @param skinsData Array of available skins
 * @returns Matching skin or undefined if no match found
 */
export function findMatchingSkin<T extends { weapon_name: string }, U extends { paintindex: number | string }>(
    baseItem: T,
    databaseItem: U | undefined,
    skinsData: APISkin[]
): APISkin | undefined {
    if (!databaseItem) return undefined;

    return skinsData.find(skin =>
        skin.weapon?.id === baseItem.weapon_name &&
        skin.paint_index === databaseItem.paintindex.toString()
    );
}

/**
 * Creates an enhanced weapon object from either a base weapon or knife
 * @param baseItem Base weapon or knife item
 * @param isKnife Boolean flag to indicate if the item is a knife
 * @returns An array containing a single IEnhancedWeapon object
 */
export function createDefaultEnhancedWeapon<T extends {
    weapon_defindex: number | string,
    weapon_name: string,
    defaultName: string,
    defaultImage: string,
    paintIndex?: number,
    category?: string,
    availableTeams?: string
}>(baseItem: T, isKnife: boolean = false): IEnhancedItem[] {
    return [{
        weapon_defindex: baseItem.weapon_defindex,
        weapon_name: baseItem.weapon_name,
        name: baseItem.defaultName,
        defaultName: baseItem.defaultName,
        image: baseItem.defaultImage,
        defaultImage: baseItem.defaultImage,
        category: isKnife ? 'knife' : (baseItem.category || 'weapon'),
        minFloat: 0,
        maxFloat: 1,
        paintIndex: isKnife ? (baseItem.paintIndex || 0) : 0,
        availableTeams: isKnife ? 'both' : (baseItem.availableTeams || 'both')
    } as IEnhancedItem];
}

export const hasStickers = (skin: any) => {
    return skin.stickers && skin.stickers.length > 0
}
export const getStickerNames = (skin: any) => {
    return skin.stickers.map((sticker: any) => sticker.name)
}