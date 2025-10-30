import { APISkin, IDefaultItem, IEnhancedItem, WeaponCustomization } from './interfaces';
import { multiFilter, getNestedValue, hexToRgba } from './commonUtils';

// ============================================================================
// SKIN MATCHING AND FINDING UTILITIES
// ============================================================================

/**
 * Generic utility function to find a matching skin for either weapon or knife
 * @param baseItem Base weapon or knife item
 * @param databaseItem Database weapon or knife record
 * @param skinsData Array of available skins
 * @returns Matching skin or undefined if no match found
 */
export function findMatchingSkin<T extends { weapon_name: string }, U extends { paintindex: number | string }>(
    baseItem: T,
    databaseItem: U | undefined,
    skinsData: APISkin[]
): APISkin | undefined {
    if (!databaseItem) return undefined;

    // Convert paintindex to string for consistent comparison
    const paintIndexStr = databaseItem.paintindex.toString();

    console.log('findMatchingSkin: Looking for skin with weapon_name:', baseItem.weapon_name, 'paintindex:', paintIndexStr);

    const matchingSkin = skinsData.find(skin => {
        const weaponMatch = skin.weapon?.id === baseItem.weapon_name;
        const paintMatch = skin.paint_index === paintIndexStr;

        if (weaponMatch && paintMatch) {
            console.log('findMatchingSkin: Found matching skin:', skin.name, 'for weapon:', baseItem.weapon_name);
        }

        return weaponMatch && paintMatch;
    });

    if (!matchingSkin) {
        console.warn('findMatchingSkin: No matching skin found for weapon:', baseItem.weapon_name, 'paintindex:', paintIndexStr);
        // Log available skins for this weapon to help debug
        const weaponSkins = skinsData.filter(skin => skin.weapon?.id === baseItem.weapon_name);
        //console.log('findMatchingSkin: Available skins for', baseItem.weapon_name, ':', weaponSkins.map(s => ({ name: s.name, paint_index: s.paint_index })));
    }

    return matchingSkin;
}

/**
 * Finds skins by weapon name
 * @param weaponName Weapon name to search for
 * @param skinsData Array of available skins
 * @returns Array of matching skins
 */
export function findSkinsByWeapon(weaponName: string, skinsData: APISkin[]): APISkin[] {
    return skinsData.filter(skin => skin.weapon?.id === weaponName);
}

/**
 * Finds skins by rarity
 * @param rarityName Rarity name to search for
 * @param skinsData Array of available skins
 * @returns Array of matching skins
 */
export function findSkinsByRarity(rarityName: string, skinsData: APISkin[]): APISkin[] {
    return skinsData.filter(skin => 
        skin.rarity?.name.toLowerCase() === rarityName.toLowerCase()
    );
}

/**
 * Finds skins by paint index
 * @param paintIndex Paint index to search for
 * @param skinsData Array of available skins
 * @returns Matching skin or undefined
 */
export function findSkinByPaintIndex(paintIndex: string | number, skinsData: APISkin[]): APISkin | undefined {
    return skinsData.find(skin => skin.paint_index === paintIndex.toString());
}

// ============================================================================
// SKIN FILTERING AND SEARCH UTILITIES
// ============================================================================

/**
 * Interface for skin filter criteria
 */
export interface SkinFilterCriteria {
    search?: string;
    weapon?: string;
    rarity?: string;
    category?: string;
    minFloat?: number;
    maxFloat?: number;
    stattrak?: boolean;
    souvenir?: boolean;
    team?: string;
}

/**
 * Filters skins based on multiple criteria
 * @param skins Array of skins to filter
 * @param criteria Filter criteria
 * @param options Filtering options
 * @returns Filtered array of skins
 */
export function filterSkins(
    skins: APISkin[], 
    criteria: SkinFilterCriteria,
    options: {
        fuzzySearch?: boolean;
        fuzzyThreshold?: number;
        caseSensitive?: boolean;
    } = {}
): APISkin[] {
    return skins.filter(skin => {
        // Search term filter (checks name and description)
        if (criteria.search) {
            const searchTerm = options.caseSensitive ? criteria.search : criteria.search.toLowerCase();
            const skinName = options.caseSensitive ? skin.name : skin.name.toLowerCase();
            const skinDesc = options.caseSensitive ? (skin.description || '') : (skin.description || '').toLowerCase();
            
            if (!skinName.includes(searchTerm) && !skinDesc.includes(searchTerm)) {
                return false;
            }
        }

        // Weapon type filter
        if (criteria.weapon && 
            !skin.weapon?.id.toLowerCase().includes(criteria.weapon.toLowerCase())) {
            return false;
        }

        // Rarity filter
        if (criteria.rarity && 
            skin.rarity?.name.toLowerCase() !== criteria.rarity.toLowerCase()) {
            return false;
        }

        // Category filter
        if (criteria.category && 
            skin.category?.name.toLowerCase() !== criteria.category.toLowerCase()) {
            return false;
        }

        // Float range filters
        if (criteria.minFloat !== undefined && skin.min_float < criteria.minFloat) {
            return false;
        }
        if (criteria.maxFloat !== undefined && skin.max_float > criteria.maxFloat) {
            return false;
        }

        // StatTrak filter
        if (criteria.stattrak !== undefined && skin.stattrak !== criteria.stattrak) {
            return false;
        }

        // Souvenir filter
        if (criteria.souvenir !== undefined && skin.souvenir !== criteria.souvenir) {
            return false;
        }

        // Team filter
        if (criteria.team && skin.team?.name.toLowerCase() !== criteria.team.toLowerCase()) {
            return false;
        }

        return true;
    });
}

