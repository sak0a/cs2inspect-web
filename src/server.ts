import Fastify from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import { config } from './utils/config.js';
import { logger } from './utils/logger.js';
import { authenticateRequest } from './middleware/auth.js';
import { errorHandler } from './middleware/errorHandler.js';
import { inspectRoutes } from './routes/inspect.js';
import { healthRoutes } from './routes/health.js';
import { statusRoutes } from './routes/status.js';
import { steamClientService } from './services/steamClient.js';

export async function createServer() {
  const fastify = Fastify({
    logger: config.logging.level === 'debug',
    requestIdLogLabel: 'reqId',
    disableRequestLogging: !config.logging.apiRequests,
  });

  // Error handler
  fastify.setErrorHandler(errorHandler);

  // CORS
  await fastify.register(cors, {
    origin: config.cors.origins,
    credentials: true,
  });

  // Rate limiting
  await fastify.register(rateLimit, {
    max: config.rateLimit.max,
    timeWindow: config.rateLimit.window,
    errorResponseBuilder: (request, context) => {
      return {
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: `Rate limit exceeded. Maximum ${context.max} requests per ${config.rateLimit.window}ms`,
        },
      };
    },
  });

  // Health routes (no authentication required)
  await fastify.register(healthRoutes);

  // Status routes (no authentication required)
  await fastify.register(statusRoutes);

  // Inspect routes (require authentication)
  await fastify.register(async (fastify) => {
    // Add authentication hook for all inspect routes
    fastify.addHook('onRequest', authenticateRequest);
    await fastify.register(inspectRoutes, { prefix: '/api/inspect' });
  });

  // Root endpoint
  fastify.get('/', async (request, reply) => {
    return reply.send({
      service: 'Steam Service',
      version: '1.0.0',
      status: 'running',
      endpoints: {
        health: '/api/health',
        status: '/api/status',
        inspect: '/api/inspect/*',
      },
    });
  });

  return fastify;
}

export async function startServer() {
  try {
    const server = await createServer();
    
    // Initialize Steam client in the background (only in production/startup, not in tests)
    // Don't await - let it initialize in background so service can start immediately
    if (process.env.NODE_ENV !== 'test') {
      steamClientService.initialize().catch((error) => {
        logger.error('Failed to initialize Steam client on startup:', error);
        logger.warn('Service will continue without Steam client. Unmasked URL inspection will not be available.');
      });
    }

    await server.listen({
      port: config.server.port,
      host: config.server.host,
    });

    logger.info(`Steam service started on http://${config.server.host}:${config.server.port}`);
    logger.info(`Environment: ${config.server.nodeEnv}`);

    // Graceful shutdown
    const shutdown = async (signal: string) => {
      logger.info(`Received ${signal}, shutting down gracefully...`);
      await server.close();
      process.exit(0);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}
