import { APISkin, APISticker, APIAgent, APIKeychain, APIMusicKit, APICollectible } from "~/server/utils/interfaces";
import { EXTERNAL_API_URLS, CACHE_PERIODS, DATA_STALENESS_THRESHOLD } from './constants';
import { processSkinData } from './skinUtils';
import fs from 'fs';
import path from 'path';

let skinsData: APISkin[];
let stickerData: APISticker[];
let agentData: APIAgent[];
let keychainData: APIKeychain[];
let musicKitData: APIMusicKit[];
let collectibleData: APICollectible[];

// Data freshness tracking
let dataLoadTimestamp: string | null = null;
let dataLoadDuration: number | null = null;

// Define storage directory and file paths
const STORAGE_DIR = path.resolve('./storage/csgo-api');

// Define the type for API file configuration
type ApiFileConfig = {
    url: string;
    path: string;
    processor?: (data: any) => any;
};

// Define the API files with their configurations
const API_FILES: Record<string, ApiFileConfig> = {
    skins: {
        url: EXTERNAL_API_URLS.SKINS,
        path: path.join(STORAGE_DIR, 'skins.json'),
        processor: processSkinData
    },
    stickers: {
        url: EXTERNAL_API_URLS.STICKERS,
        path: path.join(STORAGE_DIR, 'stickers.json')
    },
    keychains: {
        url: EXTERNAL_API_URLS.KEYCHAINS,
        path: path.join(STORAGE_DIR, 'keychains.json')
    },
    agents: {
        url: EXTERNAL_API_URLS.AGENTS,
        path: path.join(STORAGE_DIR, 'agents.json')
    },
    music_kits: {
        url: EXTERNAL_API_URLS.MUSIC_KITS,
        path: path.join(STORAGE_DIR, 'music_kits.json')
    },
    collectibles: {
        url: EXTERNAL_API_URLS.COLLECTIBLES,
        path: path.join(STORAGE_DIR, 'collectibles.json')
    }
};

// Skin processing is now handled by skinUtils module

export function getKeychainData(): APIKeychain[] {
    return keychainData;
}

export function getSkinsData(): APISkin[] {
    return skinsData;
}

export function getStickerData(): APISticker[] {
    return stickerData;
}

export function getMusicKitData(): APIMusicKit[] {
    return musicKitData;
}

export function getAgentData(): APIAgent[] {
    return agentData;
}

export function getCollectibleData(): APICollectible[] {
    return collectibleData;
}

/**
 * Ensures the storage directory exists
 */
function ensureStorageDirectoryExists(): void {
    if (!fs.existsSync(STORAGE_DIR)) {
        fs.mkdirSync(STORAGE_DIR, { recursive: true });
        console.log(`Created storage directory: ${STORAGE_DIR}`);
    }
}

/**
 * Checks if a file exists and is not older than the cache validity period
 */
function isFileValid(filePath: string): boolean {
    if (!fs.existsSync(filePath)) {
        return false;
    }

    const stats = fs.statSync(filePath);
    const fileAge = Date.now() - stats.mtimeMs;
    return fileAge < CACHE_PERIODS.API_DATA;
}

/**
 * Fetches data from API and saves it to a file
 */
async function fetchAndSaveData(url: string, filePath: string): Promise<any> {
    try {
        console.log(`Fetching data from ${url}`);
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
        console.log(`Saved data to ${filePath}`);
        return data;
    } catch (error) {
        console.error(`Error fetching data from ${url}:`, error);
        throw error;
    }
}

/**
 * Reads data from a file
 */
function readDataFromFile(filePath: string): any {
    try {
        const data = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error(`Error reading data from ${filePath}:`, error);
        throw error;
    }
}

/**
 * Generic function to load data from file or API
 */
async function loadData<T>(type: keyof typeof API_FILES): Promise<T[]> {
    const config = API_FILES[type];

    try {
        let data: T[];

        if (isFileValid(config.path)) {
            console.log(`Using cached ${type} data from ${config.path}`);
            data = readDataFromFile(config.path);
        } else {
            console.log(`Fetching fresh ${type} data`);
            data = await fetchAndSaveData(config.url, config.path);
        }

        // Apply processor function if provided
        if (config.processor && typeof config.processor === 'function') {
            data = config.processor(data);
        }

        return data;
    } catch (error) {
        console.error(`Failed to load ${type} data:`, error);

        // If file exists but is invalid or we failed to fetch, try to use it anyway
        if (fs.existsSync(config.path)) {
            console.log(`Falling back to existing ${type} data file`);
            return readDataFromFile(config.path);
        }

        throw error;
    }
}

export async function initCSGOApiData() {
    const startTime = Date.now();

    try {
        ensureStorageDirectoryExists();

        // Load all data types in parallel
        const [skins, stickers, keychains, agents, musicKits, collectibles] = await Promise.all([
            loadData<APISkin>('skins'),
            loadData<APISticker>('stickers'),
            loadData<APIKeychain>('keychains'),
            loadData<APIAgent>('agents'),
            loadData<APIMusicKit>('music_kits'),
            loadData<APICollectible>('collectibles')
        ]);

        // Assign to global variables
        skinsData = skins;
        stickerData = stickers;
        keychainData = keychains;
        agentData = agents;
        musicKitData = musicKits;
        collectibleData = collectibles;

        // Track data freshness
        dataLoadTimestamp = new Date().toISOString();
        dataLoadDuration = Date.now() - startTime;

        console.log('CSGO API data loaded successfully');
    } catch (error) {
        console.error('Failed to initialize CSGO API data:', error);
        throw error;
    }
}

/**
 * Gets data freshness information
 * @returns Object containing data load timestamp and duration
 */
export function getDataFreshness() {
    return {
        lastUpdated: dataLoadTimestamp,
        loadDuration: dataLoadDuration,
        isStale: dataLoadTimestamp ?
            (Date.now() - new Date(dataLoadTimestamp).getTime()) > DATA_STALENESS_THRESHOLD :
            true
    };
}
