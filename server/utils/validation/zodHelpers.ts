import { createError } from 'h3'
import type { z } from 'zod'
import { Logger } from '~/server/utils/logger'

/**
 * Parses request body against a Zod schema and throws an H3 error on failure.
 * Converts ZodError issues into a semicolon-separated error message with status 400.
 */
export function parseBodyWithSchema<T extends z.ZodType>(schema: T, body: unknown): z.infer<T> {
    const result = schema.safeParse(body)
    if (!result.success) {
        const details = result.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join('; ')
        Logger.error(`Validation failed: ${details}`)
        throw createError({
            statusCode: 400,
            message: `Validation failed: ${details}`
        })
    }
    return result.data
}
