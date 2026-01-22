import { createError } from 'h3'
import { Logger } from '~/server/utils/logger'
import { validateRequiredRequestData } from '~/server/utils/helpers'

/**
 * Validates team value (must be 1 or 2)
 */
export function validateTeam(team: unknown): asserts team is 1 | 2 {
    validateRequiredRequestData(team, 'Team')
    if (team !== 1 && team !== 2) {
        Logger.error('Invalid team')
        throw createError({
            statusCode: 400,
            message: `Invalid team: ${team}`
        })
    }
}

/**
 * Validates StatTrak fields
 */
export function validateStatTrak(body: Record<string, unknown>) {
    if (body.statTrak !== true && body.statTrak !== false) {
        Logger.error('Invalid StatTrak')
        throw createError({
            statusCode: 400,
            message: 'Invalid StatTrak'
        })
    }

    validateRequiredRequestData(body.statTrakCount, 'StatTrak Count', true)
    if ((body.statTrakCount as number) < 0) {
        Logger.error('Invalid StatTrak Count')
        throw createError({
            statusCode: 400,
            message: `Invalid StatTrak Count: ${body.statTrakCount}`
        })
    }
}

/**
 * Validates name tag (max 32 characters)
 */
export function validateNameTag(nameTag: unknown) {
    if (nameTag && (nameTag as string).length > 32) {
        Logger.error('Invalid Name Tag')
        throw createError({
            statusCode: 400,
            message: 'Invalid Name Tag'
        })
    }
}

/**
 * Validates paint index (must be >= 0)
 */
export function validatePaintIndex(paintIndex: unknown) {
    validateRequiredRequestData(paintIndex, 'Paint Index')
    if ((paintIndex as number) < 0) {
        Logger.error('Invalid paint index')
        throw createError({
            statusCode: 400,
            message: `Invalid paint index: ${paintIndex}`
        })
    }
}

/**
 * Validates paint seed/pattern (must be >= 0)
 */
export function validatePaintSeed(pattern: unknown) {
    validateRequiredRequestData(pattern, 'Paint Seed', true)
    if ((pattern as number) < 0) {
        Logger.error('Invalid paint seed')
        throw createError({
            statusCode: 400,
            message: `Invalid paint seed: ${pattern}`
        })
    }
}

/**
 * Validates paint wear (must be between 0 and 1)
 */
export function validatePaintWear(wear: unknown) {
    validateRequiredRequestData(wear, 'Paint Wear', true)
    if ((wear as number) < 0 || (wear as number) > 1) {
        Logger.error('Invalid paint wear')
        throw createError({
            statusCode: 400,
            message: `Invalid paint wear: ${wear}`
        })
    }
}

/**
 * Validates active flag (must be true or false)
 */
export function validateActive(active: unknown) {
    if (active !== true && active !== false) {
        Logger.error('Invalid Active')
        throw createError({
            statusCode: 400,
            message: 'Invalid Active'
        })
    }
}
