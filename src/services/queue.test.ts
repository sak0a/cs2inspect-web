import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { requestQueue } from './queue.js';

describe('Request Queue', () => {
  beforeEach(() => {
    requestQueue.clear();
  });

  afterEach(() => {
    requestQueue.clear();
  });

  describe('Queue Management', () => {
    it('should enqueue and process requests', async () => {
      const result = await requestQueue.enqueue(async () => {
        return 'test-result';
      });

      expect(result).toBe('test-result');
    });

    it('should handle request errors', async () => {
      await expect(
        requestQueue.enqueue(async () => {
          throw new Error('Test error');
        })
      ).rejects.toThrow('Test error');
    });

    it('should respect queue size limit', async () => {
      // Fill queue to max
      const maxSize = 100;
      const promises: Promise<unknown>[] = [];

      for (let i = 0; i < maxSize; i++) {
        promises.push(
          requestQueue.enqueue(async () => {
            await new Promise((resolve) => setTimeout(resolve, 10));
            return i;
          })
        );
      }

      // Next request should fail
      await expect(
        requestQueue.enqueue(async () => 'should-fail')
      ).rejects.toThrow('Queue is full');

      // Wait for all to complete
      await Promise.all(promises);
    });

    it('should return queue statistics', () => {
      const stats = requestQueue.getStats();
      expect(stats).toHaveProperty('pending');
      expect(stats).toHaveProperty('processing');
      expect(stats).toHaveProperty('maxSize');
      expect(typeof stats.pending).toBe('number');
      expect(typeof stats.processing).toBe('number');
      expect(typeof stats.maxSize).toBe('number');
    });

    it('should clear queue', async () => {
      // Add some requests
      const _promise1 = requestQueue.enqueue(async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));
        return 'result1';
      });

      requestQueue.clear();

      // Queue should be empty
      const stats = requestQueue.getStats();
      expect(stats.pending).toBe(0);
    });
  });

  describe('Rate Limiting', () => {
    it('should delay between requests', async () => {
      const startTime = Date.now();
      
      await requestQueue.enqueue(async () => 'first');
      await requestQueue.enqueue(async () => 'second');

      const duration = Date.now() - startTime;
      // Should have at least the rate limit delay (1500ms default)
      expect(duration).toBeGreaterThanOrEqual(1400); // Allow some margin
    });
  });
});
