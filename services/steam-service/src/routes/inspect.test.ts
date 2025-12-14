import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import type { FastifyInstance } from 'fastify';
import { createServer } from '../server.js';
import { requestQueue } from '../services/queue.js';

// Set test API key before imports
process.env.API_KEYS = 'test-api-key';

describe('Inspect Routes', () => {
  let app: FastifyInstance;
  const testApiKey = 'test-api-key';

  beforeEach(async () => {
    app = await createServer();
    await app.ready();
  });

  afterEach(async () => {
    await app.close();
    requestQueue.clear();
  });

  describe('POST /api/inspect/create-url', () => {
    it('should create inspect URL without Steam account', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/inspect/create-url',
        headers: {
          'X-API-Key': testApiKey,
        },
        payload: {
          itemType: 'weapon',
          defindex: 7,
          paintindex: 179,
          paintseed: 661,
          paintwear: 0.15,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.data).toHaveProperty('inspectUrl');
      expect(body.data.inspectUrl).toContain('steam://');
    });

    it('should handle stickers and keychains', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/inspect/create-url',
        headers: {
          'X-API-Key': testApiKey,
        },
        payload: {
          itemType: 'weapon',
          defindex: 7,
          paintindex: 179,
          stickers: [
            {
              slot: 0,
              sticker_id: 5032,
              wear: 0.1,
            },
          ],
          keychain: {
            defindex: 6001,
          },
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
    });

    it('should require API key', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/inspect/create-url',
        payload: {
          itemType: 'weapon',
        },
      });

      expect(response.statusCode).toBe(401);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('MISSING_API_KEY');
    });

    it('should reject invalid API key', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/inspect/create-url',
        headers: {
          'X-API-Key': 'invalid-key',
        },
        payload: {
          itemType: 'weapon',
        },
      });

      expect(response.statusCode).toBe(401);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('INVALID_API_KEY');
    });
  });

  describe('POST /api/inspect/decode-masked-only', () => {
    it('should decode masked URL without Steam account', async () => {
      // Example masked URL (shortened for test)
      const maskedUrl = 'steam://rungame/730/76561202255233023/+csgo_econ_action_preview%20M4A1-S%20%7C%20Hyper%20Beast';

      const response = await app.inject({
        method: 'POST',
        url: '/api/inspect/decode-masked-only',
        headers: {
          'X-API-Key': testApiKey,
        },
        payload: {
          inspectUrl: maskedUrl,
        },
      });

      // This might fail if URL is not properly masked, but should not require Steam
      expect([200, 400]).toContain(response.statusCode);
    });

    it('should reject unmasked URLs', async () => {
      const unmaskedUrl = 'steam://rungame/730/76561202255233023/+csgo_econ_action_preview%20S123456A789D123';

      const response = await app.inject({
        method: 'POST',
        url: '/api/inspect/decode-masked-only',
        headers: {
          'X-API-Key': testApiKey,
        },
        payload: {
          inspectUrl: unmaskedUrl,
        },
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('INVALID_MASKED_URL');
    });
  });

  describe('POST /api/inspect/decode-hex-data', () => {
    it('should decode hex data without Steam account', async () => {
      // Example hex data (shortened)
      const hexData = '001807';

      const response = await app.inject({
        method: 'POST',
        url: '/api/inspect/decode-hex-data',
        headers: {
          'X-API-Key': testApiKey,
        },
        payload: {
          hexData,
        },
      });

      // Should either succeed or fail with proper error, but not require Steam
      expect([200, 400]).toContain(response.statusCode);
    });
  });

  describe('POST /api/inspect/validate-url', () => {
    it('should validate inspect URLs without Steam account', async () => {
      const testUrl = 'steam://rungame/730/76561202255233023/+csgo_econ_action_preview%20M4A1-S';

      const response = await app.inject({
        method: 'POST',
        url: '/api/inspect/validate-url',
        headers: {
          'X-API-Key': testApiKey,
        },
        payload: {
          inspectUrl: testUrl,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.data).toHaveProperty('valid');
    });
  });

  describe('POST /api/inspect/analyze-url', () => {
    it('should analyze URLs without Steam account', async () => {
      const testUrl = 'steam://rungame/730/76561202255233023/+csgo_econ_action_preview%20M4A1-S';

      const response = await app.inject({
        method: 'POST',
        url: '/api/inspect/analyze-url',
        headers: {
          'X-API-Key': testApiKey,
        },
        payload: {
          inspectUrl: testUrl,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.data).toHaveProperty('url_type');
    });
  });
});
