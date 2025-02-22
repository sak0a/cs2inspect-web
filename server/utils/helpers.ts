import { APIRequestLogger as Logger } from "~/server/utils/logger";
import { createError } from "h3";

export const validateQueryParam = (param: any, paramName: string) => {
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

export const hasStickers = (skin: any) => {
    return skin.stickers && skin.stickers.length > 0
}
export const getStickerNames = (skin: any) => {
    return skin.stickers.map((sticker: any) => sticker.name)
}