import type { APISkin, APISticker, APIAgent, APIKeychain, APIMusicKit, APICollectible } from "~/server/utils/interfaces";
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

// In-memory cache for serverless environments
let isDataInitialized = false;
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes
let lastCacheTime = 0;

// Promise to track initialization status (for non-blocking startup)
let initializationPromise: Promise<void> | null = null;

// Define storage directory and file paths
// Use /tmp in serverless environments (like Vercel), fallback to local storage
const STORAGE_DIR = process.env.VERCEL || process.env.NETLIFY || process.env.AWS_LAMBDA_FUNCTION_NAME
    ? path.resolve('/tmp/csgo-api')
    : path.resolve('./storage/csgo-api');

// Define the type for API file configuration
type ApiFileConfig = {
    url: string;
    path: string;
    processor?: (data: unknown) => unknown;
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
 * Async getters that wait for initialization if needed
 * Use these in API endpoints that need the data
 */
export async function getKeychainDataAsync(): Promise<APIKeychain[]> {
    await ensureDataInitialized();
    return keychainData;
}

export async function getSkinsDataAsync(): Promise<APISkin[]> {
    await ensureDataInitialized();
    return skinsData;
}

export async function getStickerDataAsync(): Promise<APISticker[]> {
    await ensureDataInitialized();
    return stickerData;
}

export async function getMusicKitDataAsync(): Promise<APIMusicKit[]> {
    await ensureDataInitialized();
    return musicKitData;
}

export async function getAgentDataAsync(): Promise<APIAgent[]> {
    await ensureDataInitialized();
    return agentData;
}

export async function getCollectibleDataAsync(): Promise<APICollectible[]> {
    await ensureDataInitialized();
    return collectibleData;
}

/**
 * Ensures the storage directory exists
 * Returns true if successful, false if filesystem is read-only
 */
function ensureStorageDirectoryExists(): boolean {
    try {
        if (!fs.existsSync(STORAGE_DIR)) {
            fs.mkdirSync(STORAGE_DIR, { recursive: true });
            console.log(`Created storage directory: ${STORAGE_DIR}`);
        }
        return true;
    } catch {
        console.warn(`Cannot create storage directory (read-only filesystem): ${STORAGE_DIR}`);
        return false;
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
async function fetchAndSaveData(url: string, filePath: string): Promise<unknown> {
    try {
        console.log(`Fetching data from ${url}`);
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        // Try to save to file, but don't fail if we can't (serverless environment)
        try {
            fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
            console.log(`Saved data to ${filePath}`);
        } catch {
            console.warn(`Cannot save data to ${filePath} (read-only filesystem), using in-memory cache`);
        }

        return data;
    } catch (error) {
        console.error(`Error fetching data from ${url}:`, error);
        throw error;
    }
}

/**
 * Reads data from a file
 */
function readDataFromFile(filePath: string): unknown {
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

        // In serverless environments, we might not have cached files, so always fetch fresh
        const isServerless = process.env.VERCEL || process.env.NETLIFY || process.env.AWS_LAMBDA_FUNCTION_NAME;

        if (!isServerless && isFileValid(config.path)) {
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
        // Check if we already have fresh data in memory (for serverless environments)
        const now = Date.now();
        if (isDataInitialized && (now - lastCacheTime) < CACHE_DURATION) {
            console.log('Using cached data from memory');
            return;
        }

        const canWriteToStorage = ensureStorageDirectoryExists();
        if (!canWriteToStorage) {
            console.log('Running in serverless environment - using in-memory caching only');
        }

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

        // Update cache flags for serverless environments
        isDataInitialized = true;
        lastCacheTime = Date.now();

        console.log('CSGO API data loaded successfully');
    } catch (error) {
        console.error('Failed to initialize CSGO API data:', error);
        // Reset promise on error so it can be retried
        initializationPromise = null;
        throw error;
    }
}

/**
 * Starts initialization in the background and returns the promise
 * Use this in server plugins to start initialization non-blocking
 */
export function startDataInitialization(): Promise<void> {
    if (initializationPromise) {
        return initializationPromise;
    }

    if (isDataInitialized) {
        return Promise.resolve();
    }

    initializationPromise = initCSGOApiData()
        .catch((error) => {
            console.error('Data initialization failed:', error);
            // Reset promise so it can be retried
            initializationPromise = null;
            throw error;
        });

    return initializationPromise;
}

/**
 * Ensures data is initialized before accessing it
 * Waits for initialization if it's in progress
 */
export async function ensureDataInitialized(): Promise<void> {
    if (isDataInitialized) {
        return;
    }

    if (initializationPromise) {
        // Initialization is in progress, wait for it
        await initializationPromise;
        return;
    }

    // Start initialization if not already started
    await startDataInitialization();
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
