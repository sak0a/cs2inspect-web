import { DEFINDEX_RANGES, STICKER_CONFIG, KEYCHAIN_CONFIG } from './constants';

// ============================================================================
// ITEM TYPE DETECTION UTILITIES
// ============================================================================

/**
 * Determines the item type based on definition index
 * @param defindex Item definition index
 * @returns Item type ('weapon', 'knife', or 'glove')
 */
export function detectItemType(defindex: number): 'weapon' | 'knife' | 'glove' {
    // Check if it's a knife
    if ((defindex >= DEFINDEX_RANGES.KNIVES.MIN && defindex <= DEFINDEX_RANGES.KNIVES.MAX) ||
        DEFINDEX_RANGES.KNIVES.ADDITIONAL.includes(defindex)) {
        return 'knife';
    }
    
    // Check if it's a glove
    if (defindex >= DEFINDEX_RANGES.GLOVES.MIN && defindex <= DEFINDEX_RANGES.GLOVES.MAX) {
        return 'glove';
    }
    
    // Default to weapon
    return 'weapon';
}

/**
 * Checks if a definition index is valid for weapons
 * @param defindex Definition index to check
 * @returns True if valid weapon defindex
 */
export function isValidWeaponDefindex(defindex: number): boolean {
    return defindex >= DEFINDEX_RANGES.WEAPONS.MIN && 
           defindex <= DEFINDEX_RANGES.WEAPONS.MAX;
}

/**
 * Checks if a definition index is valid for knives
 * @param defindex Definition index to check
 * @returns True if valid knife defindex
 */
export function isValidKnifeDefindex(defindex: number): boolean {
    return (defindex >= DEFINDEX_RANGES.KNIVES.MIN && defindex <= DEFINDEX_RANGES.KNIVES.MAX) ||
           DEFINDEX_RANGES.KNIVES.ADDITIONAL.includes(defindex);
}

/**
 * Checks if a definition index is valid for gloves
 * @param defindex Definition index to check
 * @returns True if valid glove defindex
 */
export function isValidGloveDefindex(defindex: number): boolean {
    return defindex >= DEFINDEX_RANGES.GLOVES.MIN && 
           defindex <= DEFINDEX_RANGES.GLOVES.MAX;
}

// ============================================================================
// DATA TRANSFORMATION UTILITIES
// ============================================================================

/**
 * Safely parses a number from string or number input
 * @param value Value to parse
 * @param defaultValue Default value if parsing fails
 * @returns Parsed number or default value
 */
export function safeParseNumber(value: any, defaultValue: number = 0): number {
    if (typeof value === 'number' && !isNaN(value)) {
        return value;
    }
    
    if (typeof value === 'string') {
        const parsed = parseFloat(value);
        return isNaN(parsed) ? defaultValue : parsed;
    }
    
    return defaultValue;
}

/**
 * Safely parses an integer from string or number input
 * @param value Value to parse
 * @param defaultValue Default value if parsing fails
 * @returns Parsed integer or default value
 */
export function safeParseInt(value: any, defaultValue: number = 0): number {
    if (typeof value === 'number' && !isNaN(value)) {
        return Math.floor(value);
    }
    
    if (typeof value === 'string') {
        const parsed = parseInt(value, 10);
        return isNaN(parsed) ? defaultValue : parsed;
    }
    
    return defaultValue;
}

/**
 * Clamps a number between min and max values
 * @param value Value to clamp
 * @param min Minimum value
 * @param max Maximum value
 * @returns Clamped value
 */
export function clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
}

/**
 * Converts a hex color to RGBA format
 * @param hex Hex color string (e.g., '#FF0000')
 * @param alpha Alpha value (0-1)
 * @returns RGBA color string
 */
