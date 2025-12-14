import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import type { FastifyInstance } from 'fastify';
import { createServer } from '../server.js';

// Set test API key before any imports
process.env.API_KEYS = 'valid-test-key';

describe('Authentication Middleware', () => {
  let app: FastifyInstance;
  const validApiKey = 'valid-test-key';
  const invalidApiKey = 'invalid-key';

  beforeEach(async () => {
    app = await createServer();
    await app.ready();
  });

  afterEach(async () => {
    await app.close();
  });

  it('should allow requests with valid API key', async () => {
    // Test an auth-required endpoint
    const authResponse = await app.inject({
      method: 'POST',
      url: '/api/inspect/analyze-url',
      headers: {
        'X-API-Key': validApiKey,
      },
      payload: {
        inspectUrl: 'steam://rungame/730/76561202255233023/+csgo_econ_action_preview%20test',
      },
    });

    expect(authResponse.statusCode).not.toBe(401);
  });

  it('should reject requests without API key', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/inspect/analyze-url',
      payload: {
        inspectUrl: 'test',
      },
    });

    expect(response.statusCode).toBe(401);
    const body = JSON.parse(response.body);
    expect(body.error.code).toBe('MISSING_API_KEY');
  });

  it('should reject requests with invalid API key', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/inspect/analyze-url',
      headers: {
        'X-API-Key': invalidApiKey,
      },
      payload: {
        inspectUrl: 'test',
      },
    });

    expect(response.statusCode).toBe(401);
    const body = JSON.parse(response.body);
    expect(body.error.code).toBe('INVALID_API_KEY');
  });
});
