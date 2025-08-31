import { createError } from 'h3'
import { executeQuery } from '~/server/database/database'
import { APIRequestLogger as Logger } from '~/server/utils/logger'
import { validateRequiredRequestData } from '~/server/utils/helpers'
import { VALID_WEAPON_DEFINDEXES, VALID_KNIFE_DEFINDEXES } from '~/server/utils/constants'
import {
    WeaponCustomization,
    KnifeCustomization,
    GloveCustomization,
    DBWeapon,
    DBKnife,
    DBGlove,
    EnhancedWeaponSticker,
    EnhancedWeaponKeychain,
    IEnhancedWeaponSticker,
    IEnhancedWeaponKeychain
} from '~/server/utils/interfaces'

/**
 * Validates common fields for all item types
 */
export const validateCommonFields = (body: any) => {
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
    if (body.paintIndex < 0) {
        Logger.error('Invalid paint index')
        throw createError({
            statusCode: 400,
            message: `Invalid paint index: ${body.paintIndex}`
        })
    }

    // Validate pattern (paintseed)
    validateRequiredRequestData(body.pattern, 'Paint Seed', true)
    if (body.pattern < 0) {
        Logger.error('Invalid paint seed')
        throw createError({
            statusCode: 400,
            message: `Invalid paint seed: ${body.pattern}`
        })
    }

    // Validate paintWear
    validateRequiredRequestData(body.wear, 'Paint Wear', true)
    if (body.wear < 0 || body.wear > 1) {
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
export const validateWeaponFields = (body: any) => {
    // Validate defindex against valid weapon defindexes
    if (!VALID_WEAPON_DEFINDEXES[body.defindex]) {
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
    if (body.statTrakCount < 0) {
        Logger.error('Invalid StatTrak Count')
        throw createError({
            statusCode: 400,
            message: `Invalid StatTrak Count: ${body.statTrakCount}`
        })
    }

    // Validate nameTag
    if (body.nameTag && body.nameTag.length > 32) {
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
export const validateKnifeFields = (body: any) => {
    // Validate defindex against valid knife defindexes
    if (!VALID_KNIFE_DEFINDEXES[body.defindex]) {
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
    if (body.statTrakCount < 0) {
        Logger.error('Invalid StatTrak Count')
        throw createError({
            statusCode: 400,
            message: `Invalid StatTrak Count: ${body.statTrakCount}`
        })
    }

    // Validate nameTag
    if (body.nameTag && body.nameTag.length > 32) {
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
export const validateGloveFields = (body: any) => {
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
export const formatWeaponKeychain = (keychain: any) => {
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
 * Generic function to handle item reset
 */
export const handleItemReset = async (
    table: string,
    steamId: string,
    loadoutId: string,
    body: any,
    itemType: 'weapon' | 'knife' | 'glove'
) => {
    // For weapons and knives, we delete the item
    if (itemType === 'weapon' || itemType === 'knife' || itemType === 'glove') {
        await executeQuery<void>(
            `DELETE FROM ${table} WHERE steamid = ? AND loadoutid = ? AND team = ? AND defindex = ?`,
            [steamId, loadoutId, body.team, body.defindex],
            `Failed to delete ${itemType}`
        );

        Logger.success(`${itemType} deleted successfully`)
        return {
            success: true,
            message: `${itemType} deleted successfully`
        }
    }
}

/**
 * Save weapon to database
 */
export const saveWeapon = async (
    table: string,
    steamId: string,
    loadoutId: string,
    body: WeaponCustomization
) => {
    try {
        // Check for existing weapon
        const existingWeapon = await executeQuery<DBWeapon[]>(
            `SELECT * FROM ${table} WHERE steamid = ? AND loadoutid = ? AND team = ? AND defindex = ?`,
            [steamId, loadoutId, body.team, body.defindex],
            'Failed to check if weapon exists'
        );

        // Handle reset case
        if (body.reset) {
            return handleItemReset(table, steamId, loadoutId, body, 'weapon');
        }

        // Format stickers and keychain
        const formattedStickers = formatWeaponStickers(body.stickers);
        const formattedKeychain = formatWeaponKeychain(body.keychain);

        // Update or insert weapon
        if (existingWeapon.length > 0) {
            console.log("saveWeapon: ", body)
            await executeQuery<void>(
                `UPDATE ${table} SET
                    active = ?,
                    paintindex = ?,
                    paintwear = ?,
                    paintseed = ?,
                    stattrak_enabled = ?,
                    stattrak_count = ?,
                    nametag = ?,
                    sticker_0 = ?,
                    sticker_1 = ?,
                    sticker_2 = ?,
                    sticker_3 = ?,
                    sticker_4 = ?,
                    keychain = ?,
                    team = ?
                WHERE steamid = ? AND loadoutid = ? AND defindex = ? AND team = ?`,
                [
                    body.active,
                    body.paintIndex,
                    body.wear,
                    body.pattern,
                    body.statTrak,
                    body.statTrakCount,
                    body.nameTag,
                    formattedStickers[0],
                    formattedStickers[1],
                    formattedStickers[2],
                    formattedStickers[3],
                    formattedStickers[4],
                    formattedKeychain,
                    body.team,
                    steamId,
                    loadoutId,
                    body.defindex,
                    body.team
                ],
                'Failed to update weapon'
            );
            Logger.success('Weapon updated successfully')
        } else {
            await executeQuery<void>(
                `INSERT INTO ${table} (
                    steamid, loadoutid, defindex, active, team, paintindex, paintwear,
                    paintseed, stattrak_enabled, stattrak_count, nametag,
                    sticker_0, sticker_1, sticker_2, sticker_3, sticker_4,
                    keychain
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    steamId,
                    loadoutId,
                    body.defindex,
                    true, // Always set new weapons to active
                    body.team,
                    body.paintIndex,
                    body.wear,
                    body.pattern,
                    body.statTrak,
                    body.statTrakCount,
                    body.nameTag,
                    formattedStickers[0],
                    formattedStickers[1],
                    formattedStickers[2],
                    formattedStickers[3],
                    formattedStickers[4],
                    formattedKeychain
                ], 'Failed to create weapon')
            Logger.success('Weapon created successfully')
        }

        return {
            success: true,
            message: existingWeapon.length > 0 ? 'Weapon updated successfully' : 'Weapon created successfully'
        }
    } catch (error: any) {
        Logger.error(`Failed to save weapon: ${error.message}`)
        throw createError({
            statusCode: 500,
            message: `Failed to save weapon: ${error.message}`
        })
    }
}

/**
 * Save knife to database
 */
export const saveKnife = async (
    steamId: string,
    loadoutId: string,
    body: KnifeCustomization
) => {
    try {
        const existingKnife = await executeQuery<DBKnife[]>(
            'SELECT * FROM wp_player_knifes WHERE steamid = ? AND loadoutid = ? AND team = ? AND defindex = ?',
            [steamId, loadoutId, body.team, body.defindex],
            'Failed to check if the knife exists'
        );

        // Handle reset case
        if (body.reset) {
            return handleItemReset('wp_player_knifes', steamId, loadoutId, body, 'knife');
        }

        // Update or insert knife
        if (existingKnife.length > 0) {
            console.log('Updating existing knife')
            await executeQuery<void>(
                `UPDATE wp_player_knifes SET
                    active = ?,
                    paintindex = ?,
                    paintseed = ?,
                    paintwear = ?,
                    stattrak_enabled = ?,
                    stattrak_count = ?,
                    nametag = ?
                 WHERE steamid = ? AND loadoutid = ? AND team = ? AND defindex = ?`,
                [
                    body.active,
                    body.paintIndex,
                    body.pattern,
                    body.wear,
                    body.statTrak,
                    body.statTrakCount,
                    body.nameTag,
                    steamId,
                    loadoutId,
                    body.team,
                    body.defindex
                ],
                'Failed to update knife'
            );
            Logger.success('Knife updated successfully')
        } else {
            await executeQuery<void>(
                `INSERT INTO wp_player_knifes (
                    steamid, loadoutid, active, team, defindex, paintindex, paintseed,
                    paintwear, stattrak_enabled, stattrak_count, nametag
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    steamId,
                    loadoutId,
                    true, // Always set new knives to active
                    body.team,
                    body.defindex,
                    body.paintIndex,
                    body.pattern,
                    body.wear,
                    body.statTrak,
                    body.statTrakCount,
                    body.nameTag,
                ],
                'Failed to create knife'
            );
            Logger.success('Knife created successfully')
        }

        return {
            success: true,
            message: existingKnife.length > 0 ? 'Knife updated successfully' : 'Knife created successfully'
        }
    } catch (error: any) {
        Logger.error(`Failed to save knife: ${error.message}`)
        throw createError({
            statusCode: 500,
            message: `Failed to save knife: ${error.message}`
        })
    }
}

/**
 * Save glove to database
 */
export const saveGlove = async (
    steamId: string,
    loadoutId: string,
    body: GloveCustomization
) => {
    try {
        Logger.info(`saveGlove: Starting save process for steamId: ${steamId}, loadoutId: ${loadoutId}`);
        Logger.info(`saveGlove: Body data:`, JSON.stringify(body, null, 2));

        // Handle reset case
        if (body.reset) {
            Logger.info('saveGlove: Processing reset request');
            return handleItemReset('wp_player_gloves', steamId, loadoutId, body, 'glove');
        }

        // Check for existing glove
        Logger.info(`saveGlove: Checking for existing glove with defindex: ${body.defindex}, team: ${body.team}`);
        const existingGlove = await executeQuery<DBGlove[]>(
            'SELECT * FROM wp_player_gloves WHERE steamid = ? AND loadoutid = ? AND team = ? AND defindex = ?',
            [steamId, loadoutId, body.team, body.defindex],
            'Failed to check if glove exists'
        );

        Logger.info(`saveGlove: Found ${existingGlove.length} existing glove entries:`, existingGlove);

        // Update or insert glove
        if (existingGlove.length > 0) {
            Logger.info(`saveGlove: Updating existing glove with paintindex: ${body.paintIndex}, pattern: ${body.pattern}, wear: ${body.wear}`);
            await executeQuery<void>(
                `UPDATE wp_player_gloves SET
                    active = ?,
                    paintindex = ?,
                    paintseed = ?,
                    paintwear = ?
                 WHERE steamid = ? AND loadoutid = ? AND team = ? AND defindex = ?`,
                [
                    body.active,
                    body.paintIndex,
                    body.pattern,
                    body.wear,
                    steamId,
                    loadoutId,
                    body.team,
                    body.defindex
                ],
                'Failed to update glove'
            );
            Logger.success('Glove updated successfully')
        } else {
            Logger.info(`saveGlove: Inserting new glove with paintindex: ${body.paintIndex}, pattern: ${body.pattern}, wear: ${body.wear}`);
            await executeQuery<void>(
                `INSERT INTO wp_player_gloves (
                    steamid, loadoutid, active, team, defindex, paintindex, paintseed,
                    paintwear
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    steamId,
                    loadoutId,
                    true, // Always set new gloves to active
                    body.team,
                    body.defindex,
                    body.paintIndex,
                    body.pattern,
                    body.wear
                ],
                'Failed to create glove'
            );
            Logger.success('Glove created successfully')
        }

        return {
            success: true,
            message: existingGlove.length > 0 ? 'Glove updated successfully' : 'Glove created successfully'
        }
    } catch (error: any) {
        Logger.error(`Failed to save glove: ${error.message}`)
        throw createError({
            statusCode: 500,
            message: `Failed to save glove: ${error.message}`
        })
    }
}
