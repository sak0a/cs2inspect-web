/**
 * Database record type definitions
 */

/**
 * Base database record interface
 */
export interface BaseDBRecord {
    id: string;
    created_at?: string;
    updated_at?: string;
}

/**
 * Base database item interface
 */
export interface BaseDBItem extends BaseDBRecord {
    steamid: string;
    defindex: number;
    paintindex: number;
    paintwear: number;
    paintseed: number;
}

/**
 * Loadout record in database
 */
export interface DBLoadout extends BaseDBRecord {
    steamid: string;
    name: string;
    active: boolean | number;
    selected_music?: number | null;
    selected_pin?: number | null;
    selected_agent_t?: number | null;
    selected_agent_ct?: number | null;
    selected_glove_t?: number | null;
    selected_glove_ct?: number | null;
    selected_knife_t?: number | null;
    selected_knife_ct?: number | null;
    share_code?: string;
    is_default?: boolean | number;
}

/**
 * Weapon record in database
 */
export interface DBWeapon extends BaseDBItem {
    loadoutid: string;
    active: boolean | number;
    team: number;
    stattrak: boolean | number;
    stattrak_count: number;
    stattrak_enabled?: boolean | number;
    nametag: string;
    sticker_0_id?: number;
    sticker_0_wear?: number;
    sticker_0_scale?: number;
    sticker_0_rotation?: number;
    sticker_0_x?: number;
    sticker_0_y?: number;
    sticker_1_id?: number;
    sticker_1_wear?: number;
    sticker_1_scale?: number;
    sticker_1_rotation?: number;
    sticker_1_x?: number;
    sticker_1_y?: number;
    sticker_2_id?: number;
    sticker_2_wear?: number;
    sticker_2_scale?: number;
    sticker_2_rotation?: number;
    sticker_2_x?: number;
    sticker_2_y?: number;
    sticker_3_id?: number;
    sticker_3_wear?: number;
    sticker_3_scale?: number;
    sticker_3_rotation?: number;
    sticker_3_x?: number;
    sticker_3_y?: number;
    sticker_4_id?: number;
    sticker_4_wear?: number;
    sticker_4_scale?: number;
    sticker_4_rotation?: number;
    sticker_4_x?: number;
    sticker_4_y?: number;
    keychain_id?: number;
    keychain_x?: number;
    keychain_y?: number;
    keychain_z?: number;
    keychain_seed?: number;
}

/**
 * Knife record in database
 */
export interface DBKnife extends BaseDBItem {
    loadoutid: string;
    active: boolean | number;
    team: number;
    stattrak: boolean | number;
    stattrak_count: number;
    stattrak_enabled?: boolean | number;
    nametag: string;
}

/**
 * Glove record in database
 */
export interface DBGlove extends BaseDBItem {
    loadoutid: string;
    active: boolean | number;
    team: number;
}

/**
 * Agent record in database
 */
export interface DBAgent extends BaseDBRecord {
    steamid: string;
    loadoutid: string;
    active: boolean | number;
    team: number;
    defindex: number;
    model: string;
}

/**
 * Pin record in database
 */
export interface DBPin extends BaseDBRecord {
    steamid: string;
    loadoutid: string;
    defindex: number;
}

/**
 * Music kit record in database
 */
export interface DBMusicKit extends BaseDBRecord {
    steamid: string;
    loadoutid: string;
    defindex: number;
}
