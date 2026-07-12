import { CS2Inspect } from 'cs2-inspect-lib'
import type { SteamClientConfig } from 'cs2-inspect-lib'
import { logger } from '../utils/logger.js'

class SteamClientService {
  private client: CS2Inspect | null = null
  private isInitialized = false
  private initPromise: Promise<void> | null = null
  private initStartTime: number | null = null

  private logSteamAccountIdForTesting(): void {
    if (!this.client) {
      return
    }

    const clientWithInternals = this.client as unknown as {
      steamManager?: {
        client?: {
          steamClient?: {
            steamID?: {
              accountid?: number
            }
          }
        }
      }
    }

    const accountId = clientWithInternals.steamManager?.client?.steamClient?.steamID?.accountid

    if (accountId !== undefined) {
      console.log(`[steam-service] Logged in Steam accountid: ${accountId}`)
      return
    }

    logger.warn('Steam client initialized but could not read Steam accountid for testing log')
  }

  async initialize(): Promise<void> {
    if (this.isInitialized && this.client) {
      return
    }

    if (this.initPromise) {
      return this.initPromise
    }

    this.initPromise = this._doInitialize()
    await this.initPromise
  }

  private async _doInitialize(): Promise<void> {
    this.initStartTime = Date.now()

    try {
      // Match the working main app implementation EXACTLY
      // Use process.env directly - no trimming, no defaults (matches main app)
      const steamConfig: SteamClientConfig = {
        username: process.env.STEAM_USERNAME,
        password: process.env.STEAM_PASSWORD,
        apiKey: process.env.STEAM_API_KEY,
        enabled: !!(process.env.STEAM_USERNAME && process.env.STEAM_PASSWORD),
        enableLogging: process.env.LOG_API_REQUESTS === 'true',
        // Use the exact same hardcoded values as the working main app
        rateLimitDelay: 1500,
        maxQueueSize: 100,
        requestTimeout: 10000,
        queueTimeout: 30000,
      }

      if (!steamConfig.enabled) {
        logger.warn('Steam client is disabled (missing credentials)')
        this.isInitialized = true
        return
      }

      logger.info('Initializing Steam client...')
      if (steamConfig.username) {
        logger.info(
          `Steam username: ${steamConfig.username.substring(0, 3)}*** (length: ${steamConfig.username.length})`
        )
      }
      if (steamConfig.password) {
        logger.info(`Steam password length: ${steamConfig.password.length} characters`)
      }
      logger.info(`Steam API key present: ${!!steamConfig.apiKey}`)

      // Match the exact initialization pattern from the working main app
      this.client = new CS2Inspect({
        steamClient: steamConfig,
        enableLogging: process.env.LOG_API_REQUESTS === 'true',
        validateInput: true,
      })

      // Call initializeSteamClient() exactly like the main app does
      // The main app doesn't use retry logic, so let's try without it first
      if (steamConfig.enabled) {
        await this.client.initializeSteamClient()
        this.logSteamAccountIdForTesting()
      }

      this.isInitialized = true
      const initDuration = Date.now() - (this.initStartTime || 0)
      logger.info(`Steam client initialized successfully in ${initDuration}ms`)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      logger.error(`Failed to initialize Steam client: ${errorMessage}`)

      // Don't mark as initialized if it failed
      this.isInitialized = false
      this.client = null
      this.initPromise = null

      // Don't throw - allow service to start without Steam client
      // Endpoints that require Steam will return appropriate errors
      logger.warn(
        'Service will continue without Steam client. Unmasked URL inspection will not be available.'
      )
    }
  }

  getClient(): CS2Inspect {
    if (!this.client) {
      throw new Error('Steam client not initialized')
    }
    return this.client
  }

  getStatus() {
    if (!this.client) {
      return {
        available: false,
        status: 'not_initialized',
        message: 'Steam client has not been initialized',
      }
    }

    try {
      const stats = this.client.getSteamClientStats()
      return {
        available: stats.isAvailable,
        status: stats.status || 'unknown',
        message: stats.isAvailable ? 'Steam client is ready' : 'Steam client is not available',
        queueLength: stats.queueLength,
        unmaskedSupport: stats.unmaskedSupport,
      }
    } catch (error) {
      return {
        available: false,
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  isReady(): boolean {
    if (!this.client) {
      return false
    }
    try {
      const stats = this.client.getSteamClientStats()
      return stats.isAvailable || false
    } catch {
      return false
    }
  }

  async ensureReady(): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize()
    }

    if (!this.isReady()) {
      throw new Error('Steam client is not ready')
    }
  }
}

export const steamClientService = new SteamClientService()
