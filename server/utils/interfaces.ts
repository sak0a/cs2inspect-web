import {parseInt} from "lodash-es";

/**
 * Interfactes from the CSGO-API
 */
export interface APISticker {
    id: string;
    name: string;
    description?: string;
    rarity: {
        id: string;
        name: string;
        color: string
    }
    crates?: any[]
    tournament_event: string
    tournament_team: string
    type: string
    market_hash_name?: string
    effect?: string
    image: string
}
export interface APISkin {
    id: string;
    name: string;
    description?: string;
    weapon: {
        id: string;
        name: string;
        weapon_id: string;
    }
    category: {
        id: string;
        name: string
    }
    pattern: {
        id: string;
        name: string;
    }
    min_float: number;
    max_float: number;
    rarity: {
        id: string;
        name: string;
        color: string;
    }
    stattrak?: boolean
    souvenir?: boolean
    paint_index: string
    wears?: any[]
    collections?: any[]
    crates?: any[]
    team?: {
        id: string;
        name: string;
    }
    image: string;
}
export interface APIAgent {
    id: string;
    name: string;
    description?: string;
    rarity: {
        id: string;
        name: string;
        color: string;
    }
    collections?: any[];
    team: {
        id: string;
        name: string;
    }
    market_hash_name?: string;
    image: string;
}
export interface APIMusicKit {
    id: string
    name: string
    description?: string
    rarity: {
        id: string
        name: string
        color: string
    }
    market_hash_name?: string
    exclusive?: boolean
    image: string
}
export interface APIKeychain {
    id: string;
    name: string;
    description?: string;
    rarity: {
        id: string;
        name: string;
        color: string;
    }
    market_hash_name?: string;
    image: string;
}


export enum CsTeam {
    /**
     * Original values
     */
    //None = 0,
    //Spectator = 1,
    //Terrorist = 2,
    //CounterTerrorist = 3
    None = 0,
    Terrorist = 1,
    CounterTerrorist = 2
}

export interface WeaponStickerCustomization {
    id: number
    wear: number
    scale: number
    rotation: number
    x: number
    y: number
}

export interface WeaponKeychainCustomization {
    id: number
    x: number
    y: number
    z: number
    seed: number
    api?: {
        id: string
        name: string
        color: string
    }
}

export interface WeaponCustomization {
    active: boolean
    statTrak: boolean
    statTrakCount: number
    defindex?: number
    paintIndex: number
    paintIndexOverride: boolean
    pattern: number
    wear: number
    nameTag: string
    stickers: WeaponStickerCustomization[] | null[]
    keychain: WeaponKeychainCustomization | null
    team: number
    reset?: boolean
}
export interface KnifeCustomization {
    active: boolean
    statTrak: boolean
    statTrakCount: number
    defindex?: number
    paintIndex: number
    paintIndexOverride: boolean
    pattern: number
    wear: number
    nameTag: string
    team: number
    reset?: boolean
}
export interface GloveCustomization {
    active: boolean
    defindex?: number
    paintIndex: number
    paintIndexOverride: boolean
    pattern: number
    wear: number
    team: number
    reset?: boolean
}

export interface IDefaultItem {
    weapon_defindex: number;
    defaultName: string;
    paintIndex: number;
    defaultImage: string;
    weapon_name: string;
    category: string;
    availableTeams: string;
}
export interface IEnhancedItem extends IDefaultItem {
    name: string;
    image: string;
    minFloat: number;
    maxFloat: number;
    rarity?: {
        id: string;
        name: string;
        color: string;
    };
    team: number | null;
    databaseInfo?: any
}

export interface IEnhancedWeapon extends IEnhancedItem {
    databaseInfo?: IMappedDBWeapon
}

export interface IEnhancedKnife extends IEnhancedItem {
    databaseInfo?: DBKnife
}

export interface IEnhancedGlove extends IEnhancedItem {
    databaseInfo?: DBGlove
}

export interface IMappedDBWeapon {
    active: boolean;
    team: number;
    defindex: number;
    statTrak: boolean;
    statTrakCount: number;
    paintIndex: number;
    paintWear: number;
    pattern: number;
    nameTag: string;
    stickers: (IEnhancedWeaponSticker | null)[];
    keychain: IEnhancedWeaponKeychain | null;
}

