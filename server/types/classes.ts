/**
 * Class implementations for enhanced items
 * Moved from server/utils/interfaces.ts for better organization
 */

import { parseInt } from "lodash-es";
import type {
    IEnhancedWeaponSticker,
    IEnhancedWeaponKeychain
} from './items'
import type {
    APISticker,
    APIKeychain,
    ItemRarity
} from './api'

// ============================================================================
// ENHANCED WEAPON STICKER CLASS
// ============================================================================

/**
 * Enhanced weapon sticker class
 * Implements IEnhancedWeaponSticker with database conversion methods
 */
export class EnhancedWeaponSticker implements IEnhancedWeaponSticker {
    id: number;
    slot: number;
    x: number;
    y: number;
    wear: number;
    scale: number;
    rotation: number;
    api: {
        name: string;
        image: string;
        type: string;
        effect: string;
        tournament_event: string;
        tournament_team: string;
        rarity: ItemRarity;
    };

    constructor(data: IEnhancedWeaponSticker) {
        this.id = data.id;
        this.slot = data.slot;
        this.x = data.x;
        this.y = data.y;
        this.wear = data.wear;
        this.scale = data.scale;
        this.rotation = data.rotation;
        this.api = data.api;
    }

    /**
     * Converts sticker data to database string format
     * Format: id;x;y;wear;scale;rotation
     */
    convertToDatabaseString(): string {
        return `${this.id};${this.x};${this.y};${this.wear};${this.scale};${this.rotation}`;
    }

    /**
     * Creates EnhancedWeaponSticker from database string and API data
     * @param sticker Database string in format: id;x;y;wear;scale;rotation
     * @param stickerData Array of API sticker data
     * @param slot Slot index (0-4) where this sticker is placed
     */
    static fromStringAndAPI(sticker: string, stickerData: APISticker[], slot: number): EnhancedWeaponSticker {
        const [stickerId, x, y, wear, scale, rotation] = sticker.split(';');

        const stickerInfo = stickerData.find(
            (sticker: APISticker) => sticker.id === ("sticker-" + stickerId)
        );

        return new EnhancedWeaponSticker({
            id: parseInt(stickerId),
            slot: slot,
            x: parseFloat(x),
            y: parseFloat(y),
            wear: parseFloat(wear),
            scale: parseFloat(scale),
            rotation: parseInt(rotation),
            api: {
                name: stickerInfo?.name ?? '',
                image: stickerInfo?.image ?? '',
                type: stickerInfo?.type ?? '',
                effect: stickerInfo?.effect ?? '',
                tournament_event: stickerInfo?.tournament_event ?? '',
                tournament_team: stickerInfo?.tournament_team ?? '',
                rarity: stickerInfo?.rarity || {
                    id: 'default',
                    name: 'Default',
                    color: '#000000'
                }
            }
        })
    }

    /**
     * Converts to interface format, returns null if sticker is empty
     */
    toInterface(): IEnhancedWeaponSticker | null {
        if (!this.id || this.id === 0) return null;
        return {
            id: this.id,
            slot: this.slot,
            x: this.x,
            y: this.y,
            wear: this.wear,
            scale: this.scale,
            rotation: this.rotation,
            api: this.api
        }
    }
}

// ============================================================================
// ENHANCED WEAPON KEYCHAIN CLASS
// ============================================================================

/**
 * Enhanced weapon keychain class
 * Implements IEnhancedWeaponKeychain with database conversion methods
 */
export class EnhancedWeaponKeychain implements IEnhancedWeaponKeychain {
    id: number;
    x: number;
    y: number;
    z: number;
    seed: number;
    api: { name: string; image: string; rarity: ItemRarity; };

    constructor(data: IEnhancedWeaponKeychain) {
        this.id = data.id;
        this.x = data.x;
        this.y = data.y;
        this.z = data.z;
        this.seed = data.seed;
        this.api = data.api;
    }

    /**
     * Creates EnhancedWeaponKeychain from database string and API data
     * @param keychain Database string in format: id;x;y;z;seed
     * @param keychainData Array of API keychain data
     */
    static fromStringAndAPI(keychain: string, keychainData: APIKeychain[]): EnhancedWeaponKeychain {
        const [keychainId, x, y, z, seed] = keychain.split(';');
        const keychainInfo = keychainData.find((k: APIKeychain) => k.id === ("keychain-" + keychainId));

        return new EnhancedWeaponKeychain({
            id: parseInt(keychainId),
            x: parseFloat(x),
            y: parseFloat(y),
            z: parseFloat(z),
            seed: parseInt(seed),
            api: {
                name: keychainInfo?.name || '',
                image: keychainInfo?.image || '',
                rarity: keychainInfo?.rarity || { id: 'default', name: 'Default', color: '#000000' }
            }
        });
    }

    /**
     * Converts keychain data to database string format
     * Format: id;x;y;z;seed
     */
    convertToDatabaseString(): string {
        return `${this.id};${this.x};${this.y};${this.z};${this.seed}`;
    }

    /**
     * Converts to interface format, returns null if keychain is empty
     */
    toInterface(): IEnhancedWeaponKeychain | null {
        if (!this.id || this.id === 0) return null;
        return {
            id: this.id,
            x: this.x,
            y: this.y,
            z: this.z,
            seed: this.seed,
            api: this.api
        }
    }
}
