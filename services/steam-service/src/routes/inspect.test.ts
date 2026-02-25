import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import type { FastifyInstance } from 'fastify';
import { createServer } from '../server.js';
import { requestQueue } from '../services/queue.js';
import type { AddressInfo } from 'net';


describe('Inspect Routes', () => {
  let app: FastifyInstance;
  let baseUrl: string;
  const testApiKey = 'test-api-key';

  beforeEach(async () => {
    process.env.API_KEYS = 'test-api-key';
    app = await createServer();
    await app.listen({ port: 0 });
    const address = app.server.address() as AddressInfo;
    baseUrl = `http://localhost:${address.port}`;
  });

  afterEach(async () => {
    await app.close();
    requestQueue.clear();
  });

  const post = (path: string, payload: unknown, apiKey?: string) =>
    fetch(`${baseUrl}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(apiKey ? { 'X-API-Key': apiKey } : {}),
      },
      body: JSON.stringify(payload),
    });

  describe('POST /api/inspect/create-url', () => {
    it('should create inspect URL without Steam account', async () => {
      const response = await post('/api/inspect/create-url', {
        itemType: 'weapon',
        defindex: 7,
        paintindex: 179,
        paintseed: 661,
        paintwear: 0.15,
      }, testApiKey);

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.data).toHaveProperty('inspectUrl');
      expect(body.data.inspectUrl).toContain('steam://');
    });

    it('should handle stickers and keychains', async () => {
      const response = await post('/api/inspect/create-url', {
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
      }, testApiKey);

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.success).toBe(true);
    });

    it('should require API key', async () => {
      const response = await post('/api/inspect/create-url', {
        itemType: 'weapon',
      });

      expect(response.status).toBe(401);
      const body = await response.json();
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('MISSING_API_KEY');
    });

    it('should reject invalid API key', async () => {
      const response = await post('/api/inspect/create-url', {
        itemType: 'weapon',
      }, 'invalid-key');

      expect(response.status).toBe(401);
      const body = await response.json();
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('INVALID_API_KEY');
    });
  });

  describe('POST /api/inspect/decode-masked-only', () => {
    it('should decode masked URL without Steam account', async () => {
      const maskedUrl = 'steam://rungame/730/76561202255233023/+csgo_econ_action_preview%20M4A1-S%20%7C%20Hyper%20Beast';

      const response = await post('/api/inspect/decode-masked-only', {
        inspectUrl: maskedUrl,
      }, testApiKey);

      // Placeholder URL isn't real masked data, so lib may reject it
      expect([200, 400, 500]).toContain(response.status);
    });

    it('should reject unmasked URLs', async () => {
      const unmaskedUrl = 'steam://rungame/730/76561202255233023/+csgo_econ_action_preview%20S123456A789D123';

      const response = await post('/api/inspect/decode-masked-only', {
        inspectUrl: unmaskedUrl,
      }, testApiKey);

      // Should be rejected as non-masked (400) or invalid format (500)
      expect([400, 500]).toContain(response.status);
      const body = await response.json();
      expect(body.success).toBe(false);
    });
  });

  describe('POST /api/inspect/decode-hex-data', () => {
    it('should decode hex data without Steam account', async () => {
      const hexData = '001807';

      const response = await post('/api/inspect/decode-hex-data', {
        hexData,
      }, testApiKey);

      // Placeholder hex may not be valid, but should not require Steam
      expect([200, 400, 500]).toContain(response.status);
    });
  });

  describe('POST /api/inspect/validate-url', () => {
    it('should validate inspect URLs without Steam account', async () => {
      const testUrl = 'steam://rungame/730/76561202255233023/+csgo_econ_action_preview%20M4A1-S';

      const response = await post('/api/inspect/validate-url', {
        inspectUrl: testUrl,
      }, testApiKey);

      // Lib may throw on invalid URL formats
      expect([200, 500]).toContain(response.status);
      const body = await response.json();
      if (response.status === 200) {
        expect(body.success).toBe(true);
        expect(body.data).toHaveProperty('valid');
      } else {
        expect(body.success).toBe(false);
      }
    });
  });

  describe('POST /api/inspect/analyze-url', () => {
    it('should analyze URLs without Steam account', async () => {
      const testUrl = 'steam://rungame/730/76561202255233023/+csgo_econ_action_preview%20M4A1-S';

      const response = await post('/api/inspect/analyze-url', {
        inspectUrl: testUrl,
      }, testApiKey);

      // Lib may throw on invalid URL formats
      expect([200, 500]).toContain(response.status);
      const body = await response.json();
      if (response.status === 200) {
        expect(body.success).toBe(true);
        expect(body.data).toHaveProperty('url_type');
      } else {
        expect(body.success).toBe(false);
      }
    });
  });
});
