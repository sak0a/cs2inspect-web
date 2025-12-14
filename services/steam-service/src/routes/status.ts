import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { steamClientService } from '../services/steamClient.js';
import { requestQueue } from '../services/queue.js';
import type { ServiceStatus } from '../types/index.js';

const serviceStartTime = Date.now();
const SERVICE_VERSION = '1.0.0';

export async function statusRoutes(fastify: FastifyInstance) {
  // General status
  fastify.get('/status', async (request: FastifyRequest, reply: FastifyReply) => {
    const steamStatus = steamClientService.getStatus();
    const queueStats = requestQueue.getStats();
    const serverUptime = Date.now() - serviceStartTime;

    const response: ServiceStatus = {
      steamClient: {
        available: steamStatus.available,
        status: steamStatus.status,
        uptime: steamStatus.available ? serverUptime : undefined,
      },
      queue: {
        pending: queueStats.pending,
        processing: queueStats.processing,
        maxSize: queueStats.maxSize,
      },
      server: {
        uptime: serverUptime,
        version: SERVICE_VERSION,
      },
    };

    return reply.send(response);
  });

  // Steam client status
  fastify.get('/status/steam-client', async (request: FastifyRequest, reply: FastifyReply) => {
    const steamStatus = steamClientService.getStatus();
    return reply.send(steamStatus);
  });

  // Queue status
  fastify.get('/status/queue', async (request: FastifyRequest, reply: FastifyReply) => {
    const queueStats = requestQueue.getStats();
    return reply.send(queueStats);
  });
}
