import { createError, getQuery, type H3Event } from 'h3'
import type { z } from 'zod'
import { Logger } from '~/server/utils/logger'

/**
 * Parses request body against a Zod schema and throws an H3 error on failure.
 * Converts ZodError issues into a semicolon-separated error message with status 400.
 */
export function parseBodyWithSchema<T extends z.ZodType>(schema: T, body: unknown): z.infer<T> {
    const result = schema.safeParse(body)
    if (!result.success) {
        const details = result.error.issues
            .map((i) => `${i.path.join('.')}: ${i.message}`)
            .join('; ')
        Logger.warn(`Body validation failed details=${details}`, 'validation')
        throw createError({
            statusCode: 400,
            message: `Validation failed: ${details}`,
        })
    }
    return result.data
}

/**
 * Parses query parameters from an H3 event against a Zod schema.
 * Throws an H3 error (400) on validation failure.
 */
export function parseQueryWithSchema<T extends z.ZodType>(schema: T, event: H3Event): z.infer<T> {
    const query = getQuery(event)
    const result = schema.safeParse(query)
    if (!result.success) {
        const details = result.error.issues
            .map((i) => `${i.path.join('.')}: ${i.message}`)
            .join('; ')
        Logger.warn(`Query validation failed details=${details}`, 'validation')
        throw createError({
            statusCode: 400,
            message: `Validation failed: ${details}`,
        })
    }
    return result.data
}
