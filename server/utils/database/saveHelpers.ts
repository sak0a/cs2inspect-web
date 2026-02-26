import { createError } from 'h3'
import { eq, and } from 'drizzle-orm'
import { db } from '~/server/database/client'
import { knives, gloves, pistols, rifles, smgs, heavys } from '~/server/database/schema'
import { Logger } from '~/server/utils/logger'
import { VALID_WEAPON_DEFINDEXES, VALID_KNIFE_DEFINDEXES } from '~/server/utils/constants'
import { toLoadoutId } from '~/types/core/common'
import { recordWeaponHistory, recordKnifeHistory, recordGloveHistory } from './historyHelpers'
import { notifyPluginOfWebChange } from '~/server/utils/sync/notifySync'
import type { SyncItemType, SyncItemCategory } from '#shared/types/sync'
import type { ItemHistorySnapshot } from '~/server/database/schema/itemHistory'
import type {
    WeaponCustomization,
    KnifeCustomization,
    GloveCustomization,
    IEnhancedWeaponSticker,
    IEnhancedWeaponKeychain,
    StickerJSON,
    KeychainJSON
} from '~/server/types'
import {
    EnhancedWeaponSticker,
    EnhancedWeaponKeychain
} from '~/server/types'

// Map table names to Drizzle table schemas
const weaponTableMap = {
    'wp_player_pistols': pistols,
    'wp_player_rifles': rifles,
    'wp_player_smgs': smgs,
    'wp_player_heavys': heavys,
} as const;

type WeaponTableName = keyof typeof weaponTableMap;

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

/**
 * Validates weapon defindex against known valid weapon defindexes
 */
export const validateWeaponDefindex = (defindex: number) => {
    if (!VALID_WEAPON_DEFINDEXES[defindex]) {
        Logger.warn(`Invalid weapon defindex=${defindex}`, 'db')
        throw createError({
            statusCode: 400,
            message: `Invalid Weapon Defindex: ${defindex}`
        })
    }
}

/**
 * Validates knife defindex against known valid knife defindexes
 */
export const validateKnifeDefindex = (defindex: number) => {
    if (!VALID_KNIFE_DEFINDEXES[defindex]) {
        Logger.warn(`Invalid knife defindex=${defindex}`, 'db')
        throw createError({
            statusCode: 400,
            message: `Invalid Knife Defindex: ${defindex}`
        })
    }
}

/**
 * Validate and return the Drizzle table for a weapon type
 */
export const validateWeaponDatabaseTable = (type: string): string => {
    const typeMap: Record<string, string> = {
        'pistols': 'wp_player_pistols',
        'rifles': 'wp_player_rifles',
        'smgs': 'wp_player_smgs',
        'heavys': 'wp_player_heavys'
    };

    const tableName = typeMap[type.toLowerCase()];
    if (!tableName) {
        throw createError({
            statusCode: 400,
            message: `Invalid weapon type: ${type}`
        });
    }

    return tableName;
}

// ============================================================================
// FORMAT HELPERS
// ============================================================================

/**
 * Formats weapon stickers for database storage as JSON
 */
export const formatWeaponStickers = (stickers: (IEnhancedWeaponSticker | null)[]) => {
    const formattedStickers: (StickerJSON | null)[] = stickers.map(
        sticker => sticker ? new EnhancedWeaponSticker(sticker).toJSON() : null
    );

    while (formattedStickers.length < 5) {
        formattedStickers.push(null);
    }

    return formattedStickers;
}

/**
 * Formats weapon keychain for database storage as JSON
 */
export const formatWeaponKeychain = (keychain: { id?: number | string; x?: number; y?: number; z?: number; seed?: number; wrapped_sticker_id?: number; highlight_reel_id?: number } | null): KeychainJSON | null => {
    if (!keychain || keychain.id === 0 || keychain.id === '0') {
        return null;
    }

    return new EnhancedWeaponKeychain(keychain as IEnhancedWeaponKeychain).toJSON();
}

// ============================================================================
// GENERIC SAVE ITEM
// ============================================================================

interface SaveItemConfig<TBody> {
    /** Item type label for logging */
    itemLabel: string
    /** Drizzle table reference */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    table: any
    /** Build the DB fields for update from the body */
    buildUpdateFields: (body: TBody) => Record<string, unknown>
    /** Build the DB fields for insert from the body */
    buildInsertFields: (body: TBody, steamId: string, loadoutIdNum: number) => Record<string, unknown>
    /** Build the history snapshot from the body */
    buildSnapshot: (body: TBody) => ItemHistorySnapshot
    /** Record history before save */
    recordHistory: (steamId: string, loadoutId: string, defindex: number, team: number, snapshot: ItemHistorySnapshot) => Promise<void>
    /** Sync metadata for real-time plugin notifications */
    syncMeta?: {
        itemType: SyncItemType
        itemCategory?: SyncItemCategory
    }
}

