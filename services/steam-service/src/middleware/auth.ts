import type { FastifyRequest, FastifyReply } from 'fastify'
import { config } from '../utils/config.js'
import { logger } from '../utils/logger.js'

export async function authenticateRequest(
    request: FastifyRequest,
    reply: FastifyReply
): Promise<void> {
    const apiKey = request.headers['x-api-key'] as string | undefined

    if (!apiKey) {
        logger.warn(`Unauthorized request from ${request.ip}: Missing API key`)
        reply.code(401).send({
            success: false,
            error: {
                code: 'MISSING_API_KEY',
                message: 'API key is required. Provide it in the X-API-Key header.',
            },
        })
        return
    }

    if (!config.api.keys.includes(apiKey)) {
        logger.warn(`Unauthorized request from ${request.ip}: Invalid API key`)
        reply.code(401).send({
            success: false,
            error: {
                code: 'INVALID_API_KEY',
                message: 'Invalid API key provided.',
            },
        })
        return
    }

    // Attach API key to request for logging/analytics
    ;(request as FastifyRequest & { apiKey: string }).apiKey = apiKey
}
