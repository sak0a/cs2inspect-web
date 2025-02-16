import {
    initCSGOApiData,
} from '../utils/csgoAPI';
import SteamClient from "~/server/utils/csinspect/steamClient";

let steamClientInitialized = false;

export async function initializeSteamClient() {
    if (steamClientInitialized) {
        return;
    }
    try {
        const client = SteamClient.getInstance();
        await client.connect();
        steamClientInitialized = true;
        console.log('Steam client initialized successfully');
    } catch (error) {
        console.error('Failed to initialize Steam client:', error);
        throw error;
    }
}

export function getCS2Client() {
    if (!steamClientInitialized) {
        throw new Error('Steam client not initialized');
    }
    return SteamClient.getInstance();
}

export default defineNitroPlugin(async () => {
    await initCSGOApiData()
    initializeSteamClient().catch(error => {
        console.error('Failed to initialize Steam client:', error);
    });
});