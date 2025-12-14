import { describe, it, expect, beforeEach, afterEach, mock } from 'bun:test';
import { steamClientService } from './steamClient.js';
import { config } from '../utils/config.js';

describe('Steam Client Service', () => {
  beforeEach(() => {
    // Reset service state
    (steamClientService as any).client = null;
    (steamClientService as any).isInitialized = false;
    (steamClientService as any).initPromise = null;
  });

  describe('Initialization', () => {
    it('should handle missing credentials gracefully', async () => {
      const originalUsername = process.env.STEAM_USERNAME;
      const originalPassword = process.env.STEAM_PASSWORD;

      delete process.env.STEAM_USERNAME;
      delete process.env.STEAM_PASSWORD;

      try {
        await steamClientService.initialize();
        // Should not throw, but client should not be available
        const status = steamClientService.getStatus();
        expect(status.available).toBe(false);
      } finally {
        if (originalUsername) process.env.STEAM_USERNAME = originalUsername;
        if (originalPassword) process.env.STEAM_PASSWORD = originalPassword;
      }
    });

    it('should return status when not initialized', () => {
      const status = steamClientService.getStatus();
      expect(status).toHaveProperty('available');
      expect(status).toHaveProperty('status');
      expect(status.available).toBe(false);
    });

    it('should return false for isReady when not initialized', () => {
      expect(steamClientService.isReady()).toBe(false);
    });
  });

  describe('Status Methods', () => {
    it('should return status object with correct structure', () => {
      const status = steamClientService.getStatus();
      expect(status).toHaveProperty('available');
      expect(status).toHaveProperty('status');
      expect(status).toHaveProperty('message');
      expect(typeof status.available).toBe('boolean');
      expect(typeof status.status).toBe('string');
    });
  });
});
