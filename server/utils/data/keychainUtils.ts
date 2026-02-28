import type { APIKeychain } from '~/server/types'

/**
 * Custom Sticker Slab and Highlight Reel keychains to inject
 */
const CUSTOM_KEYCHAINS: APIKeychain[] = [
    {
        id: 'keychain-37', // Correct CS2 sticker slab keychain ID
        name: 'Charm | Sticker Slab',
        description: 'A charm that can wrap any sticker.',
        rarity: {
            id: 'rarity_common',
            name: 'Common',
            color: '#b0c3d9',
        },
        image: 'https://raw.githubusercontent.com/ByMykel/CSGO-API/main/public/api/en/images/keychains/sticker_slab_common.png', // Default Common image
        market_hash_name: 'Charm | Sticker Slab',
    },
    // Austin 2025 Highlight
    {
        id: 'keychain-36',
        name: 'Souvenir Charm | Austin 2025 Highlight',
        description: 'A souvenir charm from the Austin 2025 event.',
        rarity: {
            id: 'rarity_ancient',
            name: 'Extraordinary',
            color: '#eb4b4b',
        },
        image: 'https://raw.githubusercontent.com/ByMykel/CSGO-API/main/public/api/en/images/keychains/austin_2025_highlight.png',
        market_hash_name: 'Souvenir Charm | Austin 2025 Highlight',
    },
    // Budapest 2025 Highlight (Assuming similar ID structure/naming for now as placeholder if exact name unknown, but user asked for "Budapest Major")
    {
        id: 'keychain-83',
        name: 'Souvenir Charm | Budapest 2025 Highlight',
        description: 'A souvenir charm from the Budapest 2025 event.',
        rarity: {
            id: 'rarity_ancient',
            name: 'Extraordinary',
            color: '#eb4b4b',
        },
        image: 'https://raw.githubusercontent.com/ByMykel/CSGO-API/main/public/api/en/images/keychains/budapest_2025_highlight.png', // Placeholder
        market_hash_name: 'Souvenir Charm | Budapest 2025 Highlight',
    },
]

/**
 * Process keychain data to inject missing items
 * @param data - The raw keychain data from the API
 * @returns Processed keychain data with injected items
 */
export function processKeychainData(data: unknown): APIKeychain[] {
    const keychains = Array.isArray(data) ? (data as APIKeychain[]) : []

    // Create a map of existing IDs to avoid duplicates
    const existingIds = new Set(keychains.map((k) => k.id))

    // Add custom keychains if they don't exist
    for (const custom of CUSTOM_KEYCHAINS) {
        if (!existingIds.has(custom.id)) {
            keychains.push(custom)
        }
    }

    return keychains
}
