import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import type { FastifyInstance } from 'fastify';
import { createServer } from '../server.js';
import type { AddressInfo } from 'net';


describe('Health Routes', () => {
  let app: FastifyInstance;
  let baseUrl: string;

  beforeEach(async () => {
    process.env.API_KEYS = 'test-api-key';
    app = await createServer();
    await app.listen({ port: 0 }); // Random available port
    const address = app.server.address() as AddressInfo;
    baseUrl = `http://localhost:${address.port}`;
  });

  afterEach(async () => {
    await app.close();
  });

  describe('GET /api/health', () => {
    it('should return health status', async () => {
      const response = await fetch(`${baseUrl}/api/health`);
      const body = await response.json();

      expect([200, 503]).toContain(response.status);
      expect(body).toHaveProperty('status');
      expect(body).toHaveProperty('ready');
      expect(body).toHaveProperty('checks');
      expect(['ok', 'degraded', 'fail']).toContain(body.status);
    });
  });

  describe('GET /api/health/ready', () => {
    it('should return readiness status', async () => {
      const response = await fetch(`${baseUrl}/api/health/ready`);
      const body = await response.json();

      expect([200, 503]).toContain(response.status);
      expect(body).toHaveProperty('status');
      expect(body).toHaveProperty('ready');
      expect(typeof body.ready).toBe('boolean');
    });
  });

  describe('GET /api/health/live', () => {
    it('should return liveness status', async () => {
      const response = await fetch(`${baseUrl}/api/health/live`);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body).toHaveProperty('status');
      expect(body).toHaveProperty('alive');
      expect(body.alive).toBe(true);
    });
  });
});
