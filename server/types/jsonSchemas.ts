/**
 * JSON Schema Types for Database Storage
 * 
 * These types define the JSON structure for stickers and keychains
 * stored directly in the database as JSON columns.
 */

// ============================================================================
// STICKER JSON SCHEMA
// ============================================================================

/**
 * JSON schema for sticker data stored in database
 * Used for sticker_0 through sticker_4 columns
 */
export interface StickerJSON {
    /** Sticker ID (from CS2 item definitions) */
    id: number;
    /** X-axis position offset */
    x: number;
    /** Y-axis position offset */
    y: number;
    /** Wear/condition of the sticker (0-1) */
    wear: number;
    /** Scale/size of the sticker */
    scale: number;
    /** Rotation angle in degrees */
    rotation: number;
}

// ============================================================================
// KEYCHAIN JSON SCHEMA
// ============================================================================

/**
 * JSON schema for keychain data stored in database
 * Includes wrapped_sticker_id and highlight_reel_id directly
 */
export interface KeychainJSON {
    /** Keychain ID (from CS2 item definitions) */
    id: number;
    /** X-axis position offset */
    x: number;
    /** Y-axis position offset */
    y: number;
    /** Z-axis position offset */
    z: number;
    /** Random seed for keychain generation */
    seed: number;
    /** ID of the sticker wrapped inside the charm (for Sticker Slabs) */
    wrapped_sticker_id?: number | null;
    /** ID of the highlight reel (for Highlight Reel charms) */
    highlight_reel_id?: number | null;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Creates an empty/default sticker JSON (null)
 */
export const createEmptyStickerJSON = (): StickerJSON | null => null;

/**
 * Creates an empty/default keychain JSON (null)
 */
export const createEmptyKeychainJSON = (): KeychainJSON | null => null;

/**
 * Validates a sticker JSON object
 */
export const isValidStickerJSON = (sticker: unknown): sticker is StickerJSON => {
    if (!sticker || typeof sticker !== 'object') return false;
    const s = sticker as Record<string, unknown>;
    return (
        typeof s.id === 'number' &&
        typeof s.x === 'number' &&
        typeof s.y === 'number' &&
        typeof s.wear === 'number' &&
        typeof s.scale === 'number' &&
        typeof s.rotation === 'number'
    );
};

/**
 * Validates a keychain JSON object
 */
export const isValidKeychainJSON = (keychain: unknown): keychain is KeychainJSON => {
    if (!keychain || typeof keychain !== 'object') return false;
    const k = keychain as Record<string, unknown>;
    return (
        typeof k.id === 'number' &&
        typeof k.x === 'number' &&
        typeof k.y === 'number' &&
        typeof k.z === 'number' &&
        typeof k.seed === 'number'
    );
};

/**
 * Checks if a sticker is empty (id is 0 or missing)
 */
export const isEmptySticker = (sticker: StickerJSON | null | undefined): boolean => {
    return !sticker || sticker.id === 0;
};

/**
 * Checks if a keychain is empty (id is 0 or missing)
 */
export const isEmptyKeychain = (keychain: KeychainJSON | null | undefined): boolean => {
    return !keychain || keychain.id === 0;
};
