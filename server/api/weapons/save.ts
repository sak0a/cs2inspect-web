import { defineEventHandler, createError } from 'h3'
import { pool } from '~/server/database/database'
import { validateSteamId, verifyUserAccess } from '~/server/utils/helpers'

const tableMap: Record<string, string> = {
    smgs: 'wp_player_smgs',
    rifles: 'wp_player_rifles',
    heavys: 'wp_player_heavys',
    pistols: 'wp_player_pistols',
}

// Helper function to format sticker data
const formatStickerString = (sticker: any): string => {
    if (!sticker || !sticker.id) return '0;0;0;0;0;0'
    return `${sticker.id};${sticker.x};${sticker.y};${sticker.wear};${sticker.scale};${sticker.rotation}`
}

// Helper function to format keychain data
const formatKeychainString = (keychain: any): string => {
    if (!keychain || !keychain.id) return '0;0;0;0;0'
    return `${keychain.id};${keychain.x};${keychain.y};${keychain.z};${keychain.seed}`
}

export default defineEventHandler(async (event) => {
    const query = getQuery(event)
    const steamId = query.steamId as string
    const type = query.type as string
    const loadoutId = query.loadoutId as string

    validateSteamId(steamId)
    verifyUserAccess(event, steamId)

    const table = tableMap[type]
    if (!table) {
        throw createError({
            statusCode: 400,
            message: 'Invalid weapon type'
        })
    }

    let conn
    try {
        conn = await pool.getConnection()
        const body = await readBody(event)

        // Format stickers array into the required string format
        const formattedStickers = (body.stickers || []).map(formatStickerString)
        // Pad array to always have 5 sticker slots
        while (formattedStickers.length < 5) {
            formattedStickers.push('0;0;0;0;0;0')
        }

        // Format keychain into required string format
        const formattedKeychain = formatKeychainString(body.keychain)

        // Check if weapon already exists
        const existingWeapons = await conn.query(
            `SELECT * FROM ${table} WHERE steamid = ? AND loadoutid = ? AND defindex = ? AND team = ?`,
            [steamId, loadoutId, body.defindex, body.team]
        )

        if (existingWeapons.length > 0) {
            // Update existing weapon
            await conn.query(
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
                ]
            )
        } else {
            // Create new weapon
            await conn.query(
                `INSERT INTO ${table} (
                    steamid, loadoutid, defindex, active, paintindex, paintwear,
                    paintseed, stattrak_enabled, stattrak_count, nametag,
                    sticker_0, sticker_1, sticker_2, sticker_3, sticker_4,
                    keychain, team
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    steamId,
                    loadoutId,
                    body.defindex,
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
                    body.team
                ]
            )
        }

        return {
            success: true,
            message: existingWeapons.length > 0 ? 'Weapon updated successfully' : 'Weapon created successfully'
        }
    } catch (error) {
        console.error('Error saving weapon:', error)
        throw createError({
            statusCode: 500,
            message: 'Failed to save weapon'
        })
    } finally {
        if (conn) conn.release()
    }
})