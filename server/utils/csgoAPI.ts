import { APISkin, APISticker, APIAgent, APIKeychain, APIMusicKit } from "~/server/utils/interfaces";

let skinsData: APISkin[];
let stickerData: APISticker[];
let agentData: APIAgent[];
let keychainData: APIKeychain[];
let musicKitData: APIMusicKit[];

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

async function getAPIData(url: string) {
    return await fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error ${url}! status: ${response.status}`)
            }
            return response.json()
        });
}

export async function initCSGOApiData() {
    await getAPIData('https://bymykel.github.io/CSGO-API/api/en/skins.json')
        .then(data => {
            if (!skinsData) {
                skinsData = data;
                if (skinsData) {
                    skinsData = skinsData.map((skin: APISkin) => detectDopplerPattern(skin))
                }
            }
        });
    await getAPIData('https://bymykel.github.io/CSGO-API/api/en/stickers.json')
        .then(data => !stickerData ? stickerData = data : null);
    await getAPIData('https://bymykel.github.io/CSGO-API/api/en/keychains.json')
        .then(data => !keychainData ? keychainData = data : null);
    await getAPIData('https://bymykel.github.io/CSGO-API/api/en/agents.json')
        .then(data => !agentData ? agentData = data : null);
    await getAPIData('https://bymykel.github.io/CSGO-API/api/en/music_kits.json')
        .then(data => !musicKitData ? musicKitData = data : null);
    console.log('CSGO API data loaded');
}