// ============================================================================
// SKIN DATA PROCESSING UTILITIES
// ============================================================================

/**
 * Detects and processes Doppler pattern names
 * @param skin Skin to process
 * @returns Processed skin with updated name
 */
export function detectDopplerPattern(skin: APISkin): APISkin {
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

/**
 * Processes skin data array with various enhancements
 * @param skins Array of skins to process
 * @returns Processed skins array
 */
export function processSkinData(skins: APISkin[]): APISkin[] {
    return skins.map(skin => detectDopplerPattern(skin));
}

/**
 * Removes StatTrak duplicates from skin array
 * @param skins Array of skins
 * @returns Array with StatTrak duplicates removed
 */
export function removeStatTrakDuplicates(skins: APISkin[]): APISkin[] {
    const seen = new Set<string>();
    return skins.filter(skin => {
        // Create a key without StatTrak indicator
        const key = `${skin.weapon?.id}-${skin.paint_index}`;
        if (seen.has(key)) {
            // If we've seen this skin before, only keep it if it's not StatTrak
            return !skin.stattrak;
        }
        seen.add(key);
        return true;
    });
}

// ============================================================================
// SKIN ENHANCEMENT UTILITIES
// ============================================================================

/**
 * Creates an enhanced item from a base item
 * @param baseItem Base item to enhance
 * @returns Enhanced item array
 */
export function createDefaultItem<T>(baseItem: IDefaultItem): T[] {
    return [{
        weapon_defindex: baseItem.weapon_defindex,
        weapon_name: baseItem.weapon_name,
        name: baseItem.defaultName,
        defaultName: baseItem.defaultName,
        image: baseItem.defaultImage,
        defaultImage: baseItem.defaultImage,
        category: baseItem.category,
        minFloat: 0,
        maxFloat: 1,
        paintIndex: 0,
        availableTeams: baseItem.availableTeams,
        team: null,
        rarity: undefined,
        databaseInfo: undefined
    } as T];
}

/**
 * Creates an enhanced item from API skin data
 * @param baseItem Base item
 * @param skin API skin data
 * @returns Enhanced item
 */
export function createEnhancedItemFromSkin<T extends IEnhancedItem>(
    baseItem: IDefaultItem, 
    skin: APISkin
): T {
    return {
        ...baseItem,
        name: skin.name,
        image: skin.image,
        minFloat: skin.min_float,
        maxFloat: skin.max_float,
        paintIndex: Number(skin.paint_index),
        rarity: skin.rarity,
        team: skin.team ? (skin.team.name.toLowerCase() === 'terrorist' ? 1 : 2) : null,
        databaseInfo: undefined
    } as T;
}

// ============================================================================
// SKIN VALIDATION UTILITIES
// ============================================================================

/**
 * Checks if a skin has stickers
 * @param skin Skin object to check
 * @returns True if skin has stickers
 */
export function hasStickers(skin: any): boolean {
    return skin.stickers && Array.isArray(skin.stickers) && skin.stickers.length > 0;
}

/**
 * Gets sticker names from a skin
 * @param skin Skin object
 * @returns Array of sticker names
 */
export function getStickerNames(skin: any): string[] {
    if (!hasStickers(skin)) return [];
    return skin.stickers.map((sticker: any) => sticker.api?.name || sticker.name || '').filter(Boolean);
}

/**
 * Checks if a skin has a keychain
 * @param skin Skin object to check
 * @returns True if skin has a keychain
 */
export function hasKeychain(skin: any): boolean {
    return skin.keychain && skin.keychain.id && skin.keychain.id !== 0;
}

/**
 * Validates skin paint index
 * @param paintIndex Paint index to validate
 * @returns True if valid paint index
 */
export function isValidPaintIndex(paintIndex: string | number): boolean {
    const index = Number(paintIndex);
    return !isNaN(index) && index >= 0;
}

/**
 * Validates skin float value
 * @param floatValue Float value to validate
 * @param minFloat Minimum allowed float
 * @param maxFloat Maximum allowed float
 * @returns True if valid float value
 */
export function isValidFloat(floatValue: number, minFloat: number = 0, maxFloat: number = 1): boolean {
    return floatValue >= minFloat && floatValue <= maxFloat;
}

// ============================================================================
// SKIN DISPLAY UTILITIES
// ============================================================================

/**
 * Formats skin name for display (removes weapon name prefix)
 * @param skinName Full skin name
 * @param weaponName Weapon name to remove
 * @returns Formatted skin name
 */
export function formatSkinNameForDisplay(skinName: string, weaponName: string): string {
    // Remove "★ " prefix and weapon name
    return skinName
        .replace(/^★\s+/, '')
        .replace(new RegExp(`^${weaponName}\\s*\\|\\s*`, 'i'), '')
        .trim();
}

/**
 * Gets rarity color with alpha
 * @param rarity Rarity object
 * @param alpha Alpha value (0-1)
 * @returns RGBA color string
 */
export function getRarityColorWithAlpha(rarity: { color: string } | undefined, alpha: string | number = '0.15'): string {
    return hexToRgba(rarity?.color || '#313030', alpha);
}

/**
 * Generates CSS gradient for skin card background
 * @param rarity Rarity object
 * @returns CSS gradient string
 */
export function getSkinCardGradient(rarity: { color: string } | undefined): string {
    const color = getRarityColorWithAlpha(rarity);
    return `linear-gradient(135deg, #101010, ${color})`;
}