export interface IEnhancedWeaponSticker {
    id: number;
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
        rarity: {
            id: string;
            name: string;
            color: string;
        };
    }
}
export class EnhancedWeaponSticker implements IEnhancedWeaponSticker {
    id: number;
    x: number;
    y: number;
    wear: number;
    scale: number;
    rotation: number;
    api: { name: string; image: string; type: string; effect: string; tournament_event: string; tournament_team: string; rarity: { id: string; name: string; color: string; }; };

    constructor(data: IEnhancedWeaponSticker) {
        this.id = data.id;
        this.x = data.x;
        this.y = data.y;
        this.wear = data.wear;
        this.scale = data.scale;
        this.rotation = data.rotation;
        this.api = data.api;
    }

    convertToDatabaseString(): string {
        return `${this.id};${this.x};${this.y};${this.wear};${this.scale};${this.rotation}`;
    }

    static fromStringAndAPI(sticker: string, stickerData: APISticker[]): EnhancedWeaponSticker {
        const [stickerId, x, y, wear, scale, rotation] = sticker.split(';');

        const stickerInfo = stickerData.find(
            (sticker: APISticker) => sticker.id === ("sticker-" + stickerId)
        );

        return new EnhancedWeaponSticker({
            id: parseInt(stickerId),
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

    toInterface(): IEnhancedWeaponSticker | null {
        if (!this.id || this.id === 0) return null;
        return {
            id: this.id,
            x: this.x,
            y: this.y,
            wear: this.wear,
            scale: this.scale,
            rotation: this.rotation,
            api: this.api
        }
    }
}

export interface IEnhancedWeaponKeychain {
    id: number;
    x: number;
    y: number;
    z: number;
    seed: number;
    api: {
        name: string;
        image: string;
        rarity: {
            id: string;
            name: string;
            color: string;
        };
    }
}
export class EnhancedWeaponKeychain implements IEnhancedWeaponKeychain {
    id: number;
    x: number;
    y: number;
    z: number;
    seed: number;
    api: { name: string; image: string; rarity: { id: string; name: string; color: string; }; };

    constructor(data: IEnhancedWeaponKeychain) {
        this.id = data.id;
        this.x = data.x;
        this.y = data.y;
        this.z = data.z;
        this.seed = data.seed;
        this.api = data.api;
    }

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

    convertToDatabaseString(): string {
        return `${this.id};${this.x};${this.y};${this.z};${this.seed}`;
    }

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


/**
 * Interfaces from the database structure
 */
export interface DBLoadout {
    id: string;
    steamid: string;
    name: string;
    selected_knife_t: number | null;
    selected_knife_ct: number | null;
    selected_glove_t: number | null;
    selected_glove_ct: number | null;
    selected_agent_t: number | null;
    selected_agent_ct: number | null;
    created_at: string;
    updated_at: string;
}
export interface DBWeapon {
    id: string;
    steamid: string;
    loadoutid: string;
    active: boolean;
    team: number;
    defindex: number;
    paintindex: number;
    paintseed: string;
    paintwear: string;
    stattrak_enabled: boolean;
    stattrak_count: number;
    nametag: string;
    sticker_0: string;
    sticker_1: string;
    sticker_2: string;
    sticker_3: string;
    sticker_4: string;
    keychain: string;
    created_at: string;
    updated_at: string;
}
export interface DBKnife {
    id: string;
    steamid: string;
    loadoutid: string;
    active: boolean;
    team: number;
    defindex: number;
    paintindex: number;
    paintseed: string;
    paintwear: string;
    stattrak_enabled: boolean;
    stattrak_count: number;
    nametag: string;
    created_at: string;
    updated_at: string;
}
export interface DBGlove {
    id: string;
    steamid: string;
    loadoutid: string;
    active: boolean;
    team: number;
    defindex: number;
    paintindex: number;
    paintseed: string;
    paintwear: string;
    created_at: string;
    updated_at: string;
}
export interface DBPin {
    id: string;
    steamid: string;
    loadoutid: string;
    active: boolean
    team: number
    pinid: number;
    created_at: string;
    updated_at: string;
}
export interface DBMusicKit {
    id: string;
    steamid: string;
    loadoutid: string;
    active: boolean
    team: number;
    musicid: number;
    created_at: string;
    updated_at: string;
}
export interface DBAgent {
    id: string;
    steamid: string;
    loadoutid: string;
    active: boolean
    team: number;
    defindex: number;
    agent_name: string;
    created_at: string;
    updated_at: string;
}
