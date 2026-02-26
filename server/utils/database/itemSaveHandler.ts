import { defineEventHandler, createError, readBody, type H3Event } from 'h3'
import { Logger } from '~/server/utils/logger'
import { parseBodyWithSchema, parseQueryWithSchema } from '~/server/utils/validation/zodHelpers'
import { saveItemQuerySchema } from '~/server/utils/validation/querySchemas'
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
            const table = validateWeaponDatabaseTable(query.type!)
            return [table, query.steamId, String(query.loadoutId), body]
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
            return [query.steamId, String(query.loadoutId), body]
        }
    },
    glove: {
        validateFields: (body) => {
            return parseBodyWithSchema(gloveSaveBodySchema, body)
        },
        saveFunction: saveGlove,
        requiresType: false,
        getSaveParams: (body, query) => {
            return [query.steamId, String(query.loadoutId), body]
        }
    }
}

/**
 * Generic save handler for all item types
 * @param itemType - The type of item being saved
 */
export function createSaveHandler(itemType: ItemType) {
    return defineEventHandler(async (event: H3Event) => {
        const config = ITEM_SAVE_CONFIG[itemType]

        Logger.info(`Save start item=${itemType} method=${event.method} path=${event.req.url}`, 'db')

        // Validate query parameters with Zod
        const query = parseQueryWithSchema(saveItemQuerySchema, event)

        // Validate type parameter if required
        if (config.requiresType && !query.type) {
            throw createError({
                statusCode: 400,
                message: 'Validation failed: type: Type is required'
            })
        }

        // Read and validate body
        const body = await readBody(event)
        if (!body) {
            throw createError({
                statusCode: 400,
                message: 'Request body is required'
            })
        }

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
            Logger.error(`Save handler failed item=${itemType} error=${errorMessage}`, 'db')
            throw createError({
                statusCode: 500,
                message: `Failed to save ${itemType}`
            })
        }
    })
}
