import { APISkin, APISticker, APIAgent, APIKeychain, APIMusicKit, APICollectible } from "~/server/utils/interfaces";
import fs from 'fs';
import path from 'path';

let skinsData: APISkin[];
let stickerData: APISticker[];
let agentData: APIAgent[];
let keychainData: APIKeychain[];
let musicKitData: APIMusicKit[];
let collectibleData: APICollectible[];

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
        url: 'https://bymykel.github.io/CSGO-API/api/en/skins.json',
        path: path.join(STORAGE_DIR, 'skins.json'),
        processor: processSkinData
    },
    stickers: {
        url: 'https://bymykel.github.io/CSGO-API/api/en/stickers.json',
        path: path.join(STORAGE_DIR, 'stickers.json')
    },
    keychains: {
        url: 'https://bymykel.github.io/CSGO-API/api/en/keychains.json',
        path: path.join(STORAGE_DIR, 'keychains.json')
    },
    agents: {
        url: 'https://bymykel.github.io/CSGO-API/api/en/agents.json',
        path: path.join(STORAGE_DIR, 'agents.json')
    },
    music_kits: {
        url: 'https://bymykel.github.io/CSGO-API/api/en/music_kits.json',
        path: path.join(STORAGE_DIR, 'music_kits.json')
    },
    collectibles: {
        url: 'https://bymykel.github.io/CSGO-API/api/en/collectibles.json',
        path: path.join(STORAGE_DIR, 'collectibles.json')
    }
};

// Cache validation - check once per day (86400000 ms)
const CACHE_VALIDITY_PERIOD = 86400000;

const detectDopplerPattern = (skin: APISkin) => {
    if (!skin.pattern?.id) return skin;

    const patterns: Record<string, string> = {
        'emerald_marbleized': 'Emerald',
        'ruby_marbleized': 'Ruby',
        'sapphire_marbleized': 'Sapphire',
        'blackpearl_marbleized': 'Black Pearl',
        'phase1': 'Phase 1',
        'phase2': 'Phase 2',
        'phase3': 'Phase 3',
        'phase4': 'Phase 4'
    };

    for (const [key, value] of Object.entries(patterns)) {
        if (skin.pattern.id.includes(key)) {
            skin.name += ` (${value})`;
            break;
        }
    }

    return skin;
}

function processSkinData(data: APISkin[]): APISkin[] {
    return data.map((skin: APISkin) => detectDopplerPattern(skin));
}

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
    return fileAge < CACHE_VALIDITY_PERIOD;
    //return true;
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

        console.log('CSGO API data loaded successfully');
    } catch (error) {
        console.error('Failed to initialize CSGO API data:', error);
        throw error;
    }
}