export function hexToRgba(hex: string, alpha: string | number = '1'): string {
    const cleanHex = hex.replace('#', '');
    const r = parseInt(cleanHex.substr(0, 2), 16);
    const g = parseInt(cleanHex.substr(2, 2), 16);
    const b = parseInt(cleanHex.substr(4, 2), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// ============================================================================
// STICKER AND KEYCHAIN UTILITIES
// ============================================================================

/**
 * Creates an empty sticker database string
 * @returns Empty sticker string in database format
 */
export function createEmptySticker(): string {
    return STICKER_CONFIG.EMPTY_STICKER;
}

/**
 * Creates an empty keychain database string
 * @returns Empty keychain string in database format
 */
export function createEmptyKeychain(): string {
    return KEYCHAIN_CONFIG.EMPTY_KEYCHAIN;
}

/**
 * Validates a sticker slot index
 * @param slot Slot index to validate
 * @returns True if valid slot index
 */
export function isValidStickerSlot(slot: number): boolean {
    return slot >= 0 && slot < STICKER_CONFIG.MAX_SLOTS;
}

/**
 * Parses sticker data from database string format
 * @param stickerString Database string in format: id;x;y;wear;scale;rotation
 * @returns Parsed sticker data object or null if empty
 */
export function parseStickerString(stickerString: string) {
    if (!stickerString || stickerString === STICKER_CONFIG.EMPTY_STICKER) {
        return null;
    }
    
    const [id, x, y, wear, scale, rotation] = stickerString.split(';');
    
    return {
        id: safeParseInt(id),
        x: safeParseNumber(x),
        y: safeParseNumber(y),
        wear: safeParseNumber(wear),
        scale: safeParseNumber(scale, 1),
        rotation: safeParseInt(rotation)
    };
}

/**
 * Parses keychain data from database string format
 * @param keychainString Database string in format: id;x;y;z;seed
 * @returns Parsed keychain data object or null if empty
 */
export function parseKeychainString(keychainString: string) {
    if (!keychainString || keychainString === KEYCHAIN_CONFIG.EMPTY_KEYCHAIN) {
        return null;
    }
    
    const [id, x, y, z, seed] = keychainString.split(';');
    
    return {
        id: safeParseInt(id),
        x: safeParseNumber(x),
        y: safeParseNumber(y),
        z: safeParseNumber(z),
        seed: safeParseInt(seed)
    };
}

// ============================================================================
// STRING AND VALIDATION UTILITIES
// ============================================================================

/**
 * Checks if a string is empty or only whitespace
 * @param str String to check
 * @returns True if string is empty or whitespace
 */
export function isEmpty(str: string | null | undefined): boolean {
    return !str || str.trim().length === 0;
}

/**
 * Truncates a string to a maximum length with ellipsis
 * @param str String to truncate
 * @param maxLength Maximum length
 * @param suffix Suffix to add (default: '...')
 * @returns Truncated string
 */
export function truncateString(str: string, maxLength: number, suffix: string = '...'): string {
    if (str.length <= maxLength) {
        return str;
    }
    return str.substring(0, maxLength - suffix.length) + suffix;
}

/**
 * Capitalizes the first letter of a string
 * @param str String to capitalize
 * @returns Capitalized string
 */
export function capitalize(str: string): string {
    if (!str) return str;
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

/**
 * Converts a string to kebab-case
 * @param str String to convert
 * @returns Kebab-case string
 */
export function toKebabCase(str: string): string {
    return str
        .replace(/([a-z])([A-Z])/g, '$1-$2')
        .replace(/[\s_]+/g, '-')
        .toLowerCase();
}

/**
 * Converts a string to camelCase
 * @param str String to convert
 * @returns CamelCase string
 */
export function toCamelCase(str: string): string {
    return str
        .replace(/[-_\s]+(.)?/g, (_, char) => char ? char.toUpperCase() : '')
        .replace(/^[A-Z]/, char => char.toLowerCase());
}

// ============================================================================
// ARRAY AND OBJECT UTILITIES
// ============================================================================

/**
 * Removes duplicate items from an array based on a key function
 * @param array Array to deduplicate
 * @param keyFn Function to extract comparison key
 * @returns Array with duplicates removed
 */
export function uniqueBy<T>(array: T[], keyFn: (item: T) => any): T[] {
    const seen = new Set();
    return array.filter(item => {
        const key = keyFn(item);
        if (seen.has(key)) {
            return false;
        }
        seen.add(key);
        return true;
    });
}

/**
 * Groups array items by a key function
 * @param array Array to group
 * @param keyFn Function to extract grouping key
 * @returns Object with grouped items
 */
export function groupBy<T>(array: T[], keyFn: (item: T) => string): Record<string, T[]> {
    return array.reduce((groups, item) => {
        const key = keyFn(item);
        if (!groups[key]) {
            groups[key] = [];
        }
        groups[key].push(item);
        return groups;
    }, {} as Record<string, T[]>);
}

/**
 * Picks specific properties from an object
 * @param obj Object to pick from
 * @param keys Keys to pick
 * @returns New object with only picked properties
 */
export function pick<T, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> {
    const result = {} as Pick<T, K>;
    keys.forEach(key => {
        if (key in obj) {
            result[key] = obj[key];
        }
    });
    return result;
}

/**
 * Omits specific properties from an object
 * @param obj Object to omit from
 * @param keys Keys to omit
 * @returns New object without omitted properties
 */
export function omit<T, K extends keyof T>(obj: T, keys: K[]): Omit<T, K> {
    const result = { ...obj };
    keys.forEach(key => {
        delete result[key];
    });
    return result;
}

// ============================================================================
// FILTERING AND SEARCH UTILITIES
// ============================================================================

/**
 * Performs fuzzy search on a string
 * @param searchTerm Search term
 * @param target Target string to search in
 * @param threshold Similarity threshold (0-1)
 * @returns True if strings are similar enough
 */
export function fuzzySearch(searchTerm: string, target: string, threshold: number = 0.6): boolean {
    if (!searchTerm || !target) return false;

    const search = searchTerm.toLowerCase();
    const text = target.toLowerCase();

    // Exact match
    if (text.includes(search)) return true;

    // Calculate similarity using Levenshtein distance
    const similarity = calculateSimilarity(search, text);
    return similarity >= threshold;
}

/**
 * Calculates string similarity using Levenshtein distance
 * @param str1 First string
 * @param str2 Second string
 * @returns Similarity score (0-1)
 */
function calculateSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;

    if (longer.length === 0) return 1.0;

    const distance = levenshteinDistance(longer, shorter);
    return (longer.length - distance) / longer.length;
}

/**
 * Calculates Levenshtein distance between two strings
 * @param str1 First string
 * @param str2 Second string
 * @returns Edit distance
 */
function levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));

    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;

    for (let j = 1; j <= str2.length; j++) {
        for (let i = 1; i <= str1.length; i++) {
            const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
            matrix[j][i] = Math.min(
                matrix[j][i - 1] + 1,     // deletion
                matrix[j - 1][i] + 1,     // insertion
                matrix[j - 1][i - 1] + indicator // substitution
            );
        }
    }

    return matrix[str2.length][str1.length];
}