/**
 * Generic save function that handles the shared flow:
 * check existing → handle reset/delete → record history → update or insert → return response
 */
async function saveItem<TBody extends { defindex: number; team: number; reset?: boolean }>(
    config: SaveItemConfig<TBody>,
    steamId: string,
    loadoutId: string,
    body: TBody
): Promise<{ success: boolean; message: string }> {
    try {
        const loadoutIdNum = toLoadoutId(loadoutId)
        const { table, itemLabel } = config

        // Handle reset case
        if (body.reset) {
            await db.delete(table).where(and(
                eq(table.steamid, steamId),
                eq(table.loadoutid, loadoutIdNum),
                eq(table.team, body.team),
                eq(table.defindex, body.defindex)
            ))
            Logger.debug(`${itemLabel} delete ok`, 'db')
            if (config.syncMeta) {
                notifyPluginOfWebChange(steamId, loadoutIdNum, config.syncMeta.itemType, config.syncMeta.itemCategory).catch(() => {})
            }
            return { success: true, message: `${itemLabel} deleted successfully` }
        }

        // Check for existing record
        const existing = await db.select()
            .from(table)
            .where(and(
                eq(table.steamid, steamId),
                eq(table.loadoutid, loadoutIdNum),
                eq(table.team, body.team),
                eq(table.defindex, body.defindex)
            ))
            .limit(1)

        // Record history BEFORE update
        const snapshot = config.buildSnapshot(body)
        await config.recordHistory(steamId, loadoutId, body.defindex, body.team, snapshot)

        // Update or insert
        if (existing.length > 0) {
            await db.update(table)
                .set(config.buildUpdateFields(body))
                .where(and(
                    eq(table.steamid, steamId),
                    eq(table.loadoutid, loadoutIdNum),
                    eq(table.defindex, body.defindex),
                    eq(table.team, body.team)
                ))
            Logger.debug(`${itemLabel} update ok`, 'db')
            if (config.syncMeta) {
                notifyPluginOfWebChange(steamId, loadoutIdNum, config.syncMeta.itemType, config.syncMeta.itemCategory).catch(() => {})
            }
            return { success: true, message: `${itemLabel} updated successfully` }
        } else {
            await db.insert(table).values(config.buildInsertFields(body, steamId, loadoutIdNum))
            Logger.debug(`${itemLabel} create ok`, 'db')
            if (config.syncMeta) {
                notifyPluginOfWebChange(steamId, loadoutIdNum, config.syncMeta.itemType, config.syncMeta.itemCategory).catch(() => {})
            }
            return { success: true, message: `${itemLabel} created successfully` }
        }
    } catch (error: unknown) {
        // Re-throw H3 errors as-is
        if (error && typeof error === 'object' && 'statusCode' in error) {
            throw error
        }
        const errorMessage = error instanceof Error ? error.message : String(error)
        Logger.error(`Save failed item=${config.itemLabel} error=${errorMessage}`, 'db')
        throw createError({
            statusCode: 500,
            message: `Failed to save ${config.itemLabel}: ${errorMessage}`
        })
    }
}

// ============================================================================
// ITEM-SPECIFIC SAVE WRAPPERS
// ============================================================================

/**
 * Save weapon to database using Drizzle ORM
 */
export const saveWeapon = async (
    tableName: string,
    steamId: string,
    loadoutId: string,
    body: WeaponCustomization
) => {
    const table = weaponTableMap[tableName as WeaponTableName];
    if (!table) {
        throw createError({ statusCode: 400, message: `Invalid weapon table: ${tableName}` })
    }

    const formattedStickers = formatWeaponStickers(body.stickers as (IEnhancedWeaponSticker | null)[])
    const formattedKeychain = formatWeaponKeychain(body.keychain as { id?: number | string; x?: number; y?: number; z?: number; seed?: number } | null)
    const category = tableName.replace('wp_player_', '') as 'pistols' | 'rifles' | 'smgs' | 'heavys'

    return saveItem({
        itemLabel: 'Weapon',
        table,
        syncMeta: { itemType: 'weapon', itemCategory: category },
        buildSnapshot: (b) => ({
            paintindex: b.paintindex,
            paintseed: b.paintseed,
            paintwear: b.paintwear,
            active: b.active,
            stattrak_enabled: b.stattrak_enabled,
            stattrak_count: b.stattrak_count,
            nametag: b.nametag || undefined,
            stickers: formattedStickers,
            keychain: formattedKeychain
        }),
        buildUpdateFields: (b) => ({
            active: b.active ? 1 : 0,
            paintindex: b.paintindex,
            paintwear: b.paintwear,
            paintseed: b.paintseed,
            stattrak_enabled: b.stattrak_enabled ? 1 : 0,
            stattrak_count: b.stattrak_count,
            nametag: b.nametag || null,
            sticker_0: formattedStickers[0],
            sticker_1: formattedStickers[1],
            sticker_2: formattedStickers[2],
            sticker_3: formattedStickers[3],
            sticker_4: formattedStickers[4],
            keychain: formattedKeychain,
            team: b.team
        }),
        buildInsertFields: (b, sid, lid) => ({
            steamid: sid,
            loadoutid: lid,
            defindex: b.defindex,
            active: 1,
            team: b.team,
            paintindex: b.paintindex,
            paintwear: b.paintwear,
            paintseed: b.paintseed,
            stattrak_enabled: b.stattrak_enabled ? 1 : 0,
            stattrak_count: b.stattrak_count,
            nametag: b.nametag || null,
            sticker_0: formattedStickers[0],
            sticker_1: formattedStickers[1],
            sticker_2: formattedStickers[2],
            sticker_3: formattedStickers[3],
            sticker_4: formattedStickers[4],
            keychain: formattedKeychain
        }),
        recordHistory: (sid, lid, defindex, team, snapshot) =>
            recordWeaponHistory(sid, lid, defindex, team, category, snapshot)
    }, steamId, loadoutId, body)
}

