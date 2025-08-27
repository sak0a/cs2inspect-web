import { APIRequestLogger as Logger } from "~/server/utils/logger";
import { createError } from "h3";
import {IEnhancedKnife, IEnhancedWeapon} from "~/server/utils/interfaces";

export const validateRequiredRequestData = (param: any, paramName: string, allowZero = false) => {
    if (allowZero && param === 0) return
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

// Re-export from skinUtils for backward compatibility
export { findMatchingSkin } from './skinUtils';

export function createDefaultEnhancedKnife<T>(baseItem: IDefaultItem): T[] {
    return [{
        weapon_defindex: baseItem.weapon_defindex,
        weapon_name: baseItem.weapon_name,
        name: baseItem.defaultName,
        defaultName: baseItem.defaultName,
        image: baseItem.defaultImage,
        defaultImage: baseItem.defaultImage,
        category: 'knife',
        minFloat: 0,
        maxFloat: 1,
        paintIndex: 0,
        availableTeams: 'both'
    } as T];
}
// Re-export from skinUtils for backward compatibility
export { createDefaultItem, hasStickers, getStickerNames } from './skinUtils';