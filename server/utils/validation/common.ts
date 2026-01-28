import { createError } from 'h3'
import { Logger } from '~/server/utils/logger'
import { validateRequiredRequestData } from '~/server/utils/helpers'
import {
    isValidTeamId,
    isValidFloatValue,
    isValidStatTrakCount,
    isValidNameTag,
    isValidDefindex,
    type TeamId
} from '~/types/core/branded'

/**
 * Validates team value (must be 1 or 2)
 *
 * Uses branded type guard isValidTeamId() for validation
 */
export function validateTeam(team: unknown): asserts team is TeamId {
    validateRequiredRequestData(team, 'Team')
    if (!isValidTeamId(team)) {
        Logger.error('Invalid team')
        throw createError({
            statusCode: 400,
            message: `Invalid team: ${team}. Must be 1 (Terrorist) or 2 (Counter-Terrorist)`
        })
    }
}

/**
 * Validates StatTrak fields (uses database column names: stattrak_enabled, stattrak_count)
 *
 * Uses branded type guard isValidStatTrakCount() for count validation
 */
export function validateStatTrak(body: Record<string, unknown>) {
    if (body.stattrak_enabled !== true && body.stattrak_enabled !== false) {
        Logger.error('Invalid StatTrak')
        throw createError({
            statusCode: 400,
            message: 'Invalid StatTrak: stattrak_enabled must be true or false'
        })
    }

    validateRequiredRequestData(body.stattrak_count, 'StatTrak Count', true)
    if (!isValidStatTrakCount(body.stattrak_count)) {
        Logger.error('Invalid StatTrak Count')
        throw createError({
            statusCode: 400,
            message: `Invalid StatTrak Count: ${body.stattrak_count}. Must be a non-negative integer`
        })
    }
}

/**
 * Validates name tag (max 32 characters)
 *
 * Uses branded type guard isValidNameTag() for validation
 */
export function validateNameTag(nameTag: unknown) {
    // Empty/null/undefined name tags are valid (means no name tag)
    if (nameTag === null || nameTag === undefined || nameTag === '') {
        return
    }
    if (typeof nameTag !== 'string' || !isValidNameTag(nameTag)) {
        Logger.error('Invalid Name Tag')
        throw createError({
            statusCode: 400,
            message: 'Invalid Name Tag: must be a string with max 32 characters'
        })
    }
}

/**
 * Validates paint index (must be non-negative integer)
 *
 * Uses branded type guard isValidDefindex() (same constraints as PaintIndex)
 */
export function validatePaintIndex(paintIndex: unknown) {
    validateRequiredRequestData(paintIndex, 'Paint Index', true)
    if (!isValidDefindex(paintIndex)) {
        Logger.error('Invalid paint index')
        throw createError({
            statusCode: 400,
            message: `Invalid paint index: ${paintIndex}. Must be a non-negative integer`
        })
    }
}

/**
 * Validates paint seed/pattern (must be non-negative integer)
 *
 * Uses branded type guard isValidDefindex() (same constraints as PaintSeed)
 */
export function validatePaintSeed(pattern: unknown) {
    validateRequiredRequestData(pattern, 'Paint Seed', true)
    if (!isValidDefindex(pattern)) {
        Logger.error('Invalid paint seed')
        throw createError({
            statusCode: 400,
            message: `Invalid paint seed: ${pattern}. Must be a non-negative integer`
        })
    }
}

/**
 * Validates paint wear (must be between 0 and 1)
 *
 * Uses branded type guard isValidFloatValue() for validation
 */
export function validatePaintWear(wear: unknown) {
    validateRequiredRequestData(wear, 'Paint Wear', true)
    if (!isValidFloatValue(wear)) {
        Logger.error('Invalid paint wear')
        throw createError({
            statusCode: 400,
            message: `Invalid paint wear: ${wear}. Must be a number between 0 and 1`
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
