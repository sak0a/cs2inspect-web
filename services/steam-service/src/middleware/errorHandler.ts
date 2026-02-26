import type { FastifyRequest, FastifyReply, FastifyError } from 'fastify';
import { logger } from '../utils/logger.js';

export function errorHandler(
  error: FastifyError,
  request: FastifyRequest,
  reply: FastifyReply
) {
  if (reply.sent || reply.raw.headersSent || reply.raw.writableEnded) {
    return;
  }

  logger.error(`Error handling request ${request.method} ${request.url}:`, error);

  const statusCode = error.statusCode || 500;
  const code = error.code || 'INTERNAL_ERROR';
  const message = error.message || 'Internal server error';

  reply.code(statusCode);
  return {
    success: false,
    error: {
      code,
      message,
      ...(process.env.NODE_ENV === 'development' && {
        details: {
          stack: error.stack,
          name: error.name,
        },
      }),
    },
  };
}
