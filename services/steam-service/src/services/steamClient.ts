import { CS2Inspect } from 'cs2-inspect-lib';
import type { SteamClientConfig } from 'cs2-inspect-lib';
import { config } from '../utils/config.js';
import { logger } from '../utils/logger.js';

class SteamClientService {
  private client: CS2Inspect | null = null;
  private isInitialized = false;
  private initPromise: Promise<void> | null = null;
  private initStartTime: number | null = null;

  async initialize(): Promise<void> {
    if (this.isInitialized && this.client) {
      return;
    }

    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = this._doInitialize();
    await this.initPromise;
  }

  private async _doInitialize(): Promise<void> {
    this.initStartTime = Date.now();

    try {
      const steamConfig: SteamClientConfig = {
        username: config.steam.username,
        password: config.steam.password,
        apiKey: config.steam.apiKey,
        enabled: config.steam.enabled,
        enableLogging: config.steam.enableLogging,
        rateLimitDelay: config.steam.rateLimitDelay,
        maxQueueSize: config.steam.maxQueueSize,
        requestTimeout: config.steam.requestTimeout,
        queueTimeout: config.steam.queueTimeout,
      };

      if (!steamConfig.enabled) {
        logger.warn('Steam client is disabled (missing credentials)');
        this.isInitialized = true;
        return;
      }

      logger.info('Initializing Steam client...');
      this.client = new CS2Inspect({
        steamClient: steamConfig,
        enableLogging: config.steam.enableLogging,
        validateInput: true,
      });

      await this.client.initializeSteamClient();
      this.isInitialized = true;

      const initDuration = Date.now() - (this.initStartTime || 0);
      logger.info(`Steam client initialized successfully in ${initDuration}ms`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`Failed to initialize Steam client: ${errorMessage}`);
      this.initPromise = null;
      throw error;
    }
  }

  getClient(): CS2Inspect {
    if (!this.client) {
      throw new Error('Steam client not initialized');
    }
    return this.client;
  }

  getStatus() {
    if (!this.client) {
      return {
        available: false,
        status: 'not_initialized',
        message: 'Steam client has not been initialized',
      };
    }

    try {
      const stats = this.client.getSteamClientStats();
      return {
        available: stats.isAvailable,
        status: stats.status || 'unknown',
        message: stats.isAvailable ? 'Steam client is ready' : 'Steam client is not available',
        queueLength: stats.queueLength,
        unmaskedSupport: stats.unmaskedSupport,
      };
    } catch (error) {
      return {
        available: false,
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  isReady(): boolean {
    if (!this.client) {
      return false;
    }
    try {
      const stats = this.client.getSteamClientStats();
      return stats.isAvailable || false;
    } catch {
      return false;
    }
  }

  async ensureReady(): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    if (!this.isReady()) {
      throw new Error('Steam client is not ready');
    }
  }
}

export const steamClientService = new SteamClientService();
