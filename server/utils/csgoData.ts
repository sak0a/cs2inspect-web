import {APISkin, APISticker, APIAgent, APIKeychain, APIMusicKit} from "~/server/utils/interfaces";

let skinsData: APISkin[] | undefined | null = null;  // Single instance to hold data
let stickerData: APISticker[] | null = null;
let agentData: APIAgent[] | null = null;
let keychainData: APIKeychain[] | null = null;
let musicKitData: APIMusicKit[] | null = null;

async function initializeCSGOStickerData() {
    if (stickerData) return; // Skip if already initialized
    try {
        const response = await fetch('https://bymykel.github.io/CSGO-API/api/en/stickers.json');

        if (!response.ok) {
            throw new Error(`HTTP error sticker! status: ${response.status}`);
        }
        stickerData = await response.json();
    } catch (error) {
        console.error('Failed to initialize CSGO sticker data:', error);
    }
}

async function initializeCSGOKeychainData() {
    if (keychainData) return; // Skip if already initialized

    try {
        const response = await fetch('https://bymykel.github.io/CSGO-API/api/en/keychains.json');

        if (!response.ok) {
            throw new Error(`HTTP error keychain! status: ${response.status}`);
        }
        keychainData = await response.json();
    } catch (error) {
        console.error('Failed to initialize CSGO keychain data:', error);
    }
}

async function initializeCSGOAgentData() {
    if (agentData) return; // Skip if already initialized

    try {
        const response = await fetch('https://bymykel.github.io/CSGO-API/api/en/agents.json');

        if (!response.ok) {
            throw new Error(`HTTP error agents! status: ${response.status}`);
        }
        agentData = await response.json();
    } catch (error) {
        console.error('Failed to initialize CSGO agents data:', error);
    }
}

async function initializeCSGOMusicKitData() {
    if (musicKitData) return; // Skip if already initialized

    try {
        const response = await fetch('https://bymykel.github.io/CSGO-API/api/en/music_kits.json');

        if (!response.ok) {
            throw new Error(`HTTP error musickit! status: ${response.status}`);
        }
        musicKitData = await response.json();
    } catch (error) {
        console.error('Failed to initialize CSGO musickit data:', error);
    }
}

async function initializeCSGOSkinData() {
    if (skinsData) return; // Skip if already initialized

    try {
        const response = await fetch('https://bymykel.github.io/CSGO-API/api/en/skins.json');
        if (!response.ok) {
            throw new Error(`HTTP error skins! status: ${response.status}`);
        }
        skinsData = await response.json();
        skinsData = skinsData?.map((skin: APISkin) => detectDopplerPattern(skin));
        console.log('CSGO data initialized');
    } catch (error) {
        console.error('Failed to initialize CSGO data:', error);
    }
}

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

export function getKeychainData(): APIKeychain[] | null {
    return keychainData;
}

export function getSkinsData(): APISkin[] | undefined | null {
    return skinsData;
}

export function getStickerData(): APISticker[] | null {
    return stickerData;
}

export function getMusicKitData(): APIMusicKit[] | null {
    return musicKitData;
}

export function getAgentData(): APIAgent[] | null {
    return agentData;
}

export async function initData() {
    await initializeCSGOSkinData();
    await initializeCSGOStickerData();
    await initializeCSGOKeychainData();
    await initializeCSGOAgentData();
    await initializeCSGOMusicKitData();
}
