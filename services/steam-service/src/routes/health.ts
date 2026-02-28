import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { steamClientService } from '../services/steamClient.js'
import { requestQueue } from '../services/queue.js'
import type { HealthCheck } from '../types/index.js'

export async function healthRoutes(fastify: FastifyInstance) {
    // General health check
    fastify.get('/health', async (request: FastifyRequest, reply: FastifyReply) => {
        const steamStatus = steamClientService.getStatus()
        const queueStats = requestQueue.getStats()

        const checks: HealthCheck['checks'] = {
            steam_client: {
                status: steamStatus.available ? 'ok' : 'fail',
                message: steamStatus.message,
            },
            queue: {
                status: queueStats.pending < queueStats.maxSize ? 'ok' : 'degraded',
                message: `${queueStats.pending} pending, ${queueStats.processing} processing`,
            },
        }

        const overallStatus = Object.values(checks).every((check) => check.status === 'ok')
            ? 'ok'
            : Object.values(checks).some((check) => check.status === 'fail')
              ? 'fail'
              : 'degraded'

        const response: HealthCheck = {
            status: overallStatus,
            ready: overallStatus === 'ok',
            checks,
        }

        reply.code(overallStatus === 'ok' ? 200 : 503)
        return response
    })

    // Readiness probe
    fastify.get('/health/ready', async (request: FastifyRequest, reply: FastifyReply) => {
        const steamStatus = steamClientService.getStatus()
        const queueStats = requestQueue.getStats()

        const checks: HealthCheck['checks'] = {
            steam_client: {
                status: steamStatus.available ? 'ok' : 'fail',
                message: steamStatus.message,
            },
            queue: {
                status: queueStats.pending < queueStats.maxSize ? 'ok' : 'degraded',
            },
        }

        const ready = steamStatus.available && queueStats.pending < queueStats.maxSize

        const response: HealthCheck = {
            status: ready ? 'ok' : 'fail',
            ready,
            checks,
        }

        reply.code(ready ? 200 : 503)
        return response
    })

    // Liveness probe
    fastify.get('/health/live', async (_request: FastifyRequest, _reply: FastifyReply) => {
        return {
            status: 'ok',
            alive: true,
            timestamp: new Date().toISOString(),
        }
    })
}
