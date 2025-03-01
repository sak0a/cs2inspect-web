import { defineEventHandler, createError } from 'h3'
import { executeQuery } from '~/server/database/database'
import {
    validateWeaponDatabaseTable,
    verifyUserAccess
} from '~/server/utils/helpers'
import { DBWeapon, EnhancedWeaponKeychain, EnhancedWeaponSticker } from '~/server/utils/interfaces'

export default defineEventHandler(async (event) => {
    const query = getQuery(event)

    Logger.header(`Save weapon request: ${event.method} ${event.req.url}`)

    const steamId = query.steamId as string
    validateRequiredRequestData(steamId, 'Steam ID')
    verifyUserAccess(steamId, event)

    const type = query.type as string
    validateRequiredRequestData(type, 'Type')

    const loadoutId = query.loadoutId as string
    validateRequiredRequestData(loadoutId, 'Loadout ID')

    const table = validateWeaponDatabaseTable(type)

    const body = await readBody(event)
    validateRequiredRequestData(body, 'Body')

    try {

        if (!body.paintIndex || body.paintIndex <= 0) {
            Logger.error('Paint index is invalid')
            throw createError({
                statusCode: 400,
                message: 'Paint index is invalid'
            })
        }

        if (body.reset && body.reset === true) {
            await executeQuery<void>(
                `DELETE
                 FROM ${table}
                 WHERE steamid = ?
                   AND loadoutid = ?
                   AND defindex = ?
                   AND team = ?`,
                [steamId, loadoutId, body.defindex, body.team],
                'Failed to delete weapon'
            )
            Logger.success('Weapon deleted successfully')
            return {
                success: true,
                message: 'Weapon deleted successfully'
            }
        }

        // Format stickers array into the required string format
        const stickers: IEnhancedWeaponSticker[] = body.stickers;
        const formattedStickers: string[] = stickers.map(
            sticker => sticker ?
                new EnhancedWeaponSticker(sticker).convertToDatabaseString() : '0;0;0;0;0;0'
        );

        // Pad array to always have 5 sticker slots
        while (formattedStickers.length < 5) {
            formattedStickers.push('0;0;0;0;0;0');
        }

        // Format keychain into required string format
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
        const formattedKeychain = new EnhancedWeaponKeychain((!body.keychain || body.keychain.id === 0) ? defaultKeychain : body.keychain).convertToDatabaseString();

        const existingWeapons = await executeQuery<DBWeapon[]>(
            `SELECT * FROM ${table} WHERE steamid = ? AND loadoutid = ? AND defindex = ? AND team = ?`,
            [steamId, loadoutId, body.defindex, body.team],
            'Failed to check if weapon exists'
        );

        if (existingWeapons.length > 0) {
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
                    body.paintWear,
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
                    body.active,
                    body.team,
                    body.paintIndex,
                    body.paintWear,
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
            message: existingWeapons.length > 0 ? 'Weapon updated successfully' : 'Weapon created successfully'
        }
    } catch (error: any) {
        Logger.error(`Failed to save weapon: ${error.message}`)
        throw createError({
            statusCode: 500,
            message: `Failed to save weapon: ${error.message}`
        })
    }
})