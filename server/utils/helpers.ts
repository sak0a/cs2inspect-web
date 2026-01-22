import { Logger } from "~/server/utils/logger";
import { createError, type H3Event } from "h3";

export const validateRequiredRequestData = (param: unknown, paramName: string, allowZero = false) => {
    if (allowZero && param === 0) return
    if (!param) {
        Logger.error(`${paramName} is required`)
        throw createError({
            statusCode: 400,
            message: `${paramName} is required`
        })
    }
}

export const verifyUserAccess = (steamId: string, event: H3Event) => {
    const auth = (event.context as { auth?: { steamId?: string } })?.auth
    if (!auth || auth.steamId !== steamId) {
        Logger.error('Unauthorized access')
        throw createError({
            statusCode: 401,
            message: 'Unauthorized access'
        })
    }
    Logger.info(`User access verified for Steam ID: ${steamId}`)
}

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