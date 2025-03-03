import { defineEventHandler, createError } from 'h3'
import { executeQuery } from '~/server/database/database'
import { APIRequestLogger as Logger } from '~/server/utils/logger'
import {KnifeCustomization} from "~/server/utils/interfaces";

export default defineEventHandler(async (event) => {
    const query = getQuery(event)

    Logger.header(`Save knife request: ${event.method} ${event.req.url}`)

    const steamId = query.steamId as string
    validateRequiredRequestData(steamId, 'Steam ID')

    const loadoutId = query.loadoutId as string
    validateRequiredRequestData(loadoutId, 'Loadout ID')

    const body = await readBody(event) as KnifeCustomization
    validateRequiredRequestData(body, 'Body')

    try {
        validateRequiredRequestData(body.defindex, 'Defindex')

        if (body.paintIndex <= 0) {
            Logger.error('Invalid paint index ')
            throw createError({
                statusCode: 400,
                message: 'Invalid paint index'
            })
        }

        if (body.reset && body.reset === true) {
            await executeQuery<void>(
                `DELETE
                 FROM wp_player_knifes
                 WHERE steamid = ?
                   AND loadoutid = ?
                   AND defindex = ?
                   AND team = ?`,
                [steamId, loadoutId, body.defindex, body.team],
                'Failed to delete weapon'
            )

            Logger.success(`Knife deleted successfully`)
            return {
                success: true,
                message: 'Weapon deleted successfully'
            }
        }

        // Handle both Terrorist and Counter-Terrorist knives
        const existingKnife = await executeQuery<DBKnife[]>(
            'SELECT * FROM wp_player_knifes WHERE steamid = ? AND loadoutid = ? AND team = ? AND defindex = ?',
            [steamId, loadoutId, body.team, body.defindex],
            'Failed to check if knife exists'
        );

        if (existingKnife.length > 0) {
            Logger.info('There is an existing knife')
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
            Logger.info('Creating a new knife')
            await executeQuery<void>(
                `INSERT INTO wp_player_knifes (
                    steamid, loadoutid, active, team, defindex, paintindex, paintseed,
                    paintwear, stattrak_enabled, stattrak_count, nametag
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    steamId,
                    loadoutId,
                    body.active,
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
            message: 'Knifes updated successfully'
        };
    } catch (error: any) {
        Logger.error(`Failed to save knifes: ${error.message}`)
        throw createError({
            statusCode: 500,
            message: 'Failed to save knifes'
        })
    }
});