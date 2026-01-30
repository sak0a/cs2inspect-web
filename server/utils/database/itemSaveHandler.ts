import { defineEventHandler, createError, getQuery, readBody, type H3Event } from 'h3'
import { Logger } from '~/server/utils/logger'
import { validateRequiredRequestData } from '~/server/utils/helpers'
import { parseBodyWithSchema } from '~/server/utils/validation/zodHelpers'
import {
    weaponSaveBodySchema,
    knifeSaveBodySchema,
    gloveSaveBodySchema,
    resetRequestSchema
} from '~/server/database/schema/zod'
import {
    saveWeapon,
    saveKnife,
    saveGlove,
    validateWeaponDatabaseTable,
    validateWeaponDefindex,
    validateKnifeDefindex
} from '~/server/utils/database/saveHelpers'
import type { ItemType, SaveRequestConfig } from '~/server/types/save'

/**
 * Configuration for different item types
 */
const ITEM_SAVE_CONFIG: Record<ItemType, SaveRequestConfig> = {
    weapon: {
        validateFields: (body) => {
            const parsed = parseBodyWithSchema(weaponSaveBodySchema, body)
            validateWeaponDefindex(parsed.defindex)
            return parsed
        },
        saveFunction: saveWeapon,
        requiresType: true,
        getSaveParams: (body, query) => {
            const type = query.type as string
            validateRequiredRequestData(type, 'Type')
            const table = validateWeaponDatabaseTable(type)
            return [table, query.steamId as string, query.loadoutId as string, body]
        }
    },
    knife: {
        validateFields: (body) => {
            const parsed = parseBodyWithSchema(knifeSaveBodySchema, body)
            validateKnifeDefindex(parsed.defindex)
            return parsed
        },
        saveFunction: saveKnife,
        requiresType: false,
        getSaveParams: (body, query) => {
            return [query.steamId as string, query.loadoutId as string, body]
        }
    },
    glove: {
        validateFields: (body) => {
            return parseBodyWithSchema(gloveSaveBodySchema, body)
        },
        saveFunction: saveGlove,
        requiresType: false,
        getSaveParams: (body, query) => {
            return [query.steamId as string, query.loadoutId as string, body]
        }
    }
}

/**
 * Generic save handler for all item types
 * @param itemType - The type of item being saved
 */
export function createSaveHandler(itemType: ItemType) {
    return defineEventHandler(async (event: H3Event) => {
        const query = getQuery(event)
        const config = ITEM_SAVE_CONFIG[itemType]

        Logger.header(`${event.method} ${event.req.url}`)

        // Validate required query parameters
        const steamId = query.steamId as string
        validateRequiredRequestData(steamId, 'Steam ID')

        const loadoutId = query.loadoutId as string
        validateRequiredRequestData(loadoutId, 'Loadout ID')

        // Validate type parameter if required
        if (config.requiresType) {
            validateRequiredRequestData(query.type, 'Type')
        }

        // Read and validate body
        const body = await readBody(event)
        validateRequiredRequestData(body, 'Body')

        try {
            // Handle reset case
            if (body.reset) {
                parseBodyWithSchema(resetRequestSchema, body)
                const saveParams = config.getSaveParams({ ...body, reset: true }, query)
                return await config.saveFunction(...saveParams)
            }

            // Validate all fields for non-reset cases
            config.validateFields(body)

            // Get save parameters and execute save
            const saveParams = config.getSaveParams(body, query)
            return await config.saveFunction(...saveParams)
        } catch (error: unknown) {
            // Re-throw H3 errors (including validation errors) as-is
            if (error && typeof error === 'object' && 'statusCode' in error) {
                throw error
            }
            const errorMessage = error instanceof Error ? error.message : `Failed to save ${itemType}`
            Logger.error(`Failed to save ${itemType}: ${errorMessage}`)
            throw createError({
                statusCode: 500,
                message: `Failed to save ${itemType}`
            })
        }
    })
}
