import type { SteamClientConfig } from 'cs2-inspect-lib';
import { CS2Inspect } from 'cs2-inspect-lib';

let cs2InspectInstance: CS2Inspect | null = null;

let steamClientInitialized = false;

export async function initializeSteamClient() {
    if (steamClientInitialized && cs2InspectInstance) {
        return;
    }

    try {
        const steamConfig: SteamClientConfig = {
            username: process.env.STEAM_USERNAME,
            password: process.env.STEAM_PASSWORD,
            apiKey: process.env.STEAM_API_KEY,
            enabled: !!(process.env.STEAM_USERNAME && process.env.STEAM_PASSWORD),
            enableLogging: process.env.LOG_API_REQUESTS === 'true',
            rateLimitDelay: 1500,
            maxQueueSize: 100,
            requestTimeout: 10000,
            queueTimeout: 30000
        };

        cs2InspectInstance = new CS2Inspect({
            steamClient: steamConfig,
            enableLogging: process.env.LOG_API_REQUESTS === 'true',
            validateInput: true
        });

        if (steamConfig.enabled) {
            await cs2InspectInstance.initializeSteamClient();
        }

        steamClientInitialized = true;
        console.log('CS2 Inspect client initialized successfully');
    } catch (error) {
        console.error('Failed to initialize CS2 Inspect client:', error);
        throw error;
    }
}

export function getCS2Client(): CS2Inspect {
    if (!cs2InspectInstance) {
        throw new Error('CS2 Inspect client not initialized');
    }
    return cs2InspectInstance;
}

export default defineNitroPlugin(async () => {
    // Run database migrations first
    try {
        const { runMigrations } = await import('../utils/migrations/runner');
        await runMigrations();
    } catch (error) {
        console.error('Failed to run database migrations:', error);
        // Don't throw - allow server to start even if migrations fail
        // This allows manual intervention if needed
    }
    
    // Initialize CSGO API data in the background (non-blocking)
    // This allows the server to start immediately while data loads
    // The promise is tracked in csgoAPI.ts so API endpoints can wait for it if needed
    const { startDataInitialization } = await import('../utils/csgoAPI');
    startDataInitialization().catch(error => {
        console.error('Failed to initialize CSGO API data', error);
    });
    
    // Initialize Steam client only if steam service is not configured
    // If STEAM_SERVICE_URL is set, we'll use the external service instead
    const useSteamService = !!(process.env.STEAM_SERVICE_URL && process.env.STEAM_SERVICE_API_KEY);
    
    if (!useSteamService) {
        // Initialize Steam client in the background (non-blocking)
        initializeSteamClient().catch(error => {
            console.error('Failed to initialize CS2 Inspect client', error);
        });
    } else {
        console.log('Steam service configured - using external service instead of local client');
    }
    
    // Import health check sampler dynamically to avoid circular dependencies
    const { startHealthCheckSampler } = await import('../utils/health/sampler');
    
    // Start health check sampler with 60 second interval
    startHealthCheckSampler(60000);
    console.log('Health check sampler started');
});