import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import type { FastifyInstance } from 'fastify';
import { createServer } from '../server.js';

// Set minimal env for health tests (no API key needed for health endpoints)
process.env.API_KEYS = 'test-key';

describe('Health Routes', () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    app = await createServer();
    await app.ready();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('GET /api/health', () => {
    it('should return health status', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/health',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body).toHaveProperty('status');
      expect(body).toHaveProperty('ready');
      expect(body).toHaveProperty('checks');
      expect(['ok', 'degraded', 'fail']).toContain(body.status);
    });
  });

  describe('GET /api/health/ready', () => {
    it('should return readiness status', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/health/ready',
      });

      expect([200, 503]).toContain(response.statusCode);
      const body = JSON.parse(response.body);
      expect(body).toHaveProperty('status');
      expect(body).toHaveProperty('ready');
      expect(typeof body.ready).toBe('boolean');
    });
  });

  describe('GET /api/health/live', () => {
    it('should return liveness status', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/health/live',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body).toHaveProperty('status');
      expect(body).toHaveProperty('alive');
      expect(body.alive).toBe(true);
    });
  });
});
