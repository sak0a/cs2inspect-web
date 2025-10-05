import {
    initCSGOApiData,
} from '../utils/csgoAPI';
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
    await initCSGOApiData()
    initializeSteamClient().catch(error => {
        console.error('Failed to initialize CS2 Inspect client', error);
    });
});