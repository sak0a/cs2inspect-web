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

  const maskApiKey = (key?: string | string[]): string => {
    const v = Array.isArray(key) ? key[0] : key;
    if (!v) return '-';
    if (v.length <= 8) return `${v.slice(0, 2)}***${v.slice(-2)}`;
    return `${v.slice(0, 4)}***${v.slice(-4)}`;
  };

  const getClientIp = (request: { headers: Record<string, unknown>; ip?: string; socket?: { remoteAddress?: string | null } }): string => {
    const xff = request.headers['x-forwarded-for'];
    if (typeof xff === 'string' && xff.length > 0) return xff.split(',')[0].trim();
    const xRealIp = request.headers['x-real-ip'];
    if (typeof xRealIp === 'string' && xRealIp.length > 0) return xRealIp.trim();
    return request.ip || request.socket?.remoteAddress || '-';
  };

  // Always log health/status requests so we can verify callers
  fastify.addHook('onRequest', async (request) => {
    if (
      request.url.startsWith('/api/health') ||
      request.url.startsWith('/api/status') ||
      request.url.startsWith('/health') ||
      request.url.startsWith('/status')
    ) {
      const apiKeyMasked = maskApiKey(request.headers['x-api-key'] as string | string[] | undefined);
      const clientIp = getClientIp(request as unknown as { headers: Record<string, unknown>; ip?: string; socket?: { remoteAddress?: string | null } });
      logger.info(`[REQ] ${request.method} ${request.url} ip=${clientIp} apiKey=${apiKeyMasked}`);
    }
  });

  fastify.addHook('onResponse', async (request, reply) => {
    if (
      request.url.startsWith('/api/health') ||
      request.url.startsWith('/api/status') ||
      request.url.startsWith('/health') ||
      request.url.startsWith('/status')
    ) {
      logger.info(`[RES] ${request.method} ${request.url} -> ${reply.statusCode}`);
    }
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
  // IMPORTANT: Expose as /api/health/* (main app expects /api/*)
  await fastify.register(healthRoutes, { prefix: '/api' });

  // Status routes (no authentication required)
  // IMPORTANT: Expose as /api/status/*
  await fastify.register(statusRoutes, { prefix: '/api' });

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
