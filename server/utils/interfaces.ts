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


export interface WeaponCustomization {
    active: boolean
    statTrak: boolean
    statTrakCount: number
    paintIndex: number
    paintIndexOverride: boolean
    pattern: number
    wear: number
    nameTag: string
    stickers: any[]
    keychain: any | null
    team: number | null
}

export interface EnhancedSticker {
    id: number;
    x: number;
    y: number;
    wear: number;
    scale: number;
    rotation: number;
    api: {

    }
}

export interface DefaultWeapon {
    weapon_defindex: number;
    defaultName: string;
    paintIndex: number;
    defaultImage: string;
    weapon_name: string;
    category: string;
}

export interface EnhancedWeaponResponse extends DefaultWeapon {
    name: string;
    defaultName: string;
    image: string;
    defaultImage: string;
    minFloat: number;
    maxFloat: number;
    paintIndex: number;
    rarity?: {
        id: string;
        name: string;
        color: string;
    };
    availableTeams?: string;
    databaseInfo?: {
        active: boolean;
        team: number;
        defindex: number;
        statTrak: boolean;
        statTrakCount: number;
        paintIndex: number;
        paintWear: number;
        pattern: number;
        nameTag: string;
        stickers: any[];
        keychain: any;
    };
}

export interface DBLoadout {
    id: string;
    steamid: string;
    name: string;
    created_at: string;
    updated_at: string;
}
export interface DBSticker {
    id: number;
    x: number;
    y: number;
    wear: number;
    scale: number;
    rotation: number;
}
export interface DBKeychain {
    id: string;
    x: number;
    y: number;
    z: number;
    seed: number;
}
// Rifles, Heavy, SMGs, Pistols
export interface DBWeapon {
    id: string;
    steamid: string;
    loadoutid: string;
    active: boolean
    team: number
    defindex: number;
    paintindex: number;
    paintseed: string;
    paintwear: string;
    stattrak_enabled: boolean;
    stattrak_count: number;
    nametag: string;
    sticker_0: DBSticker | string | null;
    sticker_1: DBSticker | string | null;
    sticker_2: DBSticker | string | null;
    sticker_3: DBSticker | string | null;
    sticker_4: DBSticker | string | null;
    keychain: DBKeychain | string | null;
    created_at: string;
    updated_at: string;
}
export interface DBKnife {
    id: string;
    steamid: string;
    loadoutid: string;
    active: boolean
    team: number
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
    active: boolean
    team: number
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