/**
 * Save knife to database using Drizzle ORM
 */
export const saveKnife = async (
    steamId: string,
    loadoutId: string,
    body: KnifeCustomization
) => {
    return saveItem({
        itemLabel: 'Knife',
        table: knives,
        syncMeta: { itemType: 'knife' },
        buildSnapshot: (b) => ({
            paintindex: b.paintindex,
            paintseed: b.paintseed,
            paintwear: b.paintwear,
            active: b.active,
            stattrak_enabled: b.stattrak_enabled,
            stattrak_count: b.stattrak_count,
            nametag: b.nametag || undefined
        }),
        buildUpdateFields: (b) => ({
            active: b.active ? 1 : 0,
            paintindex: b.paintindex,
            paintseed: b.paintseed,
            paintwear: b.paintwear,
            stattrak_enabled: b.stattrak_enabled ? 1 : 0,
            stattrak_count: b.stattrak_count,
            nametag: b.nametag || null
        }),
        buildInsertFields: (b, sid, lid) => ({
            steamid: sid,
            loadoutid: lid,
            active: 1,
            team: b.team,
            defindex: b.defindex,
            paintindex: b.paintindex,
            paintseed: b.paintseed,
            paintwear: b.paintwear,
            stattrak_enabled: b.stattrak_enabled ? 1 : 0,
            stattrak_count: b.stattrak_count,
            nametag: b.nametag || null
        }),
        recordHistory: recordKnifeHistory
    }, steamId, loadoutId, body)
}

/**
 * Save glove to database using Drizzle ORM
 */
export const saveGlove = async (
    steamId: string,
    loadoutId: string,
    body: GloveCustomization
) => {
    return saveItem({
        itemLabel: 'Glove',
        table: gloves,
        syncMeta: { itemType: 'glove' },
        buildSnapshot: (b) => ({
            paintindex: b.paintindex,
            paintseed: b.paintseed,
            paintwear: b.paintwear,
            active: b.active
        }),
        buildUpdateFields: (b) => ({
            active: b.active ? 1 : 0,
            paintindex: b.paintindex,
            paintseed: b.paintseed,
            paintwear: b.paintwear
        }),
        buildInsertFields: (b, sid, lid) => ({
            steamid: sid,
            loadoutid: lid,
            active: 1,
            team: b.team,
            defindex: b.defindex,
            paintindex: b.paintindex,
            paintseed: b.paintseed,
            paintwear: b.paintwear
        }),
        recordHistory: recordGloveHistory
    }, steamId, loadoutId, body)
}

// Re-export handleWeaponReset for backward compatibility
export const handleWeaponReset = async (
    tableName: WeaponTableName,
    steamId: string,
    loadoutId: string,
    body: Record<string, unknown>
) => {
    const table = weaponTableMap[tableName];
    const loadoutIdNum = toLoadoutId(loadoutId)
    await db.delete(table).where(and(
        eq(table.steamid, steamId),
        eq(table.loadoutid, loadoutIdNum),
        eq(table.team, body.team as number),
        eq(table.defindex, body.defindex as number)
    ));

    const category = tableName.replace('wp_player_', '') as SyncItemCategory
    notifyPluginOfWebChange(steamId, loadoutIdNum, 'weapon', category).catch(() => {})

    Logger.debug('Weapon delete ok', 'db')
    return {
        success: true,
        message: 'weapon deleted successfully'
    }
}
