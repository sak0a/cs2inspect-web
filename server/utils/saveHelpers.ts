import { createError } from 'h3'
import { eq, and } from 'drizzle-orm'
import { db } from '~/server/database/client'
import { knives, gloves, pistols, rifles, smgs, heavys } from '~/server/database/schema'
import { APIRequestLogger as Logger } from '~/server/utils/logger'
import { validateRequiredRequestData } from '~/server/utils/helpers'
import { VALID_WEAPON_DEFINDEXES, VALID_KNIFE_DEFINDEXES } from '~/server/utils/constants'
import type {
    WeaponCustomization,
    KnifeCustomization,
    GloveCustomization,
    IEnhancedWeaponSticker
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

/**
 * Validates common fields for all item types
 */
export const validateCommonFields = (body: Record<string, unknown>) => {
    // Validate defindex
    validateRequiredRequestData(body.defindex, 'Defindex')

    // Validate team
    validateRequiredRequestData(body.team, 'Team')
    if (body.team !== 1 && body.team !== 2) {
        Logger.error('Invalid team')
        throw createError({
            statusCode: 400,
            message: `Invalid team: ${body.team}`
        })
    }

    // Validate paintIndex
    validateRequiredRequestData(body.paintIndex, 'Paint Index')
    if ((body.paintIndex as number) < 0) {
        Logger.error('Invalid paint index')
        throw createError({
            statusCode: 400,
            message: `Invalid paint index: ${body.paintIndex}`
        })
    }

    // Validate pattern (paintseed)
    validateRequiredRequestData(body.pattern, 'Paint Seed', true)
    if ((body.pattern as number) < 0) {
        Logger.error('Invalid paint seed')
        throw createError({
            statusCode: 400,
            message: `Invalid paint seed: ${body.pattern}`
        })
    }

    // Validate paintWear
    validateRequiredRequestData(body.wear, 'Paint Wear', true)
    if ((body.wear as number) < 0 || (body.wear as number) > 1) {
        Logger.error('Invalid paint wear')
        throw createError({
            statusCode: 400,
            message: `Invalid paint wear: ${body.wear}`
        })
    }

    // Validate active
    if (body.active !== true && body.active !== false) {
        Logger.error('Invalid Active')
        throw createError({
            statusCode: 400,
            message: 'Invalid Active'
        })
    }
}

/**
 * Validates weapon-specific fields
 */
export const validateWeaponFields = (body: Record<string, unknown>) => {
    // Validate defindex against valid weapon defindexes
    if (!VALID_WEAPON_DEFINDEXES[body.defindex as number]) {
        Logger.error('Invalid Weapon Defindex')
        throw createError({
            statusCode: 400,
            message: `Invalid Weapon Defindex: ${body.defindex}`
        })
    }

    // Validate statTrak
    if (body.statTrak !== true && body.statTrak !== false) {
        Logger.error('Invalid StatTrak')
        throw createError({
            statusCode: 400,
            message: 'Invalid StatTrak'
        })
    }

    // Validate statTrakCount
    validateRequiredRequestData(body.statTrakCount, 'StatTrak Count', true)
    if ((body.statTrakCount as number) < 0) {
        Logger.error('Invalid StatTrak Count')
        throw createError({
            statusCode: 400,
            message: `Invalid StatTrak Count: ${body.statTrakCount}`
        })
    }

    // Validate nameTag
    if (body.nameTag && (body.nameTag as string).length > 32) {
        Logger.error('Invalid Name Tag')
        throw createError({
            statusCode: 400,
            message: 'Invalid Name Tag'
        })
    }
}

/**
 * Validates knife-specific fields
 */
export const validateKnifeFields = (body: Record<string, unknown>) => {
    // Validate defindex against valid knife defindexes
    if (!VALID_KNIFE_DEFINDEXES[body.defindex as number]) {
        Logger.error('Invalid Knife Defindex')
        throw createError({
            statusCode: 400,
            message: `Invalid Knife Defindex: ${body.defindex}`
        })
    }

    // Validate statTrak
    if (body.statTrak !== true && body.statTrak !== false) {
        Logger.error('Invalid StatTrak')
        throw createError({
            statusCode: 400,
            message: 'Invalid StatTrak'
        })
    }

    // Validate statTrakCount
    validateRequiredRequestData(body.statTrakCount, 'StatTrak Count', true)
    if ((body.statTrakCount as number) < 0) {
        Logger.error('Invalid StatTrak Count')
        throw createError({
            statusCode: 400,
            message: `Invalid StatTrak Count: ${body.statTrakCount}`
        })
    }

    // Validate nameTag
    if (body.nameTag && (body.nameTag as string).length > 32) {
        Logger.error('Invalid Name Tag')
        throw createError({
            statusCode: 400,
            message: 'Invalid Name Tag'
        })
    }
}

/**
 * Validates glove-specific fields
 */
export const validateGloveFields = (_body: Record<string, unknown>) => {
    // Gloves don't have additional specific validations beyond the common ones
}

/**
 * Formats weapon stickers for database storage
 */
export const formatWeaponStickers = (stickers: IEnhancedWeaponSticker[]) => {
    const formattedStickers: string[] = stickers.map(
        sticker => sticker ?
            new EnhancedWeaponSticker(sticker).convertToDatabaseString() : '0;0;0;0;0;0'
    );

    // Pad array to always have 5 sticker slots
    while (formattedStickers.length < 5) {
        formattedStickers.push('0;0;0;0;0;0');
    }

    return formattedStickers;
}

/**
 * Formats weapon keychain for database storage
 */
export const formatWeaponKeychain = (keychain: { id?: number; x?: number; y?: number; z?: number; seed?: number; wrapped_sticker_id?: number; highlight_reel_id?: number } | null) => {
    const defaultKeychain = {
        id: 0,
        x: 0,
        y: 0,
        z: 0,
        seed: 0,
        api: {
            id: 'default',
            name: 'Default',
            color: '#000000'
        }
    };

    return new EnhancedWeaponKeychain((!keychain || keychain.id === 0) ? defaultKeychain : keychain).convertToDatabaseString();
}

/**
 * Generic function to handle weapon item reset using Drizzle
 */
export const handleWeaponReset = async (
    tableName: WeaponTableName,
    steamId: string,
    loadoutId: string,
    body: Record<string, unknown>
) => {
    const table = weaponTableMap[tableName];
    await db.delete(table).where(and(
        eq(table.steamid, steamId),
        eq(table.loadoutid, Number(loadoutId)),
        eq(table.team, body.team as number),
        eq(table.defindex, body.defindex as number)
    ));

    Logger.success('weapon deleted successfully')
    return {
        success: true,
        message: 'weapon deleted successfully'
    }
}

/**
 * Save weapon to database using Drizzle ORM
 */
export const saveWeapon = async (
    tableName: string,
    steamId: string,
    loadoutId: string,
    body: WeaponCustomization
) => {
    try {
        const table = weaponTableMap[tableName as WeaponTableName];
        if (!table) {
            throw new Error(`Invalid weapon table: ${tableName}`);
        }

        const loadoutIdNum = Number(loadoutId);

        // Check for existing weapon
        const existingWeapon = await db.select()
            .from(table)
            .where(and(
                eq(table.steamid, steamId),
                eq(table.loadoutid, loadoutIdNum),
                eq(table.team, body.team),
                eq(table.defindex, body.defindex)
            ))
            .limit(1);

        // Handle reset case
        if (body.reset) {
            return handleWeaponReset(tableName as WeaponTableName, steamId, loadoutId, body);
        }

        // Format stickers and keychain
        const formattedStickers = formatWeaponStickers(body.stickers);
        const formattedKeychain = formatWeaponKeychain(body.keychain);

        // Update or insert weapon
        if (existingWeapon.length > 0) {
            console.log("saveWeapon: ", body)
            await db.update(table)
                .set({
                    active: body.active ? 1 : 0,
                    paintindex: body.paintIndex,
                    paintwear: body.wear,
                    paintseed: body.pattern,
                    stattrak_enabled: body.statTrak ? 1 : 0,
                    stattrak_count: body.statTrakCount,
                    nametag: body.nameTag || null,
                    sticker_0: formattedStickers[0],
                    sticker_1: formattedStickers[1],
                    sticker_2: formattedStickers[2],
                    sticker_3: formattedStickers[3],
                    sticker_4: formattedStickers[4],
                    keychain: formattedKeychain,
                    team: body.team
                })
                .where(and(
                    eq(table.steamid, steamId),
                    eq(table.loadoutid, loadoutIdNum),
                    eq(table.defindex, body.defindex),
                    eq(table.team, body.team)
                ));
            Logger.success('Weapon updated successfully')
        } else {
            await db.insert(table).values({
                steamid: steamId,
                loadoutid: loadoutIdNum,
                defindex: body.defindex,
                active: 1, // Always set new weapons to active
                team: body.team,
                paintindex: body.paintIndex,
                paintwear: body.wear,
                paintseed: body.pattern,
                stattrak_enabled: body.statTrak ? 1 : 0,
                stattrak_count: body.statTrakCount,
                nametag: body.nameTag || null,
                sticker_0: formattedStickers[0],
                sticker_1: formattedStickers[1],
                sticker_2: formattedStickers[2],
                sticker_3: formattedStickers[3],
                sticker_4: formattedStickers[4],
                keychain: formattedKeychain
            });
            Logger.success('Weapon created successfully')
        }

        return {
            success: true,
            message: existingWeapon.length > 0 ? 'Weapon updated successfully' : 'Weapon created successfully'
        }
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        Logger.error(`Failed to save weapon: ${errorMessage}`)
        throw createError({
            statusCode: 500,
            message: `Failed to save weapon: ${errorMessage}`
        })
    }
}

/**
 * Save knife to database using Drizzle ORM
 */
export const saveKnife = async (
    steamId: string,
    loadoutId: string,
    body: KnifeCustomization
) => {
    try {
        const loadoutIdNum = Number(loadoutId);

        // Check for existing knife
        const existingKnife = await db.select()
            .from(knives)
            .where(and(
                eq(knives.steamid, steamId),
                eq(knives.loadoutid, loadoutIdNum),
                eq(knives.team, body.team),
                eq(knives.defindex, body.defindex)
            ))
            .limit(1);

        // Handle reset case
        if (body.reset) {
            await db.delete(knives).where(and(
                eq(knives.steamid, steamId),
                eq(knives.loadoutid, loadoutIdNum),
                eq(knives.team, body.team),
                eq(knives.defindex, body.defindex)
            ));

            Logger.success('knife deleted successfully')
            return {
                success: true,
                message: 'knife deleted successfully'
            }
        }

        // Update or insert knife
        if (existingKnife.length > 0) {
            console.log('Updating existing knife')
            await db.update(knives)
                .set({
                    active: body.active ? 1 : 0,
                    paintindex: body.paintIndex,
                    paintseed: body.pattern,
                    paintwear: body.wear,
                    stattrak_enabled: body.statTrak ? 1 : 0,
                    stattrak_count: body.statTrakCount,
                    nametag: body.nameTag || null
                })
                .where(and(
                    eq(knives.steamid, steamId),
                    eq(knives.loadoutid, loadoutIdNum),
                    eq(knives.team, body.team),
                    eq(knives.defindex, body.defindex)
                ));
            Logger.success('Knife updated successfully')
        } else {
            await db.insert(knives).values({
                steamid: steamId,
                loadoutid: loadoutIdNum,
                active: 1, // Always set new knives to active
                team: body.team,
                defindex: body.defindex,
                paintindex: body.paintIndex,
                paintseed: body.pattern,
                paintwear: body.wear,
                stattrak_enabled: body.statTrak ? 1 : 0,
                stattrak_count: body.statTrakCount,
                nametag: body.nameTag || null
            });
            Logger.success('Knife created successfully')
        }

        return {
            success: true,
            message: existingKnife.length > 0 ? 'Knife updated successfully' : 'Knife created successfully'
        }
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        Logger.error(`Failed to save knife: ${errorMessage}`)
        throw createError({
            statusCode: 500,
            message: `Failed to save knife: ${errorMessage}`
        })
    }
}

/**
 * Save glove to database using Drizzle ORM
 */
export const saveGlove = async (
    steamId: string,
    loadoutId: string,
    body: GloveCustomization
) => {
    try {
        const loadoutIdNum = Number(loadoutId);

        Logger.info(`saveGlove: Starting save process for steamId: ${steamId}, loadoutId: ${loadoutId}`);
        Logger.info(`saveGlove: Body data:`, JSON.stringify(body, null, 2));

        // Handle reset case
        if (body.reset) {
            Logger.info('saveGlove: Processing reset request');
            await db.delete(gloves).where(and(
                eq(gloves.steamid, steamId),
                eq(gloves.loadoutid, loadoutIdNum),
                eq(gloves.team, body.team),
                eq(gloves.defindex, body.defindex)
            ));

            Logger.success('glove deleted successfully')
            return {
                success: true,
                message: 'glove deleted successfully'
            }
        }

        // Check for existing glove
        Logger.info(`saveGlove: Checking for existing glove with defindex: ${body.defindex}, team: ${body.team}`);
        const existingGlove = await db.select()
            .from(gloves)
            .where(and(
                eq(gloves.steamid, steamId),
                eq(gloves.loadoutid, loadoutIdNum),
                eq(gloves.team, body.team),
                eq(gloves.defindex, body.defindex)
            ))
            .limit(1);

        Logger.info(`saveGlove: Found ${existingGlove.length} existing glove entries:`, existingGlove);

        // Update or insert glove
        if (existingGlove.length > 0) {
            Logger.info(`saveGlove: Updating existing glove with paintindex: ${body.paintIndex}, pattern: ${body.pattern}, wear: ${body.wear}`);
            await db.update(gloves)
                .set({
                    active: body.active ? 1 : 0,
                    paintindex: body.paintIndex,
                    paintseed: body.pattern,
                    paintwear: body.wear
                })
                .where(and(
                    eq(gloves.steamid, steamId),
                    eq(gloves.loadoutid, loadoutIdNum),
                    eq(gloves.team, body.team),
                    eq(gloves.defindex, body.defindex)
                ));
            Logger.success('Glove updated successfully')
        } else {
            Logger.info(`saveGlove: Inserting new glove with paintindex: ${body.paintIndex}, pattern: ${body.pattern}, wear: ${body.wear}`);
            await db.insert(gloves).values({
                steamid: steamId,
                loadoutid: loadoutIdNum,
                active: 1, // Always set new gloves to active
                team: body.team,
                defindex: body.defindex,
                paintindex: body.paintIndex,
                paintseed: body.pattern,
                paintwear: body.wear
            });
            Logger.success('Glove created successfully')
        }

        return {
            success: true,
            message: existingGlove.length > 0 ? 'Glove updated successfully' : 'Glove created successfully'
        }
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        Logger.error(`Failed to save glove: ${errorMessage}`)
        throw createError({
            statusCode: 500,
            message: `Failed to save glove: ${errorMessage}`
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
