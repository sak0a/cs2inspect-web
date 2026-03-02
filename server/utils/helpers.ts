import { Logger } from './logger'
import { createError, type H3Event } from 'h3'
import type { IDefaultItem } from '../types'

export const validateRequiredRequestData = (
  param: unknown,
  paramName: string,
  allowZero = false
) => {
  if (allowZero && param === 0) return
  if (!param) {
    Logger.warn(`Required param missing name=${paramName}`, 'validation')
    throw createError({
      statusCode: 400,
      message: `${paramName} is required`,
    })
  }
}

export const verifyUserAccess = (steamId: string, event: H3Event) => {
  const auth = (event.context as { auth?: { steamId?: string } })?.auth
  if (!auth || auth.steamId !== steamId) {
    Logger.warn(`Access denied steamId=${steamId}`, 'auth')
    throw createError({
      statusCode: 401,
      message: 'Unauthorized access',
    })
  }
  Logger.debug(`Access granted steamId=${steamId}`, 'auth')
}

export function createDefaultEnhancedKnife<T>(baseItem: IDefaultItem): T[] {
  return [
    {
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
      availableTeams: 'both',
    } as T,
  ]
}
// Re-export from skinUtils for backward compatibility
