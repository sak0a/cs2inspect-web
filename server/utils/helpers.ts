import {APIRequestLogger as Logger} from "~/server/utils/logger";
import {createError} from "h3";

export const verifyUserAccess = (event: any, steamId: string) => {
    // Get the auth data from the event context (set by auth middleware)
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

export const validateSteamId = (steamId: string) => {
    if (!steamId) {
        Logger.error('Steam ID is required')
        throw createError({
            statusCode: 400,
            message: 'Steam ID is required'
        })
    }
}

export const hasStickers = (skin: any) => {
    return skin.stickers && skin.stickers.length > 0
}
export const getStickerNames = (skin: any) => {
    return skin.stickers.map((sticker: any) => sticker.name)
}