/**
 * Filters an array of objects by multiple criteria
 * @param items Array of items to filter
 * @param filters Object with filter criteria
 * @param options Filtering options
 * @returns Filtered array
 */
export function multiFilter<T>(
    items: T[],
    filters: Record<string, any>,
    options: {
        fuzzySearch?: boolean;
        fuzzyThreshold?: number;
        caseSensitive?: boolean;
    } = {}
): T[] {
    const { fuzzySearch: useFuzzy = false, fuzzyThreshold = 0.6, caseSensitive = false } = options;

    return items.filter(item => {
        return Object.entries(filters).every(([key, value]) => {
            if (value === null || value === undefined || value === '') {
                return true; // Skip empty filters
            }

            const itemValue = getNestedValue(item, key);
            if (itemValue === null || itemValue === undefined) {
                return false;
            }

            const itemStr = String(itemValue);
            const filterStr = String(value);

            if (useFuzzy && typeof value === 'string') {
                return fuzzySearch(filterStr, itemStr, fuzzyThreshold);
            }

            if (caseSensitive) {
                return itemStr.includes(filterStr);
            }

            return itemStr.toLowerCase().includes(filterStr.toLowerCase());
        });
    });
}

/**
 * Gets nested value from object using dot notation
 * @param obj Object to get value from
 * @param path Dot-separated path (e.g., 'rarity.name')
 * @returns Nested value or undefined
 */
export function getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
}

/**
 * Sets nested value in object using dot notation
 * @param obj Object to set value in
 * @param path Dot-separated path
 * @param value Value to set
 */
export function setNestedValue(obj: any, path: string, value: any): void {
    const keys = path.split('.');
    const lastKey = keys.pop()!;
    const target = keys.reduce((current, key) => {
        if (!(key in current)) {
            current[key] = {};
        }
        return current[key];
    }, obj);
    target[lastKey] = value;
}

// ============================================================================
// SORTING UTILITIES
// ============================================================================

/**
 * Sorts an array by multiple criteria
 * @param items Array to sort
 * @param sortBy Array of sort criteria
 * @returns Sorted array
 */
export function multiSort<T>(
    items: T[],
    sortBy: Array<{
        key: string;
        direction?: 'asc' | 'desc';
        type?: 'string' | 'number' | 'date';
    }>
): T[] {
    return [...items].sort((a, b) => {
        for (const criteria of sortBy) {
            const { key, direction = 'asc', type = 'string' } = criteria;

            const aValue = getNestedValue(a, key);
            const bValue = getNestedValue(b, key);

            let comparison = 0;

            if (type === 'number') {
                comparison = (aValue || 0) - (bValue || 0);
            } else if (type === 'date') {
                const aDate = new Date(aValue || 0);
                const bDate = new Date(bValue || 0);
                comparison = aDate.getTime() - bDate.getTime();
            } else {
                const aStr = String(aValue || '').toLowerCase();
                const bStr = String(bValue || '').toLowerCase();
                comparison = aStr.localeCompare(bStr);
            }

            if (comparison !== 0) {
                return direction === 'desc' ? -comparison : comparison;
            }
        }

        return 0;
    });
}